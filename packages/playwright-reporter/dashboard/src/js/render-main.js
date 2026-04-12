// ── Main render ────────────────────────────────────────────────────────────
function render() {
  const latest = runs[0];
  const totalRuns = runs.length;
  const avgPass = runs.reduce((s, r) =>
    s + (r.totalTests > 0 ? r.passed / r.totalTests * 100 : 0), 0) / runs.length;
  const latestRate = latest.totalTests > 0
    ? (latest.passed / latest.totalTests * 100).toFixed(1)
    : '0.0';

  document.getElementById('topbarMeta').textContent =
    t('topbar_meta', {n: totalRuns, date: fmtDate(latest.timestamp)});

  buildTestIndex();
  buildRegressionMap();
  renderSidebar();
  renderSidebarFilters();
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) exportBtn.style.display = 'inline-flex';
  const exportCsvWrap = document.getElementById('exportCsvWrap');
  if (exportCsvWrap) exportCsvWrap.style.display = 'flex';
  const exportPdfWrap = document.getElementById('exportPdfWrap');
  if (exportPdfWrap) exportPdfWrap.style.display = 'flex';
  renderMainContent(latest, totalRuns, avgPass, latestRate);
}

function renderMainContent(latest, totalRuns, avgPass, latestRate) {
  const regressingCount = (latest.allTests ?? []).filter(t => isRegressingTest(t)).length;
  document.getElementById('mainContent').innerHTML = `
    <!-- Latest run stat cards -->
    <div class="latest-run-section">
      <div class="latest-run-header">
        <div style="display:flex;align-items:center;gap:10px">
          <span class="health-grade grade-${computeGrade(latest)}" title="${t('stat_health_grade')}">${computeGrade(latest)}</span>
          <span class="latest-run-title">${t('stat_latest_run')}</span>
        </div>
        <span class="latest-run-ts">${fmtDate(latest.timestamp)} · ${fmtDur(latest.duration)}</span>
      </div>
      <div class="latest-stats-row">
        <div class="latest-stat rate-card clickable ${activeFilter===null?'active-filter':''}"
             onclick="clearFilter()" title="${t('filter_show_all_tests')}">
          <span class="latest-stat-label">${t('stat_pass_rate_all')}</span>
          <span class="latest-stat-value" style="color:${latestRate>=80?'var(--pass)':latestRate>=50?'var(--flaky)':'var(--fail)'}">${latestRate}<span style="font-size:16px">%</span></span>
        </div>
        <div class="latest-stat pass-card ${latest.passed>0?'clickable':''} ${activeFilter==='passed'?'active-filter':''}"
             ${latest.passed>0?`onclick="filterLatestRun('passed')" title="${t('filter_passed')}"`:''}>
          <span class="latest-stat-label">${t('stat_passed')}</span>
          <span class="latest-stat-value" style="color:var(--pass)">${latest.passed}</span>
        </div>
        <div class="latest-stat fail-card ${latest.failed>0?'clickable':''} ${activeFilter==='failed'?'active-filter':''}"
             ${latest.failed>0?`onclick="filterLatestRun('failed')" title="${t('filter_failed')}"`:''}>
          <span class="latest-stat-label">${t('stat_failed')}</span>
          <span class="latest-stat-value" style="color:${latest.failed>0?'var(--fail)':'var(--muted)'}">${latest.failed}</span>
        </div>
        <div class="latest-stat flaky-card ${(latest.flaky??0)>0?'clickable':''} ${activeFilter==='flaky'?'active-filter':''}"
             ${(latest.flaky??0)>0?`onclick="filterLatestRun('flaky')" title="${t('filter_flaky')}"`:''}>
          <span class="latest-stat-label">${t('stat_flaky')}</span>
          <span class="latest-stat-value" style="color:${(latest.flaky??0)>0?'var(--flaky)':'var(--muted)'}">${latest.flaky ?? 0}</span>
        </div>
        <div class="latest-stat quarantine-card ${(latest.quarantined??0)>0?'clickable':''} ${activeFilter==='quarantine'?'active-filter':''}"
             ${(latest.quarantined??0)>0?`onclick="filterLatestRun('quarantine')" title="${t('filter_quarantined')}"`:''}>
          <span class="latest-stat-label">${t('stat_quarantined')}</span>
          <span class="latest-stat-value" style="color:${(latest.quarantined??0)>0?'var(--quarantine)':'var(--muted)'}">${latest.quarantined ?? 0}</span>
        </div>
        <div class="latest-stat regression-card ${regressingCount>0?'clickable':''} ${activeFilter==='regressing'?'active-filter':''}"
             ${regressingCount>0?`onclick="filterLatestRun('regressing')" title="${t('filter_regressing_title')}"`:''}>
          <span class="latest-stat-label">${t('stat_regressing')}</span>
          <span class="latest-stat-value" style="color:${regressingCount>0?'var(--regression)':'var(--muted)'}">${regressingCount}</span>
        </div>
        <div class="latest-stat skip-card ${latest.skipped>0?'clickable':''} ${activeFilter==='skipped'?'active-filter':''}"
             ${latest.skipped>0?`onclick="filterLatestRun('skipped')" title="${t('filter_skipped')}"`:''}>
          <span class="latest-stat-label">${t('stat_skipped')}</span>
          <span class="latest-stat-value" style="color:var(--muted)">${latest.skipped}</span>
        </div>
        <div class="latest-stat total-card">
          <span class="latest-stat-label">${t('stat_total')}</span>
          <span class="latest-stat-value">${latest.totalTests}</span>
        </div>
        <div class="latest-stat dur-card">
          <span class="latest-stat-label">${t('stat_duration')}</span>
          <span class="latest-stat-value" style="color:var(--accent);font-size:20px">${fmtDur(latest.duration)}</span>
        </div>
      </div>
    </div>

    <!-- Trend + duration charts -->
    <div class="charts-grid">
      <div class="section">
        <div class="section-header">
          <span class="section-title">${t('chart_test_results_trend')}</span>
          <div class="tab-group">
            <button class="tab-btn active" onclick="switchTab('overall',this)">${t('chart_overall')}</button>
            <button class="tab-btn" onclick="switchTab('test',this)">${t('chart_per_test')}</button>
          </div>
        </div>

        <!-- Overall trend (stacked bars) -->
        <div id="overallView">
          <div class="chart-panel">
            <div class="bar-chart" id="barChart"></div>
            <div class="chart-legend">
              <div class="legend-item"><span class="legend-dot" style="background:var(--pass)"></span>${t('chart_legend_passed')}</div>
              <div class="legend-item"><span class="legend-dot" style="background:var(--fail)"></span>${t('chart_legend_failed')}</div>
              <div class="legend-item"><span class="legend-dot" style="background:var(--skip);opacity:.5"></span>${t('chart_legend_skipped')}</div>
            </div>
          </div>
        </div>

        <!-- Per-test search + grid (no detail here) -->
        <div id="testView" class="test-view">
          <input class="search-box" id="testSearch" placeholder="${t('search_placeholder')}" oninput="filterTests()">
          <div class="test-grid" id="testGrid"></div>
          <div style="margin-top:10px;font-family:var(--mono);font-size:11px;color:var(--muted)" id="testSelectHint">
            ${t('search_hint')}
          </div>
        </div>
      </div>

      <!-- Duration panel -->
      <div class="section">
        <div class="section-header">
          <span class="section-title">${t('chart_run_duration')}</span>
        </div>
        <div class="chart-panel dur-panel">
          <div class="dur-chart" id="durChart"></div>
          <div class="chart-legend" style="margin-top:8px;padding-top:8px">
            <div class="legend-item"><span class="legend-dot" style="background:var(--accent)"></span>${t('chart_legend_duration')}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Test detail — full width, below the charts grid -->
    <div id="testDetail" style="margin-bottom:28px"></div>

    <!-- Runs list -->
    <div class="section">
      <div class="section-header">
        <span class="section-title">${t('recent_runs', {n: totalRuns})}</span>
      </div>
      <div id="runsList"></div>
    </div>
  `;

  renderBarChart();
  renderDurChart();
  renderRunsList();
  renderTestGrid(allTests);
}

function renderEmpty() {
  document.getElementById('mainContent').innerHTML = `
    <div class="state-screen">
      <div class="state-screen-icon">🎭</div>
      <h3>${esc(CONFIG.emptyTitle)}</h3>
      <p>${esc(CONFIG.emptyMessage)}</p>
    </div>`;
}

function renderError() {
  document.getElementById('mainContent').innerHTML = `
    <div class="state-screen">
      <div class="state-screen-icon">⚠️</div>
      <h3>${esc(CONFIG.errorTitle)}</h3>
      <p>${esc(CONFIG.errorMessage)}</p>
    </div>`;
}
