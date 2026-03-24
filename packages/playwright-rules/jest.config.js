/** @type {import('jest').Config} */
const config = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	roots: ['<rootDir>/tests'],
	testMatch: ['**/*.test.ts'],
	moduleNameMapper: {
		'^@acahet/pw-standard/eslint$': '<rootDir>/src/eslint/index.ts',
		'^@acahet/pw-standard/playwright$': '<rootDir>/src/playwright/index.ts',
		'^@acahet/pw-standard/base$': '<rootDir>/src/base/index.ts',
	},
	collectCoverageFrom: [
		'src/**/*.ts',
		'!src/**/*.d.ts',
		'!src/**/index.ts', // barrel files — covered transitively
		'!src/tsconfig/**',
	],
	coverageThreshold: {
		global: {
			branches: 80,
			functions: 80,
			lines: 80,
			statements: 80,
		},
	},
};

module.exports = config;
