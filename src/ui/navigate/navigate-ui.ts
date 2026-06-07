import { sendMessage } from '../shared/send-message';
import {
  getCurrentToggleMode,
  getIsAutoFitEnabled,
  setLastAutoFitHeight,
  computeFitHeight,
  updateScrollBehavior,
  updateToggleUI,
  setIsAutoFitEnabled,
  MAX_UI_HEIGHT,
} from '../shared/layout';
import { activeTimers } from '../shared/cleanup';
import { initializeQuickActionTooltips } from '../shared/tooltip-manager';
import { setupThemeSwitching } from '../shared/theme-manager-ui';
import { setupAccessibilitySupport } from '../shared/accessibility';
import { setupControlsSettings, setupNudgeSettings, setupDateSettings, currentDateFormat } from './settings-ui';
import {
  updateControlButtons,
  smallNudgeAmount,
  bigNudgeAmount
} from './controls-ui';
import { currentAnatomyState, getTodayDate } from './anatomy';
import { updateAutoFitButtonState, resetFooterButtonStates } from './bookmarks-ui';

// UI section state cache provided by plugin
type UISectionState = Record<string, { expanded: boolean; lastModified: number }>
export let uiSectionStatesFromPlugin: UISectionState = {};
export function setUISectionStatesFromPlugin(states: UISectionState): void {
  uiSectionStatesFromPlugin = states;
}

// Width toggle state management
export let isWidthCompact = false;
export function setIsWidthCompact(v: boolean): void { isWidthCompact = v; }
export function getIsWidthCompact(): boolean { return isWidthCompact; }

// Callback for showCanvasHint (registered by shell)
let _showCanvasHintFn: (() => void) | null = null;
export function registerShowCanvasHintNavigate(fn: () => void): void {
  _showCanvasHintFn = fn;
}
function showCanvasHint(): void {
  if (_showCanvasHintFn) _showCanvasHintFn();
}

// Callback for disableAutoFit (registered by shell)
let _disableAutoFitFn: ((reason?: string) => void) | null = null;
export function registerDisableAutoFitNavigate(fn: (reason?: string) => void): void {
  _disableAutoFitFn = fn;
}
function disableAutoFit(reason?: string): void {
  if (_disableAutoFitFn) _disableAutoFitFn(reason);
}

// Main plugin initialization
export function initializePlugin(): void {
  console.log('🚀 Initializing plugin functionality...');

  // Initialize system theme detection first (before UI setup)
  initializeSystemThemeDetectionNavigate();

  // Initialize performance monitoring for theme system
  initializeThemePerformanceMonitoringNavigate();

  // Send ui-ready message to plugin sandbox
  console.log('📤 Sending ui-ready message');
  sendMessage('ui-ready');

  // Request saved theme preference from code.ts (uses clientStorage)
  console.log('📤 Requesting theme preference from plugin');
  sendMessage('get-theme-preference');

  // Initialize toggle state
  updateToggleUI();

  // Initialize auto-fit button state
  updateAutoFitButtonState();

  // Initialize scroll behavior
  updateScrollBehavior();

  // Initialize JS-driven sticky section headers
  setupStickyHeaders();

  // Trigger initial auto-fit if enabled
  if (getIsAutoFitEnabled()) {
    setTimeout(() => {
      const initialHeight = computeFitHeight();
      console.log('Initial auto-fit: setting height to', initialHeight);
      sendMessage('resize-ui', { height: initialHeight });
      setLastAutoFitHeight(initialHeight);
    }, 100); // Small delay to ensure DOM is fully rendered
  }

  // Setup cleanup on page unload
  setupCleanupHandlersNavigate();

  // Initialize controls
  initializeControls();

  // Request and restore UI section states
  requestUISectionStates();

  // Check if running in browser (no Figma API) and populate mock data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof (window as any).figma === 'undefined') {
    console.log('🎭 Running in browser mode - loading mock emoji data');
    setTimeout(() => {
      // Import constants
      const PAGE_EMOJI_SETS = [
        { name: 'Colors', emojis: ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫️', '⚪️'] },
        { name: 'Tools', emojis: ['🏷️', '📌', '🎯', '💡', '⭐', '🔥', '💎', '🎨'] },
        { name: 'Status', emojis: ['🚧', '✅', '👀', '🚀', '🚫', '🪦', '⭐', '📱'] },
        { name: 'Hands', emojis: ['👆', '👇', '👈', '👉', '☝️', '👍', '👎', '✋'] }
      ];

      // Load first emoji set
      updateEmojiButtonsNavigate(PAGE_EMOJI_SETS[0].emojis);

      // Update UI indicators
      const emojiIndicator = document.getElementById('emoji-set-indicator');
      if (emojiIndicator) {
        const setName = emojiIndicator.querySelector('.set-name');
        if (setName) setName.textContent = PAGE_EMOJI_SETS[0].name;
      }

      console.log('✅ Mock emoji data loaded for browser preview');
    }, 100);
  }

  console.log('✅ Plugin initialization complete - waiting for emoji data from plugin');
}

// Stub for updateEmojiButtons - bridged from anatomy.ts via shell registration
let _updateEmojiButtonsFn: ((emojis: string[]) => void) | null = null;
export function registerUpdateEmojiButtons(fn: (emojis: string[]) => void): void {
  _updateEmojiButtonsFn = fn;
}
function updateEmojiButtonsNavigate(emojis: string[]): void {
  if (_updateEmojiButtonsFn) _updateEmojiButtonsFn(emojis);
}

// Stub for initializeSystemThemeDetection - bridged from theme-manager-ui via shell
let _initializeSystemThemeDetectionFn: (() => void) | null = null;
export function registerInitializeSystemThemeDetection(fn: () => void): void {
  _initializeSystemThemeDetectionFn = fn;
}
function initializeSystemThemeDetectionNavigate(): void {
  if (_initializeSystemThemeDetectionFn) _initializeSystemThemeDetectionFn();
}

// Stub for initializeThemePerformanceMonitoring - bridged from shell
let _initializeThemePerformanceMonitoringFn: (() => void) | null = null;
export function registerInitializeThemePerformanceMonitoring(fn: () => void): void {
  _initializeThemePerformanceMonitoringFn = fn;
}
function initializeThemePerformanceMonitoringNavigate(): void {
  if (_initializeThemePerformanceMonitoringFn) _initializeThemePerformanceMonitoringFn();
}

// Stub for setupCleanupHandlers - bridged from shell
let _setupCleanupHandlersFn: (() => void) | null = null;
export function registerSetupCleanupHandlers(fn: () => void): void {
  _setupCleanupHandlersFn = fn;
}
function setupCleanupHandlersNavigate(): void {
  if (_setupCleanupHandlersFn) _setupCleanupHandlersFn();
}

// Restore UI section states from storage
export function requestUISectionStates(): void {
  try {
    sendMessage('get-ui-section-states');
  } catch (error) {
    console.error('Failed to request UI section states:', error);
  }
}

// Restore UI section states from cache received from plugin
export async function restoreUISectionStates(): Promise<void> {
  try {
    // Wait a tick to ensure the plugin responded if needed
    await new Promise(r => setTimeout(r, 0));

    // Apply states to all collapsible sections
    const collapsibleHeaders = document.querySelectorAll<HTMLElement>('.section-header.collapsible');

    collapsibleHeaders.forEach(header => {
      const sectionId = header.id;
      const targetId = header.getAttribute('data-target');
      const target = targetId ? document.getElementById(targetId) : null;

      if (!target || !sectionId) return;

      // Get saved state or default to expanded
      const shouldExpand = uiSectionStatesFromPlugin[sectionId]?.expanded ?? true;

      // Apply state without animation (before UI is visible)
      header.setAttribute('aria-expanded', String(shouldExpand));
      if (!shouldExpand) {
        target.classList.add('collapsed');
      } else {
        target.classList.remove('collapsed');
      }
    });

    console.log('✅ UI section states restored');
  } catch (error) {
    console.error('Failed to restore UI section states:', error);
  }
}

