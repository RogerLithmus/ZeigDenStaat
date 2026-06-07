/* =======================================================
   ZeigDenStaat — Zoomable Treemap Visualizer (D3.js)
   ======================================================= */

let tmSvg;
let tmRoot;
let tmCurrentNode;
let tmActiveMetric = 'budget'; // 'budget' or 'employees'
let tmAuthorities = [];
let tmColorScale;
let tmZoomBehavior;
let tmContainerGroup;

// Curated dark tech color palette for Ressorts
const RESORT_COLORS = [
    '#6366f1', // Indigo
    '#a855f7', // Purple
    '#ec4899', // Pink
    '#f43f5e', // Rose
    '#f97316', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#10b981', // Emerald
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
    '#14b8a6', // Teal
    '#f59e0b', // Amber
    '#84cc16', // Lime
    '#d946ef', // Fuchsia
    '#0d9488', // Dark Teal
    '#4f46e5'  // Dark Indigo
];

function initTreemapLayout() {
    const container = document.getElementById('treemap-chart');
    container.innerHTML = ''; // Clear previous

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    tmSvg = d3.select('#treemap-chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    // Create the master container group that handles pan & zoom transforms
    tmContainerGroup = tmSvg.append('g').attr('class', 'zoom-container');

    tmColorScale = d3.scaleOrdinal().range(RESORT_COLORS);

    // Define D3 Zoom Behavior
    tmZoomBehavior = d3.zoom()
        .scaleExtent([0.5, 60]) // Zoom from 0.5x up to 60x (allows watching very small blocks!)
        .on('zoom', (event) => {
            tmContainerGroup.attr('transform', event.transform);
        });

    // Apply Zoom Behavior to SVG
    tmSvg.call(tmZoomBehavior);

    // Zoom reset button handler
    document.getElementById('btn-zoom-reset').onclick = () => {
        if (tmSvg && tmZoomBehavior) {
            // Smoothly glide camera back to identity transform
            tmSvg.transition().duration(750).call(tmZoomBehavior.transform, d3.zoomIdentity);
            tmCurrentNode = tmRoot;
            
            // Enable reset btn
            document.getElementById('btn-zoom-reset').disabled = true;

            // Reset sidebar stats
            updateTreemapSidebarStats(
                tmRoot.value,
                tmRoot.leaves().length,
                tmRoot.leaves().reduce((acc, l) => acc + (l.data.budget || 0), 0),
                'Alle Ressorts'
            );
        }
    };
}

// Convert flat Neo4j data into D3 hierarchical JSON
function buildHierarchicalData(authorities, metric) {
    const root = {
        name: "Bundesverwaltung",
        children: []
    };

    const groups = {};
    authorities.forEach(a => {
        const r = a.ressort;
        
        // Skip authorities with no positive value in selected metric
        const val = metric === 'budget' ? a.budget : a.employees;
        if (val === null || val === undefined || val <= 0) return;

        if (!groups[r]) {
            groups[r] = {
                name: r,
                children: []
            };
        }

        groups[r].children.push({
            id: a.id,
            name: a.name,
            kuerzel: a.kuerzel,
            typ: a.typ,
            sitz: a.sitz,
            budget: a.budget,
            employees: a.employees,
            ressort: a.ressort,
            bundesland: a.bundesland,
            value: val
        });
    });

    Object.values(groups).forEach(g => {
        if (g.children.length > 0) {
            root.children.push(g);
        }
    });

    return root;
}

function renderTreemap(authorities, metric) {
    tmAuthorities = authorities;
    tmActiveMetric = metric;

    if (!tmSvg) initTreemapLayout();

    const container = document.getElementById('treemap-chart');
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // Clear inside the zoom group
    tmContainerGroup.selectAll('*').remove();

    const rawHierarchy = buildHierarchicalData(authorities, metric);

    if (rawHierarchy.children.length === 0) {
        tmContainerGroup.append('text')
            .attr('x', width / 2)
            .attr('y', height / 2)
            .attr('text-anchor', 'middle')
            .attr('fill', 'var(--text-muted)')
            .text('Keine Daten für die gewählten Filter verfügbar.');
        updateTreemapSidebarStats(0, 0, 0, 'Keine Daten');
        return;
    }

    // Initialize D3 Hierarchy
    tmRoot = d3.hierarchy(rawHierarchy)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);

    tmCurrentNode = tmRoot;

    // Apply color scale range to Ressorts
    tmColorScale.domain(rawHierarchy.children.map(c => c.name));

    // Calculate layout sizing
    const treemapLayout = d3.treemap()
        .size([width, height])
        .paddingOuter(4)
        .paddingTop(28) // height of parent header row
        .paddingInner(3)
        .round(true);

    treemapLayout(tmRoot);

    // Initial Stats update
    updateTreemapSidebarStats(
        tmRoot.value, 
        tmRoot.leaves().length,
        tmRoot.leaves().reduce((acc, l) => acc + (l.data.budget || 0), 0),
        'Alle Ressorts'
    );

    // Reset zoom to identity transform on redraw to align layout properly
    tmSvg.call(tmZoomBehavior.transform, d3.zoomIdentity);
    document.getElementById('btn-zoom-reset').disabled = true;

    // Draw parent/ressort headers & cells
    const ressorts = tmContainerGroup.selectAll('.ressort-group')
        .data(tmRoot.children)
        .enter()
        .append('g')
        .attr('class', 'ressort-group');

    // Draw individual authority cells (leaves)
    const nodes = tmContainerGroup.selectAll('.node')
        .data(tmRoot.leaves())
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.x0},${d.y0})`);

    // Append clip paths to cut text off at rectangle boundaries
    nodes.append('clipPath')
        .attr('id', d => `clip-${d.data.id}`)
        .append('rect')
        .attr('width', d => Math.max(0, d.x1 - d.x0))
        .attr('height', d => Math.max(0, d.y1 - d.y0))
        .attr('rx', 3);

    // Rectangles
    nodes.append('rect')
        .attr('id', d => `rect-${d.data.id}`)
        .attr('width', d => Math.max(0, d.x1 - d.x0))
        .attr('height', d => Math.max(0, d.y1 - d.y0))
        .attr('fill', d => {
            const baseColor = d3.color(tmColorScale(d.parent.data.name));
            // Shading: slightly vary brightness based on hierarchy placement
            return baseColor.darker(0.15 + (d.data.id.charCodeAt(0) % 5) * 0.08);
        })
        .attr('rx', 3)
        .on('mouseover', showTooltip)
        .on('mousemove', moveTooltip)
        .on('mouseout', hideTooltip)
        .on('click', (event, d) => {
            selectAuthority(d.data);
            zoomTo(d.parent); // Click zooms smoothly to focus on parent Ressort!
            event.stopPropagation();
        });

    // Node multi-line text labels (Abbreviation + full name, clipped to rect size)
    const textLabels = nodes.append('text')
        .attr('clip-path', d => `url(#clip-${d.data.id})`)
        .attr('fill', '#fff')
        .attr('opacity', 0.85);

    textLabels.append('tspan')
        .attr('x', 6)
        .attr('y', 16)
        .attr('font-weight', '700')
        .attr('font-size', '10px')
        .text(d => d.data.kuerzel || d.data.name.substring(0, 3));

    textLabels.append('tspan')
        .attr('x', 6)
        .attr('dy', '14')
        .attr('font-weight', '400')
        .attr('font-size', '8px')
        .attr('fill', 'var(--text-muted)')
        .text(d => d.data.name);

    // Zoom headers (draw them behind/above cells)
    const parents = tmContainerGroup.selectAll('.grandparent')
        .data(tmRoot.descendants().filter(d => d.depth === 1)) // Ressort level
        .enter()
        .append('g')
        .attr('class', 'grandparent')
        .attr('transform', d => `translate(${d.x0},${d.y0})`)
        .on('click', (event, d) => {
            zoomTo(d);
            event.stopPropagation();
        });

    parents.append('rect')
        .attr('width', d => Math.max(0, d.x1 - d.x0))
        .attr('height', 24)
        .attr('fill', '#10101f')
        .attr('stroke', varName => d3.color(tmColorScale(varName.data.name)).darker(0.5))
        .attr('rx', 2);

    parents.append('text')
        .attr('x', 10)
        .attr('y', 16)
        .text(d => {
            const widthAvailable = d.x1 - d.x0;
            const label = d.data.name;
            if (widthAvailable < 120) return label.substring(0, 10) + '...';
            return label.length > 55 ? label.substring(0, 55) + '...' : label;
        })
        .attr('fill', 'var(--text-main)')
        .attr('font-size', '11px')
        .attr('font-weight', '600');
}

