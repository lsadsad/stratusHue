/// <reference types="@figma/plugin-typings" />
import { describe, it, expect } from 'vitest';
import { parsePageTitleParts, composePageTitle } from '../utils/utils';
import { addEmojiToSelection } from '../features/emoji-manager';

describe('Page title emoji debug reproduction', () => {
  it('does not duplicate emoji for unstructured indented page names', () => {
    const rawName = '    ↳ 🟠 Dev Hand Off - MVP Add On Entry Point - 03.09.2026 STALE';
    const parts = parsePageTitleParts(rawName);
    parts.emoji = '🔵';
    const updated = composePageTitle(parts);

    expect(parts.title.startsWith('🟠')).toBe(false);
    expect(updated).toBe('    ↳ 🔵 Dev Hand Off - MVP Add On Entry Point - 03.09.2026 STALE');
  });

  it('updates page emoji in addEmojiToSelection page branch without duplication', async () => {
    figma.currentPage.selection = [];
    figma.currentPage.name = '    ↳ 🟠 Dev Hand Off - MVP Add On Entry Point - 03.09.2026 STALE';

    const result = await addEmojiToSelection('🔵');

    expect(result.success).toBe(true);
    expect(figma.currentPage.name).toBe('    ↳ 🔵 Dev Hand Off - MVP Add On Entry Point - 03.09.2026 STALE');
  });
});
