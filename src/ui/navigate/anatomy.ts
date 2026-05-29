import { sendMessage } from '../shared/send-message';
import { updateScrollBehavior } from '../shared/layout';
import { ICON_EYE_OPEN, ICON_EYE_CLOSED, ICON_LOCK_OPEN, ICON_LOCK_CLOSED } from '../shared/icons';
import type { DateFormat } from '../../core/types';

// Timer for debouncing anatomy emoji reset between button hovers
export let emojiPreviewResetTimer: number | null = null;

// ===== ANATOMY SECTION UTILITIES =====
// Store current anatomy state for hover previews
export const currentAnatomyState = {
  emoji: '',
  date: '12.29',
  hasDate: false,
  hasPrefix: false,
  isLayerMode: false
};

export function resetAnatomyEmoji(anatomyEmoji: Element): void {
  const el = anatomyEmoji as HTMLElement;
  if (currentAnatomyState.emoji && currentAnatomyState.emoji.trim().length > 0) {
    el.textContent = currentAnatomyState.emoji;
    el.style.display = 'inline-flex';
    el.style.opacity = '1';
  } else {
    el.textContent = '';
    el.style.display = 'none';
  }
  el.classList.remove('preview-mode');
}

// Simple emoji button updater
export function updateEmojiButtons(emojis: string[]): void {
  const container = document.getElementById('color-emoji-buttons');
  if (!container) return;

  const anatomyEmoji = document.querySelector('.anatomy-emoji') as HTMLElement | null;

  container.innerHTML = '';
  emojis.forEach(emoji => {
    const button = document.createElement('button');
    button.className = 'emoji-button';
    button.textContent = emoji;

    button.addEventListener('click', (e: MouseEvent) => {
      const messageType = e.shiftKey ? 'add-emoji-recursive' : 'add-emoji';
      console.log('Emoji clicked:', emoji, messageType);
      sendMessage(messageType, { emoji });
      showCanvasHint();
    });

    // Update anatomy-emoji on hover to show preview
    button.addEventListener('mouseenter', () => {
      // Cancel any pending reset so the preview stays stable between buttons
      if (emojiPreviewResetTimer !== null) {
        clearTimeout(emojiPreviewResetTimer);
        emojiPreviewResetTimer = null;
      }
      if (anatomyEmoji) {
        anatomyEmoji.textContent = emoji;
        anatomyEmoji.style.display = 'inline-flex';
        anatomyEmoji.style.opacity = '1';
        anatomyEmoji.classList.add('preview-mode');
      }
    });

    // Debounce the reset so moving between buttons doesn't cause a flash
    button.addEventListener('mouseleave', () => {
      if (emojiPreviewResetTimer !== null) {
        clearTimeout(emojiPreviewResetTimer);
      }
      emojiPreviewResetTimer = window.setTimeout(() => {
        emojiPreviewResetTimer = null;
        if (anatomyEmoji) {
          resetAnatomyEmoji(anatomyEmoji);
        }
      }, 80);
    });

    container.appendChild(button);
  });

  // Update scroll behavior after content changes
  setTimeout(updateScrollBehavior, 50);
}

// Parse page title to extract emoji, date, and prefix
export function parsePageTitle(name: string): { emoji: string | null; date: string | null; hasPrefix: boolean } {
  if (!name) return { emoji: null, date: null, hasPrefix: false };

  // Check if page has the "↳" prefix
  const hasPrefix = name.includes('↳');

  // Extract date (MM.DD format before colon)
  const colonIndex = name.indexOf(':');
  const beforeColon = colonIndex >= 0 ? name.slice(0, colonIndex) : name;
  const dateMatch = beforeColon.match(/\b(\d{2}\.\d{2})\b/);
  const date = dateMatch ? dateMatch[1] : null;

  // Extract emoji - comprehensive list from all emoji sets
  // Page Colors: circles
  // Layer Colors: squares
  // Tools, Status, and Hands emojis
  const allEmojis = [
    '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫️', '⚪️',  // Page circles
    '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛', '⬜',  // Layer squares
    '🏷️', '📌', '🎯', '💡', '⭐', '🔥', '💎', '🎨',  // Tools
    '🚧', '✅', '👀', '🚀', '🚫', '🪦', '📱',         // Status
    '👆', '👇', '👈', '👉', '☝️', '👍', '👎', '✋'   // Hands
  ];

  let emoji: string | null = null;
  for (const e of allEmojis) {
    // Check both with and without variation selector
    const emojiVariants = [e, e.replace(/\uFE0F/g, ''), e + '\uFE0F'];
    for (const variant of emojiVariants) {
      if (beforeColon.includes(variant)) {
        emoji = e;
        break;
      }
    }
    if (emoji) break;
  }

  return { emoji, date, hasPrefix };
}

// Parse layer name to extract emoji and date
export function parseLayerName(name: string): { emoji: string | null; date: string | null } {
  if (!name) return { emoji: null, date: null };

  // Extract date (MM.DD : format at start or after emoji)
  const dateMatch = name.match(/\b(\d{2}\.\d{2})\s*:/);
  const date = dateMatch ? dateMatch[1] : null;

  // Extract leading emoji - comprehensive list from all emoji sets
  const allEmojis = [
    '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛', '⬜',  // Layer squares
    '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫️', '⚪️',  // Page circles (can be used on layers too)
    '🏷️', '📌', '🎯', '💡', '⭐', '🔥', '💎', '🎨',  // Tools
    '🚧', '✅', '👀', '🚀', '🚫', '🪦', '📱',         // Status
    '👆', '👇', '👈', '👉', '☝️', '👍', '👎', '✋'   // Hands
  ];

  let emoji: string | null = null;
  for (const e of allEmojis) {
    // Check both with and without variation selector
    const emojiVariants = [e, e.replace(/\uFE0F/g, ''), e + '\uFE0F'];
    for (const variant of emojiVariants) {
      if (name.startsWith(variant + ' ') || name.startsWith(variant)) {
        emoji = e;
        break;
      }
    }
    if (emoji) break;
  }

  return { emoji, date };
}

