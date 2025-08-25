/// <reference types="@figma/plugin-typings" />

// Navigation Management for Stratus Hue Plugin
// Handles bookmark navigation and history

import type { Bookmark } from './types';
import { getBookmarks, currentAnchorState, recentHistoryState, setCurrentAnchor, setPreviousBookmark, saveAnchorState, navigationHistory, historyIndex, addToHistory, canGoBack, canGoForward, setHistoryIndex, isNavigatingThroughHistory, setNavigatingThroughHistory } from './state';
import { getContainingPage } from './utils';
import { removeBookmark } from './bookmarks';

// ===== NAVIGATION FUNCTIONS =====
export async function jumpToBookmark(bookmarkId: string): Promise<{ success: boolean; message: string }> {
  try {
    const node = await figma.getNodeByIdAsync(bookmarkId);
    if (node && 'name' in node) {
      // Update anchor state
      setPreviousBookmark(currentAnchorState.bookmarkId);
      setCurrentAnchor(bookmarkId);

      // Navigate to node
      const targetPage = getContainingPage(node);
      if (targetPage && figma.currentPage !== targetPage) {
        await figma.setCurrentPageAsync(targetPage);
      }

      if ('visible' in node && node.visible) {
        figma.currentPage.selection = [node as SceneNode];
        figma.viewport.scrollAndZoomIntoView([node as SceneNode]);

        // Add bookmark navigation to history
        const entry: import('./types').HistoryEntry = {
          id: bookmarkId,
          timestamp: Date.now(),
          type: 'bookmark',
          pageId: targetPage?.id || figma.currentPage.id,
          pageName: targetPage?.name || figma.currentPage.name,
          nodeId: bookmarkId,
          nodeName: (node as SceneNode & { name: string }).name
        };
        addToHistory(entry);

        // Save state asynchronously
        await saveAnchorState();

        return {
          success: true,
          message: `Jumped to: ${(node as SceneNode & { name: string }).name}`
        };
      }
    } else {
      await removeBookmark(bookmarkId);
      return {
        success: false,
        message: 'Bookmark target no longer exists.'
      };
    }
  } catch (error) {
    console.error('Error jumping to bookmark:', error);
    await removeBookmark(bookmarkId);
    return {
      success: false,
      message: 'Could not navigate to bookmark.'
    };
  }

  return {
    success: false,
    message: 'Navigation failed.'
  };
}

export async function jumpToPreviousBookmark(): Promise<{ success: boolean; message: string }> {
  if (!recentHistoryState.previousBookmarkId) {
    return {
      success: false,
      message: 'No previous bookmark available.'
    };
  }

  return await jumpToBookmark(recentHistoryState.previousBookmarkId);
}

export function canNavigateBack(): boolean {
  return recentHistoryState.previousBookmarkId !== null;
}

// ===== BOOKMARK SEARCH =====
export async function findBookmarksByName(searchTerm: string): Promise<Bookmark[]> {
  const bookmarks = await getBookmarks();
  const term = searchTerm.toLowerCase();

  return bookmarks.filter(bookmark =>
    bookmark.name.toLowerCase().includes(term) ||
    bookmark.pageName.toLowerCase().includes(term)
  );
}

export async function findNearestBookmark(nodeId: string): Promise<Bookmark | null> {
  try {
    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node || !('parent' in node)) return null;

    const bookmarks = await getBookmarks();
    const page = getContainingPage(node);

    if (!page) return null;

    // Find bookmarks on the same page
    const pageBookmarks = bookmarks.filter(bookmark => bookmark.pageName === page.name);

    if (pageBookmarks.length === 0) return null;

    // For now, return the first bookmark on the page
    // Could be enhanced with spatial distance calculation
    return pageBookmarks[0];
  } catch (error) {
    console.error('Error finding nearest bookmark:', error);
    return null;
  }
}

// ===== BOOKMARK VALIDATION FOR NAVIGATION =====
export async function validateBookmarkExists(bookmarkId: string): Promise<boolean> {
  try {
    const node = await figma.getNodeByIdAsync(bookmarkId);
    return node !== null && 'name' in node;
  } catch (error) {
    return false;
  }
}

export async function getValidBookmarks(): Promise<Bookmark[]> {
  const bookmarks = await getBookmarks();
  const validBookmarks: Bookmark[] = [];

  for (const bookmark of bookmarks) {
    if (await validateBookmarkExists(bookmark.id)) {
      validBookmarks.push(bookmark);
    }
  }

  return validBookmarks;
}

// ===== BROWSER-LIKE NAVIGATION =====
export function addSelectionToHistory(): void {
  // Don't add to history if we're navigating through history
  if (isNavigatingThroughHistory) return;

  const selection = figma.currentPage.selection;
  const currentPage = figma.currentPage;

  // Only add to history if there's a meaningful selection
  if (selection.length === 0) return;

  // Get the primary selected node (first one)
  const primaryNode = selection[0];
  if (!('name' in primaryNode)) return;

  const entry: import('./types').HistoryEntry = {
    id: primaryNode.id,
    timestamp: Date.now(),
    type: 'selection',
    pageId: currentPage.id,
    pageName: currentPage.name,
    nodeId: primaryNode.id,
    nodeName: primaryNode.name
  };

  // Don't add duplicate entries (same node as current)
  const currentEntry = navigationHistory[historyIndex];
  if (currentEntry && currentEntry.nodeId === entry.nodeId) {
    return;
  }

  addToHistory(entry);
}

