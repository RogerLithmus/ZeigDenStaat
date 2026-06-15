# -*- coding: utf-8 -*-
"""
update_single.py – Einzelne Behörde aktualisieren.

Liest die bestehende JSON als Basis, merged neue Daten, schreibt zurück und loggt.
Bestehende Werte werden nur überschrieben wenn neuer Wert nicht null ist (außer --force-overwrite).

Verwendung:
    python scripts/update_single.py --id bka
    python scripts/update_single.py --id bka --force-overwrite
    python scripts/update_single.py --id bka --set haushalt_mio_eur=1050.5 --set beschaeftigte=8800
"""

import sys
import os
import json
import argparse
from datetime import datetime, date

sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from utils import VOLLSTAENDIGKEITS_FELDER, compute_vollstaendigkeit, _BEHOERDEN_DIR, _LOG_PATH





def log_update(log_path: str, entry: dict):
    """Fügt einen Eintrag in das append-only Update-Log ein."""
    os.makedirs(os.path.dirname(log_path), exist_ok=True)
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


def merge_objects(existing: dict, updates: dict, force_overwrite: bool = False) -> tuple[dict, list]:
    """
    Merged Updates in das bestehende Objekt.

    Bestehende Werte werden nur überschrieben wenn:
    - force_overwrite=True, ODER
    - der neue Wert nicht None ist UND der alte Wert None ist

    Returns:
        (aktualisiertes_obj, liste_der_geaenderten_felder)
    """
    changed_fields = []
    for key, new_val in updates.items():
        old_val = existing.get(key)
        if force_overwrite and new_val is not None:
            if old_val != new_val:
                existing[key] = new_val
                changed_fields.append(key)
        elif old_val is None and new_val is not None:
            existing[key] = new_val
            changed_fields.append(key)
    return existing, changed_fields


def parse_set_args(set_args: list) -> dict:
    """
    Parst --set key=value Argumente.
    Versucht Zahlen automatisch zu konvertieren.
    """
    updates = {}
    for s in set_args or []:
        if "=" not in s:
            print(f"WARN: Ungültiges --set Argument: '{s}' (erwartet key=value)", file=sys.stderr)
            continue
        key, _, raw_val = s.partition("=")
        # Typkonvertierung
        if raw_val.lower() == "null":
            val = None
        elif raw_val.lower() in ("true", "false"):
            val = raw_val.lower() == "true"
        else:
            try:
                if "." in raw_val:
                    val = float(raw_val)
                else:
                    val = int(raw_val)
            except ValueError:
                val = raw_val
        updates[key.strip()] = val
    return updates


def run(
    behörden_id: str,
    data_dir: str = _BEHOERDEN_DIR,
    log_path: str = _LOG_PATH,
    force_overwrite: bool = False,
    manual_updates: dict = None,
    dry_run: bool = False,
) -> dict:
    """
    Aktualisiert eine einzelne Behörde.

    Args:
        behörden_id: ID der Behörde (entspricht Dateiname ohne .json)
        data_dir: Verzeichnis mit den Behörden-JSONs
        log_path: Pfad zum Update-Log
        force_overwrite: Überschreibt auch vorhandene Werte
        manual_updates: Dict mit manuell gesetzten Werten (von --set)
        dry_run: Keine Dateien schreiben

    Returns:
        Aktualisiertes Behörden-Objekt
    """
    fpath = os.path.join(data_dir, f"{behörden_id}.json")
    if not os.path.isfile(fpath):
        print(f"FEHLER: Datei nicht gefunden: {fpath}")
        sys.exit(1)

    # Bestehende JSON laden
    with open(fpath, "r", encoding="utf-8") as f:
        obj = json.load(f)

    vorher_vollst = compute_vollstaendigkeit(obj)

    # Updates zusammenstellen
    all_updates = {}

    # Manuelle --set Updates
    if manual_updates:
        all_updates.update(manual_updates)

    # Immer: recherche_datum und agent_version aktualisieren
    all_updates["recherche_datum"] = date.today().isoformat()
    all_updates["recherche_agent_version"] = "2.0"

    # Merger anwenden
    obj, changed_fields = merge_objects(obj, all_updates, force_overwrite=force_overwrite)

    # Vollständigkeit neu berechnen
    nachher_vollst = compute_vollstaendigkeit(obj)
    obj["daten_qualitaet"] = {
        "vollstaendigkeit_prozent": nachher_vollst,
        "zuletzt_verifiziert": date.today().isoformat(),
        "verifikation_noetig": nachher_vollst < 70,
    }

    if not dry_run:
        # Atomisch schreiben
        tmp = fpath + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(obj, f, ensure_ascii=False, indent=2)
        os.replace(tmp, fpath)

        # Log-Eintrag
        log_entry = {
            "id": behörden_id,
            "timestamp": datetime.now().isoformat(),
            "felder_aktualisiert": changed_fields,
            "vorher_vollstaendigkeit": vorher_vollst,
            "nachher_vollstaendigkeit": nachher_vollst,
            "force_overwrite": force_overwrite,
        }
        log_update(log_path, log_entry)

    print(f"  {'[DRY-RUN] ' if dry_run else ''}Updated: {behörden_id}")
    print(f"  Geänderte Felder: {changed_fields or 'keine'}")
    print(f"  Vollständigkeit: {vorher_vollst}% → {nachher_vollst}%")

    return obj


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Einzelne Behörde aktualisieren")
    parser.add_argument("--id", required=True, help="Behörden-ID (z.B. bka)")
    parser.add_argument("--data-dir", default=_BEHOERDEN_DIR)
    parser.add_argument("--log", default=_LOG_PATH)
    parser.add_argument(
        "--force-overwrite",
        action="store_true",
        help="Auch bestehende (nicht-null) Werte überschreiben"
    )
    parser.add_argument(
        "--set",
        action="append",
        metavar="FELD=WERT",
        help="Setze ein Feld direkt, z.B. --set haushalt_mio_eur=1050.5"
    )
    parser.add_argument("--dry-run", action="store_true", help="Keine Dateien schreiben")
    args = parser.parse_args()

    manual_updates = parse_set_args(args.set)

    run(
        behörden_id=args.id,
        data_dir=args.data_dir,
        log_path=args.log,
        force_overwrite=args.force_overwrite,
        manual_updates=manual_updates,
        dry_run=args.dry_run,
    )
