/// <reference types="@figma/plugin-typings" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addBookmark, removeBookmark, reorderBookmarks, validateAndSyncBookmarks, updateBookmarkIfExists, detectCurrentAnchorFromSelection } from '../features/bookmarks';
import { createMockSceneNode, createMockPageNode } from './setup';

// We need to mock state and utils modules since bookmarks.ts imports them
vi.mock('../core/state', async () => {
  let bookmarks: Array<{ id: string; name: string; pageName: string }> = [];
  let anchorState = { bookmarkId: null as string | null, timestamp: 0 };
  let historyState = { previousBookmarkId: null as string | null, lastUpdated: 0 };

  return {
    getBookmarks: vi.fn(async () => [...bookmarks]),
    setBookmarks: vi.fn(async (newBookmarks: Array<{ id: string; name: string; pageName: string }>) => {
      bookmarks = [...newBookmarks];
    }),
    clearBookmarksCache: vi.fn(),
    currentAnchorState: anchorState,
    recentHistoryState: historyState,
    setCurrentAnchor: vi.fn((id: string | null) => { anchorState.bookmarkId = id; }),
    setPreviousBookmark: vi.fn((id: string | null) => { historyState.previousBookmarkId = id; }),
    saveAnchorState: vi.fn(async () => {}),
    // Reset helper for tests
    __resetState: () => {
      bookmarks = [];
      anchorState.bookmarkId = null;
      anchorState.timestamp = 0;
      historyState.previousBookmarkId = null;
      historyState.lastUpdated = 0;
    },
    __setBookmarks: (b: Array<{ id: string; name: string; pageName: string }>) => { bookmarks = [...b]; },
    __setAnchor: (id: string | null) => { anchorState.bookmarkId = id; },
    __setPrevious: (id: string | null) => { historyState.previousBookmarkId = id; }
  };
});

vi.mock('../utils', () => ({
  getPageName: vi.fn(() => 'Test Page'),
  getContainingPage: vi.fn(() => ({ id: 'page-1', name: 'Test Page', type: 'PAGE' }))
}));

// Import the mocked state to access reset helpers
import * as state from '../core/state';
const { __resetState, __setBookmarks, __setAnchor, __setPrevious } = state as any;

