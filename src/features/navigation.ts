/// <reference types="@figma/plugin-typings" />

// Navigation Management for Stratus Hue Plugin
// Handles bookmark navigation and history

import type { Bookmark } from '../core/types';
import { getBookmarks, currentAnchorState, recentHistoryState, setCurrentAnchor, setPreviousBookmark, saveAnchorState, navigationHistory, historyIndex, addToHistory, canGoBack, canGoForward, setHistoryIndex, isNavigatingThroughHistory, setNavigatingThroughHistory } from '../core/state';
import { getContainingPage } from '../utils';
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
        const entry: import('../types').HistoryEntry = {
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

  const entry: import('../types').HistoryEntry = {
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

  const entry: import('../types').HistoryEntry = {
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

// ===== HISTORY QUERIES =====
export function getLatestSelectionEntry(): import('../types').HistoryEntry | null {
  for (let i = historyIndex; i >= 0; i--) {
    const entry = navigationHistory[i];
    if (entry && entry.type === 'selection') return entry;
  }
  return null;
}

export async function getLatestExistingSelectionEntry(): Promise<import('../types').HistoryEntry | null> {
  for (let i = historyIndex; i >= 0; i--) {
    const entry = navigationHistory[i];
    if (entry && entry.type === 'selection' && entry.nodeId) {
      try {
        const node = await figma.getNodeByIdAsync(entry.nodeId);
        if (node) return entry;
      } catch (_err) {
        // skip invalid
      }
    }
  }
  return null;
}

export async function findNearestExistingSelectionEntry(startIndex?: number): Promise<import('../types').HistoryEntry | null> {
  const from = typeof startIndex === 'number' ? startIndex : historyIndex;
  for (let i = from; i >= 0; i--) {
    const entry = navigationHistory[i];
    if (entry && entry.type === 'selection' && entry.nodeId) {
      try {
        const node = await figma.getNodeByIdAsync(entry.nodeId);
        if (node) return entry;
      } catch (_err) {
        // continue scanning
      }
    }
  }
  return null;
}

export async function findNearestExistingSelectionEntryAnyDirection(): Promise<import('../types').HistoryEntry | null> {
  // Prefer going backward from current index; if none, try forward
  const backward = await findNearestExistingSelectionEntry(historyIndex);
  if (backward) return backward;
  for (let i = historyIndex + 1; i < navigationHistory.length; i++) {
    const entry = navigationHistory[i];
    if (entry && entry.type === 'selection' && entry.nodeId) {
      try {
        const node = await figma.getNodeByIdAsync(entry.nodeId);
        if (node) return entry;
      } catch (_err) {
        // skip
      }
    }
  }
  return null;
}

export function hasAnySelectionEntry(): boolean {
  return navigationHistory.some(e => e && e.type === 'selection');
}

async function navigateToHistoryEntry(entry: import('../types').HistoryEntry): Promise<{ success: boolean; message: string }> {
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

// ===== LAYER HIERARCHY NAVIGATION =====
import type { NavigationResult, NavigationContext, NavigationAction } from '../core/types';
import { ErrorType, createError, handleError, withSyncErrorBoundary, validateSceneNode } from '../core/error-handling';

/**
 * Layer Navigation Handler
 * Provides functions for navigating through layer hierarchy
 * Integrates with selection history system for back/forward navigation
 * Enhanced with comprehensive error handling and graceful degradation
 */
export class LayerNavigationHandler {
  /**
   * Enter a container (Section, Group, Frame) and select all children
   * Records navigation action in selection history
   * Enhanced with comprehensive error handling and validation
   * 
   * NOTE: This function does NOT modify the layer panel expanded/collapsed state
   * of containers. It only changes selection and viewport focus.
   */
  static enterContainer(node: SceneNode): NavigationResult {
    return withSyncErrorBoundary(() => {
      // Validate input node
      if (!validateSceneNode(node)) {
        const error = createError(
          ErrorType.INVALID_CONTAINER,
          'Invalid node provided for container entry',
          { nodeId: (node as any)?.id, nodeType: (node as any)?.type }
        );
        handleError(error);
        return {
          success: false,
          message: 'Invalid selection for container entry',
          viewportUpdate: false
        };
      }

      // Check if node still exists and is accessible
      try {
        // Accessing node properties to ensure it's still valid
        const nodeType = node.type;
        const nodeName = node.name;
        
        // Check if node is a container type
        if (!LayerNavigationHandler.isContainer(node)) {
          return {
            success: false,
            message: `Cannot enter ${nodeType.toLowerCase()}: not a container (Section, Group, or Frame)`,
            viewportUpdate: false
          };
        }

        // Check if container has children property
        if (!('children' in node)) {
          const error = createError(
            ErrorType.INVALID_CONTAINER,
            'Container node does not support children',
            { nodeId: node.id, nodeType: nodeType }
          );
          handleError(error);
          return {
            success: false,
            message: 'Container does not support child elements',
            viewportUpdate: false
          };
        }

        // Check if container has any children
        if (node.children.length === 0) {
          return {
            success: false,
            message: `${nodeType.toLowerCase()} "${nodeName}" is empty`,
            viewportUpdate: false
          };
        }

        // Filter for valid, visible children with error handling
        const children: SceneNode[] = [];
        for (const child of node.children) {
          try {
            if (validateSceneNode(child) && 'visible' in child && child.visible) {
              children.push(child);
            }
          } catch (childError) {
            // Skip invalid children but continue processing
            console.warn('Skipping invalid child node:', childError);
          }
        }
        
        if (children.length === 0) {
          return {
            success: false,
            message: `${nodeType.toLowerCase()} "${nodeName}" has no visible children`,
            viewportUpdate: false
          };
        }

        // Record navigation action in history for the primary child (first selected)
        try {
          if (children.length > 0 && 'name' in children[0]) {
            const primaryChild = children[0];
            const entry: import('../types').HistoryEntry = {
              id: primaryChild.id,
              timestamp: Date.now(),
              type: 'selection',
              pageId: figma.currentPage.id,
              pageName: figma.currentPage.name,
              nodeId: primaryChild.id,
              nodeName: primaryChild.name
            };
            
            // Add to history without triggering the flag since this is a navigation action
            addToHistory(entry);
          }
        } catch (historyError) {
          // History recording failure shouldn't prevent navigation
          console.warn('Failed to record navigation in history:', historyError);
        }

        return {
          success: true,
          message: `Entered ${nodeType.toLowerCase()}: ${nodeName} (${children.length} children)`,
          newSelection: children,
          viewportUpdate: true
        };

      } catch (nodeAccessError) {
        // Node may have been deleted or become inaccessible
        const error = createError(
          ErrorType.INVALID_CONTAINER,
          'Container node is no longer accessible',
          { nodeId: node.id, error: nodeAccessError }
        );
        handleError(error);
        return {
          success: false,
          message: 'Selected container is no longer available',
          viewportUpdate: false
        };
      }
    }, ErrorType.INVALID_CONTAINER)() || {
      success: false,
      message: 'Failed to enter container due to unexpected error',
      viewportUpdate: false
    };
  }

  /**
   * Exit container by selecting parent from current selection
   * Handles both single and multiple selections
   * Records navigation action in selection history
   * Enhanced with comprehensive error handling and validation
   */
  static exitContainer(nodes: SceneNode | readonly SceneNode[]): NavigationResult {
    return withSyncErrorBoundary(() => {
      const nodeArray = Array.isArray(nodes) ? nodes : [nodes];
      
      if (nodeArray.length === 0) {
        const error = createError(
          ErrorType.NO_SELECTION,
          'No selection provided for container exit',
          { selectionLength: 0 }
        );
        handleError(error);
        return {
          success: false,
          message: 'No selection to exit from',
          viewportUpdate: false
        };
      }

      // Validate all nodes in selection
      const validNodes: SceneNode[] = [];
      for (const node of nodeArray) {
        if (validateSceneNode(node)) {
          try {
            // Test node accessibility
            const _ = node.type;
            const __ = node.name;
            validNodes.push(node);
          } catch (nodeError) {
            console.warn('Skipping inaccessible node in selection:', nodeError);
          }
        }
      }

      if (validNodes.length === 0) {
        const error = createError(
          ErrorType.NO_SELECTION,
          'No valid nodes in selection for container exit',
          { originalSelectionLength: nodeArray.length }
        );
        handleError(error);
        return {
          success: false,
          message: 'Selected elements are no longer available',
          viewportUpdate: false
        };
      }

      // For single selection, use existing logic
      if (validNodes.length === 1) {
        const node = validNodes[0];
        let parent: SceneNode | null = null;
        
        try {
          parent = LayerNavigationHandler.findParentContainer(node);
        } catch (parentError) {
          const error = createError(
            ErrorType.NO_PARENT,
            'Failed to find parent container',
            { nodeId: node.id, nodeType: node.type, error: parentError }
          );
          handleError(error);
          return {
            success: false,
            message: 'Cannot access parent container',
            viewportUpdate: false
          };
        }
        
        if (!parent) {
          return {
            success: false,
            message: `"${node.name}" has no parent container to exit to`,
            viewportUpdate: false
          };
        }

        // Validate parent is still accessible
        try {
          const parentType = parent.type;
          const parentName = parent.name;
          
          // Record navigation action in history
          try {
            const entry: import('../types').HistoryEntry = {
              id: parent.id,
              timestamp: Date.now(),
              type: 'selection',
              pageId: figma.currentPage.id,
              pageName: figma.currentPage.name,
              nodeId: parent.id,
              nodeName: parentName
            };
            
            addToHistory(entry);
          } catch (historyError) {
            // History recording failure shouldn't prevent navigation
            console.warn('Failed to record navigation in history:', historyError);
          }

          return {
            success: true,
            message: `Exited to ${parentType.toLowerCase()}: ${parentName}`,
            newSelection: [parent],
            viewportUpdate: true
          };
        } catch (parentAccessError) {
          const error = createError(
            ErrorType.NO_PARENT,
            'Parent container is no longer accessible',
            { parentId: parent.id, error: parentAccessError }
          );
          handleError(error);
          return {
            success: false,
            message: 'Parent container is no longer available',
            viewportUpdate: false
          };
        }
      }

      // For multiple selections, find common parent
      let commonParent: SceneNode | null = null;
      
      try {
        commonParent = LayerNavigationHandler.findCommonParentContainer(validNodes);
      } catch (parentError) {
        const error = createError(
          ErrorType.NO_PARENT,
          'Failed to find common parent container',
          { selectionLength: validNodes.length, error: parentError }
        );
        handleError(error);
        return {
          success: false,
          message: 'Cannot find common parent for selected items',
          viewportUpdate: false
        };
      }
      
      if (!commonParent) {
        return {
          success: false,
          message: 'Selected items have no common parent container',
          viewportUpdate: false
        };
      }

      // Validate common parent is still accessible
      try {
        const parentType = commonParent.type;
        const parentName = commonParent.name;
        
        // Record navigation action in history
        try {
          const entry: import('../types').HistoryEntry = {
            id: commonParent.id,
            timestamp: Date.now(),
            type: 'selection',
            pageId: figma.currentPage.id,
            pageName: figma.currentPage.name,
            nodeId: commonParent.id,
            nodeName: parentName
          };
          
          addToHistory(entry);
        } catch (historyError) {
          // History recording failure shouldn't prevent navigation
          console.warn('Failed to record navigation in history:', historyError);
        }

        return {
          success: true,
          message: `Exited to common parent ${parentType.toLowerCase()}: ${parentName}`,
          newSelection: [commonParent],
          viewportUpdate: true
        };
      } catch (parentAccessError) {
        const error = createError(
          ErrorType.NO_PARENT,
          'Common parent container is no longer accessible',
          { parentId: commonParent.id, error: parentAccessError }
        );
        handleError(error);
        return {
          success: false,
          message: 'Common parent container is no longer available',
          viewportUpdate: false
        };
      }
    }, ErrorType.NO_PARENT)() || {
      success: false,
      message: 'Failed to exit container due to unexpected error',
      viewportUpdate: false
    };
  }

  /**
   * Navigate to next or previous sibling
   * Records navigation action in selection history
   * Enhanced with comprehensive error handling and validation
   * 
   * NOTE: This function does NOT modify the layer panel expanded/collapsed state
   * of containers. It only changes selection and viewport focus.
   */
  static navigateToSibling(node: SceneNode, direction: 'next' | 'prev'): NavigationResult {
    return withSyncErrorBoundary(() => {
      // Validate input node
      if (!validateSceneNode(node)) {
        const error = createError(
          ErrorType.NO_SIBLINGS,
          'Invalid node provided for sibling navigation',
          { nodeId: (node as any)?.id, direction }
        );
        handleError(error);
        return {
          success: false,
          message: 'Invalid selection for sibling navigation',
          viewportUpdate: false
        };
      }

      // Validate node is still accessible
      try {
        const nodeName = node.name;
        const nodeType = node.type;
        
        // Find sibling with error handling
        let sibling: SceneNode | null = null;
        try {
          sibling = LayerNavigationHandler.findSibling(node, direction);
        } catch (siblingError) {
          const error = createError(
            ErrorType.NO_SIBLINGS,
            'Failed to find sibling nodes',
            { nodeId: node.id, direction, error: siblingError }
          );
          handleError(error);
          return {
            success: false,
            message: 'Cannot access sibling elements',
            viewportUpdate: false
          };
        }
        
        if (!sibling) {
          // Try wrapping to other end
          let wrappedSibling: SceneNode | null = null;
          try {
            wrappedSibling = LayerNavigationHandler.findSibling(node, direction, true);
          } catch (wrapError) {
            console.warn('Failed to find wrapped sibling:', wrapError);
          }
          
          if (!wrappedSibling) {
            return {
              success: false,
              message: `"${nodeName}" has no ${direction === 'next' ? 'next' : 'previous'} siblings`,
              viewportUpdate: false
            };
          }
          
          // Validate wrapped sibling is accessible
          try {
            const wrappedName = wrappedSibling.name;
            
            // Record wrapped navigation in history
            try {
              const entry: import('../types').HistoryEntry = {
                id: wrappedSibling.id,
                timestamp: Date.now(),
                type: 'selection',
                pageId: figma.currentPage.id,
                pageName: figma.currentPage.name,
                nodeId: wrappedSibling.id,
                nodeName: wrappedName
              };
              
              addToHistory(entry);
            } catch (historyError) {
              // History recording failure shouldn't prevent navigation
              console.warn('Failed to record navigation in history:', historyError);
            }
            
            return {
              success: true,
              message: `Wrapped to ${direction === 'next' ? 'first' : 'last'} sibling: ${wrappedName}`,
              newSelection: [wrappedSibling],
              viewportUpdate: true
            };
          } catch (wrappedAccessError) {
            const error = createError(
              ErrorType.NO_SIBLINGS,
              'Wrapped sibling is no longer accessible',
              { siblingId: wrappedSibling.id, error: wrappedAccessError }
            );
            handleError(error);
            return {
              success: false,
              message: 'Sibling element is no longer available',
              viewportUpdate: false
            };
          }
        }

        // Validate sibling is accessible
        try {
          const siblingName = sibling.name;
          
          // Record navigation action in history
          try {
            const entry: import('../types').HistoryEntry = {
              id: sibling.id,
              timestamp: Date.now(),
              type: 'selection',
              pageId: figma.currentPage.id,
              pageName: figma.currentPage.name,
              nodeId: sibling.id,
              nodeName: siblingName
            };
            
            addToHistory(entry);
          } catch (historyError) {
            // History recording failure shouldn't prevent navigation
            console.warn('Failed to record navigation in history:', historyError);
          }

          return {
            success: true,
            message: `Selected ${direction} sibling: ${siblingName}`,
            newSelection: [sibling],
            viewportUpdate: true
          };
        } catch (siblingAccessError) {
          const error = createError(
            ErrorType.NO_SIBLINGS,
            'Sibling node is no longer accessible',
            { siblingId: sibling.id, error: siblingAccessError }
          );
          handleError(error);
          return {
            success: false,
            message: 'Sibling element is no longer available',
            viewportUpdate: false
          };
        }

      } catch (nodeAccessError) {
        // Original node may have been deleted or become inaccessible
        const error = createError(
          ErrorType.NO_SIBLINGS,
          'Selected node is no longer accessible',
          { nodeId: node.id, error: nodeAccessError }
        );
        handleError(error);
        return {
          success: false,
          message: 'Selected element is no longer available',
          viewportUpdate: false
        };
      }
    }, ErrorType.NO_SIBLINGS)() || {
      success: false,
      message: 'Failed to navigate to sibling due to unexpected error',
      viewportUpdate: false
    };
  }

  /**
   * Navigate to next or previous sibling for multiple selected nodes
   * Treats the selection as a group and selects the next/previous item relative to the group
   * Enhanced with comprehensive error handling and validation
   */
  static navigateToSiblingMultiple(nodes: readonly SceneNode[], direction: 'next' | 'prev'): NavigationResult {
    return withSyncErrorBoundary(() => {
      if (nodes.length === 0) {
        return {
          success: false,
          message: 'No nodes provided for sibling navigation',
          viewportUpdate: false
        };
      }

      // Validate all nodes first
      const validNodes: SceneNode[] = [];
      for (const node of nodes) {
        if (validateSceneNode(node)) {
          try {
            // Test node accessibility
            const _ = node.type;
            const __ = node.name;
            validNodes.push(node);
          } catch (nodeError) {
            console.warn('Skipping inaccessible node in multiple selection:', nodeError);
          }
        }
      }

      if (validNodes.length === 0) {
        return {
          success: false,
          message: 'No valid nodes in selection for sibling navigation',
          viewportUpdate: false
        };
      }

      // Find common parent of all selected nodes
      let commonParent: BaseNode | null = null;
      try {
        commonParent = LayerNavigationHandler.findCommonParentContainer(validNodes);
      } catch (parentError) {
        console.warn('Failed to find common parent for multiple selection:', parentError);
      }

      if (!commonParent || !('children' in commonParent)) {
        return {
          success: false,
          message: 'Selected items do not share a common parent for sibling navigation',
          viewportUpdate: false
        };
      }

      // Get all visible siblings in the parent
      const allSiblings = commonParent.children.filter(child => 
        'visible' in child && child.visible && validateSceneNode(child)
      ) as SceneNode[];

      if (allSiblings.length <= 1) {
        return {
          success: false,
          message: 'No siblings available for navigation',
          viewportUpdate: false
        };
      }

      // Find the indices of selected nodes within siblings
      const selectedIndices = validNodes
        .map(node => allSiblings.findIndex(sibling => sibling.id === node.id))
        .filter(index => index !== -1)
        .sort((a, b) => a - b);

      if (selectedIndices.length === 0) {
        return {
          success: false,
          message: 'Selected nodes not found among siblings',
          viewportUpdate: false
        };
      }

      // Determine target index based on direction
      let targetIndex: number;
      if (direction === 'next') {
        // Next: Select the first sibling after the selection group (toward bottom of layers)
        const lastSelectedIndex = selectedIndices[selectedIndices.length - 1];
        targetIndex = lastSelectedIndex - 1; // Move DOWN in layers (lower index)
        
        // Handle wrapping
        if (targetIndex < 0) {
          targetIndex = allSiblings.length - 1; // Wrap to last (top-most)
        }
      } else {
        // Prev: Select the first sibling before the selection group (toward top of layers)
        const firstSelectedIndex = selectedIndices[0];
        targetIndex = firstSelectedIndex + 1; // Move UP in layers (higher index)
        
        // Handle wrapping
        if (targetIndex >= allSiblings.length) {
          targetIndex = 0; // Wrap to first (bottom-most)
        }
      }

      const targetSibling = allSiblings[targetIndex];
      if (!targetSibling) {
        return {
          success: false,
          message: `No ${direction} sibling found for selection group`,
          viewportUpdate: false
        };
      }

      // Record navigation in history
      try {
        const entry: import('../types').HistoryEntry = {
          id: targetSibling.id,
          timestamp: Date.now(),
          type: 'selection',
          pageId: figma.currentPage.id,
          pageName: figma.currentPage.name,
          nodeId: targetSibling.id,
          nodeName: targetSibling.name
        };
        
        addToHistory(entry);
      } catch (historyError) {
        console.warn('Failed to record multiple sibling navigation in history:', historyError);
      }

      return {
        success: true,
        message: `Selected ${direction} sibling: ${targetSibling.name}`,
        newSelection: [targetSibling],
        viewportUpdate: true
      };
    }, ErrorType.NO_SIBLINGS)() || {
      success: false,
      message: 'Failed to navigate to sibling due to unexpected error',
      viewportUpdate: false
    };
  }

  /**
   * Toggle collapse/expand state of sibling containers only
   * Targets containers at the same hierarchy level as the selection
   * Falls back to top-level containers when no selection exists
   * Enhanced with comprehensive error handling and graceful degradation
   */
  static toggleCollapse(selection?: readonly SceneNode[]): NavigationResult {
    return withSyncErrorBoundary(() => {
      let page: PageNode;
      try {
        page = figma.currentPage;
        // Test page accessibility
        const _ = page.name;
      } catch (pageError) {
        const error = createError(
          ErrorType.NAVIGATION_FAILED,
          'Cannot access current page for collapse operation',
          { error: pageError }
        );
        handleError(error);
        return {
          success: false,
          message: 'Current page is not accessible',
          viewportUpdate: false
        };
      }

      // Use provided selection or current page selection
      const currentSelection = selection || figma.currentPage.selection;
      
      // If no selection, fall back to top-level containers
      if (currentSelection.length === 0) {
        return LayerNavigationHandler.toggleTopLevelContainers(page);
      }

      // Validate selection nodes
      const validNodes: SceneNode[] = [];
      for (const node of currentSelection) {
        if (validateSceneNode(node)) {
          try {
            // Test node accessibility
            const _ = node.type;
            const __ = node.name;
            validNodes.push(node);
          } catch (nodeError) {
            console.warn('Skipping inaccessible node in selection:', nodeError);
          }
        }
      }

      if (validNodes.length === 0) {
        return LayerNavigationHandler.toggleTopLevelContainers(page);
      }

      // Find sibling containers for the selection
      let siblingContainers: SceneNode[] = [];
      try {
        siblingContainers = LayerNavigationHandler.findSiblingContainers(validNodes);
      } catch (siblingError) {
        const error = createError(
          ErrorType.NAVIGATION_FAILED,
          'Failed to find sibling containers',
          { selectionLength: validNodes.length, error: siblingError }
        );
        handleError(error);
        return {
          success: false,
          message: 'Cannot find sibling containers',
          viewportUpdate: false
        };
      }

      if (siblingContainers.length === 0) {
        return {
          success: false,
          message: 'No sibling containers found to collapse/expand',
          viewportUpdate: false
        };
      }

      // Always collapse sibling containers (user expectation for "Collapse" button)
      let accessibleContainers = 0;
      
      for (const container of siblingContainers) {
        try {
          if (LayerNavigationHandler.isExpandableContainer(container)) {
            accessibleContainers++;
          }
        } catch (containerAccessError) {
          // Skip inaccessible containers but continue processing
          console.warn('Skipping inaccessible sibling container:', containerAccessError);
        }
      }
      
      if (accessibleContainers === 0) {
        return {
          success: false,
          message: 'No accessible sibling containers found',
          viewportUpdate: false
        };
      }
      
      const shouldCollapse = true; // Always collapse when button is pressed
      
      // Apply collapse to sibling containers AND selected containers with error handling
      let successCount = 0;
      let failureCount = 0;
      
      // Get sibling containers to collapse (much more efficient)
      let containersToCollapse: SceneNode[] = [];
      try {
        containersToCollapse = LayerNavigationHandler.findSiblingContainers(validNodes);
      } catch (siblingError) {
        console.warn('Failed to find sibling containers for collapse:', siblingError);
        return {
          success: false,
          message: 'Cannot find containers to collapse',
          viewportUpdate: false
        };
      }
      
      // Collapse all sibling containers
      for (const container of containersToCollapse) {
        try {
          if (LayerNavigationHandler.isExpandableContainer(container)) {
            (container as FrameNode | GroupNode | ComponentNode | ComponentSetNode | InstanceNode).expanded = false; // Always collapse
            successCount++;
          }
        } catch (containerError) {
          failureCount++;
          console.warn('Failed to collapse container:', containerError);
        }
      }

      if (successCount === 0) {
        const error = createError(
          ErrorType.NAVIGATION_FAILED,
          'Failed to collapse any containers',
          { totalContainers: containersToCollapse.length, failures: failureCount }
        );
        handleError(error);
        return {
          success: false,
          message: 'Could not collapse any containers',
          viewportUpdate: false
        };
      }

      const action = 'Collapsed'; // Always collapse
      let message = `${action} ${successCount} containers`;
      
      if (failureCount > 0) {
        message += ` (${failureCount} failed)`;
      }

      return {
        success: true,
        message,
        viewportUpdate: false
      };
    }, ErrorType.NAVIGATION_FAILED)() || {
      success: false,
      message: 'Failed to toggle container collapse state due to unexpected error',
      viewportUpdate: false
    };
  }

  /**
   * Analyze current selection and determine available navigation actions
   * Enhanced context analyzer with comprehensive validation and error handling
   */
  static validateNavigationContext(selection: readonly SceneNode[]): NavigationContext {
    return withSyncErrorBoundary(() => {
      const hasSelection = selection.length > 0;
      
      // Get container count with error handling (use cached version for performance)
      let containerCount = 0;
      try {
        // Use cached container count to avoid expensive page scanning on every navigation
        const containers = LayerNavigationHandler.findAllContainersOptimized(figma.currentPage);
        containerCount = containers.length;
      } catch (containerError) {
        console.warn('Failed to count containers on current page:', containerError);
        // Continue with containerCount = 0
      }
      
      if (!hasSelection) {
        return {
          hasSelection: false,
          canEnter: false,
          canExit: false,
          canNavigateSiblings: false,
          containerCount,
          siblingContainerCount: 0,
          hasCollapsibleSiblings: false
        };
      }

      // Validate selection nodes
      const validNodes: SceneNode[] = [];
      for (const node of selection) {
        if (validateSceneNode(node)) {
          try {
            // Test node accessibility
            const _ = node.type;
            const __ = node.name;
            validNodes.push(node);
          } catch (nodeError) {
            console.warn('Skipping inaccessible node in selection:', nodeError);
          }
        }
      }

      if (validNodes.length === 0) {
        return {
          hasSelection: false,
          canEnter: false,
          canExit: false,
          canNavigateSiblings: false,
          containerCount,
          siblingContainerCount: 0,
          hasCollapsibleSiblings: false
        };
      }

      // For multiple selections, use more conservative logic
      if (validNodes.length > 1) {
        // Can exit if all selected nodes have a common parent container
        let canExit = false;
        try {
          const commonParent = LayerNavigationHandler.findCommonParentContainer(validNodes);
          canExit = commonParent !== null;
        } catch (parentError) {
          console.warn('Failed to find common parent for multiple selection:', parentError);
          canExit = false;
        }
        
        // Calculate sibling container info for multiple selection (optimized)
        let siblingContainerCount = 0;
        let hasCollapsibleSiblings = false;
        try {
          // Only calculate sibling containers if we have a valid parent (performance optimization)
          if (canExit) {
            const siblingContainers = LayerNavigationHandler.findSiblingContainers(validNodes);
            siblingContainerCount = siblingContainers.length;
            hasCollapsibleSiblings = siblingContainers.some(container => 
              LayerNavigationHandler.isExpandableContainer(container)
            );
          }
        } catch (siblingError) {
          console.warn('Failed to analyze sibling containers for multiple selection:', siblingError);
        }
        
        // Check if multiple selection can navigate siblings
        let canNavigateSiblings = false;
        try {
          // Allow sibling navigation if the selected nodes have siblings
          canNavigateSiblings = LayerNavigationHandler.canNavigateSiblingsMultiple(validNodes);
        } catch (siblingError) {
          console.warn('Failed to validate sibling navigation for multiple selection:', siblingError);
          canNavigateSiblings = false;
        }

        // Cannot enter when multiple items selected
        return {
          hasSelection: true,
          canEnter: false,
          canExit,
          canNavigateSiblings,
          containerCount,
          siblingContainerCount,
          hasCollapsibleSiblings
        };
      }

      // Single selection analysis
      const primaryNode = validNodes[0];
      
      // Enhanced container entry validation with error handling
      let canEnter = false;
      try {
        canEnter = LayerNavigationHandler.canEnterContainer(primaryNode);
      } catch (enterError) {
        console.warn('Failed to validate container entry capability:', enterError);
        canEnter = false;
      }
      
      // Enhanced exit validation with error handling
      let canExit = false;
      try {
        canExit = LayerNavigationHandler.canExitContainer(primaryNode);
      } catch (exitError) {
        console.warn('Failed to validate container exit capability:', exitError);
        canExit = false;
      }
      
      // Enhanced sibling navigation validation with error handling
      let canNavigateSiblings = false;
      try {
        canNavigateSiblings = LayerNavigationHandler.canNavigateSiblings(primaryNode);
      } catch (siblingError) {
        console.warn('Failed to validate sibling navigation capability:', siblingError);
        canNavigateSiblings = false;
      }

      // Calculate sibling container info for single selection (optimized)
      let siblingContainerCount = 0;
      let hasCollapsibleSiblings = false;
      try {
        // Only calculate sibling containers if we can exit (performance optimization)
        if (canExit) {
          const siblingContainers = LayerNavigationHandler.findSiblingContainers(validNodes);
          siblingContainerCount = siblingContainers.length;
          hasCollapsibleSiblings = siblingContainers.some(container => 
            LayerNavigationHandler.isExpandableContainer(container)
          );
        }
      } catch (siblingError) {
        console.warn('Failed to analyze sibling containers for single selection:', siblingError);
      }

      return {
        hasSelection: true,
        canEnter,
        canExit,
        canNavigateSiblings,
        containerCount,
        siblingContainerCount,
        hasCollapsibleSiblings
      };
    }, ErrorType.VALIDATION_FAILED)() || {
      // Fallback context in case of complete failure
      hasSelection: false,
      canEnter: false,
      canExit: false,
      canNavigateSiblings: false,
      containerCount: 0,
      siblingContainerCount: 0,
      hasCollapsibleSiblings: false
    };
  }

  /**
   * Safe viewport update with error handling and performance optimization
   * Prevents viewport errors from breaking navigation and optimizes for large selections
   */
  static safeViewportUpdate(nodes: readonly SceneNode[]): boolean {
    return withSyncErrorBoundary(() => {
      if (!nodes || nodes.length === 0) {
        return false;
      }

      // Performance optimization: limit viewport update for very large selections
      const MAX_VIEWPORT_NODES = 50;
      let nodesToUpdate = nodes;
      
      if (nodes.length > MAX_VIEWPORT_NODES) {
        console.warn(`Large selection (${nodes.length} nodes), limiting viewport update to first ${MAX_VIEWPORT_NODES}`);
        nodesToUpdate = nodes.slice(0, MAX_VIEWPORT_NODES);
      }

      // Validate all nodes are accessible before viewport update
      const validNodes: SceneNode[] = [];
      for (const node of nodesToUpdate) {
        try {
          if (!validateSceneNode(node)) {
            continue;
          }
          // Test node accessibility
          const _ = node.type;
          const __ = node.name;
          if (!('visible' in node) || !node.visible) {
            continue;
          }
          validNodes.push(node);
        } catch (nodeError) {
          console.warn('Node not accessible for viewport update:', nodeError);
        }
      }

      if (validNodes.length === 0) {
        return false;
      }

      try {
        // Use requestAnimationFrame for smooth viewport updates
        if (typeof requestAnimationFrame !== 'undefined') {
          requestAnimationFrame(() => {
            try {
              figma.viewport.scrollAndZoomIntoView(validNodes);
            } catch (delayedError) {
              console.warn('Delayed viewport update failed:', delayedError);
            }
          });
        } else {
          figma.viewport.scrollAndZoomIntoView(validNodes);
        }
        return true;
      } catch (viewportError) {
        const error = createError(
          ErrorType.VIEWPORT_ERROR,
          'Failed to update viewport',
          { nodeCount: validNodes.length, totalNodes: nodes.length, error: viewportError }
        );
        handleError(error);
        return false;
      }
    }, ErrorType.VIEWPORT_ERROR)() || false;
  }

  /**
   * Performance-optimized container finding for large hierarchies
   * Uses caching and early termination to improve performance
   */
  private static containerCache = new Map<string, SceneNode[]>();
  private static cacheTimestamp = 0;
  private static readonly CACHE_DURATION = 5000; // 5 seconds

  static findAllContainersOptimized(parent: BaseNode): SceneNode[] {
    const now = Date.now();
    const cacheKey = parent.id;
    
    // Check cache validity
    if (now - LayerNavigationHandler.cacheTimestamp < LayerNavigationHandler.CACHE_DURATION) {
      const cached = LayerNavigationHandler.containerCache.get(cacheKey);
      if (cached) {
        return cached;
      }
    } else {
      // Clear expired cache
      LayerNavigationHandler.containerCache.clear();
      LayerNavigationHandler.cacheTimestamp = now;
    }

    const containers: SceneNode[] = [];
    const MAX_DEPTH = 10; // Prevent infinite recursion in complex hierarchies
    const MAX_CONTAINERS = 1000; // Limit for performance
    
    function findContainersRecursive(node: BaseNode, depth: number): void {
      if (depth > MAX_DEPTH || containers.length >= MAX_CONTAINERS) {
        return;
      }

      if ('children' in node) {
        for (const child of node.children) {
          try {
            if ('type' in child && LayerNavigationHandler.isContainer(child as SceneNode)) {
              containers.push(child as SceneNode);
            }
            // Recursively find containers in children
            findContainersRecursive(child, depth + 1);
          } catch (childError) {
            // Skip problematic children but continue processing
            console.warn('Skipping problematic child in container search:', childError);
          }
        }
      }
    }

    try {
      findContainersRecursive(parent, 0);
      
      // Cache the result
      LayerNavigationHandler.containerCache.set(cacheKey, containers);
      
      return containers;
    } catch (error) {
      console.warn('Error in optimized container finding:', error);
      return [];
    }
  }

  /**
   * Performance-optimized context calculation
   * Reduces computation time for large selections and complex hierarchies
   */
  static validateNavigationContextOptimized(selection: readonly SceneNode[]): NavigationContext {
    return withSyncErrorBoundary(() => {
      const startTime = performance.now();
      const hasSelection = selection.length > 0;
      
      // Performance optimization: limit context calculation for very large selections
      const MAX_SELECTION_FOR_FULL_ANALYSIS = 20;
      let selectionToAnalyze = selection;
      
      if (selection.length > MAX_SELECTION_FOR_FULL_ANALYSIS) {
        console.warn(`Large selection (${selection.length} nodes), limiting context analysis to first ${MAX_SELECTION_FOR_FULL_ANALYSIS}`);
        selectionToAnalyze = selection.slice(0, MAX_SELECTION_FOR_FULL_ANALYSIS);
      }
      
      // Get container count with caching
      let containerCount = 0;
      try {
        const containers = LayerNavigationHandler.findAllContainersOptimized(figma.currentPage);
        containerCount = containers.length;
      } catch (containerError) {
        console.warn('Failed to count containers on current page:', containerError);
      }
      
      if (!hasSelection) {
        const endTime = performance.now();
        console.log(`Navigation context calculation (empty): ${endTime - startTime}ms`);
        return {
          hasSelection: false,
          canEnter: false,
          canExit: false,
          canNavigateSiblings: false,
          containerCount,
          siblingContainerCount: 0,
          hasCollapsibleSiblings: false
        };
      }

      // Quick validation for performance
      const validNodes: SceneNode[] = [];
      for (const node of selectionToAnalyze) {
        if (validateSceneNode(node)) {
          try {
            // Minimal accessibility test
            const _ = node.type;
            validNodes.push(node);
          } catch (nodeError) {
            // Skip inaccessible nodes
          }
        }
      }

      if (validNodes.length === 0) {
        const endTime = performance.now();
        console.log(`Navigation context calculation (no valid nodes): ${endTime - startTime}ms`);
        return {
          hasSelection: false,
          canEnter: false,
          canExit: false,
          canNavigateSiblings: false,
          containerCount,
          siblingContainerCount: 0,
          hasCollapsibleSiblings: false
        };
      }

      // For multiple selections, use simplified logic for performance
      if (validNodes.length > 1) {
        let canExit = false;
        
        // Simplified common parent check - only check first few nodes for performance
        const nodesToCheck = validNodes.slice(0, 5);
        try {
          const commonParent = LayerNavigationHandler.findCommonParentContainer(nodesToCheck);
          canExit = commonParent !== null;
        } catch (parentError) {
          canExit = false;
        }
        
        const endTime = performance.now();
        // Calculate sibling container info for multiple selection (simplified for performance)
        let siblingContainerCount = 0;
        let hasCollapsibleSiblings = false;
        try {
          const siblingContainers = LayerNavigationHandler.findSiblingContainers(nodesToCheck);
          siblingContainerCount = siblingContainers.length;
          hasCollapsibleSiblings = siblingContainers.length > 0;
        } catch (siblingError) {
          // Skip sibling analysis for performance
        }
        
        console.log(`Navigation context calculation (multiple): ${endTime - startTime}ms`);
        return {
          hasSelection: true,
          canEnter: false,
          canExit,
          canNavigateSiblings: false,
          containerCount,
          siblingContainerCount,
          hasCollapsibleSiblings
        };
      }

      // Single selection analysis with performance monitoring
      const primaryNode = validNodes[0];
      
      // Parallel capability checks for better performance
      const capabilities = {
        canEnter: false,
        canExit: false,
        canNavigateSiblings: false
      };

      try {
        // Use Promise.all for parallel execution if possible, otherwise sequential
        capabilities.canEnter = LayerNavigationHandler.canEnterContainer(primaryNode);
        capabilities.canExit = LayerNavigationHandler.canExitContainer(primaryNode);
        capabilities.canNavigateSiblings = LayerNavigationHandler.canNavigateSiblings(primaryNode);
      } catch (capabilityError) {
        console.warn('Error checking navigation capabilities:', capabilityError);
      }

      const endTime = performance.now();
      // Calculate sibling container info for single selection
      let siblingContainerCount = 0;
      let hasCollapsibleSiblings = false;
      try {
        const siblingContainers = LayerNavigationHandler.findSiblingContainers(validNodes);
        siblingContainerCount = siblingContainers.length;
        hasCollapsibleSiblings = siblingContainers.length > 0;
      } catch (siblingError) {
        // Skip sibling analysis for performance
      }

      console.log(`Navigation context calculation (single): ${endTime - startTime}ms`);

      return {
        hasSelection: true,
        ...capabilities,
        containerCount,
        siblingContainerCount,
        hasCollapsibleSiblings
      };
    }, ErrorType.VALIDATION_FAILED)() || {
      // Fallback context in case of complete failure
      hasSelection: false,
      canEnter: false,
      canExit: false,
      canNavigateSiblings: false,
      containerCount: 0,
      siblingContainerCount: 0,
      hasCollapsibleSiblings: false
    };
  }

  /**
   * Debounced context updates to prevent excessive recalculation
   */
  private static contextUpdateTimeout: ReturnType<typeof setTimeout> | null = null;
  private static readonly CONTEXT_UPDATE_DELAY = 100; // 100ms debounce

  static scheduleContextUpdate(callback: (context: NavigationContext) => void): void {
    if (LayerNavigationHandler.contextUpdateTimeout) {
      clearTimeout(LayerNavigationHandler.contextUpdateTimeout);
    }

    LayerNavigationHandler.contextUpdateTimeout = setTimeout(() => {
      try {
        const context = LayerNavigationHandler.validateNavigationContextOptimized(figma.currentPage.selection);
        callback(context);
      } catch (error) {
        console.warn('Error in scheduled context update:', error);
      }
      LayerNavigationHandler.contextUpdateTimeout = null;
    }, LayerNavigationHandler.CONTEXT_UPDATE_DELAY);
  }

  /**
   * Performance monitoring for navigation operations
   */
  static measureNavigationPerformance<T>(
    operationName: string,
    operation: () => T
  ): T {
    const startTime = performance.now();
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    try {
      const result = operation();
      
      const endTime = performance.now();
      const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const duration = endTime - startTime;
      const memoryDelta = endMemory - startMemory;
      
      // Log performance metrics
      console.log(`Navigation ${operationName}: ${duration.toFixed(2)}ms`);
      if (memoryDelta > 0) {
        console.log(`Memory usage: +${(memoryDelta / 1024 / 1024).toFixed(2)}MB`);
      }
      
      // Warn about slow operations
      if (duration > 100) {
        console.warn(`Slow navigation operation: ${operationName} took ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      console.error(`Navigation ${operationName} failed after ${(endTime - startTime).toFixed(2)}ms:`, error);
      throw error;
    }
  }

  /**
   * Get user-friendly error message for navigation failures
   */
  static getNavigationErrorMessage(errorType: ErrorType, context?: Record<string, unknown>): string {
    switch (errorType) {
      case ErrorType.NO_SELECTION:
        return 'Please select a layer to navigate from';
      
      case ErrorType.INVALID_CONTAINER:
        return 'Selected element cannot be entered (must be a Section, Group, or Frame)';
      
      case ErrorType.NO_PARENT:
        return 'Selected element has no parent container to exit to';
      
      case ErrorType.NO_SIBLINGS:
        return 'Selected element has no siblings to navigate to';
      
      case ErrorType.VIEWPORT_ERROR:
        return 'Navigation completed but could not update view';
      
      case ErrorType.NAVIGATION_FAILED:
        return 'Navigation action failed - please try again';
      
      default:
        return 'An unexpected error occurred during navigation';
    }
  }

  /**
   * Handle empty selection scenario
   * Provides fallback behavior when no layers are selected
   */
  static handleEmptySelection(action: NavigationAction): NavigationResult {
    switch (action) {
      case 'next-sibling':
      case 'prev-sibling':
        // For sibling navigation with no selection, select first top-level layer
        return LayerNavigationHandler.selectFirstTopLevelLayer();
      
      case 'enter':
        return {
          success: false,
          message: 'Select a container (Section, Group, or Frame) to enter',
          viewportUpdate: false
        };
      
      case 'exit':
        return {
          success: false,
          message: 'Select a layer inside a container to exit',
          viewportUpdate: false
        };
      
      case 'toggle-collapse':
        // Collapse action can work without selection
        return LayerNavigationHandler.toggleCollapse();
      
      default:
        return {
          success: false,
          message: 'Please select a layer first',
          viewportUpdate: false
        };
    }
  }

  /**
   * Select first top-level layer as fallback for empty selection
   */
  private static selectFirstTopLevelLayer(): NavigationResult {
    return withSyncErrorBoundary(() => {
      try {
        const page = figma.currentPage;
        const topLevelLayers = page.children.filter(child => 
          'visible' in child && child.visible
        ) as SceneNode[];
        
        if (topLevelLayers.length === 0) {
          return {
            success: false,
            message: 'No visible layers found on current page',
            viewportUpdate: false
          };
        }

        const firstLayer = topLevelLayers[0];
        
        // Validate first layer is accessible
        try {
          const layerName = firstLayer.name;
          
          // Record navigation in history
          try {
            const entry: import('../types').HistoryEntry = {
              id: firstLayer.id,
              timestamp: Date.now(),
              type: 'selection',
              pageId: page.id,
              pageName: page.name,
              nodeId: firstLayer.id,
              nodeName: layerName
            };
            
            addToHistory(entry);
          } catch (historyError) {
            console.warn('Failed to record navigation in history:', historyError);
          }

          return {
            success: true,
            message: `Selected first layer: ${layerName}`,
            newSelection: [firstLayer],
            viewportUpdate: true
          };
        } catch (layerAccessError) {
          return {
            success: false,
            message: 'First layer is not accessible',
            viewportUpdate: false
          };
        }
      } catch (pageError) {
        const error = createError(
          ErrorType.NAVIGATION_FAILED,
          'Cannot access current page',
          { error: pageError }
        );
        handleError(error);
        return {
          success: false,
          message: 'Cannot access current page',
          viewportUpdate: false
        };
      }
    }, ErrorType.NAVIGATION_FAILED)() || {
      success: false,
      message: 'Failed to select first layer',
      viewportUpdate: false
    };
  }

  /**
   * Handle locked layers in selection
   * Provides appropriate feedback and fallback behavior
   */
  static handleLockedLayers(selection: readonly SceneNode[]): { validNodes: SceneNode[]; hasLockedNodes: boolean } {
    const validNodes: SceneNode[] = [];
    let hasLockedNodes = false;

    for (const node of selection) {
      try {
        if (!validateSceneNode(node)) {
          continue;
        }

        // Check if node is locked
        if ('locked' in node && node.locked) {
          hasLockedNodes = true;
          console.warn(`Skipping locked node: ${node.name}`);
          continue;
        }

        // Test node accessibility
        const _ = node.type;
        const __ = node.name;
        validNodes.push(node);
      } catch (nodeError) {
        console.warn('Skipping inaccessible node:', nodeError);
      }
    }

    return { validNodes, hasLockedNodes };
  }

  /**
   * Handle hidden layers in selection
   * Filters out hidden layers and provides feedback
   */
  static handleHiddenLayers(selection: readonly SceneNode[]): { visibleNodes: SceneNode[]; hasHiddenNodes: boolean } {
    const visibleNodes: SceneNode[] = [];
    let hasHiddenNodes = false;

    for (const node of selection) {
      try {
        if (!validateSceneNode(node)) {
          continue;
        }

        // Check if node is visible
        if (!('visible' in node) || !node.visible) {
          hasHiddenNodes = true;
          console.warn(`Skipping hidden node: ${node.name}`);
          continue;
        }

        // Test node accessibility
        const _ = node.type;
        const __ = node.name;
        visibleNodes.push(node);
      } catch (nodeError) {
        console.warn('Skipping inaccessible node:', nodeError);
      }
    }

    return { visibleNodes, hasHiddenNodes };
  }

  /**
   * Handle multiple selection edge cases
   * Provides appropriate behavior for complex selections
   */
  static handleMultipleSelection(selection: readonly SceneNode[], action: NavigationAction): NavigationResult {
    const { validNodes, hasLockedNodes } = LayerNavigationHandler.handleLockedLayers(selection);
    const { visibleNodes, hasHiddenNodes } = LayerNavigationHandler.handleHiddenLayers(validNodes);

    if (visibleNodes.length === 0) {
      let message = 'No valid layers in selection';
      if (hasLockedNodes && hasHiddenNodes) {
        message = 'All selected layers are locked or hidden';
      } else if (hasLockedNodes) {
        message = 'All selected layers are locked';
      } else if (hasHiddenNodes) {
        message = 'All selected layers are hidden';
      }

      return {
        success: false,
        message,
        viewportUpdate: false
      };
    }

    // Handle different actions for multiple selection
    switch (action) {
      case 'exit':
        return LayerNavigationHandler.exitContainer(visibleNodes);
      
      case 'next-sibling':
      case 'prev-sibling':
        return LayerNavigationHandler.navigateToSiblingMultiple(visibleNodes, action === 'next-sibling' ? 'next' : 'prev');
      
      case 'toggle-collapse':
        return LayerNavigationHandler.toggleCollapse(visibleNodes);
      
      default:
        // Enter action is not supported for multiple selection
        let message = `Cannot ${action.replace('-', ' ')} with multiple layers selected`;
        if (hasLockedNodes || hasHiddenNodes) {
          message += ` (${visibleNodes.length} of ${selection.length} layers are valid)`;
        }

        return {
          success: false,
          message,
          viewportUpdate: false
        };
    }
  }

  /**
   * Main navigation dispatcher with comprehensive edge case handling and performance monitoring
   * Handles empty selections, multiple selections, locked/hidden layers, and fallbacks
   */
  static performNavigation(action: NavigationAction, selection?: readonly SceneNode[]): NavigationResult {
    return LayerNavigationHandler.measureNavigationPerformance(`${action} navigation`, () => {
      const currentSelection = selection || figma.currentPage.selection;

      // Handle empty selection
      if (currentSelection.length === 0) {
        return LayerNavigationHandler.handleEmptySelection(action);
      }

      // Handle multiple selection
      if (currentSelection.length > 1) {
        return LayerNavigationHandler.handleMultipleSelection(currentSelection, action);
      }

      // Single selection - handle edge cases
      const node = currentSelection[0];
      const { validNodes, hasLockedNodes } = LayerNavigationHandler.handleLockedLayers([node]);
      const { visibleNodes, hasHiddenNodes } = LayerNavigationHandler.handleHiddenLayers(validNodes);

      if (visibleNodes.length === 0) {
        let message = 'Selected layer is not available for navigation';
        if (hasLockedNodes) {
          message = 'Selected layer is locked';
        } else if (hasHiddenNodes) {
          message = 'Selected layer is hidden';
        }

        return {
          success: false,
          message,
          viewportUpdate: false
        };
      }

      const validNode = visibleNodes[0];

      // Perform the requested navigation action
      let result: NavigationResult;
      
      switch (action) {
        case 'enter':
          result = LayerNavigationHandler.enterContainer(validNode);
          break;
        case 'exit':
          result = LayerNavigationHandler.exitContainer(validNode);
          break;
        case 'next-sibling':
          result = LayerNavigationHandler.navigateToSibling(validNode, 'next');
          break;
        case 'prev-sibling':
          result = LayerNavigationHandler.navigateToSibling(validNode, 'prev');
          break;
        case 'toggle-collapse':
          result = LayerNavigationHandler.toggleCollapse(currentSelection);
          break;
        default:
          result = {
            success: false,
            message: 'Unknown navigation action',
            viewportUpdate: false
          };
      }

      // If primary action failed, try fallback
      if (!result.success && action !== 'toggle-collapse') {
        const fallback = LayerNavigationHandler.getFallbackAction(action, validNode);
        if (fallback) {
          // Add fallback indicator to message
          fallback.message = `Fallback: ${fallback.message}`;
          return fallback;
        }
      }

      // Handle viewport update with error handling
      if (result.success && result.viewportUpdate && result.newSelection) {
        const viewportSuccess = LayerNavigationHandler.safeViewportUpdate(result.newSelection);
        if (!viewportSuccess) {
          result.message += ' (view not updated)';
        }
      }

      return result;
    });
  }

  /**
   * Implement fallback actions when primary navigation fails
   * Provides alternative navigation options
   */
  static getFallbackAction(action: NavigationAction, node: SceneNode): NavigationResult | null {
    switch (action) {
      case 'enter':
        // If can't enter, try selecting children directly
        if ('children' in node && node.children.length > 0) {
          const visibleChildren = node.children.filter(child => 
            'visible' in child && child.visible
          ) as SceneNode[];
          
          if (visibleChildren.length > 0) {
            return {
              success: true,
              message: `Selected ${visibleChildren.length} child elements`,
              newSelection: visibleChildren,
              viewportUpdate: true
            };
          }
        }
        return null;

      case 'exit':
        // If can't exit to parent container, try selecting parent directly
        try {
          const parent = node.parent;
          if (parent && parent.type !== 'PAGE' && 'name' in parent) {
            return {
              success: true,
              message: `Selected parent: ${parent.name}`,
              newSelection: [parent as SceneNode],
              viewportUpdate: true
            };
          }
        } catch (parentError) {
          console.warn('Cannot access parent for fallback:', parentError);
        }
        return null;

      case 'next-sibling':
      case 'prev-sibling':
        // If no siblings, try navigating to parent's siblings
        try {
          const parent = node.parent;
          if (parent && parent.type !== 'PAGE' && 'name' in parent) {
            const parentSibling = LayerNavigationHandler.findSibling(
              parent as SceneNode, 
              action === 'next-sibling' ? 'next' : 'prev'
            );
            
            if (parentSibling) {
              return {
                success: true,
                message: `Selected parent's ${action === 'next-sibling' ? 'next' : 'previous'} sibling: ${parentSibling.name}`,
                newSelection: [parentSibling],
                viewportUpdate: true
              };
            }
          }
        } catch (parentError) {
          console.warn('Cannot access parent for sibling fallback:', parentError);
        }
        return null;

      default:
        return null;
    }
  }

  // Helper methods
  private static isContainer(node: SceneNode): boolean {
    return node.type === 'SECTION' || 
           node.type === 'GROUP' || 
           node.type === 'FRAME' ||
           node.type === 'COMPONENT' ||
           node.type === 'COMPONENT_SET' ||
           node.type === 'INSTANCE';
  }

  /**
   * Check if a container can be collapsed/expanded (has expanded property)
   * Note: Sections don't have expanded property in Figma's API
   */
  private static isCollapsibleContainer(node: SceneNode): boolean {
    return node.type === 'GROUP' || 
           node.type === 'FRAME' ||
           node.type === 'COMPONENT' ||
           node.type === 'COMPONENT_SET' ||
           node.type === 'INSTANCE';
  }

  /**
   * Check if a container node has the expanded property and can be collapsed/expanded
   */
  private static isExpandableContainer(node: SceneNode): boolean {
    // Use the specific collapsible container check (excludes Sections)
    if (!LayerNavigationHandler.isCollapsibleContainer(node)) {
      return false;
    }

    // Check if the node actually has the expanded property
    try {
      return 'expanded' in node && typeof (node as any).expanded === 'boolean';
    } catch (error) {
      console.warn(`Failed to check expanded property for ${node.type}:`, error);
      return false;
    }
  }

  /**
   * Enhanced container entry validation with edge case handling
   */
  private static canEnterContainer(node: SceneNode): boolean {
    try {
      // Check if node is locked
      if ('locked' in node && node.locked) {
        return false;
      }

      // Check if node is visible
      if ('visible' in node && !node.visible) {
        return false;
      }

      if (!LayerNavigationHandler.isContainer(node)) {
        return false;
      }

      if (!('children' in node)) {
        return false;
      }

      // Check if container has visible, unlocked children
      const validChildren = node.children.filter(child => {
        try {
          return 'visible' in child && child.visible && 
                 (!('locked' in child) || !child.locked);
        } catch (childError) {
          return false;
        }
      });

      return validChildren.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Enhanced exit validation with edge case handling
   */
  private static canExitContainer(node: SceneNode): boolean {
    try {
      // Check if node is accessible
      if (!validateSceneNode(node)) {
        return false;
      }

      // Test node accessibility
      const _ = node.type;
      const __ = node.name;

      const parent = LayerNavigationHandler.findParentContainer(node);
      if (!parent) {
        return false;
      }

      // Check if parent is accessible and not locked
      try {
        const parentType = parent.type;
        const parentName = parent.name;
        
        // Check if parent is locked (cannot select locked parents)
        if ('locked' in parent && parent.locked) {
          return false;
        }

        return true;
      } catch (parentError) {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Enhanced sibling navigation validation with edge case handling
   */
  private static canNavigateSiblings(node: SceneNode): boolean {
    try {
      // Check if node is accessible
      if (!validateSceneNode(node)) {
        return false;
      }

      // Test node accessibility
      const _ = node.type;
      const __ = node.name;

      const parent = node.parent;
      if (!parent || !('children' in parent)) {
        return false;
      }

      // Count visible, unlocked siblings (excluding current node)
      const validSiblings = parent.children.filter(child => {
        try {
          return child !== node && 
                 'visible' in child && child.visible &&
                 (!('locked' in child) || !child.locked) &&
                 validateSceneNode(child);
        } catch (childError) {
          return false;
        }
      });
      
      return validSiblings.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if multiple selected nodes can navigate siblings as a group
   * Returns true if the nodes have siblings they can navigate to
   */
  private static canNavigateSiblingsMultiple(nodes: readonly SceneNode[]): boolean {
    try {
      if (nodes.length === 0) return false;

      // For multiple selection, check if any of the nodes can navigate siblings
      // This allows navigation even when some nodes are at boundaries
      for (const node of nodes) {
        try {
          if (LayerNavigationHandler.canNavigateSiblings(node)) {
            return true; // At least one node can navigate
          }
        } catch (nodeError) {
          // Skip problematic nodes but continue checking others
          continue;
        }
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Find common parent container for multiple selected nodes
   */
  private static findCommonParentContainer(nodes: readonly SceneNode[]): SceneNode | null {
    if (nodes.length === 0) return null;
    if (nodes.length === 1) return LayerNavigationHandler.findParentContainer(nodes[0]);

    // Find all parent containers for the first node
    const firstNodeParents = LayerNavigationHandler.getAllParentContainers(nodes[0]);
    
    // Check which parents are common to all nodes
    for (const parent of firstNodeParents) {
      const isCommonParent = nodes.every(node => 
        LayerNavigationHandler.isDescendantOf(node, parent)
      );
      
      if (isCommonParent) {
        return parent;
      }
    }
    
    return null;
  }

  /**
   * Get all parent containers up the hierarchy
   */
  private static getAllParentContainers(node: SceneNode): SceneNode[] {
    const parents: SceneNode[] = [];
    let current = node.parent;
    
    while (current && current.type !== 'PAGE') {
      if ('type' in current && LayerNavigationHandler.isContainer(current as SceneNode)) {
        parents.push(current as SceneNode);
      }
      current = current.parent;
    }
    
    return parents;
  }

  /**
   * Check if a node is a descendant of a potential parent
   */
  private static isDescendantOf(node: SceneNode, potentialParent: SceneNode): boolean {
    let current = node.parent;
    
    while (current && current.type !== 'PAGE') {
      if (current === potentialParent) {
        return true;
      }
      current = current.parent;
    }
    
    return false;
  }

  private static findParentContainer(node: SceneNode): SceneNode | null {
    let current = node.parent;
    
    while (current && current.type !== 'PAGE') {
      if ('type' in current && LayerNavigationHandler.isContainer(current as SceneNode)) {
        return current as SceneNode;
      }
      current = current.parent;
    }
    
    return null;
  }

  private static findSibling(node: SceneNode, direction: 'next' | 'prev', wrap = false): SceneNode | null {
    const parent = node.parent;
    if (!parent || !('children' in parent)) return null;

    const siblings = parent.children.filter(child => 
      'visible' in child && child.visible
    ) as SceneNode[];
    
    const currentIndex = siblings.indexOf(node);
    if (currentIndex === -1) return null;

    let targetIndex: number;
    
    // Reversed direction: 'next' moves UP (toward top of panel), 'prev' moves DOWN (toward bottom)
    if (direction === 'next') {
      // Next/Tab moves UP in layers (toward top of panel = lower index in Figma)
      targetIndex = currentIndex - 1;
      if (wrap && targetIndex < 0) {
        targetIndex = siblings.length - 1;
      }
    } else {
      // Prev/Shift+Tab moves DOWN in layers (toward bottom of panel = higher index in Figma)  
      targetIndex = currentIndex + 1;
      if (wrap && targetIndex >= siblings.length) {
        targetIndex = 0;
      }
    }

    return siblings[targetIndex] || null;
  }



  private static findAllContainers(parent: BaseNode): SceneNode[] {
    // Use optimized version for better performance
    return LayerNavigationHandler.findAllContainersOptimized(parent);
  }

  /**
   * Find sibling containers at the same hierarchy level as the selection
   * Returns containers that are siblings of the selected nodes or their parents
   */
  private static findSiblingContainers(selection: SceneNode[]): SceneNode[] {
    if (selection.length === 0) return [];

    // For single selection, find sibling containers
    if (selection.length === 1) {
      const node = selection[0];
      
      // If the selected node is itself a container, find its siblings
      if (LayerNavigationHandler.isContainer(node)) {
        const parent = node.parent;
        if (!parent || !('children' in parent)) return [];

        const siblingContainers: SceneNode[] = [];
        for (const child of parent.children) {
          try {
            if ('type' in child && LayerNavigationHandler.isContainer(child as SceneNode)) {
              siblingContainers.push(child as SceneNode);
            }
          } catch (childError) {
            console.warn('Skipping problematic sibling container:', childError);
          }
        }
        
        return siblingContainers;
      } else {
        // If the selected node is not a container, find sibling containers of its parent
        // This means we want to collapse containers at the same level as the parent
        const parent = node.parent;
        if (!parent || !('children' in parent)) return [];

        // If the parent is a container, find its siblings
        if (LayerNavigationHandler.isContainer(parent as SceneNode)) {
          const grandParent = parent.parent;
          if (!grandParent || !('children' in grandParent)) return [];

          const siblingContainers: SceneNode[] = [];
          for (const child of grandParent.children) {
            try {
              if ('type' in child && LayerNavigationHandler.isContainer(child as SceneNode)) {
                siblingContainers.push(child as SceneNode);
              }
            } catch (childError) {
              console.warn('Skipping problematic sibling container:', childError);
            }
          }
          
          return siblingContainers;
        } else {
          // If parent is not a container (e.g., page), find containers at the same level as the node
          const siblingContainers: SceneNode[] = [];
          for (const child of parent.children) {
            try {
              if ('type' in child && LayerNavigationHandler.isContainer(child as SceneNode)) {
                siblingContainers.push(child as SceneNode);
              }
            } catch (childError) {
              console.warn('Skipping problematic sibling container:', childError);
            }
          }
          
          return siblingContainers;
        }
      }
    }

    // For multiple selections, find containers at the same level as the common parent
    try {
      const commonParent = LayerNavigationHandler.findCommonParentContainer(selection);
      if (!commonParent) {
        // If no common parent container, try to find containers at the same level as the first node
        const firstNode = selection[0];
        const parent = firstNode.parent;
        if (!parent || !('children' in parent)) return [];

        const siblingContainers: SceneNode[] = [];
        for (const child of parent.children) {
          try {
            if ('type' in child && LayerNavigationHandler.isContainer(child as SceneNode)) {
              siblingContainers.push(child as SceneNode);
            }
          } catch (childError) {
            console.warn('Skipping problematic sibling container:', childError);
          }
        }
        
        return siblingContainers;
      }

      // Find sibling containers of the common parent
      if (!commonParent.parent || !('children' in commonParent.parent)) {
        return [];
      }

      const siblingContainers: SceneNode[] = [];
      for (const child of commonParent.parent.children) {
        try {
          if ('type' in child && LayerNavigationHandler.isContainer(child as SceneNode)) {
            siblingContainers.push(child as SceneNode);
          }
        } catch (childError) {
          console.warn('Skipping problematic sibling container:', childError);
        }
      }
      
      return siblingContainers;
    } catch (parentError) {
      console.warn('Failed to find common parent for sibling container search:', parentError);
      return [];
    }
  }

  /**
   * Toggle collapse/expand state of top-level containers on the page
   * Used as fallback when no selection exists
   */
  private static toggleTopLevelContainers(page: PageNode): NavigationResult {
    let containers: SceneNode[] = [];
    try {
      // Find only direct children containers of the page
      containers = page.children.filter(child => 
        'type' in child && LayerNavigationHandler.isContainer(child as SceneNode)
      ) as SceneNode[];
    } catch (containerError) {
      const error = createError(
        ErrorType.NAVIGATION_FAILED,
        'Failed to find top-level containers on current page',
        { pageId: page.id, error: containerError }
      );
      handleError(error);
      return {
        success: false,
        message: 'Cannot access page containers',
        viewportUpdate: false
      };
    }
    
    if (containers.length === 0) {
      return {
        success: false,
        message: 'No top-level containers found on current page',
        viewportUpdate: false
      };
    }

    // Determine if we should collapse or expand based on current state
    let expandedCount = 0;
    let accessibleContainers = 0;
    
    for (const container of containers) {
      try {
        if (LayerNavigationHandler.isExpandableContainer(container)) {
          accessibleContainers++;
          if (container.expanded) {
            expandedCount++;
          }
        }
      } catch (containerAccessError) {
        // Skip inaccessible containers but continue processing
        console.warn('Skipping inaccessible top-level container:', containerAccessError);
      }
    }
    
    if (accessibleContainers === 0) {
      return {
        success: false,
        message: 'No accessible top-level containers found',
        viewportUpdate: false
      };
    }
    
    const shouldCollapse = true; // Always collapse when button is pressed
    
    // Apply collapse to top-level containers with error handling
    let successCount = 0;
    let failureCount = 0;
    
    for (const container of containers) {
      try {
        if (LayerNavigationHandler.isExpandableContainer(container)) {
          (container as FrameNode | GroupNode | SectionNode | ComponentNode | ComponentSetNode | InstanceNode).expanded = false; // Always collapse
          successCount++;
        }
      } catch (containerError) {
        failureCount++;
        console.warn('Failed to collapse top-level container:', containerError);
      }
    }

    if (successCount === 0) {
      const error = createError(
        ErrorType.NAVIGATION_FAILED,
        'Failed to collapse any top-level containers',
        { totalContainers: containers.length, failures: failureCount }
      );
      handleError(error);
      return {
        success: false,
        message: 'Could not collapse any top-level containers',
        viewportUpdate: false
      };
    }

    const action = 'Collapsed'; // Always collapse
    let message = `${action} ${successCount} top-level containers`;
    
    if (failureCount > 0) {
      message += ` (${failureCount} failed)`;
    }

    return {
      success: true,
      message,
      viewportUpdate: false
    };
  }
}