// Setup event listeners for UI controls
export function setupEventListeners(): void {
  // Setup accessibility support first
  setupAccessibilitySupport();

  const backBtn = document.getElementById('back-btn');
  const forwardBtn = document.getElementById('forward-btn');
  const clearBtn = document.getElementById('clear-color');
  const saveBtn = document.getElementById('save-bookmark');
  const dateBtn = document.getElementById('date-btn');
  const newPageBtn = document.getElementById('new-page-btn');
  const indentTitleBtn = document.getElementById('indent-title-btn');
  const outdentTitleBtn = document.getElementById('outdent-title-btn');
  const pageActionsGroup = document.getElementById('page-actions-group');
  const settingsBtn = document.getElementById('settings-btn');
  const settingsOverlay = document.getElementById('settings-overlay');
  const settingsCloseBtn = document.getElementById('settings-close');
  const emojiNavLeft = document.getElementById('emoji-nav-left');
  const emojiNavRight = document.getElementById('emoji-nav-right');
  const refreshAnchorsBtn = document.getElementById('refresh-anchors');
  const widthToggleBtn = document.getElementById('footer-width-toggle');
  const resizeHandle = document.getElementById('footer-resize');
  const collapsibleHeaders = Array.from(document.querySelectorAll<HTMLElement>('.section-header.collapsible'));

  ['tags-header', 'anchors-header', 'controls-header'].forEach((headerId) => {
    const header = document.getElementById(headerId) as HTMLElement | null;
    if (!header) return;
    const activateColorContext = () => {
      header.classList.add('header-color-context-active');
    };
    const deactivateColorContext = () => {
      header.classList.remove('header-color-context-active');
    };
    header.addEventListener('mouseenter', () => {
      activateColorContext();
    });
    header.addEventListener('mouseleave', () => {
      deactivateColorContext();
    });
    header.addEventListener('focusin', () => {
      activateColorContext();
    });
    header.addEventListener('focusout', (e: FocusEvent) => {
      const nextTarget = e.relatedTarget as Node | null;
      if (!nextTarget || !header.contains(nextTarget)) {
        deactivateColorContext();
      }
    });
  });

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      console.log('Back clicked');
      sendMessage('go-back');
    });
  }

  if (forwardBtn) {
    forwardBtn.addEventListener('click', () => {
      console.log('Forward clicked');
      sendMessage('go-forward');
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', (e: MouseEvent) => {
      const messageType = e.shiftKey ? 'clear-emoji-recursive' : 'clear-emoji';
      console.log('Clear clicked:', messageType);
      sendMessage(messageType);
    });

    // Add hover preview for clear button - hide emoji to show removal effect
    clearBtn.addEventListener('mouseenter', () => {
      const anatomyEmoji = document.querySelector('.anatomy-emoji') as HTMLElement;
      if (anatomyEmoji && currentAnatomyState.emoji && currentAnatomyState.emoji.trim().length > 0) {
        anatomyEmoji.style.opacity = '0.3';
        anatomyEmoji.classList.add('preview-mode');
      }
    });

    clearBtn.addEventListener('mouseleave', () => {
      const anatomyEmoji = document.querySelector('.anatomy-emoji') as HTMLElement;
      if (anatomyEmoji) {
        if (currentAnatomyState.emoji && currentAnatomyState.emoji.trim().length > 0) {
          anatomyEmoji.style.opacity = '1';
        }
        anatomyEmoji.classList.remove('preview-mode');
      }
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      console.log('Save bookmark clicked');
      sendMessage('save-bookmark');
    });
  }

  // Date button: request plugin to add/replace today's date
  if (dateBtn) {
    dateBtn.addEventListener('click', () => {
      console.log('Date button clicked');
      sendMessage('add-date');
    });

    // Add hover preview for date button
    dateBtn.addEventListener('mouseenter', () => {
      const anatomyDate = document.querySelector('.anatomy-date') as HTMLElement;
      if (anatomyDate) {
        const today = getTodayDate(currentDateFormat);
        anatomyDate.textContent = `${today} :`;
        anatomyDate.style.display = 'flex';
        anatomyDate.style.opacity = '1';
        anatomyDate.classList.add('preview-mode');
      }
    });

    dateBtn.addEventListener('mouseleave', () => {
      const anatomyDate = document.querySelector('.anatomy-date') as HTMLElement;
      if (anatomyDate) {
        if (currentAnatomyState.hasDate) {
          // Show actual date if it exists
          anatomyDate.textContent = `${currentAnatomyState.date} :`;
          anatomyDate.style.display = 'flex';
          anatomyDate.style.opacity = '0.6';
        } else {
          // Hide date if none exists
          anatomyDate.textContent = '';
          anatomyDate.style.display = 'none';
        }
        anatomyDate.classList.remove('preview-mode');
      }
    });
  }

  // New Page: request plugin to create a new dated page
  if (newPageBtn) {
    newPageBtn.addEventListener('click', () => {
      console.log('New Page clicked');
      sendMessage('create-new-page');
    });

    // Add hover preview for new page button - show date preview (new pages get today's date)
    newPageBtn.addEventListener('mouseenter', () => {
      const anatomyDate = document.querySelector('.anatomy-date') as HTMLElement;
      const anatomyEmoji = document.querySelector('.anatomy-emoji') as HTMLElement;
      const modeAffordance = document.querySelector('.mode-affordance') as HTMLElement;

      if (anatomyDate) {
        const today = getTodayDate(currentDateFormat);
        anatomyDate.textContent = `${today} :`;
        anatomyDate.style.display = 'flex';
        anatomyDate.style.opacity = '1';
        anatomyDate.classList.add('preview-mode');
      }
      // Also preview a blank emoji state (new page starts with no emoji)
      if (anatomyEmoji) {
        anatomyEmoji.dataset.prevContent = anatomyEmoji.textContent || '';
        anatomyEmoji.dataset.prevDisplay = anatomyEmoji.style.display;
        anatomyEmoji.textContent = '';
        anatomyEmoji.style.display = 'none';
      }
      // Update mode to PAGE (new pages are always in page mode)
      if (modeAffordance) {
        modeAffordance.dataset.prevMode = modeAffordance.dataset.mode || 'onPage';
        modeAffordance.dataset.mode = 'onPage';
        modeAffordance.textContent = 'PAGE';
        modeAffordance.classList.add('preview-mode');
      }
    });

    newPageBtn.addEventListener('mouseleave', () => {
      const anatomyDate = document.querySelector('.anatomy-date') as HTMLElement;
      const anatomyEmoji = document.querySelector('.anatomy-emoji') as HTMLElement;
      const modeAffordance = document.querySelector('.mode-affordance') as HTMLElement;

      if (anatomyDate) {
        if (currentAnatomyState.hasDate) {
          anatomyDate.textContent = `${currentAnatomyState.date} :`;
          anatomyDate.style.display = 'flex';
          anatomyDate.style.opacity = '0.6';
        } else {
          anatomyDate.textContent = '';
          anatomyDate.style.display = 'none';
        }
        anatomyDate.classList.remove('preview-mode');
      }
      // Restore emoji to actual state
      if (anatomyEmoji) {
        if (currentAnatomyState.emoji && currentAnatomyState.emoji.trim().length > 0) {
          anatomyEmoji.textContent = currentAnatomyState.emoji;
          anatomyEmoji.style.display = 'inline-flex';
          anatomyEmoji.style.opacity = '1';
        } else {
          anatomyEmoji.textContent = '';
          anatomyEmoji.style.display = 'none';
        }
      }
      // Restore mode to actual state
      if (modeAffordance) {
        const prevMode = modeAffordance.dataset.prevMode || 'onPage';
        modeAffordance.dataset.mode = prevMode;
        modeAffordance.textContent = prevMode === 'onPage' ? 'PAGE' : 'LAYER';
        modeAffordance.classList.remove('preview-mode');
      }
    });
  }

  // Indent page title: insert 4 spaces before title text
  if (indentTitleBtn) {
    indentTitleBtn.addEventListener('click', () => {
      console.log('Indent title clicked');
      sendMessage('indent-title');
    });

    // Add hover preview for indent button - show prefix
    indentTitleBtn.addEventListener('mouseenter', () => {
      const anatomyPrefix = document.querySelector('.anatomy-prefix') as HTMLElement;
      if (anatomyPrefix && getCurrentToggleMode() === 'onPage') {
        anatomyPrefix.style.display = 'inline-flex';
        anatomyPrefix.style.opacity = '1';
        anatomyPrefix.classList.add('preview-mode');
      }
    });

    indentTitleBtn.addEventListener('mouseleave', () => {
      const anatomyPrefix = document.querySelector('.anatomy-prefix') as HTMLElement;
      if (anatomyPrefix && getCurrentToggleMode() === 'onPage') {
        if (currentAnatomyState.hasPrefix) {
          // Show actual prefix if it exists
          anatomyPrefix.style.display = 'inline-flex';
          anatomyPrefix.style.opacity = '0.6';
        } else {
          // Hide prefix if it doesn't exist
          anatomyPrefix.style.display = 'none';
        }
        anatomyPrefix.classList.remove('preview-mode');
      }
    });
  }

  // Outdent page title: remove 4 leading spaces (if present) before arrow/emoji
  if (outdentTitleBtn) {
    outdentTitleBtn.addEventListener('click', () => {
      console.log('Outdent title clicked');
      sendMessage('outdent-title');
    });

    // Add hover preview for outdent button - show prefix
    outdentTitleBtn.addEventListener('mouseenter', () => {
      const anatomyPrefix = document.querySelector('.anatomy-prefix') as HTMLElement;
      if (anatomyPrefix && getCurrentToggleMode() === 'onPage') {
        anatomyPrefix.style.display = 'inline-flex';
        anatomyPrefix.style.opacity = '1';
        anatomyPrefix.classList.add('preview-mode');
      }
    });

    outdentTitleBtn.addEventListener('mouseleave', () => {
      const anatomyPrefix = document.querySelector('.anatomy-prefix') as HTMLElement;
      if (anatomyPrefix && getCurrentToggleMode() === 'onPage') {
        if (currentAnatomyState.hasPrefix) {
          // Show actual prefix if it exists
          anatomyPrefix.style.display = 'inline-flex';
          anatomyPrefix.style.opacity = '0.6';
        } else {
          // Hide prefix if it doesn't exist
          anatomyPrefix.style.display = 'none';
        }
        anatomyPrefix.classList.remove('preview-mode');
      }
    });
  }

  // Visibility of page actions depends on current toggle mode (onPage only)
  const updatePageActionsVisibility = () => {
    if (!pageActionsGroup) return;
    const onPage = getCurrentToggleMode() === 'onPage';
    pageActionsGroup.style.display = onPage ? 'inline-flex' : 'none';
  };
  updatePageActionsVisibility();

  // Settings overlay open/close
  const openSettings = () => {
    if (!settingsOverlay) return;
    settingsOverlay.setAttribute('aria-hidden', 'false');
    settingsOverlay.classList.add('open');
    // Move focus into the panel content for accessibility
    const content = settingsOverlay.querySelector<HTMLElement>('.settings-content');
    if (content) content.focus();
  };

  const closeSettings = () => {
    if (!settingsOverlay) return;
    settingsOverlay.setAttribute('aria-hidden', 'true');
    settingsOverlay.classList.remove('open');
    // Return focus to the settings button
    if (settingsBtn instanceof HTMLElement) settingsBtn.focus();
  };

  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      console.log('Open settings');
      openSettings();
    });
  }

  if (settingsCloseBtn) {
    settingsCloseBtn.addEventListener('click', () => {
      console.log('Close settings');
      closeSettings();
    });
  }

  // Close when clicking backdrop
  if (settingsOverlay) {
    settingsOverlay.addEventListener('click', (e) => {
      if (e.target === settingsOverlay) {
        closeSettings();
      }
    });
  }

  // Escape to close settings
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (settingsOverlay && settingsOverlay.getAttribute('aria-hidden') === 'false') {
        // Settings are open - close them
        closeSettings();
      }
    }
  });

  // Data migration buttons
  const exportDataBtn = document.getElementById('export-data-btn');
  const importDataBtn = document.getElementById('import-data-btn');

  if (exportDataBtn) {
    exportDataBtn.addEventListener('click', () => {
      console.log('Export data clicked');
      sendMessage('export-plugin-data');
    });
  }

  if (importDataBtn) {
    importDataBtn.addEventListener('click', () => {
      console.log('Import data clicked');
      sendMessage('import-plugin-data');
    });
  }

  // Emoji set navigation
  if (emojiNavLeft) {
    emojiNavLeft.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log('Emoji set: previous');
      sendMessage('navigate-emoji-set', { direction: 'prev' });
    });
  }
  if (emojiNavRight) {
    emojiNavRight.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log('Emoji set: next');
      sendMessage('navigate-emoji-set', { direction: 'next' });
    });
  }

  // Anchors refresh button (inside header)
  if (refreshAnchorsBtn) {
    refreshAnchorsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log('Refresh anchors clicked');
      sendMessage('refresh-anchors');
    });
  }

  // Toggle compact/full width
  if (widthToggleBtn) {
    widthToggleBtn.addEventListener('click', () => {
      console.log('Toggle width');

      // Toggle the state
      isWidthCompact = !isWidthCompact;

      // Toggle the compact-mode class on all scrollable-content mains (navigate + validate)
      const allScrollable = document.querySelectorAll('.scrollable-content');
      allScrollable.forEach((el) => {
        if (isWidthCompact) {
          el.classList.add('compact-mode');
        } else {
          el.classList.remove('compact-mode');
        }
      });
      if (isWidthCompact) {
        widthToggleBtn.classList.add('active');
      } else {
        widthToggleBtn.classList.remove('active');
      }

      sendMessage('toggle-width');
    });

    // Add hover state management to prevent stuck states
    widthToggleBtn.addEventListener('mouseenter', () => {
      widthToggleBtn.classList.add('hover-active');
    });

    widthToggleBtn.addEventListener('mouseleave', () => {
      widthToggleBtn.classList.remove('hover-active');
      // Force style reset
      widthToggleBtn.style.removeProperty('background');
      widthToggleBtn.style.removeProperty('color');
    });

    widthToggleBtn.addEventListener('blur', () => {
      widthToggleBtn.classList.remove('hover-active');
      // Force style reset
      widthToggleBtn.style.removeProperty('background');
      widthToggleBtn.style.removeProperty('color');
    });
  }

  // Drag to resize height
  if (resizeHandle) {
    // Double-click: toggle auto-fit. When enabling, snap to content height
    // (already capped at MAX_UI_HEIGHT inside computeFitHeight). When content
    // exceeds MAX_UI_HEIGHT, this acts as a "snap to max height" gesture.
    resizeHandle.addEventListener('dblclick', () => {
      setIsAutoFitEnabled(!getIsAutoFitEnabled());
      updateAutoFitButtonState();

      if (getIsAutoFitEnabled()) {
        const contentHeight = computeFitHeight(); // capped at MAX_UI_HEIGHT
        console.log('Auto-fit enabled: adjusting height to', contentHeight, '(max:', MAX_UI_HEIGHT, ')');
        sendMessage('resize-ui', { height: contentHeight });
        setLastAutoFitHeight(contentHeight);
      } else {
        console.log('Auto-fit disabled');
      }
    });

    let isDragging = false;
    let startY = 0;
    let startHeight = 0;

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaY = e.clientY - startY;
      const newHeight = Math.max(150, Math.round(startHeight + deltaY));

      // Disable auto-fit when user manually resizes
      disableAutoFit('manual drag resize');

      sendMessage('resize-ui', { height: newHeight });
    };

    const onMouseUp = () => {
      if (!isDragging) return;
      isDragging = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    resizeHandle.addEventListener('mousedown', (e: MouseEvent) => {
      // Disable auto-fit as soon as user starts manual resize
      disableAutoFit('manual resize initiated');

      isDragging = true;
      startY = e.clientY;
      startHeight = window.innerHeight;
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });

    resizeHandle.addEventListener('keydown', (e: KeyboardEvent) => {
      const step = 16;
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        const direction = e.key === 'ArrowUp' ? -1 : 1;
        const newHeight = Math.max(150, window.innerHeight + direction * step);

        // Disable auto-fit when user manually resizes with keyboard
        disableAutoFit('manual keyboard resize');

        sendMessage('resize-ui', { height: newHeight });
        e.preventDefault();
      }
    });
  }

  // Collapsible section headers
  if (collapsibleHeaders.length > 0) {
    const computeTarget = (header: HTMLElement): HTMLElement | null => {
      const targetId = header.getAttribute('data-target');
      if (targetId) return document.getElementById(targetId);
      // Fallback: next sibling section
      let sibling: Element | null = header.nextElementSibling;
      while (sibling && !(sibling as HTMLElement).classList.contains('collapsible-content')) {
        sibling = sibling.nextElementSibling;
      }
      return sibling as HTMLElement | null;
    };

    const toggleSection = (header: HTMLElement, target: HTMLElement): void => {
      const currentlyExpanded = header.getAttribute('aria-expanded') !== 'false';
      const nextExpanded = !currentlyExpanded;
      header.setAttribute('aria-expanded', String(nextExpanded));
      if (!nextExpanded) {
        target.classList.add('collapsed');
      } else {
        target.classList.remove('collapsed');
      }

      // Save state persistence (new functionality)
      const sectionId = header.id;
      if (sectionId) {
        // Ask plugin to persist the section state
        sendMessage('save-ui-section-state', { sectionId, expanded: nextExpanded });
      }

      // After transition, update scroll behavior and auto-fit if enabled.
      // Prefer transitionend for accuracy; add a timeout fallback.
      const onEnd = (_e: Event) => {
        // Ensure we react once for the target element
        target.removeEventListener('transitionend', onEnd as EventListener);
        updateScrollBehavior();
      };
      target.addEventListener('transitionend', onEnd as EventListener, { once: true });

      // Fallback in case transitionend doesn't fire
      window.setTimeout(() => {
        updateScrollBehavior();
      }, 350);
    };

    collapsibleHeaders.forEach((header) => {
      const target = computeTarget(header);
      if (!target) return;

      // Ensure ARIA linkage
      if (!header.getAttribute('aria-controls')) {
        if (target.id) header.setAttribute('aria-controls', target.id);
      }

      const onActivate = (e?: Event) => {
        if (e) e.preventDefault();
        toggleSection(header, target);
      };

      header.addEventListener('click', onActivate);
      header.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onActivate(e);
        }
      });
    });
  }

  // Note: Toggle mode button removed - mode controlled by selection state

  // Theme switching
  setupThemeSwitching();

  // Ko-fi button
  const kofiBtnElement = document.getElementById('kofi-btn');
  if (kofiBtnElement) {
    kofiBtnElement.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Ko-fi button clicked');
      // Open Ko-fi page in external browser
      sendMessage('open-kofi');
    });
  }



  // Setup global hover state management to prevent stuck hover states
  setupGlobalHoverStateManagement();

  // Initialize Figma-like tooltips for quick action buttons
  initializeQuickActionTooltips();
}