// ---- Tooltip Logic ----
const tooltipEl = document.getElementById('treemap-tooltip');

function showTooltip(event, d) {
    d3.select(this)
        .attr('stroke', '#fff')
        .attr('stroke-width', '1.5px');

    const data = d.data;
    const metricLabel = tmActiveMetric === 'budget' ? 'Haushalt' : 'Beschäftigte';
    const metricValue = tmActiveMetric === 'budget' ? formatMoney(data.budget) : formatNumber(data.employees);

    tooltipEl.innerHTML = `
        <h4>${data.name}</h4>
        <p style="margin-bottom: 4px;"><strong>Ressort:</strong> ${data.ressort}</p>
        <p><strong>Typ:</strong> ${data.typ} | <strong>Sitz:</strong> ${data.sitz}</p>
        <p style="margin-top: 6px; color:var(--accent); font-weight:600;">
            ${metricLabel}: ${metricValue}
        </p>
    `;
    tooltipEl.classList.remove('hidden');
}

function moveTooltip(event) {
    const x = event.pageX + 15;
    const y = event.pageY + 15;
    
    // Bounds check to prevent viewport clipping
    const tooltipWidth = tooltipEl.offsetWidth;
    const tooltipHeight = tooltipEl.offsetHeight;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let left = x;
    let top = y;

    if (x + tooltipWidth > windowWidth) {
        left = event.pageX - tooltipWidth - 15;
    }
    if (y + tooltipHeight > windowHeight) {
        top = event.pageY - tooltipHeight - 15;
    }

    tooltipEl.style.left = `${left}px`;
    tooltipEl.style.top = `${top}px`;
}

