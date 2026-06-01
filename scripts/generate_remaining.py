# -*- coding: utf-8 -*-
"""
Generiert JSON-Dateien fuer alle Behoerden aus der Excel-Tabelle.
Reichert mit Haushaltsdaten aus den CSV-Dateien im ./ressourcen/ Ordner an.
"""

import openpyxl
import json
import os
import re
import csv
import sys
from datetime import date
from collections import defaultdict

sys.stdout.reconfigure(encoding='utf-8')

EXCEL_PATH = "data/Bundesbehörden_Verzeichnis.xlsx"
BEHOERDEN_DIR = "data/behoerden"
DATA_DIR = "data"
RESSOURCEN_DIR = "ressourcen"
HEUTE = date.today().isoformat()


# === HAUSHALTSDATEN LADEN ===================================================

def load_haushalt_csv(fname):
    """Liest Haushalt-CSV und gibt Dict {einzel-text_lower: summe_tsd_eur} zurueck."""
    path = os.path.join(RESSOURCEN_DIR, fname)
    sums = defaultdict(float)  # einzel_text -> Gesamtausgaben Tsd EUR
    kap_sums = defaultdict(float)  # kapitel_text -> Gesamtausgaben Tsd EUR
    try:
        with open(path, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f, delimiter=";")
            for row in reader:
                # Nur Ausgaben ('A') summieren
                if row.get('einahmen-ausgaben', '') != 'A':
                    continue
                try:
                    betrag = float(str(row.get('soll ', '0')).replace(',', '.') or 0)
                except ValueError:
                    betrag = 0
                epl = row.get('einzelplan-text', '').strip()
                kap = row.get('kapitel-text', '').strip()
                if epl:
                    sums[epl.lower()] += betrag
                if kap:
                    kap_sums[kap.lower()] += betrag
    except Exception as e:
        print(f"  WARN Haushalt-CSV {fname}: {e}")
    return sums, kap_sums


def build_haushalt_lookup():
    """Baut Lookup-Tabelle fuer Haushalt nach Einzelplan- und Kapitel-Text."""
    sums25, kap25 = load_haushalt_csv("HH_2025_ALL.csv")
    sums26, kap26 = load_haushalt_csv("HH_2026_ALL.csv")
    # Bevorzuge 2026, fallback 2025
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


def find_haushalt(name, epl_lookup, kap_lookup):
    """Sucht den Haushaltsbetrag fuer eine Behoerde."""
    name_lower = name.lower()
    # Direkte EPL-Suche
    if name_lower in epl_lookup:
        return epl_lookup[name_lower]
    # Partielle Suche im EPL
    for k, v in epl_lookup.items():
        if name_lower in k or k in name_lower:
            return v
    # Partielle Suche im Kapitel
    for k, v in kap_lookup.items():
        if name_lower in k or k in name_lower:
            return v
    # Schluesselwortsuche
    words = [w for w in re.split(r'\s+', name_lower) if len(w) > 4]
    for k, v in kap_lookup.items():
        if any(w in k for w in words):
            return v
    return None


# === ID-GENERIERUNG =========================================================

def make_id(name, excel_id):
    """Erstellt eine einzigartige slug ID."""
    # Kuerzel in Klammern suchen: z.B. (BKA), (BSI)
    match = re.search(r'\(([A-ZÄÖÜ][A-ZÄÖÜa-z0-9\-]{1,11})\)\s*$', str(name))
    if match:
        base = match.group(1).lower().replace('-', '_')
        return f"{base}_{excel_id}"

    # Akronym aus Anfangsbuchstaben signifikanter Woerter
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


# === TYP & MAPPING ==========================================================

