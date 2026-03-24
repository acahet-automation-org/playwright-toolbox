import { Rule } from 'eslint';
import { CallExpression, Literal, TemplateLiteral } from 'estree';
import { RuleModule } from '../types';

const TEST_FUNCTIONS = new Set(['test', 'it']);

const VAGUE_PATTERNS: RegExp[] = [
	/^test\s*\d*$/i,
	/^it\s*\d*$/i,
	/^spec\s*\d*$/i,
	/^(todo|fixme|wip)$/i,
	/^\d+$/,
];

const MIN_DESCRIPTION_LENGTH = 10;
const TEST_ID_AT_END_PATTERN = /\bnrt-\d+\s*$/i;

function getMeaningfulDescription(description: string): string {
	return description
		.replace(TEST_ID_AT_END_PATTERN, '')
		.replace(/\s+/g, ' ')
		.trim();
}

const rule: RuleModule = {
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Require meaningful, descriptive test names',
			category: 'Best Practices',
			recommended: true,
			url: 'https://github.com/acahet-automation-org/playwright-standards/blob/main/docs/rules/require-test-description.md',
		},
		messages: {
			missingDescription:
				'test() must have a description as the first argument.',
			missingTestId:
				'Test description "{{name}}" must end with a test ID in the format nrt-123.',
			tooShort:
				'Test description "{{name}}" is too short (min {{min}} characters). Describe observable behaviour.',
			vagueDescription:
				'Test description "{{name}}" is too vague. Describe what the user sees or does.',
		},
		schema: [
			{
				type: 'object',
				properties: {
					minLength: { type: 'number', minimum: 1 },
				},
				additionalProperties: false,
			},
		],
	},

	create(context: Rule.RuleContext): Rule.RuleListener {
		const options = context.options[0] ?? {};
		const minLength: number = options.minLength ?? MIN_DESCRIPTION_LENGTH;

		return {
			CallExpression(node: CallExpression) {
				if (node.callee.type !== 'Identifier') return;
				const name = (node.callee as { name: string }).name;
				if (!TEST_FUNCTIONS.has(name)) return;

				const firstArg = node.arguments[0];

				if (!firstArg) {
					context.report({ node, messageId: 'missingDescription' });
					return;
				}

				if (firstArg.type === 'TemplateLiteral') {
					const cooked = (firstArg as TemplateLiteral).quasis
						.map((q) => q.value.cooked ?? '')
						.join('');
					const description = cooked.trim();
					const meaningfulDescription =
						getMeaningfulDescription(description);

					if (!TEST_ID_AT_END_PATTERN.test(description)) {
						context.report({
							node: firstArg,
							messageId: 'missingTestId',
							data: { name: description },
						});
						return;
					}

					if (
						VAGUE_PATTERNS.some((pattern) =>
							pattern.test(meaningfulDescription),
						)
					) {
						context.report({
							node: firstArg,
							messageId: 'vagueDescription',
							data: { name: meaningfulDescription },
						});
						return;
					}

					if (meaningfulDescription.length < minLength) {
						context.report({
							node: firstArg,
							messageId: 'tooShort',
							data: {
								name: meaningfulDescription,
								min: String(minLength),
							},
						});
					}
					return;
				}

				if (firstArg.type !== 'Literal') return;

				const description = String((firstArg as Literal).value).trim();
				const meaningfulDescription =
					getMeaningfulDescription(description);

				if (!TEST_ID_AT_END_PATTERN.test(description)) {
					context.report({
						node: firstArg,
						messageId: 'missingTestId',
						data: { name: description },
					});
					return;
				}

				if (
					VAGUE_PATTERNS.some((pattern) =>
						pattern.test(meaningfulDescription),
					)
				) {
					context.report({
						node: firstArg,
						messageId: 'vagueDescription',
						data: { name: meaningfulDescription },
					});
					return;
				}

				if (meaningfulDescription.length < minLength) {
					context.report({
						node: firstArg,
						messageId: 'tooShort',
						data: {
							name: meaningfulDescription,
							min: String(minLength),
						},
					});
					return;
				}
			},
		};
	},
};

export default rule;
