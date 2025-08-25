/// <reference types="@figma/plugin-typings" />

// Utility Functions for Stratus Hue Plugin
// Centralized utility functions for better maintainability

import type { PageTitleParts } from './types';
import { LAYER_EMOJI_SETS, PAGE_EMOJI_SETS } from './constants';

// ===== DEBOUNCE UTILITY =====
export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, wait = 100) {
  let timer: number | undefined;
  return (...args: Parameters<T>) => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => { fn(...args); }, wait) as unknown as number;
  };
}

// ===== NODE UTILITIES =====
export function getContainingPage(node: BaseNode): PageNode | null {
  let currentNode = node;
  while (currentNode.parent && currentNode.parent.type !== 'PAGE') {
    currentNode = currentNode.parent;
  }
  return currentNode.parent?.type === 'PAGE' ? currentNode.parent : null;
}

export function getPageName(node: BaseNode): string {
  const page = getContainingPage(node);
  return page?.name || 'Unknown Page';
}

// ===== STRING UTILITIES =====
export function sanitizeForMatching(name: string): string {
  // Remove emoji variation selectors, zero-width characters, NBSP/BOM, and replacement chars
  return name.replace(/[\uFE0F\u200B-\u200D\u2060\u00A0\uFEFF\uFFFD]/g, '');
}

export function normalizePageName(name: string): string {
  // First remove problematic invisible/replacement chars
  let normalized = sanitizeForMatching(name);
  // Ensure exactly one space after arrow (preserve indentation)
  normalized = normalized.replace(/^(\s*↳)\s+/, '$1 ');
  // Ensure exactly one space after emoji when present
  const allPageEmojis = PAGE_EMOJI_SETS.flatMap(set => set.emojis);
  const emojiPattern = `[${allPageEmojis.join('')}]`;
  const regex = new RegExp(`^(\\s*↳\\s*${emojiPattern})\\s+`, 'g');
  normalized = normalized.replace(regex, '$1 ');
  return normalized;
}

// ===== EMOJI UTILITIES =====
export function removeEmojiPrefix(name: string): string {
  // Remove a LEADING emoji tag (layer/page) and an optional single space after it.
  const allLayerEmojis = LAYER_EMOJI_SETS.flatMap(set => set.emojis);
  const allPageEmojis = PAGE_EMOJI_SETS.flatMap(set => set.emojis);
  const allEmojis = [...allLayerEmojis, ...allPageEmojis];

  for (const emoji of allEmojis) {
    if (name.startsWith(emoji + ' ')) {
      return name.slice((emoji + ' ').length);
    }
    if (name.startsWith(emoji)) {
      return name.slice(emoji.length);
    }
  }
  return name;
}

export function replaceColorEmoji(name: string, newEmoji: string): string {
  // Get all emojis from all sets
  const allLayerEmojis = LAYER_EMOJI_SETS.flatMap(set => set.emojis);
  const allPageEmojis = PAGE_EMOJI_SETS.flatMap(set => set.emojis);
  const allEmojis = [...allLayerEmojis, ...allPageEmojis];

  for (const emoji of allEmojis) {
    if (name.includes(emoji)) {
      return name.replace(emoji, newEmoji);
    }
  }
  return newEmoji + ' ' + name;
}

// ===== PAGE TITLE UTILITIES =====
export function parsePageTitleParts(rawName: string): PageTitleParts {
  const name = normalizePageName(rawName).normalize('NFC');
  const leadingSpacesMatch = name.match(/^(\s*)/);
  const leadingSpaces = leadingSpacesMatch ? leadingSpacesMatch[1] : '';
  const colonIndex = name.indexOf(':');
  const beforeColon = colonIndex >= 0 ? name.slice(0, colonIndex) : name;
  const afterColon = colonIndex >= 0 ? name.slice(colonIndex + 1) : '';

  // Extract date anywhere before colon
  const dateMatch = beforeColon.match(/\b(\d{2}\.\d{2})\b/);
  const date = dateMatch ? dateMatch[1] : null;

  // Extract emoji explicitly from our page emoji sets anywhere before colon
  const allPageEmojis = PAGE_EMOJI_SETS.flatMap(set => set.emojis);
  const emojiPattern = new RegExp(`[${allPageEmojis.join('')}]`);
  const emojiMatch = beforeColon.match(emojiPattern);
  const emoji = emojiMatch ? emojiMatch[0] : null;

  // Title is everything after the colon, trimmed of only leading spaces
  const title = afterColon.length > 0 ? afterColon.replace(/^\s+/, '') : name.replace(/^(\s*↳\s*)/, '');

  return { leadingSpaces, emoji, date, title };
}

export function composePageTitle(parts: PageTitleParts): string {
  const cleanTitle = sanitizeForMatching(parts.title).trimStart();
  const tokens: string[] = [];
  tokens.push('↳');
  if (parts.emoji) tokens.push(parts.emoji);
  if (parts.date) tokens.push(parts.date);
  let core = tokens.join(' ');
  if (parts.date) {
    core += ' : ' + cleanTitle;
  } else {
    // No date means just put a single space and the title
    core += (tokens.length > 0 ? ' ' : '') + cleanTitle;
  }
  return normalizePageName(parts.leadingSpaces + core);
}