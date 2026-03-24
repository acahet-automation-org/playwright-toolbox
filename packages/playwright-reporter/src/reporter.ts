import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import type {
	FullConfig,
	FullResult,
	Reporter,
	Suite,
	TestCase,
	TestResult,
} from '@playwright/test/reporter';

interface Annotation {
	type: string;
	description?: string;
}

type TestCaseWithTags = TestCase & {
	tags: string[];
};

interface TestInfo {
	title: string;
	file: string;
	project: string;
	duration: number;
	status: string;
	error?: string;
	tags?: string[];
	annotations?: Annotation[];
	attachmentPaths?: string[];
	artifacts: {
		trace?: string;
		screenshot?: string;
	};
}

interface TestHistoryEntry {
	runId: string;
	timestamp: string;
	duration: number;
	totalTests: number;
	passed: number;
	failed: number;
	skipped: number;
	flaky: number;
	allTests: TestInfo[];
	failedTests: TestInfo[];
}

interface HistoryIndex {
	runs: TestHistoryEntry[];
}

// How many runs to keep in the index AND on disk — overridable via options
const DEFAULT_MAX_RUNS = 30;

interface ReporterOptions {
	historyDir?: string;
	maxRuns?: number;
}

class LocalHistoryReporter implements Reporter {
	private config!: FullConfig;
	private suite!: Suite;
	private startTime!: number;
	private historyDir: string;
	private historyIndexFile: string;
	private maxRuns: number;
	private currentRunId!: string;
	private currentRunDir!: string;

	constructor(options: ReporterOptions = {}) {
		this.historyDir = options.historyDir ?? './tests/report/test-history';
		this.maxRuns = options.maxRuns ?? DEFAULT_MAX_RUNS;
		this.historyIndexFile = `${this.historyDir}/history-index.json`;
	}

	async onBegin(config: FullConfig, suite: Suite) {
		this.config = config;
		this.suite = suite;
		this.startTime = Date.now();
		this.currentRunId = new Date().toISOString().replace(/[:.]/g, '-');
		this.currentRunDir = `${this.historyDir}/runs/${this.currentRunId}`;

		await fs.mkdir(this.currentRunDir, { recursive: true });
	}

	async onEnd(_result: FullResult) {
		try {
			const duration = Date.now() - this.startTime;
			const stats = this.collectTestStats(this.suite);

			await this.copyFailureArtifacts(stats.failedTests);

			const historyEntry: TestHistoryEntry = {
				runId: this.currentRunId,
				timestamp: new Date().toISOString(),
				duration,
				totalTests: stats.total,
				passed: stats.passed,
				failed: stats.failed,
				skipped: stats.skipped,
				flaky: stats.flaky,
				allTests: stats.allTests,
				failedTests: stats.failedTests,
			};

			await this.updateHistoryIndex(historyEntry);

			// Cleanup is driven by the index: runs evicted from the index get their
			// directories deleted. No separate time-based policy — one source of truth.
			await this.cleanupOrphanedRunDirs();
		} catch (err) {
			process.stderr.write(
				`[LocalHistoryReporter] Failed to save history: ${String(err)}\n`,
			);
		}
	}

	// ─── Stats collection ────────────────────────────────────────────────────

	private collectTestStats(suite: Suite) {
		let total = 0;
		let passed = 0;
		let failed = 0;
		let skipped = 0;
		let flaky = 0;
		const allTests: TestInfo[] = [];
		const failedTests: TestInfo[] = [];

		const processSuite = (s: Suite) => {
			for (const test of s.tests) {
				// Skip setup project tests — they're infrastructure, not results
				if (test.parent?.project()?.name === 'setup') {
					continue;
				}

				total++;

				const results = test.results;

				if (results.length === 0) {
					skipped++;
					allTests.push(this.createTestEntry(test, null, 'skipped'));
					continue;
				}

				const lastResult = results[results.length - 1];

				if (lastResult.status === 'skipped') {
					skipped++;
					allTests.push(
						this.createTestEntry(test, lastResult, 'skipped'),
					);
				} else if (lastResult.status === 'passed') {
					// Flaky = passed on a retry (at least one earlier attempt failed)
					const isFlaky =
						results.length > 1 &&
						results.some((r) => r.status !== 'passed');
					if (isFlaky) {
						flaky++;
					}
					passed++;
					allTests.push(
						this.createTestEntry(
							test,
							lastResult,
							isFlaky ? 'flaky' : 'passed',
						),
					);
				} else {
					failed++;
					const entry = this.createTestEntry(
						test,
						lastResult,
						'failed',
					);
					failedTests.push(entry);
					allTests.push(entry);
				}
			}

			for (const child of s.suites) {
				processSuite(child);
			}
		};

		processSuite(suite);

		return { total, passed, failed, skipped, flaky, allTests, failedTests };
	}