// Get today's date formatted for display (matches sandbox getTodayDateToken)
export function getTodayDate(format: DateFormat = 'numeric'): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const yyyy = String(now.getFullYear());
  if (format === 'alpha') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[now.getMonth()]}.${dd}.${yyyy}`;
  }
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return `${mm}.${dd}.${yyyy}`;
}

// Update anatomy section with current page/layer information
export function updateAnatomySection(isLayerMode: boolean, pageName: string | null, layerName: string | null): void {
  const anatomyEmoji = document.querySelector('.anatomy-emoji') as HTMLElement;
  const anatomyDate = document.querySelector('.anatomy-date') as HTMLElement;
  const anatomyPrefix = document.querySelector('.anatomy-prefix') as HTMLElement;

  if (!anatomyEmoji || !anatomyDate || !anatomyPrefix) return;

  // Parse the appropriate name based on mode
  const parsed = isLayerMode && layerName
    ? parseLayerName(layerName)
    : parsePageTitle(pageName || '');

  // Update state
  currentAnatomyState.emoji = parsed.emoji || '';
  currentAnatomyState.date = parsed.date || getTodayDate();
  currentAnatomyState.hasDate = parsed.date !== null;
  currentAnatomyState.hasPrefix = 'hasPrefix' in parsed ? (parsed as { hasPrefix: boolean }).hasPrefix : false;
  currentAnatomyState.isLayerMode = isLayerMode;

  // Update prefix display - only show in page mode if prefix exists in page title
  if (isLayerMode) {
    // Always hide prefix in layer mode
    anatomyPrefix.style.display = 'none';
  } else if (currentAnatomyState.hasPrefix) {
    // Show prefix if it exists in page title
    anatomyPrefix.style.display = 'inline-flex';
    anatomyPrefix.style.opacity = '0.6';
  } else {
    // Hide prefix until indent/outdent buttons are hovered
    anatomyPrefix.style.display = 'none';
  }

  // Update emoji display - show if emoji exists, hide otherwise
  if (currentAnatomyState.emoji && currentAnatomyState.emoji.trim().length > 0) {
    anatomyEmoji.textContent = currentAnatomyState.emoji;
    anatomyEmoji.style.display = 'inline-flex';
    anatomyEmoji.style.opacity = '1';
  } else {
    anatomyEmoji.textContent = '';
    anatomyEmoji.style.display = 'none';
    anatomyEmoji.style.opacity = '1';
  }

  // Update date display - hide if no date exists
  if (currentAnatomyState.hasDate) {
    // Show existing date with colon
    anatomyDate.textContent = `${currentAnatomyState.date} :`;
    anatomyDate.style.display = 'flex';
    anatomyDate.style.opacity = '0.6';
  } else {
    // Hide date until addDate button is hovered
    anatomyDate.textContent = '';
    anatomyDate.style.display = 'none';
  }
}

// Update visibility and lock button icons based on selection state
export function updateVisibilityLockIcons(
  selectionVisible: boolean | 'mixed' | null,
  selectionLocked: boolean | 'mixed' | null
): void {
  const hideBtn = document.getElementById('nav-hide');
  const lockBtn = document.getElementById('nav-lock');

  if (hideBtn) {
    const iconSpan = hideBtn.querySelector('.nav-icon');
    // Show closed eye if all layers are hidden, open eye otherwise (including mixed state)
    if (selectionVisible === false) {
      if (iconSpan) iconSpan.innerHTML = ICON_EYE_CLOSED;
      hideBtn.setAttribute('aria-label', 'Show layers (Cmd/Ctrl+Shift+H)');
      hideBtn.setAttribute('data-tooltip', 'Show (⌘⇧H)');
    } else {
      if (iconSpan) iconSpan.innerHTML = ICON_EYE_OPEN;
      hideBtn.setAttribute('aria-label', 'Hide layers (Cmd/Ctrl+Shift+H)');
      hideBtn.setAttribute('data-tooltip', 'Hide (⌘⇧H)');
    }
  }

  if (lockBtn) {
    const iconSpan = lockBtn.querySelector('.nav-icon');
    // Show closed lock if all layers are locked, open lock otherwise (including mixed state)
    if (selectionLocked === true) {
      if (iconSpan) iconSpan.innerHTML = ICON_LOCK_CLOSED;
      lockBtn.setAttribute('aria-label', 'Unlock layers (Cmd/Ctrl+Shift+L)');
      lockBtn.setAttribute('data-tooltip', 'Unlock (⌘⇧L)');
    } else {
      if (iconSpan) iconSpan.innerHTML = ICON_LOCK_OPEN;
      lockBtn.setAttribute('aria-label', 'Lock layers (Cmd/Ctrl+Shift+L)');
      lockBtn.setAttribute('data-tooltip', 'Lock (⌘⇧L)');
    }
  }
}

// showCanvasHint is defined in ui.ts shell; forward-declared here for use by updateEmojiButtons
// We avoid circular imports by calling through a registered callback
let _showCanvasHintFn: (() => void) | null = null;
export function registerShowCanvasHint(fn: () => void): void {
  _showCanvasHintFn = fn;
}
function showCanvasHint(): void {
  if (_showCanvasHintFn) _showCanvasHintFn();
}
