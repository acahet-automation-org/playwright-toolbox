// ── Health grade ───────────────────────────────────────────────────────────
function computeGrade(run) {
  if (!run.totalTests) return 'F';
  const nonQ      = (run.allTests ?? []).filter(t => !t.quarantined);
  const total     = nonQ.length || 1;
  const passed    = nonQ.filter(t => t.status === 'passed' || t.status === 'flaky').length;
  const flakyN    = nonQ.filter(t => t.status === 'flaky').length;
  const passRate  = passed / total;
  const stability = 1 - (flakyN / total);
  const allT      = nonQ;
  const p75       = computeP75(allT.map(t => t.duration));
  const slowCount = allT.filter(t => t.duration > p75 * 1.5).length;
  const perfScore = 1 - (slowCount / total);
  const score     = (passRate * 0.6 + stability * 0.3 + perfScore * 0.1) * 100;
  if (score >= 95) return 'A';
  if (score >= 85) return 'B';
  if (score >= 70) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

function computeP75(durations) {
  if (!durations.length) return 0;
  const sorted = [...durations].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length * 0.75)];
}

function isSlowTest(t, p75) { return t.duration > p75 * 1.5; }

// ── Duration regression engine ─────────────────────────────────────────────
// regressionMap: key `${project}::${title}` → { rollingAvg, sampleCount }
// Built once per render() from all runs except the latest.
let regressionMap = new Map();

function buildRegressionMap() {
  regressionMap = new Map();
  if (runs.length < 2) return;

  const window_  = CONFIG.durationRegressionWindow    ?? 10;
  const minRuns  = CONFIG.durationRegressionMinRuns    ?? 3;
  const latest   = runs[0];

  // Only compute regression for tests present in the latest run
  const latestKeys = new Set(
    (latest.allTests ?? [])
      .filter(t => !t.quarantined && t.status !== 'skipped')
      .map(t => `${t.project}::${t.title}`)
  );

  for (const key of latestKeys) {
    const colonIdx = key.indexOf('::');
    const project  = key.slice(0, colonIdx);
    const title    = key.slice(colonIdx + 2);

    const priorRuns = runs.slice(1, 1 + window_);
    const durations = priorRuns.flatMap(run => {
      const t = (run.allTests ?? []).find(x => x.project === project && x.title === title);
      return (t && t.status !== 'skipped' && !t.quarantined && t.duration > 0) ? [t.duration] : [];
    });

    if (durations.length < minRuns) continue;

    const rollingAvg = durations.reduce((a, b) => a + b, 0) / durations.length;
    regressionMap.set(key, { rollingAvg, sampleCount: durations.length });
  }
}

function isRegressingTest(t) {
  if (!t || t.quarantined || t.status === 'skipped' || t.duration <= 0) return false;
  const key  = `${t.project}::${t.title}`;
  const data = regressionMap.get(key);
  if (!data) return false;
  return t.duration > data.rollingAvg * (CONFIG.durationRegressionThreshold ?? 1.5);
}

// ── Demo / fallback data ───────────────────────────────────────────────────
// Loaded when history-index.json is not found (e.g. opening the HTML directly).
// Includes three tests specifically designed to show the failure-point feature:
//   1. "User can log in"         — always fails at the SAME place (SAME POINT badge)
//   2. "Search returns results"  — fails at DIFFERENT places each time (NEW POINT badge)
//   3. "Checkout flow"           — recently CHANGED failure point (NEW POINT on latest run)

const DEMO_SCREENSHOT = 'data:image/svg+xml,' + encodeURIComponent([
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450">',
  '<rect width="800" height="450" fill="#0d1117"/>',
  '<rect width="800" height="40" fill="#161b22"/>',
  '<circle cx="20" cy="20" r="6" fill="#ff5f57"/>',
  '<circle cx="40" cy="20" r="6" fill="#febc2e"/>',
  '<circle cx="60" cy="20" r="6" fill="#28c840"/>',
  '<rect x="100" y="8" width="500" height="24" rx="12" fill="#21262d"/>',
  '<text x="350" y="26" font-family="monospace" font-size="12" fill="#8b949e" text-anchor="middle">localhost:3000/dashboard</text>',
  '<rect x="0" y="40" width="800" height="360" fill="#0d1117"/>',
  '<rect x="60" y="80" width="680" height="260" rx="8" fill="#161b22" stroke="#f85149" stroke-width="1.5"/>',
  '<text x="400" y="170" font-family="monospace" font-size="18" fill="#f85149" text-anchor="middle">&#x2715; Assertion Failed</text>',
  '<text x="400" y="205" font-family="monospace" font-size="13" fill="#8b949e" text-anchor="middle">Expected element to be visible</text>',
  '<text x="400" y="235" font-family="monospace" font-size="11" fill="#6e7681" text-anchor="middle">Locator: .dashboard-header</text>',
  '<line x1="60" y1="370" x2="740" y2="370" stroke="#21262d" stroke-width="1"/>',
  '<text x="76" y="400" font-family="monospace" font-size="11" fill="#3fb950">&#x25CF; PASS</text>',
  '<text x="160" y="400" font-family="monospace" font-size="11" fill="#f85149">&#x25CF; FAIL  tests/auth.spec.ts</text>',
  '</svg>',
].join(''));

