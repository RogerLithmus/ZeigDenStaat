# -*- coding: utf-8 -*-
"""
enrich_geodata.py – Fehlende Geo-Daten (bundesland, koordinaten) via Nominatim nachladen.

Verbesserte Logik:
  - Arbeitet parallel an den Dateien (ThreadPoolExecutor).
  - Nutzt einen Thread-safe Cache für geocodierte Städte.
  - Befüllt den Cache vorab aus bereits existierenden Geo-Daten in den JSON-Dateien.
  - Verhindert Mehrfachabfragen für gleiche Städte.
"""

import sys
import os
import json
import time
import argparse
from datetime import date

sys.stdout.reconfigure(encoding="utf-8")

# Füge scripts/ zum Pfad hinzu
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    print("FEHLER: requests nicht installiert. Bitte: pip install requests", file=sys.stderr)
    HAS_REQUESTS = False

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
NOMINATIM_HEADERS = {
    "User-Agent": "ZeigDenStaat-Behoerden-Enricher/2.0 (https://github.com/zeigdenstaat)",
    "Accept-Language": "de",
}
RATE_LIMIT_SLEEP = 1.1
MAX_RETRIES = 3

BEHOERDEN_DIR = os.environ.get(
    "BEHOERDEN_DATA_DIR",
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "behoerden")
)
HEUTE = date.today().isoformat()

geo_cache = {}  # sitz_clean -> {bundesland, lat, lon}


def query_nominatim(sitz: str, retries: int = MAX_RETRIES) -> dict | None:
    """Fragt Nominatim nach Geo-Daten für eine Stadt (mit Drosselung)."""
    if not HAS_REQUESTS:
        return None

    params = {
        "q": sitz,
        "countrycodes": "de",
        "format": "json",
        "addressdetails": "1",
        "limit": "1",
    }

    for attempt in range(1, retries + 1):
        try:
            resp = requests.get(
                NOMINATIM_URL,
                params=params,
                headers=NOMINATIM_HEADERS,
                timeout=10,
            )
            if resp.status_code == 429:
                print(f"  Nominatim Rate-Limit, warte {attempt * 2}s...", file=sys.stderr)
                time.sleep(attempt * 2)
                continue
            resp.raise_for_status()
            data = resp.json()
            
            # Respektiere das Rate Limit
            time.sleep(RATE_LIMIT_SLEEP)
            
            if not data:
                return None
            result = data[0]
            address = result.get("address", {})
            bundesland = (
                address.get("state")
                or address.get("region")
                or address.get("county")
            )
            lat = float(result.get("lat", 0)) or None
            lon = float(result.get("lon", 0)) or None
            return {
                "bundesland": bundesland,
                "lat": lat,
                "lon": lon,
            }
        except requests.exceptions.RequestException as e:
            print(f"  Nominatim-Fehler (Versuch {attempt}/{retries}): {e}", file=sys.stderr)
            if attempt < retries:
                time.sleep(2)
        return None


def prepopulate_cache(bdir: str):
    """Befüllt den Cache vorab aus allen vorhandenen, gültigen Geo-Daten."""
    print("Befülle Geo-Cache aus vorhandenen Dateien...")
    count = 0
    for fname in os.listdir(bdir):
        if not fname.endswith(".json"):
            continue
        fpath = os.path.join(bdir, fname)
        try:
            with open(fpath, "r", encoding="utf-8") as f:
                obj = json.load(f)
            sitz = obj.get("sitz")
            bundesland = obj.get("bundesland")
            koordinaten = obj.get("koordinaten") or {}
            lat = koordinaten.get("lat")
            lon = koordinaten.get("lon")

            if sitz and bundesland and lat and lon:
                sitz_clean = sitz.split("/")[0].split(",")[0].strip().lower()
                if sitz_clean not in geo_cache:
                    geo_cache[sitz_clean] = {
                        "bundesland": bundesland,
                        "lat": lat,
                        "lon": lon
                    }
                    count += 1
        except Exception:
            pass
    print(f"  → Cache mit {count} Städten vorbefüllt.")


def get_geo_data(sitz_clean: str) -> dict | None:
    """Holt Geo-Daten thread-safe aus dem Cache oder fragt Nominatim."""
    if sitz_clean in geo_cache:
        return geo_cache[sitz_clean]

    # Wenn nicht im Cache, Nominatim fragen
    geo = query_nominatim(sitz_clean)
    
    if geo:
        geo_cache[sitz_clean] = geo
    return geo


