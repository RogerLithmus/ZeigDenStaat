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

# Standardpfade
_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_DEFAULT_DATA_DIR = os.path.join(_ROOT, "data", "behoerden")
_DEFAULT_SCHEMA_PATH = os.path.join(_ROOT, "data", "schema_v1.json")
_DEFAULT_BERICHT_PATH = os.path.join(_ROOT, "data", "qualitaetsbericht.json")

# Felder für Vollständigkeits-Berechnung (aus Schema-Anforderungen)
VOLLSTAENDIGKEITS_FELDER = [
    "name", "kuerzel", "typ", "rechtsform", "sitz", "bundesland", "beschaeftigte",
    "gruendungsjahr", "zustaendigkeit", "website", "rechtsgrundlage", "ministerium_id"
]


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


def compute_vollstaendigkeit(obj: dict) -> float:
    """Berechnet Vollständigkeit aus den definierten Pflichtfeldern."""
    nicht_null = sum(1 for f in VOLLSTAENDIGKEITS_FELDER if obj.get(f) is not None)
    return round(nicht_null / len(VOLLSTAENDIGKEITS_FELDER) * 100, 1)


def main():
    parser = argparse.ArgumentParser(description="Datenqualität prüfen")
    parser.add_argument("--data-dir", default=_DEFAULT_DATA_DIR)
    parser.add_argument("--schema", default=_DEFAULT_SCHEMA_PATH)
    parser.add_argument("--output", default=_DEFAULT_BERICHT_PATH)
    parser.add_argument("--strict", action="store_true", help="Fehler bei jeder Warnung")
    args = parser.parse_args()

    bdir = args.data_dir
    if not os.path.isdir(bdir):
        print(f"FEHLER: {bdir} nicht gefunden")
        sys.exit(1)

    # Schema laden
    schema = None
    if os.path.isfile(args.schema) and HAS_JSONSCHEMA:
        with open(args.schema, "r", encoding="utf-8") as f:
            schema = json.load(f)
        print(f"Schema geladen: {args.schema}")
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
    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(bericht, f, ensure_ascii=False, indent=2)
    print(f"Qualitaetsbericht gespeichert: {args.output}")

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
    if args.strict:
        kritische_fehler += len(konsistenz_fehler)

    if kritische_fehler > 0:
        print(f"\n[EXIT 1] {kritische_fehler} kritische Fehler gefunden.")
        sys.exit(1)
    else:
        print(f"\n[EXIT 0] Validierung erfolgreich.")
        sys.exit(0)


if __name__ == "__main__":
    main()
