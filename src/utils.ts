/// <reference types="@figma/plugin-typings" />

// Utility Functions for Stratus Hue Plugin
// Centralized utility functions for better maintainability

import type { PageTitleParts } from './core/types';
import { LAYER_EMOJI_SETS, PAGE_EMOJI_SETS } from './core/constants';

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

// Remove only variation selectors (VS16) for cross-platform emoji matching
function stripVariationSelectors(input: string): string {
  return input.replace(/\uFE0F/g, '');
}

// Given an emoji, generate common display variants (with/without VS16)
function getEmojiVariants(emoji: string): string[] {
  const base = stripVariationSelectors(emoji);
  const withVs16 = base + '\uFE0F';
  const variants = new Set<string>([base, withVs16]);
  // Preserve original too in case it contains other codepoints
  variants.add(emoji);
  return Array.from(variants);
}

export function normalizePageName(name: string): string {
  // First remove problematic invisible/replacement chars
  let normalized = sanitizeForMatching(name);
  // Ensure exactly one space after arrow (preserve indentation)
  normalized = normalized.replace(/^(\s*↳)\s+/, '$1 ');
  // Ensure exactly one space after emoji when present (match whole emoji, not code units)
  const allPageEmojis = PAGE_EMOJI_SETS.flatMap(set => set.emojis);
  for (const emoji of allPageEmojis) {
    const pattern = new RegExp(`^(\\s*↳\\s*${emoji.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')})\\s+`);
    if (pattern.test(normalized)) {
      normalized = normalized.replace(pattern, '$1 ');
      break;
    }
  }
  return normalized;
}

// ===== EMOJI UTILITIES =====
export function removeEmojiPrefix(name: string): string {
  // Remove a LEADING emoji tag (layer/page) and any following single space.
  const { emoji, remainder } = detectLeadingEmoji(name);
  if (emoji) {
    return remainder.replace(/^\s+/, '');
  }
  return name;
}

export function replaceColorEmoji(name: string, newEmoji: string): string {
  // Replace only a LEADING tag emoji if present; otherwise prefix a new one
  const { emoji, remainder } = detectLeadingEmoji(name);
  if (emoji) {
    return `${newEmoji} ${remainder.replace(/^\s+/, '')}`;
  }
  return `${newEmoji} ${name}`;
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

  // Extract emoji from page emoji sets anywhere before colon, tolerant of VS16 differences
  const allPageEmojis = PAGE_EMOJI_SETS.flatMap(set => set.emojis);
  const normalizedBefore = stripVariationSelectors(beforeColon);
  const emoji = allPageEmojis.find(e => normalizedBefore.includes(stripVariationSelectors(e))) || null;

  // Title is everything after the colon, trimmed of only leading spaces
  const title = afterColon.length > 0 ? afterColon.replace(/^\s+/, '') : name.replace(/^(\s*↳\s*)/, '');

  return { leadingSpaces, emoji, date, title };
}

export function composePageTitle(parts: PageTitleParts): string {
  // Preserve intentional leading spaces (e.g., from Indent action)
  const cleanTitle = sanitizeForMatching(parts.title);
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

// Insert 4 spaces before the title text while preserving existing leading spaces and tokens
export function addIndentToPageTitle(rawName: string): string {
  const parts = parsePageTitleParts(rawName);
  const indent = '    ';
  parts.leadingSpaces = (parts.leadingSpaces || '') + indent;
  return composePageTitle(parts);
}

// Remove four spaces from the very start of the page name (before arrow/emoji) if present
export function removeIndentFromPageTitle(rawName: string): string {
  const parts = parsePageTitleParts(rawName);
  if (parts.leadingSpaces && parts.leadingSpaces.startsWith('    ')) {
    parts.leadingSpaces = parts.leadingSpaces.slice(4);
  }
  return composePageTitle(parts);
}

// ===== DATE TAGGING UTILITIES =====
export function getTodayDateToken(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${mm}.${dd}`; // MM.DD
}

export function addOrReplaceDateInPageTitle(rawName: string): string {
  const parts = parsePageTitleParts(rawName);
  parts.date = getTodayDateToken();
  return composePageTitle(parts);
}

export function addOrReplaceDateInLayerName(rawName: string): string {
  // Strategy: if an emoji tag is present at the start, place the date after it.
  // Always replace any existing leading MM.DD : token (either after emoji or at start).
  const today = getTodayDateToken();

  const { emoji, remainder } = detectLeadingEmoji(rawName);

  // Strip existing leading date token from the remainder (start of remainder only)
  const remainderSansDate = remainder.replace(/^\s*\d{2}\.\d{2}\s*:\s*/, '');

  const prefix = emoji ? `${emoji} ` : '';
  return `${prefix}${today} : ${remainderSansDate.trimStart()}`;
}

// Detect a leading emoji tag (from either page or layer sets) and return it with the remainder of the name
export function detectLeadingEmoji(name: string): { emoji: string | null; remainder: string } {
  const allLayerEmojis = LAYER_EMOJI_SETS.flatMap(set => set.emojis);
  const allPageEmojis = PAGE_EMOJI_SETS.flatMap(set => set.emojis);
  const allEmojis = [...allLayerEmojis, ...allPageEmojis];

  for (const canonical of allEmojis) {
    const variants = getEmojiVariants(canonical);
    for (const variant of variants) {
      if (name.startsWith(variant + ' ')) {
        return { emoji: variant, remainder: name.slice((variant + ' ').length) };
      }
      if (name.startsWith(variant)) {
        return { emoji: variant, remainder: name.slice(variant.length) };
      }
    }
  }
  return { emoji: null, remainder: name };
}