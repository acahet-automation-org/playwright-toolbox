const buttons = document.querySelectorAll('.theme-btn');

function applyTheme(theme) {
  buttons.forEach(b => b.classList.remove('active'));
  document.querySelector(`.theme-btn[data-theme="${theme}"]`)?.classList.add('active');
  if (theme === 'system') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    const theme = btn.dataset.theme;
    localStorage.setItem('theme', theme);
    applyTheme(theme);
  });
});

const saved = localStorage.getItem('theme');
applyTheme(saved ?? 'system');
