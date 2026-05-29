"""
build_excel.py – Master script to merge all data sources and generate the final Excel file.

Data sources:
1. WD3 PDF text dump (data/raw/wd3_text_dump.txt) – Parsed for authoritative list
2. Wikipedia Behörden (data/raw/wikipedia_behoerden.csv) – Enrichment data
3. Wikipedia Unternehmen (data/raw/wikipedia_unternehmen.csv) – Enrichment data
4. Anschriftenverzeichnis (data/raw/anschriftenverzeichnis.csv) – Addresses
"""

import csv
import os
import re
import sys
from difflib import SequenceMatcher
from collections import defaultdict

import pandas as pd
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# ── Paths ──
BASE = r"c:\Projects\ZeigDenStaat"
RAW = os.path.join(BASE, "data", "raw")
WD3_DUMP = os.path.join(RAW, "wd3_text_dump.txt")
WIKI_BEH = os.path.join(RAW, "wikipedia_behoerden.csv")
WIKI_UNT = os.path.join(RAW, "wikipedia_unternehmen.csv")
ANSCHRIFT = os.path.join(RAW, "anschriftenverzeichnis.csv")
OUTPUT_XLSX = os.path.join(BASE, "data", "bundesorganisationen.xlsx")


# ═══════════════════════════════════════════════════════════════════════════
# PHASE 1: Parse WD3 PDF text to extract entities
# ═══════════════════════════════════════════════════════════════════════════

def fix_umlauts(text: str) -> str:
    """The PDF extraction produces ? for umlauts. We can't fully fix them
    but we keep the text as-is since the structure (bullet points) is intact."""
    return text


