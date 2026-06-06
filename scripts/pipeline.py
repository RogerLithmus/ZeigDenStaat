# -*- coding: utf-8 -*-
"""
pipeline.py – Orchestriert alle Pipeline-Schritte.

Schritte:
  1. enrich_geodata  – Fehlende Geo-Daten via Nominatim nachladen
  2. validate        – Qualitätsprüfung + qualitaetsbericht.json
  3. merge           – alle_behoerden.json + beziehungen.json aktualisieren
  4. export          – alle Formate generieren

Verwendung:
    python scripts/pipeline.py
    python scripts/pipeline.py --skip enrich_geodata
    python scripts/pipeline.py --only validate,merge
    python scripts/pipeline.py --format excel,csv
"""

import sys
import os
import json
import argparse
import subprocess
from datetime import datetime

sys.stdout.reconfigure(encoding="utf-8")

_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, _ROOT)
_SCRIPTS_DIR = os.path.join(_ROOT, "scripts")
_DATA_DIR = os.path.join(_ROOT, "data")
_BEHOERDEN_DIR = os.path.join(_DATA_DIR, "behoerden")
_EXPORT_DIR = os.path.join(_ROOT, "exports")

ALL_STEPS = ["generate", "enrich_geodata", "validate", "merge", "export"]


def run_step(step: str, extra_args: list = None) -> bool:
    """
    Führt einen Pipeline-Schritt in-process aus.

    Returns:
        True wenn erfolgreich, False bei Fehler
    """
    extra_args = extra_args or []
    
    if step == "merge":
        return run_merge()

    print(f"\n  Führe {step} in-process aus mit Argumenten: {extra_args}")
    
    original_argv = sys.argv
    try:
        sys.argv = [sys.executable] + extra_args
        
        if step == "generate":
            from scripts.generate_behoerden import main as generate_main
            generate_main()
        elif step == "enrich_geodata":
            from scripts.enrich_geodata import main as enrich_main
            enrich_main()
        elif step == "validate":
            from scripts.validate import main as validate_main
            validate_main()
        elif step == "export":
            from scripts.export import main as export_main
            export_main()
        else:
            print(f"  WARN: Unbekannter Schritt: {step}")
            return False
            
        return True
    except SystemExit as e:
        return e.code == 0 or e.code is None
    except Exception as e:
        print(f"FEHLER im Schritt {step}: {e}", file=sys.stderr)
        return False
    finally:
        sys.argv = original_argv


def run_merge() -> bool:
    """Regeneriert alle_behoerden.json und beziehungen.json."""
    print("\n  Merge: alle_behoerden.json + beziehungen.json")

    if not os.path.isdir(_BEHOERDEN_DIR):
        print(f"  FEHLER: {_BEHOERDEN_DIR} nicht gefunden")
        return False

    alle = []
    for fname in sorted(os.listdir(_BEHOERDEN_DIR)):
        if fname.endswith(".json"):
            fpath = os.path.join(_BEHOERDEN_DIR, fname)
            try:
                with open(fpath, "r", encoding="utf-8") as f:
                    alle.append(json.load(f))
            except Exception as e:
                print(f"  WARN: {fname}: {e}")

    # alle_behoerden.json
    all_path = os.path.join(_DATA_DIR, "alle_behoerden.json")
    with open(all_path, "w", encoding="utf-8") as f:
        json.dump(alle, f, ensure_ascii=False, indent=2)
    print(f"  → {all_path} ({len(alle)} Einträge)")

    # beziehungen.json
    bez = []
    for b in alle:
        for r in b.get("beziehungen", []):
            bez.append({
                "von": b["id"],
                "zu": r.get("zu_id"),
                "typ": r.get("typ"),
                "richtung": r.get("richtung"),
                "seit": r.get("seit"),
                "quelle": r.get("quelle"),
            })
    bez_path = os.path.join(_DATA_DIR, "beziehungen.json")
    with open(bez_path, "w", encoding="utf-8") as f:
        json.dump(bez, f, ensure_ascii=False, indent=2)
    print(f"  → {bez_path} ({len(bez)} Beziehungen)")

    # fortschritt.json aktualisieren
    alle_ids = [b.get("id") for b in alle if b.get("id")]
    fort_path = os.path.join(_DATA_DIR, "fortschritt.json")
    fort = {
        "erledigt": alle_ids,
        "offen": [],
        "fehler": [],
        "gestartet": datetime.now().isoformat(),
        "aktualisiert": datetime.now().isoformat(),
        "gesamt": len(alle_ids),
    }
    with open(fort_path, "w", encoding="utf-8") as f:
        json.dump(fort, f, ensure_ascii=False, indent=2)
    print(f"  → fortschritt.json ({len(alle_ids)} erledigt)")

    return True


def main():
    parser = argparse.ArgumentParser(description="Pipeline-Orchestrierung")
    parser.add_argument(
        "--skip",
        help="Kommaseparierte Schritte überspringen: " + ", ".join(ALL_STEPS)
    )
    parser.add_argument(
        "--only",
        help="Nur diese Schritte ausführen: " + ", ".join(ALL_STEPS)
    )
    parser.add_argument(
        "--format",
        default="excel,csv,neo4j_cypher,postgres_sql",
        help="Export-Formate (für export-Schritt)"
    )
    parser.add_argument("--data-dir", default=_BEHOERDEN_DIR)
    parser.add_argument("--output", default=_EXPORT_DIR)
    args = parser.parse_args()

    # Schritte bestimmen
    steps = ALL_STEPS[:]
    if args.only:
        steps = [s.strip() for s in args.only.split(",") if s.strip() in ALL_STEPS]
    if args.skip:
        skip_set = {s.strip() for s in args.skip.split(",")}
        steps = [s for s in steps if s not in skip_set]

    print(f"Pipeline startet: {datetime.now().isoformat()}")
    print(f"Schritte: {', '.join(steps)}")

    results = {}
    for step in steps:
        print(f"\n{'='*50}")
        print(f"SCHRITT: {step}")
        print(f"{'='*50}")

        extra = []
        if step == "export":
            extra = ["--format", args.format, "--output", args.output]

        success = run_step(step, extra_args=extra)
        results[step] = "OK" if success else "FEHLER"
        print(f"\n  [{results[step]}] {step}")

    # Abschluss
    print(f"\n{'='*50}")
    print(f"Pipeline abgeschlossen: {datetime.now().isoformat()}")
    print(f"\nErgebnisse:")
    for step, status in results.items():
        icon = "✓" if status == "OK" else "✗"
        print(f"  {icon} {step}: {status}")

    fehler_count = sum(1 for s in results.values() if s == "FEHLER")
    sys.exit(0 if fehler_count == 0 else 1)


if __name__ == "__main__":
    main()
