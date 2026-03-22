"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BRITTLE_SELECTOR_PATTERNS = void 0;
exports.isPlaywrightFile = isPlaywrightFile;
exports.isWaitForTimeout = isWaitForTimeout;
exports.getMethodName = getMethodName;
exports.getObjectName = getObjectName;
exports.findAncestor = findAncestor;
exports.isBrittleSelector = isBrittleSelector;
function isPlaywrightFile(filename) {
    return (/\.(spec|test)\.[jt]sx?$/.test(filename) ||
        /[/\\](e2e|tests?)[/\\]/.test(filename));
}
function isWaitForTimeout(node) {
    if (node.callee.type !== 'MemberExpression')
        return false;
    const callee = node.callee;
    return (callee.property.type === 'Identifier' &&
        callee.property.name === 'waitForTimeout');
}
function getMethodName(node) {
    if (node.callee.type !== 'MemberExpression')
        return null;
    const prop = node.callee.property;
    return prop.type === 'Identifier' ? prop.name : null;
}
function getObjectName(node) {
    if (node.callee.type !== 'MemberExpression')
        return null;
    const obj = node.callee.object;
    return obj.type === 'Identifier' ? obj.name : null;
}
function findAncestor(node, context, predicate) {
    const ancestors = context.getAncestors();
    for (let i = ancestors.length - 1; i >= 0; i--) {
        if (predicate(ancestors[i]))
            return ancestors[i];
    }
    return null;
}
exports.BRITTLE_SELECTOR_PATTERNS = [
    /^\.[\w-]+/,
    /^#[\w-]+/,
    /nth-child/,
    /nth-of-type/,
    /^\/\//,
    /\s*>\s*/,
    /\s*\+\s*/,
    /\s*~\s*/,
];
function isBrittleSelector(selector) {
    return exports.BRITTLE_SELECTOR_PATTERNS.some((pattern) => pattern.test(selector.trim()));
}
//# sourceMappingURL=ast.js.map