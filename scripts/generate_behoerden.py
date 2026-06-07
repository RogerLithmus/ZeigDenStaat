# -*- coding: utf-8 -*-
"""
generate_behoerden.py – Generiert alle Bundesbehörden-JSONs (aus Excel).

Alle fachlichen Behördendaten kommen aus:
  - data/initial_behoerden.json (recherchierte Hauptbehörden)
  - data/Bundesbehörden_Verzeichnis.xlsx (restliche Behörden)
Die Zuordnungen und Mappings liegen in data/import_mappings.json.
Keine hardcodierten fachlichen Dictionaries oder Konstanten in diesem Script.
"""

import os
import json
import csv
import sys
import re
import argparse
from datetime import date
from collections import defaultdict

sys.stdout.reconfigure(encoding='utf-8')

# Optional: openpyxl importieren
try:
    import openpyxl
    HAS_OPENPYXL = True
except ImportError:
    HAS_OPENPYXL = False

# Pfade definieren
_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_DEFAULT_DATA_DIR = os.path.join(_ROOT, "data")
_DEFAULT_BEHOERDEN_DIR = os.path.join(_DEFAULT_DATA_DIR, "behoerden")
_DEFAULT_TEMPLATES = os.path.join(_DEFAULT_DATA_DIR, "initial_behoerden.json")
_DEFAULT_MAPPINGS = os.path.join(_DEFAULT_DATA_DIR, "import_mappings.json")
_DEFAULT_EXCEL = os.path.join(_DEFAULT_DATA_DIR, "Bundesbehörden_Verzeichnis.xlsx")
_DEFAULT_RESSOURCEN = os.path.join(_ROOT, "ressourcen")

TODAY = date.today().isoformat()
SCHEMA_VERSION = "1.0"
AGENT_VERSION = "2.0"

VOLLSTAENDIGKEITS_FELDER = [
    "name", "kuerzel", "typ", "rechtsform", "sitz", "bundesland", "beschaeftigte",
    "gruendungsjahr", "zustaendigkeit", "website", "rechtsgrundlage", "ministerium_id"
]


# === BUDGET & HAUSHALT LOGIK ===

def load_kapitel_budgets(csv_path: str) -> dict:
    """Liest Kapitel-level Ausgaben aus einer Haushalts-CSV (für v2 Vorlagen)."""
    budgets = {}
    if not os.path.isfile(csv_path):
        return {}
    try:
        with open(csv_path, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f, delimiter=";")
            for row in reader:
                if row.get("einahmen-ausgaben", "").strip() == "A":
                    kap = row.get("kapitel", "").strip()
                    soll_str = row.get("soll ", row.get("soll", "0")).strip()
                    try:
                        soll = float(soll_str.replace(",", ".")) if soll_str else 0
                    except ValueError:
                        soll = 0
                    if kap:
                        budgets[kap] = budgets.get(kap, 0) + soll
    except Exception as e:
        print(f"WARN: Fehler beim Lesen der Haushalts-CSV {os.path.basename(csv_path)}: {e}", file=sys.stderr)
    return {k: round(v / 1000, 1) for k, v in budgets.items()}


def load_haushalt_csv(path: str):
    """Liest Haushalt-CSV für Namens-Matching-Suche (Excel Import)."""
    sums = defaultdict(float)
    kap_sums = defaultdict(float)
    if not os.path.isfile(path):
        return sums, kap_sums
    try:
        with open(path, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f, delimiter=";")
            for row in reader:
                if row.get('einahmen-ausgaben', '') != 'A':
                    continue
                try:
                    soll_str = row.get('soll ', row.get('soll', '0')).strip()
                    betrag = float(soll_str.replace(',', '.')) if soll_str else 0
                except ValueError:
                    betrag = 0
                epl = row.get('einzelplan-text', '').strip()
                kap = row.get('kapitel-text', '').strip()
                if epl:
                    sums[epl.lower()] += betrag
                if kap:
                    kap_sums[kap.lower()] += betrag
    except Exception as e:
        print(f"WARN: Fehler beim Lesen der Haushalts-CSV {os.path.basename(path)}: {e}", file=sys.stderr)
    return sums, kap_sums


