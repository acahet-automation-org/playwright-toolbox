"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eslintPlugin = void 0;
/**
 * @acahet/pw-standard
 *
 * Root barrel. Prefer importing from the specific entry point
 * to keep bundle size small:
 *
 *   import plugin  from '@acahet/pw-standard/eslint'
 *   import { baseConfig } from '@acahet/pw-standard/playwright'
 *   import { BasePage }   from '@acahet/pw-standard/base'
 *
 * This barrel is available for tooling that needs everything at once.
 */
var index_1 = require("./eslint/index");
Object.defineProperty(exports, "eslintPlugin", { enumerable: true, get: function () { return __importDefault(index_1).default; } });
//# sourceMappingURL=index.js.map