describe('Bookmark Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetState();
  });

  describe('addBookmark', () => {
    it('should add a bookmark for a valid node', async () => {
      const node = createMockSceneNode('node-1', 'My Layer') as SceneNode & { name: string };

      const result = await addBookmark(node);

      expect(result).toEqual({
        id: 'node-1',
        name: 'My Layer',
        pageName: 'Test Page'
      });
    });

    it('should throw when adding a duplicate bookmark', async () => {
      __setBookmarks([{ id: 'node-1', name: 'My Layer', pageName: 'Test Page' }]);
      const node = createMockSceneNode('node-1', 'My Layer') as SceneNode & { name: string };

      await expect(addBookmark(node)).rejects.toThrow('already bookmarked');
    });

    it('should update anchor state when adding a new bookmark', async () => {
      const node = createMockSceneNode('node-1', 'My Layer') as SceneNode & { name: string };

      await addBookmark(node);

      expect(state.setCurrentAnchor).toHaveBeenCalledWith('node-1');
      expect(state.saveAnchorState).toHaveBeenCalled();
    });

    it('should set previous bookmark when anchor already exists', async () => {
      __setAnchor('old-anchor');
      const node = createMockSceneNode('node-2', 'New Layer') as SceneNode & { name: string };

      await addBookmark(node);

      expect(state.setPreviousBookmark).toHaveBeenCalledWith('old-anchor');
      expect(state.setCurrentAnchor).toHaveBeenCalledWith('node-2');
    });
  });

  describe('removeBookmark', () => {
    it('should remove a bookmark by id', async () => {
      __setBookmarks([
        { id: 'node-1', name: 'Layer 1', pageName: 'Page 1' },
        { id: 'node-2', name: 'Layer 2', pageName: 'Page 1' }
      ]);

      await removeBookmark('node-1');

      expect(state.setBookmarks).toHaveBeenCalledWith([
        { id: 'node-2', name: 'Layer 2', pageName: 'Page 1' }
      ]);
    });

    it('should clear current anchor when removing the active anchor', async () => {
      __setBookmarks([{ id: 'node-1', name: 'Layer 1', pageName: 'Page 1' }]);
      __setAnchor('node-1');

      await removeBookmark('node-1');

      expect(state.setCurrentAnchor).toHaveBeenCalledWith(null);
      expect(state.saveAnchorState).toHaveBeenCalled();
    });

    it('should clear previous bookmark when removing it', async () => {
      __setBookmarks([{ id: 'node-1', name: 'Layer 1', pageName: 'Page 1' }]);
      __setPrevious('node-1');

      await removeBookmark('node-1');

      expect(state.setPreviousBookmark).toHaveBeenCalledWith(null);
    });
  });

  describe('reorderBookmarks', () => {
    it('should reorder bookmarks by id list', async () => {
      __setBookmarks([
        { id: 'a', name: 'A', pageName: 'P' },
        { id: 'b', name: 'B', pageName: 'P' },
        { id: 'c', name: 'C', pageName: 'P' }
      ]);

      const result = await reorderBookmarks(['c', 'a', 'b']);

      expect(result.success).toBe(true);
      expect(result.message).toContain('reordered');
    });

    it('should fail on length mismatch', async () => {
      __setBookmarks([
        { id: 'a', name: 'A', pageName: 'P' },
        { id: 'b', name: 'B', pageName: 'P' }
      ]);

      const result = await reorderBookmarks(['a']);

      expect(result.success).toBe(false);
      expect(result.message).toContain('mismatch');
    });

    it('should fail on unknown id', async () => {
      __setBookmarks([
        { id: 'a', name: 'A', pageName: 'P' },
        { id: 'b', name: 'B', pageName: 'P' }
      ]);

      const result = await reorderBookmarks(['a', 'unknown']);

      expect(result.success).toBe(false);
      expect(result.message).toContain('unknown id');
    });
  });

  describe('validateAndSyncBookmarks', () => {
    it('should remove bookmarks for deleted nodes', async () => {
      __setBookmarks([
        { id: 'exists', name: 'Exists', pageName: 'Page 1' },
        { id: 'deleted', name: 'Deleted', pageName: 'Page 1' }
      ]);

      // Mock: only 'exists' node can be found
      const mockNode = createMockSceneNode('exists', 'Exists');
      (mockNode as any).parent = { type: 'PAGE', name: 'Page 1' };
      (figma.getNodeByIdAsync as any).mockImplementation(async (id: string) => {
        if (id === 'exists') return mockNode;
        return null;
      });

      const result = await validateAndSyncBookmarks();

      expect(result.removed).toBe(1);
    });

    it('should update bookmarks with stale names', async () => {
      __setBookmarks([
        { id: 'node-1', name: 'Old Name', pageName: 'Old Page' }
      ]);

      const mockNode = createMockSceneNode('node-1', 'New Name');
      (mockNode as any).parent = { type: 'PAGE', name: 'Test Page' };
      (figma.getNodeByIdAsync as any).mockResolvedValue(mockNode);

      const result = await validateAndSyncBookmarks();

      expect(result.updated).toBe(1);
    });

    it('should report no changes when everything is in sync', async () => {
      __setBookmarks([
        { id: 'node-1', name: 'My Node', pageName: 'Test Page' }
      ]);

      const mockNode = createMockSceneNode('node-1', 'My Node');
      (mockNode as any).parent = { type: 'PAGE', name: 'Test Page' };
      (figma.getNodeByIdAsync as any).mockResolvedValue(mockNode);

      const result = await validateAndSyncBookmarks();

      expect(result.updated).toBe(0);
      expect(result.removed).toBe(0);
    });
  });

  describe('updateBookmarkIfExists', () => {
    it('should update name when bookmark exists and name changed', async () => {
      __setBookmarks([
        { id: 'node-1', name: 'Old Name', pageName: 'Page 1' }
      ]);

      const mockNode = createMockSceneNode('node-1', 'New Name');
      (mockNode as any).parent = { type: 'PAGE', name: 'Page 1' };
      (figma.getNodeByIdAsync as any).mockResolvedValue(mockNode);

      const result = await updateBookmarkIfExists('node-1', 'New Name');

      expect(result).toBe(true);
    });

    it('should return false when bookmark does not exist', async () => {
      __setBookmarks([]);

      const result = await updateBookmarkIfExists('nonexistent', 'Name');

      expect(result).toBe(false);
    });

    it('should return false when name is unchanged', async () => {
      __setBookmarks([
        { id: 'node-1', name: 'Same Name', pageName: 'Page 1' }
      ]);

      const result = await updateBookmarkIfExists('node-1', 'Same Name');

      expect(result).toBe(false);
    });
  });

  describe('detectCurrentAnchorFromSelection', () => {
    it('should set anchor when selection matches a bookmark', async () => {
      __setBookmarks([
        { id: 'node-1', name: 'Bookmarked', pageName: 'Page 1' }
      ]);

      const mockNode = createMockSceneNode('node-1', 'Bookmarked');
      figma.currentPage.selection = [mockNode];

      await detectCurrentAnchorFromSelection();

      expect(state.setCurrentAnchor).toHaveBeenCalledWith('node-1');
    });

    it('should clear anchor when selection does not match any bookmark', async () => {
      __setBookmarks([
        { id: 'node-1', name: 'Bookmarked', pageName: 'Page 1' }
      ]);
      __setAnchor('node-1');

      const mockNode = createMockSceneNode('other-node', 'Not Bookmarked');
      figma.currentPage.selection = [mockNode];

      await detectCurrentAnchorFromSelection();

      expect(state.setCurrentAnchor).toHaveBeenCalledWith(null);
    });

    it('should clear anchor when no selection', async () => {
      __setAnchor('node-1');
      figma.currentPage.selection = [];

      await detectCurrentAnchorFromSelection();

      expect(state.setCurrentAnchor).toHaveBeenCalledWith(null);
    });
  });
});
