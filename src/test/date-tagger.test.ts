/// <reference types="@figma/plugin-typings" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addOrReplaceDateInLayerName, addOrReplaceDateInPageTitle, getTodayDateToken } from '../utils/utils';

// Fix today's date so tests are deterministic
const FIXED_DATE = new Date('2026-05-29T12:00:00');
vi.useFakeTimers();
vi.setSystemTime(FIXED_DATE);

const TOKEN_NUMERIC = '05.29.2026';
const TOKEN_ALPHA   = 'May.29.2026';

describe('date tagger — addOrReplaceDateInLayerName', () => {
  it('adds prefix to a plain layer name', () => {
    expect(addOrReplaceDateInLayerName('My Layer', 'numeric', 'prefix')).toBe(`${TOKEN_NUMERIC} : My Layer`);
  });

  it('adds suffix to a plain layer name', () => {
    expect(addOrReplaceDateInLayerName('My Layer', 'numeric', 'suffix')).toBe(`My Layer - ${TOKEN_NUMERIC}`);
  });

  it('replaces an existing prefix date with a new prefix (idempotent)', () => {
    const prefixed = `${TOKEN_NUMERIC} : My Layer`;
    expect(addOrReplaceDateInLayerName(prefixed, 'numeric', 'prefix')).toBe(prefixed);
  });

  it('replaces an existing suffix date with a new suffix (idempotent)', () => {
    const suffixed = `My Layer - ${TOKEN_NUMERIC}`;
    expect(addOrReplaceDateInLayerName(suffixed, 'numeric', 'suffix')).toBe(suffixed);
  });

  it('prefix → suffix: strips prefix and adds suffix (no double date)', () => {
    const prefixed = `${TOKEN_NUMERIC} : My Layer`;
    const result = addOrReplaceDateInLayerName(prefixed, 'numeric', 'suffix');
    expect(result).toBe(`My Layer - ${TOKEN_NUMERIC}`);
    expect((result.match(/\d{2}\.\d{2}\.\d{4}/g) ?? []).length).toBe(1);
  });

  it('suffix → prefix: strips suffix and adds prefix (no double date)', () => {
    const suffixed = `My Layer - ${TOKEN_NUMERIC}`;
    const result = addOrReplaceDateInLayerName(suffixed, 'numeric', 'prefix');
    expect(result).toBe(`${TOKEN_NUMERIC} : My Layer`);
    expect((result.match(/\d{2}\.\d{2}\.\d{4}/g) ?? []).length).toBe(1);
  });

  it('handles emoji prefix correctly in suffix mode', () => {
    const prefixed = `🔵 ${TOKEN_NUMERIC} : My Layer`;
    const result = addOrReplaceDateInLayerName(prefixed, 'numeric', 'suffix');
    expect(result).toBe(`🔵 My Layer - ${TOKEN_NUMERIC}`);
  });

  it('handles alpha format', () => {
    expect(addOrReplaceDateInLayerName('My Layer', 'alpha', 'suffix')).toBe(`My Layer - ${TOKEN_ALPHA}`);
  });
});

describe('date tagger — addOrReplaceDateInPageTitle', () => {
  it('adds prefix to a plain page name', () => {
    const result = addOrReplaceDateInPageTitle('My Page', 'numeric', 'prefix');
    expect(result).toContain(TOKEN_NUMERIC);
    expect(result).toContain('My Page');
    expect((result.match(/\d{2}\.\d{2}\.\d{4}/g) ?? []).length).toBe(1);
  });

  it('adds suffix to a plain page name', () => {
    const result = addOrReplaceDateInPageTitle('My Page', 'numeric', 'suffix');
    expect(result).toBe(`My Page - ${TOKEN_NUMERIC}`);
  });

  it('prefix → suffix: no double date', () => {
    const prefixed = addOrReplaceDateInPageTitle('My Page', 'numeric', 'prefix');
    const result = addOrReplaceDateInPageTitle(prefixed, 'numeric', 'suffix');
    expect((result.match(/\d{2}\.\d{2}\.\d{4}/g) ?? []).length).toBe(1);
  });

  it('suffix → prefix: no double date', () => {
    const suffixed = `My Page - ${TOKEN_NUMERIC}`;
    const result = addOrReplaceDateInPageTitle(suffixed, 'numeric', 'prefix');
    expect((result.match(/\d{2}\.\d{2}\.\d{4}/g) ?? []).length).toBe(1);
  });

  it('full round trip prefix→suffix→prefix: no double date at any step', () => {
    const p1 = addOrReplaceDateInPageTitle('My Page', 'numeric', 'prefix');
    const p2 = addOrReplaceDateInPageTitle(p1, 'numeric', 'suffix');
    const p3 = addOrReplaceDateInPageTitle(p2, 'numeric', 'prefix');
    const p4 = addOrReplaceDateInPageTitle(p3, 'numeric', 'suffix');
    for (const name of [p1, p2, p3, p4]) {
      expect((name.match(/\d{2}\.\d{2}\.\d{4}/g) ?? []).length).toBe(1);
    }
  });

  it('suffix with emoji: no double date', () => {
    const suffixed = addOrReplaceDateInPageTitle('My Page', 'numeric', 'suffix');
    expect(suffixed).toBe(`My Page - ${TOKEN_NUMERIC}`);
  });
});
