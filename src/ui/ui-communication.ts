/// <reference types="@figma/plugin-typings" />

// UI Communication for stratusHue Plugin
// Handles all communication between plugin and UI

import type { Bookmark } from '../core/types';
import { getBookmarks, currentAnchorState, recentHistoryState } from '../core/state';
import { getNavigationState, hasAnySelectionEntry } from '../features/navigation';
import { getCurrentEmojiSet, getEmojiNavigationState } from '../features/emoji-manager';
import { buildFileInfo } from '../features/bridge/file-info';

// ===== UI MESSAGE SENDERS =====
export async function sendBookmarksToUI(options?: { forceReload?: boolean }): Promise<void> {
  const forceReload = !!(options && options.forceReload);
  const bookmarks: Bookmark[] = await getBookmarks(forceReload);
  
  figma.ui.postMessage({
    type: 'bookmarks',
    bookmarks,
    currentAnchorId: currentAnchorState.bookmarkId,
    previousBookmarkId: recentHistoryState.previousBookmarkId,
    isInsideAnchor: false // Simplified for performance
  });
}

export function sendSelectionStateToUI(): void {
  const selectedLayers = figma.currentPage.selection;
  const hasLayerSelected = selectedLayers.length > 0;
  const currentEmojiSet = getCurrentEmojiSet(hasLayerSelected);
  const hasPreviousSelection = hasAnySelectionEntry();

  // Get current page name and selected layer name for anatomy display
  const pageName = figma.currentPage.name;
  const selectedLayerName = hasLayerSelected && selectedLayers[0] ? selectedLayers[0].name : null;

  // Determine visibility and lock state of selection
  // If all selected layers share the same state, use that; otherwise use 'mixed'
  let selectionVisible: boolean | 'mixed' | null = null;
  let selectionLocked: boolean | 'mixed' | null = null;

  if (hasLayerSelected) {
    let allVisible = true;
    let allHidden = true;
    let allLocked = true;
    let allUnlocked = true;

    for (const node of selectedLayers) {
      if ('visible' in node) {
        if (node.visible) allHidden = false;
        else allVisible = false;
      }
      if ('locked' in node) {
        if (node.locked) allUnlocked = false;
        else allLocked = false;
      }
    }

    if (allVisible) selectionVisible = true;
    else if (allHidden) selectionVisible = false;
    else selectionVisible = 'mixed';

    if (allLocked) selectionLocked = true;
    else if (allUnlocked) selectionLocked = false;
    else selectionLocked = 'mixed';
  }

  figma.ui.postMessage({
    type: 'selection-state',
    hasLayerSelected,
    hasPreviousSelection,
    layerEmojis: hasLayerSelected ? currentEmojiSet.emojis : getCurrentEmojiSet(true).emojis,
    pageEmojis: !hasLayerSelected ? currentEmojiSet.emojis : getCurrentEmojiSet(false).emojis,
    pageName,
    selectedLayerName,
    selectionVisible,
    selectionLocked
  });

  // Send emoji navigation state
  const navState = getEmojiNavigationState(hasLayerSelected);
  figma.ui.postMessage({
    type: 'emoji-navigation-state',
    currentSetIndex: navState.currentSetIndex,
    totalSets: navState.totalSets,
    setName: navState.setName
  });
}

export function sendNavigationStateToUI(): void {
  const navState = getNavigationState();
  figma.ui.postMessage({
    type: 'navigation-state',
    canGoBack: navState.canGoBack,
    canGoForward: navState.canGoForward,
    historyLength: navState.historyLength,
    currentIndex: navState.currentIndex
  });
}

// Cache for navigation context to avoid unnecessary updates
let lastNavigationContext: import('../core/types').NavigationContext | null = null;

export async function sendNavigationContextToUI(force = false): Promise<void> {
  try {
    const { LayerNavigationHandler } = await import('../features/navigation');
    const selection = figma.currentPage.selection;
    const context = LayerNavigationHandler.validateNavigationContext(selection);
    
    // Only send update if context has changed (performance optimization)
    if (!force && lastNavigationContext && areNavigationContextsEqual(lastNavigationContext, context)) {
      return;
    }
    
    lastNavigationContext = { ...context };
    
    figma.ui.postMessage({
      type: 'navigation-context-update',
      context
    });
  } catch (error) {
    console.error('Failed to send navigation context to UI:', error);
    // Send error state to UI
    figma.ui.postMessage({
      type: 'navigation-context-update',
      context: {
        hasSelection: false,
        canEnter: false,
        canExit: false,
        canNavigateSiblings: false,
        containerCount: 0
      }
    });
  }
}

