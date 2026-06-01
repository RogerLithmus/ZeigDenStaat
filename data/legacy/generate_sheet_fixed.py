# -*- coding: utf-8 -*-
import pandas as pd
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from difflib import SequenceMatcher
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Define paths
csv_path = r"c:\Projects\ZeigDenStaat\data\legacy\resolved_mappings.csv"
output_path = r"c:\Projects\ZeigDenStaat\data\Bundesbehörden_Verzeichnis.xlsx"

print("Starting spreadsheet generation with corrected mappings...")

# Load mappings
df = pd.read_csv(csv_path, sep=';', encoding='utf-8')

# Curated data for the top entities (keyed by their original key)
curated_data_raw = {
    2: {
        "Budget": 1300.0, "Employees": 3200, "Headquarters": "Berlin", "LegalForm": "Oberstes Verfassungsorgan-Verwaltung",
        "Website": "www.bundestag.de", "Anmerkung": "Verwaltung des Deutschen Bundestages"
    },
    3: {
        "Budget": 47.0, "Employees": 220, "Headquarters": "Berlin", "LegalForm": "Oberste Bundesbehörde",
        "Website": "www.bundespraesident.de", "Anmerkung": "Unterstützt das Staatsoberhaupt"
    },
    72: {
        "Budget": 3950.0, "Employees": 850, "Headquarters": "Berlin", "LegalForm": "Oberste Bundesbehörde",
        "Website": "www.bundeskanzleramt.de", "Anmerkung": "Leitung der Bundesregierung"
    },
    84: {
        "Budget": 9100.0, "Employees": 2200, "Headquarters": "Berlin / Bonn", "LegalForm": "Oberste Bundesbehörde",
        "Website": "www.bundesfinanzministerium.de", "Anmerkung": "Ressortbudget operational"
    },
    85: {
        "Budget": 1200.0, "Employees": 1000, "Headquarters": "Berlin", "LegalForm": "Oberste Bundesbehörde",
        "Website": "www.bmj.de", "Anmerkung": "Bundesministerium der Justiz"
    },
    86: {
        "Budget": 51800.0, "Employees": 2500, "Headquarters": "Bonn / Berlin", "LegalForm": "Oberste Bundesbehörde",
        "Website": "www.bmvg.de", "Anmerkung": "Zuzüglich 19,8 Mrd. € Sondervermögen, ca. 180.000 Soldaten"
    },
    87: {
        "Budget": 13300.0, "Employees": 2100, "Headquarters": "Berlin / Bonn", "LegalForm": "Oberste Bundesbehörde",
        "Website": "www.bmi.bund.de", "Anmerkung": "Bundesministerium des Innern"
    },
    88: {
        "Budget": 171200.0, "Employees": 1300, "Headquarters": "Berlin / Bonn", "LegalForm": "Oberste Bundesbehörde",
        "Website": "www.bmas.de", "Anmerkung": "Höchstes Budget im Bundeshaushalt (Soziales)"
    },
    89: {
        "Budget": 21500.0, "Employees": 1100, "Headquarters": "Bonn / Berlin", "LegalForm": "Oberste Bundesbehörde",
        "Website": "www.bmbf.de", "Anmerkung": "Bundesministerium für Bildung und Forschung"
    },
    90: {
        "Budget": 7100.0, "Employees": 1000, "Headquarters": "Bonn / Berlin", "LegalForm": "Oberste Bundesbehörde",
        "Website": "www.bmel.de", "Anmerkung": "Ernährung und Landwirtschaft"
    },
    91: {
        "Budget": 14300.0, "Employees": 950, "Headquarters": "Berlin / Bonn", "LegalForm": "Oberste Bundesbehörde",
        "Website": "www.bmfsfj.de", "Anmerkung": "Familie, Senioren, Frauen, Jugend"
    },
    92: {
        "Budget": 16200.0, "Employees": 1000, "Headquarters": "Bonn / Berlin", "LegalForm": "Oberste Bundesbehörde",
        "Website": "www.bundesgesundheitsministerium.de", "Anmerkung": "Gesundheit und Pflege"
    },
    93: {
        "Budget": 2400.0, "Employees": 1200, "Headquarters": "Bonn / Berlin", "LegalForm": "Oberste Bundesbehörde",
        "Website": "www.bmuv.de", "Anmerkung": "Umwelt, Naturschutz, nukleare Sicherheit"
    },
    94: {
        "Budget": 38700.0, "Employees": 1600, "Headquarters": "Berlin / Bonn", "LegalForm": "Oberste Bundesbehörde",
        "Website": "www.bmdv.bund.de", "Anmerkung": "Digitales und Verkehr"
    },
    51919: {
        "Budget": 38700.0, "Employees": 1600, "Headquarters": "Berlin / Bonn", "LegalForm": "Oberste Bundesbehörde",
        "Website": "www.bmdv.bund.de", "Anmerkung": "Digitales und Verkehr"
    },
    95: {
        "Budget": 11200.0, "Employees": 1100, "Headquarters": "Bonn / Berlin", "LegalForm": "Oberste Bundesbehörde",
        "Website": "www.bmz.de", "Anmerkung": "Wirtschaftliche Zusammenarbeit"
    },
    96: {
        "Budget": 14500.0, "Employees": 2300, "Headquarters": "Berlin / Bonn", "LegalForm": "Oberste Bundesbehörde",
        "Website": "www.bmwk.de", "Anmerkung": "Wirtschaft und Klimaschutz"
    },
    49833: {
        "Budget": 7300.0, "Employees": 600, "Headquarters": "Bonn / Berlin", "LegalForm": "Oberste Bundesbehörde",
        "Website": "www.bmwsb.bund.de", "Anmerkung": "Wohnen, Stadtentwicklung und Bauwesen"
    },
    155: {
        "Budget": 2300.0, "Employees": 450, "Headquarters": "Berlin", "LegalForm": "Oberste Bundesbehörde",
        "Website": "www.kulturstaatsministerin.de", "Anmerkung": "Kultur und Medien"
    },
    119: {
        "Budget": 195.0, "Employees": 600, "Headquarters": "Bonn", "LegalForm": "Oberste Bundesbehörde (Sonderstellung)",
        "Website": "www.bundesrechnungshof.de", "Anmerkung": "Prüfung der Bundesfinanzen"
    },
    118: {
        "Budget": 42.0, "Employees": 200, "Headquarters": "Berlin", "LegalForm": "Oberstes Verfassungorgan-Verwaltung",
        "Website": "www.bundesrat.de", "Anmerkung": "Ländervertretung"
    },
    317: {
        "Budget": 1500.0, "Employees": 10200, "Headquarters": "Frankfurt am Main", "LegalForm": "Juristische Person des öffentlichen Rechts (Sonderform)",
        "Website": "www.bundesbank.de", "Anmerkung": "Notenbank der Bundesrepublik"
    },
    114: {
        "Budget": 2400.0, "Employees": 54000, "Headquarters": "Potsdam", "LegalForm": "Bundesoberbehörde / Sonderpolizei",
        "Website": "www.bundespolizei.de", "Anmerkung": "Inklusive ca. 44.000 Polizeikräfte"
    },
    296: {
        "Budget": 520.0, "Employees": 2100, "Headquarters": "Bonn", "LegalForm": "Bundesoberbehörde",
        "Website": "www.thw.de", "Anmerkung": "Hauptamtlich. Unterstützt durch ca. 88.000 Ehrenamtliche"
    },
    42: {
        "Budget": 290.0, "Employees": 3000, "Headquarters": "Bonn", "LegalForm": "Bundesoberbehörde",
        "Website": "www.bundesnetzagentur.de", "Anmerkung": "Regulierung von Strom, Gas, Telekom, Post, Eisenbahn"
    },
    334: {
        "Budget": 1400.0, "Employees": 8500, "Headquarters": "Wiesbaden", "LegalForm": "Bundesoberbehörde",
        "Website": "www.bka.de", "Anmerkung": "Zentralstelle der deutschen Polizei"
    },
    350: {
        "Budget": 220.0, "Employees": 1400, "Headquarters": "Bonn", "LegalForm": "Bundesoberbehörde",
        "Website": "www.bsi.bund.de", "Anmerkung": "Nationale Sicherheitsbehörde für IT"
    },
    331: {
        "Budget": 480.0, "Employees": 4200, "Headquarters": "Köln", "LegalForm": "Bundesoberbehörde",
        "Website": "www.verfassungsschutz.de", "Anmerkung": "Inlandsnachrichtendienst"
    },
    328: {
        "Budget": 1100.0, "Employees": 8000, "Headquarters": "Nürnberg", "LegalForm": "Bundesoberbehörde",
        "Website": "www.bamf.de", "Anmerkung": "Asyl, Migration und Integration"
    },
    352: {
        "Budget": 310.0, "Employees": 2800, "Headquarters": "Wiesbaden", "LegalForm": "Bundesoberbehörde",
        "Website": "www.destatis.de", "Anmerkung": "Statistisches Bundesamt"
    },
    282: {
        "Budget": 1100.0, "Employees": 4000, "Headquarters": "Bonn", "LegalForm": "Bundesoberbehörde",
        "Website": "www.itzbund.de", "Anmerkung": "Zentraler IT-Dienstleister der Bundesverwaltung"
    },
    285: {
        "Budget": 3500.0, "Employees": 7200, "Headquarters": "Bonn", "LegalForm": "Anstalt des öffentlichen Rechts",
        "Website": "www.bundesimmobilien.de", "Anmerkung": "Verwaltung des Bundesimmobilieneigentums"
    },
    414: {
        "Budget": 42500.0, "Employees": 113000, "Headquarters": "Nürnberg", "LegalForm": "Körperschaft des öffentlichen Rechts",
        "Website": "www.arbeitsagentur.de", "Anmerkung": "Größte Dienststelle des Bundes nach Mitarbeitern"
    },
    417: {
        "Budget": 180000.0, "Employees": 41000, "Headquarters": "Berlin", "LegalForm": "Körperschaft des öffentlichen Rechts",
        "Website": "www.deutsche-rentenversicherung.de", "Anmerkung": "Träger der gesetzlichen Rentenversicherung"
    },
    289: {
        "Budget": 3200.0, "Employees": 8200, "Headquarters": "Frankfurt am Main", "LegalForm": "Anstalt des öffentlichen Rechts",
        "Website": "www.kfw.de", "Anmerkung": "Kreditanstalt für Wiederaufbau (Förderbank)"
    },
    571: {
        "Budget": 180.0, "Employees": 1300, "Headquarters": "Berlin", "LegalForm": "Bundesoberbehörde",
        "Website": "www.rki.de", "Anmerkung": "Gesundheitsforschung und Infektionsschutz"
    },
    572: {
        "Budget": 110.0, "Employees": 900, "Headquarters": "Langen", "LegalForm": "Bundesoberbehörde",
        "Website": "www.pei.de", "Anmerkung": "Bundesinstitut für Impfstoffe und biomedizinische Arzneimittel"
    },
    636: {
        "Budget": 160.0, "Employees": 1600, "Headquarters": "Dessau-Roßlau", "LegalForm": "Bundesoberbehörde",
        "Website": "www.umweltbundesamt.de", "Anmerkung": "Zentrale Umweltbehörde"
    },
    256: {
        "Budget": 105.0, "Employees": 1400, "Headquarters": "Eschborn", "LegalForm": "Bundesoberbehörde",
        "Website": "www.bafa.de", "Anmerkung": "Wirtschafts- und Ausfuhrkontrolle"
    },
    708: {
        "Budget": 65.0, "Employees": 1500, "Headquarters": "Bonn / Berlin", "LegalForm": "Bundesoberbehörde",
        "Website": "www.bbr.bund.de", "Anmerkung": "Bundesamt für Bauwesen und Raumordnung"
    },
    595: {
        "Budget": 390.0, "Employees": 2300, "Headquarters": "Offenbach am Main", "LegalForm": "Anstalt des öffentlichen Rechts",
        "Website": "www.dwd.de", "Anmerkung": "Meteorologische Dienstleistungen"
    },
    596: {
        "Budget": 85.0, "Employees": 1200, "Headquarters": "Bonn", "LegalForm": "Bundesoberbehörde",
        "Website": "www.eba.bund.de", "Anmerkung": "Aufsichtsbehörde für Schienenbahnen"
    },
    58: {
        "Budget": 3100.0, "Employees": 43000, "Headquarters": "Bonn", "LegalForm": "Bundesoberbehörde",
        "Website": "www.zoll.de", "Anmerkung": "Leitung der gesamten Zollverwaltung"
    },
    283: {
        "Budget": 450.0, "Employees": 3100, "Headquarters": "Bonn / Frankfurt am Main", "LegalForm": "Anstalt des öffentlichen Rechts",
        "Website": "www.bafin.de", "Anmerkung": "Finanzdienstleistungsaufsicht"
    },
    281: {
        "Budget": 190.0, "Employees": 2200, "Headquarters": "Bonn", "LegalForm": "Bundesoberbehörde",
        "Website": "www.bzst.de", "Anmerkung": "Zentralamt für Steuern"
    },
    741: {
        "Budget": 400.0, "Employees": 3000, "Headquarters": "Bonn / Berlin", "LegalForm": "Rundfunkanstalt des Bundes",
        "Website": "www.dw.com", "Anmerkung": "Auslandsrundfunk der Bundesrepublik"
    },
    755: {
        "Budget": 380.0, "Employees": 2000, "Headquarters": "Berlin", "LegalForm": "Stiftung des öffentlichen Rechts",
        "Website": "www.preussischer-kulturbesitz.de", "Anmerkung": "Eine der weltweit größten Kultureinrichtungen"
    },
    757: {
        "Budget": 15.0, "Employees": 45, "Headquarters": "Berlin", "LegalForm": "Stiftung des öffentlichen Rechts",
        "Website": "www.bundesstiftung-aufarbeitung.de", "Anmerkung": "Erforschung der DDR-Vergangenheit"
    },
    750: {
        "Budget": 48.0, "Employees": 250, "Headquarters": "Berlin", "LegalForm": "Stiftung des öffentlichen Rechts",
        "Website": "www.dhm.de", "Anmerkung": "Deutsches Historisches Museum"
    },
    753: {
        "Budget": 36.0, "Employees": 230, "Headquarters": "Berlin", "LegalForm": "Stiftung des öffentlichen Rechts",
        "Website": "www.jmberlin.de", "Anmerkung": "Jüdisches Museum Berlin"
    },
    710: {
        "Budget": 4.5, "Employees": 25, "Headquarters": "Potsdam", "LegalForm": "Stiftung des öffentlichen Rechts",
        "Website": "www.bundesstiftung-baukultur.de", "Anmerkung": "Förderung der Baukultur"
    },
    761: {
        "Budget": 40.0, "Employees": 60, "Headquarters": "Halle an der Saale", "LegalForm": "Stiftung des Privatrechts (100% Bund)",
        "Website": "www.kulturstiftung-des-bundes.de", "Anmerkung": "Förderung innovativer Kunst- und Kulturprojekte"
    },
    400: {
        "Budget": 7.0, "Employees": 35, "Headquarters": "Karlsruhe / Leipzig", "LegalForm": "Stiftung des öffentlichen Rechts",
        "Website": "www.stiftung-forum-recht.de", "Anmerkung": "Vermittlung von Recht und Rechtsstaatlichkeit"
    },
    402: {
        "Budget": 1.5, "Employees": 8, "Headquarters": "Leipzig", "LegalForm": "Stiftung des Privatrechts",
        "Website": "www.stiftungdatenschutz.org", "Anmerkung": "Förderung des Datenschutzes"
    },
    546: {
        "Budget": 30.0, "Employees": 75, "Headquarters": "Neustrelitz", "LegalForm": "Stiftung des öffentlichen Rechts",
        "Website": "www.deutsche-stiftung-engagement-und-ehrenamt.de", "Anmerkung": "Förderung von Ehrenamt und Engagement"
    },
    304: {
        "Budget": 12.0, "Employees": 65, "Headquarters": "Berlin", "LegalForm": "Stiftung des öffentlichen Rechts",
        "Website": "www.stiftung-evz.de", "Anmerkung": "Stiftung Erinnerung, Verantwortung und Zukunft"
    },
    626: {
        "Budget": 52000.0, "Employees": 338000, "Headquarters": "Berlin", "LegalForm": "Aktiengesellschaft (100% Bund)",
        "Website": "www.bahn.de", "Anmerkung": "Größtes Transport- und Eisenbahninfrastrukturunternehmen"
    },
    627: {
        "Budget": 1300.0, "Employees": 5600, "Headquarters": "Langen", "LegalForm": "GmbH (100% Bund)",
        "Website": "www.dfs.de", "Anmerkung": "Flugsicherungsdienstleistungen in Deutschland"
    },
    628: {
        "Budget": 6200.0, "Employees": 13000, "Headquarters": "Berlin", "LegalForm": "GmbH (100% Bund)",
        "Website": "www.autobahn.de", "Anmerkung": "Planung, Bau und Betrieb aller Bundesautobahnen"
    },
    702: {
        "Budget": 4000.0, "Employees": 25000, "Headquarters": "Bonn / Eschborn", "LegalForm": "GmbH (100% Bund)",
        "Website": "www.giz.de", "Anmerkung": "Deutsche Gesellschaft für Internationale Zusammenarbeit"
    },
    312: {
        "Budget": 780.0, "Employees": 3300, "Headquarters": "Berlin", "LegalForm": "GmbH (100% Bund)",
        "Website": "www.bundesdruckerei.de", "Anmerkung": "Sicherheitsdokumente und digitale Identitäten"
    },
    376: {
        "Budget": 45.0, "Employees": 110, "Headquarters": "Berlin", "LegalForm": "gGmbH (100% Bund)",
        "Website": "www.zif-berlin.org", "Anmerkung": "Zentrum für Internationale Friedenseinsätze"
    },
    503: {
        "Budget": 1600.0, "Employees": 7000, "Headquarters": "Meckenheim", "LegalForm": "GmbH (100% Bund)",
        "Website": "www.bwi.de", "Anmerkung": "IT-Systemhaus der Bundeswehr und des Bundes"
    },
    501: {
        "Budget": 280.0, "Employees": 1400, "Headquarters": "Köln", "LegalForm": "GmbH (100% Bund)",
        "Website": "www.bwbm.de", "Anmerkung": "Bekleidungsausstattung für die Streitkräfte"
    },
    505: {
        "Budget": 420.0, "Employees": 2200, "Headquarters": "Bonn", "LegalForm": "GmbH (100% Bund)",
        "Website": "www.hilgmbh.de", "Anmerkung": "Instandhaltung von Landsystemen der Bundeswehr"
    },
    631: {
        "Budget": 650.0, "Employees": 650, "Headquarters": "Berlin", "LegalForm": "GmbH (100% Bund)",
        "Website": "www.toll-collect.de", "Anmerkung": "Betrieb des Lkw-Mautsystems"
    },
    662: {
        "Budget": 920.0, "Employees": 2400, "Headquarters": "Peine", "LegalForm": "GmbH (100% Bund)",
        "Website": "www.bge.de", "Anmerkung": "Suche und Betrieb von Endlagern für radioaktive Abfälle"
    },
    661: {
        "Budget": 180.0, "Employees": 850, "Headquarters": "Essen", "LegalForm": "GmbH (100% Bund)",
        "Website": "www.bgz.de", "Anmerkung": "Zwischenlagerung hochradioaktiver Abfälle"
    },
    663: {
        "Budget": 60.0, "Employees": 800, "Headquarters": "Berlin", "LegalForm": "gGmbH (100% Bund)",
        "Website": "www.z-u-g.org", "Anmerkung": "Projektträger für Umwelt- und Klimaschutz"
    },
    676: {
        "Budget": 150.0, "Employees": 50, "Headquarters": "Leipzig", "LegalForm": "GmbH (100% Bund)",
        "Website": "www.sprind.org", "Anmerkung": "Bundesagentur für Sprunginnovationen"
    },
    700: {
        "Budget": 4000.0, "Employees": 25000, "Headquarters": "Bonn / Eschborn", "LegalForm": "GmbH (100% Bund)",
        "Website": "www.giz.de", "Anmerkung": "Entwicklungszusammenarbeit"
    }
}

