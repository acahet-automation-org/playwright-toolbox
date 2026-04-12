window.navTo = function(view, el) {
  document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
  currentPage = view;

  const mc = document.getElementById('mainContent');

  if (view === 'dashboard') {
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (view === 'trends') {
    mc.innerHTML = '<div id="trendsPage"></div>';
    renderTrendsPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (view === 'gallery') {
    mc.innerHTML = '<div id="galleryPage"></div>';
    renderGalleryPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (view === 'search') {
    render();
    setTimeout(() => {
      const testBtn = document.querySelectorAll('.tab-btn')[1];
      if (testBtn) switchTab('test', testBtn);
      document.getElementById('testSearch')?.focus();
    }, 50);
  } else if (view === 'quarantine') {
    mc.innerHTML = '<div id="quarantinePage"></div>';
    renderQuarantinePage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

window.jumpToRun = function(idx) {
  // Highlight sidebar item
  document.querySelectorAll('.sidebar-run').forEach((r, i) => r.classList.toggle('active', i === idx));
  // Open that run card in the list
  const card = document.getElementById(`run-${idx}`);
  if (!card) return;
  card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  // Auto-open if not already open
  const detail = document.getElementById(`detail-${idx}`);
  if (detail && !detail.classList.contains('open')) toggleRun(idx);
};

// ── Latest run filter ──────────────────────────────────────────────────────
window.filterLatestRun = function(status) {
  activeFilter = status;
  const latest = runs[0];
  const latestRate = latest.totalTests > 0 ? (latest.passed / latest.totalTests * 100).toFixed(1) : '0.0';
  const totalRuns = runs.length;
  const avgPass = runs.reduce((s, r) => s + (r.totalTests > 0 ? r.passed / r.totalTests * 100 : 0), 0) / runs.length;
  renderMainContent(latest, totalRuns, avgPass, latestRate);
};

window.clearFilter = function() {
  activeFilter = null;
  const latest = runs[0];
  const latestRate = latest.totalTests > 0 ? (latest.passed / latest.totalTests * 100).toFixed(1) : '0.0';
  const totalRuns = runs.length;
  const avgPass = runs.reduce((s, r) => s + (r.totalTests > 0 ? r.passed / r.totalTests * 100 : 0), 0) / runs.length;
  renderMainContent(latest, totalRuns, avgPass, latestRate);
};

// ── i18n ───────────────────────────────────────────────────────────────────
function updateStaticElements() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.dataset.i18nTitle);
  });
}

function rerenderCurrentPage() {
  const mc = document.getElementById('mainContent');
  if (!mc) return;
  if (currentPage === 'dashboard' || currentPage === 'search') {
    render();
  } else if (currentPage === 'trends') {
    mc.innerHTML = '<div id="trendsPage"></div>';
    renderTrendsPage();
  } else if (currentPage === 'gallery') {
    mc.innerHTML = '<div id="galleryPage"></div>';
    renderGalleryPage();
  } else if (currentPage === 'quarantine') {
    mc.innerHTML = '<div id="quarantinePage"></div>';
    renderQuarantinePage();
  }
  updateStaticElements();
}

function applyLocale(locale) {
  currentLocale = locale;
  localStorage.setItem('pw-reporter-locale', locale);
  document.querySelectorAll('.lang-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === locale);
  });
  updateStaticElements();
  if (runs.length) rerenderCurrentPage();
}

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => applyLocale(btn.dataset.lang));
});
applyLocale(detectLocale());
