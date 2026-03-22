# Releasing and Testing Guide

This guide explains how to:

1. Publish updates to npmjs
2. Test the package in `pw_ui_api` before publishing
3. Push changes to GitHub
4. Publish to GitHub Packages

---

## 1. Prerequisites

Before starting, make sure you have:

- Node.js 18+
- npm logged in for npmjs publishing (`npm login`)
- GitHub access to the repository
- A GitHub token (for GitHub Packages) with:
    - `read:packages`
    - `write:packages`
    - `repo` (if repository is private)

Package location in this workspace:

- `package/packages/playwright-history-dashboard`

---

## 2. Recommended Release Flow (Safe)

Run all commands from:

```bash
cd /Users/andersoncahet/Documents/studies/package/packages/playwright-history-dashboard
```

### Step A: Update version

Edit `package.json` and bump `version` (example `0.1.0` -> `0.1.1`).

Or use npm versioning:

```bash
npm version patch
# or: npm version minor
# or: npm version major
```

### Step B: Build and package

```bash
npm run build
npm pack
```

This creates a tarball like:

- `acahet-playwright-history-dashboard-0.1.1.tgz`

### Step C: Local test in consumer project (recommended)

Install tarball in `pw_ui_api`:

```bash
cd /Users/andersoncahet/Documents/studies/pw_ui_api
npm i -D ../package/packages/playwright-history-dashboard/acahet-playwright-history-dashboard-0.1.1.tgz
```

Update reporter in `playwright.config.ts` to use package reporter export:

```ts
reporter: [
	['html', { outputFolder: playwrightReportDir }],
	[
		'@acahet/playwright-history-dashboard/reporter',
		{
			historyDir: 'tests/report/test-history',
			maxRuns: 30,
		},
	],
	['list'],
	['json', { outputFile: './tests/report/test-results.json' }],
];
```

Then run:

```bash
npx pw-history-init
npx playwright test --project ui-tests
npm run report:history
```

Validation checklist:

- `tests/report/test-history/index.html` exists
- `tests/report/test-history/history-index.json` is updated
- report history server opens dashboard successfully

---

## 3. Publish to npmjs

After local validation:

```bash
cd /Users/andersoncahet/Documents/studies/package/packages/playwright-history-dashboard
npm publish --access public
```

Verify:

```bash
npm view @acahet/playwright-history-dashboard version
```

---

## 4. Save to GitHub (Code Changes)

From package repository folder:

```bash
cd /Users/andersoncahet/Documents/studies/package/packages/playwright-history-dashboard
git status
git add .
git commit -m "chore: release v0.1.1"
git push origin main
```

Optional: add git tag matching version:

```bash
git tag v0.1.1
git push origin v0.1.1
```

---

## 5. Publish to GitHub Packages (npm.pkg.github.com)

You can publish to GitHub Packages in addition to npmjs.

## 5.1 Confirm package scope

GitHub Packages requires package scope to match the owner namespace.

Examples:

- Owner `acahet` -> `@acahet/playwright-history-dashboard`
- Owner `acahet-automation-org` -> `@acahet-automation-org/playwright-history-dashboard`

If owner differs from current scope, update `name` in `package.json` before publishing to GitHub Packages.

## 5.2 Configure `.npmrc`

Create or update `.npmrc` in package root:

```ini
@acahet:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

Replace `@acahet` with your actual scope if different.

## 5.3 Publish to GitHub registry

```bash
npm publish --registry https://npm.pkg.github.com
```

---

## 6. Optional: Test Installed Package from npm Registry

After publishing, test by installing from registry in `pw_ui_api`:

```bash
cd /Users/andersoncahet/Documents/studies/pw_ui_api
npm i -D @acahet/playwright-history-dashboard@latest
```

Run:

```bash
npx pw-history-init
npx playwright test --project ui-tests
npm run report:history
```

---

## 7. Rollback / Recovery

If package integration causes issues in `pw_ui_api`, switch back to local reporter:

```ts
['./tests/reporters/history-reporter.ts'];
```

Then reinstall dependencies cleanly:

```bash
npm install
```

---

## 8. Common Issues

### `404` on npm publish

- Package name already used or access missing
- Ensure correct scope and npm account/org permissions

### GitHub Packages `403` / auth errors

- Token missing scopes (`write:packages`, `read:packages`)
- Scope in package name does not match owner
- `.npmrc` points to wrong scope

### `pw-history-init` not found

- Ensure package is installed in consumer project
- Run through `npx pw-history-init`

### Reporter not loading

- Use export path: `@acahet/playwright-history-dashboard/reporter`
- Confirm `playwright.config.ts` reporter array syntax

---

## 9. One-Command Pre-Release Sanity Check

In package folder:

```bash
npm run build && npm pack
```

In consumer folder:

```bash
npm i -D ../package/packages/playwright-history-dashboard/acahet-playwright-history-dashboard-0.1.1.tgz && npx pw-history-init && npx playwright test --project ui-tests
```

If these pass, you are ready to publish.
