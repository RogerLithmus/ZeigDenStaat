# -*- coding: utf-8 -*-
"""
validate.py – Datenqualität prüfen und Qualitätsbericht generieren.

Prüft:
  1. Schema-Konformität (jsonschema)
  2. Referenzintegrität (beziehungen[].zu_id existiert als Datei)
  3. Konsistenz (ministerium_id zeigt auf Datei mit typ=Ministerium)
  4. Feldvollständigkeit

Ausgabe:
  ./data/qualitaetsbericht.json

Exit-Code:
  0 = sauber
  1 = kritische Fehler

Verwendung:
    python scripts/validate.py [--data-dir PATH] [--strict]
"""

import sys
import os
import json
import argparse
from datetime import datetime

sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    import jsonschema
    HAS_JSONSCHEMA = True
except ImportError:
    HAS_JSONSCHEMA = False
    print("WARN: jsonschema nicht installiert. Schema-Validierung deaktiviert.", file=sys.stderr)

from utils import VOLLSTAENDIGKEITS_FELDER, compute_vollstaendigkeit, _DATA_DIR, _BEHOERDEN_DIR, _SCHEMA_PATH, _ROOT

_DEFAULT_BERICHT_PATH = os.path.join(_DATA_DIR, "qualitaetsbericht.json")


def load_all_behoerden(bdir: str) -> dict:
    """Lädt alle JSONs und gibt {id: obj} Dict zurück."""
    result = {}
    for fname in sorted(os.listdir(bdir)):
        if not fname.endswith(".json"):
            continue
        fpath = os.path.join(bdir, fname)
        try:
            with open(fpath, "r", encoding="utf-8") as f:
                obj = json.load(f)
            bid = obj.get("id", fname.replace(".json", ""))
            result[bid] = obj
        except Exception as e:
            print(f"WARN: {fname} nicht lesbar: {e}", file=sys.stderr)
    return result


def validate_schema(obj: dict, schema: dict) -> list:
    """Gibt Liste von Schema-Fehlern zurück."""
    if not HAS_JSONSCHEMA or not schema:
        return []
    errors = []
    try:
        jsonschema.validate(instance=obj, schema=schema)
    except jsonschema.ValidationError as e:
        errors.append(e.message)
    except jsonschema.SchemaError as e:
        errors.append(f"Schema-Fehler: {e.message}")
    return errors



