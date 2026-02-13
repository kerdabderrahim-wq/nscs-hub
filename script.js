import rawData from './data.js';

// Fix: Handle case where data is a single object (PowerShell JSON quirk)
const data = Array.isArray(rawData) ? rawData : [rawData];

// Helper to flat map all resources
function getAllResources() {
    const all = [];
    data.forEach(year => {
        year.promos.forEach(promo => {
            promo.semesters.forEach(semester => {
                semester.modules.forEach(module => {
                    module.resources.forEach(res => {
                        all.push({
                            ...res,
                            yearLabel: year.label,
                            promoLabel: promo.label,
                            semesterId: semester.id,
                            semesterLabel: semester.label,
                            moduleName: module.name
                        });
                    });
                });
            });
        });
    });
    return all;
}

const allResources = getAllResources();

// DOM Elements
const resourceGrid = document.getElementById('resource-grid');
const resourceCount = document.getElementById('resource-count');
const filterSemester = document.getElementById('filter-semester');
const filterModule = document.getElementById('filter-module');
const filterType = document.getElementById('filter-type');
const clearFiltersBtn = document.getElementById('clear-filters');
const s1List = document.getElementById('s1-list');
const s2List = document.getElementById('s2-list');

// Populate Module Filter
function populateModuleFilter() {
    const modules = [...new Set(allResources.map(r => r.moduleName))].sort();
    filterModule.innerHTML = '<option value="all">All Modules</option>';
    modules.forEach(mod => {
        const opt = document.createElement('option');
        opt.value = mod;
        opt.textContent = mod;
        filterModule.appendChild(opt);
    });
}

// Render Resource Grid
function renderResources(filtered) {
    resourceGrid.innerHTML = '';
    resourceCount.textContent = `${filtered.length} resources`;

    if (filtered.length === 0) {
        resourceGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #64748b;">No resources match your filters.</div>';
        return;
    }

    filtered.forEach(res => {
        const card = document.createElement('div');
        card.className = 'resource-card';

        const type = res.type.toUpperCase();
        const description = `A comprehensive ${res.category || 'resource'} for ${res.moduleName} covering essential topics for ${res.semesterLabel}.`;

        card.innerHTML = `
            <div class="card-top">
                <h3>${res.name.replace(/\.[^/.]+$/, "")}</h3>
                <span class="badge-pdf">${type}</span>
            </div>
            <p>${description}</p>
            <a href="${encodeURI(res.url)}" target="_blank" class="btn-google-drive">
                <i class="fas fa-folder-open"></i> Open in Google Drive
            </a>
        `;
        resourceGrid.appendChild(card);
    });
}

// Populate Cycle Lists (Using first year as "First Cycle" example)
function populateCycles() {
    const firstYear = data.find(y => y.label.includes('1st Year'));
    if (!firstYear || firstYear.promos.length === 0) return;

    const currentPromo = firstYear.promos[0]; // Take latest promo

    currentPromo.semesters.forEach(sem => {
        const targetList = sem.id === 's1' ? s1List : s2List;
        if (!targetList) return;

        targetList.innerHTML = '';
        sem.modules.forEach(mod => {
            const li = document.createElement('li');
            li.textContent = mod.name;
            li.onclick = () => {
                filterModule.value = mod.name;
                filterSemester.value = sem.id;
                applyFilters();
                document.getElementById('search').scrollIntoView({ behavior: 'smooth' });
            };
            targetList.appendChild(li);
        });
    });
}

// Filter Logic
function applyFilters() {
    const sem = filterSemester.value;
    const mod = filterModule.value;
    const type = filterType.value;

    const filtered = allResources.filter(res => {
        const semMatch = sem === 'all' || res.semesterId === sem;
        const modMatch = mod === 'all' || res.moduleName === mod;
        const typeMatch = type === 'all' || res.type.toLowerCase() === type.toLowerCase();
        return semMatch && modMatch && typeMatch;
    });

    renderResources(filtered);
}

// Event Listeners
filterSemester.onchange = applyFilters;
filterModule.onchange = applyFilters;
filterType.onchange = applyFilters;

clearFiltersBtn.onclick = () => {
    filterSemester.value = 'all';
    filterModule.value = 'all';
    filterType.value = 'all';
    applyFilters();
};

// Start image generation attempt for hero (if not already done)
// Note: If image fails, fallback to CSS/Logo
const heroImg = document.getElementById('hero-img');
heroImg.onerror = () => {
    heroImg.src = 'assets/logo.png'; // Fallback to logo if illustration missing
    heroImg.style.maxHeight = '300px';
};

// Initial Load
populateModuleFilter();
populateCycles();
applyFilters();
