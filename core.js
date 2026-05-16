/* =======================================================
   ZeigDenStaat — Core Data Loading & Utilities
   ======================================================= */

// Domain classification mapping
const DOMAINS = {
    education: {
        label: 'Bildung', color: '#3b82f6', dim: '#1e40af',
        match: /Schule|Grundschule|Gymnasium|Sekundar|Gemeinschaftsschule|Berufsschule|Hochschule|Universit|Fachhochschule|Waldorf|F.rderschule|Akademie|Musikhochschule|Kunsthochschule|Berufliches Gymnasium|Abendschule|Volkshochschule|Berufsbildung/i
    },
    admin: {
        label: 'Verwaltung', color: '#14b8a6', dim: '#0d7268',
        match: /Gemeindeverwaltung|Stadtverwaltung|Finanzamt|Gesundheitsamt|Landkreisverwaltung|Jugendamt|Ministerium|Schulamt|Kreisfreie Stadt|Umweltamt|Ordnungsamt|Veterinär|Forst|Sozialamt|Bauamt|Kulturamt|Bürgeramt|Bürgermeister|Kommunale Verwaltung|Verwaltungsverbund|Verbandsgemeindeverwaltung|Stadtentwicklungsamt|Heimaufsicht/i
    },
    justice: {
        label: 'Justiz', color: '#f59e0b', dim: '#b45309',
        match: /Gericht|Staatsanwalt|Justizvollzug|Rechtsanwaltskammer|Anwaltsgericht/i
    },
    infra: {
        label: 'Infrastruktur', color: '#8b5cf6', dim: '#5b21b6',
        match: /Krankenhaus|Stadtwerke|Sparkasse|Verkehr|Abfall|Abwasser|Wasser|IT-Dienstleister|Wohnungsgesellschaft|Nahverkehr|Fernverkehr|Wasserwerk|Bank|Bahn/i
    },
    security: {
        label: 'Sicherheit', color: '#ef4444', dim: '#991b1b',
        match: /Polizei|Feuerwehr|Bundeswehr|THW|Bundespolizei|Bereitschaftspolizei/i
    },
    other: {
        label: 'Sonstige', color: '#64748b', dim: '#334155',
        match: null
    }
};

function getDomain(classification) {
    if (!classification) return 'other';
    for (const [key, val] of Object.entries(DOMAINS)) {
        if (key === 'other') continue;
        if (val.match && val.match.test(classification)) return key;
    }
    return 'other';
}

function getDomainColor(domain) { return DOMAINS[domain]?.color || DOMAINS.other.color; }
function getDomainLabel(domain) { return DOMAINS[domain]?.label || 'Sonstige'; }

// Jurisdiction short names for chart labels
const JURISDICTION_SHORT = {
    'Nordrhein-Westfalen': 'NRW', 'Baden-Württemberg': 'BaWü', 'Niedersachsen': 'NDS',
    'Bayern': 'BY', 'Hessen': 'HE', 'Sachsen': 'SN', 'Rheinland-Pfalz': 'RLP',
    'Thüringen': 'TH', 'Brandenburg': 'BB', 'Sachsen-Anhalt': 'ST', 'Bund': 'Bund',
    'Schleswig-Holstein': 'SH', 'Berlin': 'BE', 'Hamburg': 'HH', 'Saarland': 'SL',
    'Bremen': 'HB', 'Mecklenburg-Vorpommern': 'MV', 'Europäische Union': 'EU'
};

// Population data (2024 estimates, thousands)
const POPULATION = {
    'Nordrhein-Westfalen': 18077, 'Bayern': 13369, 'Baden-Württemberg': 11280,
    'Niedersachsen': 8140, 'Hessen': 6391, 'Sachsen': 4043, 'Rheinland-Pfalz': 4159,
    'Berlin': 3755, 'Schleswig-Holstein': 2953, 'Brandenburg': 2573, 'Sachsen-Anhalt': 2169,
    'Thüringen': 2108, 'Hamburg': 1892, 'Mecklenburg-Vorpommern': 1628, 'Saarland': 992,
    'Bremen': 685
};

// Bundesländer for map (name mapping to TopoJSON keys)
const LAND_MAP_NAMES = {
    'Schleswig-Holstein': 'Schleswig-Holstein', 'Hamburg': 'Hamburg',
    'Niedersachsen': 'Niedersachsen', 'Bremen': 'Bremen',
    'Nordrhein-Westfalen': 'Nordrhein-Westfalen', 'Hessen': 'Hessen',
    'Rheinland-Pfalz': 'Rheinland-Pfalz', 'Baden-Württemberg': 'Baden-Württemberg',
    'Bayern': 'Bayern', 'Saarland': 'Saarland', 'Berlin': 'Berlin',
    'Brandenburg': 'Brandenburg', 'Mecklenburg-Vorpommern': 'Mecklenburg-Vorpommern',
    'Sachsen': 'Sachsen', 'Sachsen-Anhalt': 'Sachsen-Anhalt', 'Thüringen': 'Thüringen'
};

const LAENDER_16 = Object.keys(LAND_MAP_NAMES);

// Global data
let allData = [];
let dataByJurisdiction = {};
let dataByClassification = {};
let dataByDomain = {};

// ---- CSV Loading ----
async function loadCSV() {
    const response = await fetch('data/behoerden_graph.csv');
    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder('utf-8');
    const text = decoder.decode(buffer);
    const lines = text.split('\n').filter(l => l.trim());
    const headers = lines[0].split(';').map(h => h.replace(/"/g, '').trim());

    for (let i = 1; i < lines.length; i++) {
        const vals = parseCSVLine(lines[i], ';');
        if (vals.length < 6) continue;
        const row = {
            Id: vals[0], Name: vals[1], ParentId: vals[2],
            Depth: parseInt(vals[3]) || 0, Classification: vals[4], Jurisdiction: vals[5]
        };
        row.domain = getDomain(row.Classification);
        allData.push(row);
    }

    // Index
    allData.forEach(r => {
        const j = r.Jurisdiction || '(leer)';
        const c = r.Classification || '(leer)';
        (dataByJurisdiction[j] = dataByJurisdiction[j] || []).push(r);
        (dataByClassification[c] = dataByClassification[c] || []).push(r);
        (dataByDomain[r.domain] = dataByDomain[r.domain] || []).push(r);
    });
}

function parseCSVLine(line, delimiter) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                current += '"'; i++;
            } else { inQuotes = !inQuotes; }
        } else if (ch === delimiter && !inQuotes) {
            result.push(current.trim()); current = '';
        } else if (ch === '\r') {
            // skip
        } else {
            current += ch;
        }
    }
    result.push(current.trim());
    return result;
}

function formatNumber(n) {
    return n.toLocaleString('de-DE');
}
