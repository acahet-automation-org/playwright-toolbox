// ── PDF export ─────────────────────────────────────────────────────────────
function buildPrintReport(run) {
  const latest      = run;
  const projectName = document.getElementById('projectName')?.textContent || CONFIG.projectName || CONFIG.brandName;
  const grade       = computeGrade(latest);
  const latestRate  = latest.totalTests > 0 ? (latest.passed / latest.totalTests * 100).toFixed(1) : '0';
  const allT        = latest.allTests ?? [];
  const failures    = buildRecurringFailures();
  const maxCnt      = failures[0]?.cnt ?? 1;
  const trendRuns   = runs.slice(0, 7).reverse();

  const suites = new Map();
  allT.forEach(t => {
    const suite = t.file?.split('/').pop()?.replace(/\.spec\.(ts|js)$/, '') ?? 'Tests';
    if (!suites.has(suite)) suites.set(suite, []);
    suites.get(suite).push(t);
  });

  const sc = s => ({ passed:'pr-s-pass', failed:'pr-s-fail', flaky:'pr-s-flaky', skipped:'pr-s-skip' }[s] ?? 'pr-s-skip');

  return `
    <div class="pr-page">
      <div class="pr-header">
        <div>
          <div class="pr-brand">${esc(CONFIG.brandName)} · ${t('print_test_report')}</div>
          <div class="pr-project">${esc(projectName)}</div>
          <div class="pr-run-meta">Run ${esc(latest.runId ?? '')} · ${fmtDate(latest.timestamp)}</div>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <div style="text-align:right">
            <div style="font-size:20px;font-weight:700;color:#fff;font-family:monospace">${latestRate}%</div>
            <div style="font-size:10px;color:#7b82a0;font-family:monospace">${t('print_pass_rate')}</div>
          </div>
          <div class="pr-grade pr-grade-${grade}">${grade}</div>
        </div>
      </div>

      <div class="pr-section-title">${t('print_run_summary')}</div>
      <div class="pr-kpi-row">
        <div class="pr-kpi"><div class="pr-kpi-label">${t('print_kpi_passed')}</div><div class="pr-kpi-value" style="color:#0f6e56">${latest.passed}</div></div>
        <div class="pr-kpi"><div class="pr-kpi-label">${t('print_kpi_failed')}</div><div class="pr-kpi-value" style="color:#a32d2d">${latest.failed}</div></div>
        <div class="pr-kpi"><div class="pr-kpi-label">${t('print_kpi_flaky')}</div><div class="pr-kpi-value" style="color:#854f0b">${latest.flaky ?? 0}</div></div>
        <div class="pr-kpi"><div class="pr-kpi-label">${t('print_kpi_skipped')}</div><div class="pr-kpi-value" style="color:#888">${latest.skipped}</div></div>
        <div class="pr-kpi"><div class="pr-kpi-label">${t('print_kpi_duration')}</div><div class="pr-kpi-value" style="color:#185fa5;font-size:16px">${fmtDur(latest.duration)}</div></div>
      </div>

      <div class="pr-section-title">${t('print_trend_title', {n: trendRuns.length})}</div>
      ${trendRuns.map(r => {
        const rate = r.totalTests > 0 ? (r.passed / r.totalTests * 100) : 0;
        const col  = rate >= 80 ? '#2dd4a0' : rate >= 50 ? '#f5a623' : '#f25f5c';
        return `<div class="pr-trend-row">
          <div class="pr-trend-label">${fmtDate(r.timestamp).split(',')[0]}</div>
          <div class="pr-trend-bg"><div class="pr-trend-fill" style="width:${rate.toFixed(0)}%;background:${col}"></div></div>
          <div class="pr-trend-val">${rate.toFixed(0)}%</div>
        </div>`;
      }).join('')}

      ${failures.length ? `
        <div class="pr-section-title">${t('print_recurring_failures')}</div>
        ${failures.map(({ label, cnt }) => `
          <div class="pr-failure-row">
            <div class="pr-failure-count">${cnt}×</div>
            <div class="pr-failure-bar-wrap"><div class="pr-failure-bar" style="width:${(cnt/maxCnt*100).toFixed(0)}%"></div></div>
            <div class="pr-failure-msg">${esc(label)}</div>
          </div>`).join('')}` : ''}

      <div class="pr-section-title">${t('print_test_results_by_suite')}</div>
      ${[...suites.entries()].map(([suite, tests]) => `
        <div class="pr-suite-title">${esc(suite)}</div>
        ${tests.map(t => `
          <div class="pr-test-row">
            <span class="pr-test-name">${esc(t.title)}</span>
            <span class="pr-test-dur">${fmtDur(t.duration)}</span>
            <span class="pr-status ${sc(t.status)}">${t.status}</span>
          </div>`).join('')}`).join('')}

      <div class="pr-footer">
        <span>${t('print_generated_by')} ${esc(CONFIG.brandName)} · acahet</span>
        <span>${esc(latest.runId ?? '')}</span>
      </div>
    </div>`;
}

function exportPDF(runIdx = 0) {
  if (!runs.length) return;
  const el = document.getElementById('printReport');
  if (!el) return;
  el.innerHTML = buildPrintReport(runs[runIdx]);
  window.print();
}
window.exportPDF = exportPDF;

function exportCSV(scope = 'latest', runIdx = 0) {
  if (!runs.length) return;
  const csvEsc = v => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const headers = ['run_id','timestamp','suite','title','project','status','duration_ms','tags','error'];
  const rows = [headers.join(',')];
  let target;
  if (scope === 'all') {
    target = runs;
  } else if (scope === 'run') {
    target = [runs[runIdx]];
  } else {
    target = [runs[0]];
  }
  target.forEach(run => {
    (run.allTests ?? []).forEach(t => {
      const suite = t.file?.split('/').pop()?.replace(/\.spec\.(ts|js)$/, '') ?? '';
      rows.push([
        csvEsc(run.runId ?? ''),
        csvEsc(run.timestamp ?? ''),
        csvEsc(suite),
        csvEsc(t.title ?? ''),
        csvEsc(t.project ?? ''),
        csvEsc(t.status ?? ''),
        csvEsc(t.duration ?? ''),
        csvEsc((t.tags ?? []).join(';')),
        csvEsc((t.error ?? '').split('\n')[0])
      ].join(','));
    });
  });
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  const projectName = (CONFIG.projectName || CONFIG.brandName || 'tests').replace(/[^a-z0-9_-]/gi, '_');
  const suffix = scope === 'all' ? 'all_runs' : scope === 'run' ? `run_${runIdx}` : 'latest_run';
  a.href     = url;
  a.download = `${projectName}_${suffix}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
window.exportCSV = exportCSV;

window.toggleCsvDropdown = function(e) {
  e.stopPropagation();
  document.getElementById('csvDropdown').classList.toggle('open');
};

window.closeCsvDropdown = function() {
  document.getElementById('csvDropdown').classList.remove('open');
};

document.addEventListener('click', () => closeCsvDropdown());

function openExportRunPicker(type) {
  exportPickerTarget = type;
  const modal = document.getElementById('exportRunPicker');
  const title = document.getElementById('erpTitle');
  const list = document.getElementById('erpList');
  title.textContent = t(type === 'pdf' ? 'erp_title_pdf' : 'erp_title_csv');
  list.innerHTML = runs.map((run, idx) => {
    const d = fmtDate(run.startedAt);
    const dur = fmtDur(run.duration);
    const pass = run.passed || 0;
    const fail = run.failed || 0;
    const flaky = run.flaky || 0;
    return `<div class="erp-run-row" onclick="confirmExportRun(${idx})">
      <span class="erp-run-date">${esc(d)}</span>
      <span class="erp-run-badges">
        ${pass > 0 ? `<span class="badge pass">${pass} passed</span>` : ''}
        ${fail > 0 ? `<span class="badge fail">${fail} failed</span>` : ''}
        ${flaky > 0 ? `<span class="badge flaky">${flaky} flaky</span>` : ''}
      </span>
      <span class="erp-run-dur">${esc(dur)}</span>
    </div>`;
  }).join('');
  modal.classList.add('open');
}

function closeExportRunPicker() {
  document.getElementById('exportRunPicker').classList.remove('open');
  exportPickerTarget = null;
}

function confirmExportRun(idx) {
  if (exportPickerTarget === 'pdf') {
    exportPDF(idx);
  } else {
    exportCSV('run', idx);
  }
  closeExportRunPicker();
}

window.openExportRunPicker = openExportRunPicker;
window.closeExportRunPicker = closeExportRunPicker;
window.confirmExportRun = confirmExportRun;

window.togglePdfDropdown = function(e) {
  e.stopPropagation();
  document.getElementById('pdfDropdown').classList.toggle('open');
};
window.closePdfDropdown = function() {
  document.getElementById('pdfDropdown').classList.remove('open');
};
document.addEventListener('click', () => window.closePdfDropdown());