def build_haushalt_lookup(ressourcen_dir: str):
    """Baut Lookup-Tabellen für Haushaltsdaten (Excel Import)."""
    sums25, kap25 = load_haushalt_csv(os.path.join(ressourcen_dir, "HH_2025_ALL.csv"))
    sums26, kap26 = load_haushalt_csv(os.path.join(ressourcen_dir, "HH_2026_ALL.csv"))
    
    combined_epl = {}
    for k in set(list(sums25.keys()) + list(sums26.keys())):
        val = sums26.get(k, 0) or sums25.get(k, 0)
        if val > 0:
            combined_epl[k] = round(val / 1000, 2)  # Tsd EUR -> Mio EUR

    combined_kap = {}
    for k in set(list(kap25.keys()) + list(kap26.keys())):
        val = kap26.get(k, 0) or kap25.get(k, 0)
        if val > 0:
            combined_kap[k] = round(val / 1000, 2)
    return combined_epl, combined_kap


def find_haushalt(name: str, epl_lookup: dict, kap_lookup: dict) -> float | None:
    """Sucht den Haushaltsbetrag für eine Behörde über Namens-Matching."""
    name_lower = name.lower()
    if name_lower in epl_lookup:
        return epl_lookup[name_lower]
    for k, v in epl_lookup.items():
        if name_lower in k or k in name_lower:
            return v
    for k, v in kap_lookup.items():
        if name_lower in k or k in name_lower:
            return v
    words = [w for w in re.split(r'\s+', name_lower) if len(w) > 4]
    for k, v in kap_lookup.items():
        if any(w in k for w in words):
            return v
    return None


# === HELPERS ===

def make_id(name: str, excel_id: int) -> str:
    """Erstellt eine einzigartige slug ID mit Suffix."""
    match = re.search(r'\(([A-ZÄÖÜ][A-ZÄÖÜa-z0-9\-]{1,11})\)\s*$', str(name))
    if match:
        base = match.group(1).lower().replace('-', '_')
        return f"{base}_{excel_id}"

    words = re.sub(r'[^\wäöüÄÖÜ\s]', ' ', str(name)).split()
    stopwords = {'fuer', 'fur', 'und', 'der', 'die', 'das', 'des', 'den',
                 'an', 'in', 'im', 'zu', 'von', 'am', 'zum', 'zur',
                 'bundesamt', 'bundesanstalt', 'bundesministerium',
                 'bundesbehorde', 'bundesbehörde', 'bundesinstitut',
                 'bundesverwaltung', 'dienststelle', 'agentur'}
    sig = [w for w in words if w.lower() not in stopwords and len(w) > 2]
    if sig:
        base = ''.join(w[:3] for w in sig[:5]).lower()
    else:
        base = ''.join(w[:2] for w in words[:5]).lower()
    return f"{base}_{excel_id}"


def compute_vollstaendigkeit(obj: dict) -> float:
    """Berechnet die Vollständigkeit in % über die 12 Pflichtfelder."""
    nicht_null = sum(1 for f in VOLLSTAENDIGKEITS_FELDER if obj.get(f) is not None)
    return round((nicht_null / len(VOLLSTAENDIGKEITS_FELDER)) * 100, 1)


# === MAIN ===