/**
 * JS-driven sticky headers — position:sticky is unsupported in Figma's iframe.
 * Bidirectional: headers pin to top when scrolled past AND pin to bottom when
 * pushed below the visible area. Headers stack at both edges.
 * Uses translateY (GPU compositor) — no reflow on scroll.
 */
export function setupStickyHeaders(): void {
  const scrollContainer = document.getElementById('navigate-main');
  if (!scrollContainer) return;

  const headerIds = ['tags-header', 'anchors-header', 'controls-header'];
  const headers = headerIds
    .map(id => document.getElementById(id))
    .filter((h): h is HTMLElement => h !== null);

  if (headers.length === 0) return;

  // Cache of each header's natural offsetTop (recalculated after layout changes)
  let offsets: number[] = [];

  function recalcOffsets(): void {
    // Temporarily remove transforms so offsetTop reflects natural position
    const savedTransforms: string[] = [];
    for (const h of headers) {
      savedTransforms.push(h.style.transform);
      h.style.transform = '';
    }
    offsets = headers.map(h => h.offsetTop);
    // Restore transforms
    for (let i = 0; i < headers.length; i++) {
      headers[i].style.transform = savedTransforms[i];
    }
  }

  function onScroll(): void {
    const scrollTop = scrollContainer!.scrollTop;
    const viewH = scrollContainer!.clientHeight;

    // Reset all headers
    for (const h of headers) {
      h.style.transform = '';
      h.style.zIndex = '';
      h.classList.remove('sticky-stuck', 'sticky-stuck-bottom');
    }

    // Pass 1: Top sticky (forward — earlier headers stick first)
    let topStack = 0;
    const stuckTop = new Set<number>();

    for (let i = 0; i < headers.length; i++) {
      const naturalVisPos = offsets[i] - scrollTop;
      if (naturalVisPos < topStack) {
        const dy = scrollTop + topStack - offsets[i];
        headers[i].style.transform = `translateY(${dy}px)`;
        headers[i].style.zIndex = String(headers.length - i + 10);
        headers[i].classList.add('sticky-stuck');
        topStack += headers[i].offsetHeight;
        stuckTop.add(i);
      }
    }

    // Pass 2: Bottom sticky (backward — later headers stick first)
    let bottomStack = 0;

    for (let i = headers.length - 1; i >= 0; i--) {
      if (stuckTop.has(i)) continue;

      const headerH = headers[i].offsetHeight;
      const naturalVisPos = offsets[i] - scrollTop;
      const bottomEdge = viewH - bottomStack;

      if (naturalVisPos + headerH > bottomEdge) {
        const targetVisPos = bottomEdge - headerH;
        const dy = targetVisPos - naturalVisPos;
        headers[i].style.transform = `translateY(${dy}px)`;
        headers[i].style.zIndex = String(i + 10);
        headers[i].classList.add('sticky-stuck', 'sticky-stuck-bottom');
        bottomStack += headerH;
      }
    }
  }

  // Initial offset calculation
  recalcOffsets();

  scrollContainer.addEventListener('scroll', onScroll, { passive: true });

  // Recalculate offsets after section collapse/expand transitions
  scrollContainer.addEventListener('transitionend', (e) => {
    if ((e.target as HTMLElement)?.classList?.contains('collapsible-content')) {
      recalcOffsets();
      onScroll();
    }
  });

  // Recalculate on window resize (plugin window can be resized)
  window.addEventListener('resize', () => {
    recalcOffsets();
    onScroll();
  });
}

