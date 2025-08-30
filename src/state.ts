/// <reference types="@figma/plugin-typings" />

// State Management for Stratus Hue Plugin
// Centralized state management with persistence

import type { Bookmark, CurrentAnchorState, RecentHistoryState, HistoryEntry } from './types';
import { DEFAULT_UI_WIDTH, DEFAULT_UI_HEIGHT } from './constants';

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

export async function getBookmarks(): Promise<Bookmark[]> {
  if (bookmarksCache) {
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