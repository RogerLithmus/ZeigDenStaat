"""
Download online data for ZeigDenStaat project.

Part 1: Anschriftenverzeichnis (federal authority directory) from service.bund.de / govdata.de
Part 2: Bundeshaushalt (federal budget) data from bundeshaushalt.de

Author: Auto-generated
Date: 2026-05-20
"""

import os
import sys
import csv
import io
import json
import logging
import requests
import pandas as pd
from pathlib import Path

# --- Configuration ---
BASE_DIR = Path(r"c:\Projects\ZeigDenStaat")
RAW_DIR = BASE_DIR / "data" / "raw"
RAW_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": "ZeigDenStaat-DataCollector/1.0 (Open Data Research Project)"
}
TIMEOUT = 60  # seconds


# ============================================================================
# Helper functions
# ============================================================================

def try_download(url: str, description: str = "", encoding: str | None = None) -> requests.Response | None:
    """Try to download from a URL, return Response or None on failure."""
    log.info(f"  Trying: {url}")
    try:
        resp = requests.get(url, headers=HEADERS, timeout=TIMEOUT, allow_redirects=True)
        if resp.status_code == 200:
            if encoding:
                resp.encoding = encoding
            content_length = len(resp.content)
            log.info(f"  ✓ Success ({content_length:,} bytes)")
            return resp
        else:
            log.warning(f"  ✗ HTTP {resp.status_code}")
            return None
    except requests.RequestException as e:
        log.warning(f"  ✗ Error: {e}")
        return None


def detect_csv_separator(text: str) -> str:
    """Detect the most likely CSV separator from the first few lines."""
    first_lines = text.split('\n')[:5]
    for sep in [';', ',', '\t', '|']:
        counts = [line.count(sep) for line in first_lines if line.strip()]
        if counts and min(counts) > 0 and max(counts) == min(counts):
            return sep
    # Default to semicolon (German CSV standard)
    return ';'


def print_dataframe_summary(df: pd.DataFrame, name: str, max_sample: int = 5):
    """Print a summary of a DataFrame."""
    print(f"\n{'='*70}")
    print(f"  {name}")
    print(f"{'='*70}")
    print(f"  Rows: {len(df):,}")
    print(f"  Columns: {len(df.columns)}")
    print(f"\n  Column names:")
    for i, col in enumerate(df.columns, 1):
        dtype = df[col].dtype
        non_null = df[col].notna().sum()
        print(f"    {i:3d}. {col} ({dtype}, {non_null:,} non-null)")
    print(f"\n  Sample entries (first {min(max_sample, len(df))}):")
    sample = df.head(max_sample)
    # Print a compact version
    pd.set_option('display.max_columns', 10)
    pd.set_option('display.width', 120)
    pd.set_option('display.max_colwidth', 40)
    print(sample.to_string(index=False))
    print()


# ============================================================================
# PART 1: Anschriftenverzeichnis
# ============================================================================

