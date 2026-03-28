# Recursive Emoji Tagging & Sticky Section Headers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Shift+click recursive emoji tagging through layer trees, and make Navigate section headers sticky during scroll.

**Architecture:** Two independent features sharing one plan. Feature 1 adds new message types (`add-emoji-recursive`, `clear-emoji-recursive`) and a tree-walking helper in `emoji-manager.ts`. Feature 2 is pure CSS — sticky positioning on section headers with stacking offsets. No shared code between features.

**Tech Stack:** TypeScript, Figma Plugin API, CSS, Vitest

**Specs:**
- `docs/superpowers/specs/2026-03-27-recursive-emoji-tagging-design.md`
- `docs/superpowers/specs/2026-03-27-sticky-section-headers-design.md`

---

## File Structure

### Feature 1: Recursive Emoji Tagging

| File | Action | Responsibility |
|---|---|---|
| `src/features/emoji-manager.ts` | Modify | Add `walkDescendants`, `addEmojiToSelectionRecursive`, `clearEmojiFromSelectionRecursive` |
| `src/core/types.ts` | Modify | Add `'add-emoji-recursive'` and `'clear-emoji-recursive'` to message type definitions |
| `src/code.ts` | Modify | Add dispatch cases and handlers for new message types |
| `src/ui/navigate/anatomy.ts` | Modify | Shift detection on emoji button click |
| `src/ui/navigate/navigate-ui.ts` | Modify | Shift detection on clear button click |
| `src/test/emoji-manager.test.ts` | Modify | Add tests for recursive functions |

### Feature 2: Sticky Section Headers

| File | Action | Responsibility |
|---|---|---|
| `src/styles.css` | Modify | Sticky positioning, contain fix, transition fix |

---

## Task 1: Recursive Emoji — Write `walkDescendants` helper and tests

**Files:**
- Modify: `src/features/emoji-manager.ts:1-9` (imports area, add new function after line 53)
- Modify: `src/test/emoji-manager.test.ts`

- [ ] **Step 1: Write failing tests for `walkDescendants`**

Add a new `describe` block at the end of `src/test/emoji-manager.test.ts`. Import `walkDescendants` alongside existing imports on line 3:

```typescript
// Update line 3 import to include walkDescendants:
import { getCurrentEmojiSet, navigateEmojiSet, getEmojiNavigationState, addEmojiToSelection, clearEmojiFromSelection, isValidEmoji, getEmojiType, walkDescendants } from '../features/emoji-manager';
```

Add tests after the existing `getEmojiType` describe block (after line 219):

```typescript
describe('walkDescendants', () => {
  it('should visit all children of a container node', () => {
    const child1 = createMockSceneNode('c1', 'Child 1');
    const child2 = createMockSceneNode('c2', 'Child 2');
    const parent = createMockContainer('p1', 'Parent', 'FRAME', [child1, child2]);

    const visited: string[] = [];
    walkDescendants(parent, (node) => { visited.push(node.id); });

    expect(visited).toEqual(['c1', 'c2']);
  });

  it('should recursively visit nested descendants', () => {
    const grandchild = createMockSceneNode('gc1', 'Grandchild');
    const child = createMockContainer('c1', 'Child', 'GROUP', [grandchild]);
    const parent = createMockContainer('p1', 'Parent', 'FRAME', [child]);

    const visited: string[] = [];
    walkDescendants(parent, (node) => { visited.push(node.id); });

    expect(visited).toEqual(['c1', 'gc1']);
  });

  it('should do nothing for a leaf node (no children)', () => {
    const leaf = createMockSceneNode('leaf', 'Leaf');

    const visited: string[] = [];
    walkDescendants(leaf, (node) => { visited.push(node.id); });

    expect(visited).toEqual([]);
  });
});
```

Also import `createMockContainer` on line 5:

```typescript
import { createMockSceneNode, createMockContainer } from './setup';
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- --reporter=verbose 2>&1 | tail -30`
Expected: FAIL — `walkDescendants` is not exported from `emoji-manager`

- [ ] **Step 3: Implement `walkDescendants`**

In `src/features/emoji-manager.ts`, add after the imports (after line 4), before the first function:

```typescript
/**
 * Recursively walk all descendants of a node, applying fn to each.
 * No intermediate array — applies inline during traversal.
 */
export function walkDescendants(node: SceneNode, fn: (n: SceneNode) => void): void {
  if ('children' in node) {
    for (const child of (node as SceneNode & ChildrenMixin).children) {
      fn(child as SceneNode);
      walkDescendants(child as SceneNode, fn);
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- --reporter=verbose 2>&1 | tail -30`
Expected: PASS — all three `walkDescendants` tests green

- [ ] **Step 5: Commit**

```bash
git add src/features/emoji-manager.ts src/test/emoji-manager.test.ts
git commit -m "feat: add walkDescendants tree-walking helper with tests"
```

---

## Task 2: Recursive Emoji — Implement `addEmojiToSelectionRecursive`

**Files:**
- Modify: `src/features/emoji-manager.ts` (add function after `addEmojiToSelection`, ~line 104)
- Modify: `src/test/emoji-manager.test.ts`

- [ ] **Step 1: Write failing tests**

Add to `src/test/emoji-manager.test.ts`. Update the import on line 3 to include `addEmojiToSelectionRecursive`:

```typescript
import { getCurrentEmojiSet, navigateEmojiSet, getEmojiNavigationState, addEmojiToSelection, clearEmojiFromSelection, isValidEmoji, getEmojiType, walkDescendants, addEmojiToSelectionRecursive } from '../features/emoji-manager';
```

Add a new describe block:

```typescript
describe('addEmojiToSelectionRecursive', () => {
  it('should tag selected node and all descendants', async () => {
    const grandchild = createMockSceneNode('gc1', 'Grandchild');
    const child = createMockContainer('c1', 'Child', 'FRAME', [grandchild]);
    const parent = createMockContainer('p1', 'Parent', 'FRAME', [child]);
    figma.currentPage.selection = [parent];

    const result = await addEmojiToSelectionRecursive('🟥');

    expect(result.success).toBe(true);
    expect(result.count).toBe(3); // parent + child + grandchild
    expect(parent.name).toBe('🟥 Parent');
    expect(child.name).toBe('🟥 Child');
    expect(grandchild.name).toBe('🟥 Grandchild');
  });

  it('should skip locked descendants', async () => {
    const lockedChild = createMockSceneNode('lc1', 'Locked Child');
    (lockedChild as any).locked = true;
    const unlockedChild = createMockSceneNode('uc1', 'Unlocked Child');
    const parent = createMockContainer('p1', 'Parent', 'FRAME', [lockedChild, unlockedChild]);
    figma.currentPage.selection = [parent];

    const result = await addEmojiToSelectionRecursive('🟥');

    expect(result.count).toBe(2); // parent + unlocked child (locked skipped)
    expect(lockedChild.name).toBe('Locked Child'); // unchanged
    expect(unlockedChild.name).toBe('🟥 Unlocked Child');
  });

  it('should no-op with message when selection is empty', async () => {
    figma.currentPage.selection = [];

    const result = await addEmojiToSelectionRecursive('🟥');

    expect(result.success).toBe(false);
    expect(result.message).toContain('Select a layer');
    expect(result.count).toBe(0);
  });

  it('should work on a leaf node (no children)', async () => {
    const leaf = createMockSceneNode('leaf', 'Leaf');
    figma.currentPage.selection = [leaf];

    const result = await addEmojiToSelectionRecursive('🟥');

    expect(result.success).toBe(true);
    expect(result.count).toBe(1);
    expect(leaf.name).toBe('🟥 Leaf');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- --reporter=verbose 2>&1 | tail -30`
Expected: FAIL — `addEmojiToSelectionRecursive` is not exported

- [ ] **Step 3: Implement `addEmojiToSelectionRecursive`**

In `src/features/emoji-manager.ts`, add after the `addEmojiToSelection` function (after line 104):

```typescript
export async function addEmojiToSelectionRecursive(emoji: string): Promise<{ success: boolean; message: string; count: number }> {
  try {
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
      return { success: false, message: 'Select a layer to tag recursively', count: 0 };
    }

    let updatedCount = 0;
    let skippedLocked = 0;

    for (const node of selection) {
      if ('name' in node) {
        if ((node as any).locked) {
          skippedLocked++;
        } else {
          (node as SceneNode & { name: string }).name = replaceColorEmoji(node.name, emoji);
          updatedCount++;
        }

        walkDescendants(node, (descendant) => {
          if ('name' in descendant) {
            if ((descendant as any).locked) {
              skippedLocked++;
            } else {
              (descendant as SceneNode & { name: string }).name = replaceColorEmoji(descendant.name, emoji);
              updatedCount++;
            }
          }
        });

        // Update bookmark for root selected node only
        updateBookmarkIfExists(node.id, node.name).catch(console.error);
      }
    }

    const lockedSuffix = skippedLocked > 0 ? ` (${skippedLocked} locked layer${skippedLocked > 1 ? 's' : ''} skipped)` : '';
    return {
      success: updatedCount > 0,
      message: `Tagged ${updatedCount} layer${updatedCount !== 1 ? 's' : ''} with ${emoji}${lockedSuffix}`,
      count: updatedCount
    };
  } catch (error) {
    console.error('Error adding emoji recursively:', error);
    return { success: false, message: 'Failed to add emoji recursively. Please try again.', count: 0 };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- --reporter=verbose 2>&1 | tail -30`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/emoji-manager.ts src/test/emoji-manager.test.ts
