import { RuleTester } from 'eslint';
import rule from '../../src/eslint/rules/no-wait-for-timeout';

const tester = new RuleTester({
	parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
});

tester.run('no-wait-for-timeout', rule, {
	valid: [
		{
			code: `async function t() { await page.locator('[data-testid="modal"]').waitFor(); }`,
		},
		{
			code: `async function t() { await expect(page.getByTestId('spinner')).toBeHidden(); }`,
		},
		{
			code: `async function t() { await page.waitForResponse(r => r.url().includes('/api')); }`,
		},
	],
	invalid: [
		{
			code: `async function t() { await page.waitForTimeout(2000); }`,
			errors: [{ messageId: 'noWaitForTimeout' }],
		},
		{
			code: `async function t() { await frame.waitForTimeout(500); }`,
			errors: [{ messageId: 'noWaitForTimeout' }],
		},
	],
});
