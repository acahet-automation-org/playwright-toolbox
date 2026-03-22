# Playwright Toolbox Packages

This repository root contains two independent npm packages:

1. `@acahet/pw-standard` (root package)
2. `@acahet/playwright-history-dashboard` (subpackage in `playwright-history-dashboard/`)

## 1) @acahet/pw-standard

Shared Playwright standards package with:

- custom ESLint plugin/rules for Playwright tests
- base classes placeholder exports
- Playwright config placeholder exports
- reusable tsconfig presets

Source layout:

- `playwright-rules/src`
- tests: `playwright-rules/tests`
- build config: `playwright-rules/tsconfig.json`
- test config: `playwright-rules/jest.config.js`

### Install

```bash
npm i -D @acahet/pw-standard
```

### Usage examples

#### ESLint plugin

```ts
import plugin from '@acahet/pw-standard/eslint';

export default [
	{
		plugins: {
			'playwright-standards': plugin,
		},
		rules: {
			'playwright-standards/no-wait-for-timeout': 'error',
			'playwright-standards/no-brittle-selectors': 'error',
		},
	},
];
```

#### TSConfig presets

```json
{
	"extends": "@acahet/pw-standard/tsconfig/base"
}
```

## 2) @acahet/playwright-history-dashboard

Self-hosted Playwright history reporter + static HTML dashboard.

Path in this repo:

- `playwright-history-dashboard/`

### Install

```bash
npm i -D @acahet/playwright-history-dashboard
```

### Usage examples

#### Add reporter

```ts
reporter: [
	['html'],
	[
		'@acahet/playwright-history-dashboard/reporter',
		{ historyDir: 'tests/report/test-history' },
	],
];
```

#### Initialize dashboard page

```bash
npx pw-history-init
```

For full dashboard setup details, see:

- `playwright-history-dashboard/README.md`

## Local development

From repository root (`package/`):

```bash
npm run build
npm test
```

From dashboard package:

```bash
cd playwright-history-dashboard
npm run build
```

## Publishing

- root package publishes `@acahet/pw-standard`
- subpackage publishes `@acahet/playwright-history-dashboard`

See release steps in:

- `playwright-history-dashboard/RELEASING.md`
