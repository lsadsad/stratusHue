/// <reference types="@figma/plugin-typings" />

// Validation and Cleanup for Stratus Hue Plugin
// Handles bookmark validation and automatic cleanup

import { validateAndSyncBookmarks, validateRecentHistory, validateCurrentAnchor } from './bookmarks';
import { sendBookmarksToUI } from './ui-communication';
import { shouldValidate, updateValidationTime } from './state';
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

// ===== VALIDATION TRIGGERS =====
export function triggerValidationOnSelectionChange(): void {
  debouncedValidation();
}

export function triggerValidationOnPageChange(): void {
  debouncedStateValidation();
}

