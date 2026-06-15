# -*- coding: utf-8 -*-
"""
utils.py – Zentrale Konstanten und Hilfsfunktionen.
"""

import os

# --- Path Constants ---
_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_DATA_DIR = os.environ.get("BEHOERDEN_DATA_DIR", os.path.join(_ROOT, "data"))
_BEHOERDEN_DIR = os.path.join(_DATA_DIR, "behoerden")
_SCHEMA_PATH = os.path.join(_DATA_DIR, "schema_v1.json")
_BEZIEHUNGEN_PATH = os.path.join(_DATA_DIR, "beziehungen.json")
_EXPORT_DIR = os.path.join(_ROOT, "exports")
_LOG_PATH = os.path.join(_DATA_DIR, "logs", "updates.jsonl")

# --- Fields and Logic ---
VOLLSTAENDIGKEITS_FELDER = [
    "name", "kuerzel", "typ", "rechtsform", "sitz", "bundesland", "beschaeftigte",
    "gruendungsjahr", "zustaendigkeit", "website", "rechtsgrundlage", "ministerium_id"
]

def compute_vollstaendigkeit(obj: dict) -> float:
    """Berechnet Vollständigkeit in % basierend auf den 11/12 Pflichtfeldern."""
    nicht_null = sum(1 for f in VOLLSTAENDIGKEITS_FELDER if obj.get(f) is not None)
    return round(nicht_null / len(VOLLSTAENDIGKEITS_FELDER) * 100, 1)
