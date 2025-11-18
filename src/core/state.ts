/// <reference types="@figma/plugin-typings" />

// State Management for stratusHue Plugin
// Centralized state management with persistence

import type { Bookmark, CurrentAnchorState, RecentHistoryState, HistoryEntry } from './types';
import { DEFAULT_UI_WIDTH, DEFAULT_UI_HEIGHT } from './constants';

// ===== UI SECTION STATE INTERFACE =====
interface UISectionState {
  [sectionId: string]: {
    expanded: boolean;
    lastModified: number;
  };
}

// ===== LICENSE STATE INTERFACE =====
interface LicenseState {
  licenseKey: string | null;
  isValid: boolean;
  expiresAt: string | null;
  lastValidated: number;
  validationAttempts: number;
}

// ===== UI STATE =====
export let currentUiWidth = DEFAULT_UI_WIDTH;
export let lastUiHeight = DEFAULT_UI_HEIGHT;

export function setUiWidth(width: number): void {
  currentUiWidth = width;
}

export function setUiHeight(height: number): void {
  lastUiHeight = height;
}

// ===== BOOKMARK STATE =====
let bookmarksCache: Bookmark[] | null = null;

export async function getBookmarks(forceReload: boolean = false): Promise<Bookmark[]> {
  if (!forceReload && bookmarksCache) {
    return bookmarksCache;
  }

  try {
    const data = figma.root.getPluginData('bookmarks');
    const bookmarks = data ? JSON.parse(data) : [];
    bookmarksCache = bookmarks;
    return bookmarks;
  } catch (error) {
    console.error('Failed to load bookmarks:', error);
    return [];
  }
}

export async function setBookmarks(bookmarks: Bookmark[]): Promise<void> {
  try {
    figma.root.setPluginData('bookmarks', JSON.stringify(bookmarks));
    bookmarksCache = bookmarks;
  } catch (error) {
    console.error('Failed to save bookmarks:', error);
  }
}

export function clearBookmarksCache(): void {
  bookmarksCache = null;
}

// ===== ANCHOR STATE =====
export let currentAnchorState: CurrentAnchorState = {
  bookmarkId: null,
  timestamp: 0
};

export let recentHistoryState: RecentHistoryState = {
  previousBookmarkId: null,
  lastUpdated: 0
};

// ===== PREVIOUS SELECTION STATE =====
export let previousSelectionState: {
  nodeIds: string[];
  pageId: string;
  timestamp: number;
} | null = null;

export function setPreviousSelection(nodeIds: string[], pageId: string): void {
  previousSelectionState = {
    nodeIds,
    pageId,
    timestamp: Date.now()
  };
}

export function getPreviousSelection() {
  return previousSelectionState;
}

export function clearPreviousSelection(): void {
  previousSelectionState = null;
}

export function setCurrentAnchor(bookmarkId: string | null): void {
  currentAnchorState.bookmarkId = bookmarkId;
  currentAnchorState.timestamp = Date.now();
}

export function setPreviousBookmark(bookmarkId: string | null): void {
  recentHistoryState.previousBookmarkId = bookmarkId;
  recentHistoryState.lastUpdated = Date.now();
}

export async function loadAnchorState(): Promise<void> {
  try {
    const anchorData = await figma.clientStorage.getAsync('currentAnchor');
    if (anchorData) {
      currentAnchorState = anchorData;
    }

    const historyData = await figma.clientStorage.getAsync('recentHistory');
    if (historyData) {
      recentHistoryState = historyData;
    }
  } catch (error) {
    console.error('Failed to load anchor state:', error);
  }
}

export async function saveAnchorState(): Promise<void> {
  try {
    await Promise.all([
      figma.clientStorage.setAsync('currentAnchor', currentAnchorState),
      figma.clientStorage.setAsync('recentHistory', recentHistoryState)
    ]);
  } catch (error) {
    console.error('Failed to save anchor state:', error);
  }
}

// ===== NAVIGATION STATE =====
export const navigationHistory: HistoryEntry[] = [];
export let historyIndex = -1;
export let isNavigatingThroughHistory = false;

export function addToHistory(entry: HistoryEntry): void {
  // Remove any entries after current index
  navigationHistory.splice(historyIndex + 1);
  navigationHistory.push(entry);
  historyIndex = navigationHistory.length - 1;

  // Keep history size manageable
  if (navigationHistory.length > 50) {
    navigationHistory.shift();
    historyIndex--;
  }
}

