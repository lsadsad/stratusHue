---
id: spy
category: meta
title: "Test bug: shared vi.fn() spy across spread mock elements causes false negative-assertion failure"
type: bug
priority: 2
status: closed
depends_on: []
created: 2026-06-15
closed: 2026-06-15
---

## Description

`src/test/ui-state-persistence-integration.test.ts` →
`Error Handling Integration > should continue working when some sections fail to restore`
fails on the current branch (pre-existing; not introduced by the `anc` fix).

```
AssertionError: expected "spy" to not be called at all, but actually been called 1 times
  1st spy call: [ "aria-expanded", "false" ]
 ❯ src/test/ui-state-persistence-integration.test.ts:284
```

## Root cause — shared spy reference across spread mocks

The file defines a single shared `mockElement` whose methods are `vi.fn()`
instances (lines 13-21):

```ts
const mockElement = {
  id: '',
  getAttribute: vi.fn(),
  setAttribute: vi.fn(),          // ← one shared fn instance
  classList: { add: vi.fn(), remove: vi.fn() }
};
```

The failing test builds two headers by spreading `mockElement` and overriding
only `getAttribute` (lines 236-246):

```ts
const mockGoodHeader = { ...mockElement, id: 'good-header', getAttribute: vi.fn()... };
const mockBadHeader  = { ...mockElement, id: 'bad-header',  getAttribute: vi.fn()... };
```

Object spread copies `setAttribute` (and `classList.*`) **by reference**, so
`mockGoodHeader.setAttribute === mockBadHeader.setAttribute === mockElement.setAttribute`
— all the same spy. When the good header calls `setAttribute('aria-expanded','false')`,
the subsequent negative assertion on the bad header sees that call:

```ts
expect(mockBadHeader.setAttribute).not.toHaveBeenCalled(); // FAILS — shared spy
```

The sibling test "should handle UI restoration during plugin initialization"
(lines 95-156) shares the same flaw but only makes **positive** assertions, so it
passes by accident.

Note: the test also exercises an **inline simulation** of restoration (the
`forEach` at lines 265-277), not a real `restoreUISectionStates` from source — so
this failure reflects a test artifact, not a product defect.

## Recommended fix

Give each mock element its own spy instances instead of spreading shared ones.
Add a factory:

```ts
function makeMockHeader(id: string, target: string | null) {
  return {
    id,
    getAttribute: vi.fn().mockReturnValue(target),
    setAttribute: vi.fn(),
    classList: { add: vi.fn(), remove: vi.fn() },
  };
}
```

Use it for every header/section in this file. Then the negative assertion holds
because each element owns a distinct spy.

No source change required — this is a test-only correction.

## Notes

- Confirmed pre-existing via `git stash` of the `anc` fix; unrelated to bookmarks.
- Same shared-`vi.fn()`-via-spread footgun could hide other false positives in
  this file; the factory fix removes the class of bug, not just this instance.

## Resolution (2026-06-15)

Gave each mock header/section in the failing test its own `setAttribute` /
`classList` spy instances instead of spreading the shared `mockElement`
(`src/test/ui-state-persistence-integration.test.ts:235`). The negative
assertion now holds. No source change. Full `src/test` suite green (324/324).

Remaining cleanup (not required for green): the sibling tests in this file still
spread `mockElement` and pass only because their assertions are positive. A
file-wide `makeMockHeader()` factory would remove the latent footgun entirely —
left as optional follow-up.