	private createTestEntry(
		test: TestCase,
		result: TestResult | null,
		status: string,
	): TestInfo {
		const projectName = test.parent?.project()?.name || 'unknown';
		const relativePath = path.relative(process.cwd(), test.location.file);

		// Keep backward-compatible tag extraction shape.
		const testTags =
			(test as TestCaseWithTags).tags ??
			(test.tags.length > 0 ? test.tags : []);

		const attachmentPaths = (result?.attachments ?? [])
			.map((a) => a.path)
			.filter((p): p is string => typeof p === 'string');

		return {
			title: test.title,
			file: relativePath,
			project: projectName,
			duration: result?.duration ?? 0,
			status,
			error: result?.error?.message,
			tags: testTags.length > 0 ? testTags : undefined,
			// Playwright annotations: test.info().annotations or test.annotations
			annotations:
				test.annotations.length > 0 ? test.annotations : undefined,
			attachmentPaths:
				attachmentPaths.length > 0 ? attachmentPaths : undefined,
			artifacts: {
				trace: undefined,
				screenshot: undefined,
			},
		};
	}

	// ─── Artifact copying ────────────────────────────────────────────────────

	/**
	 * Copies trace and screenshot for each failed test by looking inside the
	 * test-specific output folder Playwright creates, rather than scanning the
	 * entire project outputDir. This prevents one test from overwriting another's
	 * artifacts when multiple tests fail in the same project.
	 *
	 * Playwright names the folder:
	 *   test-results/<sanitized-test-title>-<project>/
	 */
	private async copyFailureArtifacts(failedTests: TestInfo[]) {
		for (const failedTest of failedTests) {
			try {
				const candidateFiles = await this.getArtifactCandidateFiles(
					failedTest,
				);
				const baseName = this.sanitizeFilename(failedTest.title);

				for (const srcPath of candidateFiles) {
					const fileName = path.basename(srcPath).toLowerCase();

					if (!failedTest.artifacts.trace && fileName.endsWith('trace.zip')) {
						const destPath = path.join(
							this.currentRunDir,
							`${baseName}-trace.zip`,
						);
						await fs.copyFile(srcPath, destPath);
						failedTest.artifacts.trace = path.relative(
							this.historyDir,
							destPath,
						);
						continue;
					}

					const isImage = /\.(png|jpg|jpeg)$/i.test(fileName);
					const isFailureShot =
						fileName.includes('screenshot') ||
						fileName.includes('test-failed');

					if (!failedTest.artifacts.screenshot && isImage && isFailureShot) {
						const ext = path.extname(fileName) || '.png';
						const destPath = path.join(
							this.currentRunDir,
							`${baseName}-screenshot${ext}`,
						);
						await fs.copyFile(srcPath, destPath);
						failedTest.artifacts.screenshot = path.relative(
							this.historyDir,
							destPath,
						);
					}

					if (failedTest.artifacts.trace && failedTest.artifacts.screenshot) {
						break;
					}
				}
			} catch (err) {
				process.stderr.write(
					`[LocalHistoryReporter] Failed to copy artifacts for "${failedTest.title}": ${String(err)}\n`,
				);
			}
		}
	}

