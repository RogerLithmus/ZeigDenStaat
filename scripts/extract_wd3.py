"""
Extract entities from WD 3 - 118/24 PDF:
"Behörden, Stiftungen und Unternehmen des Bundes — Übersicht nach Geschäftsbereichen"

Parses the PDF text to identify entities organized by Geschäftsbereich (ministry).
Outputs a structured CSV with Name, Typ, Geschaeftsbereich, Untertyp columns.
"""

import csv
import logging
import os
import re
import sys

import pdfplumber

# ── Config ──────────────────────────────────────────────────────────────────
PDF_PATH = r"c:\Projects\ZeigDenStaat\ressourcen\WD-3-118-24-pdf.pdf"
OUTPUT_DIR = r"c:\Projects\ZeigDenStaat\data\raw"
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "wd3_entities.csv")

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
log = logging.getLogger(__name__)


# ── Step 1: Extract all text ────────────────────────────────────────────────
def extract_full_text(pdf_path: str) -> str:
    """Extract all text from the PDF, concatenated."""
    pages_text = []
    with pdfplumber.open(pdf_path) as pdf:
        log.info(f"PDF has {len(pdf.pages)} pages")
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                pages_text.append(text)
    full = "\n".join(pages_text)
    log.info(f"Extracted {len(full)} characters of text")
    return full


# ── Step 2: Parse sections ──────────────────────────────────────────────────

# Ministry-level headings: "3.X. Name (Abbrev)" or "3.X. Name"
RE_MINISTRY = re.compile(
    r"^3\.(\d+)\.\s+(.+?)$", re.MULTILINE
)

# Sub-section headings: "3.X.Y. Behörden / Stiftungen des Privatrechts / Unternehmen"
RE_SUBSECTION = re.compile(
    r"^3\.(\d+)\.(\d+)\.\s+(.+?)$", re.MULTILINE
)

# Bullet-point entity lines: "- entity name"
# Also handles continuation lines that wrap
RE_BULLET = re.compile(r"^-\s+(.+)", re.MULTILINE)

# Section 4 or later = stop parsing section 3
RE_SECTION4 = re.compile(r"^4\.\s+", re.MULTILINE)

# Footnote pattern – strip footnote references
RE_FOOTNOTE_REF = re.compile(r"\d+$")
RE_FOOTNOTE_LINE = re.compile(r"^\d+\s+Bundesministerium", re.MULTILINE)

# Page header pattern to strip
RE_PAGE_HEADER = re.compile(
    r"^Wissenschaftliche Dienste Sachstand Seite \d+\s*\n"
    r"WD 3 - 3000 - 118/24\s*$",
    re.MULTILINE,
)


def clean_text(text: str) -> str:
    """Remove page headers and footnote lines."""
    text = RE_PAGE_HEADER.sub("", text)
    # Remove footnote lines (lines starting with number + reference text)
    lines = text.split("\n")
    cleaned = []
    for line in lines:
        # Skip footnote lines (start with a number followed by typical footnote text)
        if re.match(r"^\d+\s+(Bundesministerium|Vgl\.|Gesetz |Ibler|Weber,|Gemeinsame|Satzung|Deutsche Bundesstiftung|Zu den)", line.strip()):
            continue
        cleaned.append(line)
    return "\n".join(cleaned)


