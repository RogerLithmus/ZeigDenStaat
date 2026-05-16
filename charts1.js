/* =======================================================
   ZeigDenStaat — Visualization Charts (Part 1)
   Hero, Donut, Waffle, Map, Treemap
   ======================================================= */

// ---- 1. Hero Particles + KPI Counter ----
function initHero() {
    const canvas = document.createElement('canvas');
    canvas.id = 'particles-bg';
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
    document.getElementById('particles-canvas').appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let w, h, particles = [];

    function resize() {
        w = canvas.width = canvas.offsetWidth;
        h = canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 80; i++) {
        particles.push({
            x: Math.random() * w, y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
            r: Math.random() * 2 + 0.5, a: Math.random() * 0.3 + 0.05
        });
    }

    function draw() {
        ctx.clearRect(0, 0, w, h);
        particles.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
            if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(99,102,241,${p.a})`;
            ctx.fill();
        });
        // Draw connections
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(99,102,241,${0.06 * (1 - dist / 120)})`;
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(draw);
    }
    draw();
}

function animateKPIs() {
    document.querySelectorAll('.kpi-card').forEach(card => {
        const target = parseInt(card.dataset.target);
        const el = card.querySelector('.kpi-number');
        const duration = 2000;
        const start = performance.now();
        function step(now) {
            const progress = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            el.textContent = formatNumber(Math.floor(target * ease));
            if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    });
}

// ---- 2. Donut Chart ----
function initDonut() {
    const domainCounts = {};
    Object.entries(DOMAINS).forEach(([key]) => { domainCounts[key] = 0; });
    allData.forEach(r => { domainCounts[r.domain]++; });

    const labels = [], data = [], colors = [];
    Object.entries(domainCounts).sort((a, b) => b[1] - a[1]).forEach(([key, count]) => {
        labels.push(getDomainLabel(key));
        data.push(count);
        colors.push(getDomainColor(key));
    });

    const ctx = document.getElementById('donut-chart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{ data, backgroundColor: colors, borderColor: '#07070d', borderWidth: 3, hoverBorderWidth: 0 }]
        },
        options: {
            responsive: true, maintainAspectRatio: true, cutout: '62%',
            plugins: {
                legend: {
                    position: 'bottom', labels: {
                        color: '#8888a8', font: { family: 'Inter', size: 13 }, padding: 20,
                        usePointStyle: true, pointStyleWidth: 12
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(10,10,20,0.95)', titleColor: '#e8e8f0',
                    bodyColor: '#8888a8', borderColor: 'rgba(255,255,255,0.06)', borderWidth: 1,
                    padding: 12, cornerRadius: 8,
                    callbacks: {
                        label: ctx => {
                            const pct = ((ctx.parsed / allData.length) * 100).toFixed(1);
                            return ` ${formatNumber(ctx.parsed)} (${pct}%)`;
                        }
                    }
                }
            },
            animation: { animateRotate: true, duration: 1200 }
        }
    });
}

// ---- 3. Waffle Chart ----
function initWaffle() {
    const container = document.getElementById('waffle-chart');
    const legend = document.getElementById('waffle-legend');
    const tooltip = document.getElementById('waffle-tooltip');
    container.innerHTML = '';
    legend.innerHTML = '';

    const domainOrder = ['education', 'admin', 'justice', 'infra', 'security', 'other'];
    const domainCounts = {};
    domainOrder.forEach(d => { domainCounts[d] = 0; });
    allData.forEach(r => { domainCounts[r.domain]++; });

    const cells = [];
    domainOrder.forEach(domain => {
        const count = Math.round(domainCounts[domain] / 100);
        for (let i = 0; i < count; i++) {
            cells.push({ domain, label: getDomainLabel(domain), count: domainCounts[domain] });
        }
    });

    const observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
            cells.forEach((cell, i) => {
                const el = document.createElement('div');
                el.className = 'waffle-cell';
                el.style.backgroundColor = getDomainColor(cell.domain);
                el.style.color = getDomainColor(cell.domain);
                el.style.animationDelay = `${i * 8}ms`;
                el.addEventListener('mouseenter', e => {
                    tooltip.style.opacity = '1';
                    tooltip.textContent = `${cell.label}: ${formatNumber(cell.count)} Institutionen`;
                });
                el.addEventListener('mousemove', e => {
                    tooltip.style.left = (e.clientX + 14) + 'px';
                    tooltip.style.top = (e.clientY - 10) + 'px';
                });
                el.addEventListener('mouseleave', () => { tooltip.style.opacity = '0'; });
                container.appendChild(el);
            });
            observer.disconnect();
        }
    }, { threshold: 0.2 });
    observer.observe(container);

    // Legend
    domainOrder.forEach(d => {
        const count = domainCounts[d];
        const item = document.createElement('div');
        item.className = 'waffle-legend-item';
        item.innerHTML = `<div class="waffle-legend-swatch" style="background:${getDomainColor(d)}"></div>
            <span>${getDomainLabel(d)} (${formatNumber(count)})</span>`;
        legend.appendChild(item);
    });
}