name_to_original_key = {
    "Deutscher Bundestag": 2,
    "Bundespräsidialamt": 3,
    "Bundeskanzleramt": 72,
    "Bundesministerium der Finanzen": 84,
    "Bundesministerium der Justiz": 85,
    "Bundesministerium der Verteidigung": 86,
    "Bundesministerium des Innern": 87,
    "Bundesministerium für Arbeit und Soziales": 88,
    "Bundesministerium für Bildung und Forschung": 89,
    "Bundesministerium für Ernährung und Landwirtschaft": 90,
    "Bundesministerium für Familie, Senioren, Frauen und Jugend": 91,
    "Bundesministerium für Gesundheit": 92,
    "Bundesministerium für Umwelt, Naturschutz, nukleare Sicherheit und Verbraucherschutz": 93,
    "Bundesministerium für Digitales und Verkehr": 94,
    "Bundesministerium für wirtschaftliche Zusammenarbeit und Entwicklung": 95,
    "Bundesministerium für Wirtschaft und Klimaschutz": 96,
    "Bundesministerium für Wohnen, Stadtentwicklung und Bauwesen": 49833,
    "Beauftragte der Bundesregierung für Kultur und Medien": 155,
    "Bundesrechnungshof": 119,
    "Bundesrat": 118,
    "Deutsche Bundesbank": 317,
    "Bundespolizei (Bundespolizeipräsidium)": 114,
    "Bundesanstalt Technisches Hilfswerk": 296,
    "Bundesnetzagentur": 42,
    "Bundeskriminalamt": 334,
    "Bundesamt für Sicherheit in der Informationstechnik": 350,
    "Bundesamt für Verfassungsschutz": 331,
    "Bundesamt für Migration und Flüchtlinge": 328,
    "Statistisches Bundesamt": 352,
    "Informationstechnikzentrum Bund": 282,
    "Bundesanstalt für Immobilienaufgaben": 285,
    "Bundesagentur für Arbeit": 414,
    "Deutsche Rentenversicherung Bund": 417,
    "Kreditanstalt für Wiederaufbau": 289,
    "Robert Koch-Institut": 571,
    "Paul-Ehrlich-Institut": 572,
    "Umweltbundesamt": 636,
    "Bundesamt für Wirtschaft und Ausfuhrkontrolle": 256,
    "Bundesamt für Bauwesen und Raumordnung": 708,
    "Deutscher Wetterdienst": 595,
    "Eisenbahn-Bundesamt": 596,
    "Generalzolldirektion": 58,
    "Bundesanstalt für Finanzdienstleistungsaufsicht": 283,
    "Bundeszentralamt für Steuern": 281,
    "Deutsche Welle": 741,
    "Stiftung Preußischer Kulturbesitz": 755,
    "Bundesstiftung zur Aufarbeitung der SED-Diktatur": 757,
    "Stiftung Deutsches Historisches Museum": 750,
    "Stiftung Jüdisches Museum Berlin": 753,
    "Bundesstiftung Baukultur": 710,
    "Kulturstiftung des Bundes": 761,
    "Stiftung Forum Recht": 400,
    "Stiftung Datenschutz": 402,
    "Deutsche Stiftung für Engagement und Ehrenamt": 546,
    "Stiftung Erinnerung, Verantwortung und Zukunft": 304,
    "Deutsche Bahn AG": 626,
    "DFS Deutsche Flugsicherung GmbH": 627,
    "Die Autobahn GmbH des Bundes": 628,
    "Deutsche Gesellschaft für Internationale Zusammenarbeit GmbH": 702,
    "Bundesdruckerei Gruppe GmbH": 312,
    "Zentrum für Internationale Friedenseinsätze gGmbH": 376,
    "BWI GmbH": 503,
    "Bw Bekleidungsmanagement GmbH": 501,
    "HIL Heeresinstandsetzungslogistik GmbH": 505,
    "Toll Collect GmbH": 631,
    "Bundesgesellschaft für Endlagerung mbH": 662,
    "BGZ Gesellschaft für Zwischenlagerung mbH": 661,
    "Zukunft – Umwelt – Gesundheit gGmbH": 663,
    "SPRIND GmbH": 676
}