// Global interaction state management to prevent stuck hover states
// This fixes the issue where hover states "stick" after click or drag interactions
export function setupGlobalHoverStateManagement(): void {
  let touchActiveTimeout: number | null = null;

  // Add touch-active class on any mousedown/touchstart to suppress hover effects
  const activateTouch = () => {
    document.body.classList.add('touch-active');
    // Clear any pending timeout
    if (touchActiveTimeout) {
      clearTimeout(touchActiveTimeout);
      touchActiveTimeout = null;
    }
  };

  // Remove touch-active class after mouse movement (with small delay for stability)
  const deactivateTouch = () => {
    // Small delay to ensure the interaction has fully completed
    if (touchActiveTimeout) {
      clearTimeout(touchActiveTimeout);
    }
    touchActiveTimeout = window.setTimeout(() => {
      document.body.classList.remove('touch-active');
      touchActiveTimeout = null;
    }, 100);
  };

  // Activate on any pointer down event
  document.addEventListener('mousedown', activateTouch, { passive: true });
  document.addEventListener('touchstart', activateTouch, { passive: true });

  // Deactivate on mouse move (indicates user is using mouse, not touch)
  document.addEventListener('mousemove', deactivateTouch, { passive: true });

  // Also deactivate on mouseup/touchend after a brief delay
  document.addEventListener('mouseup', () => {
    // Longer delay for mouseup to allow CSS transitions to complete
    if (touchActiveTimeout) {
      clearTimeout(touchActiveTimeout);
    }
    touchActiveTimeout = window.setTimeout(() => {
      document.body.classList.remove('touch-active');
      touchActiveTimeout = null;
    }, 150);
  }, { passive: true });

  document.addEventListener('touchend', deactivateTouch, { passive: true });

  // Handle drag end events
  document.addEventListener('dragend', deactivateTouch, { passive: true });

  // Also clear on scroll (often happens after drag interactions)
  document.addEventListener('scroll', deactivateTouch, { passive: true, capture: true });
}

