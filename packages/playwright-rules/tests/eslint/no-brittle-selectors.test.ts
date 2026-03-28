import { RuleTester } from 'eslint';
import rule from '../../src/eslint/rules/no-brittle-selectors';

const tester = new RuleTester({
	languageOptions: { ecmaVersion: 2020, sourceType: 'module' },
});

tester.run('no-brittle-selectors', rule, {
	valid: [
		{
			code: `async function t() { await page.getByTestId('submit-button').click(); }`,
		},
		{
			code: `async function t() { await page.getByRole('button', { name: 'Submit' }).click(); }`,
		},
		{
			code: `async function t() { await page.locator('[data-testid="modal"]').click(); }`,
		},
	],
	invalid: [
		{
			code: `async function t() { await page.locator('.btn-primary').click(); }`,
			errors: [{ messageId: 'brittleSelector' }],
		},
		{
			code: `async function t() { await page.locator('#submit-btn').click(); }`,
			errors: [{ messageId: 'brittleSelector' }],
		},
		{
			code: `async function t() { await page.locator('div > span > button').click(); }`,
			errors: [{ messageId: 'brittleSelector' }],
		},
	],
});