# Resolve actual IDs mapping in df
all_names = df['Name'].tolist()

def find_best_match(target_name):
    for name in all_names:
        name_lower = name.lower()
        if target_name.lower() in name_lower or name_lower in target_name.lower():
            return name
    best_match = None
    best_score = 0.0
    for name in all_names:
        score = SequenceMatcher(None, target_name.lower(), name.lower()).ratio()
        if score > best_score:
            best_score = score
            best_match = name
    if best_score > 0.6:
        return best_match
    return None

# Map actual Id to curated data dict
curated_data = {}
resolved_actual_company_ids = set()

for target_name, original_key in name_to_original_key.items():
    match = find_best_match(target_name)
    if match:
        row = df[df['Name'] == match].iloc[0]
        actual_id = int(row['Id'])
        curated_data[actual_id] = curated_data_raw[original_key]
        
        # If it is a company and one of the special corporate overrides
        if original_key in [626, 627, 628, 702, 312, 376, 503, 501, 505, 631, 662, 661, 663, 676, 700]:
            resolved_actual_company_ids.add(actual_id)
        
        print(f"Mapped Name: '{match}' -> ID: {actual_id}")

major_cities = [
    "Berlin", "Bonn", "Hamburg", "München", "Köln", "Frankfurt", "Stuttgart", "Düsseldorf", 
    "Leipzig", "Dresden", "Hannover", "Nürnberg", "Bremen", "Wiesbaden", "Potsdam", "Karlsruhe", 
    "Langen", "Offenbach", "Peine", "Essen", "Halle", "Neustrelitz", "Meckenheim", "Eschborn", 
    "Flensburg", "Kiel", "Schwerin", "Rostock", "Magdeburg", "Erfurt", "Weimar", "Jena", 
    "Gera", "Chemnitz", "Zwickau", "Plauen", "Görlitz", "Bautzen", "Cottbus", "Koblenz", 
    "Trier", "Kaiserslautern", "Saarbrücken", "Heidelberg", "Mannheim", "Freiburg", "Ulm", 
    "Heilbronn", "Pforzheim", "Reutlingen", "Tübingen", "Konstanz", "Augsburg", "Regensburg", 
    "Erlangen", "Fürth", "Würzburg", "Bamberg", "Bayreuth", "Landshut", "Passau", "Kempten", 
    "Ingolstadt", "Rosenheim", "Duisburg", "Bochum", "Dortmund", "Gelsenkirchen", "Oberhausen", 
    "Mülheim", "Herne", "Hagen", "Hamm", "Münster", "Bielefeld", "Paderborn", "Gütersloh", 
    "Detmold", "Minden", "Herford", "Siegen", "Aachen", "Mönchengladbach", "Krefeld", 
    "Leverkusen", "Solingen", "Remscheid", "Wuppertal", "Bergisch Gladbach", "Troisdorf", 
    "Sankt Augustin", "Hennef", "Königswinter", "Bad Honnef", "Bornheim", "Alfter", "Rheinbach", 
    "Lohmar", "Niederkassel", "Siegburg", "Lübeck", "Neumünster", "Norderstedt", "Elmshorn", 
    "Pinneberg", "Itzehoe", "Rendsburg", "Schleswig", "Eckernförde", "Husum", "Heide", 
    "Ahrensburg", "Reinbek", "Geesthacht", "Mölln", "Ratzeburg", "Bad Oldesloe", "Bad Segeberg", 
    "Kaltenkirchen", "Henstedt-Ulzburg", "Quickborn", "Halstenbek", "Schenefeld", "Wedel", 
    "Uetersen", "Tornesch", "Barmstedt", "Glückstadt", "Brunsbüttel", "Niebüll", "Eutin", 
    "Bad Schwartau", "Timmendorfer Strand", "Scharbeutz", "Malente", "Stralsund", "Greifswald",
    "Güstrow", "Neubrandenburg", "Wismar", "Anklam"
]