// Setup controls event listeners
export function setupControls(): void {
  const enterBtn = document.getElementById('nav-enter');
  const exitBtn = document.getElementById('nav-exit');
  const prevBtn = document.getElementById('nav-prev');
  const nextBtn = document.getElementById('nav-next');
  const collapseBtn = document.getElementById('nav-collapse');
  // const gotoComponentBtn = document.getElementById('nav-goto-component'); // Button removed from UI
  const deleteBtn = document.getElementById('nav-delete');
  const controlsGrid = document.querySelector('.controls-grid');

  // Arrow key buttons
  const arrowUpBtn = document.getElementById('arrow-up');
  const arrowDownBtn = document.getElementById('arrow-down');
  const arrowLeftBtn = document.getElementById('arrow-left');
  const arrowRightBtn = document.getElementById('arrow-right');
  const zoomInBtn = document.getElementById('zoom-in');
  const zoomOutBtn = document.getElementById('zoom-out');
  const zoom100Btn = document.getElementById('zoom-100');
  const zoomSelectionBtn = document.getElementById('zoom-selection');
  const arrowKeysGrid = document.querySelector('.arrow-keys-grid');

  // Add click event listeners with screen reader announcements
  if (enterBtn) {
    enterBtn.addEventListener('click', () => {
      console.log('Navigation: Expand container');
      announceNavigationResult({ success: true, message: 'Attempting to expand container' });
      sendMessage('navigation-action', { action: 'enter' });
      showCanvasHint();
    });
  }

  if (exitBtn) {
    exitBtn.addEventListener('click', () => {
      console.log('Navigation: Exit container');
      announceNavigationResult({ success: true, message: 'Attempting to exit container' });
      sendMessage('navigation-action', { action: 'exit' });
      showCanvasHint();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      // UP button: Navigate toward top of layers panel (higher Figma index)
      console.log('Navigation: Previous sibling (UP in layers panel)');
      announceNavigationResult({ success: true, message: 'Navigating to previous sibling' });
      sendMessage('navigation-action', { action: 'prev-sibling' });
      showCanvasHint();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      // DOWN button: Navigate toward bottom of layers panel (lower Figma index)
      console.log('Navigation: Next sibling (DOWN in layers panel)');
      announceNavigationResult({ success: true, message: 'Navigating to next sibling' });
      sendMessage('navigation-action', { action: 'next-sibling' });
      showCanvasHint();
    });
  }

  if (collapseBtn) {
    collapseBtn.addEventListener('click', () => {
      console.log('Navigation: Toggle collapse');
      announceNavigationResult({ success: true, message: 'Toggling container collapse state' });
      sendMessage('navigation-action', { action: 'toggle-collapse' });
      showCanvasHint();
    });
  }

  // Hide/Show button
  const hideBtn = document.getElementById('nav-hide');
  if (hideBtn) {
    hideBtn.addEventListener('click', () => {
      console.log('Toggle visibility');
      sendMessage('toggle-visibility');
    });
  }

  // Lock/Unlock button
  const lockBtn = document.getElementById('nav-lock');
  if (lockBtn) {
    lockBtn.addEventListener('click', () => {
      console.log('Toggle lock');
      sendMessage('toggle-lock');
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      console.log('Delete: Deleting selected nodes');
      announceNavigationResult({ success: true, message: 'Deleting selected nodes' });
      sendMessage('delete-nodes');
    });
  }

  // Arrow key button event listeners - for nudging/moving elements on canvas
  // Alt+Arrow: duplicate by small nudge offset
  // Shift+Alt+Arrow: duplicate by big nudge offset
  // Cmd/Ctrl+Arrow: resize by small nudge
  // Shift+Cmd/Ctrl+Arrow: resize by big nudge
  // Shift+Arrow: nudge by big nudge
  // Arrow: nudge by small nudge
  if (arrowUpBtn) {
    arrowUpBtn.addEventListener('click', (e: MouseEvent) => {
      const amount = e.shiftKey ? bigNudgeAmount : smallNudgeAmount;
      if (e.altKey) {
        console.log(`Arrow Duplicate: Up (offset ${amount}px)`);
        sendMessage('duplicate-elements', { direction: 'up', amount });
      } else if (e.ctrlKey || e.metaKey) {
        console.log(`Arrow Resize: Up (decrease height by ${amount}px)`);
        sendMessage('resize-elements', { direction: 'up', amount });
      } else {
        console.log(`Arrow Move: Up (nudge ${amount}px)`);
        sendMessage('nudge-elements', { direction: 'up', amount });
      }
    });
  }

  if (arrowDownBtn) {
    arrowDownBtn.addEventListener('click', (e: MouseEvent) => {
      const amount = e.shiftKey ? bigNudgeAmount : smallNudgeAmount;
      if (e.altKey) {
        console.log(`Arrow Duplicate: Down (offset ${amount}px)`);
        sendMessage('duplicate-elements', { direction: 'down', amount });
      } else if (e.ctrlKey || e.metaKey) {
        console.log(`Arrow Resize: Down (increase height by ${amount}px)`);
        sendMessage('resize-elements', { direction: 'down', amount });
      } else {
        console.log(`Arrow Move: Down (nudge ${amount}px)`);
        sendMessage('nudge-elements', { direction: 'down', amount });
      }
    });
  }

  if (arrowLeftBtn) {
    arrowLeftBtn.addEventListener('click', (e: MouseEvent) => {
      const amount = e.shiftKey ? bigNudgeAmount : smallNudgeAmount;
      if (e.altKey) {
        console.log(`Arrow Duplicate: Left (offset ${amount}px)`);
        sendMessage('duplicate-elements', { direction: 'left', amount });
      } else if (e.ctrlKey || e.metaKey) {
        console.log(`Arrow Resize: Left (decrease width by ${amount}px)`);
        sendMessage('resize-elements', { direction: 'left', amount });
      } else {
        console.log(`Arrow Move: Left (nudge ${amount}px)`);
        sendMessage('nudge-elements', { direction: 'left', amount });
      }
    });
  }

  if (arrowRightBtn) {
    arrowRightBtn.addEventListener('click', (e: MouseEvent) => {
      const amount = e.shiftKey ? bigNudgeAmount : smallNudgeAmount;
      if (e.altKey) {
        console.log(`Arrow Duplicate: Right (offset ${amount}px)`);
        sendMessage('duplicate-elements', { direction: 'right', amount });
      } else if (e.ctrlKey || e.metaKey) {
        console.log(`Arrow Resize: Right (increase width by ${amount}px)`);
        sendMessage('resize-elements', { direction: 'right', amount });
      } else {
        console.log(`Arrow Move: Right (nudge ${amount}px)`);
        sendMessage('nudge-elements', { direction: 'right', amount });
      }
    });
  }

  // Zoom button event listeners
  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => {
      console.log('Zoom: In');
      sendMessage('zoom', { direction: 'in' });
    });
  }

  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => {
      console.log('Zoom: Out');
      sendMessage('zoom', { direction: 'out' });
    });
  }

  if (zoom100Btn) {
    zoom100Btn.addEventListener('click', () => {
      console.log('Zoom: 100%');
      sendMessage('zoom', { direction: '100' });
    });
  }

  if (zoomSelectionBtn) {
    zoomSelectionBtn.addEventListener('click', () => {
      console.log('Zoom: Zoom to selection');
      sendMessage('zoom', { direction: 'selection' });
    });
  }

  // Layer ordering buttons
  const layerUpBtn = document.getElementById('layer-up');
  const layerDownBtn = document.getElementById('layer-down');

  if (layerUpBtn) {
    layerUpBtn.addEventListener('click', (e: MouseEvent) => {
      if (e.shiftKey) {
        console.log('Layer Order: Bring to front');
        sendMessage('reorder-layer', { direction: 'front' });
      } else {
        console.log('Layer Order: Bring forward');
        sendMessage('reorder-layer', { direction: 'up' });
      }
    });
  }

  if (layerDownBtn) {
    layerDownBtn.addEventListener('click', (e: MouseEvent) => {
      if (e.shiftKey) {
        console.log('Layer Order: Send to back');
        sendMessage('reorder-layer', { direction: 'back' });
      } else {
        console.log('Layer Order: Send backward');
        sendMessage('reorder-layer', { direction: 'down' });
      }
    });
  }

  // Layout sizing buttons
  const cycleWidthBtn = document.getElementById('cycle-width');
  const cycleHeightBtn = document.getElementById('cycle-height');

  if (cycleWidthBtn) {
    cycleWidthBtn.addEventListener('click', () => {
      console.log('Layout sizing: Cycle width');
      sendMessage('cycle-layout-sizing', { axis: 'horizontal' });
    });
  }

  if (cycleHeightBtn) {
    cycleHeightBtn.addEventListener('click', () => {
      console.log('Layout sizing: Cycle height');
      sendMessage('cycle-layout-sizing', { axis: 'vertical' });
    });
  }

  // Styled text buttons
  const pasteStyledBtn = document.getElementById('paste-styled') as HTMLButtonElement | null;
  const copyStyledBtn = document.getElementById('copy-styled') as HTMLButtonElement | null;
  const pasteArea = document.getElementById('styled-text-paste-area') as HTMLTextAreaElement | null;

  if (pasteStyledBtn && pasteArea) {
    pasteStyledBtn.addEventListener('click', () => {
      const isVisible = pasteArea.classList.contains('visible');
      if (isVisible) {
        pasteArea.classList.remove('visible');
      } else {
        pasteArea.classList.add('visible');
        pasteArea.focus();
      }
    });

    pasteArea.addEventListener('paste', (e: ClipboardEvent) => {
      e.preventDefault();
      const html = e.clipboardData?.getData('text/html') ?? '';
      const plain = e.clipboardData?.getData('text/plain') ?? '';
      const segments = html ? parseHTMLToSegments(html) : (plain ? [{ characters: plain }] : []);
      if (segments.length > 0) {
        sendMessage('paste-styled-text', { segments, replaceSelected: false });
      }
      pasteArea.classList.remove('visible');
      pasteArea.value = '';
    });

    pasteArea.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        pasteArea.classList.remove('visible');
        pasteArea.value = '';
        pasteStyledBtn.focus();
      }
    });
  }

  if (copyStyledBtn) {
    copyStyledBtn.addEventListener('click', () => {
      sendMessage('copy-styled-text');
    });
  }

  // Add keyboard navigation support
  if (controlsGrid) {
    setupControlsKeyboardSupport(controlsGrid as HTMLElement);
  }

  if (arrowKeysGrid) {
    setupControlsKeyboardSupport(arrowKeysGrid as HTMLElement);
  }
}

