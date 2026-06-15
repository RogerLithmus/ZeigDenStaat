# -*- coding: utf-8 -*-
"""
export.py – Daten in verschiedene Formate exportieren.

Unterstützte Formate: excel, csv, neo4j_cypher, postgres_sql

Alle Spalten werden dynamisch aus dem Schema abgeleitet – keine hardcodierten Feldnamen.

Verwendung:
    python scripts/export.py --format excel --output ./exports/
    python scripts/export.py --format csv,neo4j_cypher,postgres_sql --output ./exports/
    python scripts/export.py --format all --output ./exports/
"""

import sys
import os
import json
import argparse
import csv
import re
from datetime import datetime

sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment
    HAS_OPENPYXL = True
except ImportError:
    HAS_OPENPYXL = False

from utils import _DATA_DIR, _BEHOERDEN_DIR, _SCHEMA_PATH, _BEZIEHUNGEN_PATH, _EXPORT_DIR
from loader import load_behoerden

ALLE_FORMATE = ["excel", "csv", "neo4j_cypher", "postgres_sql"]


def load_schema_fields(schema_path: str) -> list:
    """Extrahiert Feldnamen dynamisch aus dem JSON-Schema."""
    if not os.path.isfile(schema_path):
        return []
    with open(schema_path, "r", encoding="utf-8") as f:
        schema = json.load(f)
    return list(schema.get("properties", {}).keys())





def load_beziehungen(bez_path: str) -> list:
    """Lädt beziehungen.json."""
    if not os.path.isfile(bez_path):
        return []
    with open(bez_path, "r", encoding="utf-8") as f:
        return json.load(f)


def flatten_value(val) -> str:
    """Konvertiert komplexe Werte in Strings für CSV/Excel."""
    if val is None:
        return ""
    if isinstance(val, bool):
        return "true" if val else "false"
    if isinstance(val, (int, float)):
        return str(val)
    if isinstance(val, (dict, list)):
        return json.dumps(val, ensure_ascii=False)
    return str(val)


# ─── EXCEL EXPORT ────────────────────────────────────────────────────────────

def export_excel(alle: list, beziehungen: list, fields: list, output_dir: str):
    """Exportiert nach Excel mit drei Sheets."""
    if not HAS_OPENPYXL:
        print("FEHLER: openpyxl nicht installiert. pip install openpyxl")
        return

    os.makedirs(output_dir, exist_ok=True)
    out_path = os.path.join(output_dir, "behoerden.xlsx")

    wb = openpyxl.Workbook()

    # Header-Style
    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill("solid", fgColor="1F4E79")

    # ── Sheet 1: Behörden ────────────────────────────────────────────────────
    ws_b = wb.active
    ws_b.title = "Behörden"

    # Spalten: alle Schema-Felder außer komplexe (beziehungen, daten_qualitaet → als JSON)
    skip_fields = set()  # keine Felder ausschließen, nur flattenen
    col_fields = [f for f in fields if f not in skip_fields]

    for col_idx, field in enumerate(col_fields, 1):
        cell = ws_b.cell(row=1, column=col_idx, value=field)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal="center")

    for row_idx, obj in enumerate(alle, 2):
        for col_idx, field in enumerate(col_fields, 1):
            val = obj.get(field)
            ws_b.cell(row=row_idx, column=col_idx, value=flatten_value(val))

    ws_b.freeze_panes = "A2"
    ws_b.auto_filter.ref = ws_b.dimensions

    # ── Sheet 2: Beziehungen ─────────────────────────────────────────────────
    ws_r = wb.create_sheet("Beziehungen")
    bez_fields = ["von", "zu", "typ", "richtung", "seit", "quelle"]
    for col_idx, field in enumerate(bez_fields, 1):
        cell = ws_r.cell(row=1, column=col_idx, value=field)
        cell.font = header_font
        cell.fill = header_fill

    for row_idx, bez in enumerate(beziehungen, 2):
        for col_idx, field in enumerate(bez_fields, 1):
            ws_r.cell(row=row_idx, column=col_idx, value=flatten_value(bez.get(field)))

    ws_r.freeze_panes = "A2"
    ws_r.auto_filter.ref = ws_r.dimensions

    # ── Sheet 3: Qualität ────────────────────────────────────────────────────
    ws_q = wb.create_sheet("Qualität")
    quality_headers = ["id", "name", "typ", "vollstaendigkeit_prozent", "verifikation_noetig", "zuletzt_verifiziert"]
    for col_idx, h in enumerate(quality_headers, 1):
        cell = ws_q.cell(row=1, column=col_idx, value=h)
        cell.font = header_font
        cell.fill = header_fill

    for row_idx, obj in enumerate(alle, 2):
        dq = obj.get("daten_qualitaet") or {}
        ws_q.cell(row=row_idx, column=1, value=obj.get("id", ""))
        ws_q.cell(row=row_idx, column=2, value=obj.get("name", ""))
        ws_q.cell(row=row_idx, column=3, value=obj.get("typ", ""))
        ws_q.cell(row=row_idx, column=4, value=dq.get("vollstaendigkeit_prozent", 0))
        ws_q.cell(row=row_idx, column=5, value=str(dq.get("verifikation_noetig", False)))
        ws_q.cell(row=row_idx, column=6, value=dq.get("zuletzt_verifiziert", ""))

    ws_q.freeze_panes = "A2"

    wb.save(out_path)
    print(f"  Excel: {out_path} ({len(alle)} Behörden, {len(beziehungen)} Beziehungen)")


