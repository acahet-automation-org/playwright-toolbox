import { Rule } from 'eslint';
import { Node, CallExpression } from 'estree';
export declare function isPlaywrightFile(filename: string): boolean;
export declare function isWaitForTimeout(node: CallExpression): boolean;
export declare function getMethodName(node: CallExpression): string | null;
export declare function getObjectName(node: CallExpression): string | null;
export declare function findAncestor(node: Node, context: Rule.RuleContext, predicate: (n: Node) => boolean): Node | null;
export declare const BRITTLE_SELECTOR_PATTERNS: RegExp[];
export declare function isBrittleSelector(selector: string): boolean;
//# sourceMappingURL=ast.d.ts.map