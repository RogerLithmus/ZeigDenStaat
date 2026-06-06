# Bundesbehörden Datenbank

## Überblick
- **Gesamtanzahl Behörden:** 62
- **Recherche-Datum:** 2026-06-06
- **Datenquellen:** Bundeshaushalt 2025, Bundesbehörden-Verzeichnis, offizielle Websites
- **Beziehungen:** 86

## Verteilung nach Typ
| Typ | Anzahl |
|-----|--------|
| Bundesoberbehörde | 24 |
| Ministerium | 17 |
| Bundesamt | 6 |
| Bundesanstalt | 6 |
| Verfassungsorgan | 5 |
| KdöR | 4 |

## Verteilung nach Bundesland
| Bundesland | Anzahl |
|------------|--------|
| Berlin | 26 |
| Nordrhein-Westfalen | 22 |
| Hessen | 4 |
| Baden-Württemberg | 2 |
| Bayern | 2 |
| Niedersachsen | 2 |
| Brandenburg | 1 |
| Schleswig-Holstein | 1 |
| Sachsen-Anhalt | 1 |
| Rheinland-Pfalz | 1 |

## Feldvollständigkeit
| Feld | Befüllt | Gesamt | Vollständigkeit |
|------|---------|--------|-----------------|
| `id` | 62 | 62 | 100.0% |
| `name` | 62 | 62 | 100.0% |
| `kuerzel` | 62 | 62 | 100.0% |
| `typ` | 62 | 62 | 100.0% |
| `rechtsform` | 62 | 62 | 100.0% |
| `ebene` | 62 | 62 | 100.0% |
| `sitz` | 62 | 62 | 100.0% |
| `bundesland` | 62 | 62 | 100.0% |
| `gruendungsjahr` | 62 | 62 | 100.0% |
| `aufgeloest` | 62 | 62 | 100.0% |
| `zustaendigkeit` | 62 | 62 | 100.0% |
| `website` | 62 | 62 | 100.0% |
| `rechtsgrundlage` | 62 | 62 | 100.0% |
| `haushalt_mio_eur` | 60 | 62 | 96.8% |
| `beschaeftigte` | 62 | 62 | 100.0% |
| `ministerium_id` | 39 | 62 | 62.9% |

## Dateien
| Datei | Beschreibung |
|-------|--------------|
| `behoerden/*.json` | Einzeldateien pro Behörde (62 Dateien) |
| `alle_behoerden.json` | Alle Behörden als Array (Import-ready) |
| `beziehungen.json` | Flache Liste aller Beziehungen |
| `fortschritt.json` | Fortschritt der Recherche |
| `fehler.json` | Nicht vollständig recherchierte IDs |

## Schema
Jede Behörde enthält folgende Felder:
- `id` - Eindeutiger Identifier (lowercase)
- `name` - Offizielle Bezeichnung
- `kuerzel` - Abkürzung
- `typ` - Verfassungsorgan / Ministerium / Bundesoberbehörde / etc.
- `rechtsform` - Rechtsform
- `ebene` - Verwaltungsebene (Bund)
- `sitz` - Hauptsitz (Stadt)
- `bundesland` - Bundesland des Sitzes
- `gruendungsjahr` - Gründungsjahr
- `zustaendigkeit` - Sachgebiet
- `website` - Offizielle Website
- `rechtsgrundlage` - Gesetzliche Grundlage
- `haushalt_mio_eur` - Haushalt in Mio. EUR (2025)
- `beschaeftigte` - Anzahl Beschäftigte
- `ministerium_id` - Übergeordnetes Ministerium (ID)
- `beziehungen` - Organisationsbeziehungen
