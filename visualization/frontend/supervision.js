/* =======================================================
   ZeigDenStaat — Concentric Supervision Loop Visualizer (D3.js)
   ======================================================= */

let supSvg;
let supZoomBehavior;
let supContainerGroup;
let supSelectedMinistry = 'all'; // 'all' or ministry ID
let allRelationships = [];
let supActiveLinks = []; // Holds filtered links for interactive highlighting

// Color mapping for supervision relationship types
const REL_COLORS = {
    'UNTERSTELLT': '#6366f1',     // Indigo (Hierarchy)
    'FACHAUFSICHT': '#f97316',    // Orange (Technical)
    'RECHTSAUFSICHT': '#10b981',  // Emerald (Legal)
    'KOORDINIERT_MIT': '#ec4899'  // Pink (Coordination)
};

const REL_LABELS = {
    'UNTERSTELLT': 'Subunterstellung (Aufwärts)',
    'FACHAUFSICHT': 'Fachaufsicht (Abwärts)',
    'RECHTSAUFSICHT': 'Rechtsaufsicht (Abwärts)',
    'KOORDINIERT_MIT': 'Kooperation (Horizontal)'
};

function initSupervisionLayout() {
    const container = document.getElementById('supervision-chart');
    container.innerHTML = ''; // Clear previous

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    supSvg = d3.select('#supervision-chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    // Marker arrows for directed edges
    const defs = supSvg.append('defs');
    Object.entries(REL_COLORS).forEach(([type, color]) => {
        defs.append('marker')
            .attr('id', `arrow-${type}`)
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 18) // position offset from node center
            .attr('refY', -0.5)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-4L10,0L0,4')
            .attr('fill', color);
    });

    supContainerGroup = supSvg.append('g').attr('class', 'sup-zoom-container');

    // Pan & Zoom
    supZoomBehavior = d3.zoom()
        .scaleExtent([0.2, 10])
        .on('zoom', (event) => {
            supContainerGroup.attr('transform', event.transform);
        });

    supSvg.call(supZoomBehavior);

    // Bind UI dropdown
    const select = document.getElementById('sup-ministry-select');
    select.onchange = (e) => {
        supSelectedMinistry = e.target.value;
        renderSupervisionGraph();
    };
}

function populateMinistrySelect() {
    const select = document.getElementById('sup-ministry-select');
    select.innerHTML = '<option value="all">🌐 Gesamtübersicht (Kernkabinett)</option>';

    // Filter ministries from allAuthorities
    const ministries = allAuthorities
        .filter(a => a.typ === 'Ministerium')
        .sort((a, b) => a.name.localeCompare(b.name));

    ministries.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = m.kuerzel ? `${m.kuerzel} - ${m.name}` : m.name;
        select.appendChild(opt);
    });
}