def extract_headquarters(name, classification):
    name_str = str(name)
    for city in major_cities:
        if city.lower() in name_str.lower():
            return city
            
    prefixes = [
        "hauptzollamt ", "jobcenter ", "agentur fuer arbeit ", "agentur für arbeit ",
        "bundespolizeiinspektion ", "bundespolizeirevier ", "wasserstrassen- und schifffahrtsamt ",
        "wasserstraßen- und schifffahrtsamt ", "bundespolizeidirektion ", "karrierecenter der bundeswehr ",
        "bundeswehr-dienstleistungszentrum ", "zollfahndungsamt ", "bundespolizeiamt ", "staatsanwaltschaft ",
        "amtsgericht ", "landgericht ", "bundespolizeipraesidium ", "bundespolizeipräsidium "
    ]
    lower_name = name_str.lower()
    for p in prefixes:
        if lower_name.startswith(p):
            res = name_str[len(p):].strip()
            if "(" in res:
                res = res.split("(")[0].strip()
            return res
            
    return "Berlin / Bonn"

# Enrich DataFrame
processed_rows = []
for idx, row in df.iterrows():
    nid = int(row['Id'])
    name = row['Name']
    cls = str(row['Classification']) if not pd.isna(row['Classification']) else ""
    ministry = row['ResolvedMinistry']
    name_lower = name.lower()
    is_company = False
    for term in ["gmbh", "holding", "gesellschaft mit beschr", "transit-film"]:
        if term in name_lower:
            is_company = True
            break
    if " ag" in name_lower or name_lower.endswith(" ag") or " ag." in name_lower or " ag," in name_lower:
        is_company = True
    if nid in resolved_actual_company_ids:
        is_company = True

    if is_company:
        category = "Bundesunternehmen"
        default_lf = "GmbH" if "gmbh" in name_lower else ("AG" if "ag" in name_lower else "Beteiligungsgesellschaft")
    elif "stiftung" in name_lower or "stiftung" in cls.lower() or "stiftungsfonds" in name_lower:
        category = "Bundesstiftung"
        default_lf = "Stiftung des öffentlichen Rechts" if "öffentlich" in cls.lower() else "Stiftung des Privatrechts"
    else:
        category = "Bundesbehörde"
        default_lf = "Bundesbehörde"
        if "körperschaft" in cls.lower() or "koerperschaft" in cls.lower():
            default_lf = "Körperschaft des öffentlichen Rechts"
        elif "anstalt" in cls.lower():
            default_lf = "Anstalt des öffentlichen Rechts"
            
    # Resolve metrics
    budget = None
    employees = None
    hq = "Berlin / Bonn"
    lf = default_lf
    website = ""
    ann = ""
    
    # 1. Curated metrics override
    if nid in curated_data:
        c = curated_data[nid]
        budget = c.get("Budget")
        employees = c.get("Employees")
        hq = c.get("Headquarters")
        lf = c.get("LegalForm")
        website = c.get("Website")
        ann = c.get("Anmerkung", "")
    else:
        # 2. Subordinate programmatic resolution
        hq = extract_headquarters(name, cls)
        
        # Check parent structures
        if "jobcenter" in name_lower or cls.lower() == "jobcenter":
            ann = "Aggregiert unter Bundesagentur für Arbeit (BA)"
            lf = "Dienststelle der BA"
            website = "www.arbeitsagentur.de"
        elif "agentur" in name_lower and ("arbeit" in name_lower or "arbeitsagentur" in name_lower):
            ann = "Aggregiert unter Bundesagentur für Arbeit (BA)"
            lf = "Dienststelle der BA"
            website = "www.arbeitsagentur.de"
        elif "zoll" in name_lower and nid != 58:
            ann = "Aggregiert unter Generalzolldirektion (GZD)"
            lf = "Dienststelle der Bundeszollverwaltung"
            website = "www.zoll.de"
        elif "bundespolizei" in name_lower and nid != 114:
            ann = "Aggregiert unter Bundespolizei (BPOL)"
            lf = "Dienststelle der Bundespolizei"
            website = "www.bundespolizei.de"
        elif "wasserstraße" in name_lower or "wasserstrasse" in name_lower or "schifffahrt" in name_lower or "schiffahrt" in name_lower:
            ann = "Aggregiert unter Generaldirektion Wasserstraßen und Schifffahrt (GDWS)"
            lf = "Dienststelle der WSV"
            website = "www.wsv.de"
        elif "bundeswehr" in name_lower or "karrierecenter" in name_lower or "militär" in name_lower or "militaer" in name_lower or "kommando" in name_lower:
            ann = "Aggregiert unter Bundesministerium der Verteidigung (BMVg)"
            lf = "Dienststelle der Bundeswehrverwaltung"
            website = "www.bundeswehr.de"
        else:
            if category == "Bundesunternehmen":
                ann = "Siehe Beteiligungsbericht des Bundes"
                website = "www.bundesfinanzministerium.de"
            elif category == "Bundesstiftung":
                ann = "Siehe Stiftungsbericht des Bundes"
                website = "www.bundesfinanzministerium.de"
            else:
                ann = f"Finanzierung über das Ressort {ministry}"
                website = "www.service.bund.de"
                
    row_data = {
        "Id": nid,
        "Name": name,
        "Zuständiges Ressort": ministry,
        "Kategorie": category,
        "Klassifikation": cls,
        "Hauptsitz": hq,
        "Mitarbeiteranzahl": employees,
        "Budget (Mio. €)": budget,
        "Rechtsform": lf,
        "Website": website,
        "Anmerkung": ann
    }
    processed_rows.append(row_data)

