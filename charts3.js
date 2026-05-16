/* =======================================================
   ZeigDenStaat — Visualization Charts (Part 3)
   Radar, Bump Chart, Search Table
   ======================================================= */

// ---- 10. Radar Chart ----
let radarChart = null;

function initRadar() {
    const jurisdictions = LAENDER_16;
    const selects = ['radar-select-1', 'radar-select-2', 'radar-select-3'];

    selects.forEach((id, idx) => {
        const sel = document.getElementById(id);
        sel.innerHTML = idx === 2 ? '<option value="">— Kein Vergleich —</option>' : '';
        jurisdictions.forEach(j => {
            const opt = document.createElement('option');
            opt.value = j;
            opt.textContent = j;
            sel.appendChild(opt);
        });
        sel.value = idx === 0 ? 'Nordrhein-Westfalen' : idx === 1 ? 'Bayern' : '';
        sel.addEventListener('change', updateRadar);
    });

    updateRadar();
}

function updateRadar() {
    const lands = [
        document.getElementById('radar-select-1').value,
        document.getElementById('radar-select-2').value,
        document.getElementById('radar-select-3').value
    ].filter(Boolean);

    const dimensions = [
        { label: 'Bildung', match: /Schule|Grundschule|Gymnasium|Gemeinschaftsschule|Förderschule/i },
        { label: 'Verwaltung', match: /Gemeindeverwaltung|Stadtverwaltung|Landkreisverwaltung|Kreisfreie Stadt/i },
        { label: 'Justiz', match: /Gericht|Staatsanwalt|Justizvollzug/i },
        { label: 'Gesundheit', match: /Krankenhaus|Gesundheitsamt|Universitätsklinikum/i },
        { label: 'Infrastruktur', match: /Stadtwerke|Sparkasse|Verkehr|Abfall|Abwasser/i },
        { label: 'Sicherheit', match: /Polizei|Feuerwehr|THW/i },
        { label: 'Finanzen', match: /Finanzamt|Hauptzollamt|Sparkasse/i },
        { label: 'Soziales', match: /Jugendamt|Sozialamt|Jobcenter|Agentur für Arbeit/i }
    ];

    // Find max per dimension for normalization
    const maxPerDim = dimensions.map(dim => {
        let max = 0;
        LAENDER_16.forEach(j => {
            const count = (dataByJurisdiction[j] || []).filter(r => dim.match.test(r.Classification || '')).length;
            if (count > max) max = count;
        });
        return max || 1;
    });

    const colors = ['rgba(59,130,246,0.6)', 'rgba(239,68,68,0.6)', 'rgba(20,184,166,0.6)'];
    const bgColors = ['rgba(59,130,246,0.15)', 'rgba(239,68,68,0.15)', 'rgba(20,184,166,0.15)'];

    const datasets = lands.map((land, i) => {
        const data = dimensions.map((dim, di) => {
            const count = (dataByJurisdiction[land] || []).filter(r => dim.match.test(r.Classification || '')).length;
            return Math.round((count / maxPerDim[di]) * 100);
        });
        return {
            label: land, data,
            borderColor: colors[i], backgroundColor: bgColors[i],
            pointBackgroundColor: colors[i], pointBorderColor: '#07070d',
            pointRadius: 4, borderWidth: 2
        };
    });

    const ctx = document.getElementById('radar-chart').getContext('2d');

    if (radarChart) radarChart.destroy();

    radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: dimensions.map(d => d.label),
            datasets
        },
        options: {
            responsive: true, maintainAspectRatio: true,
            scales: {
                r: {
                    beginAtZero: true, max: 100,
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    angleLines: { color: 'rgba(255,255,255,0.05)' },
                    pointLabels: { color: '#8888a8', font: { family: 'Inter', size: 12 } },
                    ticks: { display: false }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#8888a8', font: { family: 'Inter', size: 13 }, padding: 16 }
                },
                tooltip: {
                    backgroundColor: 'rgba(10,10,20,0.95)', titleColor: '#e8e8f0',
                    bodyColor: '#8888a8', borderColor: 'rgba(255,255,255,0.06)',
                    borderWidth: 1, padding: 12, cornerRadius: 8,
                    callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.r}%` }
                }
            },
            animation: { duration: 800 }
        }
    });
}

// ---- 11. Bump Chart ----
function initBump() {
    const container = document.getElementById('bump-chart');
    const tooltip = document.getElementById('bump-tooltip');

    const categories = ['Schule', 'Grundschule', 'Gymnasium', 'Gemeindeverwaltung', 'Stadtverwaltung', 'Amtsgericht', 'Finanzamt', 'Krankenhaus'];
    const jurisdictions = LAENDER_16;

    const margin = { top: 40, right: 120, bottom: 50, left: 50 };
    const width = 1000;
    const height = 480;
    const iw = width - margin.left - margin.right;
    const ih = height - margin.top - margin.bottom;

    // Calculate rankings
    const rankings = {};
    categories.forEach(cat => {
        const counts = jurisdictions.map(j => ({
            j, count: allData.filter(r => r.Classification === cat && r.Jurisdiction === j).length
        })).sort((a, b) => b.count - a.count);
        counts.forEach((c, i) => {
            if (!rankings[c.j]) rankings[c.j] = {};
            rankings[c.j][cat] = { rank: i + 1, count: c.count };
        });
    });

    const x = d3.scalePoint().domain(categories).range([0, iw]);
    const y = d3.scaleLinear().domain([1, jurisdictions.length]).range([0, ih]);

    const landColors = d3.scaleOrdinal(d3.schemeTableau10).domain(jurisdictions);
    const line = d3.line().x(d => x(d.cat)).y(d => y(d.rank)).curve(d3.curveBumpX);

    const svg = d3.select('#bump-chart').append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Grid
    d3.range(1, jurisdictions.length + 1).forEach(r => {
        g.append('line').attr('x1', 0).attr('x2', iw).attr('y1', y(r)).attr('y2', y(r))
            .attr('stroke', 'rgba(255,255,255,0.03)');
    });

    // X axis
    g.append('g').attr('transform', `translate(0,${ih + 10})`)
        .call(d3.axisBottom(x).tickSize(0))
        .selectAll('text').attr('fill', '#8888a8').attr('font-size', '10px')
        .attr('font-family', 'Inter').attr('text-anchor', 'end')
        .attr('transform', 'rotate(-30)');
    g.select('.domain').remove();

    // Y axis (rank numbers)
    g.append('g').call(d3.axisLeft(y).ticks(jurisdictions.length).tickFormat(d => `#${d}`).tickSize(0))
        .selectAll('text').attr('fill', '#555570').attr('font-size', '10px').attr('font-family', 'JetBrains Mono');
    g.selectAll('.domain').remove();

    // Lines
    jurisdictions.forEach(j => {
        const lineData = categories.map(cat => ({
            cat, rank: rankings[j]?.[cat]?.rank || jurisdictions.length, count: rankings[j]?.[cat]?.count || 0
        }));

        g.append('path')
            .datum(lineData)
            .attr('d', line)
            .attr('fill', 'none')
            .attr('stroke', landColors(j))
            .attr('stroke-width', 2)
            .attr('opacity', 0.35)
            .style('cursor', 'pointer')
            .on('mouseenter', function () {
                g.selectAll('path').attr('opacity', 0.08);
                d3.select(this).attr('opacity', 1).attr('stroke-width', 3.5);
                tooltip.innerHTML = `<strong>${j}</strong>`;
                tooltip.style.opacity = '1';
            })
            .on('mousemove', event => {
                tooltip.style.left = (event.clientX + 14) + 'px';
                tooltip.style.top = (event.clientY - 10) + 'px';
            })
            .on('mouseleave', function () {
                g.selectAll('path').attr('opacity', 0.35).attr('stroke-width', 2);
                tooltip.style.opacity = '0';
            });

        // End label
        const lastRank = rankings[j]?.[categories[categories.length - 1]]?.rank || jurisdictions.length;
        g.append('text')
            .attr('x', iw + 8).attr('y', y(lastRank) + 4)
            .text(JURISDICTION_SHORT[j] || j)
            .attr('fill', landColors(j)).attr('font-size', '10px')
            .attr('font-family', 'Inter').attr('font-weight', 600)
            .attr('opacity', 0.6);
    });
}

// ---- 12. Search Table ----
let tableData = [];
let tableSortCol = 'Name';
let tableSortDir = 'asc';
let tableFilters = { search: '', classification: '', jurisdiction: '' };

function initTable() {
    tableData = allData.slice();

    // Populate filter dropdowns
    const classSelect = document.getElementById('table-filter-class');
    const topClasses = Object.entries(dataByClassification)
        .filter(([k]) => k)
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 50);
    topClasses.forEach(([k, v]) => {
        const opt = document.createElement('option');
        opt.value = k;
        opt.textContent = `${k} (${v.length})`;
        classSelect.appendChild(opt);
    });

    const jurSelect = document.getElementById('table-filter-jurisdiction');
    Object.entries(dataByJurisdiction)
        .sort((a, b) => b[1].length - a[1].length)
        .forEach(([k, v]) => {
            if (!k) return;
            const opt = document.createElement('option');
            opt.value = k;
            opt.textContent = `${k} (${v.length})`;
            jurSelect.appendChild(opt);
        });

    // Events
    let searchTimeout;
    document.getElementById('table-search').addEventListener('input', e => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            tableFilters.search = e.target.value.toLowerCase();
            renderTable();
        }, 200);
    });

    classSelect.addEventListener('change', e => { tableFilters.classification = e.target.value; renderTable(); });
    jurSelect.addEventListener('change', e => { tableFilters.jurisdiction = e.target.value; renderTable(); });

    document.querySelectorAll('#data-table th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const col = th.dataset.sort;
            if (tableSortCol === col) tableSortDir = tableSortDir === 'asc' ? 'desc' : 'asc';
            else { tableSortCol = col; tableSortDir = 'asc'; }
            document.querySelectorAll('#data-table th').forEach(t => t.classList.remove('sort-asc', 'sort-desc'));
            th.classList.add(tableSortDir === 'asc' ? 'sort-asc' : 'sort-desc');
            renderTable();
        });
    });

    renderTable();
}