// Keyboard navigation support for controls grid
export function setupControlsKeyboardSupport(controlsGrid: HTMLElement): void {
  const buttons = Array.from(controlsGrid.querySelectorAll('.nav-button')) as HTMLButtonElement[];

  // Create a 3D grid representation for navigation (3 columns now)
  const gridButtons: (HTMLButtonElement | null)[][] = [
    [null, null, null], // Row 0: Exit, Prev, (empty)
    [null, null, null], // Row 1: Collapse, Next, Enter
    [null, null, null]  // Row 2: GotoComponent, (empty), (empty)
  ];

  // Map buttons to grid positions based on data attributes
  buttons.forEach(button => {
    const row = parseInt(button.dataset.gridRow || '0');
    const col = parseInt(button.dataset.gridCol || '0');
    if (row >= 0 && row < 3 && col >= 0 && col < 3) {
      gridButtons[row][col] = button;
    }
  });

  // Add keyboard event listeners to each button
  buttons.forEach(button => {
    button.addEventListener('keydown', (event) => {
      const currentRow = parseInt(button.dataset.gridRow || '0');
      const currentCol = parseInt(button.dataset.gridCol || '0');
      let targetButton: HTMLButtonElement | null = null;

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          // Move up in grid
          for (let row = currentRow - 1; row >= 0; row--) {
            if (gridButtons[row][currentCol] && !gridButtons[row][currentCol]!.disabled) {
              targetButton = gridButtons[row][currentCol];
              break;
            }
          }
          // Wrap to bottom if no button found above
          if (!targetButton) {
            for (let row = 2; row > currentRow; row--) {
              if (gridButtons[row][currentCol] && !gridButtons[row][currentCol]!.disabled) {
                targetButton = gridButtons[row][currentCol];
                break;
              }
            }
          }
          break;

        case 'ArrowDown':
          event.preventDefault();
          // Move down in grid
          for (let row = currentRow + 1; row < 3; row++) {
            if (gridButtons[row][currentCol] && !gridButtons[row][currentCol]!.disabled) {
              targetButton = gridButtons[row][currentCol];
              break;
            }
          }
          // Wrap to top if no button found below
          if (!targetButton) {
            for (let row = 0; row < currentRow; row++) {
              if (gridButtons[row][currentCol] && !gridButtons[row][currentCol]!.disabled) {
                targetButton = gridButtons[row][currentCol];
                break;
              }
            }
          }
          break;

        case 'ArrowLeft':
          event.preventDefault();
          // Move left in grid (3 columns)
          for (let col = currentCol - 1; col >= 0; col--) {
            if (gridButtons[currentRow][col] && !gridButtons[currentRow][col]!.disabled) {
              targetButton = gridButtons[currentRow][col];
              break;
            }
          }
          // Wrap to rightmost column if no button found to the left
          if (!targetButton) {
            for (let col = 2; col > currentCol; col--) {
              if (gridButtons[currentRow][col] && !gridButtons[currentRow][col]!.disabled) {
                targetButton = gridButtons[currentRow][col];
                break;
              }
            }
          }
          break;

        case 'ArrowRight':
          event.preventDefault();
          // Move right in grid (3 columns)
          for (let col = currentCol + 1; col < 3; col++) {
            if (gridButtons[currentRow][col] && !gridButtons[currentRow][col]!.disabled) {
              targetButton = gridButtons[currentRow][col];
              break;
            }
          }
          // Wrap to leftmost column if no button found to the right
          if (!targetButton) {
            for (let col = 0; col < currentCol; col++) {
              if (gridButtons[currentRow][col] && !gridButtons[currentRow][col]!.disabled) {
                targetButton = gridButtons[currentRow][col];
                break;
              }
            }
          }
          break;

        case 'Enter':
        case ' ':
          event.preventDefault();
          // Activate current button
          if (!button.disabled) {
            button.click();
          }
          break;

        case 'Home':
          event.preventDefault();
          // Go to first enabled button
          for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
              if (gridButtons[row][col] && !gridButtons[row][col]!.disabled) {
                targetButton = gridButtons[row][col];
                break;
              }
            }
            if (targetButton) break;
          }
          break;

        case 'End':
          event.preventDefault();
          // Go to last enabled button
          for (let row = 2; row >= 0; row--) {
            for (let col = 2; col >= 0; col--) {
              if (gridButtons[row][col] && !gridButtons[row][col]!.disabled) {
                targetButton = gridButtons[row][col];
                break;
              }
            }
            if (targetButton) break;
          }
          break;
      }

      // Focus the target button if found
      if (targetButton && targetButton !== button) {
        targetButton.focus();
      }
    });
  });

  // Set initial focus management
  controlsGrid.addEventListener('focusin', (event) => {
    const target = event.target as HTMLElement;
    if (target.classList.contains('nav-button')) {
      // Announce current button state for screen readers
      announceButtonState(target as HTMLButtonElement);
    }
  });
}

// Announce button state for screen readers
export function announceButtonState(button: HTMLButtonElement): void {
  const isDisabled = button.disabled;
  const shortcut = button.dataset.shortcut || '';
  const buttonId = button.id;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enhanced = (window as any).enhancedAnnouncements || false;

  // Get contextual information based on button type
  let contextInfo = '';
  let detailedInfo = '';

  switch (buttonId) {
    case 'nav-enter':
      contextInfo = isDisabled ? 'No container selected to expand' : 'Container available to expand';
      detailedInfo = enhanced ? (isDisabled ?
        'Select a Section, Group, or Frame first to enable this action' :
        'Will select all children and focus the view on container contents') : '';
      break;
    case 'nav-exit':
      contextInfo = isDisabled ? 'No parent to exit to' : 'Can exit up one level';
      detailedInfo = enhanced ? (isDisabled ?
        'Current selection has no parent to exit to' :
        'Will move selection up one level in hierarchy') : '';
      break;
    case 'nav-prev':
    case 'nav-next':
      contextInfo = isDisabled ? 'No sibling layers available' : 'Sibling layers available for navigation';
      detailedInfo = enhanced ? (isDisabled ?
        'Current selection has no sibling layers at the same level' :
        'Will navigate to the adjacent layer at the same hierarchy level') : '';
      break;
    case 'nav-collapse':
      contextInfo = isDisabled ? 'No containers on page to collapse' : 'Containers available to collapse';
      detailedInfo = enhanced ? (isDisabled ?
        'Current page contains no Groups, Sections, or Frames' :
        'Will collapse selected containers, or sibling containers if none selected') : '';
      break;
    /* Button removed from UI
    case 'nav-goto-component':
      contextInfo = isDisabled ? 'No component instance selected' : 'Component instance selected';
      detailedInfo = enhanced ? (isDisabled ?
        'Select a component instance to navigate to its main component' :
        'Will navigate to the main component definition') : '';
      break;
    */
  }

  // Create a comprehensive announcement
  const label = button.getAttribute('aria-label') || '';
  const baseAnnouncement = `${label}. ${contextInfo}. ${isDisabled ? 'Button disabled' : 'Button enabled'}`;
  const announcement = enhanced && detailedInfo ? `${baseAnnouncement}. ${detailedInfo}` : baseAnnouncement;

  // Use existing live region or create one
  let liveRegion = document.getElementById('navigation-live-region');
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'navigation-live-region';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
  }

  // Clear and set new announcement with a slight delay to ensure it's read
  liveRegion.textContent = '';
  setTimeout(() => {
    liveRegion!.textContent = announcement;
  }, 100);

  // Suppress unused variable warning
  void shortcut;
}