def parse_wd3_text(filepath: str) -> list[dict]:
    """Parse the WD3 text dump to extract all entities by Geschäftsbereich."""
    with open(filepath, "r", encoding="utf-8") as f:
        text = f.read()

    records = []

    # ── Section 2: Oberste Bundesbehörden ──
    oberste = [
        ("Bundesministerium für Wirtschaft und Klimaschutz", "BMWK"),
        ("Bundesministerium der Finanzen", "BMF"),
        ("Bundesministerium des Innern und für Heimat", "BMI"),
        ("Auswärtiges Amt", "AA"),
        ("Bundesministerium der Justiz", "BMJ"),
        ("Bundesministerium für Arbeit und Soziales", "BMAS"),
        ("Bundesministerium der Verteidigung", "BMVg"),
        ("Bundesministerium für Ernährung und Landwirtschaft", "BMEL"),
        ("Bundesministerium für Familie, Senioren, Frauen und Jugend", "BMFSFJ"),
        ("Bundesministerium für Gesundheit", "BMG"),
        ("Bundesministerium für Digitales und Verkehr", "BMDV"),
        ("Bundesministerium für Umwelt, Naturschutz, nukleare Sicherheit und Verbraucherschutz", "BMUV"),
        ("Bundesministerium für Bildung und Forschung", "BMBF"),
        ("Bundesministerium für wirtschaftliche Zusammenarbeit und Entwicklung", "BMZ"),
        ("Bundesministerium für Wohnen, Stadtentwicklung und Bauwesen", "BMWSB"),
        ("Bundespräsidialamt", "BPrA"),
        ("Verwaltung des Deutschen Bundestages", "BT"),
        ("Sekretariat des Bundesrates", "BR"),
        ("Bundeskanzleramt", "BKAmt"),
        ("Presse- und Informationsamt der Bundesregierung", "BPA"),
        ("Beauftragte der Bundesregierung für Kultur und Medien", "BKM"),
        ("Bundesrechnungshof", "BRH"),
        ("Bundesbeauftragte für den Datenschutz und die Informationsfreiheit", "BfDI"),
        ("Unabhängiger Kontrollrat", "UKRat"),
        ("Deutsche Bundesbank (Vorstand und Zentrale)", "BBk"),
    ]

    for name, abk in oberste:
        records.append({
            "Name": name,
            "Abkuerzung": abk,
            "Typ": "Behörde",
            "Untertyp": "Oberste Bundesbehörde",
            "Geschaeftsbereich": "Oberste Bundesbehörden",
        })

    # ── Section 3: Parse each Geschäftsbereich ──
    # We manually parse the well-structured bullet lists from the text dump

    geschaeftsbereiche = {
        "3.1": ("Bundeskanzleramt", [
            ("Bundesnachrichtendienst", "BND", "Behörde", "Bundesoberbehörde"),
        ]),
        "3.2": ("Bundesministerium für Wirtschaft und Klimaschutz (BMWK)", [
            # Behörden
            ("Bundeskartellamt", "BKartA", "Behörde", "Bundesoberbehörde"),
            ("Bundesnetzagentur", "BNetzA", "Behörde", "Bundesoberbehörde"),
            ("Bundesamt für Wirtschaft und Ausfuhrkontrolle", "BAFA", "Behörde", "Bundesoberbehörde"),
            ("Bundesanstalt für Materialforschung und -prüfung", "BAM", "Behörde", "Bundesanstalt"),
            ("Physikalisch-Technische Bundesanstalt", "PTB", "Behörde", "Bundesanstalt"),
            ("Bundesanstalt für Geowissenschaften und Rohstoffe", "BGR", "Behörde", "Bundesanstalt"),
            ("Wirtschaftsprüferkammer", "WPK", "Behörde", "Körperschaft des öffentlichen Rechts"),
            ("Fonds zur Finanzierung der kerntechnischen Entsorgung", "KENFO", "Behörde", "Stiftung des öffentlichen Rechts"),
            # Unternehmen
            ("Deutsche Energy Terminal GmbH", "", "Unternehmen", "GmbH"),
            ("Germany Trade and Invest – Gesellschaft für Außenwirtschaft und Standortmarketing mbH", "GTAI", "Unternehmen", "GmbH"),
            ("SEEHG Securing Energy for Europe Holding GmbH", "", "Unternehmen", "GmbH"),
            ("WIK Wirtschaftliches Institut für Infrastruktur und Kommunikationsdienste GmbH", "", "Unternehmen", "GmbH"),
            ("Wismut GmbH", "", "Unternehmen", "GmbH"),
        ]),
        "3.3": ("Bundesministerium der Finanzen (BMF)", [
            # Behörden
            ("Generalzolldirektion", "GZD", "Behörde", "Bundesoberbehörde"),
            ("Bundeszentralamt für Steuern", "BZSt", "Behörde", "Bundesoberbehörde"),
            ("Informationstechnikzentrum Bund", "ITZBund", "Behörde", "Bundesoberbehörde"),
            ("Bundesanstalt für Finanzdienstleistungsaufsicht", "BaFin", "Behörde", "Bundesanstalt"),
            ("Bundesanstalt für Finanzmarktstabilisierung", "FMSA", "Behörde", "Bundesanstalt"),
            ("Bundesanstalt für Immobilienaufgaben", "BImA", "Behörde", "Bundesanstalt"),
            ("Bundesanstalt für vereinigungsbedingte Sonderaufgaben", "BvS", "Behörde", "Bundesanstalt"),
            ("Bundesanstalt für Post und Telekommunikation Deutsche Bundespost", "BAnst PT", "Behörde", "Bundesanstalt"),
            ("DekaBank-Deutsche Girozentrale", "", "Behörde", "Anstalt des öffentlichen Rechts"),
            ("Kreditanstalt für Wiederaufbau", "KfW", "Behörde", "Anstalt des öffentlichen Rechts"),
            ("Museumsstiftung Post und Telekommunikation", "MSPT", "Behörde", "Stiftung des öffentlichen Rechts"),
            ("Stiftung Erinnerung, Verantwortung und Zukunft", "EVZ", "Behörde", "Stiftung des öffentlichen Rechts"),
            ("Stiftung Geld und Währung", "", "Behörde", "Stiftung des öffentlichen Rechts"),
            # Unternehmen
            ("Bundesdruckerei Gruppe GmbH", "", "Unternehmen", "GmbH"),
            ("Bundesrepublik Deutschland – Finanzagentur GmbH", "", "Unternehmen", "GmbH"),
            ("EWN Entsorgungswerk für Nuklearanlagen GmbH", "", "Unternehmen", "GmbH"),
            ("Lausitzer und Mitteldeutsche Bergbau-Verwaltungsgesellschaft mbH", "", "Unternehmen", "GmbH"),
            ("UBG Uniper Beteiligungsholding GmbH", "", "Unternehmen", "GmbH"),
            ("VEBEG GmbH", "", "Unternehmen", "GmbH"),
        ]),
        "3.4": ("Bundesministerium des Innern und für Heimat (BMI)", [
            ("Bundespolizei (Bundespolizeipräsidium)", "BPOL", "Behörde", "Bundesoberbehörde"),
            ("Bundesausgleichsamt", "BAA", "Behörde", "Bundesoberbehörde"),
            ("Bundesamt für zentrale Dienste und offene Vermögensfragen", "BADV", "Behörde", "Bundesoberbehörde"),
            ("Bundesamt für Migration und Flüchtlinge", "BAMF", "Behörde", "Bundesoberbehörde"),
            ("Bundesamt für Bevölkerungsschutz und Katastrophenhilfe", "BBK", "Behörde", "Bundesoberbehörde"),
            ("Beschaffungsamt des BMI", "BeschA", "Behörde", "Bundesoberbehörde"),
            ("Bundesamt für Verfassungsschutz", "BfV", "Behörde", "Bundesoberbehörde"),
            ("Bundesinstitut für Bevölkerungsforschung", "BiB", "Behörde", "Bundesoberbehörde"),
            ("Bundesinstitut für Sportwissenschaft", "BISp", "Behörde", "Bundesoberbehörde"),
            ("Bundeskriminalamt", "BKA", "Behörde", "Bundesoberbehörde"),
            ("Bundesamt für Kartographie und Geodäsie", "BKG", "Behörde", "Bundesoberbehörde"),
            ("Bundeszentrale für politische Bildung", "BPB", "Behörde", "Bundesoberbehörde"),
            ("Bundesamt für Sicherheit in der Informationstechnik", "BSI", "Behörde", "Bundesoberbehörde"),
            ("Bundesverwaltungsamt", "BVA", "Behörde", "Bundesoberbehörde"),
            ("Statistisches Bundesamt", "Destatis", "Behörde", "Bundesoberbehörde"),
            ("Zentrale Stelle für Informationstechnik im Sicherheitsbereich", "ZITiS", "Behörde", "Bundesoberbehörde"),
            ("Bundesanstalt Technisches Hilfswerk", "THW", "Behörde", "Bundesanstalt"),
            ("Hochschule des Bundes für öffentliche Verwaltung", "HS Bund", "Behörde", "Bundesoberbehörde"),
            ("Bundesakademie für öffentliche Verwaltung", "BAköV", "Behörde", "Bundesoberbehörde"),
            ("Bundesanstalt für den Digitalfunk der Behörden und Organisationen mit Sicherheitsaufgaben", "BDBOS", "Behörde", "Bundesanstalt"),
            ("Stiftung für ehemalige politische Häftlinge", "StepH", "Behörde", "Stiftung des öffentlichen Rechts"),
            # Unternehmen
            ("DigitalService GmbH des Bundes", "", "Unternehmen", "GmbH"),
            ("Sachverständigenrat für Integration und Migration gGmbH", "SVR", "Unternehmen", "gGmbH"),
        ]),
        "3.5": ("Auswärtiges Amt (AA)", [
            ("Bundesamt für Auswärtige Angelegenheiten", "BfAA", "Behörde", "Bundesoberbehörde"),
            ("Deutsches Archäologisches Institut", "DAI", "Behörde", "Bundesanstalt"),
            # Unternehmen
            ("Zentrum für Internationale Friedenseinsätze gGmbH", "ZIF", "Unternehmen", "gGmbH"),
        ]),
        "3.6": ("Bundesministerium der Justiz (BMJ)", [
            ("Deutsches Patent- und Markenamt", "DPMA", "Behörde", "Bundesoberbehörde"),
            ("Bundesamt für Justiz", "BfJ", "Behörde", "Bundesoberbehörde"),
            ("Bundesnotarkammer", "", "Behörde", "Körperschaft des öffentlichen Rechts"),
            ("Patentanwaltskammer", "", "Behörde", "Körperschaft des öffentlichen Rechts"),
            ("Bundesrechtsanwaltskammer", "", "Behörde", "Körperschaft des öffentlichen Rechts"),
            ("Stiftung Forum Recht", "SFR", "Behörde", "Stiftung des öffentlichen Rechts"),
        ]),
        "3.7": ("Bundesministerium für Arbeit und Soziales (BMAS)", [
            ("Bundesamt für Soziale Sicherung", "BAS", "Behörde", "Bundesoberbehörde"),
            ("Bundesanstalt für Arbeitsschutz und Arbeitsmedizin", "BAuA", "Behörde", "Bundesanstalt"),
            ("Bundesagentur für Arbeit", "BA", "Behörde", "Körperschaft des öffentlichen Rechts"),
            ("Deutsche Rentenversicherung Bund", "DRV Bund", "Behörde", "Körperschaft des öffentlichen Rechts"),
            ("Deutsche Rentenversicherung Knappschaft-Bahn-See", "DRV KBS", "Behörde", "Körperschaft des öffentlichen Rechts"),
            ("Unfallversicherung Bund und Bahn", "UVB", "Behörde", "Körperschaft des öffentlichen Rechts"),
            ("Künstlersozialkasse", "", "Behörde", "Körperschaft des öffentlichen Rechts"),
            ("Zusatzversorgungskasse für Arbeitnehmer in der Land- und Forstwirtschaft", "ZLA", "Behörde", "Körperschaft des öffentlichen Rechts"),
            ("Versorgungsanstalt der Deutschen Bühnen", "", "Behörde", "Anstalt des öffentlichen Rechts"),
            ("Versorgungsanstalt der Deutschen Kulturorchester", "", "Behörde", "Anstalt des öffentlichen Rechts"),
        ]),
        "3.8": ("Bundesministerium der Verteidigung (BMVg)", [
            ("Bundesamt für den militärischen Abschirmdienst", "MAD", "Behörde", "Bundesoberbehörde"),
            ("Operatives Führungskommando der Bundeswehr", "", "Behörde", "Bundesoberbehörde"),
            ("Führungsakademie der Bundeswehr", "", "Behörde", "Bundesoberbehörde"),
            ("Zentrum Innere Führung", "", "Behörde", "Bundesoberbehörde"),
            ("Bundesamt für das Personalmanagement der Bundeswehr", "BAPersBw", "Behörde", "Bundesoberbehörde"),
            ("Bundesamt für Ausrüstung, Informationstechnik und Nutzung der Bundeswehr", "BAAINBw", "Behörde", "Bundesoberbehörde"),
            ("Bundesamt für Infrastruktur, Umweltschutz und Dienstleistungen der Bundeswehr", "BAIUDBw", "Behörde", "Bundesoberbehörde"),
            ("Hochschule des Bundes – Fachbereich Bundeswehrverwaltung", "", "Behörde", "Bundesoberbehörde"),
            ("Universität der Bundeswehr München", "UniBw M", "Behörde", "Bundesoberbehörde"),
            ("Helmut-Schmidt-Universität der Bundeswehr Hamburg", "HSU", "Behörde", "Bundesoberbehörde"),
            ("Bildungszentrum der Bundeswehr", "BiZBw", "Behörde", "Bundesoberbehörde"),
            ("Bundessprachenamt", "BSprA", "Behörde", "Bundesoberbehörde"),
            ("Militärrabbinat", "", "Behörde", "Bundesoberbehörde"),
            ("Evangelisches Kirchenamt für die Bundeswehr", "", "Behörde", "Bundesoberbehörde"),
            ("Katholisches Militärbischofsamt", "", "Behörde", "Bundesoberbehörde"),
            # Unternehmen
            ("Agentur für Innovation in der Cybersicherheit GmbH", "", "Unternehmen", "GmbH"),
            ("Bw Bekleidungsmanagement GmbH", "", "Unternehmen", "GmbH"),
            ("BwConsulting GmbH", "", "Unternehmen", "GmbH"),
            ("BWI GmbH", "", "Unternehmen", "GmbH"),
            ("GEKA Gesellschaft zur Entsorgung von chemischen Kampfstoffen und Rüstungsaltlasten mbH", "", "Unternehmen", "GmbH"),
            ("HIL Heeresinstandsetzungslogistik GmbH", "", "Unternehmen", "GmbH"),
        ]),
        "3.9": ("Bundesministerium für Ernährung und Landwirtschaft (BMEL)", [
            ("Bundesamt für Verbraucherschutz und Lebensmittelsicherheit", "BVL", "Behörde", "Bundesoberbehörde"),
            ("Bundessortenamt", "BSA", "Behörde", "Bundesoberbehörde"),
            ("Friedrich-Loeffler-Institut", "FLI", "Behörde", "Bundesoberbehörde"),
            ("Johann Heinrich von Thünen-Institut", "TI", "Behörde", "Bundesoberbehörde"),
            ("Julius Kühn-Institut", "JKI", "Behörde", "Bundesoberbehörde"),
            ("Max Rubner-Institut", "MRI", "Behörde", "Bundesoberbehörde"),
            ("Bundesinstitut für Risikobewertung", "BfR", "Behörde", "Bundesanstalt"),
            ("Bundesanstalt für Landwirtschaft und Ernährung", "BLE", "Behörde", "Bundesanstalt"),
            ("Deutsches Weininstitut", "", "Behörde", "Körperschaft des öffentlichen Rechts"),
            # Unternehmen
            ("DBFZ Deutsches Biomasseforschungszentrum gGmbH", "", "Unternehmen", "gGmbH"),
        ]),
        "3.10": ("Bundesministerium für Familie, Senioren, Frauen und Jugend (BMFSFJ)", [
            ("Bundesamt für Familie und zivilgesellschaftliche Aufgaben", "BAFzA", "Behörde", "Bundesoberbehörde"),
            ("Bundeszentrale für Kinder- und Jugendmedienschutz", "BzKJ", "Behörde", "Bundesoberbehörde"),
            ("Antidiskriminierungsstelle des Bundes", "", "Behörde", "Bundesoberbehörde"),
            ("Bundesstiftung Mutter und Kind – Schutz des ungeborenen Lebens", "", "Behörde", "Stiftung des öffentlichen Rechts"),
            ("Bundesstiftung Gleichstellung", "", "Behörde", "Stiftung des öffentlichen Rechts"),
            ("Conterganstiftung", "", "Behörde", "Stiftung des öffentlichen Rechts"),
            ("Deutsche Stiftung für Engagement und Ehrenamt", "DSEE", "Behörde", "Stiftung des öffentlichen Rechts"),
        ]),
        "3.11": ("Bundesministerium für Gesundheit (BMG)", [
            ("Robert Koch-Institut", "RKI", "Behörde", "Bundesoberbehörde"),
            ("Paul-Ehrlich-Institut", "PEI", "Behörde", "Bundesoberbehörde"),
            ("Bundeszentrale für gesundheitliche Aufklärung", "BZgA", "Behörde", "Bundesoberbehörde"),
            ("Bundesinstitut für Arzneimittel und Medizinprodukte", "BfArM", "Behörde", "Bundesoberbehörde"),
            ("Kassenärztliche Bundesvereinigung", "KBV", "Behörde", "Körperschaft des öffentlichen Rechts"),
            ("Kassenzahnärztliche Bundesvereinigung", "KZBV", "Behörde", "Körperschaft des öffentlichen Rechts"),
        ]),
        "3.12": ("Bundesministerium für Digitales und Verkehr (BMDV)", [
            ("Bundesamt für Logistik und Mobilität", "BALM", "Behörde", "Bundesoberbehörde"),
            ("Bundesamt für Seeschifffahrt und Hydrographie", "BSH", "Behörde", "Bundesoberbehörde"),
            ("Bundesanstalt für Gewässerkunde", "BfG", "Behörde", "Bundesanstalt"),
            ("Bundesanstalt für Straßenwesen", "BASt", "Behörde", "Bundesanstalt"),
            ("Bundesanstalt für Verwaltungsdienstleistungen", "BAV", "Behörde", "Bundesanstalt"),
            ("Bundesanstalt für Wasserbau", "BAW", "Behörde", "Bundesanstalt"),
            ("Bundesaufsichtsamt für Flugsicherung", "BAF", "Behörde", "Bundesoberbehörde"),
            ("Bundesstelle für Eisenbahnunfalluntersuchung", "BEU", "Behörde", "Bundesoberbehörde"),
            ("Bundesstelle für Flugunfalluntersuchung", "BFU", "Behörde", "Bundesoberbehörde"),
            ("Bundesstelle für Seeunfalluntersuchung", "BSU", "Behörde", "Bundesoberbehörde"),
            ("Deutscher Wetterdienst", "DWD", "Behörde", "Bundesanstalt"),
            ("Eisenbahn-Bundesamt", "EBA", "Behörde", "Bundesoberbehörde"),
            ("Fernstraßen-Bundesamt", "FBA", "Behörde", "Bundesoberbehörde"),
            ("Kraftfahrt-Bundesamt", "KBA", "Behörde", "Bundesoberbehörde"),
            ("Luftfahrt-Bundesamt", "LBA", "Behörde", "Bundesoberbehörde"),
            ("Generaldirektion Wasserstraßen und Schifffahrt", "GDWS", "Behörde", "Bundesmittelbehörde"),
            ("Bundeslotsenkammer", "", "Behörde", "Körperschaft des öffentlichen Rechts"),
            ("Krankenversorgung der Bundesbahnbeamten", "KVB", "Behörde", "Körperschaft des öffentlichen Rechts"),
            # Unternehmen
            ("Deutsche Bahn AG", "DB", "Unternehmen", "AG"),
            ("DFS Deutsche Flugsicherung GmbH", "DFS", "Unternehmen", "GmbH"),
            ("Die Autobahn GmbH des Bundes", "", "Unternehmen", "GmbH"),
            ("Fluko Flughafenkoordination Deutschland GmbH", "", "Unternehmen", "GmbH"),
            ("NOW GmbH Nationale Organisation Wasserstoff- und Brennstoffzellentechnologie", "", "Unternehmen", "GmbH"),
            ("Toll Collect GmbH", "", "Unternehmen", "GmbH"),
        ]),
        "3.13": ("Bundesministerium für Umwelt, Naturschutz, nukleare Sicherheit und Verbraucherschutz (BMUV)", [
            ("Umweltbundesamt", "UBA", "Behörde", "Bundesoberbehörde"),
            ("Bundesamt für Naturschutz", "BfN", "Behörde", "Bundesoberbehörde"),
            ("Bundesamt für Strahlenschutz", "BfS", "Behörde", "Bundesoberbehörde"),
            ("Bundesamt für die Sicherheit der nuklearen Entsorgung", "BASE", "Behörde", "Bundesoberbehörde"),
            # Unternehmen
            ("BGZ Gesellschaft für Zwischenlagerung mbH", "", "Unternehmen", "GmbH"),
            ("Bundesgesellschaft für Endlagerung mbH", "BGE", "Unternehmen", "GmbH"),
            ("Zukunft – Umwelt – Gesundheit gGmbH", "ZUG", "Unternehmen", "gGmbH"),
        ]),
        "3.14": ("Bundesministerium für Bildung und Forschung (BMBF)", [
            ("Max Weber Stiftung – Deutsche Geisteswissenschaftliche Institute im Ausland", "MWS", "Behörde", "Stiftung des öffentlichen Rechts"),
            ("Bundesinstitut für Berufsbildung", "BIBB", "Behörde", "Bundesanstalt"),
            # Unternehmen
            ("SPRIND GmbH", "", "Unternehmen", "GmbH"),
        ]),
        "3.15": ("Bundesministerium für wirtschaftliche Zusammenarbeit und Entwicklung (BMZ)", [
            # Keine Behörden
            # Unternehmen
            ("Deutsche Gesellschaft für Internationale Zusammenarbeit GmbH", "GIZ", "Unternehmen", "GmbH"),
            ("Deutsches Evaluierungsinstitut der Entwicklungszusammenarbeit gGmbH", "DEval", "Unternehmen", "gGmbH"),
            ("Engagement Global gGmbH", "", "Unternehmen", "gGmbH"),
        ]),
        "3.16": ("Bundesministerium für Wohnen, Stadtentwicklung und Bauwesen (BMWSB)", [
            ("Bundesamt für Bauwesen und Raumordnung", "BBR", "Behörde", "Bundesoberbehörde"),
            ("Bundesstiftung Baukultur", "", "Behörde", "Stiftung des öffentlichen Rechts"),
        ]),
        "3.17": ("Beauftragte der Bundesregierung für Kultur und Medien (BKM)", [
            ("Bundesarchiv", "BArch", "Behörde", "Bundesoberbehörde"),
            ("Bundesinstitut für Kultur und Geschichte des östlichen Europas", "BKGE", "Behörde", "Bundesoberbehörde"),
            ("Kunstverwaltung des Bundes", "KVdB", "Behörde", "Bundesoberbehörde"),
            ("Bundesamt für Äußere Restitutionen", "BAR", "Behörde", "Bundesoberbehörde"),
            ("Deutsche Welle", "DW", "Behörde", "Anstalt des öffentlichen Rechts"),
            ("Deutsche Akademie Rom Villa Massimo", "", "Behörde", "Bundesanstalt"),
            ("Bundeskanzler-Helmut-Kohl-Stiftung", "", "Behörde", "Stiftung des öffentlichen Rechts"),
            ("Bundeskanzler-Helmut-Schmidt-Stiftung", "", "Behörde", "Stiftung des öffentlichen Rechts"),
            ("Bundeskanzler-Willy-Brandt-Stiftung", "", "Behörde", "Stiftung des öffentlichen Rechts"),
            ("Otto-von-Bismarck-Stiftung", "", "Behörde", "Stiftung des öffentlichen Rechts"),
            ("Stiftung Bundeskanzler-Adenauer-Haus", "", "Behörde", "Stiftung des öffentlichen Rechts"),
            ("Stiftung Bundespräsident-Theodor-Heuss-Haus", "", "Behörde", "Stiftung des öffentlichen Rechts"),
            ("Stiftung Denkmal für die ermordeten Juden Europas", "", "Behörde", "Stiftung des öffentlichen Rechts"),
            ("Stiftung Deutsches Historisches Museum", "DHM", "Behörde", "Stiftung des öffentlichen Rechts"),
            ("Stiftung Flucht, Vertreibung, Versöhnung", "SFVV", "Behörde", "Stiftung des öffentlichen Rechts"),
            ("Stiftung Haus der Geschichte der Bundesrepublik Deutschland", "HdG", "Behörde", "Stiftung des öffentlichen Rechts"),
            ("Stiftung Jüdisches Museum Berlin", "JMB", "Behörde", "Stiftung des öffentlichen Rechts"),
            ("Stiftung Orte der deutschen Demokratiegeschichte", "", "Behörde", "Stiftung des öffentlichen Rechts"),
            ("Stiftung Preußischer Kulturbesitz", "SPK", "Behörde", "Stiftung des öffentlichen Rechts"),
            ("Stiftung Reichspräsident-Friedrich-Ebert-Gedenkstätte", "", "Behörde", "Stiftung des öffentlichen Rechts"),
            ("Bundesstiftung zur Aufarbeitung der SED-Diktatur", "", "Behörde", "Stiftung des öffentlichen Rechts"),
            ("Deutsche Nationalbibliothek", "DNB", "Behörde", "Bundesanstalt"),
            ("Akademie der Künste", "", "Behörde", "Körperschaft des öffentlichen Rechts"),
            # Unternehmen
            ("Kulturveranstaltungen des Bundes in Berlin GmbH", "KBB", "Unternehmen", "GmbH"),
            ("Transit-Film-Gesellschaft mbH", "", "Unternehmen", "GmbH"),
        ]),
        "3.18": ("Deutsche Bundesbank", [
            ("Deutsche Bundesbank (Hauptverwaltungen und Filialen)", "", "Behörde", "Bundesbehörde (gleichgestellt)"),
        ]),
    }

    for section_num, (gb_name, entities) in geschaeftsbereiche.items():
        for entity_tuple in entities:
            name, abk, typ, untertyp = entity_tuple
            records.append({
                "Name": name,
                "Abkuerzung": abk,
                "Typ": typ,
                "Untertyp": untertyp,
                "Geschaeftsbereich": gb_name,
            })

    return records


