#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Wikipedia-Scraper für deutsche Bundesbehörden und Bundesunternehmen.

Scrapes:
1. Bundesbehörde (Deutschland) – Oberste Bundesbehörden + Bundesoberbehörden
2. Liste privatrechtlicher Unternehmen mit deutscher Bundesbeteiligung

For each entity, visits individual Wikipedia page for infobox data.

Output:
- data/raw/wikipedia_behoerden.csv
- data/raw/wikipedia_unternehmen.csv
"""

import csv
import logging
import os
import re
import sys
import time
from urllib.parse import quote, unquote, urljoin

import requests
from bs4 import BeautifulSoup, Tag

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
BASE_URL = "https://de.wikipedia.org"
DELAY = 0.5  # seconds between requests

HEADERS = {
    "User-Agent": (
        "ZeigDenStaatBot/1.0 "
        "(https://github.com/zeigdenstaat; research project) "
        "Python-requests"
    ),
    "Accept-Language": "de-DE,de;q=0.9,en;q=0.5",
}

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "data", "raw")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
session = requests.Session()
session.headers.update(HEADERS)


def fetch(url: str) -> BeautifulSoup | None:
    """Fetch a URL and return parsed soup, or None on error."""
    time.sleep(DELAY)
    try:
        resp = session.get(url, timeout=30)
        resp.raise_for_status()
        return BeautifulSoup(resp.content, "html.parser")
    except Exception as exc:
        log.warning("Fehler beim Laden von %s: %s", url, exc)
        return None


def clean(text: str | None) -> str:
    """Strip whitespace and normalise unicode."""
    if text is None:
        return ""
    # Replace soft hyphens, non-breaking spaces, zero-width chars
    t = text.replace("\u00ad", "").replace("\u00a0", " ").replace("\u200b", "")
    t = re.sub(r"\[.*?\]", "", t)  # remove citation refs like [1]
    return " ".join(t.split()).strip()


def wiki_link_to_url(href: str) -> str | None:
    """Convert a relative wiki href to a full URL. Returns None for non-article links."""
    if not href:
        return None
    # Filter out non-article links
    if href.startswith("#") or "Spezial:" in href or "Hilfe:" in href:
        return None
    if href.startswith("//de.wikipedia.org/wiki/"):
        return "https:" + href
    if href.startswith("/wiki/"):
        return BASE_URL + href
    return None


def extract_wiki_url_from_tag(tag) -> str | None:
    """Extract the Wikipedia article URL from an <a> tag inside a cell."""
    if tag is None:
        return None
    # If the tag itself is an <a>
    if tag.name == "a":
        return wiki_link_to_url(tag.get("href", ""))
    # Look for first <a> in children
    a_tag = tag.find("a", href=True)
    if a_tag:
        return wiki_link_to_url(a_tag.get("href", ""))
    return None


def extract_infobox(soup: BeautifulSoup) -> dict:
    """Extract key-value pairs from a German Wikipedia infobox."""
    result = {
        "Mitarbeiteranzahl": "",
        "Gruendungsjahr": "",
        "Hauptsitz": "",
        "Budget": "",
        "Website": "",
        "Rechtsform": "",
    }

    if soup is None:
        return result

    # Find infobox: various class patterns used by German Wikipedia
    infobox = None
    for cls in ["infobox", "infobox-body", "toptextcells"]:
        infobox = soup.find("table", class_=re.compile(cls, re.I))
        if infobox:
            break
    if not infobox:
        # Try the sidebar/float table used by some articles
        infobox = soup.find("table", class_=re.compile(r"float-right|wikitable.*infobox", re.I))
    if not infobox:
        return result

    rows = infobox.find_all("tr")
    for row in rows:
        th = row.find("th")
        td = row.find("td")
        if th is None or td is None:
            continue
        label = clean(th.get_text())
        value = clean(td.get_text())
        label_lower = label.lower()

        if any(k in label_lower for k in ["mitarbeiter", "beschäftigte", "bedienstete", "personal"]):
            result["Mitarbeiteranzahl"] = value
        elif any(k in label_lower for k in ["gründung", "erricht", "bestehen seit"]):
            result["Gruendungsjahr"] = value
        elif any(k in label_lower for k in ["sitz", "hauptsitz", "standort"]):
            result["Hauptsitz"] = value
        elif any(k in label_lower for k in ["etat", "haushalt", "budget", "umsatz"]):
            result["Budget"] = value
        elif any(k in label_lower for k in ["website", "webpräsenz", "webseite", "homepage"]):
            # Try to get the actual URL from a link
            a_tag = td.find("a", href=True)
            if a_tag:
                href = a_tag.get("href", "")
                if href.startswith("http"):
                    result["Website"] = href
                else:
                    result["Website"] = value
            else:
                result["Website"] = value
        elif any(k in label_lower for k in ["rechtsform", "organisationsform"]):
            result["Rechtsform"] = value

    return result


# ---------------------------------------------------------------------------
# 1+2) Scrape Bundesbehörde (Deutschland) page
# ---------------------------------------------------------------------------
def scrape_behoerden() -> list[dict]:
    """
    Scrape the Bundesbehörde (Deutschland) page.
    This page has:
    - Section "Oberste Bundesbehörden" with a table
    - Section "Bundesoberbehörden" with a table (Name, Abk., Geschäftsbereich, Sitz)
    - Additional sections for other authority types
    """
    url = BASE_URL + "/wiki/Bundesbeh%C3%B6rde_(Deutschland)"
    log.info("Lade Bundesbehörden-Seite: %s", url)
    soup = fetch(url)
    if soup is None:
        log.error("Konnte Bundesbehörden-Seite nicht laden")
        return []

    records = []

    # Find all content sections
    content = soup.find("div", class_="mw-parser-output")
    if not content:
        log.error("Konnte Hauptinhalt nicht finden")
        return []

    # Process each section by finding h2 headers and their following tables
    current_category = ""
    for element in content.children:
        if not isinstance(element, Tag):
            continue

        # Check for section headings (div with mw-heading class or direct h2)
        if element.name == "section":
            # Parsoid HTML uses <section> elements
            heading = element.find(["h2", "h3"])
            if heading:
                heading_text = clean(heading.get_text())
                current_category = heading_text

            # Find tables within this section
            tables = element.find_all("table", class_="wikitable")
            for table in tables:
                records.extend(_parse_behoerden_table(table, current_category))

            # Also check for list-based content (ul/li)
            lists = element.find_all("ul", recursive=False)
            for ul in lists:
                for li in ul.find_all("li", recursive=False):
                    name_text = clean(li.get_text())
                    if not name_text or len(name_text) < 3:
                        continue
                    wiki_url = extract_wiki_url_from_tag(li)
                    records.append({
                        "Name": name_text,
                        "Abkuerzung": "",
                        "Geschaeftsbereich": "",
                        "Sitz": "",
                        "Kategorie": current_category,
                        "Wikipedia_URL": wiki_url or "",
                    })
            continue

        # For non-Parsoid HTML: look for heading divs
        if element.name == "div" and "mw-heading" in element.get("class", []):
            h = element.find(["h2", "h3"])
            if h:
                current_category = clean(h.get_text())
            continue

        if element.name == "table" and "wikitable" in element.get("class", []):
            records.extend(_parse_behoerden_table(element, current_category))
            continue

        # Check for list-based sections
        if element.name == "ul":
            for li in element.find_all("li", recursive=False):
                name_text = clean(li.get_text())
                if not name_text or len(name_text) < 3:
                    continue
                wiki_url = extract_wiki_url_from_tag(li)
                records.append({
                    "Name": name_text,
                    "Abkuerzung": "",
                    "Geschaeftsbereich": "",
                    "Sitz": "",
                    "Kategorie": current_category,
                    "Wikipedia_URL": wiki_url or "",
                })

    # Filter to only relevant categories
    relevant = [
        "oberste bundesbehörden",
        "bundesoberbehörden",
        "bundesmittel- und bundesunterbehörden",
        "bundesanstalten",
        "rechtsfähige körperschaften des öffentlichen rechts",
    ]
    filtered = []
    for r in records:
        cat_lower = r["Kategorie"].lower()
        if any(k in cat_lower for k in relevant):
            filtered.append(r)

    # If we got no filtered results, keep all (fallback)
    if not filtered and records:
        log.warning("Keine relevanten Kategorien gefunden, behalte alle %d Einträge", len(records))
        filtered = records

    log.info("Gefundene Behörden: %d", len(filtered))
    return filtered


def _parse_behoerden_table(table, category: str) -> list[dict]:
    """Parse a wikitable of authorities. Handles variable column counts."""
    records = []
    rows = table.find_all("tr")
    if not rows:
        return records

    # Determine header columns
    header_row = rows[0]
    headers = [clean(th.get_text()).lower() for th in header_row.find_all(["th", "td"])]

    # Map columns
    col_map = {}
    for i, h in enumerate(headers):
        if any(k in h for k in ["name", "behörde", "bezeichnung", "firma"]):
            col_map["name"] = i
        elif any(k in h for k in ["abk", "kürzel"]):
            col_map["abk"] = i
        elif any(k in h for k in ["geschäftsbereich", "ministerium", "ressort"]):
            col_map["bereich"] = i
        elif any(k in h for k in ["sitz", "ort", "stadt"]):
            col_map["sitz"] = i

    # If no "name" column, assume first column
    if "name" not in col_map and headers:
        col_map["name"] = 0

    for row in rows[1:]:
        cells = row.find_all(["td", "th"])
        if not cells:
            continue

        def get_cell(key):
            idx = col_map.get(key)
            if idx is not None and idx < len(cells):
                return cells[idx]
            return None

        name_cell = get_cell("name")
        if not name_cell:
            continue

        name = clean(name_cell.get_text())
        if not name or len(name) < 2:
            continue

        wiki_url = extract_wiki_url_from_tag(name_cell) or ""

        records.append({
            "Name": name,
            "Abkuerzung": clean(get_cell("abk").get_text()) if get_cell("abk") else "",
            "Geschaeftsbereich": clean(get_cell("bereich").get_text()) if get_cell("bereich") else "",
            "Sitz": clean(get_cell("sitz").get_text()) if get_cell("sitz") else "",
            "Kategorie": category,
            "Wikipedia_URL": wiki_url,
        })

    return records


# ---------------------------------------------------------------------------
# 3) Scrape Unternehmen mit Bundesbeteiligung
# ---------------------------------------------------------------------------
def scrape_unternehmen() -> list[dict]:
    """Scrape federal company participation list."""
    url = BASE_URL + "/wiki/Liste_privatrechtlicher_Unternehmen_mit_deutscher_Bundesbeteiligung"
    log.info("Lade Unternehmen-Seite: %s", url)
    soup = fetch(url)
    if soup is None:
        log.error("Konnte Unternehmen-Seite nicht laden")
        return []

    records = []
    content = soup.find("div", class_="mw-parser-output")
    if not content:
        log.error("Konnte Hauptinhalt nicht finden")
        return []

    current_section = ""

    # Find all sections – the page uses <section> elements with tables
    sections = content.find_all("section")
    if not sections:
        # Fallback: find tables directly
        sections = [content]

    for section in sections:
        # Get section heading
        heading = section.find(["h2", "h3"])
        if heading:
            current_section = clean(heading.get_text())

        tables = section.find_all("table", class_="wikitable")
        for table in tables:
            records.extend(_parse_unternehmen_table(table, current_section))

    log.info("Gefundene Unternehmen: %d", len(records))
    return records


def _parse_unternehmen_table(table, section: str) -> list[dict]:
    """Parse a companies wikitable."""
    records = []
    rows = table.find_all("tr")
    if len(rows) < 2:
        return records

    # Handle multi-row headers (rowspan="2" in the header)
    header_cells = rows[0].find_all(["th", "td"])
    headers_raw = []
    for th in header_cells:
        text = clean(th.get_text()).lower()
        colspan = int(th.get("colspan", 1))
        rowspan = int(th.get("rowspan", 1))
        for _ in range(colspan):
            headers_raw.append(text)

    # Check if there's a second header row (rowspan=2 headers + sub-headers)
    data_start = 1
    second_header = rows[1].find_all(["th"])
    if second_header and len(second_header) > 0:
        # There are sub-headers; adjust
        data_start = 2

    # Map columns
    col_map = {}
    for i, h in enumerate(headers_raw):
        if any(k in h for k in ["firma", "name", "unternehmen", "bezeichnung"]):
            col_map["firma"] = i
        elif any(k in h for k in ["rechtsform"]):
            col_map["rechtsform"] = i
        elif any(k in h for k in ["sitz"]):
            col_map["sitz"] = i
        elif any(k in h for k in ["beteiligungsführung", "führung"]):
            col_map["fuehrung"] = i
        elif any(k in h for k in ["anteil unmittel", "unmittelbar"]):
            col_map["anteil_unmittelbar"] = i
        elif any(k in h for k in ["anteil mittel", "mittelbar"]):
            col_map["anteil_mittelbar"] = i
        elif any(k in h for k in ["weitere", "information"]):
            col_map["info"] = i

    if "firma" not in col_map:
        col_map["firma"] = 0

    for row in rows[data_start:]:
        cells = row.find_all(["td", "th"])
        if not cells:
            continue

        def get_cell(key):
            idx = col_map.get(key)
            if idx is not None and idx < len(cells):
                return cells[idx]
            return None

        firma_cell = get_cell("firma")
        if not firma_cell:
            continue

        firma = clean(firma_cell.get_text())
        if not firma or len(firma) < 2:
            continue

        wiki_url = extract_wiki_url_from_tag(firma_cell) or ""

        # Determine participation type from section name and data
        anteil_unmittelbar = clean(get_cell("anteil_unmittelbar").get_text()) if get_cell("anteil_unmittelbar") else ""
        beteiligungsart = "unmittelbar" if anteil_unmittelbar and anteil_unmittelbar != "–" else "mittelbar"

        records.append({
            "Firma": firma,
            "Rechtsform": clean(get_cell("rechtsform").get_text()) if get_cell("rechtsform") else "",
            "Sitz": clean(get_cell("sitz").get_text()) if get_cell("sitz") else "",
            "Beteiligungsfuehrung": clean(get_cell("fuehrung").get_text()) if get_cell("fuehrung") else "",
            "Anteil_unmittelbar": anteil_unmittelbar,
            "Beteiligungsart": beteiligungsart,
            "Kategorie": section,
            "Wikipedia_URL": wiki_url,
        })

    return records


# ---------------------------------------------------------------------------
# 4) Enrich with infobox data
# ---------------------------------------------------------------------------
def enrich_behoerden(records: list[dict]) -> list[dict]:
    """Visit each Behörde's Wikipedia page to extract infobox data."""
    total = len(records)
    enriched_count = 0
    for i, rec in enumerate(records):
        url = rec.get("Wikipedia_URL", "")
        if not url:
            log.debug("Kein Wikipedia-Link für: %s", rec["Name"])
            continue

        log.info("[%d/%d] Lade Infobox: %s", i + 1, total, rec["Name"])
        soup = fetch(url)
        info = extract_infobox(soup)

        rec["Mitarbeiteranzahl"] = info["Mitarbeiteranzahl"]
        rec["Gruendungsjahr"] = info["Gruendungsjahr"]
        rec["Hauptsitz"] = info["Hauptsitz"]
        rec["Budget"] = info["Budget"]
        rec["Website"] = info["Website"]
        rec["Rechtsform"] = info["Rechtsform"]

        if any(info[k] for k in info):
            enriched_count += 1

    log.info("Infobox-Daten gefunden für %d/%d Behörden", enriched_count, total)
    return records


