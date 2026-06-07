/* =======================================================
   ZeigDenStaat — Financial Pipeline Cascade Sankey Layout (D3.js)
   ======================================================= */

let sankeySvg;
let sankeyZoomBehavior;
let sankeyContainerGroup;
let sankeySelectedMinistry = 'all';

function initSankeyLayout() {
    const container = document.getElementById('sankey-chart');
    container.innerHTML = ''; // Clear previous

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    sankeySvg = d3.select('#sankey-chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    sankeyContainerGroup = sankeySvg.append('g').attr('class', 'sankey-zoom-container');

    // Pan & Zoom
    sankeyZoomBehavior = d3.zoom()
        .scaleExtent([0.15, 6])
        .on('zoom', (event) => {
            sankeyContainerGroup.attr('transform', event.transform);
        });

    sankeySvg.call(sankeyZoomBehavior);
}

function renderSankeyGraph() {
    if (!sankeySvg) initSankeyLayout();

    const container = document.getElementById('sankey-chart');
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    sankeyContainerGroup.selectAll('*').remove();
    sankeySvg.call(sankeyZoomBehavior.transform, d3.zoomIdentity);

    // Clear selection detail panel
    document.getElementById('treemap-selection-details').innerHTML = `
        <div class="loading-placeholder">Klicke auf einen Knoten, um Details anzuzeigen.</div>
    `;

    // Build Sankey nodes & links
    const nodesData = [];
    const linksData = [];

    // Group authorities by Ressort
    const ressortGroups = {};
    allAuthorities.forEach(a => {
        if (a.budget && a.budget > 0) {
            if (!ressortGroups[a.ressort]) {
                ressortGroups[a.ressort] = [];
            }
            ressortGroups[a.ressort].push(a);
        }
    });

    const activeRessorts = sankeySelectedMinistry === 'all'
        ? Object.keys(ressortGroups).sort()
        : [allAuthorities.find(a => a.id === sankeySelectedMinistry)?.ressort].filter(Boolean);

    const nodeIdsMap = {};
    function addSankeyNode(id, name, typ, budgetVal) {
        if (nodeIdsMap[id] !== undefined) return nodeIdsMap[id];
        nodesData.push({ id, name, typ, budget: budgetVal });
        const idx = nodesData.length - 1;
        nodeIdsMap[id] = idx;
        return idx;
    }

    // Root node: Bund
    const rootIdx = addSankeyNode("root", "Bundestitel (Gesamthaushalt)", "Bund", 0);

    activeRessorts.forEach(ressort => {
        const list = ressortGroups[ressort] || [];
        if (list.length === 0) return;

        // Ministry node
        const ministryNode = list.find(a => a.typ === 'Ministerium');
        const ministryName = ministryNode ? ministryNode.name : ressort;
        const ministryId = ministryNode ? ministryNode.id : `ressort-${ressort.replace(/\s+/g, '_')}`;

        // Total budget of this ressort
        const totalRessortBudget = list.reduce((sum, a) => sum + (a.budget || 0), 0);

        // Add Ministry node
        const ministryIdx = addSankeyNode(ministryId, ministryName, "Ministerium", totalRessortBudget);

        // Link from Bund to Ministry
        linksData.push({
            source: rootIdx,
            target: ministryIdx,
            value: totalRessortBudget
        });

        // Add Ministry Core administration node (balances inflow/outflow)
        const coreBudgetValue = ministryNode ? ministryNode.budget : 0;
        if (coreBudgetValue && coreBudgetValue > 0) {
            const coreIdx = addSankeyNode(`${ministryId}-core`, `${ministryName} (Kernverwaltung)`, "Kern", coreBudgetValue);
            linksData.push({
                source: ministryIdx,
                target: coreIdx,
                value: coreBudgetValue
            });
        }

        // Subordinate agencies (exclude the ministry itself)
        const subordinates = list.filter(a => a.typ !== 'Ministerium');
        subordinates.sort((a, b) => b.budget - a.budget);

        // Top 6 are individual, rest are grouped
        const topLimit = 6;
        let groupedSubordinatesBudget = 0;

        subordinates.forEach((a, idx) => {
            if (idx < topLimit) {
                const subIdx = addSankeyNode(a.id, a.name, a.typ, a.budget);
                linksData.push({
                    source: ministryIdx,
                    target: subIdx,
                    value: a.budget
                });
            } else {
                groupedSubordinatesBudget += a.budget;
            }
        });

        if (groupedSubordinatesBudget > 0) {
            const groupedId = `${ministryId}-grouped`;
            const groupedName = `Sonstige nachgeordnete Behörden (${ressort})`;
            const groupedIdx = addSankeyNode(groupedId, groupedName, "Sammelgruppe", groupedSubordinatesBudget);
            linksData.push({
                source: ministryIdx,
                target: groupedIdx,
                value: groupedSubordinatesBudget
            });
        }
    });

    if (nodesData.length <= 1) {
        sankeyContainerGroup.append('text')
            .attr('x', width / 2)
            .attr('y', height / 2)
            .attr('text-anchor', 'middle')
            .attr('fill', 'var(--text-muted)')
            .text('Keine Budgetdaten für dieses Ressort verfügbar.');
        return;
    }

    // Configure D3 Sankey Generator
    const sankeyGenerator = d3.sankey()
        .nodeWidth(20)
        .nodePadding(16)
        .extent([[40, 20], [width - 40, height - 20]]);

    let sankeyData;
    try {
        sankeyData = sankeyGenerator({
            nodes: nodesData.map(d => Object.assign({}, d)),
            links: linksData.map(d => Object.assign({}, d))
        });
    } catch (err) {
        console.error("Sankey layout generation failed:", err);
        return;
    }

    // Color theme
    const colorScale = d3.scaleOrdinal()
        .domain(["Bund", "Ministerium", "Kern", "Sammelgruppe", "Sonstige"])
        .range(["#f59e0b", "#6366f1", "#10b981", "#ec4899", "#8e8ea8"]);

    // Draw Links
    const linkGroup = sankeyContainerGroup.append('g')
        .attr('class', 'sankey-links')
        .attr('fill', 'none')
        .attr('stroke-opacity', 0.22);

    const link = linkGroup.selectAll('.sankey-link')
        .data(sankeyData.links)
        .enter()
        .append('path')
        .attr('class', 'sankey-link')
        .attr('d', d3.sankeyLinkHorizontal())
        .attr('stroke', d => colorScale(d.source.typ))
        .attr('stroke-width', d => Math.max(1.5, d.width))
        .on('mouseover', showSankeyLinkTooltip)
        .on('mouseout', hideSankeyLinkTooltip);

    // Draw Nodes
    const nodeGroup = sankeyContainerGroup.append('g').attr('class', 'sankey-nodes');

    const node = nodeGroup.selectAll('.sankey-node')
        .data(sankeyData.nodes)
        .enter()
        .append('g')
        .attr('class', 'sankey-node')
        .attr('transform', d => `translate(${d.x0},${d.y0})`);

    node.append('rect')
        .attr('height', d => Math.max(3, d.y1 - d.y0))
        .attr('width', d => d.x1 - d.x0)
        .attr('fill', d => colorScale(d.typ))
        .attr('stroke', '#fff')
        .attr('stroke-width', '1px')
        .attr('rx', 2)
        .on('mouseover', showSankeyNodeTooltip)
        .on('mousemove', moveTooltip)
        .on('mouseout', hideSankeyNodeTooltip)
        .on('click', (event, d) => {
            selectSankeyNode(d);
            event.stopPropagation();
        });

    // Add node labels
    node.append('text')
        .attr('x', d => d.x0 < width / 2 ? 6 + (d.x1 - d.x0) : -6)
        .attr('y', d => (d.y1 - d.y0) / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', d => d.x0 < width / 2 ? 'start' : 'end')
        .attr('fill', 'var(--text-main)')
        .attr('font-size', '9px')
        .attr('font-weight', '600')
        .attr('pointer-events', 'none')
        .text(d => d.name.length > 30 ? d.name.substring(0, 27) + '...' : d.name);

    updateSankeySidebarStats(nodesData, linksData);
}

// Tooltips & details bindings
function showSankeyLinkTooltip(event, d) {
    d3.select(this)
        .transition().duration(100)
        .attr('stroke-opacity', 0.65);

    tooltipEl.innerHTML = `
        <h4 style="color:#ec4899;">Haushaltsfluss</h4>
        <p><strong>Von:</strong> ${d.source.name}</p>
        <p><strong>Nach:</strong> ${d.target.name}</p>
        <p style="margin-top: 6px; font-weight:700; color:var(--accent);">
            Volumen: ${formatMoney(d.value)}
        </p>
    `;
    tooltipEl.classList.remove('hidden');
    moveTooltip(event);
}

function hideSankeyLinkTooltip(event, d) {
    d3.select(this)
        .transition().duration(100)
        .attr('stroke-opacity', 0.22);
    tooltipEl.classList.add('hidden');
}

function showSankeyNodeTooltip(event, d) {
    d3.select(this).attr('stroke-width', '2px');

    tooltipEl.innerHTML = `
        <h4>${d.name}</h4>
        <p><strong>Typ:</strong> ${d.typ}</p>
        <p style="margin-top: 6px; font-weight:700; color:var(--accent);">
            Budget: ${formatMoney(d.value)}
        </p>
    `;
    tooltipEl.classList.remove('hidden');
}

function hideSankeyNodeTooltip(event, d) {
    d3.select(this).attr('stroke-width', '1px');
    tooltipEl.classList.add('hidden');
}

function selectSankeyNode(node) {
    const container = document.getElementById('treemap-selection-details');
    
    if (node.id === 'root') {
        container.innerHTML = `
            <div class="selected-auth-title">${node.name}</div>
            <div class="selected-auth-ressort">🇩🇪 Gesamtstaatlicher Haushalt</div>
            <div class="selected-auth-badges">
                <span class="badge-item primary">Typ: Bund</span>
            </div>
            <div class="selected-auth-metrics">
                <div class="selected-auth-metric">
                    <span>💰 Gesamtsumme</span>
                    <strong>${formatMoney(node.value)}</strong>
                </div>
            </div>
        `;
        return;
    }

    if (node.typ === 'Sammelgruppe') {
        container.innerHTML = `
            <div class="selected-auth-title">${node.name}</div>
            <div class="selected-auth-ressort">👔 Aggregierte nachgeordnete Behörden</div>
            <div class="selected-auth-badges">
                <span class="badge-item primary">Typ: Sammelgruppe</span>
            </div>
            <div class="selected-auth-metrics">
                <div class="selected-auth-metric">
                    <span>💰 Gesamtvolumen</span>
                    <strong>${formatMoney(node.value)}</strong>
                </div>
            </div>
        `;
        return;
    }

    const cleanId = node.id.replace('-core', '');
    const auth = allAuthorities.find(a => a.id === cleanId);
    if (!auth) return;

    container.innerHTML = `
        <div class="selected-auth-title">${auth.name} ${node.id.endsWith('-core') ? '(Kernverwaltung)' : ''}</div>
        <div class="selected-auth-ressort">👔 ${auth.ressort}</div>
        <div class="selected-auth-badges">
            <span class="badge-item primary">${auth.typ}</span>
            ${auth.kuerzel ? `<span class="badge-item primary">${auth.kuerzel}</span>` : ''}
            <span class="badge-item accent">📍 ${auth.sitz || 'Unbekannt'}</span>
        </div>
        <div class="selected-auth-metrics">
            <div class="selected-auth-metric">
                <span>💰 Budget</span>
                <strong>${formatMoney(node.value)}</strong>
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

function updateSankeySidebarStats(nodes, links) {
    const rootNode = nodes.find(n => n.id === 'root');
    const totalBudget = rootNode ? rootNode.value : 0;

    const agencyCount = nodes.filter(n =>
        n.id !== 'root' &&
        !n.id.endsWith('-core') &&
        !n.id.endsWith('-grouped')
    ).length;

    let topRecipient = '-';
    let maxBudget = 0;
    nodes.forEach(n => {
        if (n.id !== 'root' && !n.id.endsWith('-core') && !n.id.endsWith('-grouped')) {
            if (n.value > maxBudget) {
                maxBudget = n.value;
                topRecipient = n.name;
            }
        }
    });

    document.getElementById('sankey-stat-total').textContent = formatMoney(totalBudget);
    document.getElementById('sankey-stat-count').textContent = formatNumber(agencyCount);
    document.getElementById('sankey-stat-top-recipient').textContent = topRecipient.length > 25 ? topRecipient.substring(0, 23) + '...' : topRecipient;
}

function populateSankeyMinistrySelect() {
    const select = document.getElementById('sankey-ministry-select');
    select.innerHTML = '<option value="all">🌐 Alle Ressorts (Gesamtübersicht)</option>';

    const ministries = allAuthorities
        .filter(a => a.typ === 'Ministerium')
        .sort((a, b) => a.name.localeCompare(b.name));

    ministries.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = m.kuerzel ? `${m.kuerzel} - ${m.name}` : m.name;
        select.appendChild(opt);
    });

    select.onchange = (e) => {
        sankeySelectedMinistry = e.target.value;
        renderSankeyGraph();
    };
}

// Search Highlights for Sankey diagram
function searchHighlightSankey(text) {
    if (!sankeySvg) return;
    const cleanText = text.toLowerCase().trim();

    if (!cleanText) {
        sankeyContainerGroup.selectAll('.sankey-node').attr('opacity', 1.0);
        sankeyContainerGroup.selectAll('.sankey-link').attr('opacity', 1.0);
        return;
    }

    // Highlighting nodes
    sankeyContainerGroup.selectAll('.sankey-node').each(function(d) {
        let match = false;
        if (d.name && d.name.toLowerCase().includes(cleanText)) match = true;
        if (d.typ && d.typ.toLowerCase().includes(cleanText)) match = true;

        // Also check attributes from the original authority if mapped
        const cleanId = d.id.replace('-core', '').replace('-grouped', '');
        const auth = allAuthorities.find(a => a.id === cleanId);
        if (auth) {
            if (auth.kuerzel && auth.kuerzel.toLowerCase().includes(cleanText)) match = true;
            if (auth.ressort && auth.ressort.toLowerCase().includes(cleanText)) match = true;
            if (auth.sitz && auth.sitz.toLowerCase().includes(cleanText)) match = true;
        }

        d3.select(this).attr('opacity', match ? 1.0 : 0.15);
    });

    // Highlighting links: a link is highlighted if either its source or target matches the search query
    sankeyContainerGroup.selectAll('.sankey-link').each(function(d) {
        let sourceMatch = false;
        let targetMatch = false;

        const checkNode = (node) => {
            if (node.name && node.name.toLowerCase().includes(cleanText)) return true;
            if (node.typ && node.typ.toLowerCase().includes(cleanText)) return true;
            const cleanId = node.id.replace('-core', '').replace('-grouped', '');
            const auth = allAuthorities.find(a => a.id === cleanId);
            if (auth) {
                if (auth.kuerzel && auth.kuerzel.toLowerCase().includes(cleanText)) return true;
                if (auth.ressort && auth.ressort.toLowerCase().includes(cleanText)) return true;
                if (auth.sitz && auth.sitz.toLowerCase().includes(cleanText)) return true;
            }
            return false;
        };

        sourceMatch = checkNode(d.source);
        targetMatch = checkNode(d.target);

        d3.select(this).attr('opacity', (sourceMatch || targetMatch) ? 1.0 : 0.1);
    });
}
