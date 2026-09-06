/// <reference types="@figma/plugin-typings" />

// Bookmark Management for stratusHue Plugin
// Handles bookmark CRUD operations and validation

import type { Bookmark } from '../core/types';
import { getBookmarks, setBookmarks, currentAnchorState, recentHistoryState, setCurrentAnchor, setPreviousBookmark, saveAnchorState } from '../core/state';
import { getPageName, getContainingPage } from '../utils';

// ===== BOOKMARK OPERATIONS =====
export async function updateAndSaveBookmarks(bookmarks: Bookmark[]): Promise<void> {
  await setBookmarks(bookmarks);
}

export async function addBookmark(node: SceneNode & { name: string }): Promise<Bookmark> {
  const bookmarks = await getBookmarks();
  
  // Check if already bookmarked
  const existing = bookmarks.find(b => b.id === node.id);
  if (existing) {
    throw new Error('This layer is already bookmarked.');
  }

  const newBookmark: Bookmark = {
    id: node.id,
    name: node.name,
    pageName: getPageName(node)
  };

  // Build a new array rather than mutating the array returned by getBookmarks()
  // (which is the shared cache reference). This keeps the cache from diverging
  // from disk if the save below fails.
  await updateAndSaveBookmarks([...bookmarks, newBookmark]);
  
  // Update anchor state
  if (currentAnchorState.bookmarkId !== node.id) {
    setPreviousBookmark(currentAnchorState.bookmarkId);
    setCurrentAnchor(node.id);
    await saveAnchorState();
  }
  
  return newBookmark;
}

export async function removeBookmark(bookmarkId: string): Promise<void> {
  const bookmarks = await getBookmarks();
  const newBookmarks = bookmarks.filter(b => b.id !== bookmarkId);
  await updateAndSaveBookmarks(newBookmarks);

  // Clear current anchor if the deleted bookmark was the current anchor
  if (currentAnchorState.bookmarkId === bookmarkId) {
    setCurrentAnchor(null);
    await saveAnchorState();
  }

  // Remove from recent history if the deleted bookmark was the previous bookmark
  if (recentHistoryState.previousBookmarkId === bookmarkId) {
    setPreviousBookmark(null);
    await saveAnchorState();
  }
}

export async function updateBookmarkIfExists(layerId: string, newName: string): Promise<boolean> {
  try {
    const bookmarks = await getBookmarks();
    const bookmark = bookmarks.find(b => b.id === layerId);
    
    if (bookmark && bookmark.name !== newName) {
      bookmark.name = newName;
      
      try {
        const node = await figma.getNodeByIdAsync(layerId);
        if (node && 'parent' in node) {
          bookmark.pageName = getPageName(node);
        }
      } catch (error) {
        console.log('Failed to update bookmark page name:', layerId);
      }
      
      await updateAndSaveBookmarks(bookmarks);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error updating bookmark:', error);
    return false;
  }
}

export async function updateBookmarksForPage(pageId: string, newPageName: string): Promise<boolean> {
  try {
    const bookmarks = await getBookmarks();
    let bookmarkUpdates = false;
    
    for (const bookmark of bookmarks) {
      try {
        const node = await figma.getNodeByIdAsync(bookmark.id);
        if (node && 'parent' in node) {
          const page = getContainingPage(node);
          if (page?.id === pageId) {
            bookmark.pageName = newPageName;
            bookmarkUpdates = true;
          }
        }
      } catch (error) {
        console.log('Node not found during bookmark update:', bookmark.id);
      }
    }
    
    if (bookmarkUpdates) {
      await updateAndSaveBookmarks(bookmarks);
    }
    return bookmarkUpdates;
  } catch (error) {
    console.error('Error updating bookmarks for page:', error);
    return false;
  }
}

// ===== BOOKMARK VALIDATION =====
export async function validateAndSyncBookmarks(): Promise<{ updated: number; removed: number }> {
  const bookmarks = await getBookmarks(true);
  let updated = 0;
  let removed = 0;
  const validBookmarks: Bookmark[] = [];

  for (const bookmark of bookmarks) {
    try {
      const node = await figma.getNodeByIdAsync(bookmark.id);
      if (node && 'name' in node && 'parent' in node) {
        const currentName = (node as SceneNode & { name: string }).name;
        const currentPageName = getPageName(node);
        
        if (bookmark.name !== currentName || bookmark.pageName !== currentPageName) {
          bookmark.name = currentName;
          bookmark.pageName = currentPageName;
          updated++;
        }
        validBookmarks.push(bookmark);
      } else {
        removed++;
      }
    } catch (error) {
      removed++;
    }
  }

  if (updated > 0 || removed > 0) {
    await updateAndSaveBookmarks(validBookmarks);
  }

  return { updated, removed };
}

export async function validateRecentHistory(): Promise<void> {
  if (!recentHistoryState.previousBookmarkId) {
    return;
  }

  try {
    const bookmarks = await getBookmarks();
    const isValid = bookmarks.some(b => b.id === recentHistoryState.previousBookmarkId);
    
    if (!isValid) {
      setPreviousBookmark(null);
      await saveAnchorState();
    }
  } catch (error) {
    console.log('Error validating recent history:', error);
    setPreviousBookmark(null);
  }
}

export async function validateCurrentAnchor(): Promise<void> {
  if (!currentAnchorState.bookmarkId) {
    return;
  }

  try {
    const bookmarks = await getBookmarks();
    const currentBookmark = bookmarks.find(bookmark => bookmark.id === currentAnchorState.bookmarkId);

    if (!currentBookmark) {
      setCurrentAnchor(null);
      await saveAnchorState();
    }
  } catch (error) {
    console.log('Error validating current anchor:', error);
    setCurrentAnchor(null);
    await saveAnchorState();
  }
}

// ===== BOOKMARK REORDERING =====
export async function reorderBookmarks(newOrderIds: string[]): Promise<{ success: boolean; message: string }>{
  try {
    const current = await getBookmarks();
    if (newOrderIds.length !== current.length) {
      return { success: false, message: 'Reorder list length mismatch' };
    }

    const idToBookmark = new Map(current.map(b => [b.id, b] as const));
    const reordered: Bookmark[] = [];

    for (const id of newOrderIds) {
      const item = idToBookmark.get(id);
      if (!item) {
        return { success: false, message: 'Reorder contains unknown id' };
      }
      reordered.push(item);
    }

    await setBookmarks(reordered);
    return { success: true, message: 'Anchors reordered' };
  } catch (error) {
    console.error('Failed to reorder bookmarks:', error);
    return { success: false, message: 'Failed to reorder anchors' };
  }
}

export async function detectCurrentAnchorFromSelection(): Promise<void> {
  const selection = figma.currentPage.selection;
  
  if (selection.length !== 1) {
    if (currentAnchorState.bookmarkId !== null) {
      setCurrentAnchor(null);
    }
    return;
  }

  const selectedNode = selection[0];
  const bookmarks = await getBookmarks();

  // Quick check for exact match first
  const exactMatch = bookmarks.find(bookmark => bookmark.id === selectedNode.id);
  
  if (exactMatch) {
    if (currentAnchorState.bookmarkId !== exactMatch.id) {
      setCurrentAnchor(exactMatch.id);
    }
    return;
  }

  // Clear anchor if no match
  if (currentAnchorState.bookmarkId !== null) {
    setCurrentAnchor(null);
  }
}