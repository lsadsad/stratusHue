/// <reference types="@figma/plugin-typings" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addSelectionToHistory, addPageChangeToHistory, getNavigationState, canNavigateBack, jumpToBookmark, findBookmarksByName, validateBookmarkExists, getValidBookmarks } from '../features/navigation';
import { navigationHistory, historyIndex, addToHistory, canGoBack, canGoForward, setHistoryIndex, isNavigatingThroughHistory, setNavigatingThroughHistory } from '../core/state';
import { createMockSceneNode, createMockPageNode } from './setup';

describe('Navigation History', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset navigation history
    navigationHistory.length = 0;
    setHistoryIndex(-1);
    setNavigatingThroughHistory(false);
    figma.currentPage.selection = [];
  });

  describe('addToHistory', () => {
    it('should add entries to history', () => {
      addToHistory({
        id: 'node-1',
        timestamp: Date.now(),
        type: 'selection',
        pageId: 'page-1',
        pageName: 'Page 1',
        nodeId: 'node-1',
        nodeName: 'Node 1'
      });

      expect(navigationHistory.length).toBe(1);
      expect(historyIndex).toBe(0);
    });

    it('should splice forward entries when adding after going back', () => {
      // Add 3 entries
      for (let i = 0; i < 3; i++) {
        addToHistory({
          id: `node-${i}`,
          timestamp: Date.now(),
          type: 'selection',
          pageId: 'page-1',
          pageName: 'Page 1',
          nodeId: `node-${i}`,
          nodeName: `Node ${i}`
        });
      }

      expect(navigationHistory.length).toBe(3);
      expect(historyIndex).toBe(2);

      // Go back
      setHistoryIndex(0);

      // Add new entry — should splice entries at index 1 and 2
      addToHistory({
        id: 'new-node',
        timestamp: Date.now(),
        type: 'selection',
        pageId: 'page-1',
        pageName: 'Page 1',
        nodeId: 'new-node',
        nodeName: 'New Node'
      });

      expect(navigationHistory.length).toBe(2);
      expect(historyIndex).toBe(1);
      expect(navigationHistory[1].nodeId).toBe('new-node');
    });

    it('should cap history at 50 entries', () => {
      for (let i = 0; i < 55; i++) {
        addToHistory({
          id: `node-${i}`,
          timestamp: Date.now(),
          type: 'selection',
          pageId: 'page-1',
          pageName: 'Page 1',
          nodeId: `node-${i}`,
          nodeName: `Node ${i}`
        });
      }

      expect(navigationHistory.length).toBeLessThanOrEqual(50);
    });
  });

  describe('canGoBack / canGoForward', () => {
    it('should return false when no history', () => {
      expect(canGoBack()).toBe(false);
      expect(canGoForward()).toBe(false);
    });

    it('should return false for canGoBack at index 0', () => {
      addToHistory({
        id: 'node-1',
        timestamp: Date.now(),
        type: 'selection',
        pageId: 'page-1',
        pageName: 'Page 1'
      });

      expect(canGoBack()).toBe(false);
    });

    it('should return true for canGoBack when index > 0', () => {
      addToHistory({ id: '1', timestamp: Date.now(), type: 'selection', pageId: 'p', pageName: 'P' });
      addToHistory({ id: '2', timestamp: Date.now(), type: 'selection', pageId: 'p', pageName: 'P' });

      expect(canGoBack()).toBe(true);
    });

    it('should return true for canGoForward when not at end', () => {
      addToHistory({ id: '1', timestamp: Date.now(), type: 'selection', pageId: 'p', pageName: 'P' });
      addToHistory({ id: '2', timestamp: Date.now(), type: 'selection', pageId: 'p', pageName: 'P' });

      setHistoryIndex(0);

      expect(canGoForward()).toBe(true);
    });

    it('should return false for canGoForward at end', () => {
      addToHistory({ id: '1', timestamp: Date.now(), type: 'selection', pageId: 'p', pageName: 'P' });

      expect(canGoForward()).toBe(false);
    });
  });

  describe('addSelectionToHistory', () => {
    it('should add current selection to history', () => {
      const node = createMockSceneNode('node-1', 'Selected Node');
      figma.currentPage.selection = [node];

      addSelectionToHistory();

      expect(navigationHistory.length).toBe(1);
      expect(navigationHistory[0].type).toBe('selection');
      expect(navigationHistory[0].nodeId).toBe('node-1');
    });

    it('should not add to history when navigating through history', () => {
      setNavigatingThroughHistory(true);
      const node = createMockSceneNode('node-1', 'Selected Node');
      figma.currentPage.selection = [node];

      addSelectionToHistory();

      expect(navigationHistory.length).toBe(0);
    });

    it('should not add to history when selection is empty', () => {
      figma.currentPage.selection = [];

      addSelectionToHistory();

      expect(navigationHistory.length).toBe(0);
    });

    it('should not add duplicate entries for same node', () => {
      const node = createMockSceneNode('node-1', 'Selected Node');
      figma.currentPage.selection = [node];

      addSelectionToHistory();
      addSelectionToHistory();

      expect(navigationHistory.length).toBe(1);
    });
  });

  describe('addPageChangeToHistory', () => {
    it('should add page change to history', () => {
      addPageChangeToHistory();

      expect(navigationHistory.length).toBe(1);
      expect(navigationHistory[0].type).toBe('page');
      expect(navigationHistory[0].pageId).toBe('page-1');
    });

    it('should not add when navigating through history', () => {
      setNavigatingThroughHistory(true);

      addPageChangeToHistory();

      expect(navigationHistory.length).toBe(0);
    });

    it('should not add duplicate page entries', () => {
      addPageChangeToHistory();
      addPageChangeToHistory();

      expect(navigationHistory.length).toBe(1);
    });
  });

  describe('getNavigationState', () => {
    it('should return current navigation state', () => {
      const state = getNavigationState();

      expect(state).toHaveProperty('canGoBack');
      expect(state).toHaveProperty('canGoForward');
      expect(state).toHaveProperty('historyLength');
      expect(state).toHaveProperty('currentIndex');
    });

    it('should reflect history changes', () => {
      addToHistory({ id: '1', timestamp: Date.now(), type: 'selection', pageId: 'p', pageName: 'P' });
      addToHistory({ id: '2', timestamp: Date.now(), type: 'selection', pageId: 'p', pageName: 'P' });

      const state = getNavigationState();

      expect(state.historyLength).toBe(2);
      expect(state.canGoBack).toBe(true);
      expect(state.canGoForward).toBe(false);
    });
  });
});

