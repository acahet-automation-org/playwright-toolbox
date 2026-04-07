# @acahet/playwright-reporter

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
