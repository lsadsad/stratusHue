/// <reference types="@figma/plugin-typings" />

// ===== PLUGIN MODES =====

export type PluginMode = 'navigate' | 'lint' | 'scaffold';

// ===== LINT SCOPE =====

/**
 * Controls which nodes are fed to the scanner.
 * - selection: only nodes currently selected on canvas (opt-in, zero noise)
 * - tagged:    only top-level frames whose name contains lintScopeEmoji
 * - page:      entire current page (original behaviour, power-user escape hatch)
 */
export type LintScope = 'selection' | 'tagged' | 'page';

// ===== LINT CATEGORIES =====

export type LintCategory = 'fill' | 'stroke' | 'text' | 'effects' | 'radius';

// ===== LINT ERROR =====

export interface LintError {
  /** Unique key: `${nodeId}::${category}::${value}` */
  id: string;
  nodeId: string;
  nodeName: string;
  category: LintCategory;
  /** Human-readable description of the missing style / invalid value */
  message: string;
  /** Raw value (hex color, px value, etc.) */
  value: string;
  /** Best-match style suggestion, if found */
  suggestedStyleId?: string;
  suggestedStyleName?: string;
}

// ===== STYLE MATCH =====

export interface LintStyleMatch {
  styleId: string;
  styleName: string;
  score: number;
}

// ===== SETTINGS =====

export interface LintSettings {
  enableFill: boolean;
  enableStroke: boolean;
  enableText: boolean;
  enableEffects: boolean;
  enableRadius: boolean;
  /** Comma-separated allowed border-radius values in px */
  allowedRadii: number[];
  /**
   * Case-insensitive substrings — any node whose name contains one of these
   * is skipped entirely, along with its children. Useful for excluding
   * annotation frames, spec labels, and other non-component layers.
   */
  skipLayerNames: string[];
  /** Which nodes to feed into the scanner (default: 'selection'). */
  lintScope: LintScope;
  /**
   * Emoji used to opt frames into "tagged" scope mode.
   * Any top-level frame whose name contains this emoji is included.
   */
  lintScopeEmoji: string;
}

export const DEFAULT_LINT_SETTINGS: LintSettings = {
  enableFill: true,
  enableStroke: true,
  enableText: true,
  enableEffects: true,
  enableRadius: true,
  allowedRadii: [0, 2, 4, 8, 16, 24, 100],
  skipLayerNames: [],
  lintScope: 'selection',
  lintScopeEmoji: '✅',
};

// ===== IGNORE =====

export interface IgnoredErrorEntry {
  errorId: string;
  ignoredAt: number;
}

// ===== MESSAGE TYPES =====

export type LintProgressPayload = {
  type: 'lint-progress';
  scanned: number;
  total: number;
  phase: 'scanning' | 'matching' | 'done';
};

export type LintResultsPayload = {
  type: 'lint-results';
  errors: LintError[];
  ignoredIds: string[];
  nodeCount: number;
  scanMs: number;
};

export type LintModePayload = {
  type: 'lint-mode-confirmed';
  mode: PluginMode;
};
