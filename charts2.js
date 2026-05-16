/* =======================================================
   ZeigDenStaat — Visualization Charts (Part 2)
   Stacked Bars, Sunburst, Network, Heatmap
   ======================================================= */

// ---- 6. Stacked Bar Chart ----
let barMode = 'absolute';
let barSvg, barData;

function initBars() {
    const container = document.getElementById('bars-chart');
    const width = container.clientWidth || 1200;
    const height = 600;
    const margin = { top: 20, right: 30, bottom: 20, left: 180 };

    const domainOrder = ['education', 'admin', 'justice', 'infra', 'security', 'other'];
    const jurisdictions = LAENDER_16.concat(['Bund']);

    barData = jurisdictions.map(j => {
        const counts = {};
        domainOrder.forEach(d => { counts[d] = 0; });
        (dataByJurisdiction[j] || []).forEach(r => { counts[r.domain]++; });
        counts.total = Object.values(counts).reduce((a, b) => a + b, 0);
        counts.jurisdiction = j;
        return counts;
    }).sort((a, b) => b.total - a.total);

    barSvg = d3.select('#bars-chart').append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    drawBars(width, height, margin, domainOrder);
}

function drawBars(width, height, margin, domainOrder) {
    if (!barSvg) return;
    barSvg.selectAll('*').remove();
    if (!width) width = 1200;
    if (!height) height = 600;
    if (!margin) margin = { top: 20, right: 30, bottom: 20, left: 180 };
    if (!domainOrder) domainOrder = ['education', 'admin', 'justice', 'infra', 'security', 'other'];

    const iw = width - margin.left - margin.right;
    const ih = height - margin.top - margin.bottom;

    const g = barSvg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const y = d3.scaleBand().domain(barData.map(d => d.jurisdiction)).range([0, ih]).padding(0.2);

    let x;
    if (barMode === 'percent') {
        x = d3.scaleLinear().domain([0, 100]).range([0, iw]);
    } else {
        x = d3.scaleLinear().domain([0, d3.max(barData, d => d.total)]).range([0, iw]);
    }

    // Y axis labels
    g.append('g').call(d3.axisLeft(y).tickSize(0))
        .selectAll('text').attr('fill', '#8888a8').attr('font-size', '12px').attr('font-family', 'Inter');
    g.select('.domain').remove();

    // Bars
    barData.forEach(row => {
        let cumulative = 0;
        domainOrder.forEach(domain => {
            const val = barMode === 'percent' ? (row[domain] / row.total * 100) : row[domain];
            g.append('rect')
                .attr('x', x(cumulative))
                .attr('y', y(row.jurisdiction))
                .attr('width', Math.max(0, x(val) - x(0)))
                .attr('height', y.bandwidth())
                .attr('fill', getDomainColor(domain))
                .attr('rx', 2)
                .attr('opacity', 0.8)
                .append('title')
                .text(`${row.jurisdiction} — ${getDomainLabel(domain)}: ${formatNumber(row[domain])} (${((row[domain] / row.total) * 100).toFixed(1)}%)`);
            cumulative += val;
        });
    });

    // X axis
    g.append('g').attr('transform', `translate(0,${ih})`)
        .call(d3.axisBottom(x).ticks(6).tickFormat(d => barMode === 'percent' ? d + '%' : formatNumber(d)))
        .selectAll('text').attr('fill', '#555570').attr('font-size', '11px');
    g.selectAll('.domain, .tick line').attr('stroke', 'rgba(255,255,255,0.05)');

    // Legend
    const legend = barSvg.append('g').attr('transform', `translate(${margin.left}, ${height - 10})`);
    domainOrder.forEach((d, i) => {
        legend.append('rect').attr('x', i * 120).attr('y', 0).attr('width', 12).attr('height', 12)
            .attr('rx', 3).attr('fill', getDomainColor(d));
        legend.append('text').attr('x', i * 120 + 18).attr('y', 10)
            .text(getDomainLabel(d)).attr('fill', '#8888a8').attr('font-size', '11px').attr('font-family', 'Inter');
    });
}

function toggleBarMode(mode) {
    barMode = mode;
    document.getElementById('btn-absolute').classList.toggle('active', mode === 'absolute');
    document.getElementById('btn-percent').classList.toggle('active', mode === 'percent');
    const container = document.getElementById('bars-chart');
    drawBars(container.clientWidth || 1200, 600, { top: 20, right: 30, bottom: 20, left: 180 });
}