KLASSIFIKATION_TYP_MAP = {
    "Ministerium": "Ministerium",
    "Bundesanstalt": "Bundesanstalt",
    "Bundesinstitut": "Bundesoberbehörde",
    "Bundespolizei": "Bundesoberbehörde",
    "Geheimdienst": "Bundesoberbehörde",
    "Statistik": "Bundesoberbehörde",
    "Regulierungsbehörde": "Bundesoberbehörde",
    "Verfassungsgericht": "Verfassungsorgan",
    "Verfassungsschutz": "Bundesoberbehörde",
    "Rechnungshof": "Verfassungsorgan",
    "Gericht": "Bundesoberbehörde",
    "Bundesverwaltungsgericht": "Bundesoberbehörde",
    "Forschung": "Bundesanstalt",
    "Hochschule": "Bundesanstalt",
    "Krankenkasse": "KdöR",
    "Rentenversicherung": "KdöR",
    "Bank": "AdöR",
    "Förderbank": "AdöR",
    "Entwicklungsbank": "AdöR",
    "Sozialversicherung": "KdöR",
    "Berufsgenossenschaft": "KdöR",
    "Unfallkasse": "KdöR",
    "Museum und Ausstellungen": "Bundesanstalt",
    "Bibliothek": "Bundesanstalt",
    "Archiv": "Bundesanstalt",
    "IT-Dienstleister": "Bundesanstalt",
    "THW": "Bundesanstalt",
    "Film": "Bundesanstalt",
    "Politische Bildung": "Bundesoberbehörde",
    "Zoll": "Bundesoberbehörde",
    "Hauptzollamt": "Bundesoberbehörde",
    "Zollfahndungsamt": "Bundesoberbehörde",
    "Agentur für Arbeit": "Bundesanstalt",
    "Regionaldirektion der Agentur für Arbeit": "Bundesanstalt",
    "Jobcenter": "KdöR",
    "Familienkasse": "Bundesanstalt",
    "Bundeswehr": "Bundesoberbehörde",
    "Bundeswehrkrankenhaus": "Bundesoberbehörde",
    "Katastrophenschutz": "Bundesoberbehörde",
    "Helmholtz-Zentrum": "Bundesanstalt",
    "Leibniz-Institut": "Bundesanstalt",
    "Akademie": "Bundesanstalt",
    "Akademie der Künste": "KdöR",
    "Wasser und Schifffahrt": "Bundesoberbehörde",
    "Wasserstraßen-Neubauamt": "Bundesoberbehörde",
    "Autobahndirektion": "Bundesoberbehörde",
}

MINISTERIUM_MAP = {
    "Bundeskanzleramt (BKAmt)": "bkamt",
    "Auswärtiges Amt (AA)": "aa",
    "Bundesministerium des Innern und für Heimat (BMI)": "bmi",
    "Bundesministerium der Finanzen (BMF)": "bmf",
    "Bundesministerium der Verteidigung (BMVg)": "bmvg",
    "Bundesministerium für Wirtschaft und Klimaschutz (BMWK)": "bmwi",
    "Bundesministerium für Forschung, Technologie und Raumfahrt (BMFTR)": "bmftr",
    "Bundesministerium der Justiz (BMJ)": "bmjv",
    "Bundesministerium für Bildung und Forschung (BMBF)": "bmbfsj",
    "Bundesministerium für Arbeit und Soziales (BMAS)": "bmas",
    "Bundesministerium für Digitales und Verkehr (BMDV)": "bmv",
    "Bundesministerium für Umwelt, Naturschutz, nukleare Sicherheit und Verbraucherschutz (BMUV)": "bmuv",
    "Bundesministerium für Gesundheit (BMG)": "bmg",
    "Bundesministerium für Ernährung und Landwirtschaft (BMEL)": "bmelh",
    "Bundesministerium für wirtschaftliche Zusammenarbeit und Entwicklung (BMZ)": "bmz",
    "Bundesministerium für Wohnen, Stadtentwicklung und Bauwesen (BMWSB)": "bmwsb",
    "Beauftragte der Bundesregierung für Kultur und Medien (BKM)": "bkamt",
    "Deutscher Bundestag": "bt",
    "Bundesministerium für Familie, Senioren, Frauen und Jugend (BMFSFJ)": "bmbfsj",
}

