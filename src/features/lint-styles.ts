/// <reference types="@figma/plugin-typings" />

/**
 * lint-styles.ts
 * Style resolution helpers for the Design Lint engine.
 * Maintains a lazy cache of local paint / text / effect styles.
 * All functions run in the plugin sandbox (figma.* available).
 */

import type { LintStyleMatch } from '../core/lint-types';

// ── Types ──────────────────────────────────────────────────────────────────────

interface StyleCache {
  paint: Map<string, PaintStyle>;   // styleId → PaintStyle
  text: Map<string, TextStyle>;
  effect: Map<string, EffectStyle>;
  loaded: boolean;
}

// ── Cache ──────────────────────────────────────────────────────────────────────

let _cache: StyleCache = {
  paint: new Map(),
  text: new Map(),
  effect: new Map(),
  loaded: false,
};

export function invalidateStyleCache(): void {
  _cache = { paint: new Map(), text: new Map(), effect: new Map(), loaded: false };
}

export async function loadStyleCache(): Promise<void> {
  if (_cache.loaded) return;

  const paintStyles = await figma.getLocalPaintStylesAsync();
  const textStyles = await figma.getLocalTextStylesAsync();
  const effectStyles = await figma.getLocalEffectStylesAsync();

  _cache.paint = new Map(paintStyles.map(s => [s.id, s]));
  _cache.text  = new Map(textStyles.map(s => [s.id, s]));
  _cache.effect = new Map(effectStyles.map(s => [s.id, s]));
  _cache.loaded = true;
}

export function getPaintStyleName(id: string): string | undefined {
  return _cache.paint.get(id)?.name;
}

export function getTextStyleName(id: string): string | undefined {
  return _cache.text.get(id)?.name;
}

export function getEffectStyleName(id: string): string | undefined {
  return _cache.effect.get(id)?.name;
}

// ── Color helpers ─────────────────────────────────────────────────────────────

const EPS = 0.005; // ~1/255

function rgbEq(a: RGBA, b: RGBA): boolean {
  return Math.abs(a.r - b.r) < EPS
      && Math.abs(a.g - b.g) < EPS
      && Math.abs(a.b - b.b) < EPS
      && Math.abs(a.a - b.a) < EPS;
}

export function rgbaToHex(c: RGB, opacity = 1): string {
  const r = Math.round(c.r * 255);
  const g = Math.round(c.g * 255);
  const b = Math.round(c.b * 255);
  const hex = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`.toUpperCase();
  return opacity < 1 ? `${hex} ${Math.round(opacity * 100)}%` : hex;
}

// ── Paint style matching ───────────────────────────────────────────────────────

/**
 * Given a SOLID paint, return the best-matching local paint style (if any).
 */
export function matchPaintToStyle(paint: SolidPaint): LintStyleMatch | null {
  if (paint.type !== 'SOLID') return null;
  const target: RGBA = { ...paint.color, a: paint.opacity ?? 1 };

  let best: LintStyleMatch | null = null;

  for (const [id, style] of _cache.paint) {
    const first = style.paints[0];
    if (!first || first.type !== 'SOLID') continue;
    const candidate: RGBA = { ...first.color, a: (first.opacity ?? 1) };
    if (rgbEq(target, candidate)) {
      const score = 1;
      if (!best || score > best.score) {
        best = { styleId: id, styleName: style.name, score };
      }
    }
  }
  return best;
}

// ── Text style matching ───────────────────────────────────────────────────────

/**
 * Given a TextNode (or a mixed-style segment via fontName/fontSize/weight),
 * return the best-matching local text style (if any).
 */
export function matchTextNodeToStyle(
  fontName: FontName,
  fontSize: number,
): LintStyleMatch | null {
  let best: LintStyleMatch | null = null;

  for (const [id, style] of _cache.text) {
    // Match on font family, style, and size
    if (
      style.fontName.family === fontName.family &&
      style.fontName.style  === fontName.style  &&
      Math.abs(style.fontSize - fontSize) < 0.5
    ) {
      if (!best || 1 > best.score) {
        best = { styleId: id, styleName: style.name, score: 1 };
      }
    }
  }
  return best;
}

// ── Effect style matching ─────────────────────────────────────────────────────

/**
 * Returns the best-matching effect style for a given effects array.
 * Matches on type and (for shadows) color + offset + radius.
 */
export function matchEffectsToStyle(effects: readonly Effect[]): LintStyleMatch | null {
  if (effects.length === 0) return null;
  const first = effects[0];

  let best: LintStyleMatch | null = null;

  for (const [id, style] of _cache.effect) {
    const styleEffects = style.effects;
    if (styleEffects.length === 0) continue;
    const sf = styleEffects[0];
    if (sf.type !== first.type) continue;

    // Compare shadow specifics
    if (
      (first.type === 'DROP_SHADOW' || first.type === 'INNER_SHADOW') &&
      (sf.type === 'DROP_SHADOW' || sf.type === 'INNER_SHADOW')
    ) {
      const matchColor = rgbEq(
        { r: first.color.r, g: first.color.g, b: first.color.b, a: first.color.a },
        { r: sf.color.r,    g: sf.color.g,    b: sf.color.b,    a: sf.color.a }
      );
      const matchRadius = Math.abs(first.radius - sf.radius) < 0.5;
      if (matchColor && matchRadius) {
        if (!best) best = { styleId: id, styleName: style.name, score: 1 };
      }
    } else if (first.type === 'LAYER_BLUR' && sf.type === 'LAYER_BLUR') {
      if (Math.abs(first.radius - sf.radius) < 0.5) {
        if (!best) best = { styleId: id, styleName: style.name, score: 1 };
      }
    }
  }
  return best;
}