def enrich_unternehmen(records: list[dict]) -> list[dict]:
    """Visit each company's Wikipedia page to extract infobox data."""
    total = len(records)
    enriched_count = 0
    for i, rec in enumerate(records):
        url = rec.get("Wikipedia_URL", "")
        if not url:
            log.debug("Kein Wikipedia-Link für: %s", rec["Firma"])
            continue

        log.info("[%d/%d] Lade Infobox: %s", i + 1, total, rec["Firma"])
        soup = fetch(url)
        info = extract_infobox(soup)

        rec["Mitarbeiteranzahl"] = info["Mitarbeiteranzahl"]
        rec["Gruendungsjahr"] = info["Gruendungsjahr"]
        rec["Hauptsitz"] = info["Hauptsitz"]
        rec["Budget"] = info["Budget"]
        rec["Website_Infobox"] = info["Website"]
        # Don't overwrite Rechtsform if already present from the list table
        if not rec.get("Rechtsform"):
            rec["Rechtsform"] = info["Rechtsform"]

    log.info("Infobox-Daten gefunden für %d/%d Unternehmen", enriched_count, total)
    return records


# ---------------------------------------------------------------------------
# 5) Save to CSV
# ---------------------------------------------------------------------------
def save_behoerden_csv(records: list[dict], path: str):
    """Save Behörden data to CSV."""
    fieldnames = [
        "Name", "Abkuerzung", "Geschaeftsbereich", "Sitz", "Kategorie",
        "Mitarbeiteranzahl", "Gruendungsjahr", "Hauptsitz", "Budget",
        "Website", "Rechtsform", "Wikipedia_URL",
    ]
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(records)
    log.info("Gespeichert: %s (%d Zeilen)", path, len(records))