	private async getArtifactCandidateFiles(test: TestInfo): Promise<string[]> {
		const files: string[] = [];
		const seen = new Set<string>();

		const addFile = async (filePath: string) => {
			let stat: Awaited<ReturnType<typeof fs.stat>>;
			try {
				stat = await fs.stat(filePath);
			} catch {
				return;
			}
			if (!stat.isFile()) return;
			if (seen.has(filePath)) return;
			seen.add(filePath);
			files.push(filePath);
		};

		for (const attachmentPath of test.attachmentPaths ?? []) {
			await addFile(attachmentPath);
		}

		// Fallback to conventional Playwright output layout for environments
		// where attachment paths are missing in reporter events.
		const conventionalOutputDir = this.resolveTestOutputDir(test);
		const fromDir = await this.listFilesRecursively(conventionalOutputDir);
		for (const filePath of fromDir) {
			if (!seen.has(filePath)) {
				seen.add(filePath);
				files.push(filePath);
			}
		}

		return files;
	}

	private async listFilesRecursively(dir: string): Promise<string[]> {
		let entries: import('node:fs').Dirent[];
		try {
			entries = await fs.readdir(dir, {
				withFileTypes: true,
				encoding: 'utf8',
			});
		} catch {
			return [];
		}

		const files: string[] = [];
		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name);
			if (entry.isFile()) {
				files.push(fullPath);
				continue;
			}
			if (entry.isDirectory()) {
				const nested = await this.listFilesRecursively(fullPath);
				files.push(...nested);
			}
		}

		return files;
	}

	/**
	 * Resolves the Playwright-generated output folder for a specific test.
	 * Playwright convention: test-results/{title-slug}-{project}/
	 */
	private resolveTestOutputDir(test: TestInfo): string {
		const slug = test.title
			.replace(/\W+/g, '-')
			.replace(/^-+|-+$/g, '')
			.toLowerCase();

		const projectSlug = test.project.toLowerCase();

		return path.join('test-results', `${slug}-${projectSlug}`);
	}

	private sanitizeFilename(filename: string): string {
		return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
	}

	// ─── History index management ────────────────────────────────────────────

	private async updateHistoryIndex(entry: TestHistoryEntry) {
		let historyIndex: HistoryIndex;

		try {
			const content = await fs.readFile(this.historyIndexFile, 'utf-8');
			historyIndex = JSON.parse(content) as HistoryIndex;
		} catch {
			historyIndex = { runs: [] };
		}

		historyIndex.runs.unshift(entry);

		// Evict runs beyond the cap — collect their IDs before trimming
		const evictedRunIds = historyIndex.runs
			.slice(this.maxRuns)
			.map((r) => r.runId);

		historyIndex.runs = historyIndex.runs.slice(0, this.maxRuns);

		await fs.writeFile(
			this.historyIndexFile,
			JSON.stringify(historyIndex, null, 2),
		);

		// Delete directories for evicted runs immediately — index and disk stay in sync
		for (const runId of evictedRunIds) {
			await this.deleteRunDir(runId);
		}
	}

	/**
	 * Removes run directories that exist on disk but are no longer referenced
	 * by the index. Guards against orphans left by earlier bugs or manual edits.
	 */
	private async cleanupOrphanedRunDirs() {
		const runsBaseDir = path.join(this.historyDir, 'runs');

		let existingDirs: string[];
		try {
			existingDirs = await fs.readdir(runsBaseDir);
		} catch {
			return; // runs/ dir doesn't exist yet — nothing to clean
		}

		let indexedRunIds: Set<string>;
		try {
			const content = await fs.readFile(this.historyIndexFile, 'utf-8');
			const index = JSON.parse(content) as HistoryIndex;
			indexedRunIds = new Set(index.runs.map((r) => r.runId));
		} catch {
			return; // can't read index — don't delete anything
		}

		for (const dir of existingDirs) {
			if (!indexedRunIds.has(dir)) {
				await this.deleteRunDir(dir);
			}
		}
	}

	private async deleteRunDir(runId: string) {
		const runDir = path.join(this.historyDir, 'runs', runId);
		try {
			await fs.rm(runDir, { recursive: true, force: true });
		} catch (err) {
			process.stderr.write(
				`[LocalHistoryReporter] Failed to delete run dir "${runDir}": ${String(err)}\n`,
			);
		}
	}
}

export default LocalHistoryReporter;
