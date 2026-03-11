/// <reference types="@figma/plugin-typings" />

import type { PluginMode, LintSettings, IgnoredErrorEntry } from './lint-types';
import { DEFAULT_LINT_SETTINGS } from './lint-types';

// ===== PLUGIN MODE =====

let _currentMode: PluginMode = 'navigate';

export function getCurrentMode(): PluginMode {
  return _currentMode;
}

export async function loadPluginMode(): Promise<PluginMode> {
  const stored = await figma.clientStorage.getAsync('pluginMode') as string | undefined;
  if (stored === 'lint' || stored === 'navigate' || stored === 'scaffold') {
    _currentMode = stored;
  }
  return _currentMode;
}

export async function persistPluginMode(mode: PluginMode): Promise<void> {
  _currentMode = mode;
  await figma.clientStorage.setAsync('pluginMode', mode);
}

// ===== LINT SETTINGS =====

let _lintSettings: LintSettings = { ...DEFAULT_LINT_SETTINGS };

export function getLintSettings(): LintSettings {
  return { ..._lintSettings };
}

export async function loadLintSettings(): Promise<LintSettings> {
  const stored = await figma.clientStorage.getAsync('lintSettings') as Partial<LintSettings> | undefined;
  if (stored && typeof stored === 'object') {
    _lintSettings = { ...DEFAULT_LINT_SETTINGS, ...stored };
  }
  return getLintSettings();
}

export async function persistLintSettings(settings: Partial<LintSettings>): Promise<void> {
  _lintSettings = { ..._lintSettings, ...settings };
  await figma.clientStorage.setAsync('lintSettings', _lintSettings);
}

// ===== IGNORED ERRORS (per-document) =====

/** Returns the clientStorage key for this document's ignored errors. */
function getIgnoreKey(): string {
  let uuid = figma.root.getPluginData('lintIgnoreKey');
  if (!uuid) {
    uuid = `lint_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    figma.root.setPluginData('lintIgnoreKey', uuid);
  }
  return `lintIgnored::${uuid}`;
}

let _ignoredIds: Set<string> = new Set();

export function getIgnoredIds(): string[] {
  return Array.from(_ignoredIds);
}

export function isIgnored(errorId: string): boolean {
  return _ignoredIds.has(errorId);
}

export async function loadIgnoredErrors(): Promise<string[]> {
  const key = getIgnoreKey();
  const stored = await figma.clientStorage.getAsync(key) as IgnoredErrorEntry[] | undefined;
  if (Array.isArray(stored)) {
    _ignoredIds = new Set(stored.map(e => e.errorId));
  }
  return getIgnoredIds();
}

export async function addIgnoredError(errorId: string): Promise<void> {
  _ignoredIds.add(errorId);
  await _persistIgnored();
}

export async function removeIgnoredError(errorId: string): Promise<void> {
  _ignoredIds.delete(errorId);
  await _persistIgnored();
}

export async function clearIgnoredErrors(): Promise<void> {
  _ignoredIds.clear();
  await _persistIgnored();
}

async function _persistIgnored(): Promise<void> {
  const key = getIgnoreKey();
  const entries: IgnoredErrorEntry[] = Array.from(_ignoredIds).map(id => ({
    errorId: id,
    ignoredAt: Date.now(),
  }));
  await figma.clientStorage.setAsync(key, entries);
}
