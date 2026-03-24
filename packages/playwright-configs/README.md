# @acahet/playwright-config

Shared Playwright config presets package.

## Install

```bash
npm i -D @acahet/playwright-config
```

## Usage

```ts
import { defineConfig } from '@playwright/test';
import * as preset from '@acahet/playwright-config';

export default defineConfig({
	...preset,
});
```

This package currently exports a placeholder root preset entry and is ready for incremental config extraction.
