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
	quarantined?: boolean;
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
	quarantined: number;
	allTests: TestInfo[];
	failedTests: TestInfo[];
}

interface HistoryIndex {
	runs: TestHistoryEntry[];
}

const DEFAULT_MAX_RUNS = 30;
const DEFAULT_HISTORY_DIR = './dashboard/test-history';

export interface ReporterOptions {
	/** Directory where history-index.json and index.html are written. Default: ./dashboard/test-history */
	historyDir?: string;
	/** Max runs to keep. Default: 30 */
	maxRuns?: number;
	/** Project name shown in the dashboard topbar and PDF. */
	projectName?: string;
	/** Brand name shown top-left. Default: pw_dashboard */
	brandName?: string;
	/** Browser tab title. Default: Test History Dashboard */
	pageTitle?: string;
	/** Number of prior runs used to compute rolling average for regression detection. Default: 10 */
	durationRegressionWindow?: number;
	/** Multiplier above rolling average that flags a test as regressing. Default: 1.5 */
	durationRegressionThreshold?: number;
	/** Minimum prior data points required before flagging a regression. Default: 3 */
	durationRegressionMinRuns?: number;
}

class LocalHistoryReporter implements Reporter {
	private suite!: Suite;
	private startTime!: number;
	private historyDir: string;
	private historyIndexFile: string;
	private maxRuns: number;
	private currentRunId!: string;
	private currentRunDir!: string;

	private usingDefaultHistoryDir: boolean;

	// Dashboard display options — written into index.html after every run
	private projectName: string;
	private brandName: string;
	private pageTitle: string;
	private durationRegressionWindow: number;
	private durationRegressionThreshold: number;
	private durationRegressionMinRuns: number;

	constructor(options: ReporterOptions = {}) {
		this.historyDir    = options.historyDir    ?? DEFAULT_HISTORY_DIR;
		this.maxRuns       = options.maxRuns       ?? DEFAULT_MAX_RUNS;
		this.projectName   = options.projectName   ?? '';
		this.brandName     = options.brandName     ?? 'pw_dashboard';
		this.pageTitle     = options.pageTitle     ?? 'Test History Dashboard';
		this.durationRegressionWindow    = options.durationRegressionWindow    ?? 10;
		this.durationRegressionThreshold = options.durationRegressionThreshold ?? 1.5;
		this.durationRegressionMinRuns   = options.durationRegressionMinRuns   ?? 3;
		this.historyIndexFile = `${this.historyDir}/history-index.json`;
		this.usingDefaultHistoryDir = options.historyDir === undefined;
	}

	async onBegin(_config: FullConfig, suite: Suite) {
		this.suite         = suite;
		this.startTime     = Date.now();
		this.currentRunId  = new Date().toISOString().replace(/[:.]/g, '-');
		this.currentRunDir = `${this.historyDir}/runs/${this.currentRunId}`;

		await fs.mkdir(this.currentRunDir, { recursive: true });
		await this.warnIfMisconfigured();
	}

	async onEnd(_result: FullResult) {
		try {
			const duration = Date.now() - this.startTime;
			const stats    = this.collectTestStats(this.suite);

			await this.copyFailureArtifacts(stats.failedTests);

			const historyEntry: TestHistoryEntry = {
				runId:       this.currentRunId,
				timestamp:   new Date().toISOString(),
				duration,
				totalTests:  stats.total,
				passed:      stats.passed,
				failed:      stats.failed,
				skipped:     stats.skipped,
				flaky:       stats.flaky,
				quarantined: stats.quarantined,
				allTests:    stats.allTests,
				failedTests: stats.failedTests,
			};

			await this.updateHistoryIndex(historyEntry);
			await this.cleanupOrphanedRunDirs();

			// Write dashboard HTML with current config injected — always fresh
			await this.writeDashboard();
		} catch (err) {
			process.stderr.write(
				`[LocalHistoryReporter] Failed to save history: ${String(err)}\n`,
			);
		}
	}