function renderSupervisionGraph() {
    if (!supSvg) initSupervisionLayout();

    const container = document.getElementById('supervision-chart');
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    const centerX = width / 2;
    const centerY = height / 2;

    supContainerGroup.selectAll('*').remove();

    // Reset zoom
    supSvg.call(supZoomBehavior.transform, d3.zoomIdentity);

    let nodes = [];
    let links = [];
    let r1Radius = 180;
    let r2Radius = 300;

    if (supSelectedMinistry === 'all') {
        // --- 1. GLOBAL CORE OVERVIEW MODE ---
        // Render only the 16 Ministries and Verfassungsorgans and relationships between them
        const coreNodes = allAuthorities.filter(a => a.typ === 'Ministerium' || a.typ === 'Verfassungsorgan');
        const coreIds = new Set(coreNodes.map(n => n.id));

        nodes = coreNodes.map(n => ({
            id: n.id,
            name: n.name,
            kuerzel: n.kuerzel || n.name.substring(0, 4),
            typ: n.typ,
            budget: n.budget,
            employees: n.employees,
            ressort: n.ressort,
            isCore: true
        }));

        // Links only between core nodes
        allRelationships.forEach(r => {
            if (coreIds.has(r.from_id) && coreIds.has(r.to_id)) {
                links.push({
                    source: r.from_id,
                    target: r.to_id,
                    type: r.type
                });
            }
        });

        // Arrange core nodes in a circle
        const radius = Math.min(width, height) * 0.38;
        const angleStep = (2 * Math.PI) / nodes.length;
        nodes.forEach((n, idx) => {
            n.x = centerX + radius * Math.cos(idx * angleStep);
            n.y = centerY + radius * Math.sin(idx * angleStep);
        });

        updateSupervisionSidebarStats('Global', nodes.length, links.length);

    } else {
        // --- 2. FOCUS MINISTRY MODE (Radial concentric rings with Collapsing) ---
        const focusId = supSelectedMinistry;
        const focusNode = allAuthorities.find(a => a.id === focusId);
        if (!focusNode) return;

        // Common repetitive prefixes to collapse when count > 3
        const COLLAPSE_PREFIXES = [
            "Hauptzollamt",
            "Wasserstraßen- und Schifffahrtsamt",
            "Prüfungsamt",
            "Zollfahndungsamt",
            "Bundespolizeidirektion",
            "Bundeswehr-Dienstleistungszentrum",
            "Karrierecenter der Bundeswehr",
            "Bundeswehrfachschule",
            "Jobcenter",
            "Agentur für Arbeit",
            "Familienkasse",
            "Fraunhofer-Institut",
            "Leibniz-Institut",
            "Bundesanstalt Technisches Hilfswerk",
            "Deutsche Bundesbank -",
            "Deutsche Bundesbank",
            "Max-Planck-Institut",
            "Helmholtz-Zentrum"
        ];

        // Find all direct subordinates or supervised nodes
        const connectedNodeIds = new Set();
        connectedNodeIds.add(focusId);

        const focusRels = allRelationships.filter(r => r.from_id === focusId || r.to_id === focusId);
        focusRels.forEach(r => {
            connectedNodeIds.add(r.from_id);
            connectedNodeIds.add(r.to_id);
        });

        const relatedAuthorities = allAuthorities.filter(a => connectedNodeIds.has(a.id));

        // Group repetitive nodes
        const groupedNodes = {};
        const individualNodes = [];

        relatedAuthorities.forEach(a => {
            if (a.id === focusId) return; // skip center
            
            let matchedPrefix = null;
            for (const prefix of COLLAPSE_PREFIXES) {
                if (a.name.startsWith(prefix)) {
                    matchedPrefix = prefix;
                    break;
                }
            }

            if (matchedPrefix) {
                if (!groupedNodes[matchedPrefix]) {
                    groupedNodes[matchedPrefix] = [];
                }
                groupedNodes[matchedPrefix].push(a);
            } else {
                individualNodes.push(a);
            }
        });

        // Collapse groups if > 3 nodes, otherwise keep them individual
        const collapsedGroups = [];
        Object.entries(groupedNodes).forEach(([prefix, list]) => {
            if (list.length > 3) {
                let totalBudget = 0;
                let totalEmployees = 0;
                list.forEach(item => {
                    if (item.budget) totalBudget += item.budget;
                    if (item.employees) totalEmployees += item.employees;
                });

                let short = prefix.substring(0, 3).toUpperCase();
                if (prefix === "Hauptzollamt") short = "HZA";
                else if (prefix === "Wasserstraßen- und Schifffahrtsamt") short = "WSA";
                else if (prefix === "Zollfahndungsamt") short = "ZFA";
                else if (prefix === "Bundeswehr-Dienstleistungszentrum") short = "BwDLZ";
                else if (prefix === "Jobcenter") short = "JC";
                else if (prefix === "Agentur für Arbeit") short = "AA";
                else if (prefix === "Familienkasse") short = "FK";
                else if (prefix === "Fraunhofer-Institut") short = "FhG";
                else if (prefix === "Leibniz-Institut") short = "WGL";
                else if (prefix === "Bundesanstalt Technisches Hilfswerk") short = "THW";
                else if (prefix === "Deutsche Bundesbank" || prefix === "Deutsche Bundesbank -") short = "BBk";
                else if (prefix === "Bundespolizeidirektion") short = "BPOLD";
                else if (prefix === "Karrierecenter der Bundeswehr") short = "KCBw";
                else if (prefix === "Bundeswehrfachschule") short = "BwFS";
                else if (prefix === "Max-Planck-Institut") short = "MPI";
                else if (prefix === "Helmholtz-Zentrum") short = "HZ";

                collapsedGroups.push({
                    id: `group-${prefix.replace(/\s+/g, '_')}`,
                    name: `${list.length}x ${prefix}`,
                    kuerzel: `${list.length}x`,
                    typ: "Sammelgruppe",
                    budget: totalBudget,
                    employees: totalEmployees,
                    ressort: focusNode.name,
                    isGroup: true,
                    members: list,
                    displayKuerzel: short
                });
            } else {
                individualNodes.push(...list);
            }
        });

        // Split into concentric rings
        const ring1 = [];
        const ring2 = [];

        function checkSubordinated(nodeId) {
            return allRelationships.some(r => r.from_id === nodeId && r.to_id === focusId && r.type === 'UNTERSTELLT');
        }

        individualNodes.forEach(a => {
            if (checkSubordinated(a.id)) {
                ring1.push(a);
            } else {
                ring2.push(a);
            }
        });

        collapsedGroups.forEach(g => {
            // Group is in Ring 1 if any member is subordinated
            const isSub = g.members.some(m => checkSubordinated(m.id));
            if (isSub) {
                ring1.push(g);
            } else {
                ring2.push(g);
            }
        });

        // Add focus center node
        nodes.push({
            id: focusNode.id,
            name: focusNode.name,
            kuerzel: focusNode.kuerzel || focusNode.name.substring(0, 4),
            typ: focusNode.typ,
            budget: focusNode.budget,
            employees: focusNode.employees,
            ressort: focusNode.ressort,
            x: centerX,
            y: centerY,
            ring: 0
        });

        // Layout Ring 1 (Subordinates)
        ring1.sort((a, b) => (b.budget || 0) - (a.budget || 0));
        const r1Length = ring1.length;
        r1Radius = 180;
        if (r1Length > 10) {
            r1Radius = Math.max(180, r1Length * 6.5);
        }
        const r1AngleStep = (2 * Math.PI) / (r1Length || 1);
        ring1.forEach((a, idx) => {
            const isGroup = a.isGroup === true;
            nodes.push({
                id: a.id,
                name: a.name,
                kuerzel: a.kuerzel || a.name.substring(0, 3),
                typ: a.typ,
                budget: a.budget,
                employees: a.employees,
                ressort: a.ressort,
                isGroup: isGroup,
                members: a.members,
                displayKuerzel: a.displayKuerzel,
                x: centerX + r1Radius * Math.cos(idx * r1AngleStep),
                y: centerY + r1Radius * Math.sin(idx * r1AngleStep),
                angle: idx * r1AngleStep,
                ring: 1
            });
        });

        // Layout Ring 2 (Supervised or Coordinated)
        ring2.sort((a, b) => (b.budget || 0) - (a.budget || 0));
        const r2Length = ring2.length;
        r2Radius = r1Radius + 120;
        if (r2Length > 10) {
            r2Radius = r1Radius + Math.max(120, r2Length * 6.5);
        }
        const r2AngleStep = (2 * Math.PI) / (r2Length || 1);
        ring2.forEach((a, idx) => {
            const isGroup = a.isGroup === true;
            nodes.push({
                id: a.id,
                name: a.name,
                kuerzel: a.kuerzel || a.name.substring(0, 3),
                typ: a.typ,
                budget: a.budget,
                employees: a.employees,
                ressort: a.ressort,
                isGroup: isGroup,
                members: a.members,
                displayKuerzel: a.displayKuerzel,
                x: centerX + r2Radius * Math.cos(idx * r2AngleStep),
                y: centerY + r2Radius * Math.sin(idx * r2AngleStep),
                angle: idx * r2AngleStep,
                ring: 2
            });
        });

        // Build links with group mappings
        const linkKeys = new Set();
        focusRels.forEach(r => {
            let fromId = r.from_id;
            let toId = r.to_id;

            collapsedGroups.forEach(g => {
                if (g.members.some(m => m.id === fromId)) {
                    fromId = g.id;
                }
                if (g.members.some(m => m.id === toId)) {
                    toId = g.id;
                }
            });

            // Avoid duplicate links of same type between same nodes
            const linkKey = `${fromId}-${toId}-${r.type}`;
            if (!linkKeys.has(linkKey)) {
                linkKeys.add(linkKey);
                links.push({
                    source: fromId,
                    target: toId,
                    type: r.type
                });
            }
        });

        updateSupervisionSidebarStats(focusNode.kuerzel || focusNode.name, nodes.length - 1, links.length);
    }

    // Map source and target IDs to node object references for D3 lines
    const nodeMap = {};
    nodes.forEach(n => { nodeMap[n.id] = n; });
    links.forEach(l => {
        l.source = nodeMap[l.source];
        l.target = nodeMap[l.target];
    });
    supActiveLinks = links;

    // Detect loops (multiple links between same node pair) to curve arcs differently
    const linkPairs = {};
    links.forEach(l => {
        if (!l.source || !l.target) return;
        const key = [l.source.id, l.target.id].sort().join('-');
        linkPairs[key] = (linkPairs[key] || 0) + 1;
        l.pairCount = linkPairs[key];
        l.isLoop = linkPairs[key] > 1 || allRelationships.some(r => r.from_id === l.target.id && r.to_id === l.source.id);
    });

    // Render Concentric Background Rings
    const backgroundRingsGroup = supContainerGroup.append('g').attr('class', 'bg-rings');
    
    if (supSelectedMinistry === 'all') {
        backgroundRingsGroup.append('circle')
            .attr('cx', centerX)
            .attr('cy', centerY)
            .attr('r', Math.min(width, height) * 0.38)
            .attr('fill', 'none')
            .attr('stroke', 'rgba(255, 255, 255, 0.04)')
            .attr('stroke-width', '1.5px')
            .attr('stroke-dasharray', '4,4');
    } else {
        // Ring 1 Guide
        backgroundRingsGroup.append('circle')
            .attr('cx', centerX)
            .attr('cy', centerY)
            .attr('r', r1Radius)
            .attr('fill', 'none')
            .attr('stroke', 'rgba(99, 102, 241, 0.08)')
            .attr('stroke-width', '1.5px')
            .attr('stroke-dasharray', '4,4');

        // Ring 2 Guide
        backgroundRingsGroup.append('circle')
            .attr('cx', centerX)
            .attr('cy', centerY)
            .attr('r', r2Radius)
            .attr('fill', 'none')
            .attr('stroke', 'rgba(255, 255, 255, 0.04)')
            .attr('stroke-width', '1.5px')
            .attr('stroke-dasharray', '4,4');
    }

    // Render Edges (Links)
    const edgeGroup = supContainerGroup.append('g').attr('class', 'edges');
    
    const edges = edgeGroup.selectAll('.edge-path')
        .data(links.filter(l => l.source && l.target))
        .enter()
        .append('path')
        .attr('class', 'edge-path')
        .attr('d', calculateArcPath)
        .attr('fill', 'none')
        .attr('stroke', l => REL_COLORS[l.type])
        .attr('stroke-width', '1.8px')
        .attr('opacity', 0.35)
        .attr('marker-end', l => `url(#arrow-${l.type})`)
        .on('mouseover', showEdgeTooltip)
        .on('mouseout', hideEdgeTooltip);

    // Render Nodes (Circles)
    const nodeGroup = supContainerGroup.append('g').attr('class', 'nodes');

    const circles = nodeGroup.selectAll('.sup-node')
        .data(nodes)
        .enter()
        .append('g')
        .attr('class', 'sup-node')
        .attr('transform', d => `translate(${d.x},${d.y})`);

    // Draw background circle glow for central node or large ministries
    circles.filter(d => d.ring === 0 || d.isCore)
        .append('circle')
        .attr('r', d => d.ring === 0 ? 38 : 28)
        .attr('fill', 'none')
        .attr('stroke', d => d.ring === 0 ? 'var(--accent)' : 'var(--primary)')
        .attr('stroke-width', '2px')
        .attr('opacity', 0.25)
        .style('filter', 'drop-shadow(0 0 8px var(--primary))');

    circles.append('circle')
        .attr('r', d => {
            if (d.ring === 0) return 30; // focus center
            if (d.isCore) return 20; // ministry in core list
            return 12; // subordinate leaf
        })
        .attr('fill', d => {
            if (d.ring === 0) return 'var(--accent)';
            if (d.isCore) return 'var(--primary)';
            return 'rgba(255, 255, 255, 0.08)';
        })
        .attr('stroke', d => {
            if (d.ring === 0) return '#fff';
            if (d.isCore) return '#fff';
            return 'var(--text-muted)';
        })
        .attr('stroke-width', d => d.ring === 0 || d.isCore ? '2px' : '1px')
        .on('mouseover', showNodeTooltip)
        .on('mousemove', moveTooltip)
        .on('mouseout', hideNodeTooltip)
        .on('click', (event, d) => {
            selectSupervisionNode(d);
            // If clicking a ministry in core mode, automatically zoom/focus into it!
            if (d.typ === 'Ministerium' && supSelectedMinistry === 'all') {
                document.getElementById('sup-ministry-select').value = d.id;
                supSelectedMinistry = d.id;
                renderSupervisionGraph();
            }
            event.stopPropagation();
        });

    // Add labels inside nodes
    circles.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '.3em')
        .attr('fill', '#fff')
        .attr('font-size', d => d.ring === 0 || d.isCore ? '10px' : '7px')
        .attr('font-weight', '700')
        .attr('pointer-events', 'none')
        .text(d => d.kuerzel);

    // Add labels radially around leaf nodes to prevent overlapping text
    circles.filter(d => d.ring !== 0 && !d.isCore)
        .append('text')
        .attr('text-anchor', d => {
            const angleDeg = ((d.angle || 0) * 180) / Math.PI;
            return (angleDeg > 90 && angleDeg < 270) ? 'end' : 'start';
        })
        .attr('transform', d => {
            const angleDeg = ((d.angle || 0) * 180) / Math.PI;
            const rotate = (angleDeg > 90 && angleDeg < 270) ? angleDeg + 180 : angleDeg;
            const xOffset = (angleDeg > 90 && angleDeg < 270) ? -18 : 18;
            return `rotate(${rotate}) translate(${xOffset}, 0)`;
        })
        .attr('dy', '.3em')
        .attr('fill', 'var(--text-muted)')
        .attr('font-size', '8.5px')
        .attr('font-weight', '500')
        .attr('pointer-events', 'none')
        .text(d => d.name.length > 25 ? d.name.substring(0, 22) + '...' : d.name);
}

