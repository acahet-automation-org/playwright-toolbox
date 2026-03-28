import { Rule } from 'eslint';
import { Node, CallExpression, MemberExpression, Identifier } from 'estree';

export function isPlaywrightFile(filename: string): boolean {
	return (
		/\.(spec|test)\.[jt]sx?$/.test(filename) ||
		/[/\\](e2e|tests?)[/\\]/.test(filename)
	);
}

export function isWaitForTimeout(node: CallExpression): boolean {
	if (node.callee.type !== 'MemberExpression') return false;
	const callee = node.callee as MemberExpression;
	return (
		callee.property.type === 'Identifier' &&
		(callee.property as Identifier).name === 'waitForTimeout'
	);
}

export function getMethodName(node: CallExpression): string | null {
	if (node.callee.type !== 'MemberExpression') return null;
	const prop = (node.callee as MemberExpression).property;
	return prop.type === 'Identifier' ? (prop as Identifier).name : null;
}

export function getObjectName(node: CallExpression): string | null {
	if (node.callee.type !== 'MemberExpression') return null;
	const obj = (node.callee as MemberExpression).object;
	return obj.type === 'Identifier' ? (obj as Identifier).name : null;
}

export function findAncestor(
	node: Node,
	context: Rule.RuleContext,
	predicate: (n: Node) => boolean,
): Node | null {
	const ancestors = context.sourceCode.getAncestors(node);
	for (let i = ancestors.length - 1; i >= 0; i--) {
		if (predicate(ancestors[i])) return ancestors[i];
	}
	return null;
}

export const BRITTLE_SELECTOR_PATTERNS: RegExp[] = [
	/^\.[\w-]+/,
	/^#[\w-]+/,
	/nth-child/,
	/nth-of-type/,
	/^\/\//,
	/\s*>\s*/,
	/\s*\+\s*/,
	/\s*~\s*/,
];

export function isBrittleSelector(selector: string): boolean {
	return BRITTLE_SELECTOR_PATTERNS.some((pattern) =>
		pattern.test(selector.trim()),
	);
}
