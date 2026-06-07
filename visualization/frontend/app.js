/* =======================================================
   ZeigDenStaat — Application Orchestrator & Map Visualizer
   ======================================================= */

// Global state variables
let map;
let allAuthorities = [];
let cityCoordinates = {};
let activeRessorts = new Set();
let allRessorts = [];
let markersLayer;
let selectedCity = null;

// Map defaults (Germany center)
const GERMANY_CENTER = [51.1657, 10.4515];
const DEFAULT_ZOOM = 6;

// Format helper: Numbers
function formatNumber(n) {
    if (n === null || n === undefined) return '-';
    return Number(n).toLocaleString('de-DE');
}

// Format helper: Money
function formatMoney(m) {
    if (m === null || m === undefined || isNaN(m)) return '-';
    if (m >= 1000) {
        return (m / 1000).toFixed(2).replace('.', ',') + ' Mrd. €';
    }
    return m.toFixed(2).replace('.', ',') + ' Mio. €';
}

// ---- 1. Initialize Map ----
function initMap() {
    map = L.map('map', {
        zoomControl: false // Add it later in a custom position
    }).setView(GERMANY_CENTER, DEFAULT_ZOOM);

    // Zoom buttons in top-right
    L.control.zoom({
        position: 'topright'
    }).addTo(map);

    // Dark-mode Map Tiles (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    // Layer group for glowing circle markers
    markersLayer = L.layerGroup().addTo(map);
}

// ---- 2. Fetch Credentials & Config ----
async function loadCredentials() {
    // Try to fetch config.json first
    try {
        const resp = await fetch('../../neo4j/config.json');
        if (resp.ok) {
            const config = await resp.json();
            return {
                uri: config.NEO4J_URI,
                user: config.NEO4J_USER,
                pass: config.NEO4J_PASS
            };
        }
    } catch (e) {
        console.warn("Failed to load config.json, falling back to .env parser...", e);
    }

    // Fallback to parsing .env file directly
    try {
        const resp = await fetch('../../neo4j/.env');
        if (!resp.ok) throw new Error(`HTTP status ${resp.status}`);
        const text = await resp.text();
        const env = {};
        text.split('\n').forEach(line => {
            line = line.trim();
            if (!line || line.startsWith('#')) return;
            const idx = line.indexOf('=');
            if (idx === -1) return;
            const key = line.substring(0, idx).trim();
            const val = line.substring(idx + 1).trim();
            env[key] = val;
        });
        return {
            uri: env.NEO4J_URI,
            user: env.NEO4J_USER,
            pass: env.NEO4J_PASS
        };
    } catch (e) {
        console.error("Could not load credentials from config.json or .env", e);
        showStatus('error', 'Verbindungsdaten fehlen!');
        throw e;
    }
}

// Load coordinate dictionary
async function loadCityCoordinates() {
    try {
        const resp = await fetch('data/city_coords.json');
        if (!resp.ok) throw new Error("Coords file not found");
        cityCoordinates = await resp.json();
    } catch (e) {
        console.error("Failed to load city coordinates lookup:", e);
        // Fallback with critical cities
        cityCoordinates = {
            "Berlin": { "lat": 52.52, "lon": 13.405 },
            "Bonn": { "lat": 50.733, "lon": 7.1 },
            "München": { "lat": 48.137, "lon": 11.575 },
            "Hamburg": { "lat": 53.55, "lon": 9.99 },
            "Köln": { "lat": 50.938, "lon": 6.96 },
            "Frankfurt": { "lat": 50.11, "lon": 8.68 }
        };
    }
}