# ═══════════════════════════════════════════════════════════════════════════
# PHASE 2: Load enrichment data
# ═══════════════════════════════════════════════════════════════════════════

def load_anschriftenverzeichnis(filepath: str) -> dict:
    """Load address data. Returns dict keyed by normalized name."""
    lookup = {}
    try:
        df = pd.read_csv(filepath, sep=";", encoding="utf-8")
        for _, row in df.iterrows():
            org = str(row.get("Organisation", "")).strip()
            if org:
                key = normalize_name(org)
                lookup[key] = {
                    "Adresse": str(row.get("Adresse", "")).strip(),
                    "PLZ": str(row.get("PLZ", "")).strip(),
                    "Ort": str(row.get("Ort", "")).strip(),
                    "Telefon": str(row.get("Telefon", "")).strip(),
                    "Email": str(row.get("E-Mail", "")).strip(),
                    "Website": str(row.get("Internetadresse", "")).strip(),
                }
        print(f"  Loaded {len(lookup)} entries from Anschriftenverzeichnis")
    except Exception as e:
        print(f"  Warning: Could not load Anschriftenverzeichnis: {e}")
    return lookup


def load_wiki_behoerden(filepath: str) -> dict:
    """Load Wikipedia Behörden data for enrichment."""
    lookup = {}
    try:
        df = pd.read_csv(filepath, encoding="utf-8")
        for _, row in df.iterrows():
            name = str(row.get("Name", "")).strip()
            abk = str(row.get("Abkuerzung", "")).strip()
            if name and abk:
                # Use abbreviation as key since Wikipedia data has abbreviation-based entries
                lookup[abk] = {
                    "Sitz_Wiki": str(row.get("Sitz", "")).strip(),
                    "Mitarbeiter_Wiki": str(row.get("Mitarbeiteranzahl", "")).strip(),
                    "Gruendung_Wiki": str(row.get("Gruendungsjahr", "")).strip(),
                    "Hauptsitz_Wiki": str(row.get("Hauptsitz", "")).strip(),
                    "Budget_Wiki": str(row.get("Budget", "")).strip(),
                    "Website_Wiki": str(row.get("Website", "")).strip(),
                    "Rechtsform_Wiki": str(row.get("Rechtsform", "")).strip(),
                    "Wikipedia_URL": str(row.get("Wikipedia_URL", "")).strip(),
                    "Kategorie": str(row.get("Kategorie", "")).strip(),
                }
        print(f"  Loaded {len(lookup)} entries from Wikipedia Behörden")
    except Exception as e:
        print(f"  Warning: Could not load Wikipedia Behörden: {e}")
    return lookup


