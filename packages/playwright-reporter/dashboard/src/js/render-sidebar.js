// ── Sidebar ────────────────────────────────────────────────────────────────
function renderSidebar() {
  const el = document.getElementById('sidebarRuns');
  if (!el) return;

  el.innerHTML = runs.slice(0, 15).map((run, idx) => {
    const isPass = run.failed === 0;
    const rate   = run.totalTests > 0 ? Math.round(run.passed / run.totalTests * 100) : 0;
    return `
      <div class="sidebar-run ${idx === 0 ? 'active' : ''}"
           onclick="jumpToRun(${idx})">
        <span class="sidebar-run-dot" style="background:${isPass ? 'var(--pass)' : 'var(--fail)'}"></span>
        <div class="sidebar-run-info">
          <div class="sidebar-run-date">${fmtDate(run.timestamp)}</div>
          <div class="sidebar-run-stat">${rate}% · ${fmtDur(run.duration)}</div>
        </div>
      </div>`;
  }).join('');
}

// ── Sidebar filters ────────────────────────────────────────────────────────
function renderSidebarFilters() {
  const el = document.getElementById('sidebarFilters');
  if (!el) return;

  // Collect tags across all runs
  const tagCounts = new Map();
  const specCounts = new Map();
  runs.forEach(run => {
    (run.allTests ?? []).forEach(t => {
      (t.tags ?? []).forEach(tag => tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1));
      const spec = t.file?.split('/').pop() ?? t.file;
      if (spec) specCounts.set(spec, (specCounts.get(spec) ?? 0) + 1);
    });
  });

  const tags  = [...tagCounts.entries()].sort((a,b) => b[1]-a[1]).slice(0, 12);
  const specs = [...specCounts.entries()].sort((a,b) => b[1]-a[1]).slice(0, 8);

  el.innerHTML = `
    ${tags.length ? `
      <div class="sidebar-filter-group-title">${t('sidebar_tags')}</div>
      <div class="sidebar-chips">
        ${tags.map(([tag, cnt]) => `
          <div class="sidebar-chip ${sidebarTagFilter===tag?'active':''}"
               data-tag="${esc(tag)}">
            ${esc(tag)}
            <span class="sidebar-chip-count">${cnt}</span>
          </div>`).join('')}
      </div>` : ''}
    ${specs.length ? `
      <div class="sidebar-filter-group-title">${t('sidebar_specs')}</div>
      <div class="sidebar-chips">
        ${specs.map(([spec, cnt]) => `
          <div class="sidebar-chip ${sidebarSpecFilter===spec?'active':''}"
               data-spec="${esc(spec)}">
            ${esc(spec)}
            <span class="sidebar-chip-count">${cnt}</span>
          </div>`).join('')}
      </div>` : ''}`;

  el.onclick = function(e) {
    const tagChip  = e.target.closest('.sidebar-chip[data-tag]');
    if (tagChip)  { toggleTagFilter(tagChip.dataset.tag);   return; }
    const specChip = e.target.closest('.sidebar-chip[data-spec]');
    if (specChip) toggleSpecFilter(specChip.dataset.spec);
  };
}

function applyTestFilter(value) {
  // If already on dashboard or search, the test grid is already in the DOM —
  // just switch to the per-test tab and filter directly, no re-render needed.
  // If on another page (trends, gallery, quarantine), navigate to dashboard first.
  const doFilter = () => {
    const input = document.getElementById('testSearch');
    if (!input) return;
    input.value = value ?? '';
    const testBtn = document.querySelectorAll('.tab-btn')[1];
    if (testBtn) switchTab('test', testBtn);
    filterTests();
  };

  if (currentPage === 'dashboard' || currentPage === 'search') {
    doFilter();
  } else {
    navTo('dashboard', document.getElementById('nav-dashboard'));
    setTimeout(doFilter, 60);
  }
}

window.toggleTagFilter = function(tag) {
  sidebarTagFilter = sidebarTagFilter === tag ? null : tag;
  sidebarSpecFilter = null;
  renderSidebarFilters();
  applyTestFilter(sidebarTagFilter);
};

window.toggleSpecFilter = function(spec) {
  sidebarSpecFilter = sidebarSpecFilter === spec ? null : spec;
  sidebarTagFilter = null;
  renderSidebarFilters();
  applyTestFilter(sidebarSpecFilter);
};
