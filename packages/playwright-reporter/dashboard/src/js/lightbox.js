window.openLightboxKey = function(key) {
  const entry = _shotReg.get(key);
  if (!entry) return;
  openLightbox(entry.src, entry.title);
};

window.openLightbox = function(src, title) {
  const img = document.getElementById('lightboxImg');
  const lbl = document.getElementById('lightboxTitle');
  const lb  = document.getElementById('lightbox');
  if (!img || !lb) return;
  img.src = src;
  img.alt = title;
  if (lbl) lbl.textContent = title;
  lb.classList.add('open');
};

window.closeLightbox = function() {
  const lb  = document.getElementById('lightbox');
  const img = document.getElementById('lightboxImg');
  if (lb)  lb.classList.remove('open');
  if (img) img.src = '';
};

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