enriched_df = pd.DataFrame(processed_rows)

# Split into sheets
behoerden_df = enriched_df[enriched_df["Kategorie"] == "Bundesbehörde"]
stiftungen_df = enriched_df[enriched_df["Kategorie"] == "Bundesstiftung"]
unternehmen_df = enriched_df[enriched_df["Kategorie"] == "Bundesunternehmen"]

print(f"Total Authorities: {len(behoerden_df)}")
print(f"Total Foundations: {len(stiftungen_df)}")
print(f"Total Companies: {len(unternehmen_df)}")

# Create workbook
wb = openpyxl.Workbook()
default_sheet = wb.active
wb.remove(default_sheet)

# Design System Palette (Option A: Midnight Blue & Gold)
color_midnight = "1B365D"
color_gold = "D4AF37"
color_zebra = "F4F7FA"
color_white = "FFFFFF"
color_kpi_bg = "F0F4F8"
color_border = "D1D5DB"
color_text_dark = "2C3E50"

# Styling definitions
font_banner = Font(name="Segoe UI", size=18, bold=True, color=color_white)
font_subtitle = Font(name="Segoe UI", size=10, italic=True, color="E2E8F0")
font_section_header = Font(name="Segoe UI", size=13, bold=True, color=color_midnight)
font_card_title = Font(name="Segoe UI", size=9, bold=True, color=color_midnight)
font_card_value_gold = Font(name="Segoe UI", size=20, bold=True, color=color_gold)
font_card_value_blue = Font(name="Segoe UI", size=20, bold=True, color=color_midnight)
font_th = Font(name="Segoe UI", size=10, bold=True, color=color_white)
font_td = Font(name="Segoe UI", size=10, color=color_text_dark)
font_td_bold = Font(name="Segoe UI", size=10, bold=True, color=color_text_dark)
font_link = Font(name="Segoe UI", size=10, color="0066CC", underline="single")

