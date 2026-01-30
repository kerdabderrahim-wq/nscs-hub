import rawData from './data.js';

// Fix: Handle case where data is a single object (PowerShell JSON quirk)
const data = Array.isArray(rawData) ? rawData : [rawData];

const app = document.getElementById('app');

const state = {
    view: 'years', // years, promos, semesters, modules, resources
    selectedYear: null,
    selectedPromo: null,
    selectedSemester: null,
    selectedModule: null
};

// Initial History State
history.replaceState({ view: 'years' }, '');

window.onpopstate = (event) => {
    if (event.state) {
        // Restore state from history
        state.view = event.state.view;
        state.selectedYear = event.state.selectedYear || null;
        state.selectedPromo = event.state.selectedPromo || null;
        state.selectedSemester = event.state.selectedSemester || null;
        state.selectedModule = event.state.selectedModule || null;
        render();
    }
};

function navigateTo(view, context = {}) {
    // Update State
    state.view = view;
    Object.assign(state, context);

    // Push to History
    history.pushState(JSON.parse(JSON.stringify(state)), '', ''); // JSON parse/stringify to avoid reference issues

    render();
}

function render() {
    app.innerHTML = '';

    switch (state.view) {
        case 'years':
            renderYears();
            break;
        case 'promos':
            renderPromos();
            break;
        case 'semesters':
            renderSemesters();
            break;
        case 'modules':
            renderModules();
            break;
        case 'resources':
            renderResources();
            break;
    }
}

function renderYears() {
    const title = document.createElement('h1');
    title.textContent = '> SELECT_ACADEMIC_YEAR';
    app.appendChild(title);

    const container = document.createElement('div');
    container.className = 'vertical-menu';

    // Sort data by ID (year-1, year-2, etc.)
    data.sort((a, b) => a.id.localeCompare(b.id));

    data.forEach(year => {
        const card = document.createElement('div');
        card.className = 'card year-card';
        if (year.promos.length === 0) {
            card.classList.add('disabled');
            card.innerHTML = `<h3>${year.label}</h3><p>[NO_DATA_FOUND]</p>`;
        } else {
            card.innerHTML = `<h3>${year.label}</h3><p>[ACCESS_GRANTED]</p>`;
            card.onclick = () => {
                navigateTo('promos', { selectedYear: year });
            };
        }
        container.appendChild(card);
    });

    app.appendChild(container);
}

function renderPromos() {
    const title = document.createElement('h1');
    title.textContent = `> ${state.selectedYear.label} / SELECT_PROMO`;
    app.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'grid';

    state.selectedYear.promos.forEach(promo => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `<h3>${promo.label}</h3><p>${promo.semesters.length} SEMESTERS DETECTED</p>`;
        card.onclick = () => {
            navigateTo('semesters', { selectedPromo: promo });
        };
        grid.appendChild(card);
    });

    app.appendChild(grid);
}

function renderSemesters() {
    const title = document.createElement('h1');
    title.textContent = `> ${state.selectedYear.label} / ${state.selectedPromo.label} / SELECT_SEMESTER`;
    app.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'grid';

    state.selectedPromo.semesters.forEach(semester => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `<h3>${semester.label}</h3><p>${semester.modules.length} MODULES DETECTED</p>`;
        card.onclick = () => {
            navigateTo('modules', { selectedSemester: semester });
        };
        grid.appendChild(card);
    });

    app.appendChild(grid);
}

function renderModules() {
    const title = document.createElement('h1');
    title.textContent = `> ${state.selectedYear.label} / ${state.selectedPromo.label} / ${state.selectedSemester.label} / SELECT_MODULE`;
    app.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'grid';

    if (state.selectedSemester.modules.length === 0) {
        const msg = document.createElement('p');
        msg.textContent = 'NO MODULES DETECTED IN THIS SECTOR.';
        msg.style.gridColumn = "1 / -1";
        msg.style.textAlign = "center";
        msg.style.color = "var(--text-muted)";
        grid.appendChild(msg);
    }

    state.selectedSemester.modules.forEach(module => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `<h3>${module.name}</h3><p>${module.resources.length} RESOURCES</p>`;
        card.onclick = () => {
            navigateTo('resources', { selectedModule: module });
        };
        grid.appendChild(card);
    });

    app.appendChild(grid);
}

function renderResources() {
    const title = document.createElement('h1');
    title.textContent = `> ${state.selectedModule.name} / RESOURCES`;
    app.appendChild(title);

    if (state.selectedModule.resources.length === 0) {
        const msg = document.createElement('p');
        msg.textContent = 'NO RESOURCES FOUND IN DATABASE.';
        app.appendChild(msg);
        return;
    }

    const list = document.createElement('div');
    list.className = 'resource-list';

    // Group by category
    const grouped = {};
    state.selectedModule.resources.forEach(res => {
        const cat = res.category || 'General';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(res);
    });

    Object.keys(grouped).forEach(cat => {
        const catHeader = document.createElement('h3');
        catHeader.textContent = `// ${cat}`;
        catHeader.style.color = 'var(--secondary-color)';
        catHeader.style.marginTop = '2rem';
        catHeader.style.marginBottom = '1rem';
        catHeader.style.borderBottom = '1px dashed #333';
        list.appendChild(catHeader);

        grouped[cat].forEach(res => {
            const item = document.createElement('div');
            item.className = 'resource-item';
            // Determine icon/badge based on type
            const type = res.type.toUpperCase();

            item.innerHTML = `
                <a href="${encodeURI(res.url)}" target="_blank">${res.name}</a>
                <span class="type-badge">${type}</span>
            `;
            list.appendChild(item);
        });
    });

    app.appendChild(list);
}

// Initial render
render();
