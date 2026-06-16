---
id: esl
category: navigate
title: "Stale test: empty-selection 'enter' expects removed 'Select a container' message"
type: bug
priority: 2
status: closed
depends_on: []
created: 2026-06-15
closed: 2026-06-15
---

## Description

`src/test/navigation-basic.test.ts` →
`performNavigation > should handle empty selection gracefully` fails on the
current branch (pre-existing; not introduced by the `anc` fix).

```
AssertionError: expected 'No visible layers found on current pa…' to contain 'Select a container'
 ❯ src/test/navigation-basic.test.ts:120
```

## Root cause — test is stale, behavior is intentional

The test calls `performNavigation('enter', [])` with an empty selection and
asserts the message contains `'Select a container'`.

Tracing the real code path (`src/features/navigation.ts`):

- `performNavigation` → empty selection → `handleEmptySelection('enter')` (line 2182)
- `'enter'` case → `selectFirstTopLevelLayer()` (line 2192-2194)
- The test's `beforeEach` sets `figma.currentPage.children = []`, so there are no
  top-level layers → returns `{ success: false, message: 'No visible layers found on current page' }`
  (line 2227-2232)

`'Select a container'` exists **nowhere in `src/`** — only in this test
assertion. The empty-selection `'enter'` behavior was redesigned into a
page-level fallback (select the first top-level layer) but the assertion was
never updated. The current behavior is intentional and reasonable.

```bash
$ grep -rn "Select a container" src/
src/test/navigation-basic.test.ts:120:      expect(result.message).toContain('Select a container');
```

## Recommended fix

Update the test assertion to match the implemented page-level fallback. With an
empty page (`children = []`), the correct expectation is:

```ts
expect(result.success).toBe(false);
expect(result.message).toContain('No visible layers'); // page-level fallback, empty page
```

(Optionally add a sibling case where `figma.currentPage.children` has one visible
layer and assert `result.success === true` / `'Selected first layer'` to cover the
happy path of the fallback.)

No source change required — this is a test-only correction.

## Notes

- Confirmed pre-existing via `git stash` of the `anc` fix; unrelated to bookmarks.
- Keeps `npm run test` red until resolved, which erodes the suite's signal.

## Resolution (2026-06-15)

Updated the assertion in `src/test/navigation-basic.test.ts:114` to expect
`'No visible layers'` (the page-level fallback message for an empty page). No
source change. Full `src/test` suite green (324/324).
