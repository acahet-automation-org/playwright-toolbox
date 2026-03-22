"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rule = {
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
    create(context) {
        return {
            CallExpression(node) {
                if (node.callee.type !== 'MemberExpression')
                    return;
                const callee = node.callee;
                if (callee.property.type === 'Identifier' &&
                    callee.property.name === 'pause') {
                    context.report({ node, messageId: 'noPagePause' });
                }
            },
        };
    },
};
exports.default = rule;
//# sourceMappingURL=no-page-pause.js.map