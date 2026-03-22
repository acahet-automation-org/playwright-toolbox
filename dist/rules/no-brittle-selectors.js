"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ast_1 = require("../utils/ast");
const LOCATOR_METHODS = new Set([
    'locator',
    '$',
    '$$',
    'waitForSelector',
    'querySelector',
]);
const rule = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Discourage brittle CSS / XPath selectors — prefer getByTestId, getByRole, getByLabel, etc.',
            category: 'Best Practices',
            recommended: true,
            url: 'https://github.com/acahet-automation-org/playwright-standards/blob/main/docs/rules/no-brittle-selectors.md',
        },
        messages: {
            brittleSelector: 'Brittle selector "{{selector}}". Prefer getByTestId(), getByRole(), getByLabel(), or getByText() instead.',
        },
        schema: [],
    },
    create(context) {
        return {
            CallExpression(node) {
                const method = (0, ast_1.getMethodName)(node);
                if (!method || !LOCATOR_METHODS.has(method))
                    return;
                const firstArg = node.arguments[0];
                if (!firstArg || firstArg.type !== 'Literal')
                    return;
                const selector = String(firstArg.value);
                if ((0, ast_1.isBrittleSelector)(selector)) {
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
exports.default = rule;
//# sourceMappingURL=no-brittle-selectors.js.map