git commit -m "feat: add addEmojiToSelectionRecursive with tests"
```

---

## Task 3: Recursive Emoji — Implement `clearEmojiFromSelectionRecursive`

**Files:**
- Modify: `src/features/emoji-manager.ts` (add function after `clearEmojiFromSelection`, ~line 167)
- Modify: `src/test/emoji-manager.test.ts`

- [ ] **Step 1: Write failing tests**

Update the import to include `clearEmojiFromSelectionRecursive`:

```typescript
import { getCurrentEmojiSet, navigateEmojiSet, getEmojiNavigationState, addEmojiToSelection, clearEmojiFromSelection, isValidEmoji, getEmojiType, walkDescendants, addEmojiToSelectionRecursive, clearEmojiFromSelectionRecursive } from '../features/emoji-manager';
```

Add a new describe block:

```typescript
describe('clearEmojiFromSelectionRecursive', () => {
  it('should clear emoji from selected node and all descendants', async () => {
    const grandchild = createMockSceneNode('gc1', '🟥 Grandchild');
    const child = createMockContainer('c1', '🟥 Child', 'FRAME', [grandchild]);
    const parent = createMockContainer('p1', '🟥 Parent', 'FRAME', [child]);
    figma.currentPage.selection = [parent];

    const result = await clearEmojiFromSelectionRecursive();

    expect(result.success).toBe(true);
    expect(result.count).toBe(3);
    expect(parent.name).toBe('Parent');
    expect(child.name).toBe('Child');
    expect(grandchild.name).toBe('Grandchild');
  });

  it('should skip locked descendants', async () => {
    const lockedChild = createMockSceneNode('lc1', '🟥 Locked');
    (lockedChild as any).locked = true;
    const unlockedChild = createMockSceneNode('uc1', '🟥 Unlocked');
    const parent = createMockContainer('p1', '🟥 Parent', 'FRAME', [lockedChild, unlockedChild]);
    figma.currentPage.selection = [parent];

    const result = await clearEmojiFromSelectionRecursive();

    expect(result.count).toBe(2); // parent + unlocked
    expect(lockedChild.name).toBe('🟥 Locked'); // unchanged
  });

  it('should no-op with message when selection is empty', async () => {
    figma.currentPage.selection = [];

    const result = await clearEmojiFromSelectionRecursive();

    expect(result.success).toBe(false);
    expect(result.message).toContain('Select a layer');
    expect(result.count).toBe(0);
  });

  it('should handle mixed tree with some nodes having no emoji', async () => {
    const tagged = createMockSceneNode('t1', '🟥 Tagged');
    const plain = createMockSceneNode('p1', 'Plain');
    const parent = createMockContainer('root', '🟥 Root', 'FRAME', [tagged, plain]);
    figma.currentPage.selection = [parent];

    const result = await clearEmojiFromSelectionRecursive();

    // removeEmojiPrefix mock strips leading emoji; 'Plain' stays 'Plain' (oldName === newName) so not counted
    expect(result.success).toBe(true);
    expect(result.count).toBe(2); // root + tagged child cleared; plain child unchanged
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- --reporter=verbose 2>&1 | tail -30`
Expected: FAIL — `clearEmojiFromSelectionRecursive` is not exported

- [ ] **Step 3: Implement `clearEmojiFromSelectionRecursive`**

In `src/features/emoji-manager.ts`, add after `clearEmojiFromSelection` (after ~line 167):

```typescript
export async function clearEmojiFromSelectionRecursive(): Promise<{ success: boolean; message: string; count: number }> {
  try {
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
      return { success: false, message: 'Select a layer to clear recursively', count: 0 };
    }

    let clearedCount = 0;
    let skippedLocked = 0;

    for (const node of selection) {
      if ('name' in node) {
        if ((node as any).locked) {
          skippedLocked++;
        } else {
          const oldName = node.name;
          const newName = removeEmojiPrefix(oldName);
          if (oldName !== newName) {
            (node as SceneNode & { name: string }).name = newName;
            clearedCount++;
          }
        }

        walkDescendants(node, (descendant) => {
          if ('name' in descendant) {
            if ((descendant as any).locked) {
              skippedLocked++;
            } else {
              const oldName = descendant.name;
              const newName = removeEmojiPrefix(oldName);
              if (oldName !== newName) {
                (descendant as SceneNode & { name: string }).name = newName;
                clearedCount++;
              }
            }
          }
        });

        // Update bookmark for root selected node only
        updateBookmarkIfExists(node.id, node.name).catch(console.error);
      }
    }

    const lockedSuffix = skippedLocked > 0 ? ` (${skippedLocked} locked layer${skippedLocked > 1 ? 's' : ''} skipped)` : '';
    return {
      success: clearedCount > 0,
      message: clearedCount > 0
        ? `Cleared emoji from ${clearedCount} layer${clearedCount !== 1 ? 's' : ''}${lockedSuffix}`
        : `No emojis found to clear${lockedSuffix}`,
      count: clearedCount
    };
  } catch (error) {
    console.error('Error clearing emoji recursively:', error);
    return { success: false, message: 'Failed to clear emoji recursively. Please try again.', count: 0 };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- --reporter=verbose 2>&1 | tail -30`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/emoji-manager.ts src/test/emoji-manager.test.ts
git commit -m "feat: add clearEmojiFromSelectionRecursive with tests"
```

---

## Task 4: Recursive Emoji — Wire sandbox dispatch in `code.ts`

**Files:**
- Modify: `src/code.ts:243-251` (add new cases after existing emoji dispatch)
- Modify: `src/code.ts:663-677` (add new handlers after existing emoji handlers)

- [ ] **Step 1: Add imports for new functions**

In `src/code.ts`, add the recursive variants to the existing **static** import from `'./features/emoji-manager'` (around line 29). The existing import looks like:

```typescript
import {
  addEmojiToSelection,
  clearEmojiFromSelection,
  navigateEmojiSet
} from './features/emoji-manager';
```

Add `addEmojiToSelectionRecursive` and `clearEmojiFromSelectionRecursive` to this import.

- [ ] **Step 1b: Update message types in `src/core/types.ts`**

In `src/core/types.ts`, the message types use a flexible `UIMessage` interface with `type: string` (line 52-56). No union type to extend — but add a comment documenting the new types near the existing message type documentation for discoverability. If there is a string union or documentation block listing message types, add `'add-emoji-recursive'` and `'clear-emoji-recursive'` there.

- [ ] **Step 2: Add dispatch cases**

In `src/code.ts`, add two new cases after the `case 'clear-emoji':` block (after line 251):

```typescript
case 'add-emoji-recursive':
  if ('emoji' in msg && msg.emoji && typeof msg.emoji === 'string') {
    await handleAddEmojiRecursive(msg.emoji);
  }
  break;

case 'clear-emoji-recursive':
  await handleClearEmojiRecursive();
  break;
```

- [ ] **Step 3: Add handler functions**

Add after the existing `handleClearEmoji` function (after line 677):

```typescript
const handleAddEmojiRecursive = withErrorBoundary(async (emoji: string) => {
  const result = await addEmojiToSelectionRecursive(emoji);
  figma.notify(result.message);
  if (result.success) {
    updateUIAfterEmojiChange();
  }
}, ErrorType.UNKNOWN);

const handleClearEmojiRecursive = withErrorBoundary(async () => {
  const result = await clearEmojiFromSelectionRecursive();
  figma.notify(result.message);
  if (result.success) {
    updateUIAfterEmojiChange();
  }
}, ErrorType.UNKNOWN);
```

- [ ] **Step 4: Run type-check**

Run: `npm run type-check 2>&1 | tail -20`
Expected: No errors

- [ ] **Step 5: Run all tests**

Run: `npm run test -- --reporter=verbose 2>&1 | tail -30`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add src/code.ts src/core/types.ts
git commit -m "feat: wire recursive emoji dispatch and handlers in sandbox"
```

---

## Task 5: Recursive Emoji — Add Shift detection in UI

**Files:**
- Modify: `src/ui/navigate/anatomy.ts:44-47` (emoji button click handler)
- Modify: `src/ui/navigate/navigate-ui.ts:252-255` (clear button click handler)

- [ ] **Step 1: Update emoji button click handler in `anatomy.ts`**

In `src/ui/navigate/anatomy.ts`, change the click handler at line 44 from:

```typescript
button.addEventListener('click', () => {
  console.log('Emoji clicked:', emoji);
  sendMessage('add-emoji', { emoji });
  showCanvasHint();
});
```

To:

```typescript
button.addEventListener('click', (e: MouseEvent) => {
  const messageType = e.shiftKey ? 'add-emoji-recursive' : 'add-emoji';
  console.log('Emoji clicked:', emoji, messageType);
  sendMessage(messageType, { emoji });
  showCanvasHint();
});
```

- [ ] **Step 2: Update clear button click handler in `navigate-ui.ts`**

In `src/ui/navigate/navigate-ui.ts`, change the click handler at line 253 from:

```typescript
clearBtn.addEventListener('click', () => {
  console.log('Clear clicked');
  sendMessage('clear-emoji');
});
```

To:

```typescript
clearBtn.addEventListener('click', (e: MouseEvent) => {
  const messageType = e.shiftKey ? 'clear-emoji-recursive' : 'clear-emoji';
  console.log('Clear clicked:', messageType);
  sendMessage(messageType);
});
```

- [ ] **Step 3: Run type-check**

Run: `npm run type-check 2>&1 | tail -20`
Expected: No errors

- [ ] **Step 4: Build and verify**

Run: `npm run build 2>&1 | tail -10`
Expected: Build succeeds with no errors

- [ ] **Step 5: Commit**

```bash
git add src/ui/navigate/anatomy.ts src/ui/navigate/navigate-ui.ts
git commit -m "feat: add Shift+click detection for recursive emoji tagging"
```

---

## Task 6: Sticky Section Headers — CSS changes

**Files:**
- Modify: `src/styles.css:1803-1806` (`.scrollable-content` contain fix)
- Modify: `src/styles.css:2483-2506` (`.section-header` sticky + transition fix)
- Modify: `src/styles.css` (add `#tags-header`, `#anchors-header`, `#controls-header` sticky offsets)

- [ ] **Step 1: Fix `.scrollable-content` containment**

In `src/styles.css`, find the `.scrollable-content` block at lines 1803-1806:

```css
.scrollable-content {
  will-change: scroll-position;
  contain: layout style paint;
}
```

Change `contain: layout style paint` to `contain: style`:

```css
.scrollable-content {
  will-change: scroll-position;
  contain: style;
}
```

- [ ] **Step 2: Fix `.section-header` transition and add sticky**

In `src/styles.css`, in the `.section-header` block (line ~2490), change:

```css
transition: all var(--transition-normal);
```

To:

```css
transition: background var(--transition-normal), color var(--transition-normal);
```

In the same block, replace `background: transparent` (line ~2494) with `background: var(--color-background-main)` — sticky headers need an opaque background. The individual header rules (`#tags-header`, etc.) override this with `background-color: var(--color-background-elevated)` which is also opaque.

Also in the same block (line ~2504), change `position: relative` to `position: sticky`. This still creates a containing block for positioned children.

- [ ] **Step 3: Add sticky stacking offsets**

Add after the `.section-header` block (or near the existing `#tags-header`, `#anchors-header`, `#controls-header` rules around lines 2684-2726). Find the existing `#tags-header` rule and add the sticky properties to each:

Add to the existing `#tags-header` rule:

```css
top: 0;
z-index: 3;
```

Add to the existing `#anchors-header` rule:

```css
top: calc(var(--spacing-lg) * 5 + var(--border-width));
z-index: 2;
```

Add to the existing `#controls-header` rule:

```css
top: calc((var(--spacing-lg) * 5 + var(--border-width)) * 2);
z-index: 1;
```

Note: The individual headers already have `background-color: var(--color-background-elevated)` which provides the opaque background needed for sticky headers. This takes precedence over the `background: var(--color-background-main)` set on `.section-header`, which is fine — `--color-background-elevated` is also opaque.

- [ ] **Step 4: Build and verify**

Run: `npm run build 2>&1 | tail -10`
Expected: Build succeeds

- [ ] **Step 5: Run full validation**

Run: `npm run validate 2>&1 | tail -20`
Expected: Lint + build pass

- [ ] **Step 6: Commit**

```bash
git add src/styles.css
git commit -m "feat: make Navigate section headers sticky with stacking offsets"
```

---

## Task 7: Final Validation

**Files:** None (verification only)

- [ ] **Step 1: Run full test suite**

Run: `npm run test -- --reporter=verbose 2>&1 | tail -40`
Expected: All tests pass

- [ ] **Step 2: Run type-check**

Run: `npm run type-check 2>&1 | tail -20`
Expected: No errors

- [ ] **Step 3: Run lint**

Run: `npm run lint 2>&1 | tail -20`
Expected: No errors

- [ ] **Step 4: Run production build**

Run: `npm run build:prod 2>&1 | tail -10`
Expected: Build succeeds

- [ ] **Step 5: Sync prototype**

Run: `npm run sync:prototype 2>&1 | tail -10`
Expected: Prototype synced successfully