def classify_untertyp(entity_name: str, section_context: str) -> str:
    """Try to classify the entity subtype based on name patterns."""
    name_lower = entity_name.lower()

    # Stiftung (öffentlich-rechtlich) — when in Behörden section
    if "stiftung" in name_lower and "privatrecht" not in section_context.lower():
        return "Stiftung des öffentlichen Rechts"

    # Bundesanstalt
    if "bundesanstalt" in name_lower or "anstalt" in name_lower:
        return "Bundesanstalt"

    # Körperschaft patterns
    koerperschaft_indicators = [
        "kammer", "rentenversicherung", "unfallversicherung",
        "bundesagentur", "versorgungsanstalt", "vereinigung",
        "sozialkasse", "zusatzversorgungskasse",
        "berufsgenossenschaft",
    ]
    for ind in koerperschaft_indicators:
        if ind in name_lower:
            return "Körperschaft/Anstalt des öffentlichen Rechts"

    # Bundesamt / Bundesoberbehörde
    if "bundesamt" in name_lower or "bundeszentrale" in name_lower:
        return "Bundesoberbehörde"

    # Bundeskriminalamt, Bundeskartellamt, etc.
    if name_lower.startswith("bundeskriminal") or name_lower.startswith("bundeskartell"):
        return "Bundesoberbehörde"

    # Bundespolizei
    if "bundespolizei" in name_lower:
        return "Bundesoberbehörde"

    # Institut
    if "institut" in name_lower:
        return "Bundesoberbehörde"

    # Universität / Hochschule / Akademie
    if any(x in name_lower for x in ["universität", "hochschule", "akademie"]):
        return "Bundesoberbehörde"

    # Bundesnachrichtendienst
    if "bundesnachrichtendienst" in name_lower:
        return "Bundesoberbehörde"

    # GmbH → Unternehmen
    if "gmbh" in name_lower or "mbh" in name_lower or " ag" in name_lower.split():
        return "Unternehmen"

    return "Behörde"


def parse_ministry_name(raw: str) -> str:
    """Clean up ministry name, remove trailing page numbers etc."""
    # Remove trailing numbers (page references from TOC)
    name = re.sub(r"\s+\d+\s*$", "", raw.strip())
    return name.strip()


def extract_entities_from_section(text_block: str) -> list[str]:
    """
    Extract entity names from a section text block.
    Handles bullet-point lists (- entity) and inline single entities.
    """
    entities = []

    # Find all bullet points
    bullets = RE_BULLET.findall(text_block)

    if bullets:
        # Process bullet-point list
        for bullet in bullets:
            name = bullet.strip()
            # Remove trailing footnote superscripts (e.g., "...Haus.10")
            name = re.sub(r"\.\d+$", "", name)
            # Remove trailing period
            name = name.rstrip(".,;")
            # Handle "und " or "sowie " prefix at the start
            name = re.sub(r"^und\s+", "", name)
            name = re.sub(r"^sowie\s+", "", name)
            # Clean up leading/trailing whitespace
            name = name.strip()
            if name:
                entities.append(name)
    else:
        # Try to find inline single entity mentions
        # e.g. "der Bund unmittelbar und allein beteiligt an der SPRIND GmbH."
        # or "Dem Bundeskanzleramt ist der Bundesnachrichtendienst als Oberbehörde nachgeordnet."
        inline_patterns = [
            r"beteiligt an (?:der |dem |den )(.+?)(?:\.\d*$|\.$)",
            r"ist (?:der |dem |die )(.+?)(?:\.\d*$|\.$)",
            r"nachgeordnet.*?(?:der |dem |die )(.+?)(?:\.\d*$|\.$| als )",
        ]
        for pattern in inline_patterns:
            m = re.search(pattern, text_block, re.DOTALL)
            if m:
                name = m.group(1).strip().rstrip(".,;")
                name = re.sub(r"\.\d+$", "", name)
                if name and len(name) > 3:
                    entities.append(name)
                break

    return entities


