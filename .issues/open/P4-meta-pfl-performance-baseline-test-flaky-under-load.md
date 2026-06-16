---
id: pfl
category: meta
title: "performance.test.ts baseline-comparison case is flaky under full-suite load"
type: bug
priority: 4
status: open
depends_on: []
created: 2026-06-15
---

## Description

`src/test/performance.test.ts > Performance Tests > Baseline Comparison Tests >
should compare against existing baselines` failed **once** during a full
`npm run test` run, then passed on two standalone re-runs (15/15 each):

```
npx vitest --run src/test/performance.test.ts   # → 15 passed (x2)
npm run test                                     # → intermittent 1 failure here
```

## Root cause (suspected)

The case compares measured timings against stored baselines. Under the full-suite
run there is more concurrent CPU load than when the file runs alone, so a timing
threshold occasionally trips. It is load/timing-sensitive, not logic-driven.

## Recommended fix

- Make the baseline comparison tolerance-based (e.g. allow a regression factor) or
  skip hard timing assertions when `process.env.CI` / under the full sweep, OR
- Mark the timing-comparison assertions as advisory (warn, don't fail).

## Notes

- Pre-existing and intermittent; not caused by the `anc` fix (which doesn't touch
  the measured navigation paths). Logged because it was observed failing once this
  session — a flaky gate is a latent risk for "fully green."
- P4: low frequency, no product impact.