export function canGoBack(): boolean {
  return historyIndex > 0;
}

export function canGoForward(): boolean {
  return historyIndex >= 0 && historyIndex < navigationHistory.length - 1;
}

export function setHistoryIndex(index: number): void {
  historyIndex = index;
}

export function setNavigatingThroughHistory(value: boolean): void {
  isNavigatingThroughHistory = value;
}

// ===== EMOJI SET STATE =====
export let currentLayerEmojiSetIndex = 0;
export let currentPageEmojiSetIndex = 0;

export function setLayerEmojiSetIndex(index: number): void {
  currentLayerEmojiSetIndex = index;
}

export function setPageEmojiSetIndex(index: number): void {
  currentPageEmojiSetIndex = index;
}

// ===== VALIDATION STATE =====
export let lastValidationTime = 0;

export function updateValidationTime(): void {
  lastValidationTime = Date.now();
}

export function shouldValidate(interval: number = 30000): boolean {
  return Date.now() - lastValidationTime >= interval;
}

// ===== LICENSE STATE =====
export let licenseState: LicenseState = {
  licenseKey: null,
  isValid: false,
  expiresAt: null,
  lastValidated: 0,
  validationAttempts: 0
};

export function setLicenseKey(key: string | null): void {
  licenseState.licenseKey = key;
  licenseState.lastValidated = Date.now();
}

export function setLicenseValid(isValid: boolean, expiresAt: string | null = null): void {
  licenseState.isValid = isValid;
  licenseState.expiresAt = expiresAt;
  licenseState.lastValidated = Date.now();

  if (!isValid) {
    licenseState.validationAttempts++;
  } else {
    licenseState.validationAttempts = 0;
  }
}

export function getLicenseState(): LicenseState {
  return { ...licenseState };
}

export function shouldRevalidateLicense(): boolean {
  const oneHour = 60 * 60 * 1000;
  return Date.now() - licenseState.lastValidated >= oneHour;
}

export async function loadLicenseState(): Promise<void> {
  try {
    const data = await figma.clientStorage.getAsync('licenseState');
    if (data) {
      licenseState = { ...licenseState, ...data };
    }
  } catch (error) {
    console.error('Failed to load license state:', error);
  }
}

export async function saveLicenseState(): Promise<void> {
  try {
    await figma.clientStorage.setAsync('licenseState', licenseState);
  } catch (error) {
    console.error('Failed to save license state:', error);
  }
}

export function clearLicenseState(): void {
  licenseState = {
    licenseKey: null,
    isValid: false,
    expiresAt: null,
    lastValidated: 0,
    validationAttempts: 0
  };
}

// ===== UI SECTION STATE =====
export let uiSectionStates: UISectionState = {};

// Debounce utility for state saving
let saveStateTimeout: ReturnType<typeof setTimeout> | null = null;

export async function loadUISectionStates(): Promise<void> {
  try {
    const data = await figma.clientStorage.getAsync('uiSectionStates');
    if (data && typeof data === 'object') {
      uiSectionStates = data;
    }
  } catch (error) {
    console.error('Failed to load UI section states:', error);
    uiSectionStates = {};
  }
}

export async function saveUISectionState(sectionId: string, expanded: boolean): Promise<void> {
  uiSectionStates[sectionId] = {
    expanded,
    lastModified: Date.now()
  };

  try {
    await figma.clientStorage.setAsync('uiSectionStates', uiSectionStates);
  } catch (error) {
    console.error('Failed to save UI section state:', error);
  }
}

export function debouncedSaveUISectionState(sectionId: string, expanded: boolean): void {
  // Clear existing timeout
  if (saveStateTimeout !== null) {
    clearTimeout(saveStateTimeout);
  }

  // Set new timeout for debounced save
  saveStateTimeout = setTimeout(async () => {
    await saveUISectionState(sectionId, expanded);
    saveStateTimeout = null;
  }, 300);
}

export function getSectionState(sectionId: string): boolean {
  const savedState = uiSectionStates[sectionId];
  return savedState ? savedState.expanded : true; // Default to expanded
}

export function initializeDefaultStates(): UISectionState {
  return {
    'tags-header': { expanded: true, lastModified: Date.now() },
    'anchors-header': { expanded: true, lastModified: Date.now() },
    'navigation-header': { expanded: true, lastModified: Date.now() }
  };
}