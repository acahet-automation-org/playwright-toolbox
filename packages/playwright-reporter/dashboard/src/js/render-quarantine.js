// ── Failure-point normalization ────────────────────────────────────────────
// Shared key used both for recurring-failure grouping and same-point detection.
// Strips numbers, quoted strings and trims to 80 chars so the same logical
// error groups together even when line numbers or values differ between runs.
function normalizeErrorKey(error) {
  if (!error) return null;
  return error.split('\n')[0]
    .replace(/\d+/g, 'N')
    .replace(/'.+?'/g, "'…'")
    .replace(/".+?"/g, '"…"')
    .trim()
    .substring(0, 80);
}

function buildRecurringFailures() {
  const counts = new Map();
  runs.forEach(run => {
    (run.allTests ?? []).filter(t => t.status === 'failed' || t.status === 'flaky').forEach(t => {
      if (!t.error) return;
      const key = normalizeErrorKey(t.error);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
  });
  return [...counts.entries()].sort((a,b) => b[1]-a[1]).slice(0, 8).map(([label, cnt]) => ({ label, cnt }));
}

// ── Quarantine page ────────────────────────────────────────────────────────
function renderQuarantinePage() {
  const container = document.getElementById('quarantinePage');
  if (!container) return;

  // Collect all unique quarantined tests across all runs
  const testMap = new Map(); // key → { title, project, file, tags, runsData: [{ts, runId, status}], firstSeen }

  // Iterate runs oldest-first to find firstSeen
  const runsOldestFirst = runs.slice().reverse();
  runsOldestFirst.forEach(run => {
    (run.allTests ?? []).filter(t => t.quarantined).forEach(t => {
      const key = `${t.project}::${t.title}`;
      if (!testMap.has(key)) {
        testMap.set(key, {
          title: t.title,
          project: t.project,
          file: t.file,
          tags: (t.tags ?? []).filter(g => g.toLowerCase() !== '@quarantine' && g.toLowerCase() !== 'quarantine'),
          runsData: [],
          firstSeen: run.timestamp,
        });
      }
      testMap.get(key).runsData.push({ ts: run.timestamp, runId: run.runId, status: t.status });
    });
  });

  if (testMap.size === 0) {
    container.innerHTML = `
      <div class="page-header"><h2 class="page-title">${t('quarantine_title')}</h2></div>
      <div class="state-screen" style="padding:80px 0">
        <div class="state-screen-icon" style="font-size:36px">🛡️</div>
        <h3>${t('quarantine_empty_h')}</h3>
        <p style="color:var(--muted)">${t('quarantine_empty_p')}</p>
      </div>`;
    return;
  }

  const quarantinedTests = [...testMap.values()];

  container.innerHTML = `
    <div class="page-header">
      <div style="display:flex;align-items:baseline;gap:10px">
        <h2 class="page-title">${t('quarantine_title')}</h2>
        <span style="font-family:var(--mono);font-size:12px;color:var(--muted)">${quarantinedTests.length === 1 ? t('quarantine_count_one') : t('quarantine_count_many', {n: quarantinedTests.length})}</span>
      </div>
      <p style="color:var(--muted);font-size:13px;margin-top:4px">${t('quarantine_desc')}</p>
    </div>
    <div class="section">
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="border-bottom:1px solid var(--border);font-family:var(--mono);font-size:11px;color:var(--muted);text-align:left">
            <th style="padding:8px 12px">${t('quarantine_th_test')}</th>
            <th style="padding:8px 12px">${t('quarantine_th_file')}</th>
            <th style="padding:8px 12px">${t('quarantine_th_last10')}</th>
            <th style="padding:8px 12px">${t('quarantine_th_fail')}</th>
            <th style="padding:8px 12px">${t('quarantine_th_flaky')}</th>
            <th style="padding:8px 12px">${t('quarantine_th_pass')}</th>
            <th style="padding:8px 12px">${t('quarantine_th_since')}</th>
          </tr>
        </thead>
        <tbody>
          ${quarantinedTests.map(t => {
            const last10 = t.runsData.slice(-10);
            const sparkHtml = last10.map(r => `<span class="spark-dot ${statusClass(r.status)}"></span>`).join('');
            const failCount  = t.runsData.filter(r => r.status === 'failed').length;
            const flakyCount = t.runsData.filter(r => r.status === 'flaky').length;
            const passCount  = t.runsData.filter(r => r.status === 'passed').length;
            const tagsHtml   = t.tags.length ? t.tags.map(g => `<span class="tag" style="font-size:10px">${esc(g)}</span>`).join('') : '';
            const since      = new Date(t.firstSeen).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            return `
              <tr style="border-bottom:1px solid var(--border);vertical-align:middle">
                <td style="padding:10px 12px">
                  <div style="font-size:13px;font-weight:500">${esc(t.title)}</div>
                  <div style="display:flex;align-items:center;gap:6px;margin-top:4px">
                    <span class="badge" style="background:var(--surface2);color:var(--muted);font-size:10px">${esc(t.project)}</span>
                    <span class="badge quarantine" style="font-size:10px">${t('quarantine_badge')}</span>
                    ${tagsHtml}
                  </div>
                </td>
                <td style="padding:10px 12px;font-family:var(--mono);font-size:11px;color:var(--muted);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(t.file)}</td>
                <td style="padding:10px 12px">
                  <div class="sparkline" title="${t('quarantine_sparkline_title')}" style="gap:3px">${sparkHtml}</div>
                </td>
                <td style="padding:10px 12px;font-family:var(--mono);font-size:13px;color:${failCount > 0 ? 'var(--fail)' : 'var(--muted)'}">${failCount}</td>
                <td style="padding:10px 12px;font-family:var(--mono);font-size:13px;color:${flakyCount > 0 ? 'var(--flaky)' : 'var(--muted)'}">${flakyCount}</td>
                <td style="padding:10px 12px;font-family:var(--mono);font-size:13px;color:${passCount > 0 ? 'var(--pass)' : 'var(--muted)'}">${passCount}</td>
                <td style="padding:10px 12px;font-family:var(--mono);font-size:11px;color:var(--muted)">${since}</td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}
