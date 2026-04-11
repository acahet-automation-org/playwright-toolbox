// ── Gallery page ────────────────────────────────────────────────────────────
function renderGalleryPage() {
  const el = document.getElementById('galleryPage');
  if (!el) return;

  const isImagePath = p => /\.(png|jpg|jpeg|webp)$/i.test(p);

  // Support both artifacts.screenshot (old reporter) and attachmentPaths images (new reporter)
  const groups = runs.map(run => {
    const shots = (run.allTests ?? []).flatMap(t => {
      if (t.artifacts?.screenshot) return [{ src: t.artifacts.screenshot, t }];
      const fromAttachments = (t.attachmentPaths ?? []).filter(isImagePath);
      return fromAttachments.length ? [{ src: fromAttachments[0], t }] : [];
    });
    return { run, shots };
  }).filter(g => g.shots.length > 0);

  if (!groups.length) {
    el.innerHTML = `
      <div class="section-header" style="margin-bottom:20px">
        <span class="section-title">${t('gallery_title')}</span>
      </div>
      <div class="gallery-empty">
        ${t('gallery_none')}<br>${t('gallery_hint')}
      </div>`;
    return;
  }

  const totalShots = groups.reduce((s, g) => s + g.shots.length, 0);

  el.innerHTML = `
    <div class="section-header" style="margin-bottom:20px">
      <span class="section-title">${totalShots === 1 ? t('gallery_title_with_count', {n: totalShots}) : t('gallery_title_with_count_pl', {n: totalShots})}</span>
    </div>
    ${groups.map(({ run, shots }) => `
      <div class="gallery-run-group">
        <div class="gallery-run-header">
          <span class="gallery-run-dot" style="background:${run.failed===0?'var(--pass)':'var(--fail)'}"></span>
          <span class="gallery-run-ts">${fmtDate(run.timestamp)}</span>
          <span class="gallery-run-count">${shots.length !== 1 ? t('gallery_screenshots') : t('gallery_screenshot')} (${shots.length})</span>
        </div>
        <div class="gallery-grid">
          ${shots.map(({ src, t }) => `
            <div class="gallery-item" data-src="${safePath(src)}" data-title="${esc(t.title)}">
              <div class="gallery-img-wrap">
                <img src="${safePath(src)}" alt="${esc(t.title)}"
                     onerror="this.parentElement.innerHTML='<span class=\\'gallery-img-placeholder\\'>📷</span>'">
              </div>
              <div class="gallery-item-info">
                <div class="gallery-item-title">${esc(t.title)}</div>
                <div class="gallery-item-meta">${esc(t.project)} · ${fmtDur(t.duration)}</div>
              </div>
            </div>`).join('')}
        </div>
      </div>`).join('')}`;

  // Event delegation — no inline onclick with interpolated paths
  el.onclick = function(e) {
    const card = e.target.closest('.gallery-item');
    if (!card) return;
    if (card.dataset.src) openLightbox(card.dataset.src, card.dataset.title || '');
  };
}
