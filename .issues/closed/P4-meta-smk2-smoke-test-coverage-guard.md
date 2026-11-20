---
id: smk2
category: meta
title: "Auto-detect missing smoke tests for new message handlers"
type: feature
priority: 4
status: closed
depends_on: []
created: 2026-03-28
---

## Problem

The smoke test suite (`src/test/smoke-dispatch.test.ts`) only covers message types that are explicitly listed. If a new `case` is added to `figma.ui.onmessage` in `code.ts` without a corresponding smoke test, the gap is invisible.

## Proposed Solution

Add a test that parses the `case '...'` branches in `code.ts` and asserts every message type has a matching `it('handles "..."')` entry in the smoke test file. If they drift, the test fails with a clear message like:

```
Missing smoke test for message type: "my-new-feature"
```

This makes the smoke test self-enforcing — you can't add a handler without a test.

## Scope

- One new test in `smoke-dispatch.test.ts` (or a separate file)
- Regex or AST parse of code.ts switch cases
- Compare against test names in the describe block

## Parked — 2026-11-20

Parked, not done, in the 2026-11-20 backlog review (ruled by Levin 2026-11-20: "Take all 123").

Evidence, from the review: Never started: `src/test/smoke-dispatch.test.ts` still lists cases by hand and no test parses `code.ts` cases (`git grep` for a case-parsing test found none). No commit since it was filed; stratusHue's last code commit was the 10-03 release. Reopen when a handler ships without a smoke test.

Review: groundControl `docs/reviews/2026-11-20-backlog-review-other-repos.md`.
