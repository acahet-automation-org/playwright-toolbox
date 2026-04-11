// ── Test index & grid ──────────────────────────────────────────────────────
function buildTestIndex() {
  const seen = new Map();
  runs.forEach(run => {
    (run.allTests ?? []).forEach(t => {
      const key = `${t.project}::${t.title}`;
      if (!seen.has(key)) seen.set(key, { title: t.title, file: t.file ?? '', project: t.project, tags: t.tags ?? [], quarantined: !!t.quarantined, key });
      else if (t.quarantined) seen.get(key).quarantined = true;
    });
  });
  allTests = [...seen.values()].sort((a, b) =>
    a.project !== b.project ? a.project.localeCompare(b.project) : a.title.localeCompare(b.title)
  );
}

function getSparkline(testKey) {
  // Last 10 runs, oldest first
  const [project, ...rest] = testKey.split('::');
  const title = rest.join('::');
  return runs.slice(0, 10).reverse().map(run => {
    const t = (run.allTests ?? []).find(x => x.project === project && x.title === title);
    return t ? statusClass(t.status) : 'none';
  });
}

function renderTestGrid(tests) {
  const grid = document.getElementById('testGrid');
  if (!grid) return;

  if (!tests.length) {
    grid.innerHTML = '<div style="color:var(--muted);font-size:13px;padding:16px">' + t('search_no_tests') + '</div>';
    return;
  }

  const tl = t; // alias to avoid shadowing by map param `t` (test object)
  grid.innerHTML = tests.map(t => {
    const spark = getSparkline(t.key);
    const tagsHtml = t.tags.length
      ? `<div class="test-tags">${t.tags.map(g => `<span class="tag">${esc(g)}</span>`).join('')}</div>`
      : '';
    return `
      <div class="test-card ${selectedTestKey === t.key ? 'selected' : ''}"
           data-key="${esc(t.key)}">
        <div class="test-card-name">${esc(t.title)}</div>
        <div class="test-card-meta">
          <span class="test-card-project">${esc(t.project)}</span>
          ${t.quarantined ? `<span class="badge quarantine" style="font-size:10px;padding:1px 5px">${tl('test_quarantined')}</span>` : ''}
          <div class="sparkline" title="${tl('quarantine_sparkline_title')}">
            ${spark.map(s => `<span class="spark-dot ${s}"></span>`).join('')}
          </div>
        </div>
        ${tagsHtml}
      </div>`;
  }).join('');

  // Re-attach delegation each render (grid is re-created each time)
  grid.onclick = function(e) {
    const card = e.target.closest('.test-card');
    if (!card) return;
    const key = card.dataset.key;
    if (key) selectTest(key);
  };
}

window.filterTests = function() {
  const q = document.getElementById('testSearch').value.toLowerCase();
  const filtered = !q ? allTests : allTests.filter(t =>
    t.title.toLowerCase().includes(q) ||
    t.project.toLowerCase().includes(q) ||
    (t.file ?? '').toLowerCase().includes(q) ||
    t.tags.some(g => g.toLowerCase().includes(q))
  );
  renderTestGrid(filtered);
};

function selectTest(key) {
  selectedTestKey = key;
  const hint = document.getElementById('testSelectHint');
  if (hint) hint.style.display = 'none';
  const q = document.getElementById('testSearch')?.value?.toLowerCase() ?? '';
  const filtered = q
    ? allTests.filter(t => t.title.toLowerCase().includes(q) || t.project.toLowerCase().includes(q) || t.tags.some(g => g.toLowerCase().includes(q)))
    : allTests;
  renderTestGrid(filtered);
  const [project, ...rest] = key.split('::');
  const title = rest.join('::');
  renderTestDetail(project, title);
}
window.selectTest = selectTest;
