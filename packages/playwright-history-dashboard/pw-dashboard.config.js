// pw-dashboard.config.js
// Copy this file to your project root and rename it to pw-dashboard.config.js
// Then run: npx pw-history-init
//
// All fields are optional — omit any you don't want to override.

module.exports = {
	// Your project name — shown in the topbar and footer
	projectName: 'My Project',

	// Top-left brand label
	brandName: 'pw_dashboard',

	// Browser tab title
	pageTitle: 'Test History Dashboard',

	// Where the reporter writes history (must match historyDir in playwright.config.ts)
	historyDir: 'tests/report/test-history',

	// Path to history-index.json relative to index.html (rarely needs changing)
	historyIndexPath: 'history-index.json',
};
