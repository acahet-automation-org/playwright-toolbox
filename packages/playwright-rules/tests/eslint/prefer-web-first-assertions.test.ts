import { RuleTester } from 'eslint';
import rule from '../../src/eslint/rules/prefer-web-first-assertions';

const tester = new RuleTester({
	parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

tester.run('prefer-web-first-assertions', rule, {
	valid: [
		{
			code: `await expect(page.getByTestId('title')).toHaveText('Hello');`,
		},
		{ code: `const text = await page.locator('h1').innerText();` },
	],
	invalid: [
		{
			code: `expect(await page.locator('h1').innerText()).toBe('Hello');`,
			errors: [{ messageId: 'preferWebFirst' }],
		},
		{
			code: `expect(await page.locator('button').isVisible()).toBe(true);`,
			errors: [{ messageId: 'preferWebFirst' }],
		},
	],
});