// Curve directed paths to show loop arrows clearly
function calculateArcPath(d) {
    const x1 = d.source.x, y1 = d.source.y;
    const x2 = d.target.x, y2 = d.target.y;
    
    if (x1 === x2 && y1 === y2) {
        // Self-loop (just in case)
        return `M${x1},${y1} A30,30 0 1,1 ${x1 + 1},${y1}`;
    }

    const dx = x2 - x1, dy = y2 - y1;
    const dr = Math.sqrt(dx * dx + dy * dy);
    
    // Sweep curves based on loop detection
    // If loop exists, curve left/right respectively to separate arcs
    const sweep = d.isLoop ? (d.pairCount === 1 ? 1 : 0) : 1;
    const curveFactor = d.isLoop ? 1.2 : 2.5; // smaller factor = tighter curve
    
    return `M${x1},${y1}A${dr * curveFactor},${dr * curveFactor} 0 0,${sweep} ${x2},${y2}`;
}

// ---- Hover edge tooltips ----
function showEdgeTooltip(event, d) {
    d3.select(this)
        .attr('stroke-width', '3.5px')
        .attr('opacity', 1.0);

    tooltipEl.innerHTML = `
        <h4 style="color:${REL_COLORS[d.type]};">${REL_LABELS[d.type]}</h4>
        <p><strong>Von:</strong> ${d.source.name} (${d.source.kuerzel})</p>
        <p><strong>Nach:</strong> ${d.target.name} (${d.target.kuerzel})</p>
        <p style="margin-top: 4px; font-size:11px; color:var(--text-dimmed);">Definiert die administrative Aufsichtslinie.</p>
    `;
    tooltipEl.classList.remove('hidden');
    moveTooltip(event);
}