STADTBUNDESLAND = {
    "Berlin": "Berlin", "Bonn": "Nordrhein-Westfalen", "Köln": "Nordrhein-Westfalen",
    "München": "Bayern", "Frankfurt": "Hessen", "Frankfurt am Main": "Hessen",
    "Hamburg": "Hamburg", "Stuttgart": "Baden-Württemberg", "Karlsruhe": "Baden-Württemberg",
    "Düsseldorf": "Nordrhein-Westfalen", "Wiesbaden": "Hessen", "Münster": "Nordrhein-Westfalen",
    "Nürnberg": "Bayern", "Potsdam": "Brandenburg", "Dresden": "Sachsen",
    "Leipzig": "Sachsen", "Erfurt": "Thüringen", "Magdeburg": "Sachsen-Anhalt",
    "Kiel": "Schleswig-Holstein", "Schwerin": "Mecklenburg-Vorpommern",
    "Mainz": "Rheinland-Pfalz", "Saarbrücken": "Saarland", "Bremen": "Bremen",
    "Hannover": "Niedersachsen", "Braunschweig": "Niedersachsen",
    "Freiburg": "Baden-Württemberg", "Dortmund": "Nordrhein-Westfalen",
    "Essen": "Nordrhein-Westfalen", "Bochum": "Nordrhein-Westfalen",
    "Aachen": "Nordrhein-Westfalen", "Koblenz": "Rheinland-Pfalz",
    "Trier": "Rheinland-Pfalz", "Augsburg": "Bayern", "Regensburg": "Bayern",
    "Ingolstadt": "Bayern", "Rostock": "Mecklenburg-Vorpommern",
    "Lübeck": "Schleswig-Holstein", "Flensburg": "Schleswig-Holstein",
    "Kassel": "Hessen", "Darmstadt": "Hessen", "Marburg": "Hessen",
    "Göttingen": "Niedersachsen", "Osnabrück": "Niedersachsen",
    "Braunschweig": "Niedersachsen", "Wolfsburg": "Niedersachsen",
    "Halle": "Sachsen-Anhalt", "Jena": "Thüringen", "Gera": "Thüringen",
    "Cottbus": "Brandenburg", "Brandenburg": "Brandenburg",
    "Stralsund": "Mecklenburg-Vorpommern", "Greifswald": "Mecklenburg-Vorpommern",
    "Bremerhaven": "Bremen", "Kempten": "Bayern", "Würzburg": "Bayern",
    "Bamberg": "Bayern", "Bayreuth": "Bayern", "Landshut": "Bayern",
    "Passau": "Bayern", "Ulm": "Baden-Württemberg", "Mannheim": "Baden-Württemberg",
    "Heidelberg": "Baden-Württemberg", "Pforzheim": "Baden-Württemberg",
    "Heilbronn": "Baden-Württemberg", "Tübingen": "Baden-Württemberg",
    "Paderborn": "Nordrhein-Westfalen", "Bielefeld": "Nordrhein-Westfalen",
    "Bocholt": "Nordrhein-Westfalen", "Gelsenkirchen": "Nordrhein-Westfalen",
    "Siegen": "Nordrhein-Westfalen", "Wuppertal": "Nordrhein-Westfalen",
    "Krefeld": "Nordrhein-Westfalen", "Mönchengladbach": "Nordrhein-Westfalen",
    "Duisburg": "Nordrhein-Westfalen", "Oberhausen": "Nordrhein-Westfalen",
}


def get_bundesland(sitz_raw):
    if not sitz_raw:
        return None
    city = sitz_raw.split("/")[0].split(",")[0].strip()
    return STADTBUNDESLAND.get(city)


def get_typ(klassifikation, rechtsform):
    if klassifikation and klassifikation in KLASSIFIKATION_TYP_MAP:
        return KLASSIFIKATION_TYP_MAP[klassifikation]
    if rechtsform:
        if "Körperschaft" in rechtsform:
            return "KdöR"
        if "Anstalt" in rechtsform:
            return "AdöR"
    return "Bundesoberbehörde"


def get_website(raw):
    if not raw:
        return None
    url = str(raw).strip()
    if not url or url == "None":
        return None
    if not url.startswith("http"):
        url = "https://" + url
    return url


# === HAUPTPROGRAMM ==========================================================