// ---- 7. Sunburst ----
function initSunburst() {
    const container = document.getElementById('sunburst-chart');
    const width = 650;
    const radius = width / 2;

    // Build hierarchy from Bund records with parent relationships
    const bundRecords = allData.filter(r => r.Jurisdiction === 'Bund');
    const idMap = {};
    bundRecords.forEach(r => { idMap[r.Id] = r; });

    // Find ministerien (depth 0 with children that reference them)
    const ministerien = bundRecords.filter(r => r.Classification === 'Ministerium');
    const ministryIds = new Set(ministerien.map(m => m.Id));

    const root = {
        name: 'Bundesrepublik Deutschland', children: []
    };

    ministerien.forEach(m => {
        const children1 = bundRecords.filter(r => r.ParentId === m.Id && r.Id !== m.Id);
        const mNode = {
            name: m.Name.replace(/^Bundesministerium (für |der |des )/, 'BM ').substring(0, 40),
            fullName: m.Name,
            classification: m.Classification,
            children: children1.map(c => {
                const children2 = bundRecords.filter(r => r.ParentId === c.Id && r.Id !== c.Id);
                if (children2.length > 0) {
                    return {
                        name: c.Name.substring(0, 30), fullName: c.Name,
                        classification: c.Classification,
                        children: children2.map(c2 => ({
                            name: c2.Name.substring(0, 25), fullName: c2.Name,
                            classification: c2.Classification, value: 1
                        }))
                    };
                }
                return { name: c.Name.substring(0, 30), fullName: c.Name, classification: c.Classification, value: 1 };
            })
        };
        if (mNode.children.length === 0) {
            mNode.value = 1;
            delete mNode.children;
        }
        root.children.push(mNode);
    });

    const hierarchy = d3.hierarchy(root).sum(d => d.value || 0).sort((a, b) => b.value - a.value);

    const partition = d3.partition().size([2 * Math.PI, radius]);
    partition(hierarchy);

    const arc = d3.arc()
        .startAngle(d => d.x0).endAngle(d => d.x1)
        .innerRadius(d => d.y0 * 0.7).outerRadius(d => d.y1 * 0.7 - 1);

    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    const svg = d3.select('#sunburst-chart').append('svg')
        .attr('viewBox', `${-radius} ${-radius} ${width} ${width}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    svg.selectAll('path')
        .data(hierarchy.descendants().filter(d => d.depth > 0))
        .join('path')
        .attr('d', arc)
        .attr('fill', d => {
            let node = d;
            while (node.depth > 1) node = node.parent;
            return d3.color(colorScale(node.data.name)).darker(d.depth * 0.3);
        })
        .attr('stroke', '#07070d').attr('stroke-width', 0.5)
        .attr('opacity', 0.85)
        .style('cursor', 'pointer')
        .on('mouseenter', function (event, d) {
            d3.select(this).attr('opacity', 1);
            const bc = document.getElementById('sunburst-breadcrumb');
            const ancestors = d.ancestors().reverse().map(a => a.data.name).join(' → ');
            bc.textContent = ancestors;
        })
        .on('mouseleave', function () {
            d3.select(this).attr('opacity', 0.85);
        })
        .append('title')
        .text(d => `${d.data.fullName || d.data.name}\n${d.data.classification || ''}\n${d.value} Untereinheiten`);

    // Center label
    svg.append('text').attr('text-anchor', 'middle').attr('dy', '-0.3em')
        .text('Bundesrepublik').attr('fill', '#e8e8f0').attr('font-size', '12px')
        .attr('font-weight', 700).attr('font-family', 'Inter');
    svg.append('text').attr('text-anchor', 'middle').attr('dy', '1em')
        .text('Deutschland').attr('fill', '#8888a8').attr('font-size', '11px')
        .attr('font-family', 'Inter');
}

// ---- 8. Force-Directed Network ----
function initNetwork() {
    const container = document.getElementById('network-chart');
    const tooltip = document.getElementById('network-tooltip');
    const width = container.clientWidth || 1200;
    const height = 600;

    // Build graph from parent relationships
    const linkedRecords = allData.filter(r => r.ParentId);
    const parentIds = new Set(linkedRecords.map(r => r.ParentId));
    const childIds = new Set(linkedRecords.map(r => r.Id));
    const relevantIds = new Set([...parentIds, ...childIds]);

    const nodeMap = {};
    allData.forEach(r => {
        if (relevantIds.has(r.Id)) {
            nodeMap[r.Id] = {
                id: r.Id, name: r.Name.substring(0, 40), fullName: r.Name,
                classification: r.Classification, domain: r.domain,
                childCount: 0
            };
        }
    });
    linkedRecords.forEach(r => {
        if (nodeMap[r.ParentId]) nodeMap[r.ParentId].childCount++;
    });

    const nodes = Object.values(nodeMap);
    const links = linkedRecords
        .filter(r => nodeMap[r.Id] && nodeMap[r.ParentId])
        .map(r => ({ source: r.ParentId, target: r.Id }));

    const svg = d3.select('#network-chart').append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(40))
        .force('charge', d3.forceManyBody().strength(-80))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(d => Math.sqrt(d.childCount + 1) * 3 + 4));

    const link = svg.append('g').selectAll('line').data(links).join('line')
        .attr('stroke', 'rgba(99,102,241,0.12)').attr('stroke-width', 1);

    const node = svg.append('g').selectAll('circle').data(nodes).join('circle')
        .attr('r', d => Math.sqrt(d.childCount + 1) * 2.5 + 3)
        .attr('fill', d => getDomainColor(d.domain))
        .attr('opacity', 0.8)
        .attr('stroke', '#07070d').attr('stroke-width', 0.5)
        .style('cursor', 'pointer')
        .call(d3.drag()
            .on('start', (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
            .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
            .on('end', (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
        )
        .on('mouseenter', function (event, d) {
            d3.select(this).attr('opacity', 1).attr('stroke', '#3b82f6').attr('stroke-width', 2);
            tooltip.innerHTML = `<strong>${d.fullName}</strong><br><span style="color:#8888a8">${d.classification || '—'}</span><br>
                <span style="color:#3b82f6">${d.childCount} Unterbehörden</span>`;
            tooltip.style.opacity = '1';
        })
        .on('mousemove', event => {
            tooltip.style.left = (event.clientX + 14) + 'px';
            tooltip.style.top = (event.clientY - 10) + 'px';
        })
        .on('mouseleave', function () {
            d3.select(this).attr('opacity', 0.8).attr('stroke', '#07070d').attr('stroke-width', 0.5);
            tooltip.style.opacity = '0';
        });

    simulation.on('tick', () => {
        link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
        node.attr('cx', d => d.x).attr('cy', d => d.y);
    });
}

// ---- 9. Heatmap ----
function initHeatmap() {
    const container = document.getElementById('heatmap-chart');
    const tooltip = document.getElementById('heatmap-tooltip');

    const topClassifications = Object.entries(dataByClassification)
        .filter(([k]) => k && k !== '(leer)')
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 20).map(([k]) => k);

    const jurisdictions = LAENDER_16.concat(['Bund']);
    const margin = { top: 130, right: 20, bottom: 20, left: 200 };
    const cellSize = 40;
    const width = margin.left + jurisdictions.length * cellSize + margin.right;
    const height = margin.top + topClassifications.length * cellSize + margin.bottom;

    // Build matrix
    const matrix = {};
    let maxVal = 0;
    topClassifications.forEach(c => {
        matrix[c] = {};
        jurisdictions.forEach(j => {
            const count = allData.filter(r => r.Classification === c && r.Jurisdiction === j).length;
            matrix[c][j] = count;
            if (count > maxVal) maxVal = count;
        });
    });

    const colorScale = d3.scaleSequential(d3.interpolate('#0a0a1a', '#3b82f6')).domain([0, Math.log(maxVal + 1)]);

    const svg = d3.select('#heatmap-chart').append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    // Column labels
    jurisdictions.forEach((j, i) => {
        svg.append('text')
            .attr('x', margin.left + i * cellSize + cellSize / 2)
            .attr('y', margin.top - 10)
            .attr('text-anchor', 'end')
            .attr('transform', `rotate(-55, ${margin.left + i * cellSize + cellSize / 2}, ${margin.top - 10})`)
            .text(JURISDICTION_SHORT[j] || j)
            .attr('fill', '#8888a8').attr('font-size', '11px').attr('font-family', 'Inter');
    });

    // Row labels + cells
    topClassifications.forEach((c, ri) => {
        svg.append('text')
            .attr('x', margin.left - 8)
            .attr('y', margin.top + ri * cellSize + cellSize / 2 + 4)
            .attr('text-anchor', 'end')
            .text(c.length > 22 ? c.substring(0, 20) + '…' : c)
            .attr('fill', '#8888a8').attr('font-size', '11px').attr('font-family', 'Inter');

        jurisdictions.forEach((j, ci) => {
            const val = matrix[c][j];
            svg.append('rect')
                .attr('x', margin.left + ci * cellSize)
                .attr('y', margin.top + ri * cellSize)
                .attr('width', cellSize - 2).attr('height', cellSize - 2)
                .attr('rx', 4)
                .attr('fill', val > 0 ? colorScale(Math.log(val + 1)) : 'rgba(255,255,255,0.02)')
                .style('cursor', 'pointer')
                .on('mouseenter', function (event) {
                    d3.select(this).attr('stroke', '#3b82f6').attr('stroke-width', 2);
                    tooltip.innerHTML = `<strong>${c}</strong><br>${j}<br><span style="color:#3b82f6;font-family:JetBrains Mono">${formatNumber(val)}</span>`;
                    tooltip.style.opacity = '1';
                })
                .on('mousemove', event => {
                    tooltip.style.left = (event.clientX + 14) + 'px';
                    tooltip.style.top = (event.clientY - 10) + 'px';
                })
                .on('mouseleave', function () {
                    d3.select(this).attr('stroke', 'none');
                    tooltip.style.opacity = '0';
                });

            // Show number in cell if space allows and value > 0
            if (val > 0) {
                svg.append('text')
                    .attr('x', margin.left + ci * cellSize + cellSize / 2 - 1)
                    .attr('y', margin.top + ri * cellSize + cellSize / 2 + 3)
                    .attr('text-anchor', 'middle')
                    .text(val > 999 ? (val / 1000).toFixed(1) + 'k' : val)
                    .attr('fill', val > 50 ? '#fff' : '#555570')
                    .attr('font-size', '9px').attr('font-family', 'JetBrains Mono')
                    .style('pointer-events', 'none');
            }
        });
    });
}
