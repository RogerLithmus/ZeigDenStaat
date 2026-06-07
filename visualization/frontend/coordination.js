/* =======================================================
   ZeigDenStaat — Horizontal Coordination Constellations (D3.js)
   ======================================================= */

let coordSvg;
let coordZoomBehavior;
let coordContainerGroup;
let coordActiveLinks = [];

function initCoordinationLayout() {
    const container = document.getElementById('coordination-chart');
    container.innerHTML = ''; // Clear previous

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    coordSvg = d3.select('#coordination-chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    coordContainerGroup = coordSvg.append('g').attr('class', 'coord-zoom-container');

    // Pan & Zoom
    coordZoomBehavior = d3.zoom()
        .scaleExtent([0.1, 10])
        .on('zoom', (event) => {
            coordContainerGroup.attr('transform', event.transform);
        });

    coordSvg.call(coordZoomBehavior);
}

function renderCoordinationGraph() {
    if (!coordSvg) initCoordinationLayout();

    const container = document.getElementById('coordination-chart');
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    const centerX = width / 2;
    const centerY = height / 2;

    coordContainerGroup.selectAll('*').remove();

    // Reset zoom
    coordSvg.call(coordZoomBehavior.transform, d3.zoomIdentity);

    // Group authorities by ressort
    const ressortGroups = {};
    allAuthorities.forEach(a => {
        if (!ressortGroups[a.ressort]) {
            ressortGroups[a.ressort] = [];
        }
        ressortGroups[a.ressort].push(a);
    });

    // Unique list of ressorts
    const ressortsList = Object.keys(ressortGroups).sort();

    // Position cluster centers in a circle to spread them out
    const clusterRadius = 450;
    const angleStep = (2 * Math.PI) / (ressortsList.length || 1);
    const clusterCenters = {};
    ressortsList.forEach((r, idx) => {
        clusterCenters[r] = {
            x: centerX + clusterRadius * Math.cos(idx * angleStep),
            y: centerY + clusterRadius * Math.sin(idx * angleStep),
            name: r
        };
    });

    // Sample authorities to avoid DOM overload, keeping all coordinator nodes
    const filteredAuthorities = [];
    Object.entries(ressortGroups).forEach(([ressort, list]) => {
        list.sort((a, b) => {
            const aCoord = allRelationships.some(r => r.type === 'KOORDINIERT_MIT' && (r.from_id === a.id || r.to_id === a.id));
            const bCoord = allRelationships.some(r => r.type === 'KOORDINIERT_MIT' && (r.from_id === b.id || r.to_id === b.id));
            if (aCoord && !bCoord) return -1;
            if (!aCoord && bCoord) return 1;
            return (b.budget || 0) - (a.budget || 0);
        });

        // Keep all coordinators + up to 10 leaf nodes per ressort
        let count = 0;
        list.forEach(a => {
            const isCoord = allRelationships.some(r => r.type === 'KOORDINIERT_MIT' && (r.from_id === a.id || r.to_id === a.id));
            if (isCoord || count < 10) {
                filteredAuthorities.push(a);
                if (!isCoord) count++;
            }
        });
    });

    // Create D3 nodes
    const nodes = filteredAuthorities.map(a => {
        const isCoordinator = allRelationships.some(r => 
            r.type === 'KOORDINIERT_MIT' && (r.from_id === a.id || r.to_id === a.id)
        );
        const center = clusterCenters[a.ressort] || { x: centerX, y: centerY };
        return {
            id: a.id,
            name: a.name,
            kuerzel: a.kuerzel || a.name.substring(0, 3),
            typ: a.typ,
            budget: a.budget,
            employees: a.employees,
            ressort: a.ressort,
            isCoordinator: isCoordinator,
            x: center.x + (Math.random() - 0.5) * 60,
            y: center.y + (Math.random() - 0.5) * 60
        };
    });

    const nodeMap = {};
    nodes.forEach(n => { nodeMap[n.id] = n; });

    // Filter unique coordination links
    const links = [];
    const seen = new Set();
    allRelationships.forEach(r => {
        if (r.type === 'KOORDINIERT_MIT') {
            const pair = [r.from_id, r.to_id].sort().join('-');
            if (!seen.has(pair)) {
                seen.add(pair);
                const sourceNode = nodeMap[r.from_id];
                const targetNode = nodeMap[r.to_id];
                if (sourceNode && targetNode) {
                    links.push({
                        source: sourceNode,
                        target: targetNode,
                        type: r.type
                    });
                }
            }
        }
    });
    coordActiveLinks = links;

    // Render Background Constellation Guides
    const backgroundRingsGroup = coordContainerGroup.append('g').attr('class', 'bg-constellations');
    
    // Draw ressort center boundary circles and labels
    const ressortLabels = backgroundRingsGroup.selectAll('.ressort-constellation')
        .data(Object.values(clusterCenters))
        .enter()
        .append('g')
        .attr('class', 'ressort-constellation')
        .attr('transform', d => `translate(${d.x},${d.y})`);

    ressortLabels.append('circle')
        .attr('r', 80)
        .attr('fill', 'none')
        .attr('stroke', 'rgba(255, 255, 255, 0.02)')
        .attr('stroke-width', '1.5px')
        .attr('stroke-dasharray', '3,3');

    ressortLabels.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 5)
        .attr('fill', 'rgba(255, 255, 255, 0.035)')
        .attr('font-size', '16px')
        .attr('font-weight', '800')
        .attr('pointer-events', 'none')
        .text(d => d.name.length > 15 ? d.name.substring(0, 12) + '...' : d.name);

    // Render Edges (Links)
    const edgeGroup = coordContainerGroup.append('g').attr('class', 'edges');
    
    const edges = edgeGroup.selectAll('.coord-edge')
        .data(links)
        .enter()
        .append('line')
        .attr('class', 'coord-edge')
        .attr('stroke', '#ec4899') // Coordination Neon Pink
        .attr('stroke-width', '2px')
        .attr('stroke-dasharray', '5,5')
        .attr('opacity', 0.8)
        .style('filter', 'drop-shadow(0 0 5px rgba(236,72,153,0.5))');

    // Render Nodes
    const nodeGroup = coordContainerGroup.append('g').attr('class', 'nodes');

    const circles = nodeGroup.selectAll('.coord-node')
        .data(nodes)
        .enter()
        .append('g')
        .attr('class', 'coord-node')
        .attr('transform', d => `translate(${d.x},${d.y})`);

    // Draw leaf nodes (small stars)
    circles.filter(d => !d.isCoordinator)
        .append('circle')
        .attr('r', 3)
        .attr('fill', 'rgba(255, 255, 255, 0.35)')
        .attr('stroke', 'rgba(99, 102, 241, 0.15)')
        .attr('stroke-width', '1px')
        .on('mouseover', showCoordNodeTooltip)
        .on('mousemove', moveTooltip)
        .on('mouseout', hideCoordNodeTooltip)
        .on('click', (event, d) => {
            selectCoordinationNode(d);
            event.stopPropagation();
        });

    // Draw coordinator nodes (large glowing stars)
    const coordinators = circles.filter(d => d.isCoordinator);

    coordinators.append('circle')
        .attr('r', 13)
        .attr('fill', '#ec4899')
        .attr('stroke', '#fff')
        .attr('stroke-width', '2px')
        .style('filter', 'drop-shadow(0 0 8px #ec4899)')
        .on('mouseover', showCoordNodeTooltip)
        .on('mousemove', moveTooltip)
        .on('mouseout', hideCoordNodeTooltip)
        .on('click', (event, d) => {
            selectCoordinationNode(d);
            event.stopPropagation();
        });

    // Abbreviation text in coordinator node centers
    coordinators.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '.3em')
        .attr('fill', '#fff')
        .attr('font-size', '8px')
        .attr('font-weight', '700')
        .attr('pointer-events', 'none')
        .text(d => d.kuerzel);

    // Name text labels under coordinator nodes
    coordinators.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 25)
        .attr('fill', 'var(--text-main)')
        .attr('font-size', '9px')
        .attr('font-weight', '600')
        .attr('pointer-events', 'none')
        .text(d => d.name.length > 20 ? d.name.substring(0, 18) + '...' : d.name);

    // Setup Force Simulation
    const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(140).strength(0.25))
        .force('charge', d3.forceManyBody().strength(-10))
        .force('x', d3.forceX(d => {
            const center = clusterCenters[d.ressort] || { x: centerX, y: centerY };
            return center.x;
        }).strength(0.15))
        .force('y', d3.forceY(d => {
            const center = clusterCenters[d.ressort] || { x: centerX, y: centerY };
            return center.y;
        }).strength(0.15))
        .force('collide', d3.forceCollide().radius(d => d.isCoordinator ? 22 : 6).iterations(2))
        .alphaDecay(0.015);

    // Add dragging support
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.2).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    const drag = d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);

    circles.call(drag);

    // Tick layout updates
    simulation.on('tick', () => {
        edges
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        circles
            .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    updateCoordinationSidebarStats(nodes, links);
}

// ---- Hover node tooltips ----
function showCoordNodeTooltip(event, d) {
    d3.select(this)
        .attr('stroke', '#fff')
        .attr('stroke-width', d.isCoordinator ? '2px' : '1.5px');

    tooltipEl.innerHTML = `
        <h4>${d.name}</h4>
        <p><strong>Ressort:</strong> ${d.ressort}</p>
        <p><strong>Typ:</strong> ${d.typ}</p>
        <p style="margin-top: 6px; color:${d.isCoordinator ? '#ec4899' : 'var(--text-muted)'}; font-weight:600;">
            ${d.isCoordinator ? '🤝 Aktiv koordinierende Behörde' : 'Inaktive Behörde'}
        </p>
    `;
    tooltipEl.classList.remove('hidden');

    // Highlight links/nodes
    const connectedIds = new Set();
    connectedIds.add(d.id);

    coordActiveLinks.forEach(l => {
        if (l.source && l.target) {
            if (l.source.id === d.id) {
                connectedIds.add(l.target.id);
            } else if (l.target.id === d.id) {
                connectedIds.add(l.source.id);
            }
        }
    });

    // Dim edges
    coordContainerGroup.selectAll('.coord-edge')
        .transition().duration(150)
        .attr('opacity', l => (l.source && l.target && (l.source.id === d.id || l.target.id === d.id)) ? 1.0 : 0.05)
        .attr('stroke-width', l => (l.source && l.target && (l.source.id === d.id || l.target.id === d.id)) ? '3.5px' : '1px');

    // Dim nodes
    coordContainerGroup.selectAll('.coord-node')
        .transition().duration(150)
        .attr('opacity', n => connectedIds.has(n.id) ? 1.0 : 0.15);
}

function hideCoordNodeTooltip(event, d) {
    d3.select(this)
        .attr('stroke', d.isCoordinator ? '#fff' : 'rgba(99, 102, 241, 0.15)')
        .attr('stroke-width', d.isCoordinator ? '2px' : '1px');
    tooltipEl.classList.add('hidden');

    // Restore opacities (respect search if active)
    const searchVal = document.getElementById('search-input').value;
    if (searchVal && searchVal.trim() !== '') {
        searchHighlightCoordination(searchVal);
    } else {
        coordContainerGroup.selectAll('.coord-edge')
            .transition().duration(150)
            .attr('opacity', 0.8)
            .attr('stroke-width', '2px');

        coordContainerGroup.selectAll('.coord-node')
            .transition().duration(150)
            .attr('opacity', 1.0);
    }
}

// ---- Sidebar detail view binding ----
function selectCoordinationNode(node) {
    const container = document.getElementById('treemap-selection-details');
    
    const auth = allAuthorities.find(a => a.id === node.id);
    if (!auth) return;

    container.innerHTML = `
        <div class="selected-auth-title">${auth.name}</div>
        <div class="selected-auth-ressort">👔 ${auth.ressort}</div>
        <div class="selected-auth-badges">
            <span class="badge-item primary">${auth.typ}</span>
            ${auth.kuerzel ? `<span class="badge-item primary">${auth.kuerzel}</span>` : ''}
            <span class="badge-item accent">📍 ${auth.sitz || 'Unbekannt'}</span>
            ${node.isCoordinator ? `<span class="badge-item accent" style="background:rgba(236,72,153,0.15); color:#ec4899;">🤝 Kooperation</span>` : ''}
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

// ---- Sidebar Stats updates ----
function updateCoordinationSidebarStats(nodes, links) {
    const totalBridges = links.length;
    const coordinatorsCount = nodes.filter(n => n.isCoordinator).length;

    // Find node with highest link degree
    const degrees = {};
    links.forEach(l => {
        degrees[l.source.id] = (degrees[l.source.id] || 0) + 1;
        degrees[l.target.id] = (degrees[l.target.id] || 0) + 1;
    });

    let topNodeId = null;
    let maxDegree = 0;
    Object.entries(degrees).forEach(([id, deg]) => {
        if (deg > maxDegree) {
            maxDegree = deg;
            topNodeId = id;
        }
    });

    let topNodeName = '-';
    if (topNodeId) {
        const match = nodes.find(n => n.id === topNodeId);
        if (match) {
            topNodeName = match.name;
        }
    }

    document.getElementById('coord-stat-bridges').textContent = formatNumber(totalBridges);
    document.getElementById('coord-stat-nodes').textContent = formatNumber(coordinatorsCount);
    document.getElementById('coord-stat-top-node').textContent = topNodeName.length > 25 ? topNodeName.substring(0, 23) + '...' : topNodeName;
}

// ---- Search Highlights ----
function searchHighlightCoordination(text) {
    if (!coordSvg) return;
    const cleanText = text.toLowerCase().trim();

    if (!cleanText) {
        coordContainerGroup.selectAll('.coord-node').attr('opacity', 1.0);
        coordContainerGroup.selectAll('.coord-edge').attr('opacity', 0.8);
        return;
    }

    coordContainerGroup.selectAll('.coord-node').each(function(d) {
        const match = d.name.toLowerCase().includes(cleanText) ||
                      d.kuerzel.toLowerCase().includes(cleanText) ||
                      d.typ.toLowerCase().includes(cleanText) ||
                      d.ressort.toLowerCase().includes(cleanText);

        d3.select(this).attr('opacity', match ? 1.0 : 0.15);
    });

    coordContainerGroup.selectAll('.coord-edge').each(function(d) {
        const sourceMatch = d.source.name.toLowerCase().includes(cleanText) || d.source.kuerzel.toLowerCase().includes(cleanText);
        const targetMatch = d.target.name.toLowerCase().includes(cleanText) || d.target.kuerzel.toLowerCase().includes(cleanText);
        d3.select(this).attr('opacity', sourceMatch && targetMatch ? 0.95 : 0.05);
    });
}
