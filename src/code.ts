/// <reference types="@figma/plugin-typings" />

// Stratus Hue: A Figma plugin for layer tagging and navigation.
// Optimized modular architecture with error handling and performance

// ===== IMPORTS =====
import { debounce } from './utils';
import {
  loadAnchorState,
  setUiWidth,
  setUiHeight,
  currentUiWidth,
  lastUiHeight,
  setPreviousSelection,
  getPreviousSelection,
  clearPreviousSelection
} from './state';
import {
  addBookmark,
  removeBookmark,
  detectCurrentAnchorFromSelection,
  validateCurrentAnchor,
  validateRecentHistory
} from './bookmarks';
import { jumpToBookmark, goBackInHistory, goForwardInHistory, addSelectionToHistory, addPageChangeToHistory } from './navigation';
import {
  addEmojiToSelection,
  clearEmojiFromSelection,
  navigateEmojiSet
} from './emoji-manager';
import {
  sendInitialUIState,
  sendSelectionStateToUI,
  updateUIAfterNavigation,
  updateUIAfterEmojiChange,
  resizeUI,
  toggleUIWidth,
  sendNavigationStateToUI
} from './ui-communication';
import {
  triggerValidationOnSelectionChange,
  triggerValidationOnPageChange
} from './validation';
import {
  handleError,
  withErrorBoundary,
  validateMessage,
  ErrorType
} from './error-handling';

// ===== PLUGIN INITIALIZATION =====
figma.showUI(__html__, { width: currentUiWidth, height: lastUiHeight });

const initializePlugin = withErrorBoundary(async () => {
  await loadAnchorState();
  await validateRecentHistory();
  await validateCurrentAnchor();
  await sendInitialUIState();
}, ErrorType.STORAGE_ERROR);

// ===== DEBOUNCED FUNCTIONS =====
const debouncedSelectionUpdate = debounce(() => {
  // Store current selection as previous before updating
  const currentSelection = figma.currentPage.selection;
  const currentPageId = figma.currentPage.id;
  
  if (currentSelection.length > 0) {
    const nodeIds = currentSelection.map(node => node.id);
    setPreviousSelection(nodeIds, currentPageId);
  }
  
  sendSelectionStateToUI();
  detectCurrentAnchorFromSelection();
  addSelectionToHistory();
  sendNavigationStateToUI();
  triggerValidationOnSelectionChange();
}, 100);

const debouncedPageChange = debounce(async () => {
  await validateCurrentAnchor();
  await updateUIAfterNavigation();
  addPageChangeToHistory();
  triggerValidationOnPageChange();
}, 200);

// ===== EVENT HANDLERS =====
figma.on('selectionchange', debouncedSelectionUpdate);
figma.on('currentpagechange', debouncedPageChange);

// ===== MESSAGE HANDLERS =====
figma.ui.onmessage = async (msg) => {
  if (!validateMessage(msg)) {
    handleError({ type: ErrorType.UI_COMMUNICATION, message: 'Invalid message format', recoverable: true });
    return;
  }

  try {
    switch (msg.type) {
      case 'ui-ready':
        await initializePlugin();
        break;

      case 'add-emoji':
        if ('emoji' in msg && msg.emoji && typeof msg.emoji === 'string') {
          await handleAddEmoji(msg.emoji);
        }
        break;

      case 'clear-emoji':
        await handleClearEmoji();
        break;

      case 'navigate-emoji-set':
        if ('direction' in msg && (msg.direction === 'prev' || msg.direction === 'next')) {
          handleNavigateEmojiSet(msg.direction);
        }
        break;

      case 'save-bookmark':
        await handleSaveBookmark();
        break;

      case 'refresh-anchors':
        await handleRefreshAnchors();
        break;

      case 'jump-to-bookmark':
        if ('id' in msg && msg.id && typeof msg.id === 'string') {
          await handleJumpToBookmark(msg.id);
        }
        break;

      case 'remove-bookmark':
        if ('id' in msg && msg.id && typeof msg.id === 'string') {
          await handleRemoveBookmark(msg.id);
        }
        break;

      case 'deselect':
        figma.currentPage.selection = [];
        sendSelectionStateToUI();
        break;

      case 'toggle-mode':
        if ('mode' in msg && msg.mode === 'onLayer') {
          await handleToggleToLayerMode();
        }
        break;

      case 'go-back':
        await handleGoBack();
        break;

      case 'go-forward':
        await handleGoForward();
        break;

      case 'resize-ui':
        if ('height' in msg && typeof msg.height === 'number' && msg.height > 0) {
          const newHeight = Math.max(150, Math.min(800, msg.height));
          setUiHeight(newHeight);
          resizeUI(currentUiWidth, newHeight);
        }
        break;

      case 'toggle-width': {
        const newWidth = toggleUIWidth(currentUiWidth, lastUiHeight);
        setUiWidth(newWidth);
        break;
      }

      default:
        console.log('Unknown message type:', msg.type);
    }
  } catch (error) {
    handleError(error);
  }
};

