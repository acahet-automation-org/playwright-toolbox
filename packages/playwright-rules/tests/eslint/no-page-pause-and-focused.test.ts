import { RuleTester } from 'eslint';
import noPagePause from '../../src/eslint/rules/no-page-pause';
import noFocusedTests from '../../src/eslint/rules/no-focused-tests';

const tester = new RuleTester({
	languageOptions: { ecmaVersion: 2020, sourceType: 'module' },
});

tester.run('no-page-pause', noPagePause, {
	valid: [{ code: `async function t() { await page.goto('/'); }` }],
	invalid: [
		{
			code: `async function t() { await page.pause(); }`,
			errors: [{ messageId: 'noPagePause' }],
		},
	],
});

tester.run('no-focused-tests', noFocusedTests, {
	valid: [
		{ code: `test('a normal test', async () => {});` },
		{
			code: `test.skip('skipped test', async () => {});`,
			options: [{ allowSkip: true }],
		},
	],
	invalid: [
		{
			code: `test.only('focused test', async () => {});`,
			errors: [{ messageId: 'noOnly' }],
		},
		{
			code: `describe.only('focused describe', () => {});`,
			errors: [{ messageId: 'noOnly' }],
		},
		{
			code: `test.skip('skipped test', async () => {});`,
			errors: [{ messageId: 'noSkip' }],
		},
	],
});
