---
'@acahet/pw-standard': minor
'@acahet/playwright-config': minor
'@acahet/playwright-history-dashboard': patch
---

Convert repository to npm workspaces with three independent packages and introduce `@acahet/playwright-config`.

Summary:

-   migrate to `packages/*` workspace structure
-   split Playwright config into dedicated package
-   keep a compatibility bridge export at `@acahet/pw-standard/playwright`
-   update dashboard package metadata/docs for new workspace location
-   add root orchestration scripts and Changesets configuration
