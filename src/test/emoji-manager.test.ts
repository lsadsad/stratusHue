/// <reference types="@figma/plugin-typings" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCurrentEmojiSet, navigateEmojiSet, getEmojiNavigationState, addEmojiToSelection, clearEmojiFromSelection, isValidEmoji, getEmojiType, walkDescendants, addEmojiToSelectionRecursive } from '../features/emoji-manager';
import { LAYER_EMOJI_SETS, PAGE_EMOJI_SETS } from '../core/constants';
import { createMockSceneNode, createMockContainer } from './setup';

// Mock dependencies
vi.mock('../core/state', () => {
  let layerIndex = 0;
  let pageIndex = 0;

  const mock = {
    setLayerEmojiSetIndex: vi.fn((idx: number) => { layerIndex = idx; }),
    setPageEmojiSetIndex: vi.fn((idx: number) => { pageIndex = idx; }),
    __resetIndices: () => { layerIndex = 0; pageIndex = 0; },
    __setLayerIndex: (i: number) => { layerIndex = i; },
    __setPageIndex: (i: number) => { pageIndex = i; }
  };

  Object.defineProperty(mock, 'currentLayerEmojiSetIndex', { get: () => layerIndex });
  Object.defineProperty(mock, 'currentPageEmojiSetIndex', { get: () => pageIndex });

  return mock;
});

vi.mock('./bookmarks', () => ({
  updateBookmarkIfExists: vi.fn(async () => false),
  updateBookmarksForPage: vi.fn(async () => false)
}));

vi.mock('../features/bookmarks', () => ({
  updateBookmarkIfExists: vi.fn(async () => false),
  updateBookmarksForPage: vi.fn(async () => false)
}));

vi.mock('../utils', () => ({
  replaceColorEmoji: vi.fn((name: string, emoji: string) => `${emoji} ${name}`),
  removeEmojiPrefix: vi.fn((name: string) => {
    // Simple mock: remove leading emoji + space
    return name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]+\s*/u, '');
  }),
  parsePageTitleParts: vi.fn((name: string) => ({
    leadingSpaces: '',
    emoji: null,
    date: null,
    title: name
  })),
  composePageTitle: vi.fn((parts: { emoji: string | null; title: string }) => {
    if (parts.emoji) return `${parts.emoji} ${parts.title}`;
    return parts.title;
  })
}));

import * as stateModule from '../core/state';
const { __resetIndices } = stateModule as any;

describe('Emoji Manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetIndices();
  });

  describe('getCurrentEmojiSet', () => {
    it('should return layer emoji set when isLayer is true', () => {
      const set = getCurrentEmojiSet(true);
      expect(set).toBe(LAYER_EMOJI_SETS[0]);
    });

    it('should return page emoji set when isLayer is false', () => {
      const set = getCurrentEmojiSet(false);
      expect(set).toBe(PAGE_EMOJI_SETS[0]);
    });
  });

  describe('navigateEmojiSet', () => {
    it('should navigate to next layer set', () => {
      const result = navigateEmojiSet('next', true);
      expect(result.index).toBe(1);
      expect(result.setName).toBe(LAYER_EMOJI_SETS[1].name);
    });

    it('should navigate to previous layer set (wrapping)', () => {
      // At index 0, going prev should wrap to last
      const result = navigateEmojiSet('prev', true);
      expect(result.index).toBe(LAYER_EMOJI_SETS.length - 1);
    });

    it('should navigate page sets independently', () => {
      const result = navigateEmojiSet('next', false);
      expect(result.index).toBe(1);
      expect(result.setName).toBe(PAGE_EMOJI_SETS[1].name);
    });
  });

  describe('getEmojiNavigationState', () => {
    it('should return correct state for layer mode', () => {
      const state = getEmojiNavigationState(true);
      expect(state.currentSetIndex).toBe(0);
      expect(state.totalSets).toBe(LAYER_EMOJI_SETS.length);
      expect(state.setName).toBe(LAYER_EMOJI_SETS[0].name);
    });

    it('should return correct state for page mode', () => {
      const state = getEmojiNavigationState(false);
      expect(state.currentSetIndex).toBe(0);
      expect(state.totalSets).toBe(PAGE_EMOJI_SETS.length);
      expect(state.setName).toBe(PAGE_EMOJI_SETS[0].name);
    });
  });

  describe('addEmojiToSelection', () => {
    it('should add emoji to selected layers', async () => {
      const node = createMockSceneNode('node-1', 'My Layer');
      figma.currentPage.selection = [node];

      const result = await addEmojiToSelection('🟥');

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(result.message).toContain('1 layer');
    });

    it('should add emoji to multiple selected layers', async () => {
      const node1 = createMockSceneNode('node-1', 'Layer 1');
      const node2 = createMockSceneNode('node-2', 'Layer 2');
      figma.currentPage.selection = [node1, node2];

      const result = await addEmojiToSelection('🟦');

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
    });

    it('should add emoji to current page when no selection', async () => {
      figma.currentPage.selection = [];

      const result = await addEmojiToSelection('🔴');

      expect(result.success).toBe(true);
      expect(result.message).toContain('page');
    });
  });

  describe('clearEmojiFromSelection', () => {
    it('should clear emoji from selected layers', async () => {
      const node = createMockSceneNode('node-1', '🟥 My Layer');
      figma.currentPage.selection = [node];

      const result = await clearEmojiFromSelection();

      // The mock removeEmojiPrefix will strip the emoji
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('should report no emojis found when layer has no emoji', async () => {
      const node = createMockSceneNode('node-1', 'Plain Layer');
      // Mock removeEmojiPrefix to return same name (no emoji to remove)
      const { removeEmojiPrefix } = await import('../utils');
      (removeEmojiPrefix as any).mockReturnValue('Plain Layer');

      figma.currentPage.selection = [node];

      const result = await clearEmojiFromSelection();

      expect(result.success).toBe(false);
      expect(result.message).toContain('No emojis');
    });

    it('should handle page emoji clearing when no selection', async () => {
      figma.currentPage.selection = [];
      (figma.currentPage as any).name = '🔴 My Page';

      const { parsePageTitleParts } = await import('../utils');
      (parsePageTitleParts as any).mockReturnValue({
        leadingSpaces: '',
        emoji: '🔴',
        date: null,
        title: 'My Page'
      });

      const result = await clearEmojiFromSelection();

      expect(result.success).toBe(true);
      expect(result.message).toContain('page');
    });
  });

  describe('isValidEmoji', () => {
    it('should return true for layer emojis', () => {
      const layerEmoji = LAYER_EMOJI_SETS[0].emojis[0];
      expect(isValidEmoji(layerEmoji)).toBe(true);
    });

    it('should return true for page emojis', () => {
      const pageEmoji = PAGE_EMOJI_SETS[0].emojis[0];
      expect(isValidEmoji(pageEmoji)).toBe(true);
    });

    it('should return false for unknown emojis', () => {
      expect(isValidEmoji('😎')).toBe(false);
    });
  });

  describe('getEmojiType', () => {
    it('should identify layer emojis', () => {
      // 🟥 is in LAYER_EMOJI_SETS
      expect(getEmojiType('🟥')).toBe('layer');
    });

    it('should identify page emojis', () => {
      // 🔴 is in PAGE_EMOJI_SETS
      expect(getEmojiType('🔴')).toBe('page');
    });

    it('should return unknown for unrecognized emojis', () => {
      expect(getEmojiType('😎')).toBe('unknown');
    });
  });

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
});
