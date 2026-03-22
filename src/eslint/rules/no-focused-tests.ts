import { Rule } from 'eslint';
import { CallExpression, MemberExpression, Identifier } from 'estree';
import { RuleModule } from '../types';

const FOCUSED_METHODS = new Set(['only', 'skip']);
const TEST_DESCRIBE_OBJECTS = new Set(['test', 'it', 'describe']);

const rule: RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow test.only() / describe.only() — remove before committing',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/acahet-automation-org/playwright-standards/blob/main/docs/rules/no-focused-tests.md',
    },
    messages: {
      noOnly: '"{{parent}}.only()" found. Remove it before committing to avoid blocking the full test suite.',
      noSkip: '"{{parent}}.skip()" found. Remove or resolve the skip before committing.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowSkip: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    const options = context.options[0] ?? {};
    const allowSkip: boolean = options.allowSkip ?? false;

    return {
      CallExpression(node: CallExpression) {
        if (node.callee.type !== 'MemberExpression') return;
        const callee = node.callee as MemberExpression;

        if (callee.object.type !== 'Identifier') return;
        const parentName = (callee.object as Identifier).name;
        if (!TEST_DESCRIBE_OBJECTS.has(parentName)) return;

        if (callee.property.type !== 'Identifier') return;
        const methodName = (callee.property as Identifier).name;
        if (!FOCUSED_METHODS.has(methodName)) return;

        if (methodName === 'skip' && allowSkip) return;

        context.report({
          node,
          messageId: methodName === 'only' ? 'noOnly' : 'noSkip',
          data: { parent: parentName },
        });
      },
    };
  },
};

export default rule;
