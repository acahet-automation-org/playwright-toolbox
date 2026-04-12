// ── Utilities ──────────────────────────────────────────────────────────────
function esc(str) {
  const d = document.createElement('div');
  d.textContent = str ?? '';
  return d.innerHTML;
}

// For use in src/href/data-* attributes — only escapes double-quotes, leaves path chars intact
function safePath(p) { return (p ?? '').replace(/"/g, '&quot;'); }

function fmtDate(ts) {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function fmtDur(ms) {
  if (ms < 1000) return ms + 'ms';
  if (ms < 60000) return (ms / 1000).toFixed(1) + 's';
  const m = Math.floor(ms / 60000);
  const s = ((ms % 60000) / 1000).toFixed(0).padStart(2, '0');
  return `${m}m ${s}s`;
}

function statusColor(s) {
  return { passed:'var(--pass)', failed:'var(--fail)', flaky:'var(--flaky)', skipped:'var(--skip)' }[s] ?? 'var(--skip)';
}

function statusClass(s) {
  return { passed:'pass', failed:'fail', flaky:'flaky', skipped:'skip' }[s] ?? 'skip';
}
