# -*- coding: utf-8 -*-
"""
Generate all 62 Bundesbehörden JSON files from Excel + Budget CSV data.
"""
import json
import os
import csv
import sys
from datetime import date

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BEHOERDEN_DIR = os.path.join(BASE_DIR, "behoerden")
RESSOURCEN_DIR = os.path.join(os.path.dirname(BASE_DIR), "ressourcen")

os.makedirs(BEHOERDEN_DIR, exist_ok=True)

TODAY = date.today().isoformat()

# ============================================================
# Budget data from HH_2025_ALL.csv (Kapitel-level Ausgaben)
# ============================================================
def load_kapitel_budgets():
    budgets = {}
    csv_path = os.path.join(RESSOURCEN_DIR, "HH_2025_ALL.csv")
    with open(csv_path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f, delimiter=";")
        for row in reader:
            if row["einahmen-ausgaben"].strip() == "A":
                kap = row["kapitel"].strip()
                soll_str = row.get("soll ", row.get("soll", "0")).strip()
                try:
                    soll = float(soll_str) if soll_str else 0
                except ValueError:
                    soll = 0
                budgets[kap] = budgets.get(kap, 0) + soll
    # Convert from 1000 EUR to Mio EUR
    return {k: round(v / 1000, 1) for k, v in budgets.items()}

kapitel_budgets = load_kapitel_budgets()

def get_budget(kapitel_code):
    """Get budget in Mio EUR for a Kapitel code."""
    return kapitel_budgets.get(kapitel_code)

def get_ep_budget(ep_code):
    """Sum all Kapitel budgets for an Einzelplan."""
    total = 0
    for kap, val in kapitel_budgets.items():
        if kap.startswith(ep_code):
            total += val
    return round(total, 1) if total > 0 else None


# ============================================================
# All 62 Behörden definitions
# ============================================================
behoerden = []

# ---- GRUPPE 1: Verfassungsorgane (5) ----

