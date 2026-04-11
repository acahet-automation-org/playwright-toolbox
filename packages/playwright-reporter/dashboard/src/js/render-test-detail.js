function renderTestDetail(project, title) {
  const detail = document.getElementById('testDetail');
  if (!detail) return;

  // Collect history oldest-first for charts, newest-first for the run list
  const historyAsc = runs.slice().reverse().map(run => {
    const t = (run.allTests ?? []).find(x => x.project === project && x.title === title);
    return t ? { ts: run.timestamp, runId: run.runId, ...t } : null;
  }).filter(Boolean);

  const historyDesc = [...historyAsc].reverse();

  const passed      = historyAsc.filter(h => h.status === 'passed').length;
  const failed      = historyAsc.filter(h => h.status === 'failed').length;
  const flaky       = historyAsc.filter(h => h.status === 'flaky').length;
  const rate        = historyAsc.length ? (passed / historyAsc.length * 100).toFixed(1) : 0;
  const isQuarantined = historyDesc.some(h => h.quarantined);
  const detailKey     = `${project}::${title}`;
  const regrData      = regressionMap.get(detailKey);
  const isRegressing  = !!(historyDesc[0] && regrData &&
    historyDesc[0].duration > regrData.rollingAvg * (CONFIG.durationRegressionThreshold ?? 1.5));

  // Failure-point comparison (newest-first scan).
  // For each failed/flaky entry, compare its normalized error key against the nearest
  // older failure to answer: "did this test fail at the same place as last time?"
  //   true  → SAME POINT  (consistent failure location)
  //   false → NEW POINT   (failure moved to a different location)
  //   null  → not a failure, or the oldest failure in history (no prior to compare)
  const failureKeys = historyDesc.map(h =>
    (h.status === 'failed' || h.status === 'flaky') ? normalizeErrorKey(h.error) : null
  );
  const samePointFlags = historyDesc.map((h, i) => {
    if (h.status !== 'failed' && h.status !== 'flaky') return null;
    const myKey = failureKeys[i];
    for (let j = i + 1; j < failureKeys.length; j++) {
      if (failureKeys[j] !== null) return myKey === failureKeys[j];
    }
    return null; // no prior failure to compare against
  });

  // Pull annotations from the most recent run that has them
  const annotations = historyDesc.find(h => h.annotations?.length)?.annotations ?? [];
  const annotTitle  = annotations.find(a => a.type === 'title' || a.type === 'description')?.description ?? null;
  const annotDesc   = annotations.find(a => a.type === 'description')?.description ?? null;
  // All non-title/description annotations shown as metadata chips
  const metaAnnots  = annotations.filter(a => a.type !== 'title' && a.type !== 'description');

  detail.innerHTML = `
    <div class="test-detail">

      <!-- Header: name + summary stats -->
      <div class="test-detail-header">
        <div>
          <div class="test-detail-name" style="display:flex;align-items:center;gap:8px">
            <span>${esc(title)}</span>
            ${isQuarantined ? `<span class="badge quarantine">${t('test_quarantined')}</span>` : ''}
            ${isRegressing  ? `<span class="regressing-badge">${t('test_regressing')}</span>`  : ''}
          </div>
          ${metaAnnots.length ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">
            ${metaAnnots.map(a => `<span class="tag" style="background:rgba(124,159,255,.12);color:var(--accent2);border-color:rgba(124,159,255,.2)">${esc(a.type)}${a.description ? ': ' + esc(a.description) : ''}</span>`).join('')}
          </div>` : ''}
        </div>
        <div class="test-detail-stats">
          <div class="test-detail-stat">
            <div class="test-detail-stat-value" style="color:var(--pass)">${passed}</div>
            <div class="test-detail-stat-label">${t('detail_passed')}</div>
          </div>
          ${failed > 0 ? `<div class="test-detail-stat">
            <div class="test-detail-stat-value" style="color:var(--fail)">${failed}</div>
            <div class="test-detail-stat-label">${t('detail_failed')}</div>
          </div>` : ''}
          ${flaky > 0 ? `<div class="test-detail-stat">
            <div class="test-detail-stat-value" style="color:var(--flaky)">${flaky}</div>
            <div class="test-detail-stat-label">${t('detail_flaky')}</div>
          </div>` : ''}
          <div class="test-detail-stat">
            <div class="test-detail-stat-value" style="color:${rate>=80?'var(--pass)':rate>=50?'var(--flaky)':'var(--fail)'}">${rate}<span style="font-size:14px">%</span></div>
            <div class="test-detail-stat-label">${t('detail_pass_rate')}</div>
          </div>
          ${regrData ? `<div class="test-detail-stat">
            <div class="test-detail-stat-value" style="color:${isRegressing?'var(--regression)':'var(--muted)'};font-size:16px">${fmtDur(Math.round(regrData.rollingAvg))}</div>
            <div class="test-detail-stat-label">${t('detail_rolling_avg')}</div>
          </div>` : ''}
        </div>
      </div>

      <!-- Annotation description block (if any) -->
      ${annotDesc ? `
        <div class="test-annot-block">
          <div class="test-annot-type">${t('detail_description')}</div>
          <div class="test-annot-text">${esc(annotDesc)}</div>
        </div>` : ''}

      <!-- Sub-panels: duration chart + failure reasons -->
      <div class="detail-panels">
        ${buildDurationPanel(historyAsc)}
        ${buildFailureReasonsPanel(historyAsc)}
      </div>

      <!-- Per-run history list -->
      ${historyDesc.map((h, i) => renderTrendRow(h, i, samePointFlags[i])).join('')}
    </div>`;

  detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderTrendRow(h, i, samePoint = null) {
  const hasError    = !!(h.error);
  const annotTitle  = h.annotations?.find(a => a.type === 'title')?.description ?? null;
  const hasDetail   = hasError || annotTitle;
  const rowId       = `tr-${i}-${Date.now()}`;

  const samePointBadge = samePoint === true
    ? `<span class="same-point-badge" title="${t('same_point_title')}">${t('same_point_badge')}</span>`
    : samePoint === false
      ? `<span class="diff-point-badge" title="${t('new_point_title')}">${t('new_point_badge')}</span>`
      : '';

  return `
    <div class="trend-row ${statusClass(h.status)}${h.quarantined ? ' quarantine' : ''}${hasDetail ? ' has-detail' : ''}" id="${rowId}">
      <div class="trend-row-summary" ${hasDetail ? `onclick="toggleTrendRow('${rowId}')"` : ''}>
        <div class="trend-row-left">
          <div class="trend-row-date">${fmtDate(h.ts)}</div>
          <div class="trend-row-runid">${esc(h.runId)}</div>
        </div>
        <div class="trend-row-right">
          <div class="trend-row-dur">${fmtDur(h.duration)}</div>
          <div class="trend-row-status" style="color:${statusColor(h.status)}">${h.status}</div>
          ${samePointBadge}
          ${hasDetail ? `<span class="trend-row-chevron" id="chev-${rowId}">▼</span>` : '<span style="width:14px"></span>'}
        </div>
      </div>
      ${hasDetail ? `
        <div class="trend-row-body" id="body-${rowId}">
          ${annotTitle ? `
            <div class="annot-title">
              <span>⚑</span> ${esc(annotTitle)}
            </div>` : ''}
          ${hasError ? `
            <div class="error-toggle" onclick="toggleError('err-${rowId}', 'etoggle-${rowId}')">
              <span class="error-toggle-icon" id="etoggle-${rowId}">▶</span>
              ${t('detail_playwright_error')}
            </div>
            <div class="trend-row-error" id="err-${rowId}">${esc(h.error)}</div>` : ''}
        </div>` : ''}
    </div>`;
}

window.toggleTrendRow = function(rowId) {
  const body = document.getElementById(`body-${rowId}`);
  const chev = document.getElementById(`chev-${rowId}`);
  if (!body) return;
  const open = body.classList.toggle('open');
  if (chev) chev.classList.toggle('open', open);
};

window.toggleError = function(errId, toggleId) {
  const err    = document.getElementById(errId);
  const toggle = document.getElementById(toggleId);
  if (!err) return;
  const open = err.classList.toggle('open');
  if (toggle) toggle.classList.toggle('open', open);
};

// ── Duration mini-chart ────────────────────────────────────────────────────
function buildDurationPanel(historyAsc) {
  if (historyAsc.length < 2) {
    return `<div class="detail-sub-panel">
      <div class="detail-sub-title">${t('dur_over_time')}</div>
      <div class="no-failures-msg">${t('dur_not_enough')}</div>
    </div>`;
  }

  const durations = historyAsc.map(h => h.duration);
  const minD  = Math.min(...durations);
  const maxD  = Math.max(...durations);
  const range = maxD - minD || 1;
  const W = 260, H = 60;

  const pts = historyAsc.map((h, i) => {
    const x = (i / (historyAsc.length - 1)) * W;
    const y = H - ((h.duration - minD) / range) * (H - 8) - 4;
    return [x.toFixed(1), y.toFixed(1), h];
  });

  const polyline = pts.map(p => `${p[0]},${p[1]}`).join(' ');
  const areaPath = `M${pts[0][0]},${H} ` +
    pts.map(p => `L${p[0]},${p[1]}`).join(' ') +
    ` L${pts[pts.length-1][0]},${H} Z`;

  // Rolling average reference line — avg of up to `window_` prior samples at each point
  const rWindow    = CONFIG.durationRegressionWindow    ?? 10;
  const rMinRuns   = CONFIG.durationRegressionMinRuns   ?? 3;
  const rThreshold = CONFIG.durationRegressionThreshold ?? 1.5;
  const avgPts = historyAsc.map((h, i) => {
    if (i === 0) return null;
    const prior = historyAsc.slice(Math.max(0, i - rWindow), i)
      .filter(x => x.status !== 'skipped' && x.duration > 0);
    if (prior.length < rMinRuns) return null;
    const avg = prior.reduce((s, x) => s + x.duration, 0) / prior.length;
    const x = (i / (historyAsc.length - 1)) * W;
    const y = H - ((avg - minD) / range) * (H - 8) - 4;
    return { x: x.toFixed(1), y: y.toFixed(1), avg, exceeded: h.duration > avg * rThreshold };
  });
  const avgPolylineStr = avgPts.filter(Boolean).map(p => `${p.x},${p.y}`).join(' ');
  const avgLineSvg = avgPolylineStr
    ? `<polyline points="${avgPolylineStr}" fill="none" stroke="var(--regression)"
         stroke-width="1" stroke-dasharray="3,3" stroke-opacity=".7"/>`
    : '';

  // Colour dots — amber when exceeding rolling avg threshold
  const dots = pts.map(([x, y, h], i) => {
    const ap = avgPts[i];
    const exceeded = ap?.exceeded ?? false;
    const c = exceeded         ? 'var(--regression)'
            : h.status === 'passed' ? 'var(--pass)'
            : h.status === 'flaky'  ? 'var(--flaky)'
            : 'var(--fail)';
    const avgLabel = ap ? ` · avg ${fmtDur(Math.round(ap.avg))}` : '';
    return `<circle cx="${x}" cy="${y}" r="${exceeded ? 4 : 3}" fill="${c}">
      <title>${fmtDur(h.duration)} · ${h.status} · ${fmtDate(h.ts)}${avgLabel}</title>
    </circle>`;
  }).join('');

  // Delta: compare last run to previous run
  const last = durations[durations.length - 1];
  const prev = durations[durations.length - 2];
  const deltaPct = ((last - prev) / prev * 100);
  const deltaSign = deltaPct > 5 ? 'up' : deltaPct < -5 ? 'down' : 'flat';
  const lastAvgPt = avgPts.filter(Boolean).at(-1);
  const regressingLatest = lastAvgPt?.exceeded ?? false;
  const deltaLabel = (deltaSign === 'flat' ? t('dur_stable') : `${deltaPct > 0 ? '+' : ''}${deltaPct.toFixed(0)}${t('dur_vs_prev')}`)
    + (regressingLatest ? t('dur_regressing') : '');

  return `
    <div class="detail-sub-panel">
      <div class="detail-sub-title">
        ${t('dur_over_time')}
        <span class="dur-delta ${deltaSign}">${deltaLabel}</span>
      </div>
      <div class="dur-mini">
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
          <defs>
            <linearGradient id="tdGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--accent)" stop-opacity=".18"/>
              <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <path d="${areaPath}" fill="url(#tdGrad)"/>
          <polyline points="${polyline}" fill="none" stroke="var(--accent)" stroke-width="1.5"
            stroke-linejoin="round" stroke-linecap="round" stroke-opacity=".5"/>
          ${avgLineSvg}
          ${dots}
        </svg>
      </div>
      <div class="dur-mini-meta">
        <span>${t('dur_min')} ${fmtDur(minD)}</span>
        <span>${t('dur_avg')} ${fmtDur(Math.round(durations.reduce((a,b)=>a+b,0)/durations.length))}</span>
        <span>${t('dur_max')} ${fmtDur(maxD)}</span>
        ${avgPolylineStr ? `<span style="color:var(--regression)">${t('dur_rolling_avg')}</span>` : ''}
      </div>
    </div>`;
}

// ── Failure reasons panel ──────────────────────────────────────────────────
function buildFailureReasonsPanel(historyAsc) {
  const failures = historyAsc.filter(h => h.status === 'failed' || h.status === 'flaky');

  if (!failures.length) {
    return `<div class="detail-sub-panel">
      <div class="detail-sub-title">${t('failure_reasons')}</div>
      <div class="no-failures-msg" style="color:var(--pass)">${t('failure_none')}</div>
    </div>`;
  }

  // Group errors by normalised message — strip line numbers / file paths
  // so the same logical error groups together even if the stack changes slightly
  const counts = new Map();
  for (const h of failures) {
    const key = normalizeErrorKey(h.error ?? '(no error message)') ?? '';
    const prev = counts.get(key) ?? { count: 0, isFlaky: false };
    counts.set(key, {
      count: prev.count + 1,
      isFlaky: prev.isFlaky || h.status === 'flaky',
      latest: h.ts,
    });
  }

  // Sort by frequency desc
  const sorted = [...counts.entries()].sort((a, b) => b[1].count - a[1].count);
  const maxCount = sorted[0][1].count;

  const rows = sorted.slice(0, 6).map(([label, { count, isFlaky }]) => {
    const pct = (count / maxCount * 100).toFixed(0);
    const times = count === 1 ? t('failure_once') : t('failure_times', {n: count});
    return `
      <div class="reason-row">
        <div class="reason-row-header">
          <span class="reason-label" title="${esc(label)}">${esc(label)}</span>
          <span class="reason-count">${times}</span>
        </div>
        <div class="reason-bar-track">
          <div class="reason-bar-fill ${isFlaky ? 'flaky' : ''}" style="width:${pct}%"></div>
        </div>
      </div>`;
  }).join('');

  const more = sorted.length > 6
    ? `<div class="reason-count" style="margin-top:4px">${t('failure_more', {n: sorted.length - 6})}</div>`
    : '';

  return `
    <div class="detail-sub-panel">
      <div class="detail-sub-title">
        ${t('failure_reasons')}
        <span>${failures.length === 1 ? t('failure_total_one') : t('failure_total_many', {n: failures.length})}</span>
      </div>
      <div class="reason-list">${rows}</div>
      ${more}
    </div>`;
}
