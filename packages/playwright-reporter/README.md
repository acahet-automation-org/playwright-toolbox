# @acahet/playwright-reporter

A self-hosted Playwright test history dashboard — no SaaS, no subscriptions, no external services. A custom reporter writes a local JSON index and regenerates the dashboard HTML after every run, so everything stays in sync automatically.

In this workspace, the package source is located at `packages/playwright-reporter`.

## Install

```bash
npm install -D @acahet/playwright-reporter
```

## Quick start

### 1. Register the reporter in `playwright.config.ts`

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
	reporter: [
		['html'],
		[
			'@acahet/playwright-reporter/reporter',
			{
				historyDir: 'dashboard/test-history', // where to write dashboard files
				projectName: 'your project name',
				brandName: 'your brand name',
				pageTitle: 'your title',
				maxRuns: 10, // optional, default is 30
			},
		],
	],
	use: {
		trace: 'on-first-retry',
		screenshot: 'on', // required for the gallery page
	},
});
```

### 2. Run tests and serve the dashboard

```bash
npx playwright test
npx serve <your historyDir>
# e.g. npx serve dashboard/test-history
```

Open `http://localhost:3000` — the dashboard always shows the latest run.

After every `npx playwright test`, the reporter automatically:
- Updates `history-index.json` with the new run
- Regenerates `index.html` with your current config injected

---

## Features

### Reporter

- Records every test run to `history-index.json`
- Captures pass, fail, flaky, skipped counts and total duration per run
- Stores per-test: title, file, project, duration, status, error message, tags, and Playwright annotations
- Detects flaky tests automatically — passed on retry after a prior failure
- Copies failure artifacts (trace + screenshot) into a per-run directory scoped to the specific failing test
- Retains the last **N runs** (default 30) as the single retention policy — index and disk stay in sync
- Orphan guard removes any run directories not referenced in the index
- Regenerates `index.html` with injected config after every run
- Error boundary in `onEnd` — reporter failures never affect test exit codes
- Skips `setup` project tests
- Requires Playwright ≥ 1.42

### Dashboard pages

**Dashboard**

- Suite health grade (A–F) on the latest run: 60% pass rate, 30% stability, 10% performance
- Latest run stat cards: pass rate, passed, failed, flaky, skipped, total, duration
- Clicking passed / failed / flaky / skipped filters that run's test list instantly
- Stacked bar chart across last 30 runs with hover tooltip
- Run duration line chart
- Per-test view: search by name, project, or tag; sparkline of last 10 runs per card

**Test detail** (click any test card)

- Full run history with date, runId, status, duration
- Duration-over-time mini chart with min / avg / max and `±% vs prev` delta
- Failure reason grouping — normalises error messages to surface recurring patterns
- Annotation support: `title` shown before the error, `description` in the header
- Playwright error collapsed by default, expandable on click

**Trends**

- 4 charts across last 30 runs: Pass rate, Duration, Flaky count, Slow count
- Each panel shows current value, delta vs previous run, and min / avg / max

**Gallery**

- Grid of failure screenshots grouped by run
- Lightbox on click, Escape to close

**Sidebar**

- Navigate: Dashboard, Trends, Search tests, Gallery
- Tag and Spec filter chips auto-populated from your test data
- Recent runs list — click any run to scroll and auto-expand it

**Run cards**

- Collapsed by default, showing failed + flaky only
- `SLOW` badge on tests above 1.5× the P75 duration of that run
- Errors collapsed inline, expandable per test
- Artifact links: download trace or screenshot per test

---

## Options

| Option        | Type     | Default                           | Description                                         |
| ------------- | -------- | --------------------------------- | --------------------------------------------------- |
| `projectName` | `string` | `''`                              | Label shown in topbar/footer                        |
| `brandName`   | `string` | `'pw_dashboard'`                  | Brand label shown in top-left                       |
| `pageTitle`   | `string` | `'Test History Dashboard'`        | Browser tab title                                   |
| `historyDir`  | `string` | `'./dashboard/test-history'`      | Where to write/read dashboard files and run history |
| `maxRuns`     | `number` | `30`                              | How many runs to keep in the index and on disk      |

All options are set directly in `playwright.config.ts` reporter options.

---

## Troubleshooting

- `history-index.json` is missing: run `npx playwright test` at least once.
- `index.html` missing or stale: run `npx playwright test` — the reporter regenerates it after every run.
- Dashboard loads but shows no data: ensure `historyDir` in your reporter options points to the same directory you're serving.

---

## Using annotations

```ts
test('checkout fails with expired card', async ({ page }) => {
	test.info().annotations.push(
		{ type: 'title', description: 'Known payment gateway timeout' },
		{
			type: 'description',
			description: 'Card validation times out after 30s under load',
		},
	);
	// test body
});
```

The `title` annotation appears as a prominent label before the Playwright error in run history. The `description` appears in the test detail header. Any other annotation types appear as chips under the test name.

---

## Using with Azure App Testing

Create a thin wrapper config — your reporter and test code stay untouched:

```ts
// playwright.service.config.ts
import { defineConfig } from '@playwright/test';
import { getServiceConfig } from '@azure/microsoft-playwright-testing';
import baseConfig from './playwright.config';

export default defineConfig(baseConfig, getServiceConfig(baseConfig), {
	reporter: [
		['list'],
		['@azure/microsoft-playwright-testing/reporter'],
		['@acahet/playwright-reporter'],
	],
});
```

Run with Azure: `npx playwright test --config=playwright.service.config.ts`

To detach: delete the service config, remove the package. Zero changes to tests.

---

## File structure after setup

```
your-project/
└── <historyDir>/
	├── index.html              ← generated by reporter after every run
	├── history-index.json      ← generated by reporter after every run
	└── runs/
		└── <run-id>/
			├── <test>-trace.zip
			└── <test>-screenshot.png
```

Add to `.gitignore`:

```
<historyDir>/runs/
<historyDir>/history-index.json
```

---

## Requirements

- Playwright ≥ 1.42
- Node.js ≥ 18

## License

MIT
