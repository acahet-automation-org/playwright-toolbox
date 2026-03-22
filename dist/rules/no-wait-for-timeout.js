"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ast_1 = require("../utils/ast");
const rule = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Disallow waitForTimeout() — use explicit wait conditions instead',
            category: 'Best Practices',
            recommended: true,
            url: 'https://github.com/acahet-automation-org/playwright-standards/blob/main/docs/rules/no-wait-for-timeout.md',
        },
        messages: {
            noWaitForTimeout: 'Avoid waitForTimeout(). Use waitFor(), waitForResponse(), or expect(...).toBeVisible() instead.',
        },
        schema: [],
    },
    create(context) {
        return {
            CallExpression(node) {
                if ((0, ast_1.isWaitForTimeout)(node)) {
                    context.report({ node, messageId: 'noWaitForTimeout' });
                }
            },
        };
    },
};
exports.default = rule;
//# sourceMappingURL=no-wait-for-timeout.js.map