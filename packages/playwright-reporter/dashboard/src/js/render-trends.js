// ── Trends page ────────────────────────────────────────────────────────────
function renderTrendsPage() {
  const el = document.getElementById('trendsPage');
  if (!el) return;

  const display = runs.slice(0, 30).reverse();

  const passRates  = display.map(r => r.totalTests > 0 ? (r.passed / r.totalTests * 100) : 0);
  const durations  = display.map(r => r.duration);
  const flakyCnts  = display.map(r => r.flaky ?? 0);
  const slowCnts   = display.map(r => {
    const allT = r.allTests ?? [];
    const p75  = computeP75(allT.map(t => t.duration));
    return allT.filter(t => isSlowTest(t, p75)).length;
  });

  const tWindow    = CONFIG.durationRegressionWindow    ?? 10;
  const tMinRuns   = CONFIG.durationRegressionMinRuns   ?? 3;
  const tThreshold = CONFIG.durationRegressionThreshold ?? 1.5;
  const regressingCnts = display.map(r => {
    const fullIdx = runs.findIndex(x => x.runId === r.runId);
    if (fullIdx < 0) return 0;
    return (r.allTests ?? []).filter(t => {
      if (t.quarantined || t.status === 'skipped' || t.duration <= 0) return false;
      const prior = runs.slice(fullIdx + 1, fullIdx + 1 + tWindow).flatMap(pr => {
        const x = (pr.allTests ?? []).find(x => x.project === t.project && x.title === t.title);
        return (x && x.status !== 'skipped' && x.duration > 0) ? [x.duration] : [];
      });
      if (prior.length < tMinRuns) return false;
      const avg = prior.reduce((a, b) => a + b, 0) / prior.length;
      return t.duration > avg * tThreshold;
    }).length;
  });

  el.innerHTML = `
    <div class="section-header" style="margin-bottom:20px">
      <span class="section-title">${t('trends_title', {n: display.length})}</span>
    </div>
    <div class="trends-grid">
      ${buildTrendMiniPanel(t('trends_pass_rate'), passRates, display, v => v.toFixed(1)+'%', 'var(--pass)', true)}
      ${buildTrendMiniPanel(t('trends_duration'), durations, display, v => fmtDur(v), 'var(--accent)', false)}
      ${buildTrendMiniPanel(t('trends_flaky_tests'), flakyCnts, display, v => v+'', 'var(--flaky)', false)}
      ${buildTrendMiniPanel(t('trends_slow_tests'), slowCnts, display, v => v+'', '#a78bfa', false)}
      ${buildTrendMiniPanel(t('trends_regressing'), regressingCnts, display, v => v+'', 'var(--regression)', false)}
    </div>`;
}