// ---- 3. Database Queries ----
async function loadDataFromNeo4j(creds) {
    showStatus('connecting', 'Neo4j verbindet...');
    const driver = neo4j.driver(creds.uri, neo4j.auth.basic(creds.user, creds.pass));
    const session = driver.session();

    try {
        const result = await session.run(`
            MATCH (n:Behoerde)
            RETURN 
                n.id as id, 
                n.name as name, 
                n.kuerzel as kuerzel, 
                n.typ as typ, 
                n.sitz as sitz, 
                n.haushalt_mio_eur as budget, 
                n.beschaeftigte as employees, 
                n.ressort as ressort, 
                n.bundesland as bundesland,
                n.gruendungsjahr as gruendungsjahr,
                n.aufgeloest as aufgeloest
        `);

        allAuthorities = result.records.map(record => {
            return {
                id: record.get('id'),
                name: record.get('name'),
                kuerzel: record.get('kuerzel') || '',
                typ: record.get('typ') || 'Sonstige',
                sitz: record.get('sitz') || '',
                budget: record.get('budget') !== null ? Number(record.get('budget')) : null,
                employees: record.get('employees') !== null ? Number(record.get('employees')) : null,
                ressort: record.get('ressort') || 'Keinem Ressort unterstellt',
                bundesland: record.get('bundesland') || '',
                gruendungsjahr: record.get('gruendungsjahr') !== null ? Number(record.get('gruendungsjahr')) : null,
                aufgeloest: record.get('aufgeloest') || 'False'
            };
        });

        // Query relationships
        const relsResult = await session.run(`
            MATCH (a:Behoerde)-[r:UNTERSTELLT|FACHAUFSICHT|RECHTSAUFSICHT|KOORDINIERT_MIT]->(b:Behoerde)
            RETURN a.id as from_id, type(r) as type, b.id as to_id
        `);

        allRelationships = relsResult.records.map(record => {
            return {
                from_id: record.get('from_id'),
                type: record.get('type'),
                to_id: record.get('to_id')
            };
        });

        console.log(`Loaded ${allAuthorities.length} authorities and ${allRelationships.length} relationships from Neo4j.`);
        showStatus('connected', 'Neo4j verbunden');
        document.getElementById('search-input').disabled = false;

        // Process ressort list for checkboxes
        const ressortCounts = {};
        allAuthorities.forEach(a => {
            const r = a.ressort;
            ressortCounts[r] = (ressortCounts[r] || 0) + 1;
        });

        allRessorts = Object.keys(ressortCounts).sort((a, b) => ressortCounts[b] - ressortCounts[a]);
        // Set all active by default
        allRessorts.forEach(r => activeRessorts.add(r));

        renderFilters(ressortCounts);
        populateMinistrySelect(); // populate select dropdown in supervision
        updateUI();

    } catch (e) {
        console.error("Database query failed:", e);
        showStatus('error', 'Fehler beim Laden der Daten');
    } finally {
        await session.close();
        await driver.close();
    }
}

// ---- 4. UI Rendering & Filter logic ----
function showStatus(statusClass, text) {
    const indicator = document.getElementById('conn-status');
    indicator.className = `status-indicator ${statusClass}`;
    indicator.querySelector('.status-text').textContent = text;
}

// Render filters
function renderFilters(counts) {
    const container = document.getElementById('ressort-checkboxes');
    container.innerHTML = '';

    allRessorts.forEach((r, idx) => {
        const item = document.createElement('label');
        item.className = 'filter-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = true;
        checkbox.value = r;
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                activeRessorts.add(r);
            } else {
                activeRessorts.delete(r);
            }
            updateUI();
        });

        const text = document.createElement('span');
        text.className = 'filter-text';
        text.textContent = r;

        const countBadge = document.createElement('span');
        countBadge.className = 'count-badge';
        countBadge.textContent = counts[r];

        item.appendChild(checkbox);
        item.appendChild(text);
        item.appendChild(countBadge);
        container.appendChild(item);
    });

    // Checkbox master buttons
    document.getElementById('filter-all').onclick = () => {
        container.querySelectorAll('input').forEach(cb => {
            cb.checked = true;
            activeRessorts.add(cb.value);
        });
        updateUI();
    };

    document.getElementById('filter-none').onclick = () => {
        container.querySelectorAll('input').forEach(cb => {
            cb.checked = false;
            activeRessorts.delete(cb.value);
        });
        updateUI();
    };
}