behoerden.append({
    "id": "bt",
    "name": "Deutscher Bundestag",
    "kuerzel": "BT",
    "typ": "Verfassungsorgan",
    "rechtsform": "Verfassungsorgan (Parlament)",
    "ebene": "Bund",
    "sitz": "Berlin",
    "bundesland": "Berlin",
    "gruendungsjahr": 1949,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Gesetzgebung, Haushaltsbewilligung, Kontrolle der Bundesregierung, Wahl des Bundeskanzlers",
    "website": "https://www.bundestag.de",
    "rechtsgrundlage": "Grundgesetz Art. 38-49",
    "haushalt_mio_eur": get_budget("0212"),
    "beschaeftigte": 3200,
    "ministerium_id": None,
    "beziehungen": [
        {"zu_id": "br", "typ": "KOORDINIERT_MIT", "richtung": "ausgehend", "seit": 1949},
        {"zu_id": "bpra", "typ": "KOORDINIERT_MIT", "richtung": "ausgehend", "seit": 1949},
        {"zu_id": "bverfg", "typ": "KOORDINIERT_MIT", "richtung": "ausgehend", "seit": 1951}
    ],
    "quellen": ["https://www.bundestag.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "br",
    "name": "Bundesrat",
    "kuerzel": "BR",
    "typ": "Verfassungsorgan",
    "rechtsform": "Verfassungsorgan (Länderkammer)",
    "ebene": "Bund",
    "sitz": "Berlin",
    "bundesland": "Berlin",
    "gruendungsjahr": 1949,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Mitwirkung der Länder bei der Gesetzgebung und Verwaltung des Bundes",
    "website": "https://www.bundesrat.de",
    "rechtsgrundlage": "Grundgesetz Art. 50-53",
    "haushalt_mio_eur": get_budget("0312"),
    "beschaeftigte": 200,
    "ministerium_id": None,
    "beziehungen": [
        {"zu_id": "bt", "typ": "KOORDINIERT_MIT", "richtung": "ausgehend", "seit": 1949}
    ],
    "quellen": ["https://www.bundesrat.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "bpra",
    "name": "Bundespräsidialamt",
    "kuerzel": "BPrA",
    "typ": "Verfassungsorgan",
    "rechtsform": "Oberste Bundesbehörde",
    "ebene": "Bund",
    "sitz": "Berlin",
    "bundesland": "Berlin",
    "gruendungsjahr": 1949,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Unterstützung des Bundespräsidenten bei Amtsgeschäften und Repräsentation",
    "website": "https://www.bundespraesident.de",
    "rechtsgrundlage": "Grundgesetz Art. 54-61, Erlass über die Errichtung des Bundespräsidialamtes",
    "haushalt_mio_eur": get_budget("0112"),
    "beschaeftigte": 220,
    "ministerium_id": None,
    "beziehungen": [],
    "quellen": ["https://www.bundespraesident.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "bverfg",
    "name": "Bundesverfassungsgericht",
    "kuerzel": "BVerfG",
    "typ": "Verfassungsorgan",
    "rechtsform": "Verfassungsorgan (Gericht)",
    "ebene": "Bund",
    "sitz": "Karlsruhe",
    "bundesland": "Baden-Württemberg",
    "gruendungsjahr": 1951,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Verfassungsgerichtsbarkeit, Normenkontrolle, Verfassungsbeschwerden, Organstreitigkeiten",
    "website": "https://www.bundesverfassungsgericht.de",
    "rechtsgrundlage": "Grundgesetz Art. 92-94, Bundesverfassungsgerichtsgesetz (BVerfGG)",
    "haushalt_mio_eur": get_budget("1912"),
    "beschaeftigte": 280,
    "ministerium_id": None,
    "beziehungen": [],
    "quellen": ["https://www.bundesverfassungsgericht.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "brh",
    "name": "Bundesrechnungshof",
    "kuerzel": "BRH",
    "typ": "Verfassungsorgan",
    "rechtsform": "Oberste Bundesbehörde (Sonderstellung)",
    "ebene": "Bund",
    "sitz": "Bonn",
    "bundesland": "Nordrhein-Westfalen",
    "gruendungsjahr": 1950,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Prüfung der Haushalts- und Wirtschaftsführung des Bundes",
    "website": "https://www.bundesrechnungshof.de",
    "rechtsgrundlage": "Grundgesetz Art. 114, Bundesrechnungshofgesetz (BRHG)",
    "haushalt_mio_eur": get_budget("2012"),
    "beschaeftigte": 600,
    "ministerium_id": None,
    "beziehungen": [
        {"zu_id": "bt", "typ": "KOORDINIERT_MIT", "richtung": "ausgehend", "seit": 1950}
    ],
    "quellen": ["https://www.bundesrechnungshof.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

# ---- GRUPPE 2: Ministerien Kabinett Merz 2025 (17) ----

behoerden.append({
    "id": "bkamt",
    "name": "Bundeskanzleramt",
    "kuerzel": "BKAmt",
    "typ": "Ministerium",
    "rechtsform": "Oberste Bundesbehörde",
    "ebene": "Bund",
    "sitz": "Berlin",
    "bundesland": "Berlin",
    "gruendungsjahr": 1949,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Koordinierung der Regierungspolitik, Unterstützung des Bundeskanzlers, Nachrichtendienstkoordination",
    "website": "https://www.bundeskanzler.de",
    "rechtsgrundlage": "Grundgesetz Art. 62-69, Geschäftsordnung der Bundesregierung",
    "haushalt_mio_eur": get_ep_budget("04"),
    "beschaeftigte": 850,
    "ministerium_id": None,
    "beziehungen": [
        {"zu_id": "bnd", "typ": "FACHAUFSICHT", "richtung": "ausgehend", "seit": 1949},
        {"zu_id": "bpa", "typ": "FACHAUFSICHT", "richtung": "ausgehend", "seit": 1949}
    ],
    "quellen": ["https://www.bundeskanzler.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "aa",
    "name": "Auswärtiges Amt",
    "kuerzel": "AA",
    "typ": "Ministerium",
    "rechtsform": "Oberste Bundesbehörde",
    "ebene": "Bund",
    "sitz": "Berlin",
    "bundesland": "Berlin",
    "gruendungsjahr": 1951,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Außenpolitik, diplomatische Beziehungen, konsularische Angelegenheiten, Europapolitik",
    "website": "https://www.auswaertiges-amt.de",
    "rechtsgrundlage": "Grundgesetz Art. 32, 59, 73 Abs. 1 Nr. 1",
    "haushalt_mio_eur": get_ep_budget("05"),
    "beschaeftigte": 13600,
    "ministerium_id": None,
    "beziehungen": [],
    "quellen": ["https://www.auswaertiges-amt.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "bmi",
    "name": "Bundesministerium des Innern",
    "kuerzel": "BMI",
    "typ": "Ministerium",
    "rechtsform": "Oberste Bundesbehörde",
    "ebene": "Bund",
    "sitz": "Berlin",
    "bundesland": "Berlin",
    "gruendungsjahr": 1949,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Innere Sicherheit, Polizei, Migration, Verfassungsschutz, öffentlicher Dienst, Sport",
    "website": "https://www.bmi.bund.de",
    "rechtsgrundlage": "Grundgesetz Art. 65, 87 Abs. 1",
    "haushalt_mio_eur": get_ep_budget("06"),
    "beschaeftigte": 2100,
    "ministerium_id": None,
    "beziehungen": [
        {"zu_id": "bpol", "typ": "FACHAUFSICHT", "richtung": "ausgehend", "seit": 1949},
        {"zu_id": "bka", "typ": "FACHAUFSICHT", "richtung": "ausgehend", "seit": 1951},
        {"zu_id": "bfv", "typ": "FACHAUFSICHT", "richtung": "ausgehend", "seit": 1950},
        {"zu_id": "bamf", "typ": "FACHAUFSICHT", "richtung": "ausgehend", "seit": 1953},
        {"zu_id": "bsi", "typ": "FACHAUFSICHT", "richtung": "ausgehend", "seit": 1991},
        {"zu_id": "bbk", "typ": "FACHAUFSICHT", "richtung": "ausgehend", "seit": 2004},
        {"zu_id": "bva", "typ": "FACHAUFSICHT", "richtung": "ausgehend", "seit": 1960},
        {"zu_id": "destatis", "typ": "FACHAUFSICHT", "richtung": "ausgehend", "seit": 1953},
        {"zu_id": "thw", "typ": "FACHAUFSICHT", "richtung": "ausgehend", "seit": 1950},
        {"zu_id": "bpb", "typ": "FACHAUFSICHT", "richtung": "ausgehend", "seit": 1952}
    ],
    "quellen": ["https://www.bmi.bund.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "bmf",
    "name": "Bundesministerium der Finanzen",
    "kuerzel": "BMF",
    "typ": "Ministerium",
    "rechtsform": "Oberste Bundesbehörde",
    "ebene": "Bund",
    "sitz": "Berlin",
    "bundesland": "Berlin",
    "gruendungsjahr": 1949,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Bundeshaushalt, Steuerpolitik, Zoll, Finanzmarktregulierung, Bundesvermögen",
    "website": "https://www.bundesfinanzministerium.de",
    "rechtsgrundlage": "Grundgesetz Art. 108, 112, 114, Bundeshaushaltsordnung",
    "haushalt_mio_eur": get_ep_budget("08"),
    "beschaeftigte": 2200,
    "ministerium_id": None,
    "beziehungen": [
        {"zu_id": "gzd", "typ": "FACHAUFSICHT", "richtung": "ausgehend", "seit": 2016},
        {"zu_id": "bzst", "typ": "FACHAUFSICHT", "richtung": "ausgehend", "seit": 2006},
        {"zu_id": "bafin", "typ": "RECHTSAUFSICHT", "richtung": "ausgehend", "seit": 2002},
        {"zu_id": "bima", "typ": "RECHTSAUFSICHT", "richtung": "ausgehend", "seit": 2005}
    ],
    "quellen": ["https://www.bundesfinanzministerium.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "bmvg",
    "name": "Bundesministerium der Verteidigung",
    "kuerzel": "BMVg",
    "typ": "Ministerium",
    "rechtsform": "Oberste Bundesbehörde",
    "ebene": "Bund",
    "sitz": "Berlin",
    "bundesland": "Berlin",
    "gruendungsjahr": 1955,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Landesverteidigung, Bundeswehr, Rüstung, militärische Auslandseinsätze",
    "website": "https://www.bmvg.de",
    "rechtsgrundlage": "Grundgesetz Art. 65a, 87a, 87b",
    "haushalt_mio_eur": get_ep_budget("14"),
    "beschaeftigte": 2500,
    "ministerium_id": None,
    "beziehungen": [
        {"zu_id": "mad", "typ": "FACHAUFSICHT", "richtung": "ausgehend", "seit": 1956},
        {"zu_id": "baaInBw", "typ": "FACHAUFSICHT", "richtung": "ausgehend", "seit": 2012}
    ],
    "quellen": ["https://www.bmvg.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "bmwi",
    "name": "Bundesministerium für Wirtschaft und Energie",
    "kuerzel": "BMWK",
    "typ": "Ministerium",
    "rechtsform": "Oberste Bundesbehörde",
    "ebene": "Bund",
    "sitz": "Berlin",
    "bundesland": "Berlin",
    "gruendungsjahr": 1949,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Wirtschaftspolitik, Energiepolitik, Mittelstand, Außenwirtschaft, Wettbewerb",
    "website": "https://www.bmwk.de",
    "rechtsgrundlage": "Grundgesetz Art. 65, Organisationserlass des Bundeskanzlers",
    "haushalt_mio_eur": get_ep_budget("09"),
    "beschaeftigte": 2300,
    "ministerium_id": None,
    "beziehungen": [
        {"zu_id": "bnetza", "typ": "FACHAUFSICHT", "richtung": "ausgehend", "seit": 2005},
        {"zu_id": "bkarta", "typ": "FACHAUFSICHT", "richtung": "ausgehend", "seit": 1958},
        {"zu_id": "ptb", "typ": "FACHAUFSICHT", "richtung": "ausgehend", "seit": 1887}
    ],
    "quellen": ["https://www.bmwk.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "bmftr",
    "name": "Bundesministerium für Forschung, Technologie und Raumfahrt",
    "kuerzel": "BMFTR",
    "typ": "Ministerium",
    "rechtsform": "Oberste Bundesbehörde",
    "ebene": "Bund",
    "sitz": "Berlin",
    "bundesland": "Berlin",
    "gruendungsjahr": 2025,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Forschungsförderung, Technologiepolitik, Raumfahrt, Wissenschaftssystem",
    "website": "https://www.bmftr.de",
    "rechtsgrundlage": "Grundgesetz Art. 65, Organisationserlass vom 14.01.2025",
    "haushalt_mio_eur": get_ep_budget("30"),
    "beschaeftigte": 1500,
    "ministerium_id": None,
    "beziehungen": [],
    "quellen": ["https://www.bmftr.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "bmjv",
    "name": "Bundesministerium der Justiz und für Verbraucherschutz",
    "kuerzel": "BMJ",
    "typ": "Ministerium",
    "rechtsform": "Oberste Bundesbehörde",
    "ebene": "Bund",
    "sitz": "Berlin",
    "bundesland": "Berlin",
    "gruendungsjahr": 1949,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Rechtspolitik, Gesetzgebung, Verbraucherschutz, Bundesgerichtsbarkeit",
    "website": "https://www.bmj.de",
    "rechtsgrundlage": "Grundgesetz Art. 65, 96",
    "haushalt_mio_eur": get_ep_budget("07"),
    "beschaeftigte": 676,
    "ministerium_id": None,
    "beziehungen": [
        {"zu_id": "gba", "typ": "FACHAUFSICHT", "richtung": "ausgehend", "seit": 1950}
    ],
    "quellen": ["https://www.bmj.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "bmbfsj",
    "name": "Bundesministerium für Bildung, Familie, Senioren, Frauen und Jugend",
    "kuerzel": "BMBFSJ",
    "typ": "Ministerium",
    "rechtsform": "Oberste Bundesbehörde",
    "ebene": "Bund",
    "sitz": "Berlin",
    "bundesland": "Berlin",
    "gruendungsjahr": 2025,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Bildungspolitik, Familienpolitik, Seniorenpolitik, Gleichstellungspolitik, Jugendpolitik",
    "website": "https://www.bmbfsj.de",
    "rechtsgrundlage": "Grundgesetz Art. 65, Organisationserlass vom 14.01.2025",
    "haushalt_mio_eur": get_ep_budget("17"),
    "beschaeftigte": 950,
    "ministerium_id": None,
    "beziehungen": [
        {"zu_id": "bibb", "typ": "FACHAUFSICHT", "richtung": "ausgehend", "seit": 1970}
    ],
    "quellen": ["https://www.bmbfsj.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "bmas",
    "name": "Bundesministerium für Arbeit und Soziales",
    "kuerzel": "BMAS",
    "typ": "Ministerium",
    "rechtsform": "Oberste Bundesbehörde",
    "ebene": "Bund",
    "sitz": "Berlin",
    "bundesland": "Berlin",
    "gruendungsjahr": 1949,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Arbeitsmarktpolitik, Sozialversicherung, Arbeitsrecht, Arbeitsschutz, Rente",
    "website": "https://www.bmas.de",
    "rechtsgrundlage": "Grundgesetz Art. 65, 74 Abs. 1 Nr. 12",
    "haushalt_mio_eur": get_ep_budget("11"),
    "beschaeftigte": 1300,
    "ministerium_id": None,
    "beziehungen": [
        {"zu_id": "ba", "typ": "RECHTSAUFSICHT", "richtung": "ausgehend", "seit": 1952},
        {"zu_id": "baua", "typ": "FACHAUFSICHT", "richtung": "ausgehend", "seit": 1996}
    ],
    "quellen": ["https://www.bmas.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "bmdsi",
    "name": "Bundesministerium für Digitalisierung und Staatsmodernisierung",
    "kuerzel": "BMDSI",
    "typ": "Ministerium",
    "rechtsform": "Oberste Bundesbehörde",
    "ebene": "Bund",
    "sitz": "Berlin",
    "bundesland": "Berlin",
    "gruendungsjahr": 2025,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Digitalisierung der Verwaltung, Staatsmodernisierung, IT-Konsolidierung",
    "website": "https://www.bmdsi.bund.de",
    "rechtsgrundlage": "Grundgesetz Art. 65, Organisationserlass vom 14.01.2025",
    "haushalt_mio_eur": get_ep_budget("24"),
    "beschaeftigte": 200,
    "ministerium_id": None,
    "beziehungen": [],
    "quellen": ["https://www.bmdsi.bund.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "bmv",
    "name": "Bundesministerium für Verkehr",
    "kuerzel": "BMV",
    "typ": "Ministerium",
    "rechtsform": "Oberste Bundesbehörde",
    "ebene": "Bund",
    "sitz": "Berlin",
    "bundesland": "Berlin",
    "gruendungsjahr": 1949,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Verkehrspolitik, Straßen-, Schienen-, Wasser- und Luftverkehr, Mobilität",
    "website": "https://www.bmv.de",
    "rechtsgrundlage": "Grundgesetz Art. 65, 87e, 89, 90",
    "haushalt_mio_eur": get_ep_budget("12"),
    "beschaeftigte": 1700,
    "ministerium_id": None,
    "beziehungen": [
        {"zu_id": "kba", "typ": "FACHAUFSICHT", "richtung": "ausgehend", "seit": 1951},
        {"zu_id": "eba", "typ": "FACHAUFSICHT", "richtung": "ausgehend", "seit": 1994},
        {"zu_id": "bast", "typ": "FACHAUFSICHT", "richtung": "ausgehend", "seit": 1951}
    ],
    "quellen": ["https://www.bmv.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "bmuv",
    "name": "Bundesministerium für Umwelt, Klimaschutz, Naturschutz und nukleare Sicherheit",
    "kuerzel": "BMUV",
    "typ": "Ministerium",
    "rechtsform": "Oberste Bundesbehörde",
    "ebene": "Bund",
    "sitz": "Berlin",
    "bundesland": "Berlin",
    "gruendungsjahr": 1986,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Umweltschutz, Klimaschutz, Naturschutz, nukleare Sicherheit, Strahlenschutz",
    "website": "https://www.bmuv.de",
    "rechtsgrundlage": "Grundgesetz Art. 65, Organisationserlass",
    "haushalt_mio_eur": get_ep_budget("16"),
    "beschaeftigte": 1200,
    "ministerium_id": None,
    "beziehungen": [
        {"zu_id": "uba", "typ": "FACHAUFSICHT", "richtung": "ausgehend", "seit": 1986},
        {"zu_id": "bfn", "typ": "FACHAUFSICHT", "richtung": "ausgehend", "seit": 1993},
        {"zu_id": "base", "typ": "FACHAUFSICHT", "richtung": "ausgehend", "seit": 2014}
    ],
    "quellen": ["https://www.bmuv.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "bmg",
    "name": "Bundesministerium für Gesundheit",
    "kuerzel": "BMG",
    "typ": "Ministerium",
    "rechtsform": "Oberste Bundesbehörde",
    "ebene": "Bund",
    "sitz": "Berlin",
    "bundesland": "Berlin",
    "gruendungsjahr": 1961,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Gesundheitspolitik, Krankenversicherung, Arzneimittelrecht, Infektionsschutz, Pflege",
    "website": "https://www.bundesgesundheitsministerium.de",
    "rechtsgrundlage": "Grundgesetz Art. 65, 74 Abs. 1 Nr. 19",
    "haushalt_mio_eur": get_ep_budget("15"),
    "beschaeftigte": 1000,
    "ministerium_id": None,
    "beziehungen": [
        {"zu_id": "rki", "typ": "FACHAUFSICHT", "richtung": "ausgehend", "seit": 1994},
        {"zu_id": "pei", "typ": "FACHAUFSICHT", "richtung": "ausgehend", "seit": 1972},
        {"zu_id": "bzga", "typ": "FACHAUFSICHT", "richtung": "ausgehend", "seit": 1967},
        {"zu_id": "bfarm", "typ": "FACHAUFSICHT", "richtung": "ausgehend", "seit": 1994}
    ],
    "quellen": ["https://www.bundesgesundheitsministerium.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "bmelh",
    "name": "Bundesministerium für Ernährung, Landwirtschaft und Heimat",
    "kuerzel": "BMELH",
    "typ": "Ministerium",
    "rechtsform": "Oberste Bundesbehörde",
    "ebene": "Bund",
    "sitz": "Berlin",
    "bundesland": "Berlin",
    "gruendungsjahr": 1949,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Ernährungspolitik, Landwirtschaft, ländliche Räume, Tierschutz, Heimatpolitik",
    "website": "https://www.bmel.de",
    "rechtsgrundlage": "Grundgesetz Art. 65, Organisationserlass",
    "haushalt_mio_eur": get_ep_budget("10"),
    "beschaeftigte": 1000,
    "ministerium_id": None,
    "beziehungen": [
        {"zu_id": "ble", "typ": "FACHAUFSICHT", "richtung": "ausgehend", "seit": 1995},
        {"zu_id": "bvl", "typ": "FACHAUFSICHT", "richtung": "ausgehend", "seit": 2002}
    ],
    "quellen": ["https://www.bmel.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "bmz",
    "name": "Bundesministerium für wirtschaftliche Zusammenarbeit und Entwicklung",
    "kuerzel": "BMZ",
    "typ": "Ministerium",
    "rechtsform": "Oberste Bundesbehörde",
    "ebene": "Bund",
    "sitz": "Berlin",
    "bundesland": "Berlin",
    "gruendungsjahr": 1961,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Entwicklungspolitik, internationale Zusammenarbeit, humanitäre Hilfe",
    "website": "https://www.bmz.de",
    "rechtsgrundlage": "Grundgesetz Art. 65, Organisationserlass",
    "haushalt_mio_eur": get_ep_budget("23"),
    "beschaeftigte": 1100,
    "ministerium_id": None,
    "beziehungen": [],
    "quellen": ["https://www.bmz.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "bmwsb",
    "name": "Bundesministerium für Wohnen, Stadtentwicklung und Bauwesen",
    "kuerzel": "BMWSB",
    "typ": "Ministerium",
    "rechtsform": "Oberste Bundesbehörde",
    "ebene": "Bund",
    "sitz": "Berlin",
    "bundesland": "Berlin",
    "gruendungsjahr": 2021,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Wohnungspolitik, Stadtentwicklung, Bauwesen, Raumordnung",
    "website": "https://www.bmwsb.bund.de",
    "rechtsgrundlage": "Grundgesetz Art. 65, Organisationserlass vom 08.12.2021",
    "haushalt_mio_eur": get_ep_budget("25"),
    "beschaeftigte": 600,
    "ministerium_id": None,
    "beziehungen": [],
    "quellen": ["https://www.bmwsb.bund.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

# ---- GRUPPE 3: Nachgeordnete Bundesoberbehörden (36) ----

behoerden.append({
    "id": "bnd",
    "name": "Bundesnachrichtendienst",
    "kuerzel": "BND",
    "typ": "Bundesoberbehörde",
    "rechtsform": "Bundesoberbehörde",
    "ebene": "Bund",
    "sitz": "Berlin",
    "bundesland": "Berlin",
    "gruendungsjahr": 1956,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Auslandsnachrichtendienst, Auslandsaufklärung, Spionageabwehr im Ausland",
    "website": "https://www.bnd.bund.de",
    "rechtsgrundlage": "BND-Gesetz (BNDG)",
    "haushalt_mio_eur": get_budget("0414"),
    "beschaeftigte": 7600,
    "ministerium_id": "bkamt",
    "beziehungen": [
        {"zu_id": "bkamt", "typ": "UNTERSTELLT", "richtung": "eingehend", "seit": 1949}
    ],
    "quellen": ["https://www.bnd.bund.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "bpa",
    "name": "Presse- und Informationsamt der Bundesregierung",
    "kuerzel": "BPA",
    "typ": "Bundesoberbehörde",
    "rechtsform": "Bundesoberbehörde",
    "ebene": "Bund",
    "sitz": "Berlin",
    "bundesland": "Berlin",
    "gruendungsjahr": 1949,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Regierungskommunikation, Pressearbeit, Medienanalyse, Öffentlichkeitsarbeit",
    "website": "https://www.bundesregierung.de",
    "rechtsgrundlage": "Organisationserlass des Bundeskanzlers",
    "haushalt_mio_eur": get_budget("0432"),
    "beschaeftigte": 540,
    "ministerium_id": "bkamt",
    "beziehungen": [
        {"zu_id": "bkamt", "typ": "UNTERSTELLT", "richtung": "eingehend", "seit": 1949}
    ],
    "quellen": ["https://www.bundesregierung.de/breg-de/bundesregierung/bundespresseamt", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "bpol",
    "name": "Bundespolizei",
    "kuerzel": "BPOL",
    "typ": "Bundesoberbehörde",
    "rechtsform": "Bundesoberbehörde",
    "ebene": "Bund",
    "sitz": "Potsdam",
    "bundesland": "Brandenburg",
    "gruendungsjahr": 1951,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Grenzschutz, Bahnpolizei, Luftsicherheit, Schutz von Bundesorganen, Küstenwache",
    "website": "https://www.bundespolizei.de",
    "rechtsgrundlage": "Bundespolizeigesetz (BPolG)",
    "haushalt_mio_eur": get_budget("0625"),
    "beschaeftigte": 53000,
    "ministerium_id": "bmi",
    "beziehungen": [
        {"zu_id": "bmi", "typ": "UNTERSTELLT", "richtung": "eingehend", "seit": 1949},
        {"zu_id": "bka", "typ": "KOORDINIERT_MIT", "richtung": "ausgehend", "seit": 1951}
    ],
    "quellen": ["https://www.bundespolizei.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "bka",
    "name": "Bundeskriminalamt",
    "kuerzel": "BKA",
    "typ": "Bundesoberbehörde",
    "rechtsform": "Bundesoberbehörde",
    "ebene": "Bund",
    "sitz": "Wiesbaden",
    "bundesland": "Hessen",
    "gruendungsjahr": 1951,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Zentrale Kriminalpolizei, internationale Zusammenarbeit, Personenschutz, Cyberkriminalität",
    "website": "https://www.bka.de",
    "rechtsgrundlage": "BKA-Gesetz (BKAG)",
    "haushalt_mio_eur": get_budget("0624"),
    "beschaeftigte": 8500,
    "ministerium_id": "bmi",
    "beziehungen": [
        {"zu_id": "bmi", "typ": "UNTERSTELLT", "richtung": "eingehend", "seit": 1951}
    ],
    "quellen": ["https://www.bka.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "bfv",
    "name": "Bundesamt für Verfassungsschutz",
    "kuerzel": "BfV",
    "typ": "Bundesoberbehörde",
    "rechtsform": "Bundesoberbehörde",
    "ebene": "Bund",
    "sitz": "Köln",
    "bundesland": "Nordrhein-Westfalen",
    "gruendungsjahr": 1950,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Inlandsnachrichtendienst, Verfassungsschutz, Extremismusbeobachtung, Spionageabwehr",
    "website": "https://www.verfassungsschutz.de",
    "rechtsgrundlage": "Bundesverfassungsschutzgesetz (BVerfSchG)",
    "haushalt_mio_eur": get_budget("0626"),
    "beschaeftigte": 4200,
    "ministerium_id": "bmi",
    "beziehungen": [
        {"zu_id": "bmi", "typ": "UNTERSTELLT", "richtung": "eingehend", "seit": 1950}
    ],
    "quellen": ["https://www.verfassungsschutz.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "bamf",
    "name": "Bundesamt für Migration und Flüchtlinge",
    "kuerzel": "BAMF",
    "typ": "Bundesoberbehörde",
    "rechtsform": "Bundesoberbehörde",
    "ebene": "Bund",
    "sitz": "Nürnberg",
    "bundesland": "Bayern",
    "gruendungsjahr": 1953,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Asylverfahren, Migration, Integration, Rückkehrförderung, Integrationskurse",
    "website": "https://www.bamf.de",
    "rechtsgrundlage": "Aufenthaltsgesetz § 75, Asylgesetz",
    "haushalt_mio_eur": get_budget("0633"),
    "beschaeftigte": 8000,
    "ministerium_id": "bmi",
    "beziehungen": [
        {"zu_id": "bmi", "typ": "UNTERSTELLT", "richtung": "eingehend", "seit": 1953}
    ],
    "quellen": ["https://www.bamf.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "bsi",
    "name": "Bundesamt für Sicherheit in der Informationstechnik",
    "kuerzel": "BSI",
    "typ": "Bundesoberbehörde",
    "rechtsform": "Bundesoberbehörde",
    "ebene": "Bund",
    "sitz": "Bonn",
    "bundesland": "Nordrhein-Westfalen",
    "gruendungsjahr": 1991,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "IT-Sicherheit, Cybersicherheit, Kritische Infrastrukturen, Kryptografie, Zertifizierung",
    "website": "https://www.bsi.bund.de",
    "rechtsgrundlage": "BSI-Gesetz (BSIG)",
    "haushalt_mio_eur": get_budget("0623"),
    "beschaeftigte": 1400,
    "ministerium_id": "bmi",
    "beziehungen": [
        {"zu_id": "bmi", "typ": "UNTERSTELLT", "richtung": "eingehend", "seit": 1991}
    ],
    "quellen": ["https://www.bsi.bund.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "bbk",
    "name": "Bundesamt für Bevölkerungsschutz und Katastrophenhilfe",
    "kuerzel": "BBK",
    "typ": "Bundesamt",
    "rechtsform": "Bundesoberbehörde",
    "ebene": "Bund",
    "sitz": "Bonn",
    "bundesland": "Nordrhein-Westfalen",
    "gruendungsjahr": 2004,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Bevölkerungsschutz, Katastrophenhilfe, Warnung, KRITIS, Zivilschutz",
    "website": "https://www.bbk.bund.de",
    "rechtsgrundlage": "Zivilschutz- und Katastrophenhilfegesetz (ZSKG), BBK-Errichtungsgesetz",
    "haushalt_mio_eur": get_budget("0628"),
    "beschaeftigte": 502,
    "ministerium_id": "bmi",
    "beziehungen": [
        {"zu_id": "bmi", "typ": "UNTERSTELLT", "richtung": "eingehend", "seit": 2004},
        {"zu_id": "thw", "typ": "KOORDINIERT_MIT", "richtung": "ausgehend", "seit": 2004}
    ],
    "quellen": ["https://www.bbk.bund.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "bva",
    "name": "Bundesverwaltungsamt",
    "kuerzel": "BVA",
    "typ": "Bundesoberbehörde",
    "rechtsform": "Bundesoberbehörde",
    "ebene": "Bund",
    "sitz": "Köln",
    "bundesland": "Nordrhein-Westfalen",
    "gruendungsjahr": 1960,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Verwaltungsdienstleistungen, Auslandsschulwesen, Zuwendungsverwaltung, IT-Dienstleistungen",
    "website": "https://www.bva.bund.de",
    "rechtsgrundlage": "Gesetz über die Errichtung des Bundesverwaltungsamtes",
    "haushalt_mio_eur": get_budget("0615"),
    "beschaeftigte": 6400,
    "ministerium_id": "bmi",
    "beziehungen": [
        {"zu_id": "bmi", "typ": "UNTERSTELLT", "richtung": "eingehend", "seit": 1960}
    ],
    "quellen": ["https://www.bva.bund.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "destatis",
    "name": "Statistisches Bundesamt",
    "kuerzel": "Destatis",
    "typ": "Bundesoberbehörde",
    "rechtsform": "Bundesoberbehörde",
    "ebene": "Bund",
    "sitz": "Wiesbaden",
    "bundesland": "Hessen",
    "gruendungsjahr": 1953,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Amtliche Statistik, Wirtschaftsstatistik, Bevölkerungsstatistik, Zensus, Mikrozensus",
    "website": "https://www.destatis.de",
    "rechtsgrundlage": "Bundesstatistikgesetz (BStatG)",
    "haushalt_mio_eur": get_budget("0614"),
    "beschaeftigte": 2800,
    "ministerium_id": "bmi",
    "beziehungen": [
        {"zu_id": "bmi", "typ": "UNTERSTELLT", "richtung": "eingehend", "seit": 1953}
    ],
    "quellen": ["https://www.destatis.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "thw",
    "name": "Bundesanstalt Technisches Hilfswerk",
    "kuerzel": "THW",
    "typ": "Bundesanstalt",
    "rechtsform": "Bundesanstalt",
    "ebene": "Bund",
    "sitz": "Bonn",
    "bundesland": "Nordrhein-Westfalen",
    "gruendungsjahr": 1950,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Technische Hilfe, Katastrophenschutz, Bergung, Auslandseinsätze, Infrastruktur-Nothilfe",
    "website": "https://www.thw.de",
    "rechtsgrundlage": "THW-Gesetz (THWG)",
    "haushalt_mio_eur": get_budget("0629"),
    "beschaeftigte": 2100,
    "ministerium_id": "bmi",
    "beziehungen": [
        {"zu_id": "bmi", "typ": "UNTERSTELLT", "richtung": "eingehend", "seit": 1950},
        {"zu_id": "bbk", "typ": "KOORDINIERT_MIT", "richtung": "ausgehend", "seit": 2004}
    ],
    "quellen": ["https://www.thw.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "bpb",
    "name": "Bundeszentrale für politische Bildung",
    "kuerzel": "bpb",
    "typ": "Bundesoberbehörde",
    "rechtsform": "Bundesoberbehörde",
    "ebene": "Bund",
    "sitz": "Bonn",
    "bundesland": "Nordrhein-Westfalen",
    "gruendungsjahr": 1952,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Politische Bildung, Demokratieförderung, Publikationen, Medienkompetenz",
    "website": "https://www.bpb.de",
    "rechtsgrundlage": "Erlass über die Bundeszentrale für politische Bildung",
    "haushalt_mio_eur": get_budget("0635"),
    "beschaeftigte": 300,
    "ministerium_id": "bmi",
    "beziehungen": [
        {"zu_id": "bmi", "typ": "UNTERSTELLT", "richtung": "eingehend", "seit": 1952}
    ],
    "quellen": ["https://www.bpb.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "gzd",
    "name": "Generalzolldirektion",
    "kuerzel": "GZD",
    "typ": "Bundesoberbehörde",
    "rechtsform": "Bundesoberbehörde",
    "ebene": "Bund",
    "sitz": "Bonn",
    "bundesland": "Nordrhein-Westfalen",
    "gruendungsjahr": 2016,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Zollverwaltung, Schwarzarbeitbekämpfung, Verbrauchsteuern, Außenwirtschaftsüberwachung",
    "website": "https://www.zoll.de",
    "rechtsgrundlage": "Finanzverwaltungsgesetz (FVG) § 12",
    "haushalt_mio_eur": get_budget("0813"),
    "beschaeftigte": 43000,
    "ministerium_id": "bmf",
    "beziehungen": [
        {"zu_id": "bmf", "typ": "UNTERSTELLT", "richtung": "eingehend", "seit": 2016}
    ],
    "quellen": ["https://www.zoll.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "bzst",
    "name": "Bundeszentralamt für Steuern",
    "kuerzel": "BZSt",
    "typ": "Bundesoberbehörde",
    "rechtsform": "Bundesoberbehörde",
    "ebene": "Bund",
    "sitz": "Bonn",
    "bundesland": "Nordrhein-Westfalen",
    "gruendungsjahr": 2006,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Steuerliche Identifikationsnummern, Umsatzsteuer, zwischenstaatlicher Informationsaustausch",
    "website": "https://www.bzst.de",
    "rechtsgrundlage": "Finanzverwaltungsgesetz (FVG) § 5",
    "haushalt_mio_eur": get_budget("0815"),
    "beschaeftigte": 2200,
    "ministerium_id": "bmf",
    "beziehungen": [
        {"zu_id": "bmf", "typ": "UNTERSTELLT", "richtung": "eingehend", "seit": 2006}
    ],
    "quellen": ["https://www.bzst.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "bafin",
    "name": "Bundesanstalt für Finanzdienstleistungsaufsicht",
    "kuerzel": "BaFin",
    "typ": "Bundesanstalt",
    "rechtsform": "Anstalt des öffentlichen Rechts",
    "ebene": "Bund",
    "sitz": "Bonn",
    "bundesland": "Nordrhein-Westfalen",
    "gruendungsjahr": 2002,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Finanzaufsicht, Bankenaufsicht, Versicherungsaufsicht, Wertpapieraufsicht, Verbraucherschutz",
    "website": "https://www.bafin.de",
    "rechtsgrundlage": "Finanzdienstleistungsaufsichtsgesetz (FinDAG)",
    "haushalt_mio_eur": 450.0,
    "beschaeftigte": 3100,
    "ministerium_id": "bmf",
    "beziehungen": [
        {"zu_id": "bmf", "typ": "RECHTSAUFSICHT", "richtung": "eingehend", "seit": 2002},
        {"zu_id": "dbb", "typ": "KOORDINIERT_MIT", "richtung": "ausgehend", "seit": 2002}
    ],
    "quellen": ["https://www.bafin.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "bima",
    "name": "Bundesanstalt für Immobilienaufgaben",
    "kuerzel": "BImA",
    "typ": "Bundesanstalt",
    "rechtsform": "Anstalt des öffentlichen Rechts",
    "ebene": "Bund",
    "sitz": "Bonn",
    "bundesland": "Nordrhein-Westfalen",
    "gruendungsjahr": 2005,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Immobilienmanagement des Bundes, Verwaltung und Verwertung von Bundesimmobilien",
    "website": "https://www.bundesimmobilien.de",
    "rechtsgrundlage": "Gesetz über die Bundesanstalt für Immobilienaufgaben (BImAG)",
    "haushalt_mio_eur": 3500.0,
    "beschaeftigte": 7200,
    "ministerium_id": "bmf",
    "beziehungen": [
        {"zu_id": "bmf", "typ": "RECHTSAUFSICHT", "richtung": "eingehend", "seit": 2005}
    ],
    "quellen": ["https://www.bundesimmobilien.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "rki",
    "name": "Robert Koch-Institut",
    "kuerzel": "RKI",
    "typ": "Bundesoberbehörde",
    "rechtsform": "Bundesoberbehörde",
    "ebene": "Bund",
    "sitz": "Berlin",
    "bundesland": "Berlin",
    "gruendungsjahr": 1891,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Infektionsschutz, Epidemiologie, Gesundheitsberichterstattung, Bioterrorismus-Abwehr",
    "website": "https://www.rki.de",
    "rechtsgrundlage": "Infektionsschutzgesetz (IfSG) § 4",
    "haushalt_mio_eur": get_budget("1517"),
    "beschaeftigte": 1300,
    "ministerium_id": "bmg",
    "beziehungen": [
        {"zu_id": "bmg", "typ": "UNTERSTELLT", "richtung": "eingehend", "seit": 1994}
    ],
    "quellen": ["https://www.rki.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "pei",
    "name": "Paul-Ehrlich-Institut",
    "kuerzel": "PEI",
    "typ": "Bundesoberbehörde",
    "rechtsform": "Bundesoberbehörde",
    "ebene": "Bund",
    "sitz": "Langen",
    "bundesland": "Hessen",
    "gruendungsjahr": 1972,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Impfstoffe, biomedizinische Arzneimittel, Blutprodukte, Sera, Zulassung und Überwachung",
    "website": "https://www.pei.de",
    "rechtsgrundlage": "Arzneimittelgesetz (AMG), Transfusionsgesetz (TFG)",
    "haushalt_mio_eur": get_budget("1515"),
    "beschaeftigte": 900,
    "ministerium_id": "bmg",
    "beziehungen": [
        {"zu_id": "bmg", "typ": "UNTERSTELLT", "richtung": "eingehend", "seit": 1972}
    ],
    "quellen": ["https://www.pei.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "bzga",
    "name": "Bundeszentrale für gesundheitliche Aufklärung",
    "kuerzel": "BZgA",
    "typ": "Bundesoberbehörde",
    "rechtsform": "Bundesoberbehörde",
    "ebene": "Bund",
    "sitz": "Köln",
    "bundesland": "Nordrhein-Westfalen",
    "gruendungsjahr": 1967,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Gesundheitsaufklärung, Prävention, Suchtprävention, Sexualaufklärung, Organspende",
    "website": "https://www.bzga.de",
    "rechtsgrundlage": "Erlass über die Errichtung der Bundeszentrale für gesundheitliche Aufklärung",
    "haushalt_mio_eur": get_budget("1513"),
    "beschaeftigte": 350,
    "ministerium_id": "bmg",
    "beziehungen": [
        {"zu_id": "bmg", "typ": "UNTERSTELLT", "richtung": "eingehend", "seit": 1967}
    ],
    "quellen": ["https://www.bzga.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "bfarm",
    "name": "Bundesinstitut für Arzneimittel und Medizinprodukte",
    "kuerzel": "BfArM",
    "typ": "Bundesoberbehörde",
    "rechtsform": "Bundesoberbehörde",
    "ebene": "Bund",
    "sitz": "Bonn",
    "bundesland": "Nordrhein-Westfalen",
    "gruendungsjahr": 1994,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Arzneimittelzulassung, Medizinprodukte, Betäubungsmittel, Risikobewertung",
    "website": "https://www.bfarm.de",
    "rechtsgrundlage": "Arzneimittelgesetz (AMG), Medizinprodukterecht-Durchführungsgesetz (MPDG)",
    "haushalt_mio_eur": get_budget("1516"),
    "beschaeftigte": 1350,
    "ministerium_id": "bmg",
    "beziehungen": [
        {"zu_id": "bmg", "typ": "UNTERSTELLT", "richtung": "eingehend", "seit": 1994}
    ],
    "quellen": ["https://www.bfarm.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "kba",
    "name": "Kraftfahrt-Bundesamt",
    "kuerzel": "KBA",
    "typ": "Bundesoberbehörde",
    "rechtsform": "Bundesoberbehörde",
    "ebene": "Bund",
    "sitz": "Flensburg",
    "bundesland": "Schleswig-Holstein",
    "gruendungsjahr": 1951,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Fahrzeugzulassung, Fahreignungsregister, Typgenehmigung, Rückrufe, Statistik",
    "website": "https://www.kba.de",
    "rechtsgrundlage": "Gesetz über die Errichtung eines Kraftfahrt-Bundesamtes (KBAG)",
    "haushalt_mio_eur": get_budget("1215"),
    "beschaeftigte": 1080,
    "ministerium_id": "bmv",
    "beziehungen": [
        {"zu_id": "bmv", "typ": "UNTERSTELLT", "richtung": "eingehend", "seit": 1951}
    ],
    "quellen": ["https://www.kba.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "eba",
    "name": "Eisenbahn-Bundesamt",
    "kuerzel": "EBA",
    "typ": "Bundesoberbehörde",
    "rechtsform": "Bundesoberbehörde",
    "ebene": "Bund",
    "sitz": "Bonn",
    "bundesland": "Nordrhein-Westfalen",
    "gruendungsjahr": 1994,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Eisenbahnaufsicht, Planfeststellung, Sicherheit im Eisenbahnverkehr",
    "website": "https://www.eba.bund.de",
    "rechtsgrundlage": "Gesetz über die Eisenbahnverkehrsverwaltung des Bundes (BEVVG)",
    "haushalt_mio_eur": get_budget("1217"),
    "beschaeftigte": 1200,
    "ministerium_id": "bmv",
    "beziehungen": [
        {"zu_id": "bmv", "typ": "UNTERSTELLT", "richtung": "eingehend", "seit": 1994}
    ],
    "quellen": ["https://www.eba.bund.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "bast",
    "name": "Bundesanstalt für Straßenwesen",
    "kuerzel": "BASt",
    "typ": "Bundesanstalt",
    "rechtsform": "Bundesanstalt",
    "ebene": "Bund",
    "sitz": "Bergisch Gladbach",
    "bundesland": "Nordrhein-Westfalen",
    "gruendungsjahr": 1951,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Straßenverkehrssicherheit, Straßenbautechnik, Brückenbau, Fahrzeugtechnik, Verkehrsforschung",
    "website": "https://www.bast.de",
    "rechtsgrundlage": "Gesetz über die Errichtung der Bundesanstalt für Straßenwesen",
    "haushalt_mio_eur": get_budget("1214"),
    "beschaeftigte": 380,
    "ministerium_id": "bmv",
    "beziehungen": [
        {"zu_id": "bmv", "typ": "UNTERSTELLT", "richtung": "eingehend", "seit": 1951}
    ],
    "quellen": ["https://www.bast.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "uba",
    "name": "Umweltbundesamt",
    "kuerzel": "UBA",
    "typ": "Bundesoberbehörde",
    "rechtsform": "Bundesoberbehörde",
    "ebene": "Bund",
    "sitz": "Dessau-Roßlau",
    "bundesland": "Sachsen-Anhalt",
    "gruendungsjahr": 1974,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Umweltschutz, Emissionshandel, Luftqualität, Wasserwirtschaft, Abfallwirtschaft, Klimaschutz",
    "website": "https://www.umweltbundesamt.de",
    "rechtsgrundlage": "Gesetz über die Errichtung eines Umweltbundesamtes",
    "haushalt_mio_eur": get_budget("1613"),
    "beschaeftigte": 1600,
    "ministerium_id": "bmuv",
    "beziehungen": [
        {"zu_id": "bmuv", "typ": "UNTERSTELLT", "richtung": "eingehend", "seit": 1986}
    ],
    "quellen": ["https://www.umweltbundesamt.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "bfn",
    "name": "Bundesamt für Naturschutz",
    "kuerzel": "BfN",
    "typ": "Bundesamt",
    "rechtsform": "Bundesoberbehörde",
    "ebene": "Bund",
    "sitz": "Bonn",
    "bundesland": "Nordrhein-Westfalen",
    "gruendungsjahr": 1993,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Naturschutz, Biodiversität, Artenschutz, Landschaftspflege, Meeresschutz",
    "website": "https://www.bfn.de",
    "rechtsgrundlage": "Bundesnaturschutzgesetz (BNatSchG)",
    "haushalt_mio_eur": get_budget("1614"),
    "beschaeftigte": 430,
    "ministerium_id": "bmuv",
    "beziehungen": [
        {"zu_id": "bmuv", "typ": "UNTERSTELLT", "richtung": "eingehend", "seit": 1993}
    ],
    "quellen": ["https://www.bfn.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "base",
    "name": "Bundesamt für die Sicherheit der nuklearen Entsorgung",
    "kuerzel": "BASE",
    "typ": "Bundesamt",
    "rechtsform": "Bundesoberbehörde",
    "ebene": "Bund",
    "sitz": "Berlin",
    "bundesland": "Berlin",
    "gruendungsjahr": 2014,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Nukleare Entsorgungssicherheit, Endlagersuche, Zwischenlagerüberwachung, Genehmigungen",
    "website": "https://www.base.bund.de",
    "rechtsgrundlage": "Gesetz zur Errichtung eines Bundesamtes für kerntechnische Entsorgungssicherheit",
    "haushalt_mio_eur": get_budget("1615"),
    "beschaeftigte": 450,
    "ministerium_id": "bmuv",
    "beziehungen": [
        {"zu_id": "bmuv", "typ": "UNTERSTELLT", "richtung": "eingehend", "seit": 2014}
    ],
    "quellen": ["https://www.base.bund.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "bnetza",
    "name": "Bundesnetzagentur",
    "kuerzel": "BNetzA",
    "typ": "Bundesoberbehörde",
    "rechtsform": "Bundesoberbehörde",
    "ebene": "Bund",
    "sitz": "Bonn",
    "bundesland": "Nordrhein-Westfalen",
    "gruendungsjahr": 1998,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Regulierung Telekommunikation, Energie, Post, Eisenbahnen, Netzausbau",
    "website": "https://www.bundesnetzagentur.de",
    "rechtsgrundlage": "Gesetz über die Bundesnetzagentur (BNetzAG), Telekommunikationsgesetz, Energiewirtschaftsgesetz",
    "haushalt_mio_eur": get_budget("0918"),
    "beschaeftigte": 3000,
    "ministerium_id": "bmwi",
    "beziehungen": [
        {"zu_id": "bmwi", "typ": "UNTERSTELLT", "richtung": "eingehend", "seit": 2005}
    ],
    "quellen": ["https://www.bundesnetzagentur.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "bkarta",
    "name": "Bundeskartellamt",
    "kuerzel": "BKartA",
    "typ": "Bundesoberbehörde",
    "rechtsform": "Bundesoberbehörde",
    "ebene": "Bund",
    "sitz": "Bonn",
    "bundesland": "Nordrhein-Westfalen",
    "gruendungsjahr": 1958,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Wettbewerbsschutz, Kartellrecht, Fusionskontrolle, Missbrauchsaufsicht, Vergaberecht",
    "website": "https://www.bundeskartellamt.de",
    "rechtsgrundlage": "Gesetz gegen Wettbewerbsbeschränkungen (GWB)",
    "haushalt_mio_eur": get_budget("0917"),
    "beschaeftigte": 402,
    "ministerium_id": "bmwi",
    "beziehungen": [
        {"zu_id": "bmwi", "typ": "UNTERSTELLT", "richtung": "eingehend", "seit": 1958}
    ],
    "quellen": ["https://www.bundeskartellamt.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "ptb",
    "name": "Physikalisch-Technische Bundesanstalt",
    "kuerzel": "PTB",
    "typ": "Bundesoberbehörde",
    "rechtsform": "Bundesoberbehörde",
    "ebene": "Bund",
    "sitz": "Braunschweig",
    "bundesland": "Niedersachsen",
    "gruendungsjahr": 1887,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Metrologie, Messwesen, physikalische Grundlagen, Eichrecht, technische Sicherheit",
    "website": "https://www.ptb.de",
    "rechtsgrundlage": "Gesetz über die Physikalisch-Technische Bundesanstalt",
    "haushalt_mio_eur": get_budget("0913"),
    "beschaeftigte": 2116,
    "ministerium_id": "bmwi",
    "beziehungen": [
        {"zu_id": "bmwi", "typ": "UNTERSTELLT", "richtung": "eingehend", "seit": 1887}
    ],
    "quellen": ["https://www.ptb.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "mad",
    "name": "Militärischer Abschirmdienst",
    "kuerzel": "MAD",
    "typ": "Bundesamt",
    "rechtsform": "Dienststelle der Bundeswehrverwaltung",
    "ebene": "Bund",
    "sitz": "Köln",
    "bundesland": "Nordrhein-Westfalen",
    "gruendungsjahr": 1956,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Militärischer Nachrichtendienst, Spionageabwehr Bundeswehr, Extremismuserkennung, Sicherheitsüberprüfungen",
    "website": "https://www.bundeswehr.de/de/organisation/weitere-bmvg-dienststellen/mad-amt-fuer-den-militaerischen-abschirmdienst",
    "rechtsgrundlage": "MAD-Gesetz (MADG)",
    "haushalt_mio_eur": get_budget("1414"),
    "beschaeftigte": 1300,
    "ministerium_id": "bmvg",
    "beziehungen": [
        {"zu_id": "bmvg", "typ": "UNTERSTELLT", "richtung": "eingehend", "seit": 1956}
    ],
    "quellen": ["https://www.bundeswehr.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "baaInBw",
    "name": "Bundesamt für Ausrüstung, Informationstechnik und Nutzung der Bundeswehr",
    "kuerzel": "BAAINBw",
    "typ": "Bundesamt",
    "rechtsform": "Dienststelle der Bundeswehrverwaltung",
    "ebene": "Bund",
    "sitz": "Koblenz",
    "bundesland": "Rheinland-Pfalz",
    "gruendungsjahr": 2012,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Rüstung, IT der Bundeswehr, Beschaffung, Nutzungsmanagement, Materialerhaltung",
    "website": "https://www.baainbw.de",
    "rechtsgrundlage": "Organisationserlass BMVg",
    "haushalt_mio_eur": None,
    "beschaeftigte": 11000,
    "ministerium_id": "bmvg",
    "beziehungen": [
        {"zu_id": "bmvg", "typ": "UNTERSTELLT", "richtung": "eingehend", "seit": 2012}
    ],
    "quellen": ["https://www.baainbw.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "bibb",
    "name": "Bundesinstitut für Berufsbildung",
    "kuerzel": "BIBB",
    "typ": "Bundesoberbehörde",
    "rechtsform": "Bundesoberbehörde",
    "ebene": "Bund",
    "sitz": "Bonn",
    "bundesland": "Nordrhein-Westfalen",
    "gruendungsjahr": 1970,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Berufsbildungsforschung, Ausbildungsordnungen, Berufsbildungsplanung, duale Ausbildung",
    "website": "https://www.bibb.de",
    "rechtsgrundlage": "Berufsbildungsgesetz (BBiG) § 84-101",
    "haushalt_mio_eur": 75.0,
    "beschaeftigte": 800,
    "ministerium_id": "bmbfsj",
    "beziehungen": [
        {"zu_id": "bmbfsj", "typ": "UNTERSTELLT", "richtung": "eingehend", "seit": 2025}
    ],
    "quellen": ["https://www.bibb.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "baua",
    "name": "Bundesanstalt für Arbeitsschutz und Arbeitsmedizin",
    "kuerzel": "BAuA",
    "typ": "Bundesanstalt",
    "rechtsform": "Bundesanstalt",
    "ebene": "Bund",
    "sitz": "Dortmund",
    "bundesland": "Nordrhein-Westfalen",
    "gruendungsjahr": 1996,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Arbeitsschutz, Arbeitsmedizin, Arbeitssicherheit, Gefahrstoffe, Produktsicherheit",
    "website": "https://www.baua.de",
    "rechtsgrundlage": "Gesetz über die Errichtung der Bundesanstalt für Arbeitsschutz und Arbeitsmedizin",
    "haushalt_mio_eur": get_budget("1113"),
    "beschaeftigte": 650,
    "ministerium_id": "bmas",
    "beziehungen": [
        {"zu_id": "bmas", "typ": "UNTERSTELLT", "richtung": "eingehend", "seit": 1996}
    ],
    "quellen": ["https://www.baua.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "ble",
    "name": "Bundesanstalt für Landwirtschaft und Ernährung",
    "kuerzel": "BLE",
    "typ": "Bundesanstalt",
    "rechtsform": "Bundesanstalt",
    "ebene": "Bund",
    "sitz": "Bonn",
    "bundesland": "Nordrhein-Westfalen",
    "gruendungsjahr": 1995,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Agrarmarktordnung, Ernährungsvorsorge, ländliche Entwicklung, Fischerei, Holzwirtschaft",
    "website": "https://www.ble.de",
    "rechtsgrundlage": "Gesetz über die Errichtung einer Bundesanstalt für Landwirtschaft und Ernährung (BLEG)",
    "haushalt_mio_eur": get_budget("1092"),
    "beschaeftigte": 1800,
    "ministerium_id": "bmelh",
    "beziehungen": [
        {"zu_id": "bmelh", "typ": "UNTERSTELLT", "richtung": "eingehend", "seit": 1995}
    ],
    "quellen": ["https://www.ble.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "bvl",
    "name": "Bundesamt für Verbraucherschutz und Lebensmittelsicherheit",
    "kuerzel": "BVL",
    "typ": "Bundesamt",
    "rechtsform": "Bundesoberbehörde",
    "ebene": "Bund",
    "sitz": "Braunschweig",
    "bundesland": "Niedersachsen",
    "gruendungsjahr": 2002,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Lebensmittelsicherheit, Verbraucherschutz, Pflanzenschutz, Tierarzneimittel, Gentechnik",
    "website": "https://www.bvl.bund.de",
    "rechtsgrundlage": "Gesetz über die Errichtung eines Bundesamtes für Verbraucherschutz und Lebensmittelsicherheit (BVLG)",
    "haushalt_mio_eur": get_budget("1017"),
    "beschaeftigte": 950,
    "ministerium_id": "bmelh",
    "beziehungen": [
        {"zu_id": "bmelh", "typ": "UNTERSTELLT", "richtung": "eingehend", "seit": 2002}
    ],
    "quellen": ["https://www.bvl.bund.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "gba",
    "name": "Generalbundesanwalt beim Bundesgerichtshof",
    "kuerzel": "GBA",
    "typ": "Bundesoberbehörde",
    "rechtsform": "Bundesoberbehörde",
    "ebene": "Bund",
    "sitz": "Karlsruhe",
    "bundesland": "Baden-Württemberg",
    "gruendungsjahr": 1950,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Strafverfolgung bei Staatsschutzsachen, Terrorismus, Völkerstrafrecht, Spionage",
    "website": "https://www.generalbundesanwalt.de",
    "rechtsgrundlage": "Gerichtsverfassungsgesetz (GVG) § 141-152",
    "haushalt_mio_eur": get_budget("0714"),
    "beschaeftigte": 300,
    "ministerium_id": "bmjv",
    "beziehungen": [
        {"zu_id": "bmjv", "typ": "UNTERSTELLT", "richtung": "eingehend", "seit": 1950}
    ],
    "quellen": ["https://www.generalbundesanwalt.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

# ---- GRUPPE 4: Körperschaften des öffentlichen Rechts (4) ----

behoerden.append({
    "id": "ba",
    "name": "Bundesagentur für Arbeit",
    "kuerzel": "BA",
    "typ": "KdöR",
    "rechtsform": "Körperschaft des öffentlichen Rechts",
    "ebene": "Bund",
    "sitz": "Nürnberg",
    "bundesland": "Bayern",
    "gruendungsjahr": 1952,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Arbeitsvermittlung, Arbeitslosenversicherung, Berufsberatung, Arbeitsmarktstatistik",
    "website": "https://www.arbeitsagentur.de",
    "rechtsgrundlage": "Sozialgesetzbuch III (SGB III)",
    "haushalt_mio_eur": 42500.0,
    "beschaeftigte": 113000,
    "ministerium_id": "bmas",
    "beziehungen": [
        {"zu_id": "bmas", "typ": "RECHTSAUFSICHT", "richtung": "eingehend", "seit": 1952}
    ],
    "quellen": ["https://www.arbeitsagentur.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "drv",
    "name": "Deutsche Rentenversicherung Bund",
    "kuerzel": "DRV Bund",
    "typ": "KdöR",
    "rechtsform": "Körperschaft des öffentlichen Rechts",
    "ebene": "Bund",
    "sitz": "Berlin",
    "bundesland": "Berlin",
    "gruendungsjahr": 2005,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Gesetzliche Rentenversicherung, Rehabilitation, Rentenberatung, Beitragseinzug",
    "website": "https://www.deutsche-rentenversicherung.de",
    "rechtsgrundlage": "Sozialgesetzbuch VI (SGB VI)",
    "haushalt_mio_eur": 180000.0,
    "beschaeftigte": 41000,
    "ministerium_id": "bmas",
    "beziehungen": [
        {"zu_id": "bmas", "typ": "RECHTSAUFSICHT", "richtung": "eingehend", "seit": 2005}
    ],
    "quellen": ["https://www.deutsche-rentenversicherung.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "dbb",
    "name": "Deutsche Bundesbank",
    "kuerzel": "BBk",
    "typ": "KdöR",
    "rechtsform": "Körperschaft des öffentlichen Rechts",
    "ebene": "Bund",
    "sitz": "Frankfurt am Main",
    "bundesland": "Hessen",
    "gruendungsjahr": 1957,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Geldpolitik (ESZB), Bankenaufsicht, Zahlungsverkehr, Finanzstabilität, Bargeldversorgung",
    "website": "https://www.bundesbank.de",
    "rechtsgrundlage": "Bundesbankgesetz (BBankG)",
    "haushalt_mio_eur": 1500.0,
    "beschaeftigte": 10200,
    "ministerium_id": None,
    "beziehungen": [
        {"zu_id": "bafin", "typ": "KOORDINIERT_MIT", "richtung": "ausgehend", "seit": 2002}
    ],
    "quellen": ["https://www.bundesbank.de", "https://www.bundeshaushalt.de"],
    "recherche_datum": TODAY
})

behoerden.append({
    "id": "gkv",
    "name": "GKV-Spitzenverband",
    "kuerzel": "GKV-SV",
    "typ": "KdöR",
    "rechtsform": "Körperschaft des öffentlichen Rechts",
    "ebene": "Bund",
    "sitz": "Berlin",
    "bundesland": "Berlin",
    "gruendungsjahr": 2008,
    "aufgeloest": False,
    "aufgeloest_jahr": None,
    "zustaendigkeit": "Interessenvertretung gesetzlicher Krankenkassen, Vertragsverhandlungen, Richtlinien",
    "website": "https://www.gkv-spitzenverband.de",
    "rechtsgrundlage": "Sozialgesetzbuch V (SGB V) § 217a-217f",
    "haushalt_mio_eur": None,
    "beschaeftigte": 530,
    "ministerium_id": "bmg",
    "beziehungen": [
        {"zu_id": "bmg", "typ": "RECHTSAUFSICHT", "richtung": "eingehend", "seit": 2008}
    ],
    "quellen": ["https://www.gkv-spitzenverband.de"],
    "recherche_datum": TODAY
})


# ============================================================
# Write individual JSON files
# ============================================================
fortschritt = {"erledigt": [], "offen": [b["id"] for b in behoerden], "fehler": []}

print("Generiere %d Behörden-Dateien..." % len(behoerden))

for b in behoerden:
    filepath = os.path.join(BEHOERDEN_DIR, b["id"] + ".json")
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(b, f, ensure_ascii=False, indent=2)
    fortschritt["erledigt"].append(b["id"])
    fortschritt["offen"].remove(b["id"])
    print("✓ %s" % b["id"], end="  ")

print("\n")

# ============================================================
# Write aggregated files
# ============================================================

# fortschritt.json
with open(os.path.join(BASE_DIR, "fortschritt.json"), "w", encoding="utf-8") as f:
    json.dump(fortschritt, f, ensure_ascii=False, indent=2)
print("✓ fortschritt.json")

# alle_behoerden.json
with open(os.path.join(BASE_DIR, "alle_behoerden.json"), "w", encoding="utf-8") as f:
    json.dump(behoerden, f, ensure_ascii=False, indent=2)
print("✓ alle_behoerden.json")

# beziehungen.json - flat list of all relationships
alle_beziehungen = []
for b in behoerden:
    for bez in b.get("beziehungen", []):
        if bez["richtung"] == "ausgehend":
            alle_beziehungen.append({
                "von": b["id"],
                "zu": bez["zu_id"],
                "typ": bez["typ"],
                "seit": bez.get("seit")
            })
        else:
            alle_beziehungen.append({
                "von": bez["zu_id"],
                "zu": b["id"],
                "typ": bez["typ"],
                "seit": bez.get("seit")
            })

with open(os.path.join(BASE_DIR, "beziehungen.json"), "w", encoding="utf-8") as f:
    json.dump(alle_beziehungen, f, ensure_ascii=False, indent=2)
print("✓ beziehungen.json (%d Beziehungen)" % len(alle_beziehungen))

# fehler.json
with open(os.path.join(BASE_DIR, "fehler.json"), "w", encoding="utf-8") as f:
    json.dump(fortschritt["fehler"], f, ensure_ascii=False, indent=2)
print("✓ fehler.json")

# ============================================================
# README.md with statistics
# ============================================================
fields = ["id", "name", "kuerzel", "typ", "rechtsform", "ebene", "sitz", "bundesland",
          "gruendungsjahr", "aufgeloest", "zustaendigkeit", "website", "rechtsgrundlage",
          "haushalt_mio_eur", "beschaeftigte", "ministerium_id"]

field_stats = {}
for field in fields:
    filled = sum(1 for b in behoerden if b.get(field) is not None)
    field_stats[field] = (filled, len(behoerden), round(filled / len(behoerden) * 100, 1))

# Count by type
typen = {}
for b in behoerden:
    t = b["typ"]
    typen[t] = typen.get(t, 0) + 1

# Count by Bundesland
bundeslaender = {}
for b in behoerden:
    bl = b["bundesland"]
    bundeslaender[bl] = bundeslaender.get(bl, 0) + 1

readme = """# Bundesbehörden Datenbank

## Überblick
- **Gesamtanzahl Behörden:** %d
- **Recherche-Datum:** %s
- **Datenquellen:** Bundeshaushalt 2025, Bundesbehörden-Verzeichnis, offizielle Websites
- **Beziehungen:** %d

## Verteilung nach Typ
| Typ | Anzahl |
|-----|--------|
%s

## Verteilung nach Bundesland
| Bundesland | Anzahl |
|------------|--------|
%s

## Feldvollständigkeit
| Feld | Befüllt | Gesamt | Vollständigkeit |
|------|---------|--------|-----------------|
%s

## Dateien
| Datei | Beschreibung |
|-------|--------------|
| `behoerden/*.json` | Einzeldateien pro Behörde (%d Dateien) |
| `alle_behoerden.json` | Alle Behörden als Array (Import-ready) |
| `beziehungen.json` | Flache Liste aller Beziehungen |
| `fortschritt.json` | Fortschritt der Recherche |
| `fehler.json` | Nicht vollständig recherchierte IDs |

## Schema
Jede Behörde enthält folgende Felder:
- `id` - Eindeutiger Identifier (lowercase)
- `name` - Offizielle Bezeichnung
- `kuerzel` - Abkürzung
- `typ` - Verfassungsorgan / Ministerium / Bundesoberbehörde / etc.
- `rechtsform` - Rechtsform
- `ebene` - Verwaltungsebene (Bund)
- `sitz` - Hauptsitz (Stadt)
- `bundesland` - Bundesland des Sitzes
- `gruendungsjahr` - Gründungsjahr
- `zustaendigkeit` - Sachgebiet
- `website` - Offizielle Website
- `rechtsgrundlage` - Gesetzliche Grundlage
- `haushalt_mio_eur` - Haushalt in Mio. EUR (2025)
- `beschaeftigte` - Anzahl Beschäftigte
- `ministerium_id` - Übergeordnetes Ministerium (ID)
- `beziehungen` - Organisationsbeziehungen
""" % (
    len(behoerden),
    TODAY,
    len(alle_beziehungen),
    "\n".join("| %s | %d |" % (t, c) for t, c in sorted(typen.items(), key=lambda x: -x[1])),
    "\n".join("| %s | %d |" % (bl, c) for bl, c in sorted(bundeslaender.items(), key=lambda x: -x[1])),
    "\n".join("| `%s` | %d | %d | %.1f%% |" % (f, field_stats[f][0], field_stats[f][1], field_stats[f][2]) for f in fields),
    len(behoerden)
)

with open(os.path.join(BASE_DIR, "README.md"), "w", encoding="utf-8") as f:
    f.write(readme)
print("✓ README.md")

print("\n=== FERTIG: %d Behörden generiert, %d Fehler ===" % (len(behoerden), len(fortschritt["fehler"])))
