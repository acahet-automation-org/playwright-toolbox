import { Rule } from 'eslint';
import { CallExpression, Identifier } from 'estree';
import { RuleModule } from '../types';

const EAGER_METHODS = new Set([
	'innerText',
	'textContent',
	'getAttribute',
	'isVisible',
	'isHidden',
	'isEnabled',
	'isDisabled',
	'isChecked',
	'inputValue',
	'innerHTML',
]);

const PREFERRED: Record<string, string> = {
	innerText: 'toHaveText()',
	textContent: 'toHaveText()',
	getAttribute: 'toHaveAttribute()',
	isVisible: 'toBeVisible()',
	isHidden: 'toBeHidden()',
	isEnabled: 'toBeEnabled()',
	isDisabled: 'toBeDisabled()',
	isChecked: 'toBeChecked()',
	inputValue: 'toHaveValue()',
	innerHTML: 'toContainText() or toHaveText()',
};

const rule: RuleModule = {
	meta: {
		type: 'suggestion',
		docs: {
			description:
				'Prefer Playwright web-first assertions over awaited property calls',
			category: 'Best Practices',
			recommended: true,
			url: 'https://github.com/acahet-automation-org/playwright-standards/blob/main/docs/rules/prefer-web-first-assertions.md',
		},
		messages: {
			preferWebFirst:
				'Avoid awaiting "{{method}}()" inside expect(). Use the web-first assertion "{{preferred}}" instead — it auto-retries.',
		},
		schema: [],
	},

	create(context: Rule.RuleContext): Rule.RuleListener {
		const sourceCode = context.sourceCode;

		return {
			'CallExpression > AwaitExpression > CallExpression'(
				node: CallExpression,
			) {
				if (node.callee.type !== 'MemberExpression') return;
				const prop = node.callee.property;
				if (prop.type !== 'Identifier') return;

				const method = (prop as Identifier).name;
				if (!EAGER_METHODS.has(method)) return;

				const ancestors = sourceCode.getAncestors(node);
				const awaitExpr = ancestors[ancestors.length - 1];
				if (!awaitExpr || awaitExpr.type !== 'AwaitExpression') return;

				const outerCall = ancestors[ancestors.length - 2];
				if (
					!outerCall ||
					outerCall.type !== 'CallExpression' ||
					(outerCall as CallExpression).callee.type !==
						'Identifier' ||
					((outerCall as CallExpression).callee as Identifier)
						.name !== 'expect'
				)
					return;

				context.report({
					node,
					messageId: 'preferWebFirst',
					data: {
						method,
						preferred: PREFERRED[method] ?? 'a web-first assertion',
					},
				});
			},
		};
	},
};

export default rule;
