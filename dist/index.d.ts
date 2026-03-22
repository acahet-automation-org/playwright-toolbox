/**
 * @acahet/pw-standard
 *
 * Root barrel. Prefer importing from the specific entry point
 * to keep bundle size small:
 *
 *   import plugin  from '@acahet/pw-standard/eslint'
 *   import { baseConfig } from '@acahet/pw-standard/playwright'
 *   import { BasePage }   from '@acahet/pw-standard/base'
 *
 * This barrel is available for tooling that needs everything at once.
 */
export { default as eslintPlugin } from './eslint/index';
//# sourceMappingURL=index.d.ts.map