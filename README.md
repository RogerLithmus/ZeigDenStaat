# 🏛️ ZeigDenStaat — Visualisierung des deutschen Staatsapparates

Eine interaktive, performante Single-Page-Anwendung (SPA) zur Visualisierung aller **42.233 öffentlichen Institutionen** des deutschen Staates — von der kleinsten Grundschule über Gerichte und Landesbehörden bis hin zu den Bundesministerien. 

Dieses Projekt basiert auf den Daten der Open-Data-Plattform **FragDenStaat.de** und blickt tief in die Struktur und Hierarchie unserer Verwaltung.

---

## 🎯 Der Sinn dieses Projekts

Deutschland gilt oft als bürokratisch und unübersichtlich. **ZeigDenStaat** macht den Staatsapparat transparent und greifbar:
- **Masse verstehen:** Über 50 % aller staatlichen Stellen sind Bildungseinrichtungen (Schulen, Hochschulen). Das Waffel- und Donutdiagramm machen diese Verhältnisse sofort sichtbar.
- **Hierarchien aufdecken:** Wie untergliedern sich Bundesministerien? Das zoombare Sunburst-Diagramm und der interaktive Netzwerkgraph machen Über- und Unterordnungen spielerisch verständlich.
- **Geografische Verteilung:** Die interaktive Bundeslandkarte zeigt auf einen Blick, wo welche Behördenkonzentrationen vorliegen.
- **Transparenz & Recherche:** Eine performante Echtzeitsuche ermöglicht das Durchsuchen und Filtern aller 42.233 Einträge innerhalb von Millisekunden.

---

## 🛠️ Technologie-Stack

Dieses Projekt wurde bewusst mit einem schlanken und extrem schnellen Tech-Stack ohne schwere JavaScript-Frameworks realisiert:
1. **Frontend-Core:** Semantisches HTML5 & Vanilla JavaScript (ES6+).
2. **Styling:** Premium Vanilla CSS3 mit einem modernen Dark-Theme („Midnight Showroom“-Ästhetik), CSS Grid, Flexbox, flüssigen Scroll-Transitions und Micro-Animations.
3. **Visualisierungs-Bibliotheken:**
    - [D3.js (v7)](https://d3js.org/) — Für komplexe Visualisierungen wie die interaktive Deutschlandkarte, Treemap, Netzwerk-Graph, Bump-Chart und Sunburst.
    - [Chart.js (v4)](https://www.chartjs.org/) — Für reaktionsschnelle Donut- und Radar-Diagramme.
    - [TopoJSON](https://github.com/topojson/topojson) — Für effizientes Rendering geografischer Grenzen.

---

## 📁 Projektstruktur & Architektur

Die Codebasis ist hochgradig modularisiert und sauber strukturiert:

```bash
ZeigDenStaat/
│
├── index.html          # Das Haupt-HTML5-Dokument (Struktur, Navigation & Sektionen)
├── styles.css          # Premium Custom Design (Styling, Dark-Theme, Layout & Animationen)
│
├── core.js             # Daten-Parsing (CSV), Filter-Hilfsfunktionen & globale Zustände
├── app.js              # Haupt-Orchestrator (DOM-Events, ScrollReveal & Initialisierung)
│
├── charts1.js          # Partikel-Hintergrund, KPI-Zähler, Donut, Waffel, Treemap, Karte
├── charts2.js          # Stacked-Bars, Sunburst-Hierarchie, Force-Directed Network Graph
├── charts3.js          # Heatmap, Radar-Vergleichsdiagramm, Bump-Chart, Suchtabelle
│
└── data/
    ├── behoerden_graph.csv      # Bereinigter UTF-8-Datensatz (42.233 Einträge)
    └── behoerden_graph.csv.bak  # Sicherheits-Backup der Originaldaten
```

### Die JavaScript-Module im Detail:
- **[core.js](file:///c:/Projects/ZeigDenStaat/core.js):** Lädt die CSV-Datei asynchron über einen `ArrayBuffer`, bereinigt sie und indiziert die Daten nach Jurisdiktion (Bundesland), Behördentyp und Domäne.
- **[app.js](file:///c:/Projects/ZeigDenStaat/app.js):** Koordiniert das Zusammenspiel. Nutzt einen `IntersectionObserver` für das verzögerte Laden schwerer Diagramme (Lazy Rendering) und das visuelle Einblenden (Scroll Reveal) beim Scrollen.
- **[charts1.js](file:///c:/Projects/ZeigDenStaat/charts1.js) / [charts2.js](file:///c:/Projects/ZeigDenStaat/charts2.js) / [charts3.js](file:///c:/Projects/ZeigDenStaat/charts3.js):** Isolieren die D3- und Chart.js-Instanziierungen, um die Wartbarkeit des Codes zu maximieren.

---

## 🚀 Lokale Verwendung & Ausführung

Da die Anwendung Datensätze asynchron via `fetch()` nachlädt und D3-Kartendaten via CDN importiert, verhindert die Same-Origin-Policy moderner Browser das direkte Öffnen der Datei über das `file://`-Protokoll (CORS-Fehler). 

Es wird zwingend ein **lokaler Webserver** benötigt.

### Option 1: Mit Python (Empfohlen - keine Installation nötig)
Öffnen Sie ein Terminal im Projektordner und starten Sie den integrierten HTTP-Server:
```powershell
python -m http.server 8000
```
Öffnen Sie anschließend **[http://localhost:8000](http://localhost:8000)** im Browser.

### Option 2: Mit Node.js & `npx`
Sollten Sie Node.js installiert haben, können Sie einen beliebigen statischen Server ad-hoc starten:
```bash
npx http-server -p 8000
```
oder
```bash
npx live-server
```

---

## ⚡ Wichtiger Hinweis zur Datenbereinigung (UTF-8 Fix)

Der in `data/behoerden_graph.csv` enthaltene Rohdatensatz wies ursprünglich eine fehlerhafte **Double-UTF-8-Kodierung** auf. Dadurch wurden deutsche Umlaute im Browser fehlerhaft dargestellt (z. B. `ThÃ¼ringen` statt `Thüringen`).

Um dies in Zukunft zu vermeiden, sollte der Datensatz wie folgt bereinigt werden:

```python
with open('data/behoerden_graph.csv', 'rb') as f:
    content = f.read()

# BOM entfernen falls vorhanden
if content.startswith(b'\xef\xbb\xbf'):
    content = content[3:]

# Revert Double-UTF-8
fixed = content.decode('utf-8').encode('latin-1')

with open('data/behoerden_graph.csv', 'wb') as f:
    f.write(fixed)
```

---

## 📊 Lizenz & Datenquelle
- **Datenquelle:** [FragDenStaat.de API](https://fragdenstaat.de/api/v1/publicbody/) (Daten stehen unter CC-BY bzw. Open-Data-Lizenzen).
- **Visualisierungs-Engine:** Entwickelt im Rahmen von Open-Source-Lernprojekten zur administrativen Datenvisualisierung.