fill_midnight = PatternFill(start_color=color_midnight, end_color=color_midnight, fill_type="solid")
fill_gold = PatternFill(start_color=color_gold, end_color=color_gold, fill_type="solid")
fill_zebra = PatternFill(start_color=color_zebra, end_color=color_zebra, fill_type="solid")
fill_white = PatternFill(start_color=color_white, end_color=color_white, fill_type="solid")
fill_kpi = PatternFill(start_color=color_kpi_bg, end_color=color_kpi_bg, fill_type="solid")

border_thin = Side(border_style="thin", color=color_border)
border_double = Side(border_style="double", color=color_midnight)
border_cell = Border(left=border_thin, right=border_thin, top=border_thin, bottom=border_thin)
border_total = Border(left=border_thin, right=border_thin, top=border_thin, bottom=border_double)

# Alignments
align_center = Alignment(horizontal="center", vertical="center", wrap_text=True)
align_left = Alignment(horizontal="left", vertical="center")
align_right = Alignment(horizontal="right", vertical="center")

def style_sheet(ws):
    ws.views.sheetView[0].showGridLines = True

# --- 1. DASHBOARD SHEET ---
print("Creating Dashboard...")
ws_dash = wb.create_sheet(title="📊 Dashboard")
style_sheet(ws_dash)

# Title Banner
ws_dash.merge_cells("A1:M3")
ws_dash.merge_cells("A4:M4")
for row in ws_dash["A1:M4"]:
    for cell in row:
        cell.fill = fill_midnight
title_cell = ws_dash["A1"]
title_cell.value = "BUNDESBEHÖRDEN, STIFTUNGEN & UNTERNEHMEN DER BUNDESREPUBLIK DEUTSCHLAND"
title_cell.font = font_banner
title_cell.alignment = align_center

subtitle_cell = ws_dash["A4"]
subtitle_cell.value = "Interaktives Gesamtverzeichnis & Kennzahlen-Dashboard | Datenstand: November 2024"
subtitle_cell.font = font_subtitle
subtitle_cell.alignment = Alignment(horizontal="center", vertical="bottom")

# Gold Line
for col in range(1, 14):
    cell = ws_dash.cell(row=5, column=col)
    cell.fill = fill_gold
ws_dash.row_dimensions[5].height = 4

# KPI Card 1: Institutionen Gesamt
ws_dash.merge_cells("A7:B7")
ws_dash["A7"].value = "INSTITUTIONEN GESAMT"
ws_dash["A7"].font = font_card_title
ws_dash["A7"].fill = fill_kpi
ws_dash["A7"].alignment = align_center
ws_dash["A7"].border = border_cell
ws_dash["B7"].border = border_cell

ws_dash.merge_cells("A8:B9")
ws_dash["A8"].value = "=COUNTA(Gesamtverzeichnis!A12:A2000)"
ws_dash["A8"].font = font_card_value_gold
ws_dash["A8"].fill = fill_kpi
ws_dash["A8"].alignment = align_center
ws_dash["A8"].border = border_cell
ws_dash["B8"].border = border_cell
ws_dash["A9"].border = border_cell
ws_dash["B9"].border = border_cell

# KPI Card 2: Bundesbehörden
ws_dash.merge_cells("D7:E7")
ws_dash["D7"].value = "BUNDESBEHÖRDEN"
ws_dash["D7"].font = font_card_title
ws_dash["D7"].fill = fill_kpi
ws_dash["D7"].alignment = align_center
ws_dash["D7"].border = border_cell
ws_dash["E7"].border = border_cell

ws_dash.merge_cells("D8:E9")
ws_dash["D8"].value = '=COUNTIF(Gesamtverzeichnis!D12:D2000, "Bundesbehörde")'
ws_dash["D8"].font = font_card_value_blue
ws_dash["D8"].fill = fill_kpi
ws_dash["D8"].alignment = align_center
ws_dash["D8"].border = border_cell
ws_dash["E8"].border = border_cell
ws_dash["D9"].border = border_cell
ws_dash["E9"].border = border_cell

# KPI Card 3: Bundesstiftungen
ws_dash.merge_cells("G7:H7")
ws_dash["G7"].value = "BUNDESSTIFTUNGEN"
ws_dash["G7"].font = font_card_title
ws_dash["G7"].fill = fill_kpi
ws_dash["G7"].alignment = align_center
ws_dash["G7"].border = border_cell
ws_dash["H7"].border = border_cell

ws_dash.merge_cells("G8:H9")
ws_dash["G8"].value = '=COUNTIF(Gesamtverzeichnis!D12:D2000, "Bundesstiftung")'
ws_dash["G8"].font = font_card_value_blue
ws_dash["G8"].fill = fill_kpi
ws_dash["G8"].alignment = align_center
ws_dash["G8"].border = border_cell
ws_dash["H8"].border = border_cell
ws_dash["G9"].border = border_cell
ws_dash["H9"].border = border_cell

# KPI Card 4: Bundesunternehmen
ws_dash.merge_cells("J7:K7")
ws_dash["J7"].value = "BUNDESUNTERNEHMEN"
ws_dash["J7"].font = font_card_title
ws_dash["J7"].fill = fill_kpi
ws_dash["J7"].alignment = align_center
ws_dash["J7"].border = border_cell
ws_dash["K7"].border = border_cell

ws_dash.merge_cells("J8:K9")
ws_dash["J8"].value = '=COUNTIF(Gesamtverzeichnis!D12:D2000, "Bundesunternehmen")'
ws_dash["J8"].font = font_card_value_blue
ws_dash["J8"].fill = fill_kpi
ws_dash["J8"].alignment = align_center
ws_dash["J8"].border = border_cell
ws_dash["K8"].border = border_cell
ws_dash["J9"].border = border_cell
ws_dash["K9"].border = border_cell

# KPI Card 5: Kuriertes Budget
ws_dash.merge_cells("A11:B11")
ws_dash["A11"].value = "KURIERTES BUDGET"
ws_dash["A11"].font = font_card_title
ws_dash["A11"].fill = fill_kpi
ws_dash["A11"].alignment = align_center
ws_dash["A11"].border = border_cell
ws_dash["B11"].border = border_cell

ws_dash.merge_cells("A12:B13")
ws_dash["A12"].value = "=SUM(Gesamtverzeichnis!H12:H2000)"
ws_dash["A12"].font = Font(name="Segoe UI", size=15, bold=True, color=color_midnight)
ws_dash["A12"].number_format = '#,##0 "Mio. €"'
ws_dash["A12"].fill = fill_kpi
ws_dash["A12"].alignment = align_center
ws_dash["A12"].border = border_cell
ws_dash["B12"].border = border_cell
ws_dash["A13"].border = border_cell
ws_dash["B13"].border = border_cell