def main():
    os.makedirs(BEHOERDEN_DIR, exist_ok=True)

    print("Lade Haushaltsdaten...")
    epl_lookup, kap_lookup = build_haushalt_lookup()
    print(f"  EPL-Eintraege: {len(epl_lookup)}, Kapitel-Eintraege: {len(kap_lookup)}")

    print("Lade Excel...")
    wb = openpyxl.load_workbook(EXCEL_PATH)
    ws = wb['🏛️ Bundesbehörden']

    excel_rows = []
    for row in ws.iter_rows(min_row=9, values_only=True):
        if row[0] and row[1]:
            excel_rows.append({
                'excel_id': int(row[0]),
                'name': str(row[1]).strip(),
                'ressort': str(row[2]).strip() if row[2] else '',
                'klassifikation': str(row[3]).strip() if row[3] else '',
                'sitz': str(row[4]).strip() if row[4] else '',
                'mitarbeiter': row[5],
                'budget_excel': row[6],  # in Mio EUR laut Excel
                'rechtsform': str(row[7]).strip() if row[7] else '',
                'website': str(row[8]).strip() if row[8] else '',
                'anmerkung': str(row[9]).strip() if row[9] else '',
            })

    print(f"Excel-Eintraege: {len(excel_rows)}")

    # Bestehende alte JSON-Dateien einlesen (alphabetische IDs)
    old_ids = set()
    old_behoerden = []
    for fname in os.listdir(BEHOERDEN_DIR):
        if fname.endswith('.json'):
            fid = fname.replace('.json', '')
            if not re.search(r'_\d+$', fid):  # Alte IDs haben keine Zahl am Ende
                old_ids.add(fid)
                try:
                    with open(os.path.join(BEHOERDEN_DIR, fname), "r", encoding="utf-8") as f:
                        old_behoerden.append(json.load(f))
                except Exception as e:
                    print(f"  WARN {fname}: {e}")

    print(f"Bestehende alte Behoerden-JSONs: {len(old_ids)}")

    # Alle Excel-Eintraege verarbeiten
    neu_behoerden = []
    erledigt = 0
    fehler_list = []

    for r in excel_rows:
        excel_id = r['excel_id']
        name = r['name']

        obj_id = make_id(name, excel_id)

        # Budget: Excel-Wert hat Vorrang, sonst Haushalt-Lookup
        budget_mio = None
        if r['budget_excel'] is not None:
            try:
                budget_mio = float(r['budget_excel'])
            except (ValueError, TypeError):
                pass

        if budget_mio is None:
            budget_mio = find_haushalt(name, epl_lookup, kap_lookup)

        # Mitarbeiter
        beschaeftigte = None
        if r['mitarbeiter'] is not None:
            try:
                beschaeftigte = int(r['mitarbeiter'])
            except (ValueError, TypeError):
                pass

        # Typ
        typ = get_typ(r['klassifikation'], r['rechtsform'])

        # Ministerium
        ministerium_id = MINISTERIUM_MAP.get(r['ressort'])

        # Beziehungen
        beziehungen = []
        if ministerium_id:
            beziehungen.append({
                "zu_id": ministerium_id,
                "typ": "UNTERSTELLT",
                "richtung": "eingehend",
                "seit": None
            })

        # Website
        website = get_website(r['website'])

        # Sitz
        sitz_raw = r['sitz']
        sitz = sitz_raw.split("/")[0].split(",")[0].strip() if sitz_raw else None
        bundesland = get_bundesland(sitz_raw)

        obj = {
            "id": obj_id,
            "excel_id": excel_id,
            "name": name,
            "kuerzel": None,
            "typ": typ,
            "rechtsform": r['rechtsform'] or None,
            "ebene": "Bund",
            "sitz": sitz,
            "bundesland": bundesland,
            "gruendungsjahr": None,
            "aufgeloest": False,
            "aufgeloest_jahr": None,
            "zustaendigkeit": r['klassifikation'] or None,
            "website": website,
            "rechtsgrundlage": None,
            "haushalt_mio_eur": budget_mio,
            "beschaeftigte": beschaeftigte,
            "ministerium_id": ministerium_id,
            "ressort": r['ressort'] or None,
            "klassifikation": r['klassifikation'] or None,
            "anmerkung": r['anmerkung'] or None,
            "beziehungen": beziehungen,
            "quellen": [website] if website else [],
            "recherche_datum": HEUTE,
        }

        json_path = os.path.join(BEHOERDEN_DIR, f"{obj_id}.json")
        try:
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(obj, f, ensure_ascii=False, indent=2)
            neu_behoerden.append(obj)
            erledigt += 1
        except Exception as e:
            print(f"  FEHLER {obj_id}: {e}")
            fehler_list.append(obj_id)

    print(f"\n✓ {erledigt} neue Behörden-JSONs erstellt")
    print(f"✗ {len(fehler_list)} Fehler")

    # ── alle_behoerden.json ──────────────────────────────────────────────────
    alle = old_behoerden + neu_behoerden
    alle_path = os.path.join(DATA_DIR, "alle_behoerden.json")
    with open(alle_path, "w", encoding="utf-8") as f:
        json.dump(alle, f, ensure_ascii=False, indent=2)
    print(f"✓ alle_behoerden.json: {len(alle)} Eintraege")

    # ── beziehungen.json ─────────────────────────────────────────────────────
    alle_bez = []
    for b in alle:
        for bez in b.get('beziehungen', []):
            alle_bez.append({
                "von": b['id'],
                "zu": bez['zu_id'],
                "typ": bez['typ'],
                "seit": bez.get('seit')
            })
    bez_path = os.path.join(DATA_DIR, "beziehungen.json")
    with open(bez_path, "w", encoding="utf-8") as f:
        json.dump(alle_bez, f, ensure_ascii=False, indent=2)
    print(f"✓ beziehungen.json: {len(alle_bez)} Beziehungen")

    # ── fehler.json ──────────────────────────────────────────────────────────
    fehler_path = os.path.join(DATA_DIR, "fehler.json")
    with open(fehler_path, "w", encoding="utf-8") as f:
        json.dump(fehler_list, f, ensure_ascii=False, indent=2)

    # ── fortschritt.json ─────────────────────────────────────────────────────
    fort = {
        "erledigt": list(old_ids) + [b['id'] for b in neu_behoerden],
        "offen": [],
        "fehler": fehler_list,
    }
    fort_path = os.path.join(DATA_DIR, "fortschritt.json")
    with open(fort_path, "w", encoding="utf-8") as f:
        json.dump(fort, f, ensure_ascii=False, indent=2)

    # ── README.md ────────────────────────────────────────────────────────────
    total = len(alle)
    felder = ['name', 'kuerzel', 'typ', 'rechtsform', 'sitz', 'bundesland',
              'gruendungsjahr', 'website', 'rechtsgrundlage', 'haushalt_mio_eur',
              'beschaeftigte', 'ministerium_id']
    vollst = {f: round(sum(1 for b in alle if b.get(f) is not None) / total * 100, 1)
              for f in felder}

    typ_cnt = defaultdict(int)
    for b in alle:
        typ_cnt[b.get('typ', 'Unbekannt')] += 1

    klass_cnt = defaultdict(int)
    for b in alle:
        klass_cnt[b.get('klassifikation') or 'Unbekannt'] += 1

    readme = f"""# Bundesbehörden Datenbank

Generiert am: {HEUTE}

## Statistiken

| | |
|---|---|
| **Gesamt Behörden** | {total} |
| **Recherchierte (alte JSONs)** | {len(old_behoerden)} |
| **Neue (aus Excel generiert)** | {len(neu_behoerden)} |
| **Beziehungen gesamt** | {len(alle_bez)} |
| **Fehler** | {len(fehler_list)} |

## Feldvollständigkeit (%)

| Feld | Vollständigkeit |
|------|----------------|
"""
    for feld, pct in vollst.items():
        bar = "█" * int(pct / 10) + "░" * (10 - int(pct / 10))
        readme += f"| `{feld}` | {bar} {pct}% |\n"

    readme += "\n## Typ-Verteilung\n\n| Typ | Anzahl |\n|-----|--------|\n"
    for t, c in sorted(typ_cnt.items(), key=lambda x: -x[1]):
        readme += f"| {t} | {c} |\n"

    readme += "\n## Top 25 Klassifikationen\n\n| Klassifikation | Anzahl |\n|---------------|--------|\n"
    for k, c in sorted(klass_cnt.items(), key=lambda x: -x[1])[:25]:
        readme += f"| {k} | {c} |\n"

    with open(os.path.join(DATA_DIR, "README.md"), "w", encoding="utf-8") as f:
        f.write(readme)
    print("✓ README.md erstellt")
    print(f"\nFertig! Gesamt: {total} Behörden in der Datenbank.")


if __name__ == "__main__":
    main()