# ─── CSV EXPORT ──────────────────────────────────────────────────────────────

def export_csv(alle: list, beziehungen: list, fields: list, output_dir: str):
    """Exportiert nach CSV."""
    os.makedirs(output_dir, exist_ok=True)

    # Behörden CSV
    b_path = os.path.join(output_dir, "behoerden.csv")
    with open(b_path, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f, delimiter=";")
        writer.writerow(fields)
        for obj in alle:
            writer.writerow([flatten_value(obj.get(field)) for field in fields])
    print(f"  CSV: {b_path}")

    # Beziehungen CSV
    bez_fields = ["von", "zu", "typ", "richtung", "seit", "quelle"]
    r_path = os.path.join(output_dir, "beziehungen.csv")
    with open(r_path, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f, delimiter=";")
        writer.writerow(bez_fields)
        for bez in beziehungen:
            writer.writerow([flatten_value(bez.get(field)) for field in bez_fields])
    print(f"  CSV: {r_path}")


# ─── NEO4J CYPHER EXPORT ─────────────────────────────────────────────────────

def escape_cypher(val) -> str:
    """Escapet einen Wert für Cypher."""
    if val is None:
        return "null"
    if isinstance(val, bool):
        return "true" if val else "false"
    if isinstance(val, (int, float)):
        return str(val)
    if isinstance(val, (dict, list)):
        val = json.dumps(val, ensure_ascii=False)
    return "'" + str(val).replace("'", "\\'") + "'"


def export_neo4j(alle: list, beziehungen: list, fields: list, output_dir: str):
    """Exportiert als Neo4j MERGE-Statements."""
    os.makedirs(output_dir, exist_ok=True)
    out_path = os.path.join(output_dir, "import.cypher")

    # Einfache Felder (kein komplexes Objekt)
    simple_fields = [f for f in fields if f not in ("beziehungen", "koordinaten", "daten_qualitaet", "quellen")]

    with open(out_path, "w", encoding="utf-8") as f:
        f.write("// Neo4j Import – generiert am " + datetime.now().isoformat() + "\n")
        f.write("// Erstellt Knoten und Beziehungen für Bundesbehörden\n\n")

        # Constraint (einmalig ausführen)
        f.write("// Erstelle Constraint (einmalig):\n")
        f.write("// CREATE CONSTRAINT behoerde_id IF NOT EXISTS FOR (b:Behoerde) REQUIRE b.id IS UNIQUE;\n\n")

        # Knoten
        f.write("// === KNOTEN ===\n\n")
        for obj in alle:
            props = {}
            for field in simple_fields:
                val = obj.get(field)
                if val is not None:
                    props[field] = val

            # koordinaten separat
            koord = obj.get("koordinaten") or {}
            if koord.get("lat") is not None:
                props["lat"] = koord["lat"]
                props["lon"] = koord["lon"]

            # daten_qualitaet
            dq = obj.get("daten_qualitaet") or {}
            if dq.get("vollstaendigkeit_prozent") is not None:
                props["vollstaendigkeit_prozent"] = dq["vollstaendigkeit_prozent"]

            props_cypher = ", ".join(f"b.{k} = {escape_cypher(v)}" for k, v in props.items())
            f.write(f"MERGE (b:Behoerde {{id: {escape_cypher(obj.get('id'))}}}) SET {props_cypher};\n")

        # Beziehungen
        f.write("\n// === BEZIEHUNGEN ===\n\n")
        for bez in beziehungen:
            von = escape_cypher(bez.get("von"))
            zu = escape_cypher(bez.get("zu"))
            typ = re.sub(r"[^A-Z_]", "_", (bez.get("typ") or "VERBUNDEN").upper())
            seit = bez.get("seit")
            seit_str = f"seit: {seit}" if seit is not None else ""
            props_str = f" {{{seit_str}}}" if seit_str else ""
            f.write(
                f"MATCH (a:Behoerde {{id: {von}}}), (b:Behoerde {{id: {zu}}}) "
                f"MERGE (a)-[:{typ}{props_str}]->(b);\n"
            )

    print(f"  Neo4j Cypher: {out_path}")


