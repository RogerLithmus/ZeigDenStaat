/* =======================================================
   ZeigDenStaat — Main Application Orchestrator
   ======================================================= */

// ---- Scroll Reveal ----
function initScrollReveal() {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.section-header, .chart-container, .chart-controls, .table-controls').forEach(el => {
        el.classList.add('reveal');
        observer.observe(el);
    });
}

// ---- Active Nav Tracking ----
function initNavTracking() {
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('.nav-link');

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                navLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('data-section') === id);
                });
            }
        });
    }, { threshold: 0.3 });

    sections.forEach(s => observer.observe(s));
}

// ---- Hero KPI Scroll Trigger ----
function initKPITrigger() {
    const kpiGrid = document.getElementById('kpi-grid');
    const observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
            animateKPIs();
            observer.disconnect();
        }
    }, { threshold: 0.5 });
    observer.observe(kpiGrid);
}

// ---- Main Init ----
async function init() {
    try {
        await loadCSV();

        // Remove loading screen
        document.getElementById('loading-screen').classList.add('hidden');

        // Initialize all visualizations
        initHero();
        initKPITrigger();
        initDonut();
        initWaffle();
        initTreemap();
        initBars();
        initSunburst();
        initNetwork();
        initHeatmap();
        initRadar();
        initBump();
        initTable();

        // Init scroll and nav
        initScrollReveal();
        initNavTracking();

        // Lazy init map (needs TopoJSON from CDN)
        const mapObserver = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                initMap();
                mapObserver.disconnect();
            }
        }, { threshold: 0.1 });
        mapObserver.observe(document.getElementById('map'));

        console.log(`✅ ZeigDenStaat loaded: ${allData.length} institutions`);
    } catch (error) {
        console.error('Failed to initialize:', error);
        document.getElementById('loading-screen').innerHTML = `
            <div class="loader-content">
                <p class="loader-text" style="color:#ef4444">Fehler beim Laden: ${error.message}</p>
            </div>`;
    }
}

// Start
document.addEventListener('DOMContentLoaded', init);