function hideEdgeTooltip(event, d) {
    d3.select(this)
        .attr('stroke-width', '1.8px')
        .attr('opacity', 0.65);
    tooltipEl.classList.add('hidden');
}

// ---- Hover node tooltips ----
function showNodeTooltip(event, d) {
    d3.select(this)
        .attr('stroke', '#fff')
        .attr('stroke-width', '2px');

    if (d.isGroup) {
        const firstFew = d.members.slice(0, 5).map(m => `<li>${m.name}</li>`).join('');
        const remaining = d.members.length - 5;
        const remainingStr = remaining > 0 ? `<li>... und ${remaining} weitere</li>` : '';
        
        tooltipEl.innerHTML = `
            <h4 style="color:var(--accent);">${d.name}</h4>
            <p><strong>Typ:</strong> Sammelgruppe</p>
            <p><strong>Gesamtbudget:</strong> ${formatMoney(d.budget)}</p>
            <p><strong>Gesamtbeschäftigte:</strong> ${formatNumber(d.employees)}</p>
            <div style="margin-top:8px; border-top:1px solid rgba(255,255,255,0.05); padding-top:6px;">
                <strong style="font-size:10px; color:var(--text-muted);">Enthaltene Behörden:</strong>
                <ul style="margin-left:14px; font-size:10px; color:var(--text-muted); margin-top:2px; line-height:1.3;">
                    ${firstFew}
                    ${remainingStr}
                </ul>
            </div>
        `;
    } else {
        tooltipEl.innerHTML = `
            <h4>${d.name}</h4>
            <p><strong>Typ:</strong> ${d.typ}</p>
            <p><strong>Haushalt:</strong> ${formatMoney(d.budget)}</p>
            <p><strong>Beschäftigte:</strong> ${formatNumber(d.employees)}</p>
        `;
    }
    tooltipEl.classList.remove('hidden');

    // Interactive highlighting: dim unrelated nodes and edges
    const connectedIds = new Set();
    connectedIds.add(d.id);

    supActiveLinks.forEach(l => {
        if (l.source && l.target) {
            if (l.source.id === d.id) {
                connectedIds.add(l.target.id);
            } else if (l.target.id === d.id) {
                connectedIds.add(l.source.id);
            }
        }
    });

    // Dim edges
    supContainerGroup.selectAll('.edge-path')
        .transition().duration(150)
        .attr('opacity', l => (l.source && l.target && (l.source.id === d.id || l.target.id === d.id)) ? 0.95 : 0.05)
        .attr('stroke-width', l => (l.source && l.target && (l.source.id === d.id || l.target.id === d.id)) ? '3px' : '1px');

    // Dim nodes (entire groups)
    supContainerGroup.selectAll('.sup-node')
        .transition().duration(150)
        .attr('opacity', n => connectedIds.has(n.id) ? 1.0 : 0.15);
}