// Filter the master list based on active filters
function getFilteredAuthorities() {
    const searchVal = document.getElementById('search-input').value.toLowerCase().trim();
    
    return allAuthorities.filter(a => {
        // Filter by Ressort
        if (!activeRessorts.has(a.ressort)) return false;

        // Filter by Search text (Map view filters lists; Treemap handles highlight separately, but starts with active filters)
        if (searchVal && document.getElementById('tab-map').classList.contains('active')) {
            const nameMatch = a.name.toLowerCase().includes(searchVal);
            const kuerzelMatch = a.kuerzel.toLowerCase().includes(searchVal);
            const sitzMatch = a.sitz.toLowerCase().includes(searchVal);
            const ressortMatch = a.ressort.toLowerCase().includes(searchVal);
            return nameMatch || kuerzelMatch || sitzMatch || ressortMatch;
        }

        return true;
    });
}

// ---- 5. Visualizer Calculations ----
function updateUI() {
    const filtered = getFilteredAuthorities();

    // Group by City
    const cityGroups = {};
    let totalBudget = 0;
    let totalEmployees = 0;

    filtered.forEach(a => {
        const city = a.sitz;
        if (!city) return;

        if (!cityCoordinates[city]) {
            // Check for slashed cities (like Berlin/Bonn)
            const parts = city.replace('/', ',').split(',');
            for (let p of parts) {
                p = p.trim();
                if (cityCoordinates[p]) {
                    cityCoordinates[city] = cityCoordinates[p];
                    break;
                }
            }
        }

        if (!cityGroups[city]) {
            cityGroups[city] = {
                name: city,
                count: 0,
                budget: 0,
                employees: 0,
                authorities: []
            };
        }

        cityGroups[city].count++;
        cityGroups[city].authorities.push(a);

        if (a.budget) {
            cityGroups[city].budget += a.budget;
            totalBudget += a.budget;
        }
        if (a.employees) {
            cityGroups[city].employees += a.employees;
            totalEmployees += a.employees;
        }
    });

    const citiesArray = Object.values(cityGroups).sort((a, b) => b.count - a.count);

    // Update KPIs
    document.getElementById('stat-total-nodes').textContent = formatNumber(filtered.length);
    document.getElementById('stat-total-cities').textContent = formatNumber(citiesArray.length);
    document.getElementById('stat-total-budget').textContent = formatMoney(totalBudget);
    document.getElementById('stat-total-staff').textContent = formatNumber(totalEmployees);

    // Re-draw map markers
    markersLayer.clearLayers();

    citiesArray.forEach(city => {
        const coords = cityCoordinates[city.name];
        if (!coords) return;

        const markerRadius = Math.pow(city.count, 0.4) * 3 + 3;

        // Leaflet Circle Marker
        const marker = L.circleMarker([coords.lat, coords.lon], {
            radius: markerRadius,
            fillColor: 'var(--accent)',
            color: '#fff',
            weight: 1.2,
            opacity: 0.9,
            fillOpacity: 0.35 + (Math.min(city.count, 100) / 100) * 0.2,
            className: 'glowing-circle'
        });

        // Popup tooltip
        marker.bindPopup(`
            <div class="map-popup">
                <h4>${city.name}</h4>
                <p><strong>${city.count}</strong> Bundesbehörde${city.count > 1 ? 'n' : ''}</p>
                <p style="margin-top: 4px; font-size:11px; color:#5b5b75;">Klicken für Details</p>
            </div>
        `);

        // Click to inspect details
        marker.on('click', () => {
            showCityDetails(city);
        });

        marker.addTo(markersLayer);
    });

    // Render Ranking Leaderboard
    renderLeaderboard(citiesArray);

    // Update Detail Panel if open
    if (selectedCity && cityGroups[selectedCity.name]) {
        showCityDetails(cityGroups[selectedCity.name]);
    } else if (selectedCity) {
        closeDetailPanel();
    }

    // Refresh D3 Treemap if the tab is currently active
    if (document.getElementById('tab-treemap').classList.contains('active')) {
        renderTreemap(filtered, tmActiveMetric);
        searchHighlightTreemap(document.getElementById('search-input').value);
    }

    // Refresh D3 Supervision if the tab is currently active
    if (document.getElementById('tab-supervision').classList.contains('active')) {
        renderSupervisionGraph();
        searchHighlightSupervision(document.getElementById('search-input').value);
    }

    // Refresh D3 Coordination if the tab is currently active
    if (document.getElementById('tab-coordination').classList.contains('active')) {
        renderCoordinationGraph();
        searchHighlightCoordination(document.getElementById('search-input').value);
    }

    // Refresh D3 Timeline if the tab is currently active
    if (document.getElementById('tab-timeline').classList.contains('active')) {
        initTimelineData();
        updateTimelineGraph(timeCurrentYear);
        searchHighlightTimeline(document.getElementById('search-input').value);
    }
}