def parse_document(text: str) -> list[dict]:
    """Parse the full document text into structured entity records."""
    text = clean_text(text)

    # Find the end of section 3 (start of section 4)
    m4 = RE_SECTION4.search(text)
    section3_end = m4.start() if m4 else len(text)

    # Find the start of section 3 content (after "3. Geschäftsbereiche")
    m3_start = re.search(r"^3\.\s+Geschäftsbereiche", text, re.MULTILINE)
    if not m3_start:
        # fallback: look for "3.1."
        m3_start = re.search(r"^3\.1\.\s+", text, re.MULTILINE)
    section3_start = m3_start.start() if m3_start else 0

    section3_text = text[section3_start:section3_end]

    # Also extract section 2 (Oberste Bundesbehörden)
    m2_start = re.search(r"^2\.\s+Oberste Bundesbehörden", text, re.MULTILINE)
    section2_entities = []
    if m2_start:
        section2_end = section3_start if section3_start > m2_start.start() else len(text)
        section2_text = text[m2_start.start():section2_end]
        section2_entities = extract_entities_from_section(section2_text)

    records = []

    # Add Oberste Bundesbehörden
    for ent in section2_entities:
        records.append({
            "Name": ent,
            "Typ": "Behörde",
            "Geschaeftsbereich": "Oberste Bundesbehörden",
            "Untertyp": "Oberste Bundesbehörde",
        })

    # ── Parse section 3: Ministry subsections ──
    # Find all ministry headings
    ministry_matches = list(RE_MINISTRY.finditer(section3_text))

    for i, m_match in enumerate(ministry_matches):
        ministry_num = m_match.group(1)
        ministry_raw = m_match.group(2)
        ministry_name = parse_ministry_name(ministry_raw)
        ministry_start = m_match.end()

        # Determine end of this ministry section
        if i + 1 < len(ministry_matches):
            ministry_end = ministry_matches[i + 1].start()
        else:
            ministry_end = len(section3_text)

        ministry_text = section3_text[ministry_start:ministry_end]

        # Find subsections within this ministry
        sub_matches = list(RE_SUBSECTION.finditer(ministry_text))

        for j, s_match in enumerate(sub_matches):
            sub_ministry_num = s_match.group(1)
            sub_num = s_match.group(2)
            sub_title = s_match.group(3).strip()
            sub_start = s_match.end()

            # Only process subsections belonging to this ministry
            if sub_ministry_num != ministry_num:
                continue

            # Determine end of this subsection
            if j + 1 < len(sub_matches):
                sub_end = sub_matches[j + 1].start()
            else:
                sub_end = len(ministry_text)

            sub_text = ministry_text[sub_start:sub_end]

            # Determine Typ based on subsection title
            sub_title_lower = sub_title.lower()
            if "behörde" in sub_title_lower:
                section_typ = "Behörde"
            elif "stiftung" in sub_title_lower:
                section_typ = "Stiftung des Privatrechts"
            elif "unternehmen" in sub_title_lower:
                section_typ = "Unternehmen"
            else:
                section_typ = "Sonstige"

            # Check for "keine" / "nicht" / "kein" → no entities
            keine_patterns = [
                r"keine\s+(nachgeordneten\s+)?Behörden",
                r"keine\s+privatrechtlichen?\s+Stiftungen",
                r"keine\s+Stiftung",
                r"keinem?\s+Unternehmen",
                r"nicht\s+allein\s+und\s+unmittelbar",
                r"hat keine nachge",
                r"gibt es keine",
                r"nicht an einem Unternehmen",
            ]
            has_keine = any(re.search(p, sub_text, re.IGNORECASE) for p in keine_patterns)

            entities = extract_entities_from_section(sub_text)

            if has_keine and not entities:
                continue

            for ent_name in entities:
                # Refine Typ based on entity name when in Behörden section
                if section_typ == "Behörde":
                    untertyp = classify_untertyp(ent_name, sub_title)
                elif section_typ == "Stiftung des Privatrechts":
                    untertyp = "Stiftung des Privatrechts"
                elif section_typ == "Unternehmen":
                    untertyp = "Unternehmen (Bundesbeteiligung)"
                else:
                    untertyp = section_typ

                records.append({
                    "Name": ent_name,
                    "Typ": section_typ,
                    "Geschaeftsbereich": ministry_name,
                    "Untertyp": untertyp,
                })

    # Handle special case: "3.1. Bundeskanzleramt" which has no numbered subsections
    # but mentions "Bundesnachrichtendienst als Oberbehörde nachgeordnet"
    bka_match = re.search(
        r"3\.1\.\s+Bundeskanzleramt\s*\n(.*?)(?=3\.2\.)",
        section3_text,
        re.DOTALL,
    )
    if bka_match:
        bka_text = bka_match.group(1)
        if "Bundesnachrichtendienst" in bka_text:
            # Check we don't already have it
            existing_names = {r["Name"] for r in records}
            if not any("Bundesnachrichtendienst" in n for n in existing_names):
                records.append({
                    "Name": "Bundesnachrichtendienst (BND)",
                    "Typ": "Behörde",
                    "Geschaeftsbereich": "Bundeskanzleramt",
                    "Untertyp": "Bundesoberbehörde",
                })

    # Handle "3.18. Der Vorstand mit der Zentrale der Deutschen Bundesbank"
    bundesbank_match = re.search(
        r"3\.18\.\s+Der Vorstand.*?Bundesbank(.*?)(?=4\.\s+|$)",
        section3_text,
        re.DOTALL,
    )
    if bundesbank_match:
        # The Bundesbank section mentions Hauptverwaltungen and Filialen
        existing_names = {r["Name"] for r in records}
        if not any("Bundesbank" in n for n in existing_names):
            records.append({
                "Name": "Deutsche Bundesbank (Hauptverwaltungen und Filialen)",
                "Typ": "Behörde",
                "Geschaeftsbereich": "Deutsche Bundesbank",
                "Untertyp": "Bundesbehörde (gleichgestellt)",
            })

    return records


