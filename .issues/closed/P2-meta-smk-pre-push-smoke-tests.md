---
id: smk
category: meta
title: "Pre-push validation gate with smoke tests for all message handlers"
type: feature
priority: 2
status: closed
depends_on: []
created: 2026-03-28
closed: 2026-03-28
---

## Summary

Added `src/test/smoke-dispatch.test.ts` — 62 tests covering all sandbox message handlers. Each test fires a message through the real `onmessage` handler with a minimal valid payload and asserts no silent crashes (via `console.error` and `figma.notify` spies).

Updated `npm run validate` to include `type-check` as the first step. Added smoke test to `test:critical`.

## Deliverables

- `src/test/smoke-dispatch.test.ts` — smoke test file
- `package.json` — updated `validate` and `test:critical` scripts
- `CLAUDE.md` — finePrint rule: add smoke test for every new message handler

## Specs & Plans

- `docs/superpowers/specs/2026-03-28-pre-push-smoke-test-design.md`
- `docs/superpowers/plans/2026-03-28-pre-push-smoke-test.md`