function renderLeaderboard(citiesArray) {
    const list = document.getElementById('city-ranking-list');
    list.innerHTML = '';

    if (citiesArray.length === 0) {
        list.innerHTML = '<li class="loading-placeholder">Keine Städte gefunden</li>';
        return;
    }

    // Show top 25 cities
    citiesArray.slice(0, 25).forEach((city, idx) => {
        const item = document.createElement('li');
        item.className = 'ranking-item';
        item.innerHTML = `
            <span class="rank-num">${idx + 1}</span>
            <span class="city-name">${city.name}</span>
            <span class="city-count">${city.count}</span>
        `;
        item.onclick = () => {
            const coords = cityCoordinates[city.name];
            if (coords) {
                map.flyTo([coords.lat, coords.lon], 9, {
                    duration: 1.2
                });
            }
            showCityDetails(city);
        };
        list.appendChild(item);
    });
}

// ---- 6. Detail Panel Controls ----
function showCityDetails(city) {
    selectedCity = city;
    document.getElementById('detail-city-name').textContent = city.name;
    document.getElementById('detail-city-count').textContent = formatNumber(city.count);
    
    // Calculate totals for detail view
    document.getElementById('detail-kpi-budget').textContent = formatMoney(city.budget);
    document.getElementById('detail-kpi-staff').textContent = formatNumber(city.employees);

    // Render list of authorities
    const listContainer = document.getElementById('detail-authorities-list');
    listContainer.innerHTML = '';

    const sortedAuths = [...city.authorities].sort((a, b) => {
        if (a.employees && b.employees) return b.employees - a.employees;
        if (a.employees) return -1;
        if (b.employees) return 1;
        return a.name.localeCompare(name);
    });

    sortedAuths.forEach(auth => {
        const card = document.createElement('li');
        card.className = 'authority-card';
        card.innerHTML = `
            <div class="auth-name-row">
                <span class="auth-name">${auth.name}</span>
                ${auth.kuerzel ? `<span class="auth-badge">${auth.kuerzel}</span>` : ''}
            </div>
            <div class="auth-meta-row">
                <div class="auth-ressort" title="${auth.ressort}">👔 ${auth.ressort}</div>
                <div class="auth-stats">
                    <span>👥 Besc.: <strong class="auth-stat-value">${formatNumber(auth.employees)}</strong></span>
                    <span>💰 Haush.: <strong class="auth-stat-value">${formatMoney(auth.budget)}</strong></span>
                </div>
            </div>
        `;
        listContainer.appendChild(card);
    });

    document.getElementById('detail-panel').classList.add('active');
}

function closeDetailPanel() {
    selectedCity = null;
    document.getElementById('detail-panel').classList.remove('active');
}

