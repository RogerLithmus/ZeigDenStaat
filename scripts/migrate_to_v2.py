# -*- coding: utf-8 -*-
"""
migrate_to_v2.py – Migriert bestehende Behörden-JSONs auf Schema v1.0 (v2-Format).

Fügt folgende fehlende Felder hinzu:
  - schema_version: "1.0"
  - koordinaten: {"lat": null, "lon": null}
  - haushalt_jahr: null (oder 2025/2026 wenn Budget vorhanden)
  - beschaeftigte_jahr: null
  - daten_qualitaet: {vollstaendigkeit_prozent, zuletzt_verifiziert, verifikation_noetig}
  - recherche_agent_version: "2.0"

Verändert keine bestehenden Werte, nur fehlende Felder werden ergänzt.
"""

import sys
import json
import os
import re
from datetime import date

sys.stdout.reconfigure(encoding="utf-8")

BEHOERDEN_DIR = "data/behoerden"
HEUTE = date.today().isoformat()

# Pflichtfelder für Vollständigkeits-Berechnung (laut v2-Schema)
VOLLSTAENDIGKEITS_FELDER = [
    "name", "kuerzel", "typ", "rechtsform", "sitz", "bundesland", "beschaeftigte",
    "gruendungsjahr", "zustaendigkeit", "website", "rechtsgrundlage", "ministerium_id"
]


def berechne_vollstaendigkeit(obj: dict) -> float:
    """Berechnet Vollständigkeit in % basierend auf den 11 Pflichtfeldern."""
    nicht_null = sum(1 for f in VOLLSTAENDIGKEITS_FELDER if obj.get(f) is not None)
    return round(nicht_null / len(VOLLSTAENDIGKEITS_FELDER) * 100, 1)


def migrate_json(fpath: str) -> dict:
    """Liest eine JSON-Datei und fügt fehlende v2-Felder hinzu."""
    with open(fpath, "r", encoding="utf-8") as f:
        obj = json.load(f)

    modified = False

    # schema_version
    if "schema_version" not in obj:
        obj["schema_version"] = "1.0"
        modified = True

    # koordinaten
    if "koordinaten" not in obj:
        obj["koordinaten"] = {"lat": None, "lon": None}
        modified = True

    # haushalt_jahr
    if "haushalt_jahr" not in obj:
        # Falls ein Haushalt vorhanden ist, nehmen wir 2025 als Default
        if obj.get("haushalt_mio_eur") is not None:
            obj["haushalt_jahr"] = 2025
        else:
            obj["haushalt_jahr"] = None
        modified = True

    # beschaeftigte_jahr
    if "beschaeftigte_jahr" not in obj:
        if obj.get("beschaeftigte") is not None:
            obj["beschaeftigte_jahr"] = 2024
        else:
            obj["beschaeftigte_jahr"] = None
        modified = True

    # daten_qualitaet
    if "daten_qualitaet" not in obj:
        vollst = berechne_vollstaendigkeit(obj)
        obj["daten_qualitaet"] = {
            "vollstaendigkeit_prozent": vollst,
            "zuletzt_verifiziert": obj.get("recherche_datum", HEUTE),
            "verifikation_noetig": vollst < 70
        }
        modified = True
    else:
        # Vollständigkeit neu berechnen
        vollst = berechne_vollstaendigkeit(obj)
        obj["daten_qualitaet"]["vollstaendigkeit_prozent"] = vollst
        obj["daten_qualitaet"]["verifikation_noetig"] = vollst < 70
        modified = True

    # recherche_agent_version
    if "recherche_agent_version" not in obj:
        obj["recherche_agent_version"] = "2.0"
        modified = True

    # beziehungen: quelle-Feld hinzufügen wenn fehlt
    if "beziehungen" in obj and obj["beziehungen"]:
        for bez in obj["beziehungen"]:
            if "quelle" not in bez:
                bez["quelle"] = None
                modified = True

    return obj, modified


def main():
    if not os.path.isdir(BEHOERDEN_DIR):
        print(f"FEHLER: {BEHOERDEN_DIR} nicht gefunden")
        sys.exit(1)

    files = [f for f in os.listdir(BEHOERDEN_DIR) if f.endswith(".json")]
    print(f"Gefundene JSON-Dateien: {len(files)}")

    migriert = 0
    unveraendert = 0
    fehler_list = []

    for fname in sorted(files):
        fpath = os.path.join(BEHOERDEN_DIR, fname)
        try:
            obj, modified = migrate_json(fpath)
            # Atomisch schreiben (temp + rename)
            tmp_path = fpath + ".tmp"
            with open(tmp_path, "w", encoding="utf-8") as f:
                json.dump(obj, f, ensure_ascii=False, indent=2)
            os.replace(tmp_path, fpath)

            if modified:
                migriert += 1
            else:
                unveraendert += 1

        except Exception as e:
            print(f"  FEHLER {fname}: {e}")
            fehler_list.append({"datei": fname, "fehler": str(e)})

    print(f"\n✓ Migriert: {migriert}")
    print(f"  Unverändert: {unveraendert}")
    print(f"✗ Fehler: {len(fehler_list)}")

    if fehler_list:
        for f in fehler_list:
            print(f"  - {f['datei']}: {f['fehler']}")

    return len(fehler_list) == 0


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