# KPI Card 6: Kurierte Mitarbeiter
ws_dash.merge_cells("D11:E11")
ws_dash["D11"].value = "KURIERTE MITARBEITER"
ws_dash["D11"].font = font_card_title
ws_dash["D11"].fill = fill_kpi
ws_dash["D11"].alignment = align_center
ws_dash["D11"].border = border_cell
ws_dash["E11"].border = border_cell

ws_dash.merge_cells("D12:E13")
ws_dash["D12"].value = "=SUM(Gesamtverzeichnis!G12:G2000)"
ws_dash["D12"].font = Font(name="Segoe UI", size=15, bold=True, color=color_midnight)
ws_dash["D12"].number_format = '#,##0'
ws_dash["D12"].fill = fill_kpi
ws_dash["D12"].alignment = align_center
ws_dash["D12"].border = border_cell
ws_dash["E12"].border = border_cell
ws_dash["D13"].border = border_cell
ws_dash["E13"].border = border_cell

# Navigation Header
ws_dash["A16"].value = "🧭 ARCHIV-NAVIGATION & INTERNE VERKNÜPFUNGEN"
ws_dash["A16"].font = font_section_header

# Navigation Table Headers
nav_headers = ["Bereich / Arbeitsblatt", "Thematischer Inhalt & Details", "Datensätze", "Aktion"]
for idx, h in enumerate(nav_headers):
    cell = ws_dash.cell(row=18, column=idx * 3 + 1)
    ws_dash.merge_cells(start_row=18, start_column=idx * 3 + 1, end_row=18, end_column=idx * 3 + 3)
    cell.value = h
    cell.font = font_th
    cell.fill = fill_midnight
    cell.alignment = align_center
    cell.border = border_cell
    
    for c_idx in range(idx * 3 + 1, idx * 3 + 4):
        ws_dash.cell(row=18, column=c_idx).border = border_cell

# Navigation Data Rows
nav_data = [
    ("🏛️ Bundesbehörden", "Oberste Bundesbehörden, Ämter, Körperschaften & Anstalten", '=COUNTIF(Gesamtverzeichnis!D12:D2000, "Bundesbehörde")', "#'🏛️ Bundesbehörden'!A1"),
    ("🌱 Bundesstiftungen", "Bundesunmittelbare Stiftungen des öffentlichen & privaten Rechts", '=COUNTIF(Gesamtverzeichnis!D12:D2000, "Bundesstiftung")', "#'🌱 Bundesstiftungen'!A1"),
    ("💼 Bundesunternehmen", "GmbH, AG & sonstige direkte Unternehmensbeteiligungen des Bundes", '=COUNTIF(Gesamtverzeichnis!D12:D2000, "Bundesunternehmen")', "#'💼 Bundesunternehmen'!A1"),
    ("🗂️ Gesamtverzeichnis", "Vollständiges, konsolidiertes Verzeichnis aller 1.512 Institutionen", "=COUNTA(Gesamtverzeichnis!A12:A2000)", "#'🗂️ Gesamtverzeichnis'!A1"),
]

for row_idx, data in enumerate(nav_data):
    curr_row = 19 + row_idx
    fill = fill_zebra if row_idx % 2 == 0 else fill_white
    
    # Col 1: Sheet Title
    ws_dash.merge_cells(start_row=curr_row, start_column=1, end_row=curr_row, end_column=3)
    c1 = ws_dash.cell(row=curr_row, column=1)
    c1.value = data[0]
    c1.font = font_td_bold
    c1.fill = fill
    c1.alignment = align_left
    
    # Col 2: Content Desc
    ws_dash.merge_cells(start_row=curr_row, start_column=4, end_row=curr_row, end_column=6)
    c2 = ws_dash.cell(row=curr_row, column=4)
    c2.value = data[1]
    c2.font = font_td
    c2.fill = fill
    c2.alignment = align_left
    
    # Col 3: Records Count
    ws_dash.merge_cells(start_row=curr_row, start_column=7, end_row=curr_row, end_column=9)
    c3 = ws_dash.cell(row=curr_row, column=7)
    c3.value = data[2]
    c3.font = font_td_bold
    c3.fill = fill
    c3.alignment = align_center
    
    # Col 4: Link Action
    ws_dash.merge_cells(start_row=curr_row, start_column=10, end_row=curr_row, end_column=12)
    c4 = ws_dash.cell(row=curr_row, column=10)
    c4.value = "Arbeitsblatt öffnen →"
    c4.hyperlink = data[3]
    c4.font = font_link
    c4.fill = fill
    c4.alignment = align_center
    
    for c_idx in range(1, 13):
        ws_dash.cell(row=curr_row, column=c_idx).border = border_cell

# Adjust Row/Col heights for Dashboard
ws_dash.column_dimensions["A"].width = 15
ws_dash.column_dimensions["B"].width = 15
ws_dash.column_dimensions["C"].width = 5
ws_dash.column_dimensions["D"].width = 15
ws_dash.column_dimensions["E"].width = 15
ws_dash.column_dimensions["F"].width = 5
ws_dash.column_dimensions["G"].width = 15
ws_dash.column_dimensions["H"].width = 15
ws_dash.column_dimensions["I"].width = 5
ws_dash.column_dimensions["J"].width = 15
ws_dash.column_dimensions["K"].width = 15
ws_dash.column_dimensions["L"].width = 5

for r in range(1, 24):
    ws_dash.row_dimensions[r].height = 20
ws_dash.row_dimensions[1].height = 25
ws_dash.row_dimensions[2].height = 25

