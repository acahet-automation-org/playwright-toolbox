import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const src = (p) => readFileSync(join(import.meta.dirname, 'src', p), 'utf-8');

const css = [
  src('styles/variables.css'),
  src('styles/layout.css'),
  src('styles/components.css'),
  src('styles/charts.css'),
  src('styles/print.css'),
].join('\n');

const js = [
  src('js/state.js'),
  src('js/utils.js'),
  src('js/i18n.js'),
  src('js/regression.js'),
  src('js/theme.js'),
  src('js/lightbox.js'),
  src('js/tour.js'),
  src('js/export.js'),
  src('js/render-sidebar.js'),
  src('js/render-charts.js'),
  src('js/render-test-grid.js'),
  src('js/render-test-detail.js'),
  src('js/render-runs.js'),
  src('js/render-main.js'),
  src('js/render-trends.js'),
  src('js/render-gallery.js'),
  src('js/render-quarantine.js'),
  src('js/navigation.js'),
  src('js/init.js'),
].join('\n');

const configBlock = readFileSync(
  join(import.meta.dirname, 'config.template.js'),
  'utf-8',
);

const topbar = readFileSync(join(import.meta.dirname, 'src/components/topbar.html'), 'utf-8');
const sidebar = readFileSync(join(import.meta.dirname, 'src/components/sidebar.html'), 'utf-8');
const mainShell = readFileSync(join(import.meta.dirname, 'src/components/main-shell.html'), 'utf-8');

// Preserve the exact <head> from the original (fonts, meta, title)
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test History Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
${css}
  </style>
</head>
<body>
<div class="shell">

${topbar}

${sidebar}
${mainShell}
</div>

<script>
${configBlock}
${js}
</script>
</body>
</html>`;

writeFileSync(join(import.meta.dirname, 'index.html'), html, 'utf-8');
console.log('dashboard/index.html rebuilt.');
