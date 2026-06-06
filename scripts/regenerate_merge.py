# -*- coding: utf-8 -*-
"""Regeneriert alle_behoerden.json und beziehungen.json aus den Einzeldateien."""
import sys, json, os
sys.stdout.reconfigure(encoding="utf-8")

bdir = "data/behoerden"
alle = []
for fname in sorted(os.listdir(bdir)):
    if fname.endswith(".json"):
        with open(os.path.join(bdir, fname), "r", encoding="utf-8") as f:
            alle.append(json.load(f))

with open("data/alle_behoerden.json", "w", encoding="utf-8") as f:
    json.dump(alle, f, ensure_ascii=False, indent=2)
print(f"alle_behoerden.json: {len(alle)} Eintraege")

# beziehungen.json
bez = []
for b in alle:
    for r in b.get("beziehungen", []):
        bez.append({
            "von": b["id"],
            "zu": r["zu_id"],
            "typ": r["typ"],
            "richtung": r.get("richtung"),
            "seit": r.get("seit"),
            "quelle": r.get("quelle")
        })
with open("data/beziehungen.json", "w", encoding="utf-8") as f:
    json.dump(bez, f, ensure_ascii=False, indent=2)
print(f"beziehungen.json: {len(bez)} Beziehungen")

# Stichprobe
s = alle[0]
print("Sample id:", s.get("id"))
print("Schema_version:", s.get("schema_version"))
dq = s.get("daten_qualitaet", {})
print("Vollstaendigkeit:", dq.get("vollstaendigkeit_prozent"))
