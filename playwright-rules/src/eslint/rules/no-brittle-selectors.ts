import { Rule } from 'eslint';
import { CallExpression, Literal } from 'estree';
import { getMethodName, isBrittleSelector } from '../utils/ast';
import { RuleModule } from '../types';

const LOCATOR_METHODS = new Set([
	'locator',
	'$',
	'$$',
	'waitForSelector',
	'querySelector',
]);

const rule: RuleModule = {
	meta: {
		type: 'suggestion',
		docs: {
			description:
				'Discourage brittle CSS / XPath selectors — prefer getByTestId, getByRole, getByLabel, etc.',
			category: 'Best Practices',
			recommended: true,
			url: 'https://github.com/acahet-automation-org/playwright-standards/blob/main/docs/rules/no-brittle-selectors.md',
		},
		messages: {
			brittleSelector:
				'Brittle selector "{{selector}}". Prefer getByTestId(), getByRole(), getByLabel(), or getByText() instead.',
		},
		schema: [],
	},

	create(context: Rule.RuleContext): Rule.RuleListener {
		return {
			CallExpression(node: CallExpression) {
				const method = getMethodName(node);
				if (!method || !LOCATOR_METHODS.has(method)) return;

				const firstArg = node.arguments[0];
				if (!firstArg || firstArg.type !== 'Literal') return;

				const selector = String((firstArg as Literal).value);
				if (isBrittleSelector(selector)) {
					context.report({
						node: firstArg,
						messageId: 'brittleSelector',
						data: { selector },
					});
				}
			},
		};
	},
};

export default rule;
