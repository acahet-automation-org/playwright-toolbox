import { Rule } from 'eslint';
export interface RuleModule extends Rule.RuleModule {
    meta: Rule.RuleMetaData & {
        docs: {
            description: string;
            category: string;
            recommended: boolean;
            url?: string;
        };
    };
}
export type RuleMap = Record<string, RuleModule>;
export type Severity = 'error' | 'warn' | 'off';
export interface ConfigRules {
    [ruleName: string]: Severity | [Severity, ...unknown[]];
}
//# sourceMappingURL=types.d.ts.map