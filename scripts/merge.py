
import sys
import os
import json
import argparse
from datetime import datetime

sys.stdout.reconfigure(encoding="utf-8")

from utils import _BEHOERDEN_DIR, _DATA_DIR



def run() -> bool:
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



if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Datenqualität prüfen")
    parser.add_argument("--data-dir", default=_BEHOERDEN_DIR)
    args = parser.parse_args()

    success = run()
    sys.exit(0 if success else 1)