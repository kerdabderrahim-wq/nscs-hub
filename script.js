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
const filterYear = document.getElementById('filter-year');
const filterPromo = document.getElementById('filter-promo');
const filterSemester = document.getElementById('filter-semester');
const filterModule = document.getElementById('filter-module');
const filterType = document.getElementById('filter-type');
const clearFiltersBtn = document.getElementById('clear-filters');


// Populate Year Filter
function populateYearFilter() {
    // displaying only years that have content
    const years = [...new Set(allResources.map(r => r.yearLabel))].sort();
    filterYear.innerHTML = '<option value="all">All Years</option>';
    years.forEach(year => {
        const opt = document.createElement('option');
        opt.value = year;
        opt.textContent = year;
        filterYear.appendChild(opt);
    });
}

// Populate Promo Filter
function populatePromoFilter() {
    const selectedYear = filterYear.value;
    let filteredResources = allResources;

    if (selectedYear !== 'all') {
        filteredResources = allResources.filter(r => r.yearLabel === selectedYear);
    }

    const promos = [...new Set(filteredResources.map(r => r.promoLabel))].sort();

    // Save current selection to restore if possible
    const currentPromo = filterPromo.value;

    filterPromo.innerHTML = '<option value="all">All Promos</option>';
    promos.forEach(promo => {
        const opt = document.createElement('option');
        opt.value = promo;
        opt.textContent = promo;
        filterPromo.appendChild(opt);
    });

    // Restore selection if it still exists in the new list
    if (promos.includes(currentPromo)) {
        filterPromo.value = currentPromo;
    }
}

// Populate Module Filter
function populateModuleFilter() {
    const selectedYear = filterYear.value;
    const selectedPromo = filterPromo.value;
    const selectedSemester = filterSemester.value;

    let filteredResources = allResources;

    if (selectedYear !== 'all') {
        filteredResources = filteredResources.filter(r => r.yearLabel === selectedYear);
    }
    if (selectedPromo !== 'all') {
        filteredResources = filteredResources.filter(r => r.promoLabel === selectedPromo);
    }
    if (selectedSemester !== 'all') {
        filteredResources = filteredResources.filter(r => r.semesterId === selectedSemester);
    }

    const modules = [...new Set(filteredResources.map(r => r.moduleName))].sort();

    // Save current selection to restore if possible
    const currentModule = filterModule.value;

    filterModule.innerHTML = '<option value="all">All Modules</option>';
    modules.forEach(mod => {
        const opt = document.createElement('option');
        opt.value = mod;
        opt.textContent = mod;
        filterModule.appendChild(opt);
    });

    // Restore selection if it still exists in the new list, otherwise reset
    if (modules.includes(currentModule)) {
        filterModule.value = currentModule;
    } else {
        filterModule.value = 'all';
    }
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

        // Determine badge class and text
        const category = (res.category || '').toLowerCase();
        const resName = (res.name || '').toLowerCase();
        let badgeClass = 'badge-other';

        let displayCategory = res.category || 'Resource';

        if (category.includes('lecture') || category.includes('cours')) {
            badgeClass = 'badge-lecture';
        } else if (category.includes('exam') || category.includes('test')) {
            badgeClass = 'badge-exam';
        } else if (category.includes('project')) {
            badgeClass = 'badge-project';
        } else if (category.includes('td')) {
            badgeClass = 'badge-td';
        } else if (category.includes('tp')) {
            badgeClass = 'badge-tp';
        } else if (category.includes('summary') || resName.includes('summary') || category.includes('résumé')) {
            badgeClass = 'badge-summary';
            displayCategory = 'Summary';
        } else if (category.includes('solution') || resName.includes('solution') || category.includes('corrigé')) {
            badgeClass = 'badge-solution';
            displayCategory = 'Solution';
        }

        // Determine Icon based on file type
        const type = (res.type || '').toLowerCase();
        let iconClass = 'fa-file-pdf';
        if (type.includes('doc')) iconClass = 'fa-file-word';
        else if (type.includes('ppt')) iconClass = 'fa-file-powerpoint';
        else if (type.includes('xls')) iconClass = 'fa-file-excel';
        else if (type.includes('zip') || type.includes('rar')) iconClass = 'fa-file-archive';
        else if (type.includes('c') || type.includes('java') || type.includes('py') || type.includes('js')) iconClass = 'fa-file-code';
        else if (type.includes('png') || type.includes('jpg') || type.includes('jpeg')) iconClass = 'fa-file-image';

        const description = `Access the ${displayCategory.toLowerCase()} for ${res.moduleName}. Part of the ${res.yearLabel} ${res.semesterLabel} curriculum.`;

        card.innerHTML = `
            <div class="card-top">
                <h3>${res.name.replace(/\.[^/.]+$/, "")}</h3>
                <span class="${badgeClass}">${displayCategory}</span>
            </div>
            <p>${description}</p>
            <a href="${encodeURI(res.url)}" target="_blank" class="btn-google-drive">
                <i class="fas ${iconClass}"></i> Open Resource
            </a>
        `;
        resourceGrid.appendChild(card);
    });
}