const DEMO_SCREENSHOT_SEARCH = 'data:image/svg+xml,' + encodeURIComponent([
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450">',
  '<rect width="800" height="450" fill="#0d1117"/>',
  '<rect width="800" height="40" fill="#161b22"/>',
  '<circle cx="20" cy="20" r="6" fill="#ff5f57"/>',
  '<circle cx="40" cy="20" r="6" fill="#febc2e"/>',
  '<circle cx="60" cy="20" r="6" fill="#28c840"/>',
  '<rect x="100" y="8" width="500" height="24" rx="12" fill="#21262d"/>',
  '<text x="350" y="26" font-family="monospace" font-size="12" fill="#8b949e" text-anchor="middle">localhost:3000/search</text>',
  '<rect x="0" y="40" width="800" height="360" fill="#0d1117"/>',
  '<rect x="60" y="80" width="680" height="260" rx="8" fill="#161b22" stroke="#f85149" stroke-width="1.5"/>',
  '<text x="400" y="170" font-family="monospace" font-size="18" fill="#f85149" text-anchor="middle">&#x2715; Timeout Exceeded</text>',
  '<text x="400" y="205" font-family="monospace" font-size="13" fill="#8b949e" text-anchor="middle">page.waitForSelector(\'.search-results\')</text>',
  '<text x="400" y="235" font-family="monospace" font-size="11" fill="#6e7681" text-anchor="middle">exceeded timeout of 5000ms</text>',
  '<line x1="60" y1="370" x2="740" y2="370" stroke="#21262d" stroke-width="1"/>',
  '<text x="76" y="400" font-family="monospace" font-size="11" fill="#f85149">&#x25CF; FAIL  tests/search.spec.ts</text>',
  '</svg>',
].join(''));

const DEMO_SCREENSHOT_CHECKOUT = 'data:image/svg+xml,' + encodeURIComponent([
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450">',
  '<rect width="800" height="450" fill="#0d1117"/>',
  '<rect width="800" height="40" fill="#161b22"/>',
  '<circle cx="20" cy="20" r="6" fill="#ff5f57"/>',
  '<circle cx="40" cy="20" r="6" fill="#febc2e"/>',
  '<circle cx="60" cy="20" r="6" fill="#28c840"/>',
  '<rect x="100" y="8" width="500" height="24" rx="12" fill="#21262d"/>',
  '<text x="350" y="26" font-family="monospace" font-size="12" fill="#8b949e" text-anchor="middle">localhost:3000/checkout</text>',
  '<rect x="0" y="40" width="800" height="360" fill="#0d1117"/>',
  '<rect x="60" y="80" width="680" height="260" rx="8" fill="#161b22" stroke="#f85149" stroke-width="1.5"/>',
  '<text x="400" y="170" font-family="monospace" font-size="18" fill="#f85149" text-anchor="middle">&#x2715; Element Not Visible</text>',
  '<text x="400" y="205" font-family="monospace" font-size="13" fill="#8b949e" text-anchor="middle">Locator: #order-confirmation</text>',
  '<text x="400" y="235" font-family="monospace" font-size="11" fill="#6e7681" text-anchor="middle">Expected to be visible — tests/checkout.spec.ts:67</text>',
  '<line x1="60" y1="370" x2="740" y2="370" stroke="#21262d" stroke-width="1"/>',
  '<text x="76" y="400" font-family="monospace" font-size="11" fill="#f85149">&#x25CF; FAIL  tests/checkout.spec.ts</text>',
  '</svg>',
].join(''));

