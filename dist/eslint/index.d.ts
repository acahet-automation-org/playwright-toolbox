import { RuleMap, ConfigRules } from './types';
declare const rules: RuleMap;
declare const configs: {
    /**
     * `recommended` — all recommended rules as errors.
     * Best for CI enforcement.
     */
    recommended: {
        plugins: string[];
        parserOptions: {
            ecmaVersion: number;
            sourceType: "module";
        };
        rules: ConfigRules;
    };
    /**
     * `strict` — all rules (including non-recommended) as errors.
     */
    strict: {
        plugins: string[];
        parserOptions: {
            ecmaVersion: number;
            sourceType: "module";
        };
        rules: ConfigRules;
    };
    /**
     * `warn` — all recommended rules as warnings.
     * Useful when adopting the plugin incrementally.
     */
    warn: {
        plugins: string[];
        parserOptions: {
            ecmaVersion: number;
            sourceType: "module";
        };
        rules: ConfigRules;
    };
};
declare const plugin: {
    meta: {
        name: string;
        version: string;
    };
    rules: RuleMap;
    configs: {
        /**
         * `recommended` — all recommended rules as errors.
         * Best for CI enforcement.
         */
        recommended: {
            plugins: string[];
            parserOptions: {
                ecmaVersion: number;
                sourceType: "module";
            };
            rules: ConfigRules;
        };
        /**
         * `strict` — all rules (including non-recommended) as errors.
         */
        strict: {
            plugins: string[];
            parserOptions: {
                ecmaVersion: number;
                sourceType: "module";
            };
            rules: ConfigRules;
        };
        /**
         * `warn` — all recommended rules as warnings.
         * Useful when adopting the plugin incrementally.
         */
        warn: {
            plugins: string[];
            parserOptions: {
                ecmaVersion: number;
                sourceType: "module";
            };
            rules: ConfigRules;
        };
    };
};
export default plugin;
export { rules, configs };
export type { RuleMap, ConfigRules };
//# sourceMappingURL=index.d.ts.map