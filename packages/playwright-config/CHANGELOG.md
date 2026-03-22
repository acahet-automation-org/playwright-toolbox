# @acahet/playwright-config

## 1.2.0

### Minor Changes

- 51cd994: feat: publish history dashboard to npm, extract playwright-config as standalone package, add missing .eslintrc.js to pw-standard

## 1.1.0

### Minor Changes

- 4329be3: Convert repository to npm workspaces with three independent packages and introduce `@acahet/playwright-config`.

  Summary:

  - migrate to `packages/*` workspace structure
  - split Playwright config into dedicated package
  - keep a compatibility bridge export at `@acahet/pw-standard/playwright`
  - update dashboard package metadata/docs for new workspace location
  - add root orchestration scripts and Changesets configuration