describe('Bookmark Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigationHistory.length = 0;
    setHistoryIndex(-1);
  });

  describe('jumpToBookmark', () => {
    it('should navigate to existing bookmark node', async () => {
      const mockNode = createMockSceneNode('bookmark-1', 'Bookmarked Layer');
      const mockPage = createMockPageNode('page-1', 'Test Page', [mockNode]);
      (mockNode as any).parent = mockPage;
      (figma.getNodeByIdAsync as any).mockResolvedValue(mockNode);

      const result = await jumpToBookmark('bookmark-1');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Jumped to');
    });

    it('should auto-remove bookmark when node no longer exists', async () => {
      (figma.getNodeByIdAsync as any).mockResolvedValue(null);

      const result = await jumpToBookmark('deleted-node');

      expect(result.success).toBe(false);
      expect(result.message).toContain('no longer exists');
    });
  });

  describe('validateBookmarkExists', () => {
    it('should return true when node exists', async () => {
      const mockNode = createMockSceneNode('node-1', 'Exists');
      (figma.getNodeByIdAsync as any).mockResolvedValue(mockNode);

      const result = await validateBookmarkExists('node-1');

      expect(result).toBe(true);
    });

    it('should return false when node does not exist', async () => {
      (figma.getNodeByIdAsync as any).mockResolvedValue(null);

      const result = await validateBookmarkExists('deleted-node');

      expect(result).toBe(false);
    });
  });
});
