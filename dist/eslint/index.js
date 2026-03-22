"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configs = exports.rules = void 0;
const no_wait_for_timeout_1 = __importDefault(require("./rules/no-wait-for-timeout"));
const no_brittle_selectors_1 = __importDefault(require("./rules/no-brittle-selectors"));
const require_test_description_1 = __importDefault(require("./rules/require-test-description"));
const no_page_pause_1 = __importDefault(require("./rules/no-page-pause"));
const no_focused_tests_1 = __importDefault(require("./rules/no-focused-tests"));
const prefer_web_first_assertions_1 = __importDefault(require("./rules/prefer-web-first-assertions"));
// ─── Rule registry ────────────────────────────────────────────────────────────
// Add new rules here — they are automatically picked up by all configs below.
const rules = {
    'no-wait-for-timeout': no_wait_for_timeout_1.default,
    'no-brittle-selectors': no_brittle_selectors_1.default,
    'require-test-description': require_test_description_1.default,
    'no-page-pause': no_page_pause_1.default,
    'no-focused-tests': no_focused_tests_1.default,
    'prefer-web-first-assertions': prefer_web_first_assertions_1.default,
};
exports.rules = rules;
// ─── Shared parser options ────────────────────────────────────────────────────
const PARSER_OPTIONS = {
    ecmaVersion: 2020,
    sourceType: 'module',
};
// ─── Helper: prefix all rule keys with the plugin name ───────────────────────
function prefixedRules(severity) {
    return Object.keys(rules).reduce((acc, key) => {
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
        rules: Object.keys(rules).reduce((acc, key) => {
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
exports.configs = configs;
// ─── Plugin export ────────────────────────────────────────────────────────────
const plugin = {
    meta: {
        name: '@acahet/pw-standard',
        version: '1.0.0',
    },
    rules,
    configs,
};
exports.default = plugin;
//# sourceMappingURL=index.js.map