def run(
    bdir=_BEHOERDEN_DIR,
    schema_path=_SCHEMA_PATH,
    output_path=_DEFAULT_BERICHT_PATH,
    strict=False
):

    if not os.path.isdir(bdir):
        print(f"FEHLER: {bdir} nicht gefunden")
        return False

    # Schema laden
    schema = None
    if os.path.isfile(schema_path) and HAS_JSONSCHEMA:
        with open(schema_path, "r", encoding="utf-8") as f:
            schema = json.load(f)
        print(f"Schema geladen: {schema_path}")
    else:
        print("WARN: Kein Schema gefunden oder jsonschema nicht installiert.")

    # Alle Behörden laden
    alle = load_all_behoerden(bdir)
    print(f"Geladen: {len(alle)} Behörden")

    # Alle bekannten IDs für Referenzprüfung
    alle_ids = set(alle.keys())

    # Ergebnis-Strukturen
    schema_fehler = []
    referenz_fehler = []
    konsistenz_fehler = []
    fehlende_felder = {f: [] for f in VOLLSTAENDIGKEITS_FELDER}
    vollstaendigkeit_pro_feld = {}
    vollstaendigkeiten = []

    # Dynamisch: welche IDs haben typ=Ministerium?
    ministerium_ids = {
        bid for bid, obj in alle.items()
        if obj.get("typ") in ("Ministerium", "Verfassungsorgan")
    }

    for bid, obj in sorted(alle.items()):
        # 1. Schema-Validierung
        if schema:
            errs = validate_schema(obj, schema)
            for e in errs:
                schema_fehler.append({"id": bid, "fehler": e})

        # 2. Referenzintegrität: beziehungen[].zu_id
        for bez in obj.get("beziehungen", []):
            zu_id = bez.get("zu_id")
            if zu_id and zu_id not in alle_ids:
                referenz_fehler.append({
                    "id": bid,
                    "zu_id": zu_id,
                    "fehler": f"Referenz zu '{zu_id}' existiert nicht als Datei"
                })

        # 3. Konsistenz: ministerium_id → muss ein Ministerium/Verfassungsorgan sein
        mid = obj.get("ministerium_id")
        if mid:
            if mid not in alle_ids:
                referenz_fehler.append({
                    "id": bid,
                    "zu_id": mid,
                    "fehler": f"ministerium_id '{mid}' existiert nicht als Datei"
                })
            elif mid not in ministerium_ids:
                konsistenz_fehler.append({
                    "id": bid,
                    "ministerium_id": mid,
                    "fehler": f"ministerium_id '{mid}' hat nicht typ=Ministerium/Verfassungsorgan"
                })

        # 4. Fehlende Pflichtfelder
        for feld in VOLLSTAENDIGKEITS_FELDER:
            if obj.get(feld) is None:
                fehlende_felder[feld].append(bid)

        # 5. Vollständigkeit
        vollst = compute_vollstaendigkeit(obj)
        vollstaendigkeiten.append(vollst)

    # Vollständigkeit pro Feld berechnen (dynamisch aus Daten)
    total = len(alle)
    for feld in VOLLSTAENDIGKEITS_FELDER:
        fehlend_count = len(fehlende_felder[feld])
        vollstaendigkeit_pro_feld[feld] = round((total - fehlend_count) / total * 100, 1) if total else 0

    # Durchschnittliche Vollständigkeit
    avg_vollst = round(sum(vollstaendigkeiten) / len(vollstaendigkeiten), 1) if vollstaendigkeiten else 0

    # Bericht zusammenstellen
    bericht = {
        "gesamt": total,
        "schema_fehler": schema_fehler,
        "referenz_fehler": referenz_fehler,
        "konsistenz_fehler": konsistenz_fehler,
        "fehlende_felder": {k: v for k, v in fehlende_felder.items() if v},
        "vollstaendigkeit_pro_feld": vollstaendigkeit_pro_feld,
        "durchschnittliche_vollstaendigkeit": avg_vollst,
        "behoerden_unter_50_prozent": [
            {"id": bid, "vollstaendigkeit": v}
            for bid, v in zip(sorted(alle.keys()), vollstaendigkeiten)
            if v < 50
        ],
        "generiert_am": datetime.now().isoformat(),
        "data_dir": bdir,
    }

    # Bericht schreiben
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(bericht, f, ensure_ascii=False, indent=2)
    print(f"Qualitaetsbericht gespeichert: {output_path}")

    # Zusammenfassung ausgeben
    print(f"\n=== QUALITAETSBERICHT ===")
    print(f"Gesamt Behoerden: {total}")
    print(f"Schema-Fehler: {len(schema_fehler)}")
    print(f"Referenz-Fehler: {len(referenz_fehler)}")
    print(f"Konsistenz-Fehler: {len(konsistenz_fehler)}")
    print(f"Durchschnittliche Vollstaendigkeit: {avg_vollst}%")
    print(f"\nVollstaendigkeit pro Feld:")
    for feld, pct in sorted(vollstaendigkeit_pro_feld.items(), key=lambda x: x[1]):
        bar = "=" * int(pct / 10)
        print(f"  {feld:30s}: {bar:<10} {pct:5.1f}%")

    # Exit-Code
    kritische_fehler = len(schema_fehler) + len(referenz_fehler)
    if strict:
        kritische_fehler += len(konsistenz_fehler)

    if kritische_fehler > 0:
        print(f"\n[EXIT 1] {kritische_fehler} kritische Fehler gefunden.")
        return False
    else:
        print(f"\n[EXIT 0] Validierung erfolgreich.")
        return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Datenqualität prüfen")
    parser.add_argument("--data-dir", default=_BEHOERDEN_DIR)
    parser.add_argument("--schema", default=_SCHEMA_PATH)
    parser.add_argument("--output", default=_DEFAULT_BERICHT_PATH)
    parser.add_argument("--strict", action="store_true", help="Fehler bei jeder Warnung")
    args = parser.parse_args()

    success = run(
        bdir=args.data_dir,
        schema_path=args.schema,
        output_path=args.output,
        strict=args.strict
    )
    sys.exit(0 if success else 1)