export function addPageChangeToHistory(): void {
  // Don't add to history if we're navigating through history
  if (isNavigatingThroughHistory) return;

  const currentPage = figma.currentPage;

  const entry: import('./types').HistoryEntry = {
    id: currentPage.id,
    timestamp: Date.now(),
    type: 'page',
    pageId: currentPage.id,
    pageName: currentPage.name
  };

  // Don't add duplicate entries (same page as current)
  const currentEntry = navigationHistory[historyIndex];
  if (currentEntry && currentEntry.pageId === entry.pageId && currentEntry.type === 'page') {
    return;
  }

  addToHistory(entry);
}

export async function goBackInHistory(): Promise<{ success: boolean; message: string }> {
  if (!canGoBack()) {
    return {
      success: false,
      message: 'No previous selection to go back to.'
    };
  }

  // Move back in history
  const newIndex = historyIndex - 1;
  const entry = navigationHistory[newIndex];

  if (!entry) {
    return {
      success: false,
      message: 'Invalid history entry.'
    };
  }

  // Set flag to prevent adding this navigation to history
  setNavigatingThroughHistory(true);

  const result = await navigateToHistoryEntry(entry);
  if (result.success) {
    // Update history index without adding new entry
    setHistoryIndex(newIndex);
  }

  // Reset flag after a short delay to allow selection change to process
  setTimeout(() => setNavigatingThroughHistory(false), 150);

  return result;
}

export async function goForwardInHistory(): Promise<{ success: boolean; message: string }> {
  if (!canGoForward()) {
    return {
      success: false,
      message: 'No next selection to go forward to.'
    };
  }

  // Move forward in history
  const newIndex = historyIndex + 1;
  const entry = navigationHistory[newIndex];

  if (!entry) {
    return {
      success: false,
      message: 'Invalid history entry.'
    };
  }

  // Set flag to prevent adding this navigation to history
  setNavigatingThroughHistory(true);

  const result = await navigateToHistoryEntry(entry);
  if (result.success) {
    // Update history index without adding new entry
    setHistoryIndex(newIndex);
  }

  // Reset flag after a short delay to allow selection change to process
  setTimeout(() => setNavigatingThroughHistory(false), 150);

  return result;
}

// ===== SELECTION-ONLY NAVIGATION =====
function findPreviousSelectionIndex(startIndex: number): number {
  for (let i = startIndex - 1; i >= 0; i--) {
    const entry = navigationHistory[i];
    if (entry && entry.type === 'selection') return i;
  }
  return -1;
}

function findNextSelectionIndex(startIndex: number): number {
  for (let i = startIndex + 1; i < navigationHistory.length; i++) {
    const entry = navigationHistory[i];
    if (entry && entry.type === 'selection') return i;
  }
  return -1;
}

export async function goBackSelectionOnly(): Promise<{ success: boolean; message: string }> {
  const targetIndex = findPreviousSelectionIndex(historyIndex);
  if (targetIndex === -1) {
    return { success: false, message: 'No previous selection to go back to.' };
  }

  const entry = navigationHistory[targetIndex];
  setNavigatingThroughHistory(true);
  const result = await navigateToHistoryEntry(entry);
  if (result.success) setHistoryIndex(targetIndex);
  setTimeout(() => setNavigatingThroughHistory(false), 150);
  return result;
}

export async function goForwardSelectionOnly(): Promise<{ success: boolean; message: string }> {
  const targetIndex = findNextSelectionIndex(historyIndex);
  if (targetIndex === -1) {
    return { success: false, message: 'No next selection to go forward to.' };
  }

  const entry = navigationHistory[targetIndex];
  setNavigatingThroughHistory(true);
  const result = await navigateToHistoryEntry(entry);
  if (result.success) setHistoryIndex(targetIndex);
  setTimeout(() => setNavigatingThroughHistory(false), 150);
  return result;
}

async function navigateToHistoryEntry(entry: import('./types').HistoryEntry): Promise<{ success: boolean; message: string }> {
  try {
    // Check if we need to switch pages
    if (figma.currentPage.id !== entry.pageId) {
      const targetPage = figma.root.children.find(page => page.id === entry.pageId);
      if (targetPage && targetPage.type === 'PAGE') {
        await figma.setCurrentPageAsync(targetPage);
      } else {
        return {
          success: false,
          message: `Page "${entry.pageName}" no longer exists.`
        };
      }
    }

    // Handle different entry types
    if (entry.type === 'page') {
      // For page entries, just navigate to the page and clear selection
      figma.currentPage.selection = [];
      return {
        success: true,
        message: `Navigated to page: ${entry.pageName}`
      };
    }

    // Navigate to the node (for selection and bookmark entries)
    if (entry.nodeId) {
      const node = await figma.getNodeByIdAsync(entry.nodeId);
      if (node && 'visible' in node && node.visible) {
        figma.currentPage.selection = [node as SceneNode];
        figma.viewport.scrollAndZoomIntoView([node as SceneNode]);

        return {
          success: true,
          message: `Navigated to: ${entry.nodeName || 'Selected object'}`
        };
      } else {
        return {
          success: false,
          message: `"${entry.nodeName || 'Object'}" no longer exists or is not visible.`
        };
      }
    }

    return {
      success: false,
      message: 'Invalid navigation target.'
    };
  } catch (error) {
    console.error('Error navigating to history entry:', error);
    return {
      success: false,
      message: 'Navigation failed.'
    };
  }
}

export function getNavigationState(): { canGoBack: boolean; canGoForward: boolean; historyLength: number; currentIndex: number } {
  return {
    canGoBack: canGoBack(),
    canGoForward: canGoForward(),
    historyLength: navigationHistory.length,
    currentIndex: historyIndex
  };
}