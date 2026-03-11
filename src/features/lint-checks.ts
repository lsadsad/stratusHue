/// <reference types="@figma/plugin-typings" />

/**
 * lint-checks.ts
 * Five check functions (fill, stroke, text, effects, radius).
 * Each takes a SceneNode and returns LintError[] for that node.
 * Must be called after loadStyleCache() has resolved.
 */

import type { LintError, LintSettings } from '../core/lint-types';
import {
  rgbaToHex,
  matchPaintToStyle,
  matchTextNodeToStyle,
  matchEffectsToStyle,
} from './lint-styles';

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeId(nodeId: string, category: string, index: number): string {
  return `${nodeId}::${category}::${index}`;
}

function hasFills(node: SceneNode): node is SceneNode & { fills: readonly Paint[]; fillStyleId: string } {
  return 'fills' in node && 'fillStyleId' in node;
}

function hasStrokes(node: SceneNode): node is SceneNode & { strokes: readonly Paint[]; strokeStyleId: string } {
  return 'strokes' in node && 'strokeStyleId' in node;
}

function hasEffects(node: SceneNode): node is SceneNode & { effects: readonly Effect[]; effectStyleId: string } {
  return 'effects' in node && 'effectStyleId' in node;
}

function hasRadius(node: SceneNode): node is SceneNode & { cornerRadius: number | typeof figma.mixed } {
  return 'cornerRadius' in node;
}

// ── Fill check ────────────────────────────────────────────────────────────────

export function checkFills(node: SceneNode, _settings: LintSettings): LintError[] {
  if (!hasFills(node)) return [];

  const fills = node.fills;
  if (!Array.isArray(fills) || fills.length === 0) return [];

  // If a fill style is applied to the whole node, it's fine; if mixed (symbol), skip
  if (typeof node.fillStyleId !== 'string' || node.fillStyleId !== '') return [];

  const errors: LintError[] = [];

  fills.forEach((paint, i) => {
    if (!paint.visible) return;
    if (paint.type !== 'SOLID') return; // gradients/images exempt for now

    const match = matchPaintToStyle(paint as SolidPaint);
    const value = rgbaToHex(paint.color, paint.opacity ?? 1);

    errors.push({
      id: makeId(node.id, 'fill', i),
      nodeId: node.id,
      nodeName: node.name,
      category: 'fill',
      message: `Missing fill style · ${value}`,
      value,
      suggestedStyleId: match?.styleId,
      suggestedStyleName: match?.styleName,
    });
  });

  return errors;
}

// ── Stroke check ──────────────────────────────────────────────────────────────

export function checkStrokes(node: SceneNode, _settings: LintSettings): LintError[] {
  if (!hasStrokes(node)) return [];

  const strokes = node.strokes;
  if (!Array.isArray(strokes) || strokes.length === 0) return [];

  // Skip if stroke style applied or mixed (symbol)
  if (typeof node.strokeStyleId !== 'string' || node.strokeStyleId !== '') return [];

  const errors: LintError[] = [];

  strokes.forEach((paint, i) => {
    if (!paint.visible) return;
    if (paint.type !== 'SOLID') return;

    const match = matchPaintToStyle(paint as SolidPaint);
    const value = rgbaToHex(paint.color, paint.opacity ?? 1);

    errors.push({
      id: makeId(node.id, 'stroke', i),
      nodeId: node.id,
      nodeName: node.name,
      category: 'stroke',
      message: `Missing stroke style · ${value}`,
      value,
      suggestedStyleId: match?.styleId,
      suggestedStyleName: match?.styleName,
    });
  });

  return errors;
}

// ── Text check ────────────────────────────────────────────────────────────────

export function checkTextStyle(node: SceneNode, _settings: LintSettings): LintError[] {
  if (node.type !== 'TEXT') return [];

  // If a text style is applied, it's fine
  if (typeof node.textStyleId === 'string' && node.textStyleId !== '') return [];
  if (node.textStyleId === figma.mixed) return []; // mixed — too complex for now

  // Get font info (may be mixed if multiple segments)
  const fontName = node.fontName;
  const fontSize = node.fontSize;

  if (fontName === figma.mixed || fontSize === figma.mixed) return []; // mixed segments

  const match = matchTextNodeToStyle(fontName, fontSize);
  const value = `${fontName.family} ${fontName.style} ${fontSize}`;

  return [{
    id: makeId(node.id, 'text', 0),
    nodeId: node.id,
    nodeName: node.name,
    category: 'text',
    message: `Missing text style · ${value}`,
    value,
    suggestedStyleId: match?.styleId,
    suggestedStyleName: match?.styleName,
  }];
}

// ── Effects check ─────────────────────────────────────────────────────────────

export function checkEffects(node: SceneNode, _settings: LintSettings): LintError[] {
  if (!hasEffects(node)) return [];

  const effects = node.effects;
  if (!Array.isArray(effects) || effects.length === 0) return [];
  if (effects.every(e => !e.visible)) return [];

  // Skip if effect style applied or mixed (symbol)
  if (typeof node.effectStyleId !== 'string' || node.effectStyleId !== '') return [];

  const visibleEffects = effects.filter(e => e.visible);
  const match = matchEffectsToStyle(visibleEffects);
  const first = visibleEffects[0];
  const value = first.type.toLowerCase().replace('_', ' ');

  return [{
    id: makeId(node.id, 'effects', 0),
    nodeId: node.id,
    nodeName: node.name,
    category: 'effects',
    message: `Missing effect style · ${value}`,
    value,
    suggestedStyleId: match?.styleId,
    suggestedStyleName: match?.styleName,
  }];
}

// ── Border radius check ───────────────────────────────────────────────────────

export function checkBorderRadius(node: SceneNode, settings: LintSettings): LintError[] {
  if (!hasRadius(node)) return [];

  const radius = node.cornerRadius;
  if (radius === figma.mixed) return []; // per-corner mixed — skip
  if (typeof radius !== 'number') return [];
  if (radius === 0) return []; // 0 is always fine

  if (settings.allowedRadii.includes(radius)) return [];

  const value = `${radius}px`;
  return [{
    id: makeId(node.id, 'radius', 0),
    nodeId: node.id,
    nodeName: node.name,
    category: 'radius',
    message: `Border radius ${value} — not in allowed set`,
    value,
  }];
}

// ── Combined check ─────────────────────────────────────────────────────────────

export function checkNode(node: SceneNode, settings: LintSettings): LintError[] {
  const errors: LintError[] = [];

  if (settings.enableFill)    errors.push(...checkFills(node, settings));
  if (settings.enableStroke)  errors.push(...checkStrokes(node, settings));
  if (settings.enableText)    errors.push(...checkTextStyle(node, settings));
  if (settings.enableEffects) errors.push(...checkEffects(node, settings));
  if (settings.enableRadius)  errors.push(...checkBorderRadius(node, settings));

  return errors;
}