	// ─── Startup config validation ───────────────────────────────────────────

	/**
	 * Prints actionable warnings when the reporter is likely misconfigured:
	 *
	 * 1. Using the default historyDir — reminds the user to pin it explicitly
	 *    so changing it later won't orphan historical data.
	 * 2. Using a custom historyDir that has no history yet, while the default
	 *    path still contains data — the user probably changed historyDir after
	 *    runs had already been recorded there.
	 * 3. projectName is empty — history is still tracked, but the dashboard
	 *    topbar and any PDF exports will be blank.
	 */
	private async warnIfMisconfigured() {
		const warn = (msg: string) =>
			process.stderr.write(`[LocalHistoryReporter] WARNING: ${msg}\n`);

		if (this.usingDefaultHistoryDir) {
			warn(
				`historyDir is not set — using default "${DEFAULT_HISTORY_DIR}". ` +
				`Set it explicitly in playwright.config.ts so you can change it later without losing history.\n` +
				`  Example: reporters: [["@acahet/playwright-reporter", { historyDir: "./reports/history" }]]`,
			);
		} else {
			// Custom historyDir: check if the default path has orphaned data
			const defaultIndex = path.join(DEFAULT_HISTORY_DIR, 'history-index.json');
			const customHasData = await this.fileExists(this.historyIndexFile);
			const defaultHasData = await this.fileExists(defaultIndex);

			if (!customHasData && defaultHasData) {
				warn(
					`historyDir is set to "${this.historyDir}" but no history was found there. ` +
					`Existing history was detected at the default path "${DEFAULT_HISTORY_DIR}". ` +
					`To preserve it, copy that directory to "${this.historyDir}" before running again.`,
				);
			}
		}

		if (!this.projectName) {
			warn(
				`projectName is not set — the dashboard topbar and PDF exports will show no project name. ` +
				`Add it to your reporter options: { projectName: "My Project" }`,
			);
		}
	}

	private async fileExists(filePath: string): Promise<boolean> {
		try {
			await fs.access(filePath);
			return true;
		} catch {
			return false;
		}
	}

	// ─── Dashboard HTML generation ───────────────────────────────────────────

	/**
	 * Locates the dashboard template (index.html shipped with this package),
	 * injects the current CONFIG values, and writes it to historyDir/index.html.
	 *
	 * The template is resolved relative to this file so it works whether the
	 * package is installed as a dependency or run from source.
	 */
	private async writeDashboard() {
		// Resolve template: dist/src/reporter.js → ../../dashboard/index.html
		const templatePath = path.resolve(__dirname, '../../dashboard/index.html');

		let template: string;
		try {
			template = await fs.readFile(templatePath, 'utf-8');
		} catch {
			process.stderr.write(
				`[LocalHistoryReporter] Dashboard template not found at ${templatePath} — skipping HTML generation.\n`,
			);
			return;
		}

		const output = this.injectConfig(template);
		const dest   = path.join(this.historyDir, 'index.html');
		await fs.writeFile(dest, output, 'utf-8');
	}