function hideNodeTooltip(event, d) {
    d3.select(this)
        .attr('stroke', d.ring === 0 || d.isCore ? '#fff' : 'var(--text-muted)')
        .attr('stroke-width', d.ring === 0 || d.isCore ? '2px' : '1px');
    tooltipEl.classList.add('hidden');

    // Restore opacities (or respect active search)
    const searchVal = document.getElementById('search-input').value;
    if (searchVal && searchVal.trim() !== '') {
        searchHighlightSupervision(searchVal);
    } else {
        supContainerGroup.selectAll('.edge-path')
            .transition().duration(150)
            .attr('opacity', 0.35)
            .attr('stroke-width', '1.8px');

        supContainerGroup.selectAll('.sup-node')
            .transition().duration(150)
            .attr('opacity', 1.0);
    }
}

// ---- Sidebar Details Binding ----
function selectSupervisionNode(node) {
    const container = document.getElementById('treemap-selection-details');
    
    if (node.isGroup) {
        let listHtml = '';
        const sortedMembers = [...node.members].sort((a, b) => a.name.localeCompare(b.name));
        
        sortedMembers.forEach(m => {
            listHtml += `
                <li class="authority-card" style="margin-bottom:6px; padding:10px;">
                    <div class="auth-name-row" style="margin-bottom:2px;">
                        <span class="auth-name" style="font-size:13px;">${m.name}</span>
                        ${m.kuerzel ? `<span class="auth-badge" style="font-size:9px; padding:1px 4px;">${m.kuerzel}</span>` : ''}
                    </div>
                    <div class="auth-meta-row" style="font-size:11px;">
                        <div>📍 Sitz: ${m.sitz || 'Unbekannt'}</div>
                        <div class="auth-stats" style="margin-top:2px; font-size:10px; display:flex; gap:8px;">
                            <span>👥 Besc.: <strong class="auth-stat-value">${formatNumber(m.employees)}</strong></span>
                            <span>💰 Haush.: <strong class="auth-stat-value">${formatMoney(m.budget)}</strong></span>
                        </div>
                    </div>
                </li>
            `;
        });

        container.innerHTML = `
            <div class="selected-auth-title">${node.name}</div>
            <div class="selected-auth-ressort">👔 Sammelgruppe (${node.members.length} Behörden)</div>
            <div class="selected-auth-badges">
                <span class="badge-item primary">Typ: ${node.members[0].typ}</span>
                <span class="badge-item accent">Kürzel: ${node.displayKuerzel}</span>
            </div>
            <div class="selected-auth-metrics" style="margin-bottom:14px;">
                <div class="selected-auth-metric">
                    <span>💰 Gesamtbudget</span>
                    <strong>${formatMoney(node.budget)}</strong>
                </div>
                <div class="selected-auth-metric">
                    <span>👥 Gesamtbeschäftigte</span>
                    <strong>${formatNumber(node.employees)}</strong>
                </div>
            </div>
            <div class="detail-list-wrapper" style="padding:0; max-height:220px; overflow-y:auto; border-top: 1px solid rgba(255,255,255,0.05); padding-top:12px;">
                <h3 style="font-size:11px; margin-bottom:8px; color:var(--text-muted);">Gruppenmitglieder</h3>
                <ul class="authorities-list" style="gap:4px; list-style:none;">
                    ${listHtml}
                </ul>
            </div>
        `;
        return;
    }
    
    // Find full authority record
    const auth = allAuthorities.find(a => a.id === node.id);
    if (!auth) return;

    container.innerHTML = `
        <div class="selected-auth-title">${auth.name}</div>
        <div class="selected-auth-ressort">👔 ${auth.ressort}</div>
        <div class="selected-auth-badges">
            <span class="badge-item primary">${auth.typ}</span>
            ${auth.kuerzel ? `<span class="badge-item primary">${auth.kuerzel}</span>` : ''}
            <span class="badge-item accent">📍 ${auth.sitz || 'Unbekannt'}</span>
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

function updateSupervisionSidebarStats(focusName, nodesCount, linksCount) {
    document.getElementById('sup-stat-focus').textContent = focusName.length > 22 ? focusName.substring(0, 20) + '...' : focusName;
    document.getElementById('sup-stat-nodes').textContent = formatNumber(nodesCount);
    document.getElementById('sup-stat-links').textContent = formatNumber(linksCount);
}

// External Search trigger for Supervision: dims non-matching nodes
function searchHighlightSupervision(text) {
    if (!supSvg) return;
    const cleanText = text.toLowerCase().trim();

    if (!cleanText) {
        supContainerGroup.selectAll('.sup-node').attr('opacity', 1.0);
        supContainerGroup.selectAll('.edge-path').attr('opacity', 0.35);
        return;
    }

    supContainerGroup.selectAll('.sup-node').each(function(d) {
        const match = d.name.toLowerCase().includes(cleanText) ||
                      d.kuerzel.toLowerCase().includes(cleanText) ||
                      d.typ.toLowerCase().includes(cleanText) ||
                      (d.ressort && d.ressort.toLowerCase().includes(cleanText));

        d3.select(this).attr('opacity', match ? 1.0 : 0.15);
    });

    supContainerGroup.selectAll('.edge-path').each(function(d) {
        const sourceMatch = d.source.name.toLowerCase().includes(cleanText) || d.source.kuerzel.toLowerCase().includes(cleanText);
        const targetMatch = d.target.name.toLowerCase().includes(cleanText) || d.target.kuerzel.toLowerCase().includes(cleanText);
        d3.select(this).attr('opacity', sourceMatch && targetMatch ? 0.95 : 0.05);
    });
}
