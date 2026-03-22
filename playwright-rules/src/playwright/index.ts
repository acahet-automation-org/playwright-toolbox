/**
 * @acahet/pw-standard/playwright
 *
 * Shared Playwright config presets.
 *
 * Usage in a consuming project's playwright.config.ts:
 *
 *   import { baseConfig } from '@acahet/pw-standard/playwright';
 *   import { defineConfig } from '@playwright/test';
 *
 *   export default defineConfig({
 *     ...baseConfig,
 *     use: { ...baseConfig.use, baseURL: 'http://localhost:3000' },
 *   });
 */

// Configs will be added here — e.g.:
// export { baseConfig } from './base.config';
// export { ciConfig }   from './ci.config';

export {};