// ---- 4. Choropleth Map ----
async function initMap() {
    const container = document.getElementById('map-chart');
    const tooltip = document.getElementById('map-tooltip');
    const width = container.clientWidth || 800;
    const height = 650;

    const svg = d3.select('#map-chart').append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    // Count per jurisdiction
    const countByLand = {};
    LAENDER_16.forEach(l => { countByLand[l] = 0; });
    allData.forEach(r => {
        if (countByLand[r.Jurisdiction] !== undefined) countByLand[r.Jurisdiction]++;
    });

    const maxCount = Math.max(...Object.values(countByLand));
    const colorScale = d3.scaleSequential(d3.interpolate('#0c1445', '#3b82f6'))
        .domain([0, maxCount]);

    // Load TopoJSON
    let topoData;
    try {
        topoData = await d3.json('https://raw.githubusercontent.com/m-hoerz/german-states-topojson/master/germany-states.json');
    } catch {
        try {
            topoData = await d3.json('https://cdn.jsdelivr.net/npm/german-states-topojson@1.0.0/germany-states.json');
        } catch {
            container.innerHTML = '<p style="color:#8888a8;text-align:center;padding:80px;">Kartendaten konnten nicht geladen werden. Bitte Internetverbindung prüfen.</p>';
            return;
        }
    }

    const objectKey = Object.keys(topoData.objects)[0];
    const geoFeatures = topojson.feature(topoData, topoData.objects[objectKey]);

    const projection = d3.geoMercator().fitSize([width - 40, height - 40], geoFeatures).translate([width / 2, height / 2]);
    const path = d3.geoPath().projection(projection);

    // Name matching helper
    function matchLand(featureName) {
        const fn = featureName.toLowerCase().normalize('NFC');
        for (const land of LAENDER_16) {
            if (fn.includes(land.toLowerCase().normalize('NFC').substring(0, 6))) return land;
        }
        // Fuzzy
        const mapping = {
            'schleswig': 'Schleswig-Holstein', 'hamburg': 'Hamburg', 'niedersachsen': 'Niedersachsen',
            'bremen': 'Bremen', 'nordrhein': 'Nordrhein-Westfalen', 'hessen': 'Hessen',
            'rheinland': 'Rheinland-Pfalz', 'baden': 'Baden-Württemberg', 'bayern': 'Bayern',
            'saarland': 'Saarland', 'berlin': 'Berlin', 'brandenburg': 'Brandenburg',
            'mecklenburg': 'Mecklenburg-Vorpommern', 'sachsen-anhalt': 'Sachsen-Anhalt',
            'sachsen': 'Sachsen', 'thüringen': 'Thüringen', 'thuringen': 'Thüringen', 'thuring': 'Thüringen'
        };
        for (const [key, val] of Object.entries(mapping)) {
            if (fn.includes(key)) return val;
        }
        return null;
    }

    svg.selectAll('path')
        .data(geoFeatures.features)
        .join('path')
        .attr('d', path)
        .attr('fill', d => {
            const land = matchLand(d.properties.name || d.properties.NAME_1 || d.properties.GEN || '');
            return land ? colorScale(countByLand[land] || 0) : '#1a1a2e';
        })
        .attr('stroke', '#1a1a3a')
        .attr('stroke-width', 1)
        .style('cursor', 'pointer')
        .on('mouseenter', function (event, d) {
            d3.select(this).attr('stroke', '#3b82f6').attr('stroke-width', 2.5);
            const land = matchLand(d.properties.name || d.properties.NAME_1 || d.properties.GEN || '');
            if (!land) return;
            const count = countByLand[land] || 0;
            const top3 = (dataByJurisdiction[land] || []).reduce((acc, r) => {
                acc[r.Classification || '(leer)'] = (acc[r.Classification || '(leer)'] || 0) + 1;
                return acc;
            }, {});
            const top3Sorted = Object.entries(top3).sort((a, b) => b[1] - a[1]).slice(0, 3);
            tooltip.innerHTML = `<h4>${land}</h4><span class="tooltip-count">${formatNumber(count)}</span>
                <div class="tooltip-detail">${top3Sorted.map(([k, v]) => `${k}: ${v}`).join('<br>')}</div>`;
            tooltip.style.opacity = '1';
        })
        .on('mousemove', (event) => {
            tooltip.style.left = (event.clientX + 16) + 'px';
            tooltip.style.top = (event.clientY - 10) + 'px';
        })
        .on('mouseleave', function () {
            d3.select(this).attr('stroke', '#1a1a3a').attr('stroke-width', 1);
            tooltip.style.opacity = '0';
        });

    // Legend
    const legendEl = document.getElementById('map-legend');
    legendEl.innerHTML = `
        <div class="map-legend-title">Institutionen pro Bundesland</div>
        <div class="map-legend-gradient" style="background:linear-gradient(90deg,#0c1445,#3b82f6)"></div>
        <div class="map-legend-labels"><span>0</span><span>${formatNumber(maxCount)}</span></div>`;
}