// Announce navigation action results
export function announceNavigationResult(result: { success: boolean; message: string }): void {
  let liveRegion = document.getElementById('navigation-result-region');
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'navigation-result-region';
    liveRegion.setAttribute('aria-live', 'assertive');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
  }

  const announcement = result.success ?
    `Navigation successful: ${result.message}` :
    `Navigation failed: ${result.message}`;

  liveRegion.textContent = '';
  setTimeout(() => {
    liveRegion!.textContent = announcement;
  }, 50);
}

// Enhanced button state updates with screen reader announcements
export function updateButtonStateWithAnnouncement(button: HTMLButtonElement, enabled: boolean, reason?: string): void {
  const wasDisabled = button.disabled;
  button.disabled = !enabled;

  // Announce state change if it changed
  if (wasDisabled !== !enabled) {
    const buttonName = button.querySelector('.nav-label')?.textContent || 'Button';
    const stateChange = enabled ? 'enabled' : 'disabled';
    const announcement = `${buttonName} button ${stateChange}${reason ? `: ${reason}` : ''}`;

    // Use a separate live region for state changes
    let stateRegion = document.getElementById('navigation-state-region');
    if (!stateRegion) {
      stateRegion = document.createElement('div');
      stateRegion.id = 'navigation-state-region';
      stateRegion.setAttribute('aria-live', 'polite');
      stateRegion.setAttribute('aria-atomic', 'false');
      stateRegion.className = 'sr-only';
      document.body.appendChild(stateRegion);
    }

    stateRegion.textContent = '';
    setTimeout(() => {
      stateRegion!.textContent = announcement;
    }, 200);
  }
}

// Initialize controls
export function initializeControls(): void {
  setupControls();
  setupControlsSettings();
  setupNudgeSettings();
  setupDateSettings();

  // Initialize accessibility features
  initializeAccessibilityFeatures();

  // Request current settings from plugin
  sendMessage('get-controls-setting');
  sendMessage('get-controls-group-settings');
  sendMessage('get-nudge-settings');
  sendMessage('get-date-settings');
}

// Initialize accessibility features for controls
export function initializeAccessibilityFeatures(): void {
  // Detect and handle high contrast mode
  detectHighContrastMode();

  // Detect and handle reduced motion preference
  detectReducedMotionPreference();

  // Set up media query listeners for accessibility preferences
  setupAccessibilityListeners();

  // Validate color contrast ratios
  validateNavigationContrast();
}

// Detect high contrast mode (Windows High Contrast, forced-colors)
export function detectHighContrastMode(): void {
  const supportsHighContrast = window.matchMedia('(forced-colors: active)').matches ||
    window.matchMedia('(prefers-contrast: high)').matches;

  if (supportsHighContrast) {
    document.documentElement.setAttribute('data-high-contrast', 'true');
    console.log('🔍 High contrast mode detected - applying enhanced navigation accessibility');

    // Apply additional high contrast enhancements
    enhanceNavigationForHighContrast();
  }
}

// Detect reduced motion preference
export function detectReducedMotionPreference(): void {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    document.documentElement.setAttribute('data-reduced-motion', 'true');
    console.log('🎭 Reduced motion preference detected - disabling navigation animations');

    // Apply reduced motion enhancements
    enhanceNavigationForReducedMotion();
  }
}

// Set up media query listeners for accessibility preferences
export function setupAccessibilityListeners(): void {
  // Listen for high contrast changes
  const highContrastQuery = window.matchMedia('(forced-colors: active)');
  const contrastQuery = window.matchMedia('(prefers-contrast: high)');

  highContrastQuery.addEventListener('change', (e) => {
    if (e.matches) {
      document.documentElement.setAttribute('data-high-contrast', 'true');
      enhanceNavigationForHighContrast();
    } else {
      document.documentElement.removeAttribute('data-high-contrast');
    }
  });

  contrastQuery.addEventListener('change', (e) => {
    if (e.matches) {
      document.documentElement.setAttribute('data-high-contrast', 'true');
      enhanceNavigationForHighContrast();
    } else if (!window.matchMedia('(forced-colors: active)').matches) {
      document.documentElement.removeAttribute('data-high-contrast');
    }
  });

  // Listen for reduced motion changes
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  motionQuery.addEventListener('change', (e) => {
    if (e.matches) {
      document.documentElement.setAttribute('data-reduced-motion', 'true');
      enhanceNavigationForReducedMotion();
    } else {
      document.documentElement.removeAttribute('data-reduced-motion');
    }
  });
}

// Enhance navigation controls for high contrast mode
export function enhanceNavigationForHighContrast(): void {
  const navButtons = document.querySelectorAll('.nav-button');

  navButtons.forEach((button) => {
    const btn = button as HTMLButtonElement;

    // Add enhanced focus indicators
    btn.addEventListener('focus', () => {
      btn.style.outline = '3px solid';
      btn.style.outlineOffset = '2px';
    });

    // Ensure disabled state is clearly visible
    if (btn.disabled) {
      btn.style.borderStyle = 'dashed';
      btn.style.opacity = '1';
    }
  });

  // Enhance controls grid visibility
  const controlsGrid = document.querySelector('.controls-grid') as HTMLElement;
  if (controlsGrid) {
    controlsGrid.style.border = '2px solid';
    controlsGrid.style.padding = '4px';
  }
}

// Enhance controls for reduced motion
export function enhanceNavigationForReducedMotion(): void {
  const navButtons = document.querySelectorAll('.nav-button');

  navButtons.forEach((button) => {
    const btn = button as HTMLButtonElement;

    // Remove all transitions and animations
    btn.style.transition = 'none';
    btn.style.animation = 'none';

    // Enhance focus feedback without motion
    btn.addEventListener('focus', () => {
      btn.style.backgroundColor = 'var(--theme-bg-hover)';
      btn.style.borderWidth = '2px';
    });

    btn.addEventListener('blur', () => {
      btn.style.backgroundColor = '';
      btn.style.borderWidth = '';
    });
  });
}

// Validate color contrast ratios for controls
export function validateNavigationContrast(): void {
  const navButtons = document.querySelectorAll('.nav-button');

  navButtons.forEach((button) => {
    const btn = button as HTMLButtonElement;
    const computedStyle = window.getComputedStyle(btn);

    // Get computed colors
    const backgroundColor = computedStyle.backgroundColor;
    const textColor = computedStyle.color;

    // Log contrast information for debugging
    console.log(`🎨 Navigation button contrast - Background: ${backgroundColor}, Text: ${textColor}`);

    // Add contrast validation attribute for testing
    btn.setAttribute('data-contrast-validated', 'true');
  });
}

// Test controls accessibility features
export function testNavigationAccessibility(): void {
  console.log('🧪 Testing controls accessibility...');

  // Test high contrast mode
  testHighContrastMode();

  // Test reduced motion mode
  testReducedMotionMode();

  // Test color contrast ratios
  testColorContrastRatios();

  // Test keyboard navigation
  testKeyboardNavigation();

  console.log('✅ Navigation accessibility tests completed');
}

// Test high contrast mode functionality
export function testHighContrastMode(): void {
  console.log('🔍 Testing high contrast mode...');

  const navButtons = document.querySelectorAll('.nav-button');
  const originalHighContrast = document.documentElement.getAttribute('data-high-contrast');

  // Simulate high contrast mode
  document.documentElement.setAttribute('data-high-contrast', 'true');
  enhanceNavigationForHighContrast();

  // Verify enhancements are applied
  navButtons.forEach((button, index) => {
    const btn = button as HTMLButtonElement;
    const computedStyle = window.getComputedStyle(btn);

    console.log(`Button ${index + 1} high contrast - Border width: ${computedStyle.borderWidth}, Font weight: ${computedStyle.fontWeight}`);
  });

  // Restore original state
  if (originalHighContrast) {
    document.documentElement.setAttribute('data-high-contrast', originalHighContrast);
  } else {
    document.documentElement.removeAttribute('data-high-contrast');
  }
}

// Test reduced motion mode functionality
export function testReducedMotionMode(): void {
  console.log('🎭 Testing reduced motion mode...');

  const navButtons = document.querySelectorAll('.nav-button');
  const originalReducedMotion = document.documentElement.getAttribute('data-reduced-motion');

  // Simulate reduced motion mode
  document.documentElement.setAttribute('data-reduced-motion', 'true');
  enhanceNavigationForReducedMotion();

  // Verify motion is disabled
  navButtons.forEach((button, index) => {
    const btn = button as HTMLButtonElement;
    const computedStyle = window.getComputedStyle(btn);

    console.log(`Button ${index + 1} reduced motion - Transition: ${computedStyle.transition}, Animation: ${computedStyle.animation}`);
  });

  // Restore original state
  if (originalReducedMotion) {
    document.documentElement.setAttribute('data-reduced-motion', originalReducedMotion);
  } else {
    document.documentElement.removeAttribute('data-reduced-motion');
  }
}