function hideTooltip(event, d) {
    d3.select(this)
        .attr('stroke', 'var(--bg-dark)')
        .attr('stroke-width', '1px');
    tooltipEl.classList.add('hidden');
}

// ---- camera Zoom/FlyTo Logic ----
function zoomTo(node) {
    tmCurrentNode = node;
    const container = document.getElementById('treemap-chart');
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const resetBtn = document.getElementById('btn-zoom-reset');
    resetBtn.disabled = node === tmRoot;

    // Calculate scale and translation to fit the node in the viewport
    const nodeWidth = node.x1 - node.x0;
    const nodeHeight = node.y1 - node.y0;
    const centerX = node.x0 + nodeWidth / 2;
    const centerY = node.y0 + nodeHeight / 2;

    const isZoomed = node !== tmRoot;

    // Scale to fit node with 10% padding
    let scale = Math.min(60, 0.9 / Math.max(nodeWidth / width, nodeHeight / height));
    let translate = [width / 2 - scale * centerX, height / 2 - scale * centerY];

    if (!isZoomed) {
        scale = 1.0;
        translate = [0, 0];
    }

    // Smooth camera glide
    tmSvg.transition().duration(750).call(
        tmZoomBehavior.transform,
        d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
    );

    // Sidebar stats update
    if (isZoomed) {
        updateTreemapSidebarStats(
            node.value,
            node.leaves().length,
            node.leaves().reduce((acc, l) => acc + (l.data.budget || 0), 0),
            node.data.name
        );
    } else {
        updateTreemapSidebarStats(
            tmRoot.value,
            tmRoot.leaves().length,
            tmRoot.leaves().reduce((acc, l) => acc + (l.data.budget || 0), 0),
            'Alle Ressorts'
        );
    }
}

function updateTreemapSidebarStats(focusValue, count, budget, name) {
    document.getElementById('tm-stat-ressort').textContent = name.length > 30 ? name.substring(0, 28) + '...' : name;
    document.getElementById('tm-stat-count').textContent = formatNumber(count);
    document.getElementById('tm-stat-budget').textContent = formatMoney(budget);
    
    // Total employees for focus
    if (!tmRoot) return;
    const staff = tmRoot.leaves()
        .filter(l => name === 'Alle Ressorts' || l.parent.data.name === name)
        .reduce((acc, l) => acc + (l.data.employees || 0), 0);
    document.getElementById('tm-stat-staff').textContent = formatNumber(staff);
}

// ---- Display Selection Card ----
function selectAuthority(auth) {
    const container = document.getElementById('treemap-selection-details');
    container.innerHTML = `
        <div class="selected-auth-title">${auth.name}</div>
        <div class="selected-auth-ressort">👔 ${auth.ressort}</div>
        <div class="selected-auth-badges">
            <span class="badge-item primary">${auth.typ}</span>
            ${auth.kuerzel ? `<span class="badge-item primary">${auth.kuerzel}</span>` : ''}
            <span class="badge-item accent">📍 ${auth.sitz}</span>
        </div>
        <div class="selected-auth-metrics">
            <div class="selected-auth-metric">
                <span>💰 Budget</span>
                <strong>${formatMoney(auth.budget)}</strong>
            </div>
            <div class="selected-auth-metric">
                <span>👥 Beschäftigte</span>
                <strong>${formatNumber(auth.employees)}</strong>
            </div>
        </div>
        ${auth.website ? `
            <a href="${auth.website}" target="_blank" class="btn-sm" style="display:inline-block; margin-top:14px; text-decoration:none; text-align:center;">
                🌐 Website besuchen &rarr;
            </a>
        ` : ''}
    `;
}

// External Search trigger for Treemap: highlights matching nodes
function searchHighlightTreemap(text) {
    if (!tmSvg) return;
    const cleanText = text.toLowerCase().trim();

    if (!cleanText) {
        tmContainerGroup.selectAll('.node rect').attr('opacity', 1);
        return;
    }

    tmContainerGroup.selectAll('.node').each(function(d) {
        const match = d.data.name.toLowerCase().includes(cleanText) ||
                      d.data.kuerzel.toLowerCase().includes(cleanText) ||
                      d.data.ressort.toLowerCase().includes(cleanText) ||
                      d.data.sitz.toLowerCase().includes(cleanText);

        d3.select(this).select('rect')
            .attr('opacity', match ? 1.0 : 0.25)
            .attr('stroke', match ? '#fff' : 'var(--bg-dark)')
            .attr('stroke-width', match ? '1.5px' : '1px');
    });
}
