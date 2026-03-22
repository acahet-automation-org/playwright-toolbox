import { Rule } from 'eslint';
import { CallExpression } from 'estree';
import { isWaitForTimeout } from '../utils/ast';
import { RuleModule } from '../types';

const rule: RuleModule = {
	meta: {
		type: 'problem',
		docs: {
			description:
				'Disallow waitForTimeout() — use explicit wait conditions instead',
			category: 'Best Practices',
			recommended: true,
			url: 'https://github.com/acahet-automation-org/playwright-standards/blob/main/docs/rules/no-wait-for-timeout.md',
		},
		messages: {
			noWaitForTimeout:
				'Avoid waitForTimeout(). Use waitFor(), waitForResponse(), or expect(...).toBeVisible() instead.',
		},
		schema: [],
	},

	create(context: Rule.RuleContext): Rule.RuleListener {
		return {
			CallExpression(node: CallExpression) {
				if (isWaitForTimeout(node)) {
					context.report({ node, messageId: 'noWaitForTimeout' });
				}
			},
		};
	},
};

export default rule;
