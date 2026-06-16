---
id: pwt
category: meta
title: "Playwright spec (tests/prototype) is picked up by vitest and fails the run"
type: bug
priority: 3
status: open
depends_on: []
created: 2026-06-15
---

## Description

`npm run test` (vitest) globs and tries to execute the Playwright spec
`tests/prototype/settings.spec.ts`, which fails to even load:

```
FAIL  tests/prototype/settings.spec.ts
Error: Playwright Test did not expect test.describe() to be called here.
 ❯ import { test, expect } from '@playwright/test';
```

This is a **test-runner collision**, not a product bug: a Playwright spec must run
under `playwright test`, not vitest. It pollutes every `npm run test` with a red
suite.

## Root cause

`vitest.config.ts` only excludes `node_modules/**` and `dist/**` from test
discovery, so vitest also collects `tests/**` (Playwright specs).

## Recommended fix

Exclude the Playwright spec dir from vitest discovery in `vitest.config.ts`:

```ts
exclude: [
  'node_modules/**',
  'dist/**',
  'tests/**',            // Playwright specs — run via `playwright test`, not vitest
],
```

(Confirm there's a separate `playwright.config.*` / npm script that runs
`tests/prototype/**`; if not, add one so those specs still have a runner.)

## Notes

- Pre-existing; unrelated to the `anc` bookmark fix.
- Cheap, config-only fix that removes a permanent red suite from `npm run test`.