function renderTable() {
    let filtered = tableData;

    if (tableFilters.search) {
        const q = tableFilters.search;
        filtered = filtered.filter(r =>
            r.Name.toLowerCase().includes(q) ||
            (r.Classification || '').toLowerCase().includes(q) ||
            (r.Jurisdiction || '').toLowerCase().includes(q)
        );
    }
    if (tableFilters.classification) {
        filtered = filtered.filter(r => r.Classification === tableFilters.classification);
    }
    if (tableFilters.jurisdiction) {
        filtered = filtered.filter(r => r.Jurisdiction === tableFilters.jurisdiction);
    }

    // Sort
    filtered.sort((a, b) => {
        let va = a[tableSortCol] || '';
        let vb = b[tableSortCol] || '';
        if (tableSortCol === 'Id' || tableSortCol === 'Depth') {
            va = parseInt(va) || 0; vb = parseInt(vb) || 0;
        } else {
            va = va.toLowerCase(); vb = vb.toLowerCase();
        }
        if (va < vb) return tableSortDir === 'asc' ? -1 : 1;
        if (va > vb) return tableSortDir === 'asc' ? 1 : -1;
        return 0;
    });

    document.getElementById('table-count').textContent = `${formatNumber(filtered.length)} Ergebnisse`;

    // Render (limit to 500 for performance)
    const tbody = document.getElementById('table-body');
    const display = filtered.slice(0, 500);

    tbody.innerHTML = display.map(r => {
        const domainColor = getDomainColor(r.domain);
        return `<tr>
            <td style="font-family:JetBrains Mono;font-size:12px;color:#555570">${r.Id}</td>
            <td>${r.Name}</td>
            <td><span class="classification-badge" style="background:${domainColor}22;color:${domainColor}">${r.Classification || '—'}</span></td>
            <td>${r.Jurisdiction || '—'}</td>
            <td style="font-family:JetBrains Mono;text-align:center">${r.Depth}</td>
        </tr>`;
    }).join('');

    if (filtered.length > 500) {
        tbody.innerHTML += `<tr><td colspan="5" style="text-align:center;color:#555570;padding:20px">
            … ${formatNumber(filtered.length - 500)} weitere Ergebnisse. Suche eingrenzen für mehr.</td></tr>`;
    }
}
