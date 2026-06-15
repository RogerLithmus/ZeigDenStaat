#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
cli.py – ZeigDenStaat Zentrale Kommandozeile (CLI)

Verwendung:
  python scripts/cli.py [Kommando] [Optionen]

Beispiele:
  python scripts/cli.py generate
  python scripts/cli.py enrich --all
  python scripts/cli.py export --format csv
  python scripts/cli.py update --id bka --set beschaeftigte=8800
  python scripts/cli.py validate
"""

import sys
import os
import argparse

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts import generate_behoerden
from scripts import enrich_geodata
from scripts import export
from scripts import update_single
from scripts import validate
from scripts import merge

def main():
    parser = argparse.ArgumentParser(description="ZeigDenStaat CLI - Zentrale Verwaltung der Behördendaten")
    subparsers = parser.add_subparsers(dest="command", help="Verfügbare Kommandos")

    parser_merge = subparsers.add_parser("merge")

    # --- generate ---
    parser_generate = subparsers.add_parser("generate", help="Generiert alle Bundesbehörden-JSONs (aus Excel/Templates)")
    parser_generate.add_argument("--dry-run", action="store_true", help="Nur simulieren")

    # --- enrich ---
    parser_enrich = subparsers.add_parser("enrich", help="Reichert Behörden mit Geodaten (Nominatim) an")
    parser_enrich.add_argument("--all", action="store_true", help="Alle neu geocodieren (auch bestehende)")
    parser_enrich.add_argument("--sleep", type=float, default=1.1, help="Wartezeit zwischen Anfragen")

    # --- export ---
    parser_export = subparsers.add_parser("export", help="Exportiert die Behörden in ein bestimmtes Format")
    parser_export.add_argument("--format", choices=["csv", "sqlite", "json-flat"], default="csv")

    # --- update ---
    parser_update = subparsers.add_parser("update", help="Aktualisiert eine einzelne Behörde")
    parser_update.add_argument("--id", required=True, help="Behörden-ID (z.B. bka)")
    parser_update.add_argument("--force-overwrite", action="store_true", help="Auch bestehende Werte überschreiben")
    parser_update.add_argument("--set", action="append", metavar="FELD=WERT", help="Setze ein Feld direkt, z.B. --set haushalt_mio_eur=1050.5")
    parser_update.add_argument("--dry-run", action="store_true", help="Keine Dateien schreiben")

    # --- validate ---
    parser_validate = subparsers.add_parser("validate", help="Datenqualität prüfen und Bericht generieren")
    parser_validate.add_argument("--strict", action="store_true", help="Fehler bei jeder Warnung")

    args = parser.parse_args()

    if args.command == "generate":
        success = generate_behoerden.run(dry_run=args.dry_run)
        sys.exit(0 if success else 1)

    elif args.command == "enrich":
        enrich_geodata.run(force_all=args.all, sleep_time=args.sleep)
        sys.exit(0)

    elif args.command == "export":
        export.run(format_type=args.format)
        sys.exit(0)

    elif args.command == "update":
        manual_updates = update_single.parse_set_args(args.set)
        update_single.run(
            behörden_id=args.id,
            force_overwrite=args.force_overwrite,
            manual_updates=manual_updates,
            dry_run=args.dry_run
        )
        sys.exit(0)

    elif args.command == "validate":
        success = validate.run(strict=args.strict)
        sys.exit(0 if success else 1)

    elif args.command == "merge":
        success = merge.run()
        sys.exit(0 if success else 1)
        
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