# ─── POSTGRESQL SQL EXPORT ────────────────────────────────────────────────────

def pg_escape(val) -> str:
    """Escapet einen Wert für PostgreSQL."""
    if val is None:
        return "NULL"
    if isinstance(val, bool):
        return "TRUE" if val else "FALSE"
    if isinstance(val, (int, float)):
        return str(val)
    if isinstance(val, (dict, list)):
        val_str = json.dumps(val, ensure_ascii=False)
        return "'" + val_str.replace("'", "''") + "'"
    return "'" + str(val).replace("'", "''") + "'"


def export_postgres(alle: list, beziehungen: list, fields: list, output_dir: str):
    """Exportiert als PostgreSQL UPSERT-Statements."""
    os.makedirs(output_dir, exist_ok=True)
    out_path = os.path.join(output_dir, "import.sql")

    # Einfache Felder für die Haupttabelle
    simple_fields = [f for f in fields if f not in ("beziehungen", "koordinaten", "daten_qualitaet", "quellen")]
    # Erweiterung um abgeleitete Felder
    extra_fields = ["lat", "lon", "vollstaendigkeit_prozent", "verifikation_noetig", "zuletzt_verifiziert", "quellen_json"]
    all_pg_fields = simple_fields + extra_fields

    with open(out_path, "w", encoding="utf-8") as f:
        f.write("-- PostgreSQL Import – generiert am " + datetime.now().isoformat() + "\n")
        f.write("-- Behörden-Datenbank\n\n")

        # Tabellen erstellen
        f.write("-- === TABELLEN ANLEGEN ===\n\n")
        f.write("""CREATE TABLE IF NOT EXISTS behoerden (
    id TEXT PRIMARY KEY,
    excel_id INTEGER,
    schema_version TEXT,
    name TEXT NOT NULL,
    kuerzel TEXT,
    typ TEXT,
    rechtsform TEXT,
    ebene TEXT DEFAULT 'Bund',
    sitz TEXT,
    bundesland TEXT,
    lat DOUBLE PRECISION,
    lon DOUBLE PRECISION,
    gruendungsjahr INTEGER,
    aufgeloest BOOLEAN DEFAULT FALSE,
    aufgeloest_jahr INTEGER,
    zustaendigkeit TEXT,
    website TEXT,
    rechtsgrundlage TEXT,
    haushalt_mio_eur DOUBLE PRECISION,
    haushalt_jahr INTEGER,
    beschaeftigte INTEGER,
    beschaeftigte_jahr INTEGER,
    ministerium_id TEXT,
    ressort TEXT,
    klassifikation TEXT,
    anmerkung TEXT,
    vollstaendigkeit_prozent DOUBLE PRECISION,
    verifikation_noetig BOOLEAN,
    zuletzt_verifiziert TEXT,
    quellen_json JSONB,
    recherche_datum TEXT,
    recherche_agent_version TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);\n\n""")

        f.write("""CREATE TABLE IF NOT EXISTS beziehungen (
    id SERIAL PRIMARY KEY,
    von_id TEXT REFERENCES behoerden(id),
    zu_id TEXT,
    typ TEXT,
    richtung TEXT,
    seit INTEGER,
    quelle TEXT
);\n\n""")

        # UPSERT für Behörden
        f.write("-- === DATEN EINFÜGEN (UPSERT) ===\n\n")
        for obj in alle:
            dq = obj.get("daten_qualitaet") or {}
            koord = obj.get("koordinaten") or {}

            vals = {
                "id": pg_escape(obj.get("id")),
                "excel_id": pg_escape(obj.get("excel_id")),
                "schema_version": pg_escape(obj.get("schema_version")),
                "name": pg_escape(obj.get("name")),
                "kuerzel": pg_escape(obj.get("kuerzel")),
                "typ": pg_escape(obj.get("typ")),
                "rechtsform": pg_escape(obj.get("rechtsform")),
                "ebene": pg_escape(obj.get("ebene", "Bund")),
                "sitz": pg_escape(obj.get("sitz")),
                "bundesland": pg_escape(obj.get("bundesland")),
                "lat": pg_escape(koord.get("lat")),
                "lon": pg_escape(koord.get("lon")),
                "gruendungsjahr": pg_escape(obj.get("gruendungsjahr")),
                "aufgeloest": "TRUE" if obj.get("aufgeloest") else "FALSE",
                "aufgeloest_jahr": pg_escape(obj.get("aufgeloest_jahr")),
                "zustaendigkeit": pg_escape(obj.get("zustaendigkeit")),
                "website": pg_escape(obj.get("website")),
                "rechtsgrundlage": pg_escape(obj.get("rechtsgrundlage")),
                "haushalt_mio_eur": pg_escape(obj.get("haushalt_mio_eur")),
                "haushalt_jahr": pg_escape(obj.get("haushalt_jahr")),
                "beschaeftigte": pg_escape(obj.get("beschaeftigte")),
                "beschaeftigte_jahr": pg_escape(obj.get("beschaeftigte_jahr")),
                "ministerium_id": pg_escape(obj.get("ministerium_id")),
                "ressort": pg_escape(obj.get("ressort")),
                "klassifikation": pg_escape(obj.get("klassifikation")),
                "anmerkung": pg_escape(obj.get("anmerkung")),
                "vollstaendigkeit_prozent": pg_escape(dq.get("vollstaendigkeit_prozent")),
                "verifikation_noetig": "TRUE" if dq.get("verifikation_noetig") else "FALSE",
                "zuletzt_verifiziert": pg_escape(dq.get("zuletzt_verifiziert")),
                "quellen_json": pg_escape(obj.get("quellen", [])),
                "recherche_datum": pg_escape(obj.get("recherche_datum")),
                "recherche_agent_version": pg_escape(obj.get("recherche_agent_version")),
            }

            cols = ", ".join(vals.keys())
            vvals = ", ".join(vals.values())
            update_set = ", ".join(f"{k} = EXCLUDED.{k}" for k in vals if k != "id")

            f.write(
                f"INSERT INTO behoerden ({cols}) VALUES ({vvals})\n"
                f"  ON CONFLICT (id) DO UPDATE SET {update_set};\n"
            )

        # UPSERT für Beziehungen
        f.write("\n-- === BEZIEHUNGEN EINFÜGEN ===\n\n")
        f.write("TRUNCATE TABLE beziehungen RESTART IDENTITY;\n")
        for bez in beziehungen:
            f.write(
                f"INSERT INTO beziehungen (von_id, zu_id, typ, richtung, seit, quelle) VALUES "
                f"({pg_escape(bez.get('von'))}, {pg_escape(bez.get('zu'))}, "
                f"{pg_escape(bez.get('typ'))}, {pg_escape(bez.get('richtung'))}, "
                f"{pg_escape(bez.get('seit'))}, {pg_escape(bez.get('quelle'))});\n"
            )

    print(f"  PostgreSQL SQL: {out_path}")