# --- HELPER: WRITE DATA SHEETS ---
def generate_data_sheet(ws_title, title_text, data_df, headers, is_gesamt=False):
    print(f"Creating {ws_title} Sheet...")
    ws = wb.create_sheet(title=ws_title)
    style_sheet(ws)
    
    # Title Banner
    ws.merge_cells("A1:K2")
    ws.merge_cells("A3:K3")
    for r_idx in range(1, 4):
        for c_idx in range(1, 12):
            ws.cell(row=r_idx, column=c_idx).fill = fill_midnight
            
    title_cell = ws["A1"]
    title_cell.value = title_text
    title_cell.font = font_banner
    title_cell.alignment = align_center
    
    sub_cell = ws["A3"]
    sub_cell.value = "Datenbestand aus offiziellen Haushaltsplänen, Stiftungs- & Beteiligungsberichten des Bundes"
    sub_cell.font = font_subtitle
    sub_cell.alignment = Alignment(horizontal="center", vertical="bottom")
    
    # Gold Line
    for col in range(1, 12):
        cell = ws.cell(row=4, column=col)
        cell.fill = fill_gold
    ws.row_dimensions[4].height = 4
    
    # Back to Dashboard Link
    back_cell = ws["A6"]
    back_cell.value = "← Zurück zum Dashboard"
    back_cell.hyperlink = "#'📊 Dashboard'!A1"
    back_cell.font = font_link
    back_cell.alignment = align_left
    
    # Sheet Local Summary Cards
    ws.merge_cells("H6:K6")
    ws.cell(row=6, column=8).value = f"Gesamteinträge in dieser Kategorie: {len(data_df)}"
    ws.cell(row=6, column=8).font = Font(name="Segoe UI", size=9, bold=True, color=color_midnight)
    ws.cell(row=6, column=8).alignment = align_right
    
    # Write Table Headers
    table_start_row = 8
    for idx, h in enumerate(headers):
        cell = ws.cell(row=table_start_row, column=idx + 1)
        cell.value = h
        cell.font = font_th
        cell.fill = fill_midnight
        if h in ["Id", "Hauptsitz", "Rechtsform", "Website"]:
            cell.alignment = align_center
        elif h in ["Mitarbeiteranzahl", "Budget (Mio. €)"]:
            cell.alignment = align_right
        else:
            cell.alignment = align_left
        cell.border = border_cell
        
    # Write Table Data
    for row_idx, (_, row) in enumerate(data_df.iterrows()):
        curr_row = table_start_row + 1 + row_idx
        fill = fill_zebra if row_idx % 2 == 0 else fill_white
        
        # Determine cols based on sheet
        if is_gesamt:
            cols = [
                row["Id"], row["Name"], row["Zuständiges Ressort"], row["Kategorie"],
                row["Klassifikation"], row["Hauptsitz"], row["Mitarbeiteranzahl"],
                row["Budget (Mio. €)"], row["Rechtsform"], row["Website"], row["Anmerkung"]
            ]
        else:
            cols = [
                row["Id"], row["Name"], row["Zuständiges Ressort"], row["Klassifikation"],
                row["Hauptsitz"], row["Mitarbeiteranzahl"], row["Budget (Mio. €)"],
                row["Rechtsform"], row["Website"], row["Anmerkung"]
            ]
            
        for col_idx, val in enumerate(cols):
            cell = ws.cell(row=curr_row, column=col_idx + 1)
            cell.fill = fill
            cell.border = border_cell
            cell.font = font_td
            
            h_name = headers[col_idx]
            
            if h_name == "Id":
                cell.value = int(val)
                cell.alignment = align_center
                cell.number_format = '0'
            elif h_name == "Mitarbeiteranzahl":
                if pd.isna(val) or val is None or val == "":
                    cell.value = ""
                    cell.alignment = align_center
                else:
                    cell.value = int(val)
                    cell.alignment = align_right
                    cell.number_format = '#,##0'
            elif h_name == "Budget (Mio. €)":
                if pd.isna(val) or val is None or val == "":
                    cell.value = ""
                    cell.alignment = align_center
                else:
                    cell.value = float(val)
                    cell.alignment = align_right
                    cell.number_format = '#,##0.00'
            elif h_name in ["Website", "Aktion", "Link"]:
                cell.value = val
                cell.alignment = align_center
                if val and "." in str(val):
                    cell.hyperlink = "https://" + str(val) if not str(val).startswith("http") else str(val)
                    cell.font = font_link
            else:
                cell.value = str(val) if not pd.isna(val) else ""
                cell.alignment = align_left
                
        ws.row_dimensions[curr_row].height = 20
        
    # Totals Row at the bottom
    totals_row = table_start_row + 1 + len(data_df)
    for col_idx in range(1, len(headers) + 1):
        cell = ws.cell(row=totals_row, column=col_idx)
        cell.fill = fill_kpi
        cell.border = border_total
        
    ws.cell(row=totals_row, column=1).value = "SUMME / SUM"
    ws.cell(row=totals_row, column=1).font = font_td_bold
    ws.cell(row=totals_row, column=1).alignment = align_left
    
    emp_col = -1
    bud_col = -1
    for idx, h in enumerate(headers):
        if h == "Mitarbeiteranzahl":
            emp_col = idx + 1
        elif h == "Budget (Mio. €)":
            bud_col = idx + 1
            
    if emp_col != -1:
        emp_letter = get_column_letter(emp_col)
        cell_emp = ws.cell(row=totals_row, column=emp_col)
        cell_emp.value = f"=SUM({emp_letter}{table_start_row + 1}:{emp_letter}{totals_row - 1})"
        cell_emp.font = font_td_bold
        cell_emp.alignment = align_right
        cell_emp.number_format = '#,##0'
        
    if bud_col != -1:
        bud_letter = get_column_letter(bud_col)
        cell_bud = ws.cell(row=totals_row, column=bud_col)
        cell_bud.value = f"=SUM({bud_letter}{table_start_row + 1}:{bud_letter}{totals_row - 1})"
        cell_bud.font = font_td_bold
        cell_bud.alignment = align_right
        cell_bud.number_format = '#,##0.00'
        
    ws.row_dimensions[totals_row].height = 24
    
    # Auto-fit columns
    for col in ws.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        
        for cell in col:
            if cell.row > 4:
                val_str = str(cell.value or '')
                if cell.hyperlink:
                    val_str = "Website Link"
                if len(val_str) > max_len:
                    max_len = len(val_str)
                    
        ws.column_dimensions[col_letter].width = max(max_len + 3, 10)
        
    name_col_letter = get_column_letter(2)
    ws.column_dimensions[name_col_letter].width = 65

# --- 2. BUNDESBEHÖRDEN SHEET ---
headers_beh = ["Id", "Name", "Zuständiges Ressort", "Klassifikation", "Hauptsitz", "Mitarbeiteranzahl", "Budget (Mio. €)", "Rechtsform", "Website", "Anmerkung"]
generate_data_sheet(
    "🏛️ Bundesbehörden",
    "🏛️ VERZEICHNIS ALLER BUNDESBEHÖRDEN IN DEUTSCHLAND",
    behoerden_df,
    headers_beh
)

# --- 3. BUNDESSTIFTUNGEN SHEET ---
headers_st = ["Id", "Name", "Zuständiges Ressort", "Klassifikation", "Hauptsitz", "Mitarbeiteranzahl", "Budget (Mio. €)", "Rechtsform", "Website", "Anmerkung"]
generate_data_sheet(
    "🌱 Bundesstiftungen",
    "🌱 VERZEICHNIS DER BUNDESSTIFTUNGEN (ÖFFENTLICH & PRIVAT)",
    stiftungen_df,
    headers_st
)

# --- 4. BUNDESUNTERNEHMEN SHEET ---
headers_un = ["Id", "Name", "Zuständiges Ressort", "Klassifikation", "Hauptsitz", "Mitarbeiteranzahl", "Budget (Mio. €)", "Rechtsform", "Website", "Anmerkung"]
generate_data_sheet(
    "💼 Bundesunternehmen",
    "💼 VERZEICHNIS DER BUNDESUNTERNEHMEN & DIREKTEN BETEILIGUNGEN",
    unternehmen_df,
    headers_un
)

# --- 5. GESAMTVERZEICHNIS SHEET ---
headers_ges = ["Id", "Name", "Zuständiges Ressort", "Kategorie", "Klassifikation", "Hauptsitz", "Mitarbeiteranzahl", "Budget (Mio. €)", "Rechtsform", "Website", "Anmerkung"]
generate_data_sheet(
    "🗂️ Gesamtverzeichnis",
    "🗂️ GESAMTVERZEICHNIS ALLER BUNDESINSTITUTIONEN",
    enriched_df,
    headers_ges,
    is_gesamt=True
)

# Save Workbook
print("Saving spreadsheet...")
os.makedirs(os.path.dirname(output_path), exist_ok=True)
wb.save(output_path)
print(f"Spreadsheet successfully generated and saved at {output_path} ")