/**
 * Compare two navigation contexts for equality to avoid unnecessary updates
 */
function areNavigationContextsEqual(
  a: import('../core/types').NavigationContext, 
  b: import('../core/types').NavigationContext
): boolean {
  return (
    a.hasSelection === b.hasSelection &&
    a.canEnter === b.canEnter &&
    a.canExit === b.canExit &&
    a.canNavigateSiblings === b.canNavigateSiblings &&
    a.containerCount === b.containerCount
  );
}

/**
 * Force refresh of navigation context (useful after navigation actions)
 */
export async function refreshNavigationContext(): Promise<void> {
  await sendNavigationContextToUI(true);
}

/**
 * Clear navigation context cache (useful when switching pages)
 */
export function clearNavigationContextCache(): void {
  lastNavigationContext = null;
}

export function sendErrorToUI(message: string): void {
  figma.ui.postMessage({
    type: 'error',
    message
  });
}

export function sendSuccessToUI(message: string): void {
  figma.ui.postMessage({
    type: 'success',
    message
  });
}

// ===== UI UPDATE HELPERS =====
export async function updateUIAfterBookmarkChange(): Promise<void> {
  await sendBookmarksToUI();
  sendSelectionStateToUI();
}

export function updateUIAfterNavigation(): void {
  sendSelectionStateToUI();
  sendBookmarksToUI().catch(console.error); // Non-blocking for better performance
  sendNavigationStateToUI();
  // Use existing debounced context update for better performance
  // The debounced update will be triggered by the selection change event
}

export function updateUIAfterEmojiChange(): void {
  sendSelectionStateToUI();
}

// ===== BATCH UI UPDATES =====
export async function sendInitialUIState(): Promise<void> {
  try {
    sendSelectionStateToUI();
    await sendBookmarksToUI();
    sendNavigationStateToUI();
    await refreshNavigationContext(); // Force refresh on initial load
  } catch (error) {
    console.error('Failed to send initial UI state:', error);
    sendErrorToUI('Failed to initialize plugin state');
  }
}

// ===== BRIDGE EVENT SENDERS =====
// Called from selectionchange / currentpagechange / documentchange handlers in code.ts
// so the bridge can broadcast these events over WebSocket to connected MCP clients.

export function sendBridgeSelectionEvent(): void {
  const selection = figma.currentPage.selection;
  figma.ui.postMessage({
    type: 'bridge-selection-change',
    selection: selection.map(n => ({ id: n.id, name: n.name, type: n.type })),
    pageId: figma.currentPage.id,
  });
}

export function sendBridgeDocumentEvent(): void {
  figma.ui.postMessage({
    type: 'bridge-document-change',
    pageId: figma.currentPage.id,
    pageName: figma.currentPage.name,
  });
}

export function sendBridgePageEvent(): void {
  figma.ui.postMessage({
    type: 'bridge-page-change',
    pageId: figma.currentPage.id,
    pageName: figma.currentPage.name,
  });
}

// Pushes the current file identity to the UI so bridge-client can send the
// FILE_INFO identification handshake the figma-studio server requires on connect.
export function sendBridgeFileInfo(): void {
  figma.ui.postMessage({
    type: 'bridge-file-info',
    fileInfo: buildFileInfo(),
  });
}

// ===== UI RESIZE HELPERS =====
export function resizeUI(width: number, height: number): void {
  const clampedWidth = Math.max(188, Math.min(400, width));
  const clampedHeight = Math.max(150, height);
  
  figma.ui.resize(clampedWidth, clampedHeight);
}

export function toggleUIWidth(currentWidth: number, currentHeight: number): number {
  const compactWidth = 188;
  const defaultWidth = 240;
  const newWidth = currentWidth <= compactWidth ? defaultWidth : compactWidth;
  figma.ui.resize(newWidth, currentHeight);
  return newWidth;
}