def save_unternehmen_csv(records: list[dict], path: str):
    """Save Unternehmen data to CSV."""
    fieldnames = [
        "Firma", "Rechtsform", "Sitz", "Beteiligungsfuehrung",
        "Anteil_unmittelbar", "Beteiligungsart", "Kategorie",
        "Mitarbeiteranzahl", "Gruendungsjahr", "Hauptsitz", "Budget",
        "Website_Infobox", "Wikipedia_URL",
    ]
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(records)
    log.info("Gespeichert: %s (%d Zeilen)", path, len(records))


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print("=" * 70)
    print("Wikipedia-Scraper für deutsche Bundesbehörden und -unternehmen")
    print("=" * 70)

    # --- Behörden ---
    print("\n--- Schritt 1/4: Bundesbehörden scrapen ---")
    behoerden = scrape_behoerden()

    print(f"\n--- Schritt 2/4: Infobox-Daten für {len(behoerden)} Behörden laden ---")
    behoerden = enrich_behoerden(behoerden)

    behoerden_path = os.path.join(OUTPUT_DIR, "wikipedia_behoerden.csv")
    save_behoerden_csv(behoerden, behoerden_path)

    # --- Unternehmen ---
    print(f"\n--- Schritt 3/4: Bundesunternehmen scrapen ---")
    unternehmen = scrape_unternehmen()

    print(f"\n--- Schritt 4/4: Infobox-Daten für {len(unternehmen)} Unternehmen laden ---")
    unternehmen = enrich_unternehmen(unternehmen)

    unternehmen_path = os.path.join(OUTPUT_DIR, "wikipedia_unternehmen.csv")
    save_unternehmen_csv(unternehmen, unternehmen_path)

    # --- Summary ---
    print("\n" + "=" * 70)
    print("ZUSAMMENFASSUNG")
    print("=" * 70)
    print(f"Behörden gesamt:      {len(behoerden)}")

    cats = {}
    for b in behoerden:
        c = b.get("Kategorie", "unbekannt")
        cats[c] = cats.get(c, 0) + 1
    for c, n in sorted(cats.items()):
        print(f"  - {c}: {n}")

    with_info = sum(1 for b in behoerden if b.get("Website") or b.get("Mitarbeiteranzahl"))
    print(f"  davon mit Infobox-Daten: {with_info}")

    print(f"\nUnternehmen gesamt:   {len(unternehmen)}")
    ucats = {}
    for u in unternehmen:
        c = u.get("Kategorie", "unbekannt")
        ucats[c] = ucats.get(c, 0) + 1
    for c, n in sorted(ucats.items()):
        print(f"  - {c}: {n}")

    with_info_u = sum(1 for u in unternehmen if u.get("Website_Infobox") or u.get("Mitarbeiteranzahl"))
    print(f"  davon mit Infobox-Daten: {with_info_u}")

    print(f"\nAusgabedateien:")
    print(f"  {behoerden_path}")
    print(f"  {unternehmen_path}")
    print("=" * 70)


if __name__ == "__main__":
    main()