// ===== SPECIFIC MESSAGE HANDLERS =====
const handleAddEmoji = withErrorBoundary(async (emoji: string) => {
  const result = await addEmojiToSelection(emoji);
  figma.notify(result.message);
  if (result.success) {
    updateUIAfterEmojiChange();
  }
}, ErrorType.UNKNOWN);

const handleClearEmoji = withErrorBoundary(async () => {
  const result = await clearEmojiFromSelection();
  figma.notify(result.message);
  if (result.success) {
    updateUIAfterEmojiChange();
  }
}, ErrorType.UNKNOWN);

const handleNavigateEmojiSet = withErrorBoundary(async (direction: 'prev' | 'next') => {
  const hasLayerSelected = figma.currentPage.selection.length > 0;
  const result = navigateEmojiSet(direction, hasLayerSelected);
  figma.notify(`Switched to ${result.setName} emoji set`);
  updateUIAfterEmojiChange();
}, ErrorType.UNKNOWN);

const handleSaveBookmark = withErrorBoundary(async () => {
  const selection = figma.currentPage.selection;

  if (selection.length !== 1) {
    figma.notify('Please select exactly one layer to bookmark.');
    return;
  }

  const node = selection[0];
  if (!('name' in node)) {
    figma.notify('Selected element cannot be bookmarked.');
    return;
  }

  try {
    const bookmark = await addBookmark(node as SceneNode & { name: string });
    figma.notify(`Bookmarked: ${bookmark.name}`);
    await updateUIAfterNavigation();
  } catch (error) {
    if (error instanceof Error) {
      figma.notify(error.message);
    } else {
      throw error;
    }
  }
}, ErrorType.BOOKMARK_NOT_FOUND);

const handleJumpToBookmark = withErrorBoundary(async (bookmarkId: string) => {
  const result = await jumpToBookmark(bookmarkId);
  figma.notify(result.message);
  if (result.success) {
    await updateUIAfterNavigation();
  }
}, ErrorType.NAVIGATION_FAILED);

const handleRemoveBookmark = withErrorBoundary(async (bookmarkId: string) => {
  await removeBookmark(bookmarkId);
  figma.notify('Bookmark removed.');
  await updateUIAfterNavigation();
}, ErrorType.BOOKMARK_NOT_FOUND);

async function handleGoBack(): Promise<void> {
  const result = await goBackInHistory();
  figma.notify(result.message);
  if (result.success) {
    await updateUIAfterNavigation();
  }
}

async function handleGoForward(): Promise<void> {
  const result = await goForwardInHistory();
  figma.notify(result.message);
  if (result.success) {
    await updateUIAfterNavigation();
  }
}

const handleRefreshAnchors = withErrorBoundary(async () => {
  const { updated, removed } = await (await import('./bookmarks')).validateAndSyncBookmarks();
  figma.notify(`Anchors resynced: ${updated} updated, ${removed} removed`);
  await updateUIAfterNavigation();
}, ErrorType.UNKNOWN);

const handleToggleToLayerMode = withErrorBoundary(async () => {
  const previousSelection = getPreviousSelection();
  
  if (!previousSelection || previousSelection.nodeIds.length === 0) {
    // No previous selection available
    figma.notify('No previous layer selection available');
    sendSelectionStateToUI();
    return;
  }
  
  try {
    // Check if we're on the same page
    if (previousSelection.pageId !== figma.currentPage.id) {
      figma.notify('Previous selection is on a different page');
      sendSelectionStateToUI();
      return;
    }
    
    // Try to find and select the previously selected nodes
    const nodesToSelect: SceneNode[] = [];
    
    for (const nodeId of previousSelection.nodeIds) {
      try {
        const node = figma.getNodeById(nodeId);
        if (node && node.parent === figma.currentPage) {
          nodesToSelect.push(node);
        }
      } catch (error) {
        console.warn(`Node ${nodeId} not found or not accessible`);
      }
    }
    
    if (nodesToSelect.length > 0) {
      figma.currentPage.selection = nodesToSelect;
      figma.notify(`Selected ${nodesToSelect.length} previously selected layer${nodesToSelect.length > 1 ? 's' : ''}`);
    } else {
      figma.notify('Previously selected layers are no longer available');
    }
    
    sendSelectionStateToUI();
  } catch (error) {
    console.error('Error selecting previous layers:', error);
    figma.notify('Failed to select previous layers');
    sendSelectionStateToUI();
  }
}, ErrorType.UNKNOWN);