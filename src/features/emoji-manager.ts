/// <reference types="@figma/plugin-typings" />

// Emoji Management for stratusHue Plugin
// Handles emoji operations and set navigation

import { LAYER_EMOJI_SETS, PAGE_EMOJI_SETS } from '../core/constants';
import { currentLayerEmojiSetIndex, currentPageEmojiSetIndex, setLayerEmojiSetIndex, setPageEmojiSetIndex } from '../core/state';
import { replaceColorEmoji, removeEmojiPrefix, parsePageTitleParts, composePageTitle } from '../utils';
import { updateBookmarkIfExists, updateBookmarksForPage } from './bookmarks';

/**
 * Recursively walk all descendants of a node, applying fn to each.
 * No intermediate array — applies inline during traversal.
 */
export function walkDescendants(node: SceneNode, fn: (n: SceneNode) => void): void {
  if ('children' in node) {
    for (const child of (node as SceneNode & ChildrenMixin).children) {
      fn(child as SceneNode);
      walkDescendants(child as SceneNode, fn);
    }
  }
}

// ===== EMOJI SET MANAGEMENT =====
export function getCurrentEmojiSet(isLayer: boolean) {
  if (isLayer) {
    return LAYER_EMOJI_SETS[currentLayerEmojiSetIndex];
  } else {
    return PAGE_EMOJI_SETS[currentPageEmojiSetIndex];
  }
}

export function navigateEmojiSet(direction: 'prev' | 'next', isLayer: boolean): { setName: string; index: number } {
  const sets = isLayer ? LAYER_EMOJI_SETS : PAGE_EMOJI_SETS;
  const currentIndex = isLayer ? currentLayerEmojiSetIndex : currentPageEmojiSetIndex;
  
  let newIndex: number;
  if (direction === 'prev') {
    newIndex = currentIndex > 0 ? currentIndex - 1 : sets.length - 1;
  } else {
    newIndex = currentIndex < sets.length - 1 ? currentIndex + 1 : 0;
  }
  
  if (isLayer) {
    setLayerEmojiSetIndex(newIndex);
  } else {
    setPageEmojiSetIndex(newIndex);
  }
  
  return {
    setName: sets[newIndex].name,
    index: newIndex
  };
}

export function getEmojiNavigationState(hasLayerSelected: boolean) {
  const sets = hasLayerSelected ? LAYER_EMOJI_SETS : PAGE_EMOJI_SETS;
  const currentIndex = hasLayerSelected ? currentLayerEmojiSetIndex : currentPageEmojiSetIndex;
  
  return {
    currentSetIndex: currentIndex,
    totalSets: sets.length,
    setName: sets[currentIndex].name
  };
}

// ===== EMOJI OPERATIONS =====
export async function addEmojiToSelection(emoji: string): Promise<{ success: boolean; message: string; count: number }> {
  try {
    const selection = figma.currentPage.selection;
    
    if (selection.length > 0) {
      let updatedCount = 0;
      
      for (const node of selection) {
        if ('name' in node) {
          const oldName = (node as SceneNode & { name: string }).name;
          const newName = replaceColorEmoji(oldName, emoji);
          (node as SceneNode & { name: string }).name = newName;
          updatedCount++;
          
          // Update bookmark if exists (non-blocking)
          updateBookmarkIfExists(node.id, newName).catch(console.error);
        }
      }
      
      return {
        success: updatedCount > 0,
        message: `Added ${emoji} to ${updatedCount} layer(s)`,
        count: updatedCount
      };
    } else {
      // Add emoji to current page
      const oldName = figma.currentPage.name;
      const parts = parsePageTitleParts(oldName);
      parts.emoji = emoji;
      const newName = composePageTitle(parts);
      figma.currentPage.name = newName;
      
      // Update bookmarks asynchronously
      updateBookmarksForPage(figma.currentPage.id, newName).catch(console.error);
      
      return {
        success: true,
        message: `Added ${emoji} to page`,
        count: 1
      };
    }
  } catch (error) {
    console.error('Error adding emoji:', error);
    return {
      success: false,
      message: 'Failed to add emoji. Please try again.',
      count: 0
    };
  }
}

export async function clearEmojiFromSelection(): Promise<{ success: boolean; message: string; count: number }> {
  try {
    const selection = figma.currentPage.selection;
    
    if (selection.length > 0) {
      let clearedCount = 0;
      
      for (const node of selection) {
        if ('name' in node) {
          const oldName = (node as SceneNode & { name: string }).name;
          const newName = removeEmojiPrefix(oldName);
          
          if (oldName !== newName) {
            (node as SceneNode & { name: string }).name = newName;
            clearedCount++;
            
            // Update bookmark asynchronously
            updateBookmarkIfExists(node.id, newName).catch(console.error);
          }
        }
      }
      
      return {
        success: clearedCount > 0,
        message: clearedCount > 0 ? `Cleared emojis from ${clearedCount} layer(s)` : 'No emojis found to clear',
        count: clearedCount
      };
    } else {
      // Clear emoji from current page
      const oldName = figma.currentPage.name;
      const parts = parsePageTitleParts(oldName);
      
      if (parts.emoji) {
        parts.emoji = null;
        const newName = composePageTitle(parts);
        figma.currentPage.name = newName;
        
        // Update bookmarks asynchronously
        updateBookmarksForPage(figma.currentPage.id, newName).catch(console.error);
        
        return {
          success: true,
          message: 'Cleared emoji from page',
          count: 1
        };
      } else {
        return {
          success: false,
          message: 'No emoji found to clear',
          count: 0
        };
      }
    }
  } catch (error) {
    console.error('Error clearing emoji:', error);
    return {
      success: false,
      message: 'Failed to clear emoji. Please try again.',
      count: 0
    };
  }
}

// ===== EMOJI VALIDATION =====
export function isValidEmoji(emoji: string): boolean {
  const allLayerEmojis = LAYER_EMOJI_SETS.flatMap(set => set.emojis);
  const allPageEmojis = PAGE_EMOJI_SETS.flatMap(set => set.emojis);
  const allEmojis = [...allLayerEmojis, ...allPageEmojis];
  
  return allEmojis.includes(emoji);
}

export function getEmojiType(emoji: string): 'layer' | 'page' | 'unknown' {
  const layerEmojis = LAYER_EMOJI_SETS.flatMap(set => set.emojis);
  const pageEmojis = PAGE_EMOJI_SETS.flatMap(set => set.emojis);
  
  if (layerEmojis.includes(emoji)) return 'layer';
  if (pageEmojis.includes(emoji)) return 'page';
  return 'unknown';
}