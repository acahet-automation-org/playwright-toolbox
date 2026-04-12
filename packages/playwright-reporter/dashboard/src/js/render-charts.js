// ── Stacked bar chart ──────────────────────────────────────────────────────
function renderBarChart() {
  const el = document.getElementById('barChart');
  const display = runs.slice(0, 30).reverse();
  const maxTotal = Math.max(...display.map(r => r.totalTests), 1);

  el.innerHTML = display.map(r => {
    const pct = v => ((v / maxTotal) * 132).toFixed(1); // 132px usable height
    const passH  = pct(r.passed);
    const failH  = pct(r.failed);
    const skipH  = pct(r.skipped);
    const stackH = (+passH + +failH + +skipH);
    const date   = fmtDate(r.timestamp).split(',')[0];
    const rate   = r.totalTests > 0 ? (r.passed / r.totalTests * 100).toFixed(0) : 0;

    return `
      <div class="bar-col">
        <div class="bar-tooltip">
          <div style="color:var(--pass)">${r.passed} ${t('bar_passed')}</div>
          ${r.failed  > 0 ? `<div style="color:var(--fail)">${r.failed} ${t('bar_failed')}</div>` : ''}
          ${r.flaky   > 0 ? `<div style="color:var(--flaky)">${r.flaky} ${t('bar_flaky')}</div>` : ''}
          ${r.skipped > 0 ? `<div style="color:var(--skip)">${r.skipped} ${t('bar_skipped')}</div>` : ''}
          <div style="color:var(--muted);margin-top:2px">${rate}% ${t('bar_pass_rate')} · ${fmtDur(r.duration)}</div>
        </div>
        <div class="bar-stack" style="height:${stackH}px">
          ${r.skipped > 0 ? `<div class="bar-seg-skip"  style="height:${skipH}px"></div>` : ''}
          ${r.failed  > 0 ? `<div class="bar-seg-fail"  style="height:${failH}px"></div>` : ''}
          <div class="bar-seg-pass" style="height:${passH}px"></div>
        </div>
        <div class="bar-lbl">${date}</div>
      </div>`;
  }).join('');
}

// ── Duration line chart (SVG) ─────────────────────────────────────────────
function renderDurChart() {
  const el = document.getElementById('durChart');
  const display = runs.slice(0, 30).reverse();
  if (display.length < 2) { el.innerHTML = `<div style="color:var(--muted);font-size:12px;padding:8px">${t('chart_not_enough_data_yet')}</div>`; return; }

  const W = 300, H = 70;
  const durations = display.map(r => r.duration);
  const minD = Math.min(...durations);
  const maxD = Math.max(...durations);
  const range = maxD - minD || 1;

  const pts = display.map((r, i) => {
    const x = (i / (display.length - 1)) * W;
    const y = H - ((r.duration - minD) / range) * (H - 10) - 4;
    return [x.toFixed(1), y.toFixed(1)];
  });

  const polyline = pts.map(p => p.join(',')).join(' ');
  const areaPath = `M${pts[0][0]},${H} ` +
    pts.map(p => `L${p[0]},${p[1]}`).join(' ') +
    ` L${pts[pts.length-1][0]},${H} Z`;

  el.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <defs>
        <linearGradient id="durGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--accent)" stop-opacity=".25"/>
          <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <path d="${areaPath}" fill="url(#durGrad)"/>
      <polyline points="${polyline}" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
      ${pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="2.5" fill="var(--accent)" opacity=".8">
        <title>${fmtDur(display[i].duration)} · ${fmtDate(display[i].timestamp)}</title>
      </circle>`).join('')}
    </svg>`;
}

// ── Tab switch ─────────────────────────────────────────────────────────────
window.switchTab = function(view, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('overallView').style.display = view === 'overall' ? 'block' : 'none';
  const tv = document.getElementById('testView');
  tv.style.display = view === 'test' ? 'block' : 'none';
  if (view === 'test') tv.classList.add('active');

  // Keep sidebar nav in sync with which tab is active
  document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
  const navId = view === 'test' ? 'nav-search' : 'nav-dashboard';
  document.getElementById(navId)?.classList.add('active');
  currentPage = view === 'test' ? 'search' : 'dashboard';
};

function buildTrendMiniPanel(label, values, display, fmt, color, higherIsBetter) {
  const current = values[values.length - 1] ?? 0;
  const prev    = values[values.length - 2] ?? current;
  const delta   = prev !== 0 ? ((current - prev) / Math.abs(prev) * 100) : 0;
  const deltaGood = higherIsBetter ? delta >= 0 : delta <= 0;
  const deltaStr  = delta === 0 ? t('trends_stable')
    : `${delta > 0 ? '+' : ''}${delta.toFixed(0)}${t('trends_vs_prev')}`;
  const deltaColor = delta === 0 ? 'var(--muted)' : deltaGood ? 'var(--pass)' : 'var(--fail)';

  if (values.length < 2) {
    return `<div class="trend-mini-panel">
      <div class="trend-mini-title">${label}</div>
      <div class="trend-mini-current" style="color:${color}">${fmt(current)}</div>
      <div style="color:var(--muted);font-family:var(--mono);font-size:11px">${t('trends_not_enough')}</div>
    </div>`;
  }

  const W = 280, H = 55;
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;

  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = H - ((v - minV) / range) * (H - 8) - 4;
    return [x.toFixed(1), y.toFixed(1)];
  });

  const polyline = pts.map(p => p.join(',')).join(' ');
  const areaPath = `M${pts[0][0]},${H} ${pts.map(p=>`L${p[0]},${p[1]}`).join(' ')} L${pts[pts.length-1][0]},${H} Z`;

  const dotsSvg = pts.map((p, i) =>
    `<circle cx="${p[0]}" cy="${p[1]}" r="2.5" fill="${color}" opacity=".85">
      <title>${fmt(values[i])} · ${fmtDate(display[i].timestamp)}</title>
    </circle>`
  ).join('');

  return `
    <div class="trend-mini-panel">
      <div class="trend-mini-title">
        ${label}
        <span style="color:${deltaColor};font-size:10px">${deltaStr}</span>
      </div>
      <div class="trend-mini-current" style="color:${color}">${fmt(current)}</div>
      <div class="trend-mini-svg">
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
          <defs>
            <linearGradient id="tg-${label.replace(/\s/g,'')}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="${color}" stop-opacity=".2"/>
              <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <path d="${areaPath}" fill="url(#tg-${label.replace(/\s/g,'')})"/>
          <polyline points="${polyline}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          ${dotsSvg}
        </svg>
      </div>
      <div class="trend-mini-footer">
        <span>${t('trends_min')} ${fmt(Math.min(...values))}</span>
        <span>${t('trends_avg')} ${fmt(values.reduce((a,b)=>a+b,0)/values.length)}</span>
        <span>${t('trends_max')} ${fmt(Math.max(...values))}</span>
      </div>
    </div>`;
}