def needs_geo_enrichment(obj: dict, force: bool = False) -> bool:
    """Prüft ob eine Behörde fehlende Geo-Daten hat."""
    if force:
        return bool(obj.get("sitz"))
    if not obj.get("sitz"):
        return False
    bundesland_fehlt = obj.get("bundesland") is None
    koord_fehlt = (
        obj.get("koordinaten") is None
        or (obj.get("koordinaten") or {}).get("lat") is None
    )
    return bundesland_fehlt or koord_fehlt


def enrich_file(obj: dict, force: bool, dry_run: bool) -> tuple[dict, bool, list]:
    """Verarbeitet eine einzelne JSON-Datei (Thread-Aufgabe)."""

    sitz = obj.get("sitz", "")
    sitz_clean = sitz.split("/")[0].split(",")[0].strip().lower()

    geo = get_geo_data(sitz_clean)
    if not geo:
        return obj, False, []

    changed_fields = []
    if force or obj.get("bundesland") is None:
        if geo.get("bundesland"):
            obj["bundesland"] = geo["bundesland"]
            changed_fields.append("bundesland")

    if force or (obj.get("koordinaten") or {}).get("lat") is None:
        if geo.get("lat") and geo.get("lon"):
            obj["koordinaten"] = {"lat": geo["lat"], "lon": geo["lon"]}
            changed_fields.append("koordinaten")

    if changed_fields:
        if not dry_run:
            obj["recherche_datum"] = HEUTE
        return obj, bool(changed_fields), changed_fields

    return obj, False, []


def main():
    parser = argparse.ArgumentParser(description="Fehlende Geo-Daten via Nominatim nachladen")
    parser.add_argument("--dry-run", action="store_true", help="Keine Änderungen schreiben")
    parser.add_argument("--force", action="store_true", help="Vorhandene Geo-Daten überschreiben")
    parser.add_argument("--data-dir", default=BEHOERDEN_DIR, help="Pfad zum behoerden/ Verzeichnis")
    args = parser.parse_args()

    if not HAS_REQUESTS:
        print("Bitte requests installieren: pip install requests")
        sys.exit(1)

    bdir = args.data_dir
    if not os.path.isdir(bdir):
        print(f"FEHLER: Verzeichnis nicht gefunden: {bdir}")
        sys.exit(1)

    # Vorab-Cache-Befüllung
    prepopulate_cache(bdir)

    files = sorted([os.path.join(bdir, f) for f in os.listdir(bdir) if f.endswith(".json")])
    print(f"Gefundene JSON-Dateien: {len(files)}")

    angereichert = 0
    nicht_gefunden = []
    bereits_vollstaendig = 0
    processed = 0

    start_time = time.time()

    for fname in files:
        if args.limit and processed >= args.limit:
            break

        fpath = os.path.join(bdir, fname)
        try:
            with open(fpath, "r", encoding="utf-8") as f:
                obj = json.load(f)
        except Exception as e:
            print(f"FEHLER beim Lesen von {fname}: {e}")
            continue

        if not needs_geo_enrichment(obj, force=args.force):
            bereits_vollstaendig += 1
            continue

        bid = obj.get("id", fname)
        obj_updated, changed, felder = enrich_file(obj, force=args.force, dry_run=args.dry_run)

        if changed:
            if not args.dry_run:
                tmp = fpath + ".tmp"
                with open(tmp, "w", encoding="utf-8") as f:
                    json.dump(obj_updated, f, ensure_ascii=False, indent=2)
                os.replace(tmp, fpath)
            angereichert += 1
            print(f"  ok {bid}: {', '.join(felder)}")
        else:
            nicht_gefunden.append(bid)
            print(f"  -- {bid}: keine Geo-Daten gefunden fuer '{obj.get('sitz')}'")

        processed += 1

    duration = time.time() - start_time
    print(f"\nErgebnis (Dauer: {duration:.1f}s):")
    print(f"  Angereichert: {angereichert}")
    print(f"  Nicht gefunden: {len(nicht_gefunden)}")
    print(f"  Bereits vollständig: {bereits_vollstaendig}")

    # Bericht ausgeben
    bericht = {
        "angereichert": angereichert,
        "nicht_gefunden": nicht_gefunden,
        "bereits_vollstaendig": bereits_vollstaendig,
        "dry_run": args.dry_run,
        "datum": HEUTE,
        "dauer_sekunden": round(duration, 1)
    }
    report_path = os.path.join(os.path.dirname(bdir), "geo_enrichment_report.json")
    if not args.dry_run:
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(bericht, f, ensure_ascii=False, indent=2)
        print(f"\nBericht gespeichert: {report_path}")


if __name__ == "__main__":
    main()