const DEMO_RUNS = (() => {
  const p = (title, file, duration, status, error) => ({
    title, file, project: 'chromium', duration, status,
    error: error ?? undefined, tags: [], annotations: [], artifacts: {},
  });
  const withShot = (t, src) => ({ ...t, artifacts: { ...t.artifacts, screenshot: src } });
  const stable = (dur) => [
    p('User profile page loads correctly',   'tests/profile.spec.ts',        dur + 230,  'passed'),
    p('Dashboard overview renders',          'tests/dashboard.spec.ts',      dur - 15,   'passed'),
    p('Notifications are displayed',         'tests/notifications.spec.ts',  dur + 450,  'passed'),
    p('API health check returns 200',        'tests/api.spec.ts',            dur - 680,  'passed'),
    p('Password reset email is sent',        'tests/auth.spec.ts',           dur + 100,  'passed'),
    p('User can update account settings',    'tests/settings.spec.ts',       dur + 680,  'passed'),
    p('Session expires after timeout',       'tests/auth.spec.ts',           dur + 1200, 'passed'),
  ];

  const LOGIN_ERROR = (ms) =>
    `TimeoutError: Waiting for locator('.dashboard-header') to be visible exceeded timeout of ${ms}ms\n    at expect(page.locator('.dashboard-header')).toBeVisible() (tests/auth.spec.ts:34:5)`;
  const SEARCH_TIMEOUT_ERROR =
    `TimeoutError: page.waitForSelector('.search-results') exceeded timeout of 5000ms\n    at SearchPage.waitForResults (tests/search.spec.ts:22:3)`;
  const SEARCH_ASSERT_ERROR =
    `AssertionError: expect(received).toHaveText(expected)\nExpected: "42 results found"\nReceived: "39 results found"\n    at expect(page.locator('.result-count')).toHaveText() (tests/search.spec.ts:28:5)`;
  const CHECKOUT_NEW_ERROR =
    `Error: expect(received).toBeVisible()\n\nLocator: locator('#order-confirmation')\n    at expect(page.locator('#order-confirmation')).toBeVisible() (tests/checkout.spec.ts:67:5)`;
  const CHECKOUT_OLD_ERROR =
    `Error: expect(received).toContainText()\n\nLocator: locator('.payment-summary')\nExpected string: "Visa ending in 4242"\nReceived string: "No payment method on file"\n    at expect(page.locator('.payment-summary')).toContainText() (tests/checkout.spec.ts:51:5)`;

  const mkRun = (runId, timestamp, tests) => {
    const passed  = tests.filter(t => t.status === 'passed').length;
    const failed  = tests.filter(t => t.status === 'failed').length;
    const flaky   = tests.filter(t => t.status === 'flaky').length;
    const skipped = tests.filter(t => t.status === 'skipped').length;
    const duration = tests.reduce((s, t) => s + t.duration, 0) + 800;
    return { runId, timestamp, duration, totalTests: tests.length, passed, failed, flaky, skipped, quarantined: 0, allTests: tests, failedTests: tests.filter(t => t.status !== 'passed') };
  };

  return [
    // Run 1 — newest (2026-04-05): login flaky (SAME POINT), search flaky (NEW POINT), checkout failed (NEW POINT — location changed)
    mkRun('2026-04-05T09-00-00-000Z', '2026-04-05T09:00:00.000Z', [
      withShot(p('User can log in with valid credentials', 'tests/auth.spec.ts',     4200, 'flaky',  LOGIN_ERROR(10000)),   DEMO_SCREENSHOT),
      withShot(p('Search returns relevant results',        'tests/search.spec.ts',   6800, 'flaky',  SEARCH_TIMEOUT_ERROR), DEMO_SCREENSHOT_SEARCH),
      withShot(p('Checkout flow completes order',          'tests/checkout.spec.ts', 8100, 'failed', CHECKOUT_NEW_ERROR),   DEMO_SCREENSHOT_CHECKOUT),
      ...stable(1000),
    ]),
    // Run 2 — 2026-04-04: login passed, search passed, checkout failed (SAME POINT as run 3)
    mkRun('2026-04-04T09-00-00-000Z', '2026-04-04T09:00:00.000Z', [
      p('User can log in with valid credentials', 'tests/auth.spec.ts',     1850, 'passed'),
      p('Search returns relevant results',        'tests/search.spec.ts',   2100, 'passed'),
      withShot(p('Checkout flow completes order',          'tests/checkout.spec.ts', 7900, 'failed', CHECKOUT_OLD_ERROR),   DEMO_SCREENSHOT_CHECKOUT),
      ...stable(1050),
    ]),
    // Run 3 — 2026-04-02: login flaky (SAME POINT as run 4), search flaky (different error from run 1), checkout failed (oldest — no badge)
    mkRun('2026-04-02T09-00-00-000Z', '2026-04-02T09:00:00.000Z', [
      withShot(p('User can log in with valid credentials', 'tests/auth.spec.ts',     3900, 'flaky',  LOGIN_ERROR(8000)),    DEMO_SCREENSHOT),
      withShot(p('Search returns relevant results',        'tests/search.spec.ts',   5200, 'flaky',  SEARCH_ASSERT_ERROR),  DEMO_SCREENSHOT_SEARCH),
      withShot(p('Checkout flow completes order',          'tests/checkout.spec.ts', 8300, 'failed', CHECKOUT_OLD_ERROR),   DEMO_SCREENSHOT_CHECKOUT),
      ...stable(980),
    ]),
    // Run 4 — 2026-04-01: login flaky (oldest login failure — no badge), search passed, checkout passed
    mkRun('2026-04-01T09-00-00-000Z', '2026-04-01T09:00:00.000Z', [
      withShot(p('User can log in with valid credentials', 'tests/auth.spec.ts',     4500, 'flaky',  LOGIN_ERROR(12000)),   DEMO_SCREENSHOT),
      p('Search returns relevant results',        'tests/search.spec.ts',   2300, 'passed'),
      p('Checkout flow completes order',          'tests/checkout.spec.ts', 2600, 'passed'),
      ...stable(1020),
    ]),
    // Run 5 — oldest (2026-03-30): all green
    mkRun('2026-03-30T09-00-00-000Z', '2026-03-30T09:00:00.000Z', [
      p('User can log in with valid credentials', 'tests/auth.spec.ts',     1920, 'passed'),
      p('Search returns relevant results',        'tests/search.spec.ts',   2150, 'passed'),
      p('Checkout flow completes order',          'tests/checkout.spec.ts', 2450, 'passed'),
      ...stable(1010),
    ]),
  ];
})();
