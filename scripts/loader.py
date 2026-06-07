# -*- coding: utf-8 -*-
"""
loader.py – Zentrale Ladefunktion für Behörden-Daten.

Alle fachlichen Daten kommen ausschließlich aus den JSON-Dateien.
Keine hardcodierten Behördennamen, IDs oder Feldwerte.

Verwendung:
    from scripts.loader import load_behoerden, load_beziehungen, get_schema

    alle = load_behoerden()
    ministerien = load_behoerden(filter_typ="Ministerium")
    aktive = load_behoerden(only_active=True, min_vollstaendigkeit=70)
"""

import os
import json
import sys
from typing import Optional

# Optional: jsonschema für Validierung
try:
    import jsonschema
    HAS_JSONSCHEMA = True
except ImportError:
    HAS_JSONSCHEMA = False

# Umgebungsvariable für Daten-Verzeichnis, default: ./data/behoerden
_DEFAULT_DATA_DIR = os.environ.get(
    "BEHOERDEN_DATA_DIR",
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "behoerden")
)
_DEFAULT_SCHEMA_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "schema_v1.json"
)
_DEFAULT_BEZIEHUNGEN_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "beziehungen.json"
)


def get_schema(data_dir: Optional[str] = None) -> dict:
    """Liest das JSON-Schema aus data/schema_v1.json."""
    schema_path = _DEFAULT_SCHEMA_PATH
    if data_dir:
        # Suche schema_v1.json im übergeordneten Verzeichnis
        parent = os.path.dirname(data_dir.rstrip("/\\"))
        candidate = os.path.join(parent, "schema_v1.json")
        if os.path.isfile(candidate):
            schema_path = candidate
    if not os.path.isfile(schema_path):
        raise FileNotFoundError(f"Schema nicht gefunden: {schema_path}")
    with open(schema_path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_behoerden(
    data_dir: Optional[str] = None,
    filter_typ: Optional[str] = None,
    filter_ebene: Optional[str] = None,
    filter_ministerium_id: Optional[str] = None,
    min_vollstaendigkeit: int = 0,
    only_active: bool = True,
    validate: bool = False,
) -> list:
    """
    Lädt alle Behörden-JSONs aus dem data_dir.

    Args:
        data_dir: Pfad zum Verzeichnis mit den JSON-Dateien.
                  Default: BEHOERDEN_DATA_DIR env var oder ./data/behoerden
        filter_typ: Filtert nach typ-Feld (dynamisch aus Daten, kein Enum hardcodiert)
        filter_ebene: Filtert nach ebene-Feld
        filter_ministerium_id: Filtert nach ministerium_id
        min_vollstaendigkeit: Mindestvollständigkeit in % (0-100)
        only_active: Wenn True, werden aufgeloest=True-Einträge herausgefiltert
        validate: Wenn True, validiert jede Datei gegen schema_v1.json (benötigt jsonschema)

    Returns:
        Liste von Behörden-Dicts, gefiltert nach den angegebenen Kriterien
    """
    resolved_dir = data_dir or _DEFAULT_DATA_DIR
    if not os.path.isdir(resolved_dir):
        raise NotADirectoryError(f"Verzeichnis nicht gefunden: {resolved_dir}")

    schema = None
    if validate:
        if not HAS_JSONSCHEMA:
            print("WARN: jsonschema nicht installiert, Validierung übersprungen.", file=sys.stderr)
        else:
            try:
                schema = get_schema(resolved_dir)
            except FileNotFoundError as e:
                print(f"WARN: {e} – Validierung übersprungen.", file=sys.stderr)

    result = []
    for fname in sorted(os.listdir(resolved_dir)):
        if not fname.endswith(".json"):
            continue
        fpath = os.path.join(resolved_dir, fname)
        try:
            with open(fpath, "r", encoding="utf-8") as f:
                obj = json.load(f)
        except (json.JSONDecodeError, OSError) as e:
            print(f"WARN: {fname} konnte nicht gelesen werden: {e}", file=sys.stderr)
            continue

        # Schema-Validierung (optional)
        if schema and HAS_JSONSCHEMA:
            try:
                jsonschema.validate(instance=obj, schema=schema)
            except jsonschema.ValidationError as e:
                print(f"WARN: {fname} Schema-Fehler: {e.message}", file=sys.stderr)

        # Filter: only_active
        if only_active and obj.get("aufgeloest", False):
            continue

        # Filter: typ (dynamisch aus Daten)
        if filter_typ is not None and obj.get("typ") != filter_typ:
            continue

        # Filter: ebene
        if filter_ebene is not None and obj.get("ebene") != filter_ebene:
            continue

        # Filter: ministerium_id
        if filter_ministerium_id is not None and obj.get("ministerium_id") != filter_ministerium_id:
            continue

        # Filter: min_vollstaendigkeit
        if min_vollstaendigkeit > 0:
            dq = obj.get("daten_qualitaet") or {}
            vollst = dq.get("vollstaendigkeit_prozent", 0)
            if vollst < min_vollstaendigkeit:
                continue

        result.append(obj)

    return result


def load_beziehungen(data_dir: Optional[str] = None) -> list:
    """
    Lädt die flache Beziehungsliste aus beziehungen.json.

    Returns:
        Liste von Beziehungs-Dicts mit Feldern: von, zu, typ, richtung, seit, quelle
    """
    bez_path = _DEFAULT_BEZIEHUNGEN_PATH
    if data_dir:
        parent = os.path.dirname(data_dir.rstrip("/\\"))
        candidate = os.path.join(parent, "beziehungen.json")
        if os.path.isfile(candidate):
            bez_path = candidate

    if not os.path.isfile(bez_path):
        # Fallback: direkt aus Einzel-JSONs aufbauen
        print(f"WARN: {bez_path} nicht gefunden, baue aus Einzeldateien.", file=sys.stderr)
        resolved_dir = data_dir or _DEFAULT_DATA_DIR
        result = []
        for fname in sorted(os.listdir(resolved_dir)):
            if not fname.endswith(".json"):
                continue
            fpath = os.path.join(resolved_dir, fname)
            try:
                with open(fpath, "r", encoding="utf-8") as f:
                    obj = json.load(f)
                for bez in obj.get("beziehungen", []):
                    result.append({
                        "von": obj["id"],
                        "zu": bez["zu_id"],
                        "typ": bez["typ"],
                        "richtung": bez.get("richtung"),
                        "seit": bez.get("seit"),
                        "quelle": bez.get("quelle"),
                    })
            except Exception as e:
                print(f"WARN: {fname}: {e}", file=sys.stderr)
        return result

    with open(bez_path, "r", encoding="utf-8") as f:
        return json.load(f)


def get_available_typen(data_dir: Optional[str] = None) -> list:
    """Gibt alle vorhandenen Typen aus den Daten zurück (dynamisch, nicht hardcodiert)."""
    behoerden = load_behoerden(data_dir=data_dir, only_active=False)
    return sorted(set(b.get("typ") for b in behoerden if b.get("typ")))


def get_available_ministerien(data_dir: Optional[str] = None) -> list:
    """Gibt alle vorhandenen Ministeriums-IDs zurück (dynamisch aus Daten)."""
    behoerden = load_behoerden(data_dir=data_dir, only_active=False)
    return sorted(set(b.get("ministerium_id") for b in behoerden if b.get("ministerium_id")))


def get_vollstaendigkeits_statistik(data_dir: Optional[str] = None) -> dict:
    """Berechnet Vollständigkeits-Statistiken über alle Behörden."""
    behoerden = load_behoerden(data_dir=data_dir, only_active=False)
    if not behoerden:
        return {}

    vollst_werte = [
        (b.get("daten_qualitaet") or {}).get("vollstaendigkeit_prozent", 0)
        for b in behoerden
    ]
    return {
        "gesamt": len(behoerden),
        "durchschnitt": round(sum(vollst_werte) / len(vollst_werte), 1),
        "min": min(vollst_werte),
        "max": max(vollst_werte),
        "unter_50_prozent": sum(1 for v in vollst_werte if v < 50),
        "vollstaendig_100_prozent": sum(1 for v in vollst_werte if v == 100),
    }


if __name__ == "__main__":
    # Selbsttest
    print("Loader Selbsttest...")
    alle = load_behoerden()
    print(f"  Geladen: {len(alle)} Behörden")
    typen = get_available_typen()
    print(f"  Verfügbare Typen: {typen}")
    stats = get_vollstaendigkeits_statistik()
    print(f"  Vollständigkeit: Ø{stats.get('durchschnitt')}%, min={stats.get('min')}%, max={stats.get('max')}%")
    bez = load_beziehungen()
    print(f"  Beziehungen: {len(bez)}")
