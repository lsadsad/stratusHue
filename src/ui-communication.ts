/// <reference types="@figma/plugin-typings" />

// UI Communication for Stratus Hue Plugin
// Handles all communication between plugin and UI

import type { Bookmark } from './types';
import { getBookmarks, currentAnchorState, recentHistoryState, canGoBack, canGoForward, navigationHistory, historyIndex, getPreviousSelection } from './state';
import { getNavigationState } from './navigation';
import { getCurrentEmojiSet, getEmojiNavigationState } from './emoji-manager';

// ===== UI MESSAGE SENDERS =====
export async function sendBookmarksToUI(): Promise<void> {
  const bookmarks: Bookmark[] = await getBookmarks();
  
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
  const previousSelection = getPreviousSelection();
  const hasPreviousSelection = previousSelection && previousSelection.nodeIds.length > 0 && previousSelection.pageId === figma.currentPage.id;

  figma.ui.postMessage({
    type: 'selection-state',
    hasLayerSelected,
    hasPreviousSelection,
    layerEmojis: hasLayerSelected ? currentEmojiSet.emojis : getCurrentEmojiSet(true).emojis,
    pageEmojis: !hasLayerSelected ? currentEmojiSet.emojis : getCurrentEmojiSet(false).emojis
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

export async function updateUIAfterNavigation(): Promise<void> {
  sendSelectionStateToUI();
  await sendBookmarksToUI();
  sendNavigationStateToUI();
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
  } catch (error) {
    console.error('Failed to send initial UI state:', error);
    sendErrorToUI('Failed to initialize plugin state');
  }
}

// ===== UI RESIZE HELPERS =====
export function resizeUI(width: number, height: number): void {
  const clampedWidth = Math.max(188, Math.min(400, width));
  const clampedHeight = Math.max(150, Math.min(800, height));
  
  figma.ui.resize(clampedWidth, clampedHeight);
}

export function toggleUIWidth(currentWidth: number, currentHeight: number): number {
  const compactWidth = 188;
  const defaultWidth = 240;
  const newWidth = currentWidth <= compactWidth ? defaultWidth : compactWidth;
  figma.ui.resize(newWidth, currentHeight);
  return newWidth;
}