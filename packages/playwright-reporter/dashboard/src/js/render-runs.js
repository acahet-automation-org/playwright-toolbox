// ── Runs list ──────────────────────────────────────────────────────────────
function renderRunsList() {
  const el = document.getElementById('runsList');

  el.innerHTML = runs.map((run, idx) => {
    const allT   = run.allTests ?? [];
    const isPass = run.failed === 0;
    const p75    = computeP75(allT.map(t => t.duration));

    const isLatest     = idx === 0;
    const regressingInRun = isLatest ? allT.filter(t => isRegressingTest(t)).length : 0;
    const filteredT    = (isLatest && activeFilter)
      ? allT.filter(t => {
          if (activeFilter === 'quarantine')  return t.quarantined;
          if (activeFilter === 'regressing')  return isRegressingTest(t);
          return t.status === activeFilter;
        })
      : allT;
    const notable      = filteredT.filter(t => t.status === 'failed' || t.status === 'flaky');
    const displayTests = (isLatest && activeFilter) ? filteredT : notable;
    const hasMore      = !activeFilter && allT.length > notable.length;
    const isFiltered   = isLatest && activeFilter;

    return `
      <div class="run-card" id="run-${idx}">
        <div class="run-card-header" onclick="toggleRun(${idx})">
          <div class="run-card-left">
            <span class="run-status-dot" style="background:${isPass ? 'var(--pass)' : 'var(--fail)'}"></span>
            <span class="run-card-ts">${fmtDate(run.timestamp)}</span>
            <div class="run-badges">
              <span class="badge pass">${run.passed} ${t('badge_passed')}</span>
              ${run.failed      > 0 ? `<span class="badge fail">${run.failed} ${t('badge_failed')}</span>`             : ''}
              ${run.flaky       > 0 ? `<span class="badge flaky">${run.flaky} ${t('badge_flaky')}</span>`             : ''}
              ${run.skipped     > 0 ? `<span class="badge skip">${run.skipped} ${t('badge_skipped')}</span>`           : ''}
              ${(run.quarantined??0) > 0 ? `<span class="badge quarantine">${run.quarantined} ${t('badge_quarantined')}</span>` : ''}
              ${regressingInRun > 0 ? `<span class="badge regression">${regressingInRun} ${t('badge_regressing')}</span>` : ''}
            </div>
          </div>
          <div class="run-card-right">
            <span class="run-dur">${fmtDur(run.duration)}</span>
            ${allT.length > 0 ? `<span class="run-chevron" id="chev-${idx}">▼</span>` : ''}
          </div>
        </div>
        ${allT.length > 0 ? `
          <div class="run-detail ${isLatest && activeFilter ? 'open' : ''}" id="detail-${idx}">
            ${isFiltered ? `
              <div class="filter-banner">
                <span class="filter-banner-label">${t('filter_banner_showing')} <strong>${filteredT.length}</strong> ${t('badge_' + (activeFilter === 'quarantine' ? 'quarantined' : activeFilter))} ${filteredT.length !== 1 ? t('filter_banner_tests') : t('filter_banner_test')} ${t('filter_banner_from_run')}</span>
                <button class="filter-banner-clear" onclick="clearFilter()">${t('filter_show_all_btn')}</button>
              </div>` :
              notable.length > 0 ? `
              <div class="run-detail-toggle">
                <span class="detail-label">${t('run_failed_flaky', {n: notable.length})}</span>
                ${hasMore ? `<button class="show-all-btn" id="showall-${idx}" onclick="showAllTests(${idx})">${t('run_show_all', {n: allT.length})}</button>` : ''}
              </div>` :
              `<div class="run-detail-toggle">
                <span class="detail-label">${t('run_all_tests', {n: allT.length})}</span>
              </div>`
            }
            <div id="tests-${idx}">
              ${displayTests.length ? renderTestRows(displayTests, p75) : `<div style="font-family:var(--mono);font-size:12px;color:var(--muted);padding:8px 0">${activeFilter === 'failed' ? t('run_no_test_failed') : t('run_no_filter_tests', {status: t('badge_' + (activeFilter === 'quarantine' ? 'quarantined' : activeFilter))})}</div>`}
            </div>
          </div>` : ''}
      </div>`;
  }).join('');

  if (activeFilter) {
    const chev = document.getElementById('chev-0');
    if (chev) chev.classList.add('open');
  }
}

function renderTestRows(tests, p75 = 0) {
  const tr = t; // alias to avoid shadowing by map param `t` (test object)
  const isImagePath = p => /\.(png|jpg|jpeg|webp)$/i.test(p);
  return tests.map((t, i) => {
    const errId      = `tre-${i}-${Math.random().toString(36).slice(2,7)}`;
    const slow       = p75 > 0 && isSlowTest(t, p75);
    const regressing = isRegressingTest(t);
    const shotSrc    = t.artifacts?.screenshot ||
      (t.attachmentPaths ?? []).find(isImagePath) || null;

    // Register screenshot in the global registry so we don't embed large data URIs in attributes
    let shotKey = null;
    if (shotSrc) {
      shotKey = `s${_shotSeq++}`;
      _shotReg.set(shotKey, { src: shotSrc, title: t.title });
    }

    return `
    <div class="test-row ${statusClass(t.status)}${t.quarantined ? ' quarantine' : ''}">
      <div class="test-row-body">
        <div class="test-row-title" style="display:flex;align-items:center;gap:6px">
          <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(t.title)}</span>
          ${t.quarantined ? `<span class="badge quarantine">${tr('test_quarantined')}</span>` : ''}
          ${slow       ? `<span class="slow-badge">${tr('test_slow')}</span>`            : ''}
          ${regressing ? `<span class="regressing-badge">${tr('test_regressing')}</span>` : ''}
        </div>
        <div class="test-row-meta">
          <span>${esc(t.file)}</span>
          <span>${esc(t.project)}</span>
          <span>${fmtDur(t.duration)}</span>
        </div>
        ${t.error ? `
          <button class="test-row-error-toggle" onclick="toggleRowError('${errId}')">
            <span class="test-row-error-icon" id="icon-${errId}">▶</span>
            ${tr('test_error')}
          </button>
          <div class="test-row-error" id="${errId}">${esc(t.error)}</div>` : ''}
        ${(t.artifacts?.trace || shotKey) ? `
          <div class="artifact-links">
            ${t.artifacts?.trace ? `<a href="${safePath(t.artifacts.trace)}" download class="artifact-link">${tr('artifact_trace')}</a>` : ''}
            ${shotKey ? `<button class="artifact-link screenshot-link" data-shot-key="${shotKey}" onclick="openLightboxKey(this.dataset.shotKey)">${tr('artifact_screenshot')}</button>` : ''}
          </div>` : ''}
      </div>
    </div>`;
  }).join('');
}

window.toggleRowError = function(errId) {
  const el   = document.getElementById(errId);
  const icon = document.getElementById(`icon-${errId}`);
  if (!el) return;
  const open = el.classList.toggle('open');
  if (icon) icon.classList.toggle('open', open);
};

window.toggleRun = function(idx) {
  const detail = document.getElementById(`detail-${idx}`);
  const chev   = document.getElementById(`chev-${idx}`);
  if (!detail) return;
  const open = detail.classList.toggle('open');
  if (chev) chev.classList.toggle('open', open);
};

window.showAllTests = function(idx) {
  const btn = document.getElementById(`showall-${idx}`);
  const container = document.getElementById(`tests-${idx}`);
  if (!btn || !container) return;
  container.innerHTML = renderTestRows(runs[idx].allTests ?? []);
  btn.remove();
};