# ── Step 3: Post-process and clean entity names ────────────────────────────

def clean_entity_name(name: str) -> str:
    """Final cleanup of entity name."""
    # Remove footnote superscript numbers
    name = re.sub(r"(\w)\d+$", r"\1", name)
    # Remove trailing commas, periods
    name = name.rstrip(".,;:")
    # Remove "und " prefix
    if name.startswith("und "):
        name = name[4:]
    if name.startswith("sowie "):
        name = name[6:]
    # Strip extra whitespace
    name = " ".join(name.split())
    return name.strip()


# ── Main ────────────────────────────────────────────────────────────────────

def main():
    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

    log.info(f"Reading PDF: {PDF_PATH}")
    full_text = extract_full_text(PDF_PATH)

    log.info("Parsing document structure...")
    records = parse_document(full_text)

    # Clean up entity names
    for rec in records:
        rec["Name"] = clean_entity_name(rec["Name"])

    # Remove duplicates (same Name + Geschaeftsbereich)
    seen = set()
    unique_records = []
    for rec in records:
        key = (rec["Name"], rec["Geschaeftsbereich"])
        if key not in seen:
            seen.add(key)
            unique_records.append(rec)
    records = unique_records

    # Remove empty names
    records = [r for r in records if r["Name"] and len(r["Name"]) > 2]

    # Write CSV
    log.info(f"Writing {len(records)} entities to {OUTPUT_PATH}")
    with open(OUTPUT_PATH, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=["Name", "Typ", "Geschaeftsbereich", "Untertyp"])
        writer.writeheader()
        writer.writerows(records)

    # ── Statistics ──
    print("\n" + "=" * 70)
    print("EXTRACTION SUMMARY")
    print("=" * 70)
    print(f"Total entities extracted: {len(records)}")
    print()

    # By Typ
    typ_counts = {}
    for r in records:
        typ_counts[r["Typ"]] = typ_counts.get(r["Typ"], 0) + 1
    print("By Typ:")
    for typ, count in sorted(typ_counts.items(), key=lambda x: -x[1]):
        print(f"  {typ}: {count}")
    print()

    # By Geschäftsbereich
    gb_counts = {}
    for r in records:
        gb_counts[r["Geschaeftsbereich"]] = gb_counts.get(r["Geschaeftsbereich"], 0) + 1
    print("By Geschäftsbereich:")
    for gb, count in sorted(gb_counts.items(), key=lambda x: -x[1]):
        print(f"  {gb}: {count}")
    print()

    # By Untertyp
    ut_counts = {}
    for r in records:
        ut_counts[r["Untertyp"]] = ut_counts.get(r["Untertyp"], 0) + 1
    print("By Untertyp:")
    for ut, count in sorted(ut_counts.items(), key=lambda x: -x[1]):
        print(f"  {ut}: {count}")
    print()

    # Print some sample records
    print("Sample records (first 10):")
    print("-" * 70)
    for r in records[:10]:
        print(f"  {r['Name']}")
        print(f"    Typ={r['Typ']}, Geschäftsbereich={r['Geschaeftsbereich']}, Untertyp={r['Untertyp']}")
    print()

    print(f"CSV saved to: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
