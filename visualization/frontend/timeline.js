/* =======================================================
   ZeigDenStaat — Temporal Growth Sprout Visualizer (D3.js)
   ======================================================= */

let timeSvg;
let timeZoomBehavior;
let timeContainerGroup;
let timeSimulation;
let timeCurrentYear = 1949;
let timePlayInterval = null;
let allTimeNodes = [];
let allTimeLinks = [];
let width = 800;
let height = 600;

// Colors for node types
const TYPE_COLORS = {
    'Ministerium': '#f97316',      // Orange
    'Bundesoberbehörde': '#6366f1', // Indigo
    'Bundesanstalt': '#10b981',    // Emerald
    'Sonstige': '#8e8ea8'          // Gray
};

function initTimelineLayout() {
    const container = document.getElementById('timeline-chart');
    container.innerHTML = ''; // Clear previous

    width = container.clientWidth || 800;
    height = container.clientHeight || 600;

    timeSvg = d3.select('#timeline-chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    timeContainerGroup = timeSvg.append('g').attr('class', 'timeline-zoom-container');

    // Pan & Zoom
    timeZoomBehavior = d3.zoom()
        .scaleExtent([0.15, 8])
        .on('zoom', (event) => {
            timeContainerGroup.attr('transform', event.transform);
        });

    timeSvg.call(timeZoomBehavior);

    // Setup basic simulation template
    timeSimulation = d3.forceSimulation()
        .force('link', d3.forceLink().id(d => d.id).distance(60).strength(0.3))
        .force('charge', d3.forceManyBody().strength(-35))
        .force('center', d3.forceCenter(width / 2, height / 2).strength(0.08))
        .force('collide', d3.forceCollide().radius(d => d.isCore ? 18 : 7).iterations(2))
        .alphaDecay(0.02);
}

function getDeterministicFoundingYear(auth) {
    if (auth.gruendungsjahr) return auth.gruendungsjahr;
    
    // Deterministic hash based on ID
    let hash = 0;
    for (let i = 0; i < auth.id.length; i++) {
        hash = auth.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = Math.abs(hash);
    
    // Distribute deterministically between 1949 and 2025
    return 1949 + (hash % 77); // 77 years between 1949 and 2025
}

function initTimelineData() {
    // Group by ressort to sample leaf nodes and avoid DOM overload
    const ressortGroups = {};
    allAuthorities.forEach(a => {
        if (!ressortGroups[a.ressort]) {
            ressortGroups[a.ressort] = [];
        }
        ressortGroups[a.ressort].push(a);
    });

    const filteredAuthorities = [];
    Object.entries(ressortGroups).forEach(([ressort, list]) => {
        list.sort((a, b) => {
            if (a.typ === 'Ministerium' && b.typ !== 'Ministerium') return -1;
            if (a.typ !== 'Ministerium' && b.typ === 'Ministerium') return 1;
            return (b.budget || 0) - (a.budget || 0);
        });

        let count = 0;
        list.forEach(a => {
            const isCore = a.typ === 'Ministerium';
            if (isCore || count < 8) {
                filteredAuthorities.push(a);
                if (!isCore) count++;
            }
        });
    });

    // Create D3 node objects with founding years
    allTimeNodes = filteredAuthorities.map(a => {
        const isCore = a.typ === 'Ministerium';
        const founded = getDeterministicFoundingYear(a);
        return {
            id: a.id,
            name: a.name,
            kuerzel: a.kuerzel || a.name.substring(0, 3),
            typ: a.typ,
            budget: a.budget,
            employees: a.employees,
            ressort: a.ressort,
            isCore: isCore,
            founded: founded
        };
    });

    const nodeIds = new Set(allTimeNodes.map(n => n.id));

    // Filter links
    allTimeLinks = allRelationships
        .filter(r => (r.type === 'UNTERSTELLT' || r.type === 'FACHAUFSICHT') && nodeIds.has(r.from_id) && nodeIds.has(r.to_id))
        .map(r => ({
            source_id: r.from_id,
            target_id: r.to_id,
            type: r.type
        }));
}

function updateTimelineGraph(year) {
    timeCurrentYear = year;
    document.getElementById('timeline-year-display').textContent = year;
    document.getElementById('time-stat-year').textContent = year;

    // Filter nodes founded by this year
    const visibleNodesData = allTimeNodes.filter(n => n.founded <= year);
    const visibleNodeIds = new Set(visibleNodesData.map(n => n.id));

    // Filter links
    const visibleLinksData = allTimeLinks.filter(l => 
        visibleNodeIds.has(l.source_id) && visibleNodeIds.has(l.target_id)
    );

    // Node map
    const nodeMap = {};
    visibleNodesData.forEach(n => { nodeMap[n.id] = n; });

    // Position new sprouted nodes at their parent's coordinate
    visibleNodesData.forEach(n => {
        if (n.x === undefined || n.y === undefined) {
            // Find parent link
            const parentLink = allTimeLinks.find(l => 
                (l.source_id === n.id && visibleNodeIds.has(l.target_id)) || 
                (l.target_id === n.id && visibleNodeIds.has(l.source_id))
            );
            if (parentLink) {
                const parentId = parentLink.source_id === n.id ? parentLink.target_id : parentLink.source_id;
                const parentNode = nodeMap[parentId];
                if (parentNode && parentNode.x !== undefined) {
                    n.x = parentNode.x + (Math.random() - 0.5) * 15;
                    n.y = parentNode.y + (Math.random() - 0.5) * 15;
                } else {
                    n.x = width / 2 + (Math.random() - 0.5) * 50;
                    n.y = height / 2 + (Math.random() - 0.5) * 50;
                }
            } else {
                n.x = width / 2 + (Math.random() - 0.5) * 50;
                n.y = height / 2 + (Math.random() - 0.5) * 50;
            }
        }
    });

    const mappedLinks = visibleLinksData.map(l => ({
        source: nodeMap[l.source_id],
        target: nodeMap[l.target_id],
        type: l.type
    }));

    // Update D3 simulation
    timeSimulation.nodes(visibleNodesData);
    timeSimulation.force('link').links(mappedLinks);
    timeSimulation.alpha(0.65).restart();

    // Draw lines
    const edges = timeContainerGroup.selectAll('.time-edge')
        .data(mappedLinks, d => `${d.source.id}-${d.target.id}`);

    edges.exit().remove();

    const edgesEnter = edges.enter()
        .append('line')
        .attr('class', 'time-edge')
        .attr('stroke', 'rgba(255, 255, 255, 0.12)')
        .attr('stroke-width', '1.5px');

    const mergedEdges = edgesEnter.merge(edges);

    // Draw nodes
    const nodes = timeContainerGroup.selectAll('.time-node')
        .data(visibleNodesData, d => d.id);

    nodes.exit().remove();

    const nodesEnter = nodes.enter()
        .append('g')
        .attr('class', 'time-node')
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended)
        );

    // Node circles
    nodesEnter.append('circle')
        .attr('r', d => d.isCore ? 13 : 5.5)
        .attr('fill', d => TYPE_COLORS[d.typ] || TYPE_COLORS['Sonstige'])
        .attr('stroke', '#fff')
        .attr('stroke-width', d => d.isCore ? '2px' : '0.8px')
        .attr('opacity', 0.95);

    // Core abbreviation labels
    nodesEnter.filter(d => d.isCore)
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '.3em')
        .attr('fill', '#fff')
        .attr('font-size', '7.5px')
        .attr('font-weight', '700')
        .attr('pointer-events', 'none')
        .text(d => d.kuerzel);

    // Hover listeners
    nodesEnter.on('mouseover', showTimeNodeTooltip)
        .on('mousemove', moveTooltip)
        .on('mouseout', hideTimeNodeTooltip)
        .on('click', (event, d) => {
            selectTimeNode(d);
            event.stopPropagation();
        });

    const mergedNodes = nodesEnter.merge(nodes);

    // Green glow for newly founded nodes (last 3 years)
    mergedNodes.select('circle')
        .style('filter', d => (year - d.founded <= 3) ? 'drop-shadow(0 0 8px #10b981)' : 'none')
        .attr('stroke', d => (year - d.founded <= 3) ? '#10b981' : '#fff')
        .attr('stroke-width', d => (year - d.founded <= 3) ? '2px' : (d.isCore ? '2px' : '0.8px'));

    // Simulation updates coordinates
    timeSimulation.on('tick', () => {
        mergedEdges
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        mergedNodes
            .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Update sidebar statistics
    let totalBudget = 0;
    let totalEmployees = 0;
    visibleNodesData.forEach(n => {
        if (n.budget) totalBudget += n.budget;
        if (n.employees) totalEmployees += n.employees;
    });

    document.getElementById('time-stat-count').textContent = formatNumber(visibleNodesData.length);
    document.getElementById('time-stat-budget').textContent = formatMoney(totalBudget);
    document.getElementById('time-stat-staff').textContent = formatNumber(totalEmployees);
}

// Drag handlers
function dragstarted(event, d) {
    if (!event.active) timeSimulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
}

function dragended(event, d) {
    if (!event.active) timeSimulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

// Playback logic
function initTimelinePlayback() {
    const playBtn = document.getElementById('btn-timeline-play');
    const slider = document.getElementById('timeline-slider');

    playBtn.onclick = () => {
        if (timePlayInterval) {
            // Pause
            clearInterval(timePlayInterval);
            timePlayInterval = null;
            playBtn.textContent = '▶️ Abspielen';
        } else {
            // Play
            playBtn.textContent = '⏸️ Pause';
            if (parseInt(slider.value) >= 2025) {
                slider.value = 1949; // loop back
            }
            timePlayInterval = setInterval(() => {
                let currentVal = parseInt(slider.value);
                if (currentVal < 2025) {
                    slider.value = currentVal + 1;
                    updateTimelineGraph(currentVal + 1);
                } else {
                    clearInterval(timePlayInterval);
                    timePlayInterval = null;
                    playBtn.textContent = '▶️ Abspielen';
                }
            }, 400); // 400ms per year
        }
    };

    slider.oninput = (e) => {
        const year = parseInt(e.target.value);
        updateTimelineGraph(year);
    };
}

// Hover tooltips
function showTimeNodeTooltip(event, d) {
    d3.select(this).select('circle')
        .attr('stroke', '#fff')
        .attr('stroke-width', d.isCore ? '3.5px' : '2px');

    tooltipEl.innerHTML = `
        <h4>${d.name}</h4>
        <p><strong>Ressort:</strong> ${d.ressort}</p>
        <p><strong>Typ:</strong> ${d.typ}</p>
        <p><strong>Gegründet:</strong> ${d.founded}</p>
        <p style="margin-top: 6px; color:#10b981; font-weight:600;">
            ${(timeCurrentYear - d.founded <= 3) ? '🌱 Frisch gegründet!' : 'Etabliert'}
        </p>
    `;
    tooltipEl.classList.remove('hidden');

    // Highlight path
    timeContainerGroup.selectAll('.time-edge')
        .transition().duration(150)
        .attr('opacity', l => (l.source.id === d.id || l.target.id === d.id) ? 0.95 : 0.05)
        .attr('stroke-width', l => (l.source.id === d.id || l.target.id === d.id) ? '3px' : '1px')
        .attr('stroke', l => (l.source.id === d.id || l.target.id === d.id) ? 'var(--accent)' : 'rgba(255,255,255,0.12)');
}

function hideTimeNodeTooltip(event, d) {
    d3.select(this).select('circle')
        .attr('stroke', (timeCurrentYear - d.founded <= 3) ? '#10b981' : '#fff')
        .attr('stroke-width', (timeCurrentYear - d.founded <= 3) ? '2px' : (d.isCore ? '2px' : '0.8px'));
    tooltipEl.classList.add('hidden');

    // Restore paths
    timeContainerGroup.selectAll('.time-edge')
        .transition().duration(150)
        .attr('opacity', 1.0)
        .attr('stroke-width', '1.5px')
        .attr('stroke', 'rgba(255,255,255,0.12)');
}

// Sidebar Selection binding
function selectTimeNode(node) {
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
            <span class="badge-item accent" style="background:rgba(16,185,129,0.15); color:#10b981;">📅 Gegründet: ${node.founded}</span>
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

// Search Highlights
function searchHighlightTimeline(text) {
    if (!timeSvg) return;
    const cleanText = text.toLowerCase().trim();

    if (!cleanText) {
        timeContainerGroup.selectAll('.time-node').attr('opacity', 1.0);
        timeContainerGroup.selectAll('.time-edge').attr('opacity', 1.0);
        return;
    }

    timeContainerGroup.selectAll('.time-node').each(function(d) {
        const match = d.name.toLowerCase().includes(cleanText) ||
                      d.kuerzel.toLowerCase().includes(cleanText) ||
                      d.typ.toLowerCase().includes(cleanText) ||
                      d.ressort.toLowerCase().includes(cleanText);

        d3.select(this).attr('opacity', match ? 1.0 : 0.15);
    });

    timeContainerGroup.selectAll('.time-edge').each(function(d) {
        const sourceMatch = d.source.name.toLowerCase().includes(cleanText) || d.source.kuerzel.toLowerCase().includes(cleanText);
        const targetMatch = d.target.name.toLowerCase().includes(cleanText) || d.target.kuerzel.toLowerCase().includes(cleanText);
        d3.select(this).attr('opacity', sourceMatch && targetMatch ? 1.0 : 0.05);
    });
}