	/**
	 * Replaces the CONFIG block in the dashboard template with current values.
	 * Matches the same banner pattern used by the old init script so the
	 * template stays compatible with both workflows.
	 */
	private injectConfig(html: string): string {
		const configBlock = `const CONFIG = {
  pageTitle:        ${JSON.stringify(this.pageTitle)},
  projectName:      ${JSON.stringify(this.projectName)},
  brandName:        ${JSON.stringify(this.brandName)},
  historyIndexPath: "history-index.json",
  emptyTitle:       "No test history yet",
  emptyMessage:     "Run your tests to start tracking history.",
  errorTitle:       "Could not load history",
  errorMessage:     "Make sure history-index.json is in the same directory.",
  durationRegressionWindow:    ${this.durationRegressionWindow},
  durationRegressionThreshold: ${this.durationRegressionThreshold},
  durationRegressionMinRuns:   ${this.durationRegressionMinRuns},
};`;

		const pattern =
			/\/\/ ─+\r?\n\/\/ CONFIG[^\r\n]*\r?\n\/\/ ─+\r?\nconst CONFIG = \{[\s\S]*?\};\r?\n\/\/ ─+/;

		if (!pattern.test(html)) {
			// Template doesn't have the banner — do a simpler replacement
			return html.replace(/const CONFIG = \{[\s\S]*?\};/, configBlock);
		}

		return html.replace(
			pattern,
			[
				'// ─────────────────────────────────────────────────────────────────────────────',
				'// CONFIG — generated by @acahet/playwright-reporter after every run',
				'// ─────────────────────────────────────────────────────────────────────────────',
				configBlock,
				'// ─────────────────────────────────────────────────────────────────────────────',
			].join('\n'),
		);
	}

	// ─── Stats collection ────────────────────────────────────────────────────

	private collectTestStats(suite: Suite) {
		let total       = 0;
		let passed      = 0;
		let failed      = 0;
		let skipped     = 0;
		let flaky       = 0;
		let quarantined = 0;
		const allTests:    TestInfo[] = [];
		const failedTests: TestInfo[] = [];

		const processSuite = (s: Suite) => {
			for (const test of s.tests) {
				if (test.parent?.project()?.name === 'setup') continue;

				total++;
				const results    = test.results;

				if (results.length === 0) {
					skipped++;
					allTests.push(this.createTestEntry(test, null, 'skipped'));
					continue;
				}

				const lastResult = results[results.length - 1];

				if (lastResult.status === 'skipped') {
					skipped++;
					allTests.push(this.createTestEntry(test, lastResult, 'skipped'));
				} else if (lastResult.status === 'passed') {
					const isFlaky = results.length > 1 && results.some(r => r.status !== 'passed');
					if (isFlaky) flaky++;
					passed++;
					allTests.push(this.createTestEntry(test, lastResult, isFlaky ? 'flaky' : 'passed'));
				} else {
					failed++;
					const entry = this.createTestEntry(test, lastResult, 'failed');
					failedTests.push(entry);
					allTests.push(entry);
				}
			}
			for (const child of s.suites) processSuite(child);
		};

		processSuite(suite);
		quarantined = allTests.filter(t => t.quarantined).length;
		return { total, passed, failed, skipped, flaky, quarantined, allTests, failedTests };
	}

	private createTestEntry(
		test: TestCase,
		result: TestResult | null,
		status: string,
	): TestInfo {
		const projectName  = test.parent?.project()?.name || 'unknown';
		const relativePath = path.relative(process.cwd(), test.location.file);
		const testTags     = (test as TestCaseWithTags).tags ?? (test.tags.length > 0 ? test.tags : []);

		const attachmentPaths = (result?.attachments ?? [])
			.map(a => a.path)
			.filter((p): p is string => typeof p === 'string');

		const isQuarantined = testTags.some(
			t => t.toLowerCase() === '@quarantine' || t.toLowerCase() === 'quarantine',
		);

		return {
			title:   test.title,
			file:    relativePath,
			project: projectName,
			duration: result?.duration ?? 0,
			status,
			error:   result?.error?.message,
			tags:    testTags.length > 0 ? testTags : undefined,
			annotations: test.annotations.length > 0 ? test.annotations : undefined,
			attachmentPaths: attachmentPaths.length > 0 ? attachmentPaths : undefined,
			quarantined: isQuarantined || undefined,
			artifacts: { trace: undefined, screenshot: undefined },
		};
	}

	// ─── Artifact copying ────────────────────────────────────────────────────

