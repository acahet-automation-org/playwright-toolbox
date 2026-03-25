# @acahet/playwright-configs

Shared Playwright config presets package.

## Install

```bash
npm i -D @acahet/playwright-configs
```

## Usage

```ts
import { defineConfig } from '@playwright/test';
import * as preset from '@acahet/playwright-configs';

export default defineConfig({
	...preset,
});
```

This package currently exports a placeholder root preset entry and is ready for incremental config extraction.
