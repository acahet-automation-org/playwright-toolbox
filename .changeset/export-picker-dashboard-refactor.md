---
"@acahet/playwright-reporter": minor
---

feat(dashboard): per-run export picker + maintainable source split

**New feature — Per-run export picker (PDF & CSV)**

Both export buttons now support selecting a specific historical run to export, not just the latest:

- **PDF**: converted to a split button (main click exports latest; chevron reveals a dropdown with "Latest run" and "Select run…")
- **CSV**: third dropdown item "Select run…" added alongside the existing "Latest run" and "All runs" options
- Selecting "Select run…" opens a modal listing all recorded runs with date, pass/fail/flaky badges and duration — click any row to export that run
- PDF dropdown layout mirrors the CSV split-button pattern exactly (same sizing, icons, i18n keys)
- New i18n keys added for EN and IT: `export_select_run`, `erp_title_pdf`, `erp_title_csv`

**Refactor — dashboard source split**

`dashboard/index.html` was a ~3 500-line monolith; it is now assembled from maintainable source files:

- `dashboard/src/styles/` — 5 CSS files (`variables`, `layout`, `components`, `charts`, `print`)
- `dashboard/src/js/` — 19 JS files in dependency order (pure concatenation, no module syntax)
- `dashboard/src/components/` — 3 HTML fragments (`topbar`, `sidebar`, `main-shell`)
- `dashboard/config.template.js` — CONFIG block template used by `injectConfig()` in the reporter
- `dashboard/build.mjs` — zero-dependency Node.js script that assembles `index.html`; run via `npm run build:dashboard`
- `dashboard/index.html` remains the committed, published build output — no change to the npm package contents
- `dashboard/src/`, `build.mjs`, and `config.template.js` are excluded from the published package via `.npmignore`

**End-user workflow**

Added `serve` as a production dependency and a `serve:dashboard` script so users can view the dashboard locally after a test run:

```bash
npx serve <your-dashboard-output-dir>
# or open index.html directly in a browser
```