// ---- 7. Entry Point Initialization ----
document.addEventListener('DOMContentLoaded', async () => {
    initMap();
    await loadCityCoordinates();

    // Event listeners
    document.getElementById('detail-close').onclick = closeDetailPanel;
    
    // Search bar logic
    const searchInput = document.getElementById('search-input');
    const searchClearBtn = document.getElementById('search-clear');
    
    searchInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        searchClearBtn.style.display = val ? 'block' : 'none';
        
        updateUI(); // Updates map circles
        
        // Updates D3 views if active
        if (document.getElementById('tab-treemap').classList.contains('active')) {
            searchHighlightTreemap(val);
        } else if (document.getElementById('tab-supervision').classList.contains('active')) {
            searchHighlightSupervision(val);
        } else if (document.getElementById('tab-coordination').classList.contains('active')) {
            searchHighlightCoordination(val);
        } else if (document.getElementById('tab-timeline').classList.contains('active')) {
            searchHighlightTimeline(val);
        }
    });

    searchClearBtn.onclick = () => {
        searchInput.value = '';
        searchClearBtn.style.display = 'none';
        searchInput.focus();
        updateUI();
        if (document.getElementById('tab-treemap').classList.contains('active')) {
            searchHighlightTreemap('');
        } else if (document.getElementById('tab-supervision').classList.contains('active')) {
            searchHighlightSupervision('');
        } else if (document.getElementById('tab-coordination').classList.contains('active')) {
            searchHighlightCoordination('');
        } else if (document.getElementById('tab-timeline').classList.contains('active')) {
            searchHighlightTimeline('');
        }
    };

    // Tab view switching logic
    const tabMap = document.getElementById('tab-map');
    const tabTreemap = document.getElementById('tab-treemap');
    const tabSupervision = document.getElementById('tab-supervision');
    const tabCoordination = document.getElementById('tab-coordination');
    const tabTimeline = document.getElementById('tab-timeline');
    
    const mapEl = document.getElementById('map');
    const treemapEl = document.getElementById('treemap-container');
    const supervisionEl = document.getElementById('supervision-container');
    const coordinationEl = document.getElementById('coordination-container');
    const timelineEl = document.getElementById('timeline-container');
    
    const mapSidebar = document.getElementById('map-sidebar-content');
    const treemapSidebar = document.getElementById('treemap-sidebar-content');
    const supervisionSidebar = document.getElementById('supervision-sidebar-content');
    const coordinationSidebar = document.getElementById('coordination-sidebar-content');
    const timelineSidebar = document.getElementById('timeline-sidebar-content');
    const sharedSelectionSidebar = document.getElementById('shared-selection-sidebar');

    function switchView(view) {
        // Pause timeline playback if active when switching views
        if (timePlayInterval) {
            clearInterval(timePlayInterval);
            timePlayInterval = null;
            document.getElementById('btn-timeline-play').textContent = '▶️ Abspielen';
        }

        if (view === 'map') {
            tabMap.classList.add('active');
            tabTreemap.classList.remove('active');
            tabSupervision.classList.remove('active');
            tabCoordination.classList.remove('active');
            tabTimeline.classList.remove('active');
            
            mapEl.classList.remove('hidden');
            treemapEl.classList.add('hidden');
            supervisionEl.classList.add('hidden');
            coordinationEl.classList.add('hidden');
            timelineEl.classList.add('hidden');
            
            mapSidebar.classList.remove('hidden');
            treemapSidebar.classList.add('hidden');
            supervisionSidebar.classList.add('hidden');
            coordinationSidebar.classList.add('hidden');
            timelineSidebar.classList.add('hidden');
            sharedSelectionSidebar.classList.add('hidden');
            
            closeDetailPanel();
            setTimeout(() => map.invalidateSize(), 50); // Re-align Leaflet bounds
        } else if (view === 'treemap') {
            tabMap.classList.remove('active');
            tabTreemap.classList.add('active');
            tabSupervision.classList.remove('active');
            tabCoordination.classList.remove('active');
            tabTimeline.classList.remove('active');
            
            mapEl.classList.add('hidden');
            treemapEl.classList.remove('hidden');
            supervisionEl.classList.add('hidden');
            coordinationEl.classList.add('hidden');
            timelineEl.classList.add('hidden');
            
            mapSidebar.classList.add('hidden');
            treemapSidebar.classList.remove('hidden');
            supervisionSidebar.classList.add('hidden');
            coordinationSidebar.classList.add('hidden');
            timelineSidebar.classList.add('hidden');
            sharedSelectionSidebar.classList.remove('hidden');
            
            closeDetailPanel();
            
            // Re-render D3 treemap
            initTreemapLayout();
            renderTreemap(getFilteredAuthorities(), tmActiveMetric);
            searchHighlightTreemap(searchInput.value);
        } else if (view === 'supervision') {
            tabMap.classList.remove('active');
            tabTreemap.classList.remove('active');
            tabSupervision.classList.add('active');
            tabCoordination.classList.remove('active');
            tabTimeline.classList.remove('active');
            
            mapEl.classList.add('hidden');
            treemapEl.classList.add('hidden');
            supervisionEl.classList.remove('hidden');
            coordinationEl.classList.add('hidden');
            timelineEl.classList.add('hidden');
            
            mapSidebar.classList.add('hidden');
            treemapSidebar.classList.add('hidden');
            supervisionSidebar.classList.remove('hidden');
            coordinationSidebar.classList.add('hidden');
            timelineSidebar.classList.add('hidden');
            sharedSelectionSidebar.classList.remove('hidden');
            
            closeDetailPanel();
            
            // Re-render Concentric supervision graph
            initSupervisionLayout();
            renderSupervisionGraph();
            searchHighlightSupervision(searchInput.value);
        } else if (view === 'coordination') {
            tabMap.classList.remove('active');
            tabTreemap.classList.remove('active');
            tabSupervision.classList.remove('active');
            tabCoordination.classList.add('active');
            tabTimeline.classList.remove('active');
            
            mapEl.classList.add('hidden');
            treemapEl.classList.add('hidden');
            supervisionEl.classList.add('hidden');
            coordinationEl.classList.remove('hidden');
            timelineEl.classList.add('hidden');
            
            mapSidebar.classList.add('hidden');
            treemapSidebar.classList.add('hidden');
            supervisionSidebar.classList.add('hidden');
            coordinationSidebar.classList.remove('hidden');
            timelineSidebar.classList.add('hidden');
            sharedSelectionSidebar.classList.remove('hidden');
            
            closeDetailPanel();
            
            // Re-render Coordination constellation graph
            initCoordinationLayout();
            renderCoordinationGraph();
            searchHighlightCoordination(searchInput.value);
        } else if (view === 'timeline') {
            tabMap.classList.remove('active');
            tabTreemap.classList.remove('active');
            tabSupervision.classList.remove('active');
            tabCoordination.classList.remove('active');
            tabTimeline.classList.add('active');
            
            mapEl.classList.add('hidden');
            treemapEl.classList.add('hidden');
            supervisionEl.classList.add('hidden');
            coordinationEl.classList.add('hidden');
            timelineEl.classList.remove('hidden');
            
            mapSidebar.classList.add('hidden');
            treemapSidebar.classList.add('hidden');
            supervisionSidebar.classList.add('hidden');
            coordinationSidebar.classList.add('hidden');
            timelineSidebar.classList.remove('hidden');
            sharedSelectionSidebar.classList.remove('hidden');
            
            closeDetailPanel();
            
            // Re-render Timeline sprout graph
            initTimelineLayout();
            initTimelineData();
            initTimelinePlayback();
            updateTimelineGraph(timeCurrentYear);
            searchHighlightTimeline(searchInput.value);
        }
    }

    tabMap.onclick = () => switchView('map');
    tabTreemap.onclick = () => switchView('treemap');
    tabSupervision.onclick = () => switchView('supervision');
    tabCoordination.onclick = () => switchView('coordination');
    tabTimeline.onclick = () => switchView('timeline');

    // D3 Treemap metric toggle buttons
    document.getElementById('btn-metric-budget').onclick = () => {
        document.getElementById('btn-metric-budget').classList.add('active');
        document.getElementById('btn-metric-staff').classList.remove('active');
        tmActiveMetric = 'budget';
        renderTreemap(getFilteredAuthorities(), 'budget');
        searchHighlightTreemap(searchInput.value);
    };

    document.getElementById('btn-metric-staff').onclick = () => {
        document.getElementById('btn-metric-budget').classList.remove('active');
        document.getElementById('btn-metric-staff').classList.add('active');
        tmActiveMetric = 'employees';
        renderTreemap(getFilteredAuthorities(), 'employees');
        searchHighlightTreemap(searchInput.value);
    };

    // Load credentials & run query
    try {
        const creds = await loadCredentials();
        await loadDataFromNeo4j(creds);
    } catch (e) {
        console.error("Initialization failed:", e);
    }
});