def download_anschriftenverzeichnis() -> pd.DataFrame | None:
    """Download the Anschriftenverzeichnis (federal authority directory)."""
    log.info("=" * 70)
    log.info("PART 1: Downloading Anschriftenverzeichnis")
    log.info("=" * 70)

    output_path = RAW_DIR / "anschriftenverzeichnis.csv"

    # List of URLs to try, in order of preference
    urls_csv = [
        "https://www.service.bund.de/SharedDocs/Downloads/DE/Anschriftenverzeichnis/Anschriftenverzeichnis.csv?__blob=publicationFile",
        "https://service.bund.de/SharedDocs/Downloads/DE/Anschriftenverzeichnis/Anschriftenverzeichnis.csv?__blob=publicationFile",
        "https://www.service.bund.de/Content/DE/DEBehoerdenverzeichnis/OpenData/csv/behoerdenverzeichnis.csv",
        "https://service.bund.de/Content/DE/DEBehoerdenverzeichnis/OpenData/csv/behoerdenverzeichnis.csv",
        "https://www.service.bund.de/Content/DE/Anschriftenverzeichnis/OpenData/csv/anschriftenverzeichnis.csv",
    ]

    urls_json = [
        "https://www.service.bund.de/SharedDocs/Downloads/DE/Anschriftenverzeichnis/Anschriftenverzeichnis.json?__blob=publicationFile",
        "https://service.bund.de/SharedDocs/Downloads/DE/Anschriftenverzeichnis/Anschriftenverzeichnis.json?__blob=publicationFile",
        "https://www.service.bund.de/Content/DE/DEBehoerdenverzeichnis/OpenData/json/behoerdenverzeichnis.json",
    ]

    urls_xlsx = [
        "https://www.service.bund.de/SharedDocs/Downloads/DE/Anschriftenverzeichnis/Anschriftenverzeichnis.xlsx?__blob=publicationFile",
    ]

    tried_urls = []

    # --- Try CSV URLs ---
    log.info("Trying CSV downloads...")
    for url in urls_csv:
        tried_urls.append(url)
        resp = try_download(url, encoding="utf-8")
        if resp is None:
            # Try with latin-1 encoding
            resp = try_download(url, encoding="iso-8859-1")
        if resp is not None:
            text = resp.text
            # Check if it looks like CSV
            if len(text) > 100 and ('\n' in text):
                sep = detect_csv_separator(text)
                log.info(f"  Detected separator: {repr(sep)}")
                try:
                    df = pd.read_csv(io.StringIO(text), sep=sep, dtype=str)
                    if len(df) > 0 and len(df.columns) > 1:
                        log.info(f"  ✓ Parsed {len(df)} rows, {len(df.columns)} columns")
                        df.to_csv(output_path, index=False, encoding="utf-8-sig", sep=";")
                        log.info(f"  Saved to: {output_path}")
                        return df
                    else:
                        log.warning(f"  Parsed but got {len(df)} rows / {len(df.columns)} columns - trying next")
                except Exception as e:
                    log.warning(f"  CSV parse error: {e}")
                    # Try alternative encodings
                    for enc in ["utf-8-sig", "cp1252", "latin1"]:
                        try:
                            text_alt = resp.content.decode(enc)
                            df = pd.read_csv(io.StringIO(text_alt), sep=sep, dtype=str)
                            if len(df) > 0 and len(df.columns) > 1:
                                log.info(f"  ✓ Parsed with {enc}: {len(df)} rows, {len(df.columns)} columns")
                                df.to_csv(output_path, index=False, encoding="utf-8-sig", sep=";")
                                log.info(f"  Saved to: {output_path}")
                                return df
                        except:
                            continue

    # --- Try JSON URLs ---
    log.info("Trying JSON downloads...")
    for url in urls_json:
        tried_urls.append(url)
        resp = try_download(url, encoding="utf-8")
        if resp is not None:
            try:
                data = resp.json()
                # Handle different JSON structures
                if isinstance(data, list):
                    df = pd.json_normalize(data)
                elif isinstance(data, dict):
                    # Look for a list in the values
                    for key, value in data.items():
                        if isinstance(value, list) and len(value) > 0:
                            df = pd.json_normalize(value)
                            break
                    else:
                        df = pd.json_normalize([data])
                
                if len(df) > 0:
                    log.info(f"  ✓ Parsed JSON: {len(df)} rows, {len(df.columns)} columns")
                    df.to_csv(output_path, index=False, encoding="utf-8-sig", sep=";")
                    log.info(f"  Saved to: {output_path}")
                    return df
            except Exception as e:
                log.warning(f"  JSON parse error: {e}")

    # --- Try XLSX URLs ---
    log.info("Trying XLSX downloads...")
    for url in urls_xlsx:
        tried_urls.append(url)
        resp = try_download(url)
        if resp is not None:
            try:
                df = pd.read_excel(io.BytesIO(resp.content), dtype=str)
                if len(df) > 0 and len(df.columns) > 1:
                    log.info(f"  ✓ Parsed XLSX: {len(df)} rows, {len(df.columns)} columns")
                    df.to_csv(output_path, index=False, encoding="utf-8-sig", sep=";")
                    log.info(f"  Saved to: {output_path}")
                    return df
            except Exception as e:
                log.warning(f"  XLSX parse error: {e}")

    # --- Fallback: Try GovData API ---
    log.info("Trying GovData.de API fallback...")
    govdata_urls = [
        "https://ckan.govdata.de/api/3/action/package_show?id=anschriftenverzeichnis-des-bundes",
        "https://www.govdata.de/ckan/api/3/action/package_show?id=anschriftenverzeichnis-des-bundes",
        "https://ckan.govdata.de/api/3/action/package_search?q=Anschriftenverzeichnis",
    ]
    
    for gurl in govdata_urls:
        tried_urls.append(gurl)
        resp = try_download(gurl)
        if resp is not None:
            try:
                data = resp.json()
                result = data.get("result", data)
                
                # If it's a search result, get the first package
                if isinstance(result, dict) and "results" in result:
                    results = result["results"]
                    if results:
                        result = results[0]
                
                # Extract resource URLs
                resources = result.get("resources", [])
                csv_resources = [r for r in resources if r.get("format", "").upper() == "CSV"]
                json_resources = [r for r in resources if r.get("format", "").upper() == "JSON"]
                all_resources = csv_resources + json_resources + resources
                
                log.info(f"  Found {len(resources)} resources on GovData")
                for r in resources:
                    log.info(f"    - {r.get('name', 'unnamed')}: {r.get('format', '?')} -> {r.get('url', '?')}")
                
                # Try downloading each resource
                for res in all_resources:
                    res_url = res.get("url", "")
                    res_format = res.get("format", "").upper()
                    if not res_url:
                        continue
                    tried_urls.append(res_url)
                    resp2 = try_download(res_url)
                    if resp2 is None:
                        continue
                    
                    if res_format == "CSV" or "csv" in res_url.lower():
                        for enc in ["utf-8", "utf-8-sig", "cp1252", "latin1"]:
                            try:
                                text = resp2.content.decode(enc)
                                sep = detect_csv_separator(text)
                                df = pd.read_csv(io.StringIO(text), sep=sep, dtype=str)
                                if len(df) > 0 and len(df.columns) > 1:
                                    log.info(f"  ✓ GovData CSV ({enc}): {len(df)} rows, {len(df.columns)} columns")
                                    df.to_csv(output_path, index=False, encoding="utf-8-sig", sep=";")
                                    log.info(f"  Saved to: {output_path}")
                                    return df
                            except:
                                continue
                    
                    elif res_format == "JSON" or "json" in res_url.lower():
                        try:
                            jdata = resp2.json()
                            if isinstance(jdata, list):
                                df = pd.json_normalize(jdata)
                            elif isinstance(jdata, dict):
                                for key, val in jdata.items():
                                    if isinstance(val, list):
                                        df = pd.json_normalize(val)
                                        break
                            if len(df) > 0:
                                log.info(f"  ✓ GovData JSON: {len(df)} rows, {len(df.columns)} columns")
                                df.to_csv(output_path, index=False, encoding="utf-8-sig", sep=";")
                                log.info(f"  Saved to: {output_path}")
                                return df
                        except:
                            continue

            except Exception as e:
                log.warning(f"  GovData parse error: {e}")

    log.error("=" * 70)
    log.error("FAILED: Could not download Anschriftenverzeichnis from any source")
    log.error(f"Tried {len(tried_urls)} URLs:")
    for u in tried_urls:
        log.error(f"  - {u}")
    log.error("=" * 70)
    return None