	private async copyFailureArtifacts(failedTests: TestInfo[]) {
		for (const failedTest of failedTests) {
			try {
				const candidateFiles = await this.getArtifactCandidateFiles(failedTest);
				const baseName       = this.sanitizeFilename(failedTest.title);

				for (const srcPath of candidateFiles) {
					const fileName = path.basename(srcPath).toLowerCase();

					if (!failedTest.artifacts.trace && fileName.endsWith('trace.zip')) {
						const destPath = path.join(this.currentRunDir, `${baseName}-trace.zip`);
						await fs.copyFile(srcPath, destPath);
						failedTest.artifacts.trace = path.relative(this.historyDir, destPath);
						continue;
					}

					const isImage       = /\.(png|jpg|jpeg)$/i.test(fileName);
					const isFailureShot = fileName.includes('screenshot') || fileName.includes('test-failed');

					if (!failedTest.artifacts.screenshot && isImage && isFailureShot) {
						const ext      = path.extname(fileName) || '.png';
						const destPath = path.join(this.currentRunDir, `${baseName}-screenshot${ext}`);
						await fs.copyFile(srcPath, destPath);
						failedTest.artifacts.screenshot = path.relative(this.historyDir, destPath);
					}

					if (failedTest.artifacts.trace && failedTest.artifacts.screenshot) break;
				}
			} catch (err) {
				process.stderr.write(
					`[LocalHistoryReporter] Failed to copy artifacts for "${failedTest.title}": ${String(err)}\n`,
				);
			}
		}
	}

	private async getArtifactCandidateFiles(test: TestInfo): Promise<string[]> {
		const files = new Map<string, true>();

		const addFile = async (filePath: string) => {
			try {
				const stat = await fs.stat(filePath);
				if (stat.isFile() && !files.has(filePath)) files.set(filePath, true);
			} catch { /* file doesn't exist */ }
		};

		for (const p of test.attachmentPaths ?? []) await addFile(p);

		const fromDir = await this.listFilesRecursively(this.resolveTestOutputDir(test));
		for (const p of fromDir) if (!files.has(p)) files.set(p, true);

		return [...files.keys()];
	}

	private async listFilesRecursively(dir: string): Promise<string[]> {
		let entries: import('node:fs').Dirent[];
		try {
			entries = await fs.readdir(dir, { withFileTypes: true, encoding: 'utf8' });
		} catch {
			return [];
		}
		const files: string[] = [];
		for (const entry of entries) {
			const full = path.join(dir, entry.name);
			if (entry.isFile()) { files.push(full); continue; }
			if (entry.isDirectory()) files.push(...await this.listFilesRecursively(full));
		}
		return files;
	}

	private resolveTestOutputDir(test: TestInfo): string {
		const slug        = test.title.replace(/\W+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
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
			historyIndex  = JSON.parse(content) as HistoryIndex;
		} catch {
			historyIndex = { runs: [] };
		}

		historyIndex.runs.unshift(entry);

		const evictedRunIds = historyIndex.runs.slice(this.maxRuns).map(r => r.runId);
		historyIndex.runs   = historyIndex.runs.slice(0, this.maxRuns);

		await fs.writeFile(this.historyIndexFile, JSON.stringify(historyIndex, null, 2));

		for (const runId of evictedRunIds) await this.deleteRunDir(runId);
	}

	private async cleanupOrphanedRunDirs() {
		const runsBaseDir = path.join(this.historyDir, 'runs');
		let existingDirs: string[];
		try {
			existingDirs = await fs.readdir(runsBaseDir);
		} catch {
			return;
		}
		let indexedRunIds: Set<string>;
		try {
			const content  = await fs.readFile(this.historyIndexFile, 'utf-8');
			const index    = JSON.parse(content) as HistoryIndex;
			indexedRunIds  = new Set(index.runs.map(r => r.runId));
		} catch {
			return;
		}
		for (const dir of existingDirs) {
			if (!indexedRunIds.has(dir)) await this.deleteRunDir(dir);
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