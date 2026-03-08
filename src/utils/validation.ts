/// <reference types="@figma/plugin-typings" />

// Validation and Cleanup for stratusHue Plugin
// Handles bookmark validation and automatic cleanup

import { validateAndSyncBookmarks, validateRecentHistory, validateCurrentAnchor, updateBookmarkIfExists } from '../features/bookmarks';
import { sendBookmarksToUI } from '../ui/ui-communication';
import { shouldValidate, updateValidationTime } from '../core/state';
import { debounce } from './utils';

// ===== VALIDATION CONSTANTS =====
const VALIDATION_INTERVAL = 30000; // 30 seconds
const DEBOUNCE_DELAY = 1000; // 1 second

// ===== AUTO VALIDATION =====
export async function autoValidateBookmarks(): Promise<void> {
  if (!shouldValidate(VALIDATION_INTERVAL)) {
    return;
  }
  
  updateValidationTime();
  const result = await validateAndSyncBookmarks();
  
  if (result.updated > 0 || result.removed > 0) {
    await sendBookmarksToUI();
    
    if (result.updated > 0 && result.removed > 0) {
      figma.notify(`Updated ${result.updated} and removed ${result.removed} invalid bookmarks`);
    } else if (result.updated > 0) {
      figma.notify(`Updated ${result.updated} bookmark(s)`);
    } else if (result.removed > 0) {
      figma.notify(`Removed ${result.removed} invalid bookmark(s)`);
    }
  }
}

// ===== COMPREHENSIVE VALIDATION =====
export async function validateAllStates(): Promise<void> {
  try {
    await Promise.all([
      validateRecentHistory(),
      validateCurrentAnchor(),
      autoValidateBookmarks()
    ]);
  } catch (error) {
    console.error('Error during state validation:', error);
  }
}

// ===== DEBOUNCED VALIDATION =====
export const debouncedValidation = debounce(async () => {
  await autoValidateBookmarks();
}, DEBOUNCE_DELAY);

export const debouncedStateValidation = debounce(async () => {
  await validateAllStates();
}, DEBOUNCE_DELAY);

// ===== TARGETED BOOKMARK NAME UPDATE =====
// Track changed node IDs for batching
const changedNodeIds = new Set<string>();
let updateTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Efficiently update only specific bookmarks by their IDs
 * Uses the existing updateBookmarkIfExists function for each changed node
 */
async function updateSpecificBookmarks(nodeIds: Set<string>): Promise<void> {
  if (nodeIds.size === 0) return;
  
  try {
    let updated = false;
    
    for (const nodeId of nodeIds) {
      try {
        const node = await figma.getNodeByIdAsync(nodeId);
        if (node && 'name' in node) {
          const currentName = (node as SceneNode & { name: string }).name;
          const wasUpdated = await updateBookmarkIfExists(nodeId, currentName);
          if (wasUpdated) {
            updated = true;
          }
        }
      } catch (error) {
        // Node no longer exists, skip
      }
    }
    
    // If any bookmarks were updated, refresh the UI
    if (updated) {
      await sendBookmarksToUI();
    }
  } catch (error) {
    console.error('Error updating specific bookmarks:', error);
  }
}

/**
 * Trigger a batched update of changed bookmarks
 */
function triggerBatchedUpdate(): void {
  if (updateTimer) {
    clearTimeout(updateTimer);
  }
  
  updateTimer = setTimeout(() => {
    if (changedNodeIds.size > 0) {
      const idsToUpdate = new Set(changedNodeIds);
      changedNodeIds.clear();
      updateSpecificBookmarks(idsToUpdate).catch(console.error);
    }
    updateTimer = null;
  }, 300);
}

/**
 * Handle document changes efficiently - only update bookmarks when their names change
 */
export function handleDocumentChange(event: DocumentChangeEvent): void {
  try {
    // Quick synchronous check - no async imports needed for initial filtering
    const bookmarks = figma.root.getPluginData('bookmarks');
    if (!bookmarks) return;
    
    const bookmarksData = JSON.parse(bookmarks);
    const bookmarkedIds = new Set(bookmarksData.map((b: { id: string }) => b.id));
    
    // Check if any bookmarked nodes had property changes
    for (const change of event.documentChanges) {
      if (change.type === 'PROPERTY_CHANGE') {
        const nodeId = change.id;
        
        // Only care about changes to bookmarked nodes
        if (bookmarkedIds.has(nodeId)) {
          changedNodeIds.add(nodeId);
        }
      }
    }
    
    // If any bookmarked nodes changed, trigger batched update
    if (changedNodeIds.size > 0) {
      triggerBatchedUpdate();
    }
  } catch (error) {
    console.error('Error in handleDocumentChange:', error);
  }
}

// ===== VALIDATION TRIGGERS =====
export function triggerValidationOnSelectionChange(): void {
  debouncedValidation();
}

export function triggerValidationOnPageChange(): void {
  debouncedStateValidation();
}

