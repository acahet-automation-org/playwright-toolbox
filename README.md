# Playwright Toolbox Monorepo

This repository is an npm workspaces monorepo with three independent packages:

1. `@acahet/pw-standard`
2. `@acahet/playwright-configs`
3. `@acahet/playwright-history-dashboard`

## Workspace layout

-   `packages/pw-standard`
-   `packages/playwright-config`
-   `packages/playwright-history-dashboard`

## Package usage

### 1) @acahet/pw-standard

Use for Playwright ESLint rules, base abstractions, and tsconfig presets.

```bash
npm i -D @acahet/pw-standard
```

### 2) @acahet/playwright-configs

Use for extracted Playwright config presets.

```bash
npm i -D @acahet/playwright-configs
```

### 3) @acahet/playwright-history-dashboard

Use for local run history tracking and static dashboard visualization.

```bash
npm i -D @acahet/playwright-history-dashboard
```

See package-specific docs:

-   `packages/pw-standard/README.md`
-   `packages/playwright-config/README.md`
-   `packages/playwright-history-dashboard/README.md`

## Local development

Run from monorepo root:

```bash
npm install
npm run build
npm test
npm run lint
```

## Independent versioning and release

Changesets is configured for independent package versioning.

```bash
npm run changeset
npm run version-packages
npm run release
```

## Migration notes

### Import migration

-   Previous: `@acahet/pw-standard/playwright`
-   New preferred: `@acahet/playwright-configs`
-   Compatibility: `@acahet/pw-standard/playwright` is still re-exported for transition safety.

### Folder migration

-   Previous rules source: `playwright-rules/src`
-   New rules source: `packages/pw-standard/src`

-   Previous rules tests: `playwright-rules/tests`
-   New rules tests: `packages/pw-standard/tests`

-   Previous dashboard folder: `playwright-history-dashboard/`
-   New dashboard folder: `packages/playwright-history-dashboard/`

### Release migration

-   Previous root package publish model: one publishable root package plus one nested package.
-   New model: three independent workspace packages with Changesets-managed versioning.