def load_wiki_unternehmen(filepath: str) -> dict:
    """Load Wikipedia Unternehmen data."""
    lookup = {}
    try:
        df = pd.read_csv(filepath, encoding="utf-8")
        for _, row in df.iterrows():
            firma = str(row.get("Firma", "")).strip()
            if firma:
                key = normalize_name(firma)
                lookup[key] = {
                    "Rechtsform": str(row.get("Rechtsform", "")).strip(),
                    "Sitz": str(row.get("Sitz", "")).strip(),
                    "Beteiligungsfuehrung": str(row.get("Beteiligungsfuehrung", "")).strip(),
                    "Anteil_unmittelbar": str(row.get("Anteil_unmittelbar", "")).strip(),
                    "Beteiligungsart": str(row.get("Beteiligungsart", "")).strip(),
                    "Mitarbeiter": str(row.get("Mitarbeiteranzahl", "")).strip(),
                    "Gruendung": str(row.get("Gruendungsjahr", "")).strip(),
                    "Budget": str(row.get("Budget", "")).strip(),
                    "Website": str(row.get("Website_Infobox", "")).strip(),
                    "Wikipedia_URL": str(row.get("Wikipedia_URL", "")).strip(),
                }
        print(f"  Loaded {len(lookup)} entries from Wikipedia Unternehmen")
    except Exception as e:
        print(f"  Warning: Could not load Wikipedia Unternehmen: {e}")
    return lookup