def main():
    parser = argparse.ArgumentParser(description="Generiere alle Bundesbehörden-Dateien")
    parser.add_argument("--templates", default=_DEFAULT_TEMPLATES)
    parser.add_argument("--mappings", default=_DEFAULT_MAPPINGS)
    parser.add_argument("--excel", default=_DEFAULT_EXCEL)
    parser.add_argument("--ressourcen", default=_DEFAULT_RESSOURCEN)
    parser.add_argument("--behoerden-dir", default=_DEFAULT_BEHOERDEN_DIR)
    parser.add_argument("--skip-merge", action="store_true")
    args = parser.parse_args()

    os.makedirs(args.behoerden_dir, exist_ok=True)

    # 1. Mappings laden
    print(f"Lade Mappings aus {args.mappings}...")
    if not os.path.isfile(args.mappings):
        print(f"FEHLER: Mapping-Datei nicht gefunden: {args.mappings}", file=sys.stderr)
        sys.exit(1)
    with open(args.mappings, "r", encoding="utf-8") as f:
        mappings_data = json.load(f)
    klass_typ_map = mappings_data.get("KLASSIFIKATION_TYP_MAP", {})
    min_map = mappings_data.get("MINISTERIUM_MAP", {})
    stadt_bundesland = mappings_data.get("STADTBUNDESLAND", {})

    # 2. Haushaltsdaten für templates laden
    csv_2025 = os.path.join(args.ressourcen, "HH_2025_ALL.csv")
    print(f"Lade Haushalts-CSV (2025) für Templates aus {csv_2025}...")
    kapitel_budgets = load_kapitel_budgets(csv_2025)

    # 3. Vorlagen verarbeiten Behörden
    print(f"Lade Vorlagen aus {args.templates}...")
    with open(args.templates, "r", encoding="utf-8") as f:
        templates = json.load(f)
    
    erledigte_ids = set()
    total_written = 0

    for t in templates:
        bid = t["id"]
        budget_mio = None
        if "haushalt_kapitel" in t:
            budget_mio = kapitel_budgets.get(t["haushalt_kapitel"])
        elif "haushalt_einzelplan" in t:
            total_ep = sum(val for k, val in kapitel_budgets.items() if k.startswith(t["haushalt_einzelplan"]))
            budget_mio = round(total_ep, 1) if total_ep > 0 else None
        elif "haushalt_mio_eur" in t:
            budget_mio = t["haushalt_mio_eur"]

        obj = {
            "id": bid,
            "excel_id": t.get("excel_id"),
            "schema_version": SCHEMA_VERSION,
            "name": t.get("name"),
            "kuerzel": t.get("kuerzel"),
            "typ": t.get("typ"),
            "rechtsform": t.get("rechtsform"),
            "ebene": t.get("ebene", "Bund"),
            "sitz": t.get("sitz"),
            "bundesland": t.get("bundesland"),
            "koordinaten": t.get("koordinaten", {"lat": None, "lon": None}),
            "gruendungsjahr": t.get("gruendungsjahr"),
            "aufgeloest": t.get("aufgeloest", False),
            "aufgeloest_jahr": t.get("aufgeloest_jahr"),
            "zustaendigkeit": t.get("zustaendigkeit"),
            "website": t.get("website"),
            "rechtsgrundlage": t.get("rechtsgrundlage"),
            "haushalt_mio_eur": budget_mio,
            "haushalt_jahr": 2025 if budget_mio is not None else None,
            "beschaeftigte": t.get("beschaeftigte"),
            "beschaeftigte_jahr": 2024 if t.get("beschaeftigte") is not None else None,
            "ministerium_id": t.get("ministerium_id"),
            "ressort": t.get("ressort") or None,
            "klassifikation": t.get("klassifikation") or None,
            "anmerkung": t.get("anmerkung") or None,
            "beziehungen": t.get("beziehungen", []),
            "quellen": t.get("quellen", []),
            "recherche_datum": TODAY,
            "recherche_agent_version": AGENT_VERSION
        }
        obj["daten_qualitaet"] = {
            "vollstaendigkeit_prozent": compute_vollstaendigkeit(obj),
            "zuletzt_verifiziert": TODAY,
            "verifikation_noetig": False
        }

        # Schreiben
        with open(os.path.join(args.behoerden_dir, f"{bid}.json"), "w", encoding="utf-8") as f:
            json.dump(obj, f, ensure_ascii=False, indent=2)
        erledigte_ids.add(bid)
        total_written += 1

    print(f"  {total_written} Vorlagen-Behörden generiert.")

    # 4. Excel-Verzeichnis verarbeiten (für restliche Einträge)
    if not HAS_OPENPYXL:
        print("WARN: openpyxl nicht installiert. Excel-Import übersprungen.", file=sys.stderr)
    elif not os.path.isfile(args.excel):
        print(f"WARN: Excel-Datei nicht gefunden unter {args.excel}", file=sys.stderr)
    else:
        print(f"Lade Haushaltsdaten für Excel-Import aus {args.ressourcen}...")
        epl_lookup, kap_lookup = build_haushalt_lookup(args.ressourcen)

        print(f"Lade Excel aus {args.excel}...")
        wb = openpyxl.load_workbook(args.excel)
        ws = wb['🏛️ Bundesbehörden']

        excel_count = 0
        for row in ws.iter_rows(min_row=9, values_only=True):
            if not row[0] or not row[1]:
                continue
            
            excel_id = int(row[0])
            name = str(row[1]).strip()
            
            # Generiere ID
            obj_id = make_id(name, excel_id)
            
            # Überspringen, falls ID bereits existiert (z.B. manuell überschrieben)
            if obj_id in erledigte_ids:
                continue

            # Budget
            budget_mio = None
            if row[6] is not None:
                try:
                    budget_mio = float(row[6])
                except (ValueError, TypeError):
                    pass
            if budget_mio is None:
                budget_mio = find_haushalt(name, epl_lookup, kap_lookup)

            # Mitarbeiter
            beschaeftigte = None
            if row[5] is not None:
                try:
                    beschaeftigte = int(row[5])
                except (ValueError, TypeError):
                    pass

            # Website
            website = str(row[8]).strip() if row[8] else None
            if website and website != "None":
                if not website.startswith("http"):
                    website = "https://" + website
            else:
                website = None

            # Sitz und Bundesland (aus Mappings)
            sitz_raw = str(row[4]).strip() if row[4] else None
            sitz = sitz_raw.split("/")[0].split(",")[0].strip() if sitz_raw else None
            bundesland = stadt_bundesland.get(sitz) if sitz else None

            # Typ und Rechtsform
            klassifikation = str(row[3]).strip() if row[3] else None
            rechtsform = str(row[7]).strip() if row[7] else None
            
            typ = klass_typ_map.get(klassifikation) if klassifikation else None
            if not typ and rechtsform:
                if "Körperschaft" in rechtsform:
                    typ = "KdöR"
                elif "Anstalt" in rechtsform:
                    typ = "AdöR"
            if not typ:
                typ = "Bundesoberbehörde"

            # Ministerium
            ressort = str(row[2]).strip() if row[2] else None
            ministerium_id = min_map.get(ressort) if ressort else None

            # Beziehungen
            beziehungen = []
            if ministerium_id:
                beziehungen.append({
                    "zu_id": ministerium_id,
                    "typ": "UNTERSTELLT",
                    "richtung": "eingehend",
                    "seit": None,
                    "quelle": None
                })

            anmerkung = str(row[9]).strip() if len(row) > 9 and row[9] else None

            obj = {
                "id": obj_id,
                "excel_id": excel_id,
                "schema_version": SCHEMA_VERSION,
                "name": name,
                "kuerzel": None,
                "typ": typ,
                "rechtsform": rechtsform or None,
                "ebene": "Bund",
                "sitz": sitz,
                "bundesland": bundesland,
                "koordinaten": {"lat": None, "lon": None},
                "gruendungsjahr": None,
                "aufgeloest": False,
                "aufgeloest_jahr": None,
                "zustaendigkeit": klassifikation or None,
                "website": website,
                "rechtsgrundlage": None,
                "haushalt_mio_eur": budget_mio,
                "haushalt_jahr": 2025 if budget_mio is not None else None,
                "beschaeftigte": beschaeftigte,
                "beschaeftigte_jahr": 2024 if beschaeftigte is not None else None,
                "ministerium_id": ministerium_id,
                "ressort": ressort or None,
                "klassifikation": klassifikation or None,
                "anmerkung": anmerkung or None,
                "beziehungen": beziehungen,
                "quellen": [website] if website else [],
                "recherche_datum": TODAY,
                "recherche_agent_version": AGENT_VERSION
            }
            obj["daten_qualitaet"] = {
                "vollstaendigkeit_prozent": compute_vollstaendigkeit(obj),
                "zuletzt_verifiziert": TODAY,
                "verifikation_noetig": False
            }

            # Schreiben
            with open(os.path.join(args.behoerden_dir, f"{obj_id}.json"), "w", encoding="utf-8") as f:
                json.dump(obj, f, ensure_ascii=False, indent=2)
            erledigte_ids.add(obj_id)
            excel_count += 1
            total_written += 1

        print(f"  {excel_count} Excel-Behörden generiert.")

    print(f"\nGenerierung abgeschlossen. Insgesamt {total_written} JSON-Dateien.")

    # 5. Merge via Pipeline aufrufen
    if not args.skip_merge:
        print("\nStarte Aggregation über Pipeline...")
        sys.path.insert(0, _ROOT)
        try:
            from scripts.pipeline import run_merge
            run_merge()
        except ImportError as e:
            print(f"WARN: Merge-Schritt konnte nicht geladen werden: {e}", file=sys.stderr)


if __name__ == "__main__":
    main()
