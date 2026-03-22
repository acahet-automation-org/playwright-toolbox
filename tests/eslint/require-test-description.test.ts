import { RuleTester } from 'eslint';
import rule from '../../src/eslint/rules/require-test-description';

const tester = new RuleTester({
	parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
});

tester.run('require-test-description', rule, {
	valid: [
		{
			code: `test('user can submit the login form with valid credentials nrt-101', async () => {});`,
		},
		{
			code: `it('admin sees the delete button when viewing another user nrt-202', async () => {});`,
		},
		{
			// custom minLength option
			code: `test('okay nrt-303', async () => {});`,
			options: [{ minLength: 3 }],
		},
	],
	invalid: [
		{
			// only test ID at the end leaves no meaningful description → tooShort
			code: `test('nrt-1', async () => {});`,
			errors: [{ messageId: 'tooShort' }],
		},
		{
			// missing nrt-xxx suffix → missingTestId
			code: `test('user can submit the login form with valid credentials', async () => {});`,
			errors: [{ messageId: 'missingTestId' }],
		},
		{
			// id not at the end → missingTestId
			code: `test('nrt-404 user can submit the login form with valid credentials', async () => {});`,
			errors: [{ messageId: 'missingTestId' }],
		},
		{
			// matches VAGUE_PATTERNS after removing trailing test ID → vagueDescription
			code: `test('fixme nrt-404', async () => {});`,
			errors: [{ messageId: 'vagueDescription' }],
		},
		{
			// matches /^test\s*\d*$/i after removing trailing test ID → vagueDescription
			code: `test('test      1 nrt-505', async () => {});`,
			errors: [{ messageId: 'vagueDescription' }],
		},
	],
});
