/// <reference types="@figma/plugin-typings" />

// ===== PLUGIN MODES =====

export type PluginMode = 'navigate' | 'lint' | 'scaffold';

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
}

export const DEFAULT_LINT_SETTINGS: LintSettings = {
  enableFill: true,
  enableStroke: true,
  enableText: true,
  enableEffects: true,
  enableRadius: true,
  allowedRadii: [0, 2, 4, 8, 16, 24, 100],
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