# ─── HAUPTPROGRAMM ────────────────────────────────────────────────────────────

def run(formate_str="excel,csv", output_dir=_EXPORT_DIR, data_dir=_BEHOERDEN_DIR, schema_path=_SCHEMA_PATH, beziehungen_path=_BEZIEHUNGEN_PATH):
    formate = formate_str.lower().split(",")
    if "all" in formate:
        formate = ALLE_FORMATE

    print(f"Lade Daten aus {data_dir}...")
    alle = load_behoerden(data_dir=data_dir)
    beziehungen = load_beziehungen(beziehungen_path)
    fields = load_schema_fields(schema_path)
    if not fields:
        fields = list(alle[0].keys()) if alle else []
    print(f"  {len(alle)} Behörden, {len(beziehungen)} Beziehungen, {len(fields)} Schema-Felder")

    os.makedirs(output_dir, exist_ok=True)
    print(f"\nExportiere nach {output_dir}:")

    for fmt in formate:
        fmt = fmt.strip()
        if fmt == "excel":
            export_excel(alle, beziehungen, fields, output_dir)
        elif fmt == "csv":
            export_csv(alle, beziehungen, fields, output_dir)
        elif fmt == "neo4j_cypher":
            export_neo4j(alle, beziehungen, fields, output_dir)
        elif fmt == "postgres_sql":
            export_postgres(alle, beziehungen, fields, output_dir)
        else:
            print(f"WARN: Unbekanntes Format: {fmt}")

    print(f"\nExport abgeschlossen.")
    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Daten exportieren")
    parser.add_argument("--format", default="excel,csv", help="Kommaseparierte Formate: excel, csv, neo4j_cypher, postgres_sql, all")
    parser.add_argument("--output", default=_EXPORT_DIR)
    parser.add_argument("--data-dir", default=_BEHOERDEN_DIR)
    parser.add_argument("--schema", default=_SCHEMA_PATH)
    parser.add_argument("--beziehungen", default=_BEZIEHUNGEN_PATH)
    args = parser.parse_args()
    
    run(formate_str=args.format, output_dir=args.output, data_dir=args.data_dir, schema_path=args.schema, beziehungen_path=args.beziehungen)