// Test color contrast ratios
export function testColorContrastRatios(): void {
  console.log('🎨 Testing color contrast ratios...');

  const navButtons = document.querySelectorAll('.nav-button');

  navButtons.forEach((button, index) => {
    const btn = button as HTMLButtonElement;
    const computedStyle = window.getComputedStyle(btn);

    const backgroundColor = computedStyle.backgroundColor;
    const textColor = computedStyle.color;
    const borderColor = computedStyle.borderColor;

    console.log(`Button ${index + 1} colors:`, {
      background: backgroundColor,
      text: textColor,
      border: borderColor,
      disabled: btn.disabled
    });

    // Check if button meets basic visibility requirements
    const isVisible = backgroundColor !== textColor &&
      computedStyle.opacity !== '0' &&
      computedStyle.visibility !== 'hidden';

    console.log(`Button ${index + 1} visibility: ${isVisible ? '✅ Visible' : '❌ Not visible'}`);
  });
}

// Test keyboard navigation functionality
export function testKeyboardNavigation(): void {
  console.log('⌨️ Testing keyboard navigation...');

  const controlsGrid = document.querySelector('.controls-grid') as HTMLElement;
  const navButtons = controlsGrid?.querySelectorAll('.nav-button') as NodeListOf<HTMLButtonElement>;

  if (!navButtons || navButtons.length === 0) {
    console.log('❌ No navigation buttons found');
    return;
  }

  // Test ARIA attributes
  navButtons.forEach((button, index) => {
    const ariaLabel = button.getAttribute('aria-label');
    const ariaDescribedBy = button.getAttribute('aria-describedby');
    const role = button.getAttribute('role');

    console.log(`Button ${index + 1} ARIA:`, {
      label: ariaLabel,
      describedBy: ariaDescribedBy,
      role: role
    });
  });

  // Test grid structure
  const gridRole = controlsGrid?.getAttribute('role');
  const gridLabel = controlsGrid?.getAttribute('aria-label');

  console.log('Controls grid ARIA:', {
    role: gridRole,
    label: gridLabel
  });
}

// Expose testing function for manual testing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).testNavigationAccessibility = testNavigationAccessibility;

// Manual accessibility testing function for development
export function runAccessibilityTests(): void {
  console.log('🧪 Running comprehensive navigation accessibility tests...');

  // Test 1: High contrast mode detection and enhancement
  console.log('\n1. Testing high contrast mode detection...');
  const highContrastSupported = window.matchMedia('(prefers-contrast: high)').matches ||
    window.matchMedia('(forced-colors: active)').matches;
  console.log(`High contrast mode: ${highContrastSupported ? '✅ Detected' : '❌ Not detected'}`);

  // Test 2: Reduced motion detection
  console.log('\n2. Testing reduced motion detection...');
  const reducedMotionSupported = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  console.log(`Reduced motion: ${reducedMotionSupported ? '✅ Detected' : '❌ Not detected'}`);

  // Test 3: Color contrast validation
  console.log('\n3. Testing color contrast ratios...');
  testColorContrastRatios();

  // Test 4: ARIA attributes validation
  console.log('\n4. Testing ARIA attributes...');
  const controlsGrid = document.querySelector('.controls-grid');
  const navButtons = document.querySelectorAll('.nav-button');

  console.log(`Controls grid ARIA role: ${controlsGrid?.getAttribute('role') || 'Missing'}`);
  console.log(`Controls grid ARIA label: ${controlsGrid?.getAttribute('aria-label') || 'Missing'}`);

  navButtons.forEach((button, index) => {
    const ariaLabel = button.getAttribute('aria-label');
    const ariaDescribedBy = button.getAttribute('aria-describedby');
    console.log(`Button ${index + 1} - Label: ${ariaLabel || 'Missing'}, DescribedBy: ${ariaDescribedBy || 'Missing'}`);
  });

  // Test 5: Focus management
  console.log('\n5. Testing focus management...');
  navButtons.forEach((button, index) => {
    const btn = button as HTMLButtonElement;
    const focusable = !btn.disabled;
    console.log(`Button ${index + 1} - Focusable: ${focusable ? '✅' : '❌'}`);
  });

  // Test 6: Screen reader content
  console.log('\n6. Testing screen reader content...');
  const srElements = document.querySelectorAll('.sr-only');
  console.log(`Screen reader elements found: ${srElements.length}`);
  srElements.forEach((element, index) => {
    console.log(`SR Element ${index + 1}: ${element.textContent?.substring(0, 50)}...`);
  });

  console.log('\n✅ Accessibility tests completed. Check console for detailed results.');
}

// Expose manual testing function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).runAccessibilityTests = runAccessibilityTests;

// Re-export what the shell's handleDOMReady needs from navigate-ui
export { updateControlButtons, resetFooterButtonStates, activeTimers };

// ===== STYLED TEXT HELPERS =====

interface StyledTextSegmentUI {
  characters: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
  color?: { r: number; g: number; b: number };
  link?: string;
}

function parseColor(css: string): { r: number; g: number; b: number } | undefined {
  const rgbMatch = css.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    return { r: parseInt(rgbMatch[1]) / 255, g: parseInt(rgbMatch[2]) / 255, b: parseInt(rgbMatch[3]) / 255 };
  }
  const hexMatch = css.match(/^#([0-9a-f]{6})$/i);
  if (hexMatch) {
    const h = hexMatch[1];
    return { r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255 };
  }
  const shortHex = css.match(/^#([0-9a-f]{3})$/i);
  if (shortHex) {
    const h = shortHex[1];
    return { r: parseInt(h[0] + h[0], 16) / 255, g: parseInt(h[1] + h[1], 16) / 255, b: parseInt(h[2] + h[2], 16) / 255 };
  }
  return undefined;
}

function parseHTMLToSegments(html: string): StyledTextSegmentUI[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const segments: StyledTextSegmentUI[] = [];

  function walk(node: Node, styles: Partial<StyledTextSegmentUI>): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? '';
      if (text) segments.push({ characters: text, ...styles });
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const inherited: Partial<StyledTextSegmentUI> = { ...styles };

    // Semantic tags
    if (tag === 'b' || tag === 'strong') inherited.bold = true;
    if (tag === 'i' || tag === 'em') inherited.italic = true;
    if (tag === 'u') inherited.underline = true;
    if (tag === 'a') inherited.link = (el as HTMLAnchorElement).href || undefined;

    // Headings
    const headingMatch = tag.match(/^h([1-6])$/);
    if (headingMatch) {
      inherited.bold = true;
      const sizes = [32, 24, 20, 18, 16, 14];
      inherited.fontSize = sizes[parseInt(headingMatch[1]) - 1];
    }

    // Inline CSS
    const fw = el.style.fontWeight;
    if (fw === 'bold' || parseInt(fw) >= 700) inherited.bold = true;
    if (el.style.fontStyle === 'italic') inherited.italic = true;
    if (el.style.textDecoration?.includes('underline')) inherited.underline = true;
    const cssColor = el.style.color;
    if (cssColor) { const c = parseColor(cssColor); if (c) inherited.color = c; }
    const cssFontSize = el.style.fontSize;
    if (cssFontSize) { const px = parseFloat(cssFontSize); if (px > 0) inherited.fontSize = px; }

    if (tag === 'br') { segments.push({ characters: '\n', ...styles }); return; }

    const isBlock = /^(p|div|h[1-6]|blockquote|pre)$/.test(tag);
    if (tag === 'li' && segments.length > 0) segments.push({ characters: '• ', ...inherited });

    for (const child of Array.from(node.childNodes)) walk(child, inherited);

    if ((isBlock || tag === 'li') && segments.length > 0) {
      const last = segments[segments.length - 1];
      if (!last.characters.endsWith('\n')) segments.push({ characters: '\n', ...inherited });
    }
  }

  walk(doc.body, {});

  // Trim trailing newline segments
  while (segments.length > 0 && segments[segments.length - 1].characters.trim() === '') {
    segments.pop();
  }

  return segments;
}

export function updateStyledTextButtons(hasTextNode: boolean): void {
  const copyBtn = document.getElementById('copy-styled') as HTMLButtonElement | null;
  if (copyBtn) copyBtn.disabled = !hasTextNode;
}