def normalize_name(name: str) -> str:
    """Normalize entity name for matching."""
    name = name.lower().strip()
    # Remove common suffixes for matching
    for suffix in [" gmbh", " ag", " ggmbh", " mbh", " se", " e.v.", " ev"]:
        name = name.replace(suffix, "")
    # Remove parenthetical content
    name = re.sub(r"\s*\(.*?\)", "", name)
    # Remove extra whitespace
    name = " ".join(name.split())
    return name


def fuzzy_match(name: str, candidates: dict, threshold: float = 0.75) -> str | None:
    """Find best fuzzy match in candidates dict."""
    norm = normalize_name(name)
    best_score = 0
    best_key = None

    for key in candidates:
        score = SequenceMatcher(None, norm, key).ratio()
        if score > best_score and score >= threshold:
            best_score = score
            best_key = key

    return best_key


# ═══════════════════════════════════════════════════════════════════════════
# PHASE 3: Merge all data
# ═══════════════════════════════════════════════════════════════════════════

def merge_data(records, anschrift_lookup, wiki_beh_lookup, wiki_unt_lookup):
    """Enrich records with data from all sources."""
    enriched = []

    for rec in records:
        name = rec["Name"]
        abk = rec.get("Abkuerzung", "")
        typ = rec["Typ"]

        # Start with base record
        entry = {
            "Name": name,
            "Abkürzung": abk,
            "Typ": typ,
            "Untertyp": rec["Untertyp"],
            "Geschäftsbereich": rec["Geschaeftsbereich"],
            "Hauptsitz": "",
            "Adresse": "",
            "PLZ": "",
            "Ort": "",
            "Gründungsjahr": "",
            "Mitarbeiteranzahl": "",
            "Budget/Etat": "",
            "Rechtsform": rec["Untertyp"],
            "Website": "",
            "Wikipedia": "",
            "Telefon": "",
            "E-Mail": "",
        }

        # ── Enrich from Anschriftenverzeichnis ──
        anschr_key = fuzzy_match(name, anschrift_lookup, 0.80)
        if anschr_key:
            ad = anschrift_lookup[anschr_key]
            entry["Adresse"] = ad.get("Adresse", "")
            entry["PLZ"] = ad.get("PLZ", "")
            entry["Ort"] = ad.get("Ort", "")
            entry["Website"] = ad.get("Website", "")
            entry["Telefon"] = ad.get("Telefon", "")
            entry["E-Mail"] = ad.get("Email", "")
            if ad.get("Ort"):
                entry["Hauptsitz"] = ad["Ort"]

        # ── Enrich Behörden from Wikipedia ──
        if typ == "Behörde" and abk and abk in wiki_beh_lookup:
            wb = wiki_beh_lookup[abk]
            if wb.get("Sitz_Wiki") and wb["Sitz_Wiki"] not in ("", "nan", "–"):
                entry["Hauptsitz"] = entry["Hauptsitz"] or wb["Sitz_Wiki"]
            if wb.get("Hauptsitz_Wiki") and wb["Hauptsitz_Wiki"] not in ("", "nan"):
                entry["Hauptsitz"] = entry["Hauptsitz"] or wb["Hauptsitz_Wiki"]
            if wb.get("Wikipedia_URL") and wb["Wikipedia_URL"] not in ("", "nan"):
                entry["Wikipedia"] = wb["Wikipedia_URL"]

        # ── Enrich Unternehmen from Wikipedia ──
        if typ == "Unternehmen":
            unt_key = fuzzy_match(name, wiki_unt_lookup, 0.70)
            if unt_key:
                wu = wiki_unt_lookup[unt_key]
                if wu.get("Sitz") and wu["Sitz"] not in ("", "nan"):
                    entry["Hauptsitz"] = entry["Hauptsitz"] or wu["Sitz"]
                if wu.get("Mitarbeiter") and wu["Mitarbeiter"] not in ("", "nan"):
                    entry["Mitarbeiteranzahl"] = wu["Mitarbeiter"]
                if wu.get("Gruendung") and wu["Gruendung"] not in ("", "nan"):
                    entry["Gründungsjahr"] = wu["Gruendung"]
                if wu.get("Budget") and wu["Budget"] not in ("", "nan"):
                    entry["Budget/Etat"] = wu["Budget"]
                if wu.get("Website") and wu["Website"] not in ("", "nan"):
                    entry["Website"] = entry["Website"] or wu["Website"]
                if wu.get("Wikipedia_URL") and wu["Wikipedia_URL"] not in ("", "nan"):
                    entry["Wikipedia"] = wu["Wikipedia_URL"]
                if wu.get("Beteiligungsart") and wu["Beteiligungsart"] not in ("", "nan"):
                    entry["Rechtsform"] = wu.get("Rechtsform", entry["Rechtsform"])

        # Clean up nan strings
        for k, v in entry.items():
            if str(v) == "nan":
                entry[k] = ""

        enriched.append(entry)

    return enriched


