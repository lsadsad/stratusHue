/// <reference types="@figma/plugin-typings" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendBookmarksToUI, sendSelectionStateToUI, sendNavigationStateToUI, sendErrorToUI, sendSuccessToUI, resizeUI, toggleUIWidth } from '../ui/ui-communication';
import { createMockSceneNode } from './setup';

// Mock feature dependencies
vi.mock('../features/navigation', () => ({
  getNavigationState: vi.fn(() => ({
    canGoBack: false,
    canGoForward: false,
    historyLength: 0,
    currentIndex: -1
  })),
  hasAnySelectionEntry: vi.fn(() => false),
  LayerNavigationHandler: {
    validateNavigationContext: vi.fn(() => ({
      hasSelection: false,
      canEnter: false,
      canExit: false,
      canNavigateSiblings: false,
      containerCount: 0,
      siblingContainerCount: 0,
      hasCollapsibleSiblings: false,
      hasComponentInstance: false
    }))
  }
}));

vi.mock('../features/emoji-manager', () => ({
  getCurrentEmojiSet: vi.fn(() => ({ name: 'Colors', emojis: ['🟥', '🟧', '🟨'] })),
  getEmojiNavigationState: vi.fn(() => ({
    currentSetIndex: 0,
    totalSets: 4,
    setName: 'Colors'
  }))
}));

vi.mock('../core/state', () => ({
  getBookmarks: vi.fn(async () => []),
  currentAnchorState: { bookmarkId: null, timestamp: 0 },
  recentHistoryState: { previousBookmarkId: null, lastUpdated: 0 },
  canGoBack: vi.fn(() => false),
  canGoForward: vi.fn(() => false),
  navigationHistory: [],
  historyIndex: -1
}));

describe('UI Communication - Message Contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    figma.currentPage.selection = [];
  });

  describe('sendBookmarksToUI', () => {
    it('should send bookmarks message with correct shape', async () => {
      await sendBookmarksToUI();

      expect(figma.ui.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'bookmarks',
          bookmarks: expect.any(Array),
          currentAnchorId: null,
          previousBookmarkId: null,
          isInsideAnchor: expect.any(Boolean)
        })
      );
    });

    it('should include bookmark data when bookmarks exist', async () => {
      const { getBookmarks } = await import('../core/state');
      (getBookmarks as any).mockResolvedValue([
        { id: 'b-1', name: 'Bookmark 1', pageName: 'Page 1' },
        { id: 'b-2', name: 'Bookmark 2', pageName: 'Page 1' }
      ]);

      await sendBookmarksToUI();

      expect(figma.ui.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'bookmarks',
          bookmarks: expect.arrayContaining([
            expect.objectContaining({ id: 'b-1', name: 'Bookmark 1' }),
            expect.objectContaining({ id: 'b-2', name: 'Bookmark 2' })
          ])
        })
      );
    });
  });

  describe('sendSelectionStateToUI', () => {
    it('should send selection-state message when no selection', () => {
      figma.currentPage.selection = [];

      sendSelectionStateToUI();

      expect(figma.ui.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'selection-state',
          hasLayerSelected: false,
          hasPreviousSelection: false,
          layerEmojis: expect.any(Array),
          pageEmojis: expect.any(Array)
        })
      );
    });

    it('should send selection-state message when layer is selected', () => {
      const node = createMockSceneNode('node-1', 'My Layer');
      figma.currentPage.selection = [node];

      sendSelectionStateToUI();

      expect(figma.ui.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'selection-state',
          hasLayerSelected: true
        })
      );
    });

    it('should also send emoji-navigation-state message', () => {
      sendSelectionStateToUI();

      // Should send both selection-state and emoji-navigation-state
      const calls = (figma.ui.postMessage as any).mock.calls;
      const types = calls.map((call: any[]) => call[0].type);
      expect(types).toContain('selection-state');
      expect(types).toContain('emoji-navigation-state');
    });

    it('should include visibility/lock state for selected nodes', () => {
      const visibleNode = createMockSceneNode('node-1', 'Visible', 'RECTANGLE');
      Object.defineProperty(visibleNode, 'visible', { value: true, writable: true });
      Object.defineProperty(visibleNode, 'locked', { value: false, writable: true });
      figma.currentPage.selection = [visibleNode];

      sendSelectionStateToUI();

      expect(figma.ui.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'selection-state',
          selectionVisible: true,
          selectionLocked: false
        })
      );
    });
  });

  describe('sendNavigationStateToUI', () => {
    it('should send navigation-state message with correct shape', () => {
      sendNavigationStateToUI();

      expect(figma.ui.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'navigation-state',
          canGoBack: expect.any(Boolean),
          canGoForward: expect.any(Boolean),
          historyLength: expect.any(Number),
          currentIndex: expect.any(Number)
        })
      );
    });
  });

  describe('sendErrorToUI / sendSuccessToUI', () => {
    it('should send error message', () => {
      sendErrorToUI('Something went wrong');

      expect(figma.ui.postMessage).toHaveBeenCalledWith({
        type: 'error',
        message: 'Something went wrong'
      });
    });

    it('should send success message', () => {
      sendSuccessToUI('Operation completed');

      expect(figma.ui.postMessage).toHaveBeenCalledWith({
        type: 'success',
        message: 'Operation completed'
      });
    });
  });

  describe('resizeUI', () => {
    it('should clamp width between 188 and 400', () => {
      // Add resize mock
      (figma.ui as any).resize = vi.fn();

      resizeUI(100, 500);
      expect((figma.ui as any).resize).toHaveBeenCalledWith(188, 500);

      resizeUI(500, 500);
      expect((figma.ui as any).resize).toHaveBeenCalledWith(400, 500);

      resizeUI(300, 500);
      expect((figma.ui as any).resize).toHaveBeenCalledWith(300, 500);
    });

    it('should clamp height to minimum 150', () => {
      (figma.ui as any).resize = vi.fn();

      resizeUI(240, 50);
      expect((figma.ui as any).resize).toHaveBeenCalledWith(240, 150);
    });
  });

  describe('toggleUIWidth', () => {
    it('should toggle between compact (188) and default (240) widths', () => {
      (figma.ui as any).resize = vi.fn();

      // From compact to default
      const newWidth1 = toggleUIWidth(188, 488);
      expect(newWidth1).toBe(240);

      // From default to compact
      const newWidth2 = toggleUIWidth(240, 488);
      expect(newWidth2).toBe(188);
    });
  });
});
