import { Rule } from 'eslint';
import { CallExpression, MemberExpression, Identifier } from 'estree';
import { RuleModule } from '../types';

const rule: RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow page.pause() — remove before committing',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/acahet-automation-org/playwright-standards/blob/main/docs/rules/no-page-pause.md',
    },
    messages: {
      noPagePause: 'page.pause() is for local debugging only. Remove it before committing.',
    },
    schema: [],
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    return {
      CallExpression(node: CallExpression) {
        if (node.callee.type !== 'MemberExpression') return;
        const callee = node.callee as MemberExpression;
        if (
          callee.property.type === 'Identifier' &&
          (callee.property as Identifier).name === 'pause'
        ) {
          context.report({ node, messageId: 'noPagePause' });
        }
      },
    };
  },
};

export default rule;
