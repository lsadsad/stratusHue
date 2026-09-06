/// <reference types="@figma/plugin-typings" />
import { describe, it, expect, beforeEach } from 'vitest';

// Integration test for the REAL persistence layer (core/state.ts) wired to the
// REAL bookmark operations (features/bookmarks.ts). Unlike bookmarks.test.ts —
// which mocks core/state.ts wholesale — this exercises the cache-aside pattern
// against figma.root pluginData, the exact seam where the "anchors accepted at
// max but not displayed / not persisted" bug lived (issue `anc`).

// In-memory stand-in for figma.root pluginData. setFull() makes the next write
// throw, mimicking Figma's per-node pluginData size ceiling.
let store: Record<string, string>;
let full = false;

function wirePluginData(): void {
  store = {};
  full = false;
  (figma.root as any).getPluginData = (key: string) => store[key] ?? '';
  (figma.root as any).setPluginData = (key: string, value: string) => {
    if (full) throw new Error('pluginData size limit exceeded');
    store[key] = value;
  };
  (figma.currentPage as any).selection = [];
}

function makeNode(id: string, name: string) {
  return { id, name, type: 'RECTANGLE', parent: { type: 'PAGE', name: 'P' } } as unknown as SceneNode & { name: string };
}

describe('Bookmark persistence (real state cache-aside)', () => {
  beforeEach(async () => {
    wirePluginData();
    const state = await import('../core/state');
    state.clearBookmarksCache();
  });

  it('persists every added bookmark and keeps the cache consistent with disk', async () => {
    const state = await import('../core/state');
    const { addBookmark } = await import('../features/bookmarks');

    for (let i = 0; i < 6; i++) {
      await addBookmark(makeNode(`n${i}`, `Node ${i}`));
    }

    const onDisk = JSON.parse(store['bookmarks'] || '[]');
    const cached = await state.getBookmarks();

    expect(onDisk).toHaveLength(6);
    expect(cached).toHaveLength(6);
    expect(cached.map(b => b.id)).toEqual(['n0', 'n1', 'n2', 'n3', 'n4', 'n5']);
  });

  it('surfaces the failure instead of silently succeeding when a save is rejected', async () => {
    const { addBookmark } = await import('../features/bookmarks');

    await addBookmark(makeNode('n0', 'Node 0'));
    full = true; // store is now "full" — next save throws

    await expect(addBookmark(makeNode('n1', 'Node 1'))).rejects.toThrow();
  });

  it('does not leave a phantom (unsaved) entry in the cache after a failed save', async () => {
    const state = await import('../core/state');
    const { addBookmark } = await import('../features/bookmarks');

    await addBookmark(makeNode('n0', 'Node 0'));
    full = true;
    await expect(addBookmark(makeNode('n1', 'Node 1'))).rejects.toThrow();

    const onDisk = JSON.parse(store['bookmarks'] || '[]');
    const cached = await state.getBookmarks();

    // The cache must reflect only what was actually persisted — no phantom 'n1'.
    expect(onDisk).toHaveLength(1);
    expect(cached).toHaveLength(1);
    expect(cached.map(b => b.id)).toEqual(['n0']);
  });
});