# ============================================================================
# PART 2: Bundeshaushalt (Federal Budget)
# ============================================================================

def download_bundeshaushalt() -> pd.DataFrame | None:
    """Download Bundeshaushalt (federal budget) data."""
    log.info("=" * 70)
    log.info("PART 2: Downloading Bundeshaushalt (Federal Budget)")
    log.info("=" * 70)

    output_path = RAW_DIR / "bundeshaushalt.csv"
    tried_urls = []

    # Try different years and URL patterns
    years = [2025, 2024, 2023]
    types = ["soll", "ist"]

    url_patterns = [
        "https://www.bundeshaushalt.de/static/daten/{year}/{typ}/HH_{year}.csv",
        "https://www.bundeshaushalt.de/static/daten/{year}/{typ}/Bundeshaushalt.csv",
        "https://www.bundeshaushalt.de/static/daten/{year}/{typ}/bundeshaushalt.csv",
        "https://www.bundeshaushalt.de/static/daten/{year}/{typ}/HH{year}.csv",
        "https://www.bundeshaushalt.de/static/daten/{year}/{typ}/haushalt.csv",
        "https://www.bundeshaushalt.de/static/daten/{year}/{typ}/ausgaben.csv",
    ]

    # Try all combinations
    log.info("Trying bundeshaushalt.de static downloads...")
    for year in years:
        for typ in types:
            for pattern in url_patterns:
                url = pattern.format(year=year, typ=typ)
                tried_urls.append(url)
                resp = try_download(url)
                if resp is not None:
                    for enc in ["utf-8", "utf-8-sig", "cp1252", "latin1"]:
                        try:
                            text = resp.content.decode(enc)
                            sep = detect_csv_separator(text)
                            df = pd.read_csv(io.StringIO(text), sep=sep, dtype=str)
                            if len(df) > 0 and len(df.columns) > 1:
                                log.info(f"  ✓ Parsed {year}/{typ}: {len(df)} rows, {len(df.columns)} columns (encoding: {enc})")
                                df.to_csv(output_path, index=False, encoding="utf-8-sig", sep=";")
                                log.info(f"  Saved to: {output_path}")
                                return df
                        except Exception as e:
                            continue

    # --- Try the download portal page to find links ---
    log.info("Trying to scrape bundeshaushalt.de download page...")
    portal_urls = [
        "https://www.bundeshaushalt.de/download",
        "https://www.bundeshaushalt.de/DE/Download-Portal/download-portal.html",
        "https://www.bundeshaushalt.de/download-portal",
    ]
    
    from bs4 import BeautifulSoup
    
    for portal_url in portal_urls:
        tried_urls.append(portal_url)
        resp = try_download(portal_url)
        if resp is not None:
            soup = BeautifulSoup(resp.text, "html.parser")
            # Look for CSV download links
            csv_links = []
            for a in soup.find_all("a", href=True):
                href = a["href"]
                if ".csv" in href.lower():
                    if not href.startswith("http"):
                        href = "https://www.bundeshaushalt.de" + href
                    csv_links.append(href)
            
            log.info(f"  Found {len(csv_links)} CSV links on portal page")
            for link in csv_links[:10]:  # Try first 10
                tried_urls.append(link)
                resp2 = try_download(link)
                if resp2 is not None:
                    for enc in ["utf-8", "utf-8-sig", "cp1252", "latin1"]:
                        try:
                            text = resp2.content.decode(enc)
                            sep = detect_csv_separator(text)
                            df = pd.read_csv(io.StringIO(text), sep=sep, dtype=str)
                            if len(df) > 0 and len(df.columns) > 1:
                                log.info(f"  ✓ From portal: {len(df)} rows, {len(df.columns)} columns")
                                df.to_csv(output_path, index=False, encoding="utf-8-sig", sep=";")
                                log.info(f"  Saved to: {output_path}")
                                return df
                        except:
                            continue

    # --- Try GovData for budget data ---
    log.info("Trying GovData.de for Bundeshaushalt...")
    govdata_searches = [
        "https://ckan.govdata.de/api/3/action/package_search?q=Bundeshaushalt&rows=5",
        "https://ckan.govdata.de/api/3/action/package_search?q=Haushaltsplan+Bund&rows=5",
        "https://ckan.govdata.de/api/3/action/package_search?q=Einzelplan+Bundeshaushalt&rows=5",
    ]
    
    for gurl in govdata_searches:
        tried_urls.append(gurl)
        resp = try_download(gurl)
        if resp is not None:
            try:
                data = resp.json()
                results = data.get("result", {}).get("results", [])
                log.info(f"  GovData returned {len(results)} datasets")
                for ds in results:
                    log.info(f"    Dataset: {ds.get('title', 'N/A')}")
                    resources = ds.get("resources", [])
                    csv_res = [r for r in resources if r.get("format", "").upper() == "CSV"]
                    for res in csv_res:
                        res_url = res.get("url", "")
                        if not res_url:
                            continue
                        tried_urls.append(res_url)
                        resp2 = try_download(res_url)
                        if resp2 is not None:
                            for enc in ["utf-8", "utf-8-sig", "cp1252", "latin1"]:
                                try:
                                    text = resp2.content.decode(enc)
                                    sep = detect_csv_separator(text)
                                    df = pd.read_csv(io.StringIO(text), sep=sep, dtype=str)
                                    if len(df) > 0 and len(df.columns) > 1:
                                        log.info(f"  ✓ GovData CSV: {len(df)} rows")
                                        df.to_csv(output_path, index=False, encoding="utf-8-sig", sep=";")
                                        log.info(f"  Saved to: {output_path}")
                                        return df
                                except:
                                    continue
            except Exception as e:
                log.warning(f"  GovData error: {e}")

    # --- Fallback: Try BMF data portal ---
    log.info("Trying BMF data portal...")
    bmf_urls = [
        "https://www.bundesfinanzministerium.de/Content/DE/Standardartikel/Themen/Oeffentliche_Finanzen/Bundeshaushalt/Bundeshaushalt-digital/bundeshaushalt-digital.html",
    ]
    
    for burl in bmf_urls:
        tried_urls.append(burl)
        resp = try_download(burl)
        if resp is not None:
            soup = BeautifulSoup(resp.text, "html.parser")
            csv_links = []
            for a in soup.find_all("a", href=True):
                href = a["href"]
                if ".csv" in href.lower() or "haushalt" in href.lower():
                    if not href.startswith("http"):
                        href = "https://www.bundesfinanzministerium.de" + href
                    csv_links.append(href)
            log.info(f"  Found {len(csv_links)} potential links on BMF page")

    log.error("=" * 70)
    log.error("FAILED: Could not download Bundeshaushalt from any source")
    log.error(f"Tried {len(tried_urls)} URLs:")
    for u in tried_urls:
        log.error(f"  - {u}")
    log.error("=" * 70)
    return None