// ---- 5. Treemap ----
function initTreemap() {
    const container = document.getElementById('treemap-chart');
    const tooltip = document.getElementById('treemap-tooltip');
    const width = container.clientWidth || 1200;
    const height = 500;

    // Build hierarchy
    const domainOrder = ['education', 'admin', 'justice', 'infra', 'security', 'other'];
    const children = domainOrder.map(domain => {
        const classGroups = {};
        (dataByDomain[domain] || []).forEach(r => {
            const c = r.Classification || '(leer)';
            classGroups[c] = (classGroups[c] || 0) + 1;
        });
        return {
            name: getDomainLabel(domain), domain,
            children: Object.entries(classGroups).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([name, value]) => ({ name, value, domain }))
        };
    });

    const root = d3.hierarchy({ name: 'Staat', children }).sum(d => d.value || 0).sort((a, b) => b.value - a.value);

    d3.treemap().size([width, height]).padding(2).paddingTop(22).round(true)(root);

    const svg = d3.select('#treemap-chart').append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    const leaves = svg.selectAll('g').data(root.leaves()).join('g')
        .attr('transform', d => `translate(${d.x0},${d.y0})`);

    leaves.append('rect')
        .attr('width', d => Math.max(0, d.x1 - d.x0))
        .attr('height', d => Math.max(0, d.y1 - d.y0))
        .attr('rx', 3)
        .attr('fill', d => getDomainColor(d.data.domain))
        .attr('opacity', 0.75)
        .style('cursor', 'pointer')
        .on('mouseenter', function (event, d) {
            d3.select(this).attr('opacity', 1);
            const pct = ((d.data.value / allData.length) * 100).toFixed(1);
            tooltip.innerHTML = `<div class="tt-name">${d.data.name}</div>
                <div class="tt-count">${formatNumber(d.data.value)}</div>
                <div class="tt-pct">${pct}% aller Institutionen</div>`;
            tooltip.style.opacity = '1';
        })
        .on('mousemove', event => {
            tooltip.style.left = (event.clientX + 14) + 'px';
            tooltip.style.top = (event.clientY - 10) + 'px';
        })
        .on('mouseleave', function () {
            d3.select(this).attr('opacity', 0.75);
            tooltip.style.opacity = '0';
        });

    leaves.append('text')
        .attr('x', 4).attr('y', 14)
        .text(d => {
            const w = d.x1 - d.x0;
            if (w < 50) return '';
            const name = d.data.name;
            return w < 100 ? name.substring(0, 8) + '…' : name;
        })
        .attr('font-size', d => (d.x1 - d.x0) > 120 ? '11px' : '9px')
        .attr('fill', '#fff').attr('opacity', 0.85)
        .attr('font-family', 'Inter, sans-serif').attr('font-weight', 600)
        .style('pointer-events', 'none');

    // Domain group labels
    root.children.forEach(group => {
        svg.append('text')
            .attr('x', group.x0 + 4).attr('y', group.y0 + 14)
            .text(group.data.name)
            .attr('font-size', '12px').attr('font-weight', 800)
            .attr('fill', getDomainColor(group.data.domain))
            .attr('font-family', 'Inter, sans-serif')
            .style('pointer-events', 'none');
    });
}
