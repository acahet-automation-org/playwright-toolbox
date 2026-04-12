// ── Bootstrap ──────────────────────────────────────────────────────────────
async function init() {
  // Apply config values that need JS to set
  document.title = CONFIG.pageTitle;
  const bn = document.getElementById('brandName');
  if (bn && CONFIG.brandName) bn.textContent = CONFIG.brandName;
  const pn = document.getElementById('projectName');
  if (pn && CONFIG.projectName) pn.textContent = CONFIG.projectName;
  const fp = document.getElementById('footerProject');
  if (fp && CONFIG.projectName) fp.textContent = CONFIG.projectName;

  try {
    const res = await fetch(`${CONFIG.historyIndexPath}?ts=${Date.now()}`, {
      cache: 'no-store'
    });
    if (!res.ok) throw new Error('fetch failed');
    const data = await res.json();
    if (!data.runs?.length) { renderEmpty(); return; }
    runs = data.runs;
    render();
    requestAnimationFrame(() => { if (!localStorage.getItem('pw-reporter-tour-done')) startTour(); });
  } catch {
    // No history-index.json found — show embedded demo data so the dashboard is
    // immediately explorable. Once the user runs their own tests and generates
    // history-index.json, this branch is never reached and only real data is shown.
    runs = DEMO_RUNS;
    render();
    const meta = document.getElementById('topbarMeta');
    if (meta) meta.innerHTML += ' &nbsp;<span style="font-family:var(--mono);font-size:10px;font-weight:600;background:rgba(124,159,255,.15);color:var(--accent2);padding:1px 6px;border-radius:4px;letter-spacing:.05em">DEMO</span>';
    requestAnimationFrame(() => { if (!localStorage.getItem('pw-reporter-tour-done')) startTour(); });
  }
}

// ── Go ─────────────────────────────────────────────────────────────────────
init();
