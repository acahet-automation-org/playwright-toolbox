// ── Guided tour ────────────────────────────────────────────────────────────
function getTourSteps() { return [
  {
    target: null,
    position: 'center',
    title: t('tour_0_title'),
    body: t('tour_0_body'),
  },
  {
    target: '.latest-run-section',
    position: 'bottom',
    title: t('tour_1_title'),
    body: t('tour_1_body'),
    beforeStep: () => {
      if (currentPage !== 'dashboard') navTo('dashboard', document.getElementById('nav-dashboard'));
    },
  },
  {
    target: '#runsList',
    position: 'top',
    title: t('tour_2_title'),
    body: t('tour_2_body'),
    beforeStep: () => {
      if (currentPage !== 'dashboard') navTo('dashboard', document.getElementById('nav-dashboard'));
    },
  },
  {
    target: () => document.querySelector('.screenshot-link'),
    position: 'top',
    title: t('tour_3_title'),
    body: t('tour_3_body'),
    beforeStep: () => {
      if (currentPage !== 'dashboard') navTo('dashboard', document.getElementById('nav-dashboard'));
      // Ensure the latest run is expanded so the artifact buttons are in the DOM
      const detail = document.getElementById('detail-0');
      if (detail && !detail.classList.contains('open')) toggleRun(0);
    },
  },
  {
    target: '#sidebar',
    position: 'right',
    title: t('tour_4_title'),
    body: t('tour_4_body'),
  },
  {
    target: '#sidebarFilters',
    position: 'right',
    title: t('tour_5_title'),
    body: t('tour_5_body'),
  },
  {
    target: '#nav-trends',
    position: 'right',
    title: t('tour_6_title'),
    body: t('tour_6_body'),
  },
  {
    target: '#nav-search',
    position: 'right',
    title: t('tour_7_title'),
    body: t('tour_7_body'),
  },
  {
    target: '#nav-gallery',
    position: 'right',
    title: t('tour_8_title'),
    body: t('tour_8_body'),
  },
  {
    target: '#nav-quarantine',
    position: 'right',
    title: t('tour_9_title'),
    body: t('tour_9_body'),
  },
  {
    target: () => {
      // Span both export buttons as one logical target
      const csv = document.getElementById('exportCsvWrap');
      const pdf = document.getElementById('exportBtn');
      if (!csv || !pdf) return document.getElementById('exportBtn');
      const a = csv.getBoundingClientRect();
      const b = pdf.getBoundingClientRect();
      return {
        getBoundingClientRect: () => ({
          top: Math.min(a.top, b.top),
          left: Math.min(a.left, b.left),
          right: Math.max(a.right, b.right),
          bottom: Math.max(a.bottom, b.bottom),
          width:  Math.max(a.right, b.right)  - Math.min(a.left, b.left),
          height: Math.max(a.bottom, b.bottom) - Math.min(a.top, b.top),
        }),
      };
    },
    position: 'bottom',
    title: t('tour_10_title'),
    body: t('tour_10_body'),
  },
]; }

let tourStepIdx = 0;

window.startTour = function() {
  tourStepIdx = 0;
  document.getElementById('tourOverlay').classList.add('active');
  goToTourStep(0);
};

window.endTour = function() {
  document.getElementById('tourOverlay').classList.remove('active');
  document.getElementById('tourSpotlight').style.display = 'none';
  localStorage.setItem('pw-reporter-tour-done', '1');
};

window.nextTourStep = function() {
  if (tourStepIdx >= getTourSteps().length - 1) { endTour(); return; }
  tourStepIdx++;
  goToTourStep(tourStepIdx);
};

window.prevTourStep = function() {
  if (tourStepIdx <= 0) return;
  tourStepIdx--;
  goToTourStep(tourStepIdx);
};

function goToTourStep(idx) {
  const steps      = getTourSteps();
  const step       = steps[idx];
  const overlay    = document.getElementById('tourOverlay');
  const spotlight  = document.getElementById('tourSpotlight');
  const card       = document.getElementById('tourCard');

  if (!overlay.classList.contains('active')) return;
  if (step.beforeStep) step.beforeStep();

  document.getElementById('tourStepLabel').textContent = t('tour_step_of', {n: idx + 1, total: steps.length});
  document.getElementById('tourTitle').textContent     = step.title;
  // Support \n line breaks in body
  const bodyEl = document.getElementById('tourBody');
  bodyEl.innerHTML = step.body.split('\n').map(l => l ? `<span>${esc(l)}</span>` : '<br>').join('<br>');
  document.getElementById('tourPrev').style.display   = idx === 0 ? 'none' : '';
  document.getElementById('tourNext').textContent     = idx === steps.length - 1 ? t('tour_done') : t('tour_next');

  // Resolve target element
  let target = step.target;
  if (typeof target === 'function') target = target();
  if (typeof target === 'string')   target = document.querySelector(target);

  if (!target || step.position === 'center') {
    spotlight.style.display = 'none';
    positionTourCard(card, null, 'center');
  } else {
    const rect = typeof target.getBoundingClientRect === 'function'
      ? target.getBoundingClientRect()
      : null;
    if (!rect) { spotlight.style.display = 'none'; positionTourCard(card, null, 'center'); return; }
    const pad = 8;
    spotlight.style.display  = 'block';
    spotlight.style.top      = `${rect.top    - pad}px`;
    spotlight.style.left     = `${rect.left   - pad}px`;
    spotlight.style.width    = `${rect.width  + pad * 2}px`;
    spotlight.style.height   = `${rect.height + pad * 2}px`;
    positionTourCard(card, rect, step.position);
  }
}

function positionTourCard(card, rect, position) {
  const cardW  = 300;
  const cardH  = card.offsetHeight || 220;
  const vw     = window.innerWidth;
  const vh     = window.innerHeight;
  const margin = 16;
  const gap    = 14;

  if (!rect || position === 'center') {
    card.style.left = `${Math.max(margin, (vw - cardW) / 2)}px`;
    card.style.top  = `${Math.max(margin, (vh - cardH) / 2)}px`;
    return;
  }

  let top, left;
  if (position === 'bottom') {
    top  = rect.bottom + gap;
    left = rect.left + (rect.width - cardW) / 2;
  } else if (position === 'top') {
    top  = rect.top - cardH - gap;
    left = rect.left + (rect.width - cardW) / 2;
  } else if (position === 'right') {
    top  = rect.top + (rect.height - cardH) / 2;
    left = rect.right + gap;
  } else { // left
    top  = rect.top + (rect.height - cardH) / 2;
    left = rect.left - cardW - gap;
  }

  // Clamp to viewport
  card.style.left = `${Math.max(margin, Math.min(vw - cardW - margin, left))}px`;
  card.style.top  = `${Math.max(margin, Math.min(vh - cardH - margin, top))}px`;
}
