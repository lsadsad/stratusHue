---
id: dsa
category: meta
title: "design-system-assessment integration tests can't locate src/styles.css under full vitest run"
type: bug
priority: 3
status: open
depends_on: []
created: 2026-06-15
---

## Description

`tools/design-system-assessment/integration.test.ts` fails 7 cases under
`npm run test`:

```
Error: Failed to analyze design system: Could not find styles.css file in any of the expected locations
 ❯ analyzeDesignSystem tools/design-system-assessment/index.ts:94
```

## Root cause (suspected)

`tools/design-system-assessment/css-loader.ts` resolves `styles.css` from a list of
relative paths (`'src/styles.css'`, `'../styles.css'`, …). Those resolve against the
process cwd, which differs when the tool's tests run as part of the repo-root vitest
sweep vs. standalone — so none of the candidate paths hit the real
`src/styles.css`.

## Recommended next steps

1. Make `css-loader.ts` resolve `styles.css` relative to the module (`__dirname` /
   `import.meta.url`) or the repo root, not the cwd.
2. Alternatively, scope these tool tests out of the default `npm run test` and give
   `tools/design-system-assessment` its own test script — this tool is dev-only and
   not part of the shipped plugin.

## Notes

- Pre-existing; unrelated to the `anc` bookmark fix.
- `tools/design-system-assessment` is a dev/analysis tool, not shipped plugin code —
  low user impact, hence P3. Decide (1) fix path resolution vs (2) separate runner.
