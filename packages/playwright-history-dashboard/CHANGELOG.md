# @acahet/playwright-history-dashboard

## 3.0.5

### Patch Changes

- Fixed `pw-history-init` config loading across `pw-dashboard.config.js`, `.cjs`, and `.mjs`.
- Fixed ESM project compatibility when reading dashboard config files.
- Fixed dashboard template path resolution used by `pw-history-init`.
- Fixed Windows CRLF handling during CONFIG injection into `index.html`.
- Fixed CONFIG replacement to update the existing block instead of appending a duplicate block.
- Improved init failure behavior with explicit errors when CONFIG block is missing.
- Updated README with aligned `historyDir` guidance between `pw-dashboard.config.*` and Playwright reporter options.
- Updated README troubleshooting and option docs for `projectName`, `brandName`, and `pageTitle`.

## 3.0.0

### Major Changes

- fix: Playwright reporter now loads correctly from the package root.- Added root "." export in package.json to allow @acahet/playwright-history-dashboard to be imported directly.- Maintains subpath import (/reporter) and CLI functionality (pw-history-init).- TypeScript types are correctly resolved.- Ensures compatibility with Playwright and Node ESM resolution.

## 2.0.0

### Major Changes

- 51cd994: feat: publish history dashboard to npm, extract playwright-config as standalone package, add missing .eslintrc.js to pw-standard

## 1.0.1

### Patch Changes

- 4329be3: Convert repository to npm workspaces with three independent packages and introduce `@acahet/playwright-config`.

  Summary:

  - migrate to `packages/*` workspace structure
  - split Playwright config into dedicated package
  - keep a compatibility bridge export at `@acahet/pw-standard/playwright`
  - update dashboard package metadata/docs for new workspace location
  - add root orchestration scripts and Changesets configuration
