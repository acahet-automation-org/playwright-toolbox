# @acahet/playwright-reporter

## 1.1.1

### Patch Changes

- 9b0f365: chore(deps): automated dependency update

## 1.1.0

### Minor Changes

- 4d2b298: feat(dashboard): per-run export picker + maintainable source split

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

## 1.0.0

### Major Changes

- 2ac7236: ## `@acahet/playwright-reporter` — Major

  ### What changed

  - `TestInfo` entries in `history-index.json` now include a `failureSection` field that records which describe-block/section the failure occurred in.
  - The dashboard `CONFIG` block gains locale keys supporting English (`en`) and Italian (`it`) translations; the generated `index.html` is no longer language-agnostic.

  ### Why

  - Failure-point tracking lets the dashboard distinguish whether a repeated failure is regressing in the same section or surfacing in a new one, enabling more actionable triage.
  - Italian translation makes the dashboard usable for Italian-speaking teams without forking the HTML template.

  ### How to migrate

  1. Delete (or archive) the existing `history-index.json` and `runs/` directory inside your `historyDir` — old entries lack `failureSection` and will render as `undefined` in the new dashboard.
  2. Delete the generated `index.html` in `historyDir`; it will be recreated with the new `CONFIG` on the next test run.
  3. No changes to `playwright.config.ts` are required. If a `locale` option is exposed, you may optionally add `locale: "it"` (or `"en"`) to your reporter options.

  ***

  ## `@acahet/playwright-configs` / `@acahet/playwright-rules` — Minor

  - Updated peer dependencies and internal tooling to align with the reporter changes above.

## 0.1.4

### Patch Changes

- a3480cc: implement csv, quaratine, regression trend

## 0.1.3

### Patch Changes

- 3beae43: chore(deps): automated dependency update

## 0.1.2

### Patch Changes

- 6b543eb: remove serve from depencies

## 0.1.1

### Patch Changes

- 74c8972: dependencies

## 0.1.0

### Minor Changes

- bc30686: update dependencies, fix test in rules, remove script dependancy in reporter and add theme selection

### Patch Changes

- f2eeac1: chore(deps): automated dependency update

## 0.0.2

### Patch Changes

- b8a5bb6: initial release
