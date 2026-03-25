# @acahet/pw-standard

Shared Playwright standards package:

- ESLint plugin and custom rules
- base classes/fixtures entrypoint
- shared tsconfig presets
- compatibility bridge export for Playwright config (`@acahet/pw-standard/playwright`)

## Install

```bash
npm i -D @acahet/pw-standard
```

## Usage

### ESLint plugin

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

### TSConfig preset

```json
{
	"extends": "@acahet/pw-standard/tsconfig/base"
}
```

### Playwright config compatibility export

```ts
import * as configPreset from '@acahet/pw-standard/playwright';
```

New projects should import Playwright config presets from `@acahet/playwright-configs` directly.
