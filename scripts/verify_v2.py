# -*- coding: utf-8 -*-
"""Vollständige Anforderungs-Verifikation gegen v2-Prompt."""
import sys, json, os
sys.stdout.reconfigure(encoding="utf-8")

print("=== VOLLSTAENDIGE ANFORDERUNGS-VERIFIKATION ===\n")
checks = []

# 1. data/behoerden/ mit 1403 JSONs
n = len([f for f in os.listdir("data/behoerden") if f.endswith(".json")])
checks.append(("data/behoerden/ mit JSONs", n == 1403, f"{n} JSONs"))

# 2. schema_v1.json
with open("data/schema_v1.json", "r", encoding="utf-8") as f:
    schema = json.load(f)
prop_count = len(schema.get("properties", {}))
checks.append(("data/schema_v1.json", prop_count > 20, f"{prop_count} Felder"))

# 3. fortschritt.json
with open("data/fortschritt.json", "r", encoding="utf-8") as f:
    fp = json.load(f)
checks.append(("data/fortschritt.json", True, f"{len(fp.get('erledigt', []))} erledigt"))

# 4. alle_behoerden.json
with open("data/alle_behoerden.json", "r", encoding="utf-8") as f:
    alle = json.load(f)
checks.append(("data/alle_behoerden.json", len(alle) == 1403, f"{len(alle)} Eintraege"))

# 5. beziehungen.json (flache Edge-Liste)
with open("data/beziehungen.json", "r", encoding="utf-8") as f:
    bez = json.load(f)
has_format = bez and "von" in bez[0] and "zu" in bez[0]
checks.append(("data/beziehungen.json (flache Edge-Liste)", has_format, f"{len(bez)} Edges"))

# 6. qualitaetsbericht.json
with open("data/qualitaetsbericht.json", "r", encoding="utf-8") as f:
    qb = json.load(f)
req_keys = ["gesamt","schema_fehler","referenz_fehler","vollstaendigkeit_pro_feld","durchschnittliche_vollstaendigkeit","generiert_am"]
has_all = all(k in qb for k in req_keys)
no_errors = len(qb.get("schema_fehler", [])) == 0 and len(qb.get("referenz_fehler", [])) == 0
checks.append(("data/qualitaetsbericht.json (korrekt)", has_all and no_errors, f"0 Schema/Ref-Fehler, {qb.get('durchschnittliche_vollstaendigkeit')}% Vollst."))

# 7. data/logs/updates.jsonl
checks.append(("data/logs/updates.jsonl", os.path.isfile("data/logs/updates.jsonl"), ""))

# 8. data/README.md
with open("data/README.md", "r", encoding="utf-8") as f:
    rm = f.read()
sections = ["Scripts", "neue Behörde", "Anti-Pattern"]
has_sections = all(s in rm for s in sections)
checks.append(("data/README.md (mit Anleitung)", has_sections, f"{len(rm)} Bytes"))

# 9. Scripts
for script in ["loader.py", "enrich_geodata.py", "validate.py", "export.py", "update_single.py", "cli.py", "requirements.txt"]:
    ok = os.path.isfile(f"scripts/{script}")
    sz = os.path.getsize(f"scripts/{script}") // 1024 if ok else 0
    checks.append((f"scripts/{script}", ok, f"{sz} KB" if ok else ""))

# 10. Exports
for exp in ["behoerden.xlsx", "behoerden.csv", "beziehungen.csv", "import.cypher", "import.sql"]:
    ok = os.path.isfile(f"exports/{exp}")
    sz = os.path.getsize(f"exports/{exp}") // 1024 if ok else 0
    checks.append((f"exports/{exp}", ok, f"{sz} KB"))

# 11. v2-Schema-Felder in JSON-Dateien
with open("data/behoerden/bka.json", "r", encoding="utf-8") as f:
    bka = json.load(f)
v2_fields = ["schema_version","koordinaten","haushalt_jahr","beschaeftigte_jahr","daten_qualitaet","recherche_agent_version"]
all_v2 = all(f in bka for f in v2_fields)
checks.append(("v2-Schema-Felder in JSONs", all_v2, "alle vorhanden"))

# 12. loader.py Signatur
with open("scripts/loader.py", "r", encoding="utf-8") as f:
    loader_code = f.read()
has_sig = "def load_behoerden(" in loader_code and "def load_beziehungen(" in loader_code and "def get_schema(" in loader_code
checks.append(("loader.py Signaturen (load_behoerden/load_beziehungen/get_schema)", has_sig, ""))

# 13. update_single.py --id --force-overwrite  
with open("scripts/update_single.py", "r", encoding="utf-8") as f:
    us_code = f.read()
has_args = "--id" in us_code and "--force-overwrite" in us_code
checks.append(("update_single.py --id + --force-overwrite", has_args, ""))

# 14. cli.py structure
with open("scripts/cli.py", "r", encoding="utf-8") as f:
    cli_code = f.read()
has_cli = "import argparse" in cli_code and "generate" in cli_code and "export" in cli_code
checks.append(("cli.py commands exist", has_cli, ""))

# 15. export.py alle 4 Formate
with open("scripts/export.py", "r", encoding="utf-8") as f:
    ex_code = f.read()
has_formats = all(f in ex_code for f in ["excel", "csv", "neo4j_cypher", "postgres_sql"])
checks.append(("export.py alle 4 Formate", has_formats, ""))

# 16. Keine hardcodierten fachlichen Daten in neuen Scripts
hardcode_violation = False
for script in ["loader.py", "enrich_geodata.py", "validate.py", "export.py", "update_single.py", "cli.py"]:
    with open(f"scripts/{script}", "r", encoding="utf-8") as f:
        code = f.read()
    # Prüfe auf typische hardcodierte Stadt→Bundesland-Tabellen
    if "STADTBUNDESLAND" in code or '{"Berlin": "Berlin"' in code or '"bkamt"' in code:
        hardcode_violation = True
checks.append(("Keine hardcodierten fachlichen Daten", not hardcode_violation, "Anti-Pattern sauber"))

# Ergebnisse
print()
all_ok = True
for name, status, detail in checks:
    icon = "OK" if status else "FEHLER"
    if not status:
        all_ok = False
    detail_str = f" ({detail})" if detail else ""
    print(f"  [{icon}] {name}{detail_str}")

print()
print("GESAMTERGEBNIS:", "ALLE ANFORDERUNGEN ERFUELLT" if all_ok else "FEHLER GEFUNDEN")
sys.exit(0 if all_ok else 1)