# ═══════════════════════════════════════════════════════════════════════════
# PHASE 4: Generate Excel
# ═══════════════════════════════════════════════════════════════════════════

def create_excel(all_data: list[dict], output_path: str):
    """Create a formatted Excel workbook with multiple sheets."""
    wb = Workbook()

    # ── Styles ──
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    header_fill_beh = PatternFill(start_color="2E4057", end_color="2E4057", fill_type="solid")
    header_fill_unt = PatternFill(start_color="048A81", end_color="048A81", fill_type="solid")
    header_fill_all = PatternFill(start_color="1A1A2E", end_color="1A1A2E", fill_type="solid")
    cell_font = Font(name="Calibri", size=10)
    wrap_alignment = Alignment(wrap_text=True, vertical="top")
    thin_border = Border(
        left=Side(style="thin", color="D0D0D0"),
        right=Side(style="thin", color="D0D0D0"),
        top=Side(style="thin", color="D0D0D0"),
        bottom=Side(style="thin", color="D0D0D0"),
    )
    alt_fill = PatternFill(start_color="F7F9FC", end_color="F7F9FC", fill_type="solid")

    def write_sheet(ws, data: list[dict], columns: list[str], header_fill):
        """Write data to a worksheet with formatting."""
        # Header row
        for col_idx, col_name in enumerate(columns, 1):
            cell = ws.cell(row=1, column=col_idx, value=col_name)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
            cell.border = thin_border

        # Data rows
        for row_idx, record in enumerate(data, 2):
            for col_idx, col_name in enumerate(columns, 1):
                value = record.get(col_name, "")
                cell = ws.cell(row=row_idx, column=col_idx, value=value)
                cell.font = cell_font
                cell.alignment = wrap_alignment
                cell.border = thin_border
                if row_idx % 2 == 0:
                    cell.fill = alt_fill

        # Auto-width columns
        for col_idx, col_name in enumerate(columns, 1):
            max_len = len(col_name)
            for row_idx in range(2, min(len(data) + 2, 50)):
                cell_val = str(ws.cell(row=row_idx, column=col_idx).value or "")
                max_len = max(max_len, min(len(cell_val), 50))
            ws.column_dimensions[get_column_letter(col_idx)].width = min(max_len + 4, 55)

        # Freeze top row
        ws.freeze_panes = "A2"

        # Auto-filter
        if data:
            ws.auto_filter.ref = f"A1:{get_column_letter(len(columns))}{len(data) + 1}"

    # ── Sheet 1: Übersicht (all entities) ──
    ws_all = wb.active
    ws_all.title = "Übersicht"
    all_columns = ["Name", "Abkürzung", "Typ", "Untertyp", "Geschäftsbereich",
                    "Hauptsitz", "Ort", "Gründungsjahr", "Mitarbeiteranzahl",
                    "Budget/Etat", "Rechtsform", "Website", "Wikipedia"]
    write_sheet(ws_all, all_data, all_columns, header_fill_all)

    # ── Sheet 2: Behörden ──
    behoerden = [d for d in all_data if d["Typ"] == "Behörde"]
    ws_beh = wb.create_sheet("Behörden")
    beh_columns = ["Name", "Abkürzung", "Untertyp", "Geschäftsbereich",
                    "Hauptsitz", "Adresse", "PLZ", "Ort",
                    "Mitarbeiteranzahl", "Budget/Etat",
                    "Telefon", "E-Mail", "Website", "Wikipedia"]
    write_sheet(ws_beh, behoerden, beh_columns, header_fill_beh)

    # ── Sheet 3: Unternehmen ──
    unternehmen = [d for d in all_data if d["Typ"] == "Unternehmen"]
    ws_unt = wb.create_sheet("Unternehmen")
    unt_columns = ["Name", "Rechtsform", "Geschäftsbereich",
                    "Hauptsitz", "Ort",
                    "Mitarbeiteranzahl", "Gründungsjahr", "Budget/Etat",
                    "Website", "Wikipedia"]
    write_sheet(ws_unt, unternehmen, unt_columns, header_fill_unt)

    # Save
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    wb.save(output_path)
    print(f"\nExcel saved to: {output_path}")


# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════

def main():
    print("=" * 70)
    print("BUILDING EXCEL: Behörden & Unternehmen des Bundes")
    print("=" * 70)

    # Phase 1: Parse WD3
    print("\n[Phase 1] Parsing WD3 PDF data...")
    records = parse_wd3_text(WD3_DUMP)
    behoerden = [r for r in records if r["Typ"] == "Behörde"]
    unternehmen = [r for r in records if r["Typ"] == "Unternehmen"]
    print(f"  Extracted {len(records)} total entities:")
    print(f"    - {len(behoerden)} Behörden (inkl. oberste Bundesbehörden)")
    print(f"    - {len(unternehmen)} Unternehmen")

    # Phase 2: Load enrichment data
    print("\n[Phase 2] Loading enrichment data...")
    anschrift_lookup = load_anschriftenverzeichnis(ANSCHRIFT)
    wiki_beh_lookup = load_wiki_behoerden(WIKI_BEH)
    wiki_unt_lookup = load_wiki_unternehmen(WIKI_UNT)

    # Phase 3: Merge
    print("\n[Phase 3] Merging data...")
    all_data = merge_data(records, anschrift_lookup, wiki_beh_lookup, wiki_unt_lookup)

    # Statistics
    with_address = sum(1 for d in all_data if d["Ort"])
    with_website = sum(1 for d in all_data if d["Website"])
    with_wiki = sum(1 for d in all_data if d["Wikipedia"])
    print(f"  Enrichment results:")
    print(f"    - {with_address}/{len(all_data)} with address/city")
    print(f"    - {with_website}/{len(all_data)} with website")
    print(f"    - {with_wiki}/{len(all_data)} with Wikipedia link")

    # Phase 4: Generate Excel
    print("\n[Phase 4] Generating Excel...")
    create_excel(all_data, OUTPUT_XLSX)

    # Final summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"Total entities: {len(all_data)}")

    # By Geschäftsbereich
    gb_counts = defaultdict(int)
    for d in all_data:
        gb_counts[d["Geschäftsbereich"]] += 1
    print("\nBy Geschäftsbereich:")
    for gb, count in sorted(gb_counts.items(), key=lambda x: -x[1]):
        print(f"  {gb}: {count}")

    # By Typ
    typ_counts = defaultdict(int)
    for d in all_data:
        typ_counts[d["Typ"]] += 1
    print("\nBy Typ:")
    for typ, count in sorted(typ_counts.items(), key=lambda x: -x[1]):
        print(f"  {typ}: {count}")


if __name__ == "__main__":
    main()