# ============================================================================
# Main
# ============================================================================

def main():
    print("=" * 70)
    print("  ZeigDenStaat - Online Data Download")
    print(f"  Output directory: {RAW_DIR}")
    print("=" * 70)
    print()

    results = {}

    # Part 1: Anschriftenverzeichnis
    df_anschriften = download_anschriftenverzeichnis()
    if df_anschriften is not None:
        results["Anschriftenverzeichnis"] = df_anschriften
        print_dataframe_summary(df_anschriften, "Anschriftenverzeichnis (Federal Authority Directory)")
    else:
        print("\n⚠ Anschriftenverzeichnis: FAILED - no data downloaded")

    print()

    # Part 2: Bundeshaushalt
    df_haushalt = download_bundeshaushalt()
    if df_haushalt is not None:
        results["Bundeshaushalt"] = df_haushalt
        print_dataframe_summary(df_haushalt, "Bundeshaushalt (Federal Budget)")
    else:
        print("\n⚠ Bundeshaushalt: FAILED - no data downloaded")

    # Final summary
    print("\n" + "=" * 70)
    print("  DOWNLOAD SUMMARY")
    print("=" * 70)
    for name, df in results.items():
        path = RAW_DIR / ("anschriftenverzeichnis.csv" if "Anschrift" in name else "bundeshaushalt.csv")
        print(f"  ✓ {name}: {len(df):,} rows, {len(df.columns)} columns -> {path}")
    
    failed = [n for n in ["Anschriftenverzeichnis", "Bundeshaushalt"] if n not in results]
    for name in failed:
        print(f"  ✗ {name}: FAILED")
    
    print(f"\n  Total datasets downloaded: {len(results)}/2")
    print("=" * 70)

    return len(results)


if __name__ == "__main__":
    sys.exit(0 if main() > 0 else 1)