// Filter Logic
function applyFilters() {
    const year = filterYear.value;
    const promo = filterPromo.value;
    const sem = filterSemester.value;
    const mod = filterModule.value;
    const type = filterType.value;

    const filtered = allResources.filter(res => {
        const yearMatch = year === 'all' || res.yearLabel === year;
        const promoMatch = promo === 'all' || res.promoLabel === promo;
        const semMatch = sem === 'all' || res.semesterId === sem;
        const modMatch = mod === 'all' || res.moduleName === mod;

        let typeMatch = false;
        const category = (res.category || '').toLowerCase();
        if (type === 'all') {
            typeMatch = true;
        } else if (type === 'lecture') {
            typeMatch = category.includes('lecture') || category.includes('cours');
        } else if (type === 'td') {
            typeMatch = category.includes('td');
        } else if (type === 'tp') {
            typeMatch = category.includes('tp');
        } else if (type === 'exam') {
            typeMatch = category.includes('exam') || category.includes('test');
        } else if (type === 'summary') {
            typeMatch = category.includes('summary') || (res.name || '').toLowerCase().includes('summary') || category.includes('résumé');
        } else if (type === 'solution') {
            typeMatch = category.includes('solution') || (res.name || '').toLowerCase().includes('solution') || category.includes('corrigé');
        } else if (type === 'other') {
            const isKnownType = category.includes('lecture') || category.includes('cours') ||
                category.includes('exam') || category.includes('test') ||
                category.includes('project') || category.includes('td') ||
                category.includes('tp') || category.includes('summary') ||
                resName.includes('summary') || category.includes('résumé') ||
                category.includes('solution') || resName.includes('solution') ||
                category.includes('corrigé');
            typeMatch = !isKnownType;
        } else {
            // Fallback for exact match if any other types are added
            typeMatch = category === type;
        }

        return yearMatch && promoMatch && semMatch && modMatch && typeMatch;
    });

    renderResources(filtered);
}

// Event Listeners
filterYear.onchange = () => {
    populatePromoFilter();
    populateModuleFilter();
    applyFilters();
};

filterPromo.onchange = () => {
    populateModuleFilter();
    applyFilters();
};

filterSemester.onchange = () => {
    populateModuleFilter();
    applyFilters();
};

filterModule.onchange = applyFilters;
filterType.onchange = applyFilters;

clearFiltersBtn.onclick = () => {
    filterYear.value = 'all';
    populatePromoFilter(); // Reset promos
    filterPromo.value = 'all';
    filterSemester.value = 'all';
    populateModuleFilter(); // Reset modules
    filterModule.value = 'all';
    filterType.value = 'all';
    applyFilters();
};


// Initial Load
populateYearFilter();
populatePromoFilter();
populateModuleFilter();
applyFilters();
