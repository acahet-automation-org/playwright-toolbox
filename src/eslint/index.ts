import { RuleMap, ConfigRules } from './types';
import noWaitForTimeout from './rules/no-wait-for-timeout';
import noBrittleSelectors from './rules/no-brittle-selectors';
import requireTestDescription from './rules/require-test-description';
import noPagePause from './rules/no-page-pause';
import noFocusedTests from './rules/no-focused-tests';
import preferWebFirstAssertions from './rules/prefer-web-first-assertions';

// ─── Rule registry ────────────────────────────────────────────────────────────
// Add new rules here — they are automatically picked up by all configs below.

const rules: RuleMap = {
	'no-wait-for-timeout': noWaitForTimeout,
	'no-brittle-selectors': noBrittleSelectors,
	'require-test-description': requireTestDescription,
	'no-page-pause': noPagePause,
	'no-focused-tests': noFocusedTests,
	'prefer-web-first-assertions': preferWebFirstAssertions,
};

// ─── Shared parser options ────────────────────────────────────────────────────

const PARSER_OPTIONS = {
	ecmaVersion: 2020,
	sourceType: 'module' as const,
};

// ─── Helper: prefix all rule keys with the plugin name ───────────────────────

function prefixedRules(severity: 'error' | 'warn'): ConfigRules {
	return Object.keys(rules).reduce<ConfigRules>((acc, key) => {
		const meta = rules[key].meta;
		if (meta.docs?.recommended) {
			acc[`playwright-standards/${key}`] = severity;
		}
		return acc;
	}, {});
}

// ─── Configs ──────────────────────────────────────────────────────────────────

const configs = {
	/**
	 * `recommended` — all recommended rules as errors.
	 * Best for CI enforcement.
	 */
	recommended: {
		plugins: ['playwright-standards'],
		parserOptions: PARSER_OPTIONS,
		rules: prefixedRules('error'),
	},

	/**
	 * `strict` — all rules (including non-recommended) as errors.
	 */
	strict: {
		plugins: ['playwright-standards'],
		parserOptions: PARSER_OPTIONS,
		rules: Object.keys(rules).reduce<ConfigRules>((acc, key) => {
			acc[`playwright-standards/${key}`] = 'error';
			return acc;
		}, {}),
	},

	/**
	 * `warn` — all recommended rules as warnings.
	 * Useful when adopting the plugin incrementally.
	 */
	warn: {
		plugins: ['playwright-standards'],
		parserOptions: PARSER_OPTIONS,
		rules: prefixedRules('warn'),
	},
};

// ─── Plugin export ────────────────────────────────────────────────────────────

const plugin = {
	meta: {
		name: '@acahet/pw-standard',
		version: '1.0.0',
	},
	rules,
	configs,
};

export default plugin;

// Named exports for consumers who import rules individually
export { rules, configs };
export type { RuleMap, ConfigRules };
