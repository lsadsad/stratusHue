// Figma Plugin UI - TypeScript Implementation
// Handles all UI interactions and communication with the plugin sandbox

// Temporarily disable lottie to debug
// import lottie from 'lottie-web';
import type { NavigationContext } from './types';
// UI should not import plugin-side storage (which uses `figma`).
// We request and persist UI section states via postMessage to the plugin.

// Inline SVG markup for dynamically-swapped icons — uses currentColor for theme support
const ICON_EYE_OPEN = '<svg class="lucide lucide-eye" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>';
const ICON_EYE_CLOSED = '<svg class="lucide lucide-eye-off" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/></svg>';
const ICON_LOCK_OPEN = '<svg class="lucide lucide-lock-open" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" rx="2" ry="2" width="18" height="11"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>';
const ICON_LOCK_CLOSED = '<svg class="lucide lucide-lock" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" rx="2" ry="2" width="18" height="11"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';

console.log('🔍 Script executing, DOM ready state:', document.readyState);

// Global error handlers to catch unexpected issues
window.addEventListener('error', (event) => {
  console.error('🚨 Global error caught:', event.error || event.message);
  // Prevent error from bubbling to Figma's error handler
  event.preventDefault();
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled promise rejection:', event.reason);
  // Prevent error from bubbling to Figma's error handler
  event.preventDefault();
});

// Type definitions for better development experience
interface _PluginMessage {
  type: string;
  [key: string]: unknown;
}

interface LottieAnimationConfig {
  container: HTMLElement;
  animationData: any;
  renderer?: 'svg' | 'canvas' | 'html';
  loop?: boolean;
  autoplay?: boolean;
  name?: string;
}

// Store active Lottie animations for management
const activeLottieAnimations = new Map<string, any>();
// UI section state cache provided by plugin
type UISectionState = Record<string, { expanded: boolean; lastModified: number }>
let uiSectionStatesFromPlugin: UISectionState = {};



// Mode state management (driven by selection)
let currentToggleMode: 'onPage' | 'onLayer' = 'onPage';

// Auto-fit state management
let isAutoFitEnabled = true; // Default to enabled
let lastAutoFitHeight = 0;

// Width toggle state management
let isWidthCompact = false; // Track if width is in compact mode

// Helper function to send messages to plugin sandbox
function sendMessage(type: string, data: Record<string, any> = {}): void {
  parent.postMessage({ pluginMessage: { type, ...data } }, '*');
}

// Canvas hint management
let canvasHintTimeout: number | null = null;

function showCanvasHint(): void {
  const hint = document.getElementById('canvas-hint');
  if (!hint) return;

  // Clear any existing timeout
  if (canvasHintTimeout !== null) {
    clearTimeout(canvasHintTimeout);
  }

  // Show the hint
  hint.classList.add('visible');

  // Hide after 2.5 seconds
  canvasHintTimeout = window.setTimeout(() => {
    hint.classList.remove('visible');
    canvasHintTimeout = null;
  }, 2500);
}

// Message handler for plugin responses
function handlePluginMessage(event: MessageEvent): void {
  const message = event.data.pluginMessage;
  if (!message) return;

  console.log('📥 Received message from plugin:', message.type, message);

  switch (message.type) {
    case 'selection-state':
      // Handle emoji set updates based on selection
      const emojis = message.hasLayerSelected ? message.layerEmojis : message.pageEmojis;
      if (emojis) {
        updateEmojiButtons(emojis);
      }
      // Update mode state based on selection
      updateToggleState(message.hasLayerSelected);
      // Update anatomy section with current page/layer info
      updateAnatomySection(message.hasLayerSelected, message.pageName, message.selectedLayerName);
      // Update visibility and lock button icons based on selection state
      updateVisibilityLockIcons(message.selectionVisible, message.selectionLocked);
      break;
    case 'bookmarks':
      updateBookmarksList(
        message.bookmarks,
        message.currentAnchorId,
        message.previousBookmarkId,
        message.isInsideAnchor
      );
      break;
    case 'navigation-state':
      updateNavigationButtons(message.canGoBack, message.canGoForward);
      break;
    case 'emoji-navigation-state':
      updateEmojiSetIndicator(message.setName, message.currentSetIndex, message.totalSets);
      break;
    case 'error':
      console.error('Plugin error:', message.message);
      break;
    case 'success':
      console.log('Plugin success:', message.message);
      break;
    case 'ui-section-states':
      uiSectionStatesFromPlugin = message.states || {};
      // Restore the saved states to the UI
      restoreUISectionStates();
      break;
    case 'navigation-context-update':
      navigationContext = message.context;
      updateControlButtons(navigationContext);
      break;
    case 'controls-setting':
      controlsEnabled = message.enabled;
      updateControlsVisibility(controlsEnabled);
      break;
    case 'controls-group-settings':
      if (message.groups) {
        groupMovementZoomVisible = message.groups.movementZoom ?? true;
        groupHierarchyVisible = message.groups.hierarchy ?? true;
        groupSizingModesVisible = message.groups.sizingModes ?? true;
        groupStyledTextVisible = message.groups.styledText ?? true;
        updateGroupTogglesUI();
        applyGroupVisibility();
      }
      break;
    case 'nudge-settings':
      updateNudgeSettingsUI(message.smallNudge, message.bigNudge);
      break;
    case 'navigation-action-result':
      // Announce the actual navigation result to screen readers
      announceNavigationResult({
        success: message.success,
        message: message.message
      });
      break;
    case 'update-layout-state':
      updateLayoutSizingButtons(message.horizontal, message.vertical);
      break;
    case 'update-styled-text-state':
      updateStyledTextButtons(!!message.hasTextNode);
      break;
    case 'styled-text-html': {
      const styledHtml = message.html as string;
      if (styledHtml) {
        const notifySuccess = () => sendMessage('notify', { message: '✓ Styled text copied to clipboard' });
        const notifyFail = () => sendMessage('notify', { message: 'Copy failed — clipboard unavailable' });

        // Fallback: intercept the copy event to write both HTML and plain-text MIME types.
        // Works in Figma's plugin iframe where navigator.clipboard may be absent.
        const copyViaExecCommand = (): boolean => {
          const onCopy = (e: ClipboardEvent) => {
            e.preventDefault();
            e.clipboardData?.setData('text/html', styledHtml);
            e.clipboardData?.setData('text/plain', styledHtml);
          };
          document.addEventListener('copy', onCopy as EventListener, { once: true });
          const ta = document.createElement('textarea');
          ta.value = styledHtml;
          ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0;pointer-events:none';
          document.body.appendChild(ta);
          ta.select();
          const ok = document.execCommand('copy');
          document.body.removeChild(ta);
          if (!ok) document.removeEventListener('copy', onCopy as EventListener);
          return ok;
        };

        // Primary: modern Clipboard API (Electron / browsers with clipboard-write permission)
        if (navigator.clipboard?.write) {
          navigator.clipboard.write([
            new ClipboardItem({ 'text/html': new Blob([styledHtml], { type: 'text/html' }) })
          ]).then(notifySuccess).catch(() => {
            copyViaExecCommand() ? notifySuccess() : notifyFail();
          });
        } else {
          copyViaExecCommand() ? notifySuccess() : notifyFail();
        }
      }
      break;
    }
  }
}

// Update toggle state based on selection
function updateToggleState(hasLayerSelected: boolean): void {
  const newMode = hasLayerSelected ? 'onLayer' : 'onPage';
  if (currentToggleMode !== newMode) {
    currentToggleMode = newMode;
    updateToggleUI();
  }
}

// Update mode affordance UI to reflect current state
function updateToggleUI(): void {
  // Update mode affordance badges on section titles
  const modeAffordances = document.querySelectorAll('.mode-affordance');
  const modeLabel = currentToggleMode === 'onPage' ? 'PAGE' : 'LAYER';
  modeAffordances.forEach((affordance) => {
    affordance.textContent = modeLabel;
    affordance.setAttribute('data-mode', currentToggleMode);
  });

  // Ensure page-only actions are visible only in onPage mode
  const pageActionsGroup = document.getElementById('page-actions-group');
  if (pageActionsGroup) {
    pageActionsGroup.style.display = currentToggleMode === 'onPage' ? 'inline-flex' : 'none';
  }

  // Show indent/outdent buttons only in onPage mode
  const buttonsRight = document.querySelector('.buttons-right') as HTMLElement;
  if (buttonsRight) {
    buttonsRight.style.display = currentToggleMode === 'onPage' ? 'flex' : 'none';
  }

  // Show anatomy-prefix only in onPage mode
  const anatomyPrefix = document.querySelector('.anatomy-prefix') as HTMLElement;
  if (anatomyPrefix) {
    anatomyPrefix.style.display = currentToggleMode === 'onPage' ? 'inline-flex' : 'none';
  }

  // Swap hierarchy control icons based on mode
    // Inline SVG markup for page-vs-layer navigation icon swapping
  const ICON_PAGE_UP    = '<svg class="lucide lucide-file-up" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M12 12v6"/><path d="m15 15-3-3-3 3"/></svg>';
  const ICON_PAGE_DOWN  = '<svg class="lucide lucide-file-down" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg>';
  const ICON_PAGE_ENTER = '<svg class="lucide lucide-file-input" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M2 15h10"/><path d="m9 18 3-3-3-3"/></svg>';
  const ICON_FOLDER_UP    = '<svg class="lucide lucide-folder-up" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/><path d="M12 10v6"/><path d="m9 13 3-3 3 3"/></svg>';
  const ICON_FOLDER_DOWN  = '<svg class="lucide lucide-folder-down" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/><path d="M12 10v6"/><path d="m15 13-3 3-3-3"/></svg>';
  const ICON_FOLDER_ENTER = '<svg class="lucide lucide-folder-input" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1"/><path d="M2 13h10"/><path d="m9 16 3-3-3-3"/></svg>';
  const iconSwaps: Array<{ buttonId: string; pageIcon: string; layerIcon: string }> = [
    { buttonId: 'nav-prev', pageIcon: ICON_PAGE_UP, layerIcon: ICON_FOLDER_UP },
    { buttonId: 'nav-next', pageIcon: ICON_PAGE_DOWN, layerIcon: ICON_FOLDER_DOWN },
    { buttonId: 'nav-enter', pageIcon: ICON_PAGE_ENTER, layerIcon: ICON_FOLDER_ENTER }
  ];

  iconSwaps.forEach(({ buttonId, pageIcon, layerIcon }) => {
    const button = document.getElementById(buttonId);
    const iconEl = button?.querySelector('.nav-icon') as HTMLElement | null;
    if (iconEl) {
      iconEl.innerHTML = currentToggleMode === 'onPage' ? pageIcon : layerIcon;
    }
  });
}

// Note: Manual toggle removed - mode is now controlled by selection state only

// Compute natural content height respecting collapsed sections and sticky elements
function computeFitHeight(): number {
  const main = document.querySelector('main.scrollable-content') as HTMLElement | null;
  const footer = document.getElementById('footer');

  if (!main || !footer) {
    return 400; // Safe fallback
  }

  // Calculate height by measuring visible content only
  let totalContentHeight = 0;
  let previousMarginBottom = 0;
  let previousWasSticky = false;
  
  // Get all direct children of main and measure only non-collapsed sections
  const children = Array.from(main.children) as HTMLElement[];
  
  for (const child of children) {
    const childStyle = window.getComputedStyle(child);
    const isSticky = childStyle.position === 'sticky';
    const marginTop = parseInt(childStyle.marginTop, 10) || 0;
    const marginBottom = parseInt(childStyle.marginBottom, 10) || 0;
    
    // Always measure actual rendered height (including mid-transition states).
    // This prevents premature window resize before CSS transitions complete.
    const childHeight = isSticky 
      ? child.getBoundingClientRect().height 
      : child.offsetHeight;
    
    // Sticky positioned elements don't participate in normal margin collapsing:
    // - When a sticky element follows another element, margins don't collapse
    // - When an element follows a sticky element, margins don't collapse
    let effectiveMargin: number;
    if (isSticky || previousWasSticky) {
      // No margin collapsing with sticky elements - add both margins
      effectiveMargin = previousMarginBottom + marginTop;
    } else {
      // Normal margin collapsing: only the larger of adjacent margins is used
      effectiveMargin = Math.max(previousMarginBottom, marginTop);
    }
    
    totalContentHeight += childHeight + effectiveMargin;
    
    previousMarginBottom = marginBottom;
    previousWasSticky = isSticky;
  }
  
  // Add the last element's bottom margin (doesn't collapse with padding)
  totalContentHeight += previousMarginBottom;
  
  // Add main's padding and margins (top and bottom)
  const mainStyle = window.getComputedStyle(main);
  const mainPaddingTop = parseInt(mainStyle.paddingTop, 10) || 0;
  const mainPaddingBottom = parseInt(mainStyle.paddingBottom, 10) || 0;
  const mainMarginTop = parseInt(mainStyle.marginTop, 10) || 0;
  const mainMarginBottom = parseInt(mainStyle.marginBottom, 10) || 0;
  
  const footerHeight = footer.offsetHeight || 20;
  
  // Total: visible content + padding + margins + footer (no extra buffer needed with accurate calculation)
  const totalHeight = totalContentHeight + mainPaddingTop + mainPaddingBottom + mainMarginTop + mainMarginBottom + footerHeight;

  // Only log detailed breakdown when height actually changes
  const collapsedCount = children.filter(c => c.classList.contains('collapsed')).length;
  if (Math.abs(totalHeight - lastAutoFitHeight) > 3) {
    console.log('Auto-fit height (collapsed-aware):', {
      totalContentHeight,
      mainPaddingTop,
      mainPaddingBottom,
      mainMarginTop,
      mainMarginBottom,
      footerHeight,
      totalHeight,
      collapsedSections: collapsedCount
    });
  }

  return Math.ceil(totalHeight);
}

// Debounce timer for auto-fit to prevent feedback loops
const autoFitDebounceTimer: number | null = null;
let scrollBehaviorDebounceTimer: number | null = null;

// Check if scrolling should be enabled based on content height
function updateScrollBehavior(): void {
  // Debounce the entire function to prevent excessive calls
  if (scrollBehaviorDebounceTimer) {
    clearTimeout(scrollBehaviorDebounceTimer);
  }
  
  scrollBehaviorDebounceTimer = window.setTimeout(() => {
    updateScrollBehaviorImmediate();
    scrollBehaviorDebounceTimer = null;
  }, 50);
}

// Internal function that does the actual work
function updateScrollBehaviorImmediate(): void {
  const main = document.querySelector('main.scrollable-content') as HTMLElement | null;
  if (!main) return;

  // Get the current container height
  const containerHeight = main.clientHeight;

  // Use the element's actual scrollHeight which accurately reflects
  // the scrollable content, including padding and layout, while
  // respecting collapsed sections (which have max-height: 0)
  const contentHeight = main.scrollHeight;

  // Enable/disable scrolling based on whether content exceeds container
  if (contentHeight <= containerHeight) {
    main.classList.add('no-scroll');
  } else {
    main.classList.remove('no-scroll');
  }

  // Auto-fit height adjustment when enabled
  if (isAutoFitEnabled) {
    const newHeight = computeFitHeight();
    
    // Only resize if height changed significantly (more than 3px difference)
    if (Math.abs(newHeight - lastAutoFitHeight) > 3) {
      console.log('Auto-fit: adjusting height from', lastAutoFitHeight, 'to', newHeight);
      sendMessage('resize-ui', { height: newHeight });
      lastAutoFitHeight = newHeight;
    }
  }
}

// ===== Tooltip Manager (Figma-like) =====
type TooltipState = {
  element: HTMLDivElement | null;
  showTimer: number | null;
  hideTimer: number | null;
  currentTarget: HTMLElement | null;
};

const tooltipState: TooltipState = {
  element: null,
  showTimer: null,
  hideTimer: null,
  currentTarget: null
};

function getTooltipElement(): HTMLDivElement {
  if (tooltipState.element) return tooltipState.element;
  let el = document.getElementById('tooltip') as HTMLDivElement | null;
  if (!el) {
    el = document.createElement('div');
    el.id = 'tooltip';
    el.className = 'tooltip';
    document.body.appendChild(el);
  }
  tooltipState.element = el;
  return el;
}

function positionTooltip(target: HTMLElement): void {
  const tip = getTooltipElement();
  const rect = target.getBoundingClientRect();
  const margin = 8; // px offset from target

  // Measure tooltip after ensuring content is set and visible for layout
  tip.style.visibility = 'hidden';
  tip.classList.add('visible');
  const tipWidth = tip.offsetWidth;
  const tipHeight = tip.offsetHeight;
  tip.classList.remove('visible');
  tip.style.visibility = '';

  // Placement preference: data-tooltip-placement="above|below|left|right|left-group|right-group|top-of-container"
  const placementPref = (target.getAttribute('data-tooltip-placement') || '').toLowerCase();
  let top: number;
  let left: number;

  if (placementPref === 'top-of-container') {
    // Find the container (data-tooltip-container attribute or closest grid/container)
    const containerSelector = target.getAttribute('data-tooltip-container');
    let container: HTMLElement | null = null;
    
    if (containerSelector) {
      container = target.closest(containerSelector) as HTMLElement;
    } else {
      // Default: find closest grid or tag-grid-container
      container = target.closest('.tag-grid-container') as HTMLElement;
    }
    
    if (container) {
      const containerRect = container.getBoundingClientRect();
      // Position at the top of the container
      top = containerRect.top - tipHeight - margin;
      // Center horizontally over the button
      left = rect.left + rect.width / 2 - tipWidth / 2;
    } else {
      // Fallback to above placement
      top = rect.top - tipHeight - margin;
      left = rect.left + rect.width / 2 - tipWidth / 2;
    }
    
    // Clamp to viewport
    const minLeft = 8;
    const maxLeft = Math.max(minLeft, window.innerWidth - tipWidth - 8);
    left = Math.min(Math.max(left, minLeft), maxLeft);
    const minTop = 8;
    top = Math.max(top, minTop);
  } else if (placementPref === 'left' || placementPref === 'left-group') {
    // Place to the left of target (or left of group)
    top = rect.top + rect.height / 2 - tipHeight / 2;
    
    if (placementPref === 'left-group') {
      // Find the parent container and align to its left edge
      const groupParent = target.parentElement;
      if (groupParent) {
        const groupRect = groupParent.getBoundingClientRect();
        left = groupRect.left - tipWidth - margin;
      } else {
        // Fallback to individual button if no parent found
        left = rect.left - tipWidth - margin;
      }
    } else {
      left = rect.left - tipWidth - margin;
    }
    
    // Clamp vertical position to viewport
    const minTop = 8;
    const maxTop = Math.max(minTop, window.innerHeight - tipHeight - 8);
    top = Math.min(Math.max(top, minTop), maxTop);
  } else if (placementPref === 'right' || placementPref === 'right-group') {
    // Place to the right of target (or right of group)
    top = rect.top + rect.height / 2 - tipHeight / 2;
    
    if (placementPref === 'right-group') {
      // Find the parent container and align to its right edge
      const groupParent = target.parentElement;
      if (groupParent) {
        const groupRect = groupParent.getBoundingClientRect();
        left = groupRect.right + margin;
      } else {
        // Fallback to individual button if no parent found
        left = rect.right + margin;
      }
    } else {
      left = rect.right + margin;
    }
    
    // Clamp vertical position to viewport
    const minTop = 8;
    const maxTop = Math.max(minTop, window.innerHeight - tipHeight - 8);
    top = Math.min(Math.max(top, minTop), maxTop);
  } else {
    // Vertical placement (above or below)
    let placeAbove: boolean;
    if (placementPref === 'below') {
      placeAbove = false;
    } else if (placementPref === 'above') {
      placeAbove = true;
    } else {
      // Default: prefer above when there is room
      placeAbove = rect.top >= tipHeight + margin;
    }
    top = placeAbove ? rect.top - tipHeight - margin : rect.bottom + margin;

    // Center horizontally over target; clamp to viewport
    left = rect.left + rect.width / 2 - tipWidth / 2;
    const minLeft = 8;
    const maxLeft = Math.max(minLeft, window.innerWidth - tipWidth - 8);
    left = Math.min(Math.max(left, minLeft), maxLeft);
  }

  tip.style.top = `${Math.round(top)}px`;
  tip.style.left = `${Math.round(left)}px`;
}

function showTooltip(target: HTMLElement, immediate = false): void {
  const preferred = target.getAttribute('data-tooltip');
  const label = preferred || target.getAttribute('aria-label') || target.getAttribute('title');
  if (!label) return;

  const tip = getTooltipElement();
  tip.textContent = label;

  if (tooltipState.hideTimer) {
    clearTimeout(tooltipState.hideTimer);
    tooltipState.hideTimer = null;
  }

  const doShow = () => {
    tooltipState.currentTarget = target;
    positionTooltip(target);
    tip.classList.add('visible');
  };

  if (immediate) {
    doShow();
  } else {
    // Check for custom delay via data attribute, default to 200ms
    const customDelay = target.getAttribute('data-tooltip-delay');
    const delay = customDelay ? parseInt(customDelay, 10) : 200;
    tooltipState.showTimer = window.setTimeout(doShow, delay);
  }
}

function hideTooltip(immediate = false): void {
  const tip = getTooltipElement();
  const doHide = () => {
    tip.classList.remove('visible');
    tooltipState.currentTarget = null;
  };

  if (tooltipState.showTimer) {
    clearTimeout(tooltipState.showTimer);
    tooltipState.showTimer = null;
  }

  if (immediate) {
    doHide();
  } else {
    tooltipState.hideTimer = window.setTimeout(doHide, 100);
  }
}

function attachTooltip(target: HTMLElement): void {
  target.addEventListener('mouseenter', () => showTooltip(target));
  target.addEventListener('mouseleave', () => hideTooltip());
  target.addEventListener('focus', () => showTooltip(target, true));
  target.addEventListener('blur', () => hideTooltip());
  target.addEventListener('mousedown', () => hideTooltip(true));
}

function initializeQuickActionTooltips(): void {
  // Attach to all action buttons across the UI, including refresh button
  const targets = document.querySelectorAll('.action-btn');
  targets.forEach((el) => attachTooltip(el as HTMLElement));

  // Attach to header nav buttons (new page, back, forward)
  const headerNavBtns = document.querySelectorAll('.header-nav-btn');
  headerNavBtns.forEach((el) => attachTooltip(el as HTMLElement));

  // Attach to emoji nav buttons (previous/next set)
  const emojiNavBtns = document.querySelectorAll('.emoji-nav-btn');
  emojiNavBtns.forEach((el) => attachTooltip(el as HTMLElement));

  // Also attach to footer icon buttons for consistency
  const footerTargets = document.querySelectorAll('.footer-icon-btn');
  footerTargets.forEach((el) => attachTooltip(el as HTMLElement));

  // Attach to Controls section nav buttons
  const navButtons = document.querySelectorAll('.nav-button');
  navButtons.forEach((el) => attachTooltip(el as HTMLElement));

  // Global dismissal handlers
  window.addEventListener('scroll', () => hideTooltip(true));
  window.addEventListener('resize', () => hideTooltip(true));
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideTooltip(true);
  });
  // Dismiss tooltip on any button press to reduce visual noise
  document.addEventListener('mousedown', (e) => {
    if ((e.target as HTMLElement).closest('button')) {
      hideTooltip(true);
    }
  });

  // Disable Tab navigation throughout the plugin
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
    }
  });

  // Blur active element after button clicks to remove focus ring
  // This doesn't return focus to Figma, but removes the visual cue from the plugin
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      // Use a small delay to let the click action complete first
      setTimeout(() => {
        (document.activeElement as HTMLElement)?.blur();
      }, 10);
    }
  });
}

// Timer for debouncing anatomy emoji reset between button hovers
let emojiPreviewResetTimer: number | null = null;

function resetAnatomyEmoji(anatomyEmoji: Element): void {
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
function updateEmojiButtons(emojis: string[]): void {
  const container = document.getElementById('color-emoji-buttons');
  if (!container) return;

  const anatomyEmoji = document.querySelector('.anatomy-emoji') as HTMLElement | null;

  container.innerHTML = '';
  emojis.forEach(emoji => {
    const button = document.createElement('button');
    button.className = 'emoji-button';
    button.textContent = emoji;

    button.addEventListener('click', () => {
      console.log('Emoji clicked:', emoji);
      sendMessage('add-emoji', { emoji });
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

// ===== ANATOMY SECTION UTILITIES =====
// Store current anatomy state for hover previews
const currentAnatomyState = {
  emoji: '',
  date: '12.29',
  hasDate: false,
  hasPrefix: false,
  isLayerMode: false
};

// Parse page title to extract emoji, date, and prefix
function parsePageTitle(name: string): { emoji: string | null; date: string | null; hasPrefix: boolean } {
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
function parseLayerName(name: string): { emoji: string | null; date: string | null } {
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

// Get today's date in MM.DD format
function getTodayDate(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${mm}.${dd}`;
}

// Update anatomy section with current page/layer information
function updateAnatomySection(isLayerMode: boolean, pageName: string | null, layerName: string | null): void {
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
  currentAnatomyState.hasPrefix = 'hasPrefix' in parsed ? Boolean(parsed.hasPrefix) : false;
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
function updateVisibilityLockIcons(
  selectionVisible: boolean | 'mixed' | null,
  selectionLocked: boolean | 'mixed' | null
): void {
  const hideBtn = document.getElementById('nav-hide');
  const lockBtn = document.getElementById('nav-lock');

  if (hideBtn) {
    const iconEl = hideBtn.querySelector('.nav-icon') as HTMLElement;
    if (iconEl) {
      // Show closed eye if all layers are hidden, open eye otherwise (including mixed state)
      if (selectionVisible === false) {
        iconEl.innerHTML = ICON_EYE_CLOSED;
        hideBtn.setAttribute('aria-label', 'Show layers (Cmd/Ctrl+Shift+H)');
        hideBtn.setAttribute('data-tooltip', 'Show (⌘⇧H)');
      } else {
        iconEl.innerHTML = ICON_EYE_OPEN;
        hideBtn.setAttribute('aria-label', 'Hide layers (Cmd/Ctrl+Shift+H)');
        hideBtn.setAttribute('data-tooltip', 'Hide (⌘⇧H)');
      }
    }
  }

  if (lockBtn) {
    const iconEl = lockBtn.querySelector('.nav-icon') as HTMLElement;
    if (iconEl) {
      // Show closed lock if all layers are locked, open lock otherwise (including mixed state)
      if (selectionLocked === true) {
        iconEl.innerHTML = ICON_LOCK_CLOSED;
        lockBtn.setAttribute('aria-label', 'Unlock layers (Cmd/Ctrl+Shift+L)');
        lockBtn.setAttribute('data-tooltip', 'Unlock (⌘⇧L)');
      } else {
        iconEl.innerHTML = ICON_LOCK_OPEN;
        lockBtn.setAttribute('aria-label', 'Lock layers (Cmd/Ctrl+Shift+L)');
        lockBtn.setAttribute('data-tooltip', 'Lock (⌘⇧L)');
      }
    }
  }
}

// Lottie Animation Utilities
function initializeLottieAnimation(config: LottieAnimationConfig): any {
  try {
    // Temporarily disable lottie to debug
    console.log('Lottie animation disabled for debugging');
    const animation = null;
    /*
    const animation = lottie.loadAnimation({
      container: config.container,
      renderer: config.renderer || 'svg',
      loop: config.loop !== false, // Default to true
      autoplay: config.autoplay !== false, // Default to true
      animationData: config.animationData,
      name: config.name || `lottie-${Date.now()}`
    });
    */

    // Store animation for management
    if (config.name) {
      activeLottieAnimations.set(config.name, animation);
    }

    console.log('✨ Lottie animation initialized:', config.name || 'unnamed');
    return animation;
  } catch (error) {
    console.error('❌ Failed to initialize Lottie animation:', error);
    return null;
  }
}

function loadLottieFromElement(element: HTMLElement): any {
  const lottieData = element.getAttribute('data-lottie');
  if (!lottieData) {
    console.warn('No Lottie data found on element');
    return null;
  }

  try {
    const animationData = JSON.parse(lottieData.replace(/&#39;/g, "'"));
    const animationName = element.getAttribute('data-lottie-name') || `lottie-${element.id || Date.now()}`;

    return initializeLottieAnimation({
      container: element,
      animationData,
      renderer: (element.getAttribute('data-lottie-renderer') as any) || 'svg',
      loop: element.getAttribute('data-lottie-loop') !== 'false',
      autoplay: element.getAttribute('data-lottie-autoplay') !== 'false',
      name: animationName
    });
  } catch (error) {
    console.error('❌ Failed to parse Lottie data:', error);
    return null;
  }
}

function initializeAllLottieElements(): void {
  const lottieElements = document.querySelectorAll('[data-lottie]');
  console.log(`🎬 Found ${lottieElements.length} Lottie elements to initialize`);

  lottieElements.forEach((element) => {
    loadLottieFromElement(element as HTMLElement);
  });
}

function destroyLottieAnimation(name: string): void {
  const animation = activeLottieAnimations.get(name);
  if (animation) {
    animation.destroy();
    activeLottieAnimations.delete(name);
    console.log('🗑️ Destroyed Lottie animation:', name);
  }
}

function destroyAllLottieAnimations(): void {
  activeLottieAnimations.forEach((animation, name) => {
    animation.destroy();
    console.log('🗑️ Destroyed Lottie animation:', name);
  });
  activeLottieAnimations.clear();
}

function playLottieAnimation(name: string): void {
  const animation = activeLottieAnimations.get(name);
  if (animation) {
    animation.play();
    console.log('▶️ Playing Lottie animation:', name);
  }
}

function pauseLottieAnimation(name: string): void {
  const animation = activeLottieAnimations.get(name);
  if (animation) {
    animation.pause();
    console.log('⏸️ Paused Lottie animation:', name);
  }
}

function stopLottieAnimation(name: string): void {
  const animation = activeLottieAnimations.get(name);
  if (animation) {
    animation.stop();
    console.log('⏹️ Stopped Lottie animation:', name);
  }
}

// Main plugin initialization
function initializePlugin(): void {
  console.log('🚀 Initializing plugin functionality...');

  // Initialize system theme detection first (before UI setup)
  initializeSystemThemeDetection();

  // Initialize performance monitoring for theme system
  initializeThemePerformanceMonitoring();

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

  // Initialize Lottie animations
  initializeAllLottieElements();

  // Initialize scroll behavior
  updateScrollBehavior();

  // Trigger initial auto-fit if enabled
  if (isAutoFitEnabled) {
    setTimeout(() => {
      const initialHeight = computeFitHeight();
      console.log('Initial auto-fit: setting height to', initialHeight);
      sendMessage('resize-ui', { height: initialHeight });
      lastAutoFitHeight = initialHeight;
    }, 100); // Small delay to ensure DOM is fully rendered
  }

  // Setup cleanup on page unload
  setupCleanupHandlers();

  // Initialize controls
  initializeControls();

  // Request and restore UI section states
  requestUISectionStates();

  // Check if running in browser (no Figma API) and populate mock data
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
      updateEmojiButtons(PAGE_EMOJI_SETS[0].emojis);
      
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

// Restore UI section states from storage
function requestUISectionStates(): void {
  try {
    sendMessage('get-ui-section-states');
  } catch (error) {
    console.error('Failed to request UI section states:', error);
  }
}

// Restore UI section states from cache received from plugin
async function restoreUISectionStates(): Promise<void> {
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
function setupEventListeners(): void {
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
    clearBtn.addEventListener('click', () => {
      console.log('Clear clicked');
      sendMessage('clear-emoji');
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
        const today = getTodayDate();
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
        const today = getTodayDate();
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
      if (anatomyPrefix && currentToggleMode === 'onPage') {
        anatomyPrefix.style.display = 'inline-flex';
        anatomyPrefix.style.opacity = '1';
        anatomyPrefix.classList.add('preview-mode');
      }
    });
    
    indentTitleBtn.addEventListener('mouseleave', () => {
      const anatomyPrefix = document.querySelector('.anatomy-prefix') as HTMLElement;
      if (anatomyPrefix && currentToggleMode === 'onPage') {
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
      if (anatomyPrefix && currentToggleMode === 'onPage') {
        anatomyPrefix.style.display = 'inline-flex';
        anatomyPrefix.style.opacity = '1';
        anatomyPrefix.classList.add('preview-mode');
      }
    });
    
    outdentTitleBtn.addEventListener('mouseleave', () => {
      const anatomyPrefix = document.querySelector('.anatomy-prefix') as HTMLElement;
      if (anatomyPrefix && currentToggleMode === 'onPage') {
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
    const onPage = currentToggleMode === 'onPage';
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
      
      // Toggle the compact-mode class on scrollable-content
      const scrollableContent = document.querySelector('.scrollable-content');
      if (scrollableContent) {
        if (isWidthCompact) {
          scrollableContent.classList.add('compact-mode');
          widthToggleBtn.classList.add('active');
        } else {
          scrollableContent.classList.remove('compact-mode');
          widthToggleBtn.classList.remove('active');
        }
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
    // Double-click to toggle auto-fit mode
    resizeHandle.addEventListener('dblclick', () => {
      isAutoFitEnabled = !isAutoFitEnabled;
      updateAutoFitButtonState();

      if (isAutoFitEnabled) {
        // Immediately fit to current content when enabling
        const contentHeight = computeFitHeight();
        console.log('Auto-fit enabled: adjusting height to', contentHeight);
        sendMessage('resize-ui', { height: contentHeight });
        lastAutoFitHeight = contentHeight;
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
      const onEnd = (e: Event) => {
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

// Global interaction state management to prevent stuck hover states
// This fixes the issue where hover states "stick" after click or drag interactions
function setupGlobalHoverStateManagement(): void {
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

// UI state update functions
function updateUIState(data: any): void {
  // Update UI based on plugin state
  console.log('Updating UI state:', data);
}

function updateBookmarksList(
  bookmarks: any[],
  currentAnchorId?: string | null,
  previousBookmarkId?: string | null,
  isInsideAnchor?: boolean
): void {
  const bookmarkList = document.getElementById('bookmark-list');
  const nullState = document.getElementById('anchors-null-state');
  if (!bookmarkList || !nullState) return;

  bookmarkList.innerHTML = '';

  // Show/hide null state based on bookmarks
  if (bookmarks.length === 0) {
    nullState.style.display = 'flex';
    nullState.setAttribute('aria-hidden', 'false');
    bookmarkList.style.display = 'none';
  } else {
    nullState.style.display = 'none';
    nullState.setAttribute('aria-hidden', 'true');
    bookmarkList.style.display = 'flex';

    // Drag-and-drop state
    let dragStartIndex: number | null = null;
    let isDragging = false;
    let hoverIndex: number | null = null;
    let insertAfter = false;

    // Create a single drop indicator overlay per render
    const dropIndicator = document.createElement('div');
    dropIndicator.className = 'drop-indicator';
    bookmarkList.appendChild(dropIndicator);

    const getItems = (): HTMLElement[] => {
      return Array.from(bookmarkList.querySelectorAll('.bookmark-item')) as HTMLElement[];
    };

    const getItemIndex = (el: Element): number => {
      const children = getItems();
      return children.indexOf(el as HTMLElement);
    };

    const buildOrderFromDom = (): string[] => {
      return getItems().map((child) => (child as HTMLElement).dataset.id || '');
    };

    const handleDropReorder = (targetLi: HTMLElement) => {
      if (dragStartIndex === null) return;
      const from = dragStartIndex;

      // Determine target index using hover state; fallback to element index
      const baseIndex = getItemIndex(targetLi);
      let to = baseIndex;
      if (hoverIndex !== null && baseIndex === hoverIndex) {
        to = insertAfter ? hoverIndex + 1 : hoverIndex;
      }

      const items = getItems();
      if (from === -1) return;
      if (to < 0) to = 0;
      if (to > items.length) to = items.length;

      const draggedEl = items[from];
      if (!draggedEl) return;

      // If moving forward, and inserting after, account for removal shifting
      const refItems = getItems();
      const refNode = refItems[to] || dropIndicator.nextSibling || null;
      bookmarkList.insertBefore(draggedEl, refNode);

      const order = buildOrderFromDom().filter(Boolean);
      if (order.length === bookmarks.length) {
        sendMessage('reorder-bookmarks', { order });
      }
    };

    bookmarks.forEach(bookmark => {
      const li = document.createElement('li');
      li.className = 'bookmark-item';
      li.setAttribute('draggable', 'true');
      (li as HTMLElement).dataset.id = bookmark.id;

      // Apply selection state classes
      if (currentAnchorId && bookmark.id === currentAnchorId) {
        li.classList.add('current-anchor');
        if (isInsideAnchor) li.classList.add('inside-anchor');
      } else if (previousBookmarkId && bookmark.id === previousBookmarkId) {
        li.classList.add('recent-history');
      }

      // Inner content
      const recentHistoryIcon = previousBookmarkId && bookmark.id === previousBookmarkId
        ? '<img src="./assets/ICO-recentSteps.svg" alt="" class="recent-steps-icon">'
        : '';
      
      li.innerHTML = `
        <div class="bookmark-content">
          <div class="bookmark-name">${bookmark.name}</div>
          <div class="bookmark-page">${bookmark.pageName}</div>
        </div>
        ${recentHistoryIcon}
        <button class="bookmark-remove" aria-label="Remove anchor" title="Remove">
          ✕
        </button>
      `;

      // Navigate on item click
      li.addEventListener('click', () => {
        if (isDragging) return;
        sendMessage('jump-to-bookmark', { id: bookmark.id });
        showCanvasHint();
      });

      // Remove button behavior
      const removeBtn = li.querySelector('.bookmark-remove');
      if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          sendMessage('remove-bookmark', { id: bookmark.id });
        });
        // Ensure remove button doesn't initiate drag
        removeBtn.addEventListener('mousedown', (e) => e.stopPropagation());
        removeBtn.addEventListener('dragstart', (e) => e.stopPropagation());
      }

      // Drag-and-drop handlers
      li.addEventListener('dragstart', (e) => {
        isDragging = true;
        dragStartIndex = getItemIndex(li);
        li.classList.add('dragging');
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', bookmark.id);
        }
        // Show indicator initially at current position
        const listRect = bookmarkList.getBoundingClientRect();
        const liRect = li.getBoundingClientRect();
        dropIndicator.style.top = `${liRect.top - listRect.top}px`;
        dropIndicator.classList.add('visible');
      });

      li.addEventListener('dragenter', (e) => {
        e.preventDefault();
        li.classList.add('drag-over');
      });

      li.addEventListener('dragover', (e) => {
        e.preventDefault();
        const listRect = bookmarkList.getBoundingClientRect();
        const liRect = li.getBoundingClientRect();
        const mid = liRect.top + liRect.height / 2;
        hoverIndex = getItemIndex(li);
        insertAfter = e.clientY >= mid;
        const y = insertAfter ? liRect.bottom : liRect.top;
        dropIndicator.style.top = `${y - listRect.top}px`;
        dropIndicator.classList.add('visible');
      });

      li.addEventListener('dragleave', () => {
        li.classList.remove('drag-over');
      });

      li.addEventListener('drop', (e) => {
        e.preventDefault();
        li.classList.remove('drag-over');
        handleDropReorder(li);
        dropIndicator.classList.remove('visible');
      });

      li.addEventListener('dragend', () => {
        isDragging = false;
        dragStartIndex = null;
        li.classList.remove('dragging');
        hoverIndex = null;
        insertAfter = false;
        dropIndicator.classList.remove('visible');
        // After drag ends, update scroll behavior as layout might change
        setTimeout(updateScrollBehavior, 50);
      });

      bookmarkList.appendChild(li);
    });

    // Handle dragging over empty space to position indicator at the end
    bookmarkList.addEventListener('dragover', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const items = getItems();
      if (items.length === 0) return;
      const last = items[items.length - 1];
      const listRect = bookmarkList.getBoundingClientRect();
      const lastRect = last.getBoundingClientRect();
      if (e.clientY > lastRect.bottom) {
        hoverIndex = items.length - 1;
        insertAfter = true;
        dropIndicator.style.top = `${lastRect.bottom - listRect.top}px`;
        dropIndicator.classList.add('visible');
      }
    });

    bookmarkList.addEventListener('drop', () => {
      dropIndicator.classList.remove('visible');
    });
  }

  // Update scroll behavior after content changes
  setTimeout(updateScrollBehavior, 50);
}

function updateNavigationButtons(canGoBack: boolean, canGoForward: boolean): void {
  const backBtn = document.getElementById('back-btn') as HTMLButtonElement;
  const forwardBtn = document.getElementById('forward-btn') as HTMLButtonElement;

  if (backBtn) backBtn.disabled = !canGoBack;
  if (forwardBtn) forwardBtn.disabled = !canGoForward;
}

function updateLayoutSizingButtons(horizontal: string | undefined, vertical: string | undefined): void {
  const widthModeSpan = document.getElementById('width-mode');
  const heightModeSpan = document.getElementById('height-mode');
  const widthIcon = document.getElementById('width-icon') as HTMLElement;
  const heightIcon = document.getElementById('height-icon') as HTMLElement;
  const cycleWidthBtn = document.getElementById('cycle-width') as HTMLButtonElement;
  const cycleHeightBtn = document.getElementById('cycle-height') as HTMLButtonElement;
  const widthCaption = document.getElementById('width-caption');
  const heightCaption = document.getElementById('height-caption');

  // Inline SVG markup for sizing-mode icons
  const ICON_FIXED = '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 6V10" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 6V10" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M1 8H15" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ICON_HUG   = '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 5V11" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M0.5 8H4.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M2.5 10L4.5 8L2.5 6" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M10.5 5V11" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.5 8H11.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.5 6L11.5 8L13.5 10" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ICON_FILL  = '<svg class="lucide lucide-arrow-left-right" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/></svg>';

  const getSvgMarkup = (mode: string | undefined): string => {
    if (!mode || mode === '—') return ICON_FIXED;
    const modeLower = mode.toLowerCase();
    if (modeLower === 'hug') return ICON_HUG;
    if (modeLower === 'fill') return ICON_FILL;
    if (modeLower === 'fixed') return ICON_FIXED;
    return ICON_FIXED;
  };

  // Update button labels
  if (widthModeSpan) {
    widthModeSpan.textContent = horizontal || '—';
  }
  if (heightModeSpan) {
    heightModeSpan.textContent = vertical || '—';
  }

  // Update icons based on current mode
  if (widthIcon) {
    widthIcon.innerHTML = getSvgMarkup(horizontal);
  }
  if (heightIcon) {
    heightIcon.innerHTML = getSvgMarkup(vertical);
  }

  // Enable/disable buttons based on whether we have valid layout properties
  const hasValidState = horizontal && horizontal !== '—';
  if (cycleWidthBtn) {
    cycleWidthBtn.disabled = !hasValidState;
  }
  if (cycleHeightBtn) {
    cycleHeightBtn.disabled = !hasValidState;
  }

  // Update caption labels: show "Width"/"Height" when disabled, show mode when enabled
  if (widthCaption) {
    if (!hasValidState) {
      widthCaption.textContent = 'Width';
    } else {
      const widthMode = horizontal && horizontal !== '—' ? horizontal : 'Fixed';
      widthCaption.textContent = widthMode.charAt(0).toUpperCase() + widthMode.slice(1).toLowerCase();
    }
  }
  if (heightCaption) {
    if (!hasValidState) {
      heightCaption.textContent = 'Height';
    } else {
      const heightMode = vertical && vertical !== '—' ? vertical : 'Fixed';
      heightCaption.textContent = heightMode.charAt(0).toUpperCase() + heightMode.slice(1).toLowerCase();
    }
  }

  // When buttons are disabled, always reset icons to fixed (default state)
  if (!hasValidState) {
    if (widthIcon) {
      widthIcon.innerHTML = ICON_FIXED;
    }
    if (heightIcon) {
      heightIcon.innerHTML = ICON_FIXED;
    }
  }
}

function updateEmojiSetIndicator(setName: string, currentIndex: number, totalSets: number): void {
  const indicator = document.getElementById('emoji-set-indicator');
  if (indicator) {
    const setNameElement = indicator.querySelector('.set-name');
    if (setNameElement) {
      setNameElement.textContent = setName;
    }
  }
}

// Disable auto-fit and update UI state
function disableAutoFit(reason?: string): void {
  if (isAutoFitEnabled) {
    isAutoFitEnabled = false;
    updateAutoFitButtonState();
    console.log(`Auto-fit disabled${reason ? `: ${reason}` : ''}`);
  }
}

// Update auto-fit visual state on resize handle
function updateAutoFitButtonState(): void {
  const resizeHandle = document.getElementById('footer-resize');
  if (!resizeHandle) return;

  if (isAutoFitEnabled) {
    resizeHandle.classList.add('auto-fit-active');
    resizeHandle.setAttribute('aria-label', 'Resize panel (double-click to disable auto-fit) - Auto-fit: ON');
    resizeHandle.setAttribute('title', 'Auto-fit: ON - Double-click to disable');
  } else {
    resizeHandle.classList.remove('auto-fit-active');
    resizeHandle.setAttribute('aria-label', 'Resize panel (double-click to enable auto-fit) - Auto-fit: OFF');
    resizeHandle.setAttribute('title', 'Auto-fit: OFF - Double-click to enable');
  }
}

// Utility function to reset all footer button states
function resetFooterButtonStates(): void {
  const footerButtons = document.querySelectorAll('.footer-icon-btn');
  footerButtons.forEach((button) => {
    const btn = button as HTMLElement;
    btn.classList.remove('hover-active');
    btn.style.removeProperty('background');
    btn.style.removeProperty('color');
    btn.style.removeProperty('transform');
  });
}

// License management removed

// Enhanced Theme Management System
import { ThemeManager } from './core/theme-manager';
import { ThemeMode, EffectiveTheme, ThemePreference } from './core/types';

let themeManager: ThemeManager;
let isThemeInitialized = false;

// Initialize accessibility media query listeners
function initializeAccessibilityListeners(): void {
  // High contrast preference listener
  const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
  const handleHighContrastChange = (e: MediaQueryListEvent) => {
    console.log('🔍 High contrast preference changed:', e.matches);
    updateThemeAccessibility(themeManager?.getEffectiveTheme() || 'figma-dark', false);

    // Announce change to screen readers
    const announcer = document.getElementById('theme-announcer');
    if (announcer) {
      announcer.textContent = e.matches ?
        'High contrast mode enabled' :
        'High contrast mode disabled';
      setTimeout(() => { if (announcer) announcer.textContent = ''; }, 2000);
    }
  };

  highContrastQuery.addEventListener('change', handleHighContrastChange);

  // Reduced motion preference listener
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const handleReducedMotionChange = (e: MediaQueryListEvent) => {
    console.log('🎬 Reduced motion preference changed:', e.matches);
    updateThemeAccessibility(themeManager?.getEffectiveTheme() || 'figma-dark', false);

    // Announce change to screen readers
    const announcer = document.getElementById('theme-announcer');
    if (announcer) {
      announcer.textContent = e.matches ?
        'Reduced motion enabled' :
        'Reduced motion disabled';
      setTimeout(() => { if (announcer) announcer.textContent = ''; }, 2000);
    }
  };

  reducedMotionQuery.addEventListener('change', handleReducedMotionChange);

  // Forced colors (Windows High Contrast) listener
  const forcedColorsQuery = window.matchMedia('(forced-colors: active)');
  const handleForcedColorsChange = (e: MediaQueryListEvent) => {
    console.log('🎨 Forced colors mode changed:', e.matches);
    updateThemeAccessibility(themeManager?.getEffectiveTheme() || 'figma-dark', false);

    // Announce change to screen readers
    const announcer = document.getElementById('theme-announcer');
    if (announcer) {
      announcer.textContent = e.matches ?
        'Windows High Contrast mode enabled' :
        'Windows High Contrast mode disabled';
      setTimeout(() => { if (announcer) announcer.textContent = ''; }, 2000);
    }
  };

  forcedColorsQuery.addEventListener('change', handleForcedColorsChange);

  // Initial accessibility state update
  updateThemeAccessibility(themeManager?.getEffectiveTheme() || 'figma-dark', false);
}

// Initialize system theme detection early in startup sequence
function initializeSystemThemeDetection(): void {
  console.log('🎨 Initializing system theme detection...');

  // Initialize theme manager with system detection
  themeManager = new ThemeManager(sendMessage);

  // Initialize accessibility listeners
  initializeAccessibilityListeners();

  // Use system theme as initial theme - actual saved preference will be loaded from code.ts
  const systemTheme = themeManager.currentSystemTheme;
  const initialTheme: EffectiveTheme = systemTheme === 'dark' ? 'figma-dark' : 'figma-light';
  console.log(`🔍 Using initial system theme: ${systemTheme} (${initialTheme})`);

  console.log(`🎨 Applying initial theme: ${initialTheme}`);

  // Additional debugging for system theme detection
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  console.log(`🔍 Media query '(prefers-color-scheme: dark)' matches: ${mediaQuery.matches}`);
  console.log(`🔍 Expected system theme: ${mediaQuery.matches ? 'dark' : 'light'}`);

  applyTheme(initialTheme);

  // Set up theme change listeners for system changes and user preferences
  themeManager.onThemeChange((effectiveTheme) => {
    console.log(`🎨 Theme change detected: ${effectiveTheme}`);

    // Show loading state during theme change
    showThemeLoadingState();

    // Manage focus during theme change
    manageFocusDuringThemeChange();

    // Apply theme with enhanced feedback
    applyTheme(effectiveTheme);
    updateThemeUI();

    // Theme change notification removed for now (function preserved for future use)

    // Hide loading state after theme application
    setTimeout(() => {
      hideThemeLoadingState();
    }, 100);

    // Notify other parts of the system about theme changes
    synchronizeThemeChanges(effectiveTheme);
  });

  // Mark theme system as initialized
  isThemeInitialized = true;

  console.log('✅ System theme detection initialized');
}

// Synchronize theme changes across the UI and with the backend
function synchronizeThemeChanges(effectiveTheme: EffectiveTheme): void {
  // Update any theme-dependent UI elements
  updateThemeUI();

  // Update accessibility attributes for the new theme
  updateThemeAccessibility(effectiveTheme, themeManager?.currentTheme === 'system');

  // Update scroll behavior after theme change (some themes might affect layout)
  setTimeout(() => {
    updateScrollBehavior();
  }, 50);

  // Dispatch custom event for other components that might need to react to theme changes
  window.dispatchEvent(new CustomEvent('systemThemeSync', {
    detail: {
      effectiveTheme,
      themeMode: themeManager?.currentTheme,
      systemTheme: themeManager?.currentSystemTheme,
      timestamp: Date.now()
    }
  }));

  // Dispatch enhanced theme change event with more details
  window.dispatchEvent(new CustomEvent('themeChangeComplete', {
    detail: {
      effectiveTheme,
      themeMode: themeManager?.currentTheme,
      systemTheme: themeManager?.currentSystemTheme,
      timestamp: Date.now(),
      isSystemTheme: themeManager?.currentTheme === 'system'
    }
  }));

  // Log theme synchronization for debugging
  console.log(`🔄 Theme synchronized: ${effectiveTheme} (mode: ${themeManager?.currentTheme}, system: ${themeManager?.currentSystemTheme})`);
}

// Theme switching functionality
function setupThemeSwitching(): void {
  // Ensure theme manager is initialized
  if (!themeManager) {
    console.warn('⚠️ Theme manager not initialized, calling initializeSystemThemeDetection');
    initializeSystemThemeDetection();
  }

  // Request saved theme from backend (this will override system fallback)
  console.log('📤 Requesting saved theme preference from backend...');
  sendMessage('get-theme-preference');

  // Add event listeners to theme buttons with enhanced keyboard navigation
  const themeButtons = document.querySelectorAll('.theme-option') as NodeListOf<HTMLButtonElement>;
  themeButtons.forEach((button) => {
    // Enhanced click handler
    button.addEventListener('click', () => {
      const themeMode = button.dataset.theme as ThemeMode;

      // Hide any active preview before applying the actual theme
      hideThemePreview();

      // Update aria-pressed state for all buttons
      themeButtons.forEach(btn => btn.setAttribute('aria-pressed', 'false'));
      button.setAttribute('aria-pressed', 'true');

      // Apply the selected theme
      themeManager.setTheme(themeMode);
      console.log('Theme changed to:', themeMode);

      // Announce theme selection for screen readers
      announceThemeSelection(themeMode);
    });

    // Enhanced keyboard navigation
    button.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          navigateToAdjacentTheme(button, 'previous');
          break;
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          navigateToAdjacentTheme(button, 'next');
          break;
        case 'Home':
          e.preventDefault();
          navigateToFirstTheme();
          break;
        case 'End':
          e.preventDefault();
          navigateToLastTheme();
          break;
      }
    });
  });

  // Setup theme preview functionality
  setupThemePreview();
}

function applyTheme(effectiveTheme: EffectiveTheme): void {
  const htmlElement = document.documentElement;

  // Get current theme for transition detection
  const currentTheme = htmlElement.getAttribute('data-theme');

  // Validate effective theme before applying
  const validThemes: EffectiveTheme[] = ['figma-light', 'figma-dark', 'light', 'boilerplate', 'cybertron'];
  const themeToApply = validThemes.includes(effectiveTheme) ? effectiveTheme : 'figma-dark';

  // Skip if already applied (optimization)
  if (currentTheme === themeToApply) {
    return;
  }

  // Add transition class for smooth theme changes (only if not initial load)
  const isInitialLoad = !currentTheme || currentTheme === '';
  if (!isInitialLoad) {
    htmlElement.classList.add('theme-transitioning');
  }

  // Apply theme resolution logic with proper mapping
  const resolvedTheme = resolveThemeAttribute(themeToApply);

  // Apply the new theme
  htmlElement.setAttribute('data-theme', resolvedTheme);

  // Log theme application for debugging
  console.log(`🎨 Applied theme: ${resolvedTheme} (from effective: ${themeToApply})`);

  // Remove transition class after animation completes (only if transition was added)
  if (!isInitialLoad) {
    setTimeout(() => {
      htmlElement.classList.remove('theme-transitioning');
    }, 300); // Match CSS transition duration
  }

  // Persist theme preference if theme manager is available and initialized
  if (themeManager && isThemeInitialized) {
    persistThemeChange(themeToApply);
  }
}

function resolveThemeAttribute(effectiveTheme: EffectiveTheme): string {
  // Map effective themes to CSS data-theme attribute values
  switch (effectiveTheme) {
    case 'figma-light':
      return 'figma-light';
    case 'figma-dark':
      return 'figma-dark';
    case 'light':
      return 'light';
    case 'boilerplate':
      return 'boilerplate';
    case 'cybertron':
      return 'cybertron';
    default:
      return 'figma-dark'; // Safe fallback
  }
}

function persistThemeChange(effectiveTheme: EffectiveTheme): void {
  // Create theme preference object with current state
  const preference: ThemePreference = {
    mode: themeManager.currentTheme,
    lastSystemTheme: themeManager.currentSystemTheme,
    migrationVersion: 1
  };

  // Send to backend for persistence
  sendMessage('set-theme-preference', { theme: preference });
}

function updateThemeUI(): void {
  if (!themeManager) return;

  const currentMode = themeManager.currentTheme;
  
  // Update all theme buttons' aria-pressed state
  const allButtons = document.querySelectorAll('.theme-option') as NodeListOf<HTMLButtonElement>;
  allButtons.forEach(button => {
    const isCurrentTheme = button.dataset.theme === currentMode;
    button.setAttribute('aria-pressed', isCurrentTheme ? 'true' : 'false');
  });

  // Update system theme status indicator
  updateSystemThemeStatus();

  // Dispatch a custom event for other parts of the app to listen to
  const effectiveTheme = themeManager.getEffectiveTheme();
  window.dispatchEvent(new CustomEvent('themeChanged', {
    detail: {
      themeMode: currentMode,
      effectiveTheme: effectiveTheme,
      systemTheme: themeManager.currentSystemTheme
    }
  }));
}

function updateSystemThemeStatus(): void {
  if (!themeManager) return;

  const statusElement = document.getElementById('system-theme-status');
  if (!statusElement) return;

  const currentMode = themeManager.currentTheme;
  const systemTheme = themeManager.currentSystemTheme;

  if (currentMode === 'system') {
    // Show current system theme detection
    const effectiveTheme = themeManager.getEffectiveTheme();
    const themeLabel = effectiveTheme === 'figma-light' ? 'Light' : 'Dark';
    statusElement.textContent = '';
    statusElement.style.display = 'none';

    // Add visual indicator for system theme synchronization
    statusElement.setAttribute('data-system-theme', systemTheme);
  } else {
    // Hide status for non-system themes
    statusElement.style.display = 'none';
    statusElement.removeAttribute('data-system-theme');
  }
}

// Theme change notification system (preserved for future use)
function _showThemeChangeNotification(_themeMode: ThemeMode, _effectiveTheme: EffectiveTheme): void {
  // Create or get existing notification element
  let notification = document.getElementById('theme-change-notification');
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'theme-change-notification';
    notification.className = 'theme-notification';
    notification.setAttribute('role', 'status');
    notification.setAttribute('aria-live', 'polite');
    document.body.appendChild(notification);
  }

  // Get theme display name
  const themeConfig = themeManager?.getThemeConfig(_themeMode);
  const displayName = themeConfig?.displayName || _themeMode;
  const icon = themeConfig?.icon || '🎨';

  // Set notification content
  notification.innerHTML = `
    <span class="theme-notification-icon">${icon}</span>
    <span class="theme-notification-text">Theme changed to ${displayName}</span>
  `;

  // Show notification with animation
  notification.classList.add('show');

  // Auto-hide after 2 seconds
  setTimeout(() => {
    notification?.classList.remove('show');
  }, 2000);

  // Announce to screen readers
  announceThemeChange(displayName);
}

// Enhanced keyboard navigation helpers for theme selection
function navigateToAdjacentTheme(currentButton: HTMLButtonElement, direction: 'previous' | 'next'): void {
  const allButtons = Array.from(document.querySelectorAll('.theme-option')) as HTMLButtonElement[];
  const currentIndex = allButtons.indexOf(currentButton);

  if (currentIndex === -1) return;

  let targetIndex: number;
  if (direction === 'previous') {
    targetIndex = currentIndex === 0 ? allButtons.length - 1 : currentIndex - 1;
  } else {
    targetIndex = currentIndex === allButtons.length - 1 ? 0 : currentIndex + 1;
  }

  const targetButton = allButtons[targetIndex];
  if (targetButton) {
    targetButton.focus();
    // Optionally select the theme immediately on navigation
    if (targetButton.getAttribute('aria-pressed') !== 'true') {
      targetButton.click();
    }
  }
}

function navigateToFirstTheme(): void {
  const firstButton = document.querySelector('.theme-option') as HTMLButtonElement;
  if (firstButton) {
    firstButton.focus();
    if (firstButton.getAttribute('aria-pressed') !== 'true') {
      firstButton.click();
    }
  }
}

function navigateToLastTheme(): void {
  const allButtons = document.querySelectorAll('.theme-option');
  const lastButton = allButtons[allButtons.length - 1] as HTMLButtonElement;
  if (lastButton) {
    lastButton.focus();
    if (lastButton.getAttribute('aria-pressed') !== 'true') {
      lastButton.click();
    }
  }
}

function announceThemeSelection(themeMode: ThemeMode): void {
  const themeConfig = themeManager?.getThemeConfig(themeMode);
  if (!themeConfig) return;

  // Create or get existing selection announcer
  let announcer = document.getElementById('theme-selection-announcer');
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = 'theme-selection-announcer';
    announcer.className = 'sr-only';
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    document.body.appendChild(announcer);
  }

  // Announce the selection
  announcer.textContent = `${themeConfig.displayName} theme selected. ${themeConfig.description}`;

  // Clear announcement after a delay
  setTimeout(() => {
    if (announcer) announcer.textContent = '';
  }, 3000);
}

// Enhanced screen reader announcements for theme changes
function announceThemeChange(themeName: string): void {
  // Create or get existing announcement element
  let announcer = document.getElementById('theme-announcer');
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = 'theme-announcer';
    announcer.className = 'sr-only';
    announcer.setAttribute('aria-live', 'assertive');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.setAttribute('role', 'status');
    document.body.appendChild(announcer);
  }

  // Enhanced announcement with context
  const systemTheme = themeManager?.currentSystemTheme || 'unknown';
  const currentMode = themeManager?.currentTheme || 'unknown';

  let announcement = `Theme changed to ${themeName}`;

  // Add system theme context for system mode
  if (currentMode === 'system') {
    announcement += `. Following system ${systemTheme} theme`;
  }

  // Add accessibility status
  const isHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (isHighContrast) {
    announcement += '. High contrast mode detected';
  }

  if (isReducedMotion) {
    announcement += '. Reduced motion preferences respected';
  }

  // Announce the theme change
  announcer.textContent = announcement;

  // Clear announcement after a delay
  setTimeout(() => {
    if (announcer) announcer.textContent = '';
  }, 4000);
}

// Theme preview functionality
function setupThemePreview(): void {
  const themeOptions = document.querySelectorAll('.theme-option') as NodeListOf<HTMLButtonElement>;

  themeOptions.forEach((button) => {
    if (!button) return;

    const isPressed = () => button.getAttribute('aria-pressed') === 'true';

    // Add preview on hover
    button.addEventListener('mouseenter', () => {
      if (!isPressed()) {
        const themeValue = button.dataset.theme as ThemeMode;
        showThemePreview(themeValue);
      }
    });

    // Remove preview on mouse leave
    button.addEventListener('mouseleave', () => {
      if (!isPressed()) {
        hideThemePreview();
      }
    });

    // Add keyboard preview support
    button.addEventListener('focus', () => {
      if (!isPressed()) {
        const themeValue = button.dataset.theme as ThemeMode;
        showThemePreview(themeValue);
      }
    });

    button.addEventListener('blur', () => {
      if (!isPressed()) {
        hideThemePreview();
      }
    });
  });
}

let previewTimeout: number | null = null;
let originalTheme: EffectiveTheme | null = null;

function showThemePreview(themeMode: ThemeMode): void {
  if (!themeManager) return;

  // Store original theme if not already stored
  if (originalTheme === null) {
    originalTheme = themeManager.getEffectiveTheme();
  }

  // Clear any existing preview timeout
  if (previewTimeout) {
    clearTimeout(previewTimeout);
  }

  // Apply preview theme after a short delay to avoid flickering
  previewTimeout = window.setTimeout(() => {
    const previewEffectiveTheme = resolvePreviewTheme(themeMode);
    applyThemePreview(previewEffectiveTheme);

    // Add preview indicator
    showPreviewIndicator(themeMode);
  }, 200);
}

function hideThemePreview(): void {
  if (previewTimeout) {
    clearTimeout(previewTimeout);
    previewTimeout = null;
  }

  if (originalTheme !== null && themeManager) {
    // Restore original theme
    applyThemePreview(originalTheme);
    originalTheme = null;

    // Hide preview indicator
    hidePreviewIndicator();
  }
}

function resolvePreviewTheme(themeMode: ThemeMode): EffectiveTheme {
  if (!themeManager) return 'figma-dark';

  switch (themeMode) {
    case 'system':
      const systemTheme = themeManager.currentSystemTheme;
      return systemTheme === 'dark' ? 'figma-dark' : 'figma-light';
    case 'light':
      return 'light';
    case 'dark':
      return 'figma-dark';
    case 'boilerplate':
      return 'boilerplate';
    case 'cybertron':
      return 'cybertron';
    default:
      return 'figma-dark';
  }
}

function applyThemePreview(effectiveTheme: EffectiveTheme): void {
  const htmlElement = document.documentElement;

  // Add preview class for different transition behavior
  htmlElement.classList.add('theme-previewing');

  // Apply the preview theme
  const resolvedTheme = resolveThemeAttribute(effectiveTheme);
  htmlElement.setAttribute('data-theme', resolvedTheme);
}

function showPreviewIndicator(themeMode: ThemeMode): void {
  // Create or get existing preview indicator
  let indicator = document.getElementById('theme-preview-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'theme-preview-indicator';
    indicator.className = 'theme-preview-indicator';
    document.body.appendChild(indicator);
  }

  const themeConfig = themeManager?.getThemeConfig(themeMode);
  const displayName = themeConfig?.displayName || themeMode;

  indicator.innerHTML = `
    <span class="preview-icon">👁️</span>
    <span class="preview-text">Previewing ${displayName}</span>
  `;

  indicator.classList.add('show');
}

function hidePreviewIndicator(): void {
  const indicator = document.getElementById('theme-preview-indicator');
  if (indicator) {
    indicator.classList.remove('show');
  }

  // Remove preview class
  document.documentElement.classList.remove('theme-previewing');
}

// Enhanced focus management during theme changes
function manageFocusDuringThemeChange(): void {
  const activeElement = document.activeElement as HTMLElement;

  if (activeElement && activeElement.tagName === 'INPUT' && activeElement.getAttribute('name') === 'theme') {
    // Store focus information
    const focusedThemeOption = activeElement.closest('.theme-option') as HTMLElement;

    if (focusedThemeOption) {
      // Add temporary focus indicator during theme transition
      focusedThemeOption.classList.add('theme-changing-focus');

      // Remove indicator after theme transition completes
      setTimeout(() => {
        focusedThemeOption.classList.remove('theme-changing-focus');

        // Ensure focus is maintained
        if (document.activeElement !== activeElement) {
          activeElement.focus();
        }
      }, 300); // Match theme transition duration
    }
  }
}

// Loading state management for theme changes
function showThemeLoadingState(): void {
  const settingsPanel = document.querySelector('.settings-panel') as HTMLElement;
  if (settingsPanel) {
    settingsPanel.classList.add('theme-loading');
  }
}

function hideThemeLoadingState(): void {
  const settingsPanel = document.querySelector('.settings-panel') as HTMLElement;
  if (settingsPanel) {
    settingsPanel.classList.remove('theme-loading');
  }
}

// Update theme-related components after theme changes
function updateThemeRelatedComponents(effectiveTheme: EffectiveTheme, themeMode: ThemeMode, isSystemTheme: boolean): void {
  // Update logo visibility based on theme
  updateLogoVisibility(effectiveTheme);

  // Update any theme-dependent animations or effects
  updateThemeAnimations(effectiveTheme);

  // Update accessibility attributes based on theme
  updateThemeAccessibility(effectiveTheme, isSystemTheme);
}

function updateLogoVisibility(effectiveTheme: EffectiveTheme): void {
  const darkLogos = document.querySelectorAll('.logo-dark');
  const lightLogos = document.querySelectorAll('.logo-light');

  // Determine if theme is dark or light
  // Dark themes: figma-dark, boilerplate, cybertron
  // Light themes: figma-light, light
  const isDarkTheme = effectiveTheme === 'figma-dark' || effectiveTheme === 'boilerplate' || effectiveTheme === 'cybertron';
  const isLightTheme = effectiveTheme === 'figma-light' || effectiveTheme === 'light';

  // Show dark logo on light themes, light logo on dark themes (for contrast)
  darkLogos.forEach((logo) => {
    (logo as HTMLElement).style.display = isLightTheme ? 'inline' : 'none';
  });

  lightLogos.forEach((logo) => {
    (logo as HTMLElement).style.display = isDarkTheme ? 'inline' : 'none';
  });


}

function updateThemeAnimations(effectiveTheme: EffectiveTheme): void {
  const body = document.body;

  // Add theme-specific animation classes
  body.classList.remove('theme-cybertron-effects', 'theme-light-effects', 'theme-dark-effects');

  switch (effectiveTheme) {
    case 'cybertron':
      body.classList.add('theme-cybertron-effects');
      break;
    case 'figma-light':
    case 'light':
      body.classList.add('theme-light-effects');
      break;
    case 'figma-dark':
    case 'boilerplate':
      body.classList.add('theme-dark-effects');
      break;
  }
}

function updateThemeAccessibility(effectiveTheme: EffectiveTheme, isSystemTheme: boolean): void {
  const htmlElement = document.documentElement;

  // Update high contrast mode support
  const isHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
  if (isHighContrast) {
    htmlElement.classList.add('high-contrast-mode');
    htmlElement.setAttribute('data-high-contrast', 'true');
  } else {
    htmlElement.classList.remove('high-contrast-mode');
    htmlElement.removeAttribute('data-high-contrast');
  }

  // Update reduced motion support
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isReducedMotion) {
    htmlElement.classList.add('reduced-motion');
    htmlElement.setAttribute('data-reduced-motion', 'true');
  } else {
    htmlElement.classList.remove('reduced-motion');
    htmlElement.removeAttribute('data-reduced-motion');
  }

  // Update forced colors support (Windows High Contrast mode)
  const isForcedColors = window.matchMedia('(forced-colors: active)').matches;
  if (isForcedColors) {
    htmlElement.classList.add('forced-colors-mode');
    htmlElement.setAttribute('data-forced-colors', 'true');
  } else {
    htmlElement.classList.remove('forced-colors-mode');
    htmlElement.removeAttribute('data-forced-colors');
  }

  // Update prefers-color-scheme support
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  htmlElement.setAttribute('data-prefers-color-scheme', prefersLight ? 'light' : 'dark');

  // Validate color contrast for current theme
  validateThemeContrast(effectiveTheme, isHighContrast);

  // Update color scheme meta tag for better browser integration
  updateColorSchemeMeta(effectiveTheme);

  // Update ARIA attributes for accessibility tools
  updateAccessibilityAttributes(effectiveTheme, isHighContrast, isReducedMotion);
}

// Color contrast validation for accessibility compliance
function validateThemeContrast(effectiveTheme: EffectiveTheme, isHighContrast: boolean): void {
  // Define minimum contrast ratios (WCAG AA standard)
  const minContrastRatio = isHighContrast ? 7.0 : 4.5; // AAA for high contrast, AA for normal

  // Get theme-specific contrast validation
  const contrastIssues: string[] = [];

  // Validate based on effective theme
  switch (effectiveTheme) {
    case 'figma-light':
      // Light theme should have dark text on light backgrounds
      if (!validateContrastRatio('#1e1e1e', '#ffffff', minContrastRatio)) {
        contrastIssues.push('Primary text contrast insufficient');
      }
      break;
    case 'figma-dark':
      // Dark theme should have light text on dark backgrounds  
      if (!validateContrastRatio('#ffffff', '#2c2c2c', minContrastRatio)) {
        contrastIssues.push('Primary text contrast insufficient');
      }
      break;
    case 'light':
      // Standalone light theme validation
      if (!validateContrastRatio('#1e1e1e', '#ffffff', minContrastRatio)) {
        contrastIssues.push('Primary text contrast insufficient');
      }
      break;
    case 'boilerplate':
    case 'cybertron':
      // Dark themes validation
      if (!validateContrastRatio('#f5f5f5', '#0f0f0f', minContrastRatio)) {
        contrastIssues.push('Primary text contrast insufficient');
      }
      break;
  }

  // Log contrast issues for debugging
  if (contrastIssues.length > 0) {
    console.warn(`⚠️ Accessibility: Contrast issues detected in ${effectiveTheme} theme:`, contrastIssues);
  }

  // Update accessibility status
  const htmlElement = document.documentElement;
  if (contrastIssues.length > 0) {
    htmlElement.setAttribute('data-contrast-issues', contrastIssues.join(', '));
  } else {
    htmlElement.removeAttribute('data-contrast-issues');
  }
}

// Simple contrast ratio calculation (approximation for validation)
function validateContrastRatio(foreground: string, background: string, minRatio: number): boolean {
  // This is a simplified validation - in a real implementation, you'd use a proper color contrast library
  // For now, we'll do basic validation based on known good combinations

  const lightOnDark = (foreground === '#ffffff' || foreground === '#f5f5f5') &&
    (background === '#2c2c2c' || background === '#0f0f0f' || background === '#0a0a0f');
  const darkOnLight = (foreground === '#1e1e1e' || foreground === '#000000') &&
    (background === '#ffffff' || background === '#f7f8f9');

  return lightOnDark || darkOnLight;
}

// Update accessibility attributes for assistive technologies
function updateAccessibilityAttributes(effectiveTheme: EffectiveTheme, isHighContrast: boolean, isReducedMotion: boolean): void {
  const htmlElement = document.documentElement;

  // Set theme information for assistive technologies
  htmlElement.setAttribute('data-theme-name', effectiveTheme);
  htmlElement.setAttribute('data-theme-type', effectiveTheme.includes('light') ? 'light' : 'dark');

  // Update main content accessibility
  const mainElement = document.querySelector('main');
  if (mainElement) {
    mainElement.setAttribute('aria-label', `Plugin interface using ${effectiveTheme} theme`);
  }

  // Update settings panel accessibility
  const settingsPanel = document.querySelector('.settings-panel');
  if (settingsPanel) {
    let settingsLabel = 'Plugin settings';
    if (isHighContrast) settingsLabel += ' (High contrast mode active)';
    if (isReducedMotion) settingsLabel += ' (Reduced motion active)';

    settingsPanel.setAttribute('aria-label', settingsLabel);
  }

  // Update theme selector accessibility
  const themeSelector = document.querySelector('.theme-selector');
  if (themeSelector) {
    themeSelector.setAttribute('role', 'radiogroup');
    themeSelector.setAttribute('aria-label', 'Theme selection');

    // Update individual theme options
    const themeButtons = themeSelector.querySelectorAll('.theme-option') as NodeListOf<HTMLButtonElement>;
    themeButtons.forEach((button, index) => {
      const themeValue = button.dataset.theme as ThemeMode;
      const themeConfig = themeManager?.getThemeConfig(themeValue);

      if (button && themeConfig) {
        // Enhanced aria-label with description
        button.setAttribute('aria-label', `${themeConfig.displayName}: ${themeConfig.description}`);

        // Add position information for screen readers
        button.setAttribute('aria-posinset', (index + 1).toString());
        button.setAttribute('aria-setsize', themeButtons.length.toString());
      }
    });
  }
}

function updateColorSchemeMeta(effectiveTheme: EffectiveTheme): void {
  let metaColorScheme = document.querySelector('meta[name="color-scheme"]') as HTMLMetaElement;

  if (!metaColorScheme) {
    metaColorScheme = document.createElement('meta');
    metaColorScheme.name = 'color-scheme';
    document.head.appendChild(metaColorScheme);
  }

  // Determine if theme is dark or light for meta color-scheme
  // Dark themes: figma-dark, boilerplate, cybertron
  // Light themes: figma-light, light
  const isDarkTheme = effectiveTheme === 'figma-dark' || effectiveTheme === 'boilerplate' || effectiveTheme === 'cybertron';
  const isLightTheme = effectiveTheme === 'figma-light' || effectiveTheme === 'light';

  metaColorScheme.content = isDarkTheme ? 'dark' : 'light';
}

// DOM Ready handling
function handleDOMReady(): void {
  console.log('📄 DOM ready, starting initialization sequence...');

  // Initialize plugin functionality (includes system theme detection)
  initializePlugin();

  // Setup all event listeners (includes theme switching)
  setupEventListeners();

  // Listen for messages from plugin
  window.addEventListener('message', handlePluginMessage);

  // Listen specifically for theme preference from backend
  window.addEventListener('message', (event: MessageEvent) => {
    const msg = (event.data && (event.data as any).pluginMessage) || null;
    if (!msg) return;
    if (msg.type === 'theme-preference') {
      if (themeManager && isThemeInitialized) {
        // Use the theme data directly from the backend
        const themeData = msg.theme;

        console.log('📥 Received theme preference from backend:', themeData);

        // Debug: Check system theme before loading preference
        if (themeManager) {
          const beforeDebug = themeManager.getDebugInfo();
          console.log('🔍 Theme state BEFORE loading preference:', beforeDebug);
        }

        // Log storage information for debugging
        if (msg.storageInfo) {
          if (!msg.storageInfo.success) {
            console.warn('Theme storage load failed:', msg.storageInfo.error);
          }
          if (msg.storageInfo.usedFallback) {
            console.info('Theme preference loaded from fallback storage');
          }
        }

        // Load and apply the saved preference (this will override system fallback)
        themeManager.loadThemePreference(themeData);

        // Ensure UI is updated to reflect the loaded preference
        updateThemeUI();

        // Debug: Check system theme after loading preference
        if (themeManager) {
          const afterDebug = themeManager.getDebugInfo();
          console.log('🔍 Theme state AFTER loading preference:', afterDebug);
        }

        console.log('✅ Theme preference loaded and applied');
      } else {
        console.warn('⚠️ Received theme preference but theme manager not ready');
      }
    }
  });

  // Update scroll behavior on window resize
  window.addEventListener('resize', () => {
    setTimeout(updateScrollBehavior, 100);
  });

  // Listen for system theme changes (for debugging and additional handling)
  window.addEventListener('systemThemeSync', (event: Event) => {
    const customEvent = event as CustomEvent;
    const { effectiveTheme, themeMode, systemTheme } = customEvent.detail;
    console.log(`🔄 System theme sync event: ${effectiveTheme} (mode: ${themeMode}, system: ${systemTheme})`);

    // Additional handling for system theme changes can be added here
    // For example, updating other UI elements that depend on theme
  });

  // Listen for theme change completion events
  window.addEventListener('themeChangeComplete', (event: Event) => {
    const customEvent = event as CustomEvent;
    const { effectiveTheme, themeMode, systemTheme, isSystemTheme } = customEvent.detail;
    console.log(`✅ Theme change complete: ${effectiveTheme} (mode: ${themeMode}, system: ${systemTheme})`);

    // Update any components that need to know about theme changes
    updateThemeRelatedComponents(effectiveTheme, themeMode, isSystemTheme);
  });

  // Listen for settings overlay open/close to manage theme preview cleanup
  const settingsOverlay = document.getElementById('settings-overlay');
  if (settingsOverlay) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'aria-hidden') {
          const isHidden = settingsOverlay.getAttribute('aria-hidden') === 'true';
          if (isHidden) {
            // Settings closed - cleanup any active preview
            hideThemePreview();
          }
        }
      });
    });

    observer.observe(settingsOverlay, { attributes: true });
  }

  // Cleanup theme manager on window unload
  window.addEventListener('beforeunload', () => {
    if (themeManager) {
      themeManager.destroy();
    }
  });

  // Reset footer button states on various events that might cause stuck states
  window.addEventListener('blur', resetFooterButtonStates);
  window.addEventListener('focus', resetFooterButtonStates);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      setTimeout(resetFooterButtonStates, 100);
    }
  });

  // Periodic cleanup to prevent stuck states (every 2 seconds)
  const footerCleanupInterval = setInterval(() => {
    const footerButtons = document.querySelectorAll('.footer-icon-btn');
    footerButtons.forEach((button) => {
      const btn = button as HTMLElement;
      // Only reset if not currently being interacted with
      if (!btn.matches(':hover') && !btn.matches(':focus') && !btn.matches(':active')) {
        btn.classList.remove('hover-active');
        btn.style.removeProperty('background');
        btn.style.removeProperty('color');
        btn.style.removeProperty('transform');
      }
    });
  }, 2000);
  activeTimers.add(footerCleanupInterval);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', handleDOMReady);
} else {
  handleDOMReady();
}

// ===== PERFORMANCE MONITORING AND OPTIMIZATION =====

// Performance monitoring for theme system
let themePerformanceMetrics = {
  themeChanges: 0,
  totalThemeChangeTime: 0,
  averageThemeChangeTime: 0,
  lastThemeChangeTime: 0,
  slowThemeChanges: 0, // Changes taking > 100ms
  cacheHits: 0,
  cacheMisses: 0
};

function initializeThemePerformanceMonitoring(): void {
  // Monitor theme change performance
  if (themeManager) {
    const originalApplyTheme = applyTheme;

    // Wrap applyTheme with performance monitoring
    (window as any).applyTheme = function (effectiveTheme: EffectiveTheme, skipTransition = false) {
      const startTime = performance.now();

      try {
        const result = originalApplyTheme.call(this, effectiveTheme);

        const endTime = performance.now();
        const duration = endTime - startTime;

        // Update metrics
        themePerformanceMetrics.themeChanges++;
        themePerformanceMetrics.totalThemeChangeTime += duration;
        themePerformanceMetrics.averageThemeChangeTime =
          themePerformanceMetrics.totalThemeChangeTime / themePerformanceMetrics.themeChanges;
        themePerformanceMetrics.lastThemeChangeTime = duration;

        if (duration > 100) {
          themePerformanceMetrics.slowThemeChanges++;
          console.warn(`Slow theme change detected: ${duration.toFixed(2)}ms for theme ${effectiveTheme}`);
        }

        // Log performance metrics periodically
        if (themePerformanceMetrics.themeChanges % 10 === 0) {
          console.log('Theme Performance Metrics:', {
            changes: themePerformanceMetrics.themeChanges,
            averageTime: `${themePerformanceMetrics.averageThemeChangeTime.toFixed(2)}ms`,
            slowChanges: themePerformanceMetrics.slowThemeChanges,
            lastChange: `${themePerformanceMetrics.lastThemeChangeTime.toFixed(2)}ms`
          });
        }

        return result;
      } catch (error) {
        console.error('Theme application error:', error);
        throw error;
      }
    };
  }

  // Monitor memory usage periodically with tiered thresholds
  if ('memory' in performance) {
    const memoryMonitorInterval = setInterval(() => {
      const memInfo = (performance as any).memory;
      const usedMB = memInfo.usedJSHeapSize / (1024 * 1024);
      const limitMB = memInfo.jsHeapSizeLimit / (1024 * 1024);
      const usagePercent = (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100;
      
      // Memory usage guidelines for Figma plugins:
      // Normal: < 50% of heap limit (~2000MB on 4GB heap)
      // Warning: 50-70% (indicates possible leak, should investigate)
      // Critical: > 70% (likely memory leak, may cause crashes)
      
      if (usagePercent > 70) {
        console.error('🚨 CRITICAL memory usage:', {
          used: `${usedMB.toFixed(2)}MB`,
          limit: `${limitMB.toFixed(2)}MB`,
          percentage: `${usagePercent.toFixed(1)}%`,
          status: 'Critical - possible memory leak!'
        });
      } else if (usagePercent > 50) {
        console.warn('⚠️ High memory usage detected:', {
          used: `${usedMB.toFixed(2)}MB`,
          limit: `${limitMB.toFixed(2)}MB`,
          percentage: `${usagePercent.toFixed(1)}%`,
          status: 'Warning - monitor closely'
        });
      }
      // Below 50% is considered normal, no warnings
    }, 30000); // Check every 30 seconds
    activeTimers.add(memoryMonitorInterval);
  }
}

// Cleanup handlers for memory management
function setupCleanupHandlers(): void {
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    console.log('🧹 Cleaning up theme system resources...');

    // Destroy theme manager
    if (themeManager) {
      themeManager.destroy();
    }

    // Destroy all Lottie animations
    destroyAllLottieAnimations();

    // Clear any remaining timers
    clearAllTimers();

    // Remove event listeners
    removeAllEventListeners();

    console.log('✅ Cleanup complete');
  });

  // Cleanup on visibility change (when tab becomes hidden)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Pause non-essential operations when tab is hidden
      pauseNonEssentialOperations();
    } else {
      // Resume operations when tab becomes visible
      resumeNonEssentialOperations();
    }
  });
}

// Timer management for cleanup
const activeTimers = new Set<ReturnType<typeof setTimeout>>();
const originalSetTimeout = window.setTimeout;
const originalSetInterval = window.setInterval;

// Override setTimeout to track timers
(window as any).setTimeout = function (callback: TimerHandler, delay?: number, ...args: any[]): ReturnType<typeof setTimeout> {
  const timerId = originalSetTimeout.call(window, (...callbackArgs: any[]) => {
    activeTimers.delete(timerId);
    if (typeof callback === 'function') {
      callback.apply(this, callbackArgs);
    }
  }, delay || 0);
  activeTimers.add(timerId);
  return timerId;
};

// Override setInterval to track timers
(window as any).setInterval = function (callback: TimerHandler, delay?: number, ...args: any[]): ReturnType<typeof setInterval> {
  const timerId = originalSetInterval.call(window, (...callbackArgs: any[]) => {
    if (typeof callback === 'function') {
      callback.apply(this, callbackArgs);
    }
  }, delay || 0);
  activeTimers.add(timerId);
  return timerId;
};

function clearAllTimers(): void {
  activeTimers.forEach(timerId => {
    clearTimeout(timerId);
    clearInterval(timerId);
  });
  activeTimers.clear();
}

// Event listener management
// DISABLED: Overriding EventTarget.prototype can interfere with Figma's internal event handling
// This was causing styleq errors in Figma's UI framework
const activeEventListeners = new Map<EventTarget, Array<{
  type: string;
  listener: EventListener;
  options?: boolean | AddEventListenerOptions;
}>>();

/* COMMENTED OUT TO AVOID CONFLICTS WITH FIGMA'S EVENT HANDLING
const originalAddEventListener = EventTarget.prototype.addEventListener;
const originalRemoveEventListener = EventTarget.prototype.removeEventListener;

// Override addEventListener to track listeners
EventTarget.prototype.addEventListener = function (
  type: string,
  listener: EventListener,
  options?: boolean | AddEventListenerOptions
) {
  if (!activeEventListeners.has(this)) {
    activeEventListeners.set(this, []);
  }
  activeEventListeners.get(this)!.push({ type, listener, options });
  return originalAddEventListener.call(this, type, listener, options);
};

// Override removeEventListener to untrack listeners
EventTarget.prototype.removeEventListener = function (
  type: string,
  listener: EventListener,
  options?: boolean | EventListenerOptions
) {
  const listeners = activeEventListeners.get(this);
  if (listeners) {
    const index = listeners.findIndex(l => l.type === type && l.listener === listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }
  return originalRemoveEventListener.call(this, type, listener, options);
};
*/

function removeAllEventListeners(): void {
  // Since we're not tracking listeners anymore, this is a no-op
  // Keep function for backward compatibility
  console.log('Event listener cleanup skipped (prototype override disabled)');
  /* ORIGINAL CODE COMMENTED OUT
  activeEventListeners.forEach((listeners, target) => {
    listeners.forEach(({ type, listener, options }) => {
      try {
        originalRemoveEventListener.call(target, type, listener, options);
      } catch (error) {
        console.warn('Error removing event listener:', error);
      }
    });
  });
  activeEventListeners.clear();
  */
}

// Performance optimization: pause/resume operations
let nonEssentialOperationsPaused = false;

function pauseNonEssentialOperations(): void {
  if (nonEssentialOperationsPaused) return;

  nonEssentialOperationsPaused = true;
  console.log('⏸️ Pausing non-essential operations (tab hidden)');

  // Pause Lottie animations
  activeLottieAnimations.forEach((animation) => {
    if (animation.isPaused === false) {
      animation.pause();
    }
  });

  // Reduce update frequency for scroll behavior
  const scrollUpdateInterval = setInterval(updateScrollBehavior, 1000); // Reduce to 1s
  activeTimers.add(scrollUpdateInterval);
}

function resumeNonEssentialOperations(): void {
  if (!nonEssentialOperationsPaused) return;

  nonEssentialOperationsPaused = false;
  console.log('▶️ Resuming non-essential operations (tab visible)');

  // Resume Lottie animations
  activeLottieAnimations.forEach((animation) => {
    if (animation.isPaused === true) {
      animation.play();
    }
  });

  // Restore normal update frequency
  updateScrollBehavior();
}

// CSS optimization: efficient theme variable inheritance
function optimizeThemeVariableInheritance(): void {
  // Create a style element for dynamic theme optimizations
  const optimizationStyle = document.createElement('style');
  optimizationStyle.id = 'theme-optimization-styles';

  // Add CSS that optimizes theme variable inheritance
  optimizationStyle.textContent = `
    /* Performance optimization: reduce CSS custom property lookups */
    .theme-optimized {
      /* Pre-calculate commonly used theme combinations */
      --optimized-border: 1px solid var(--theme-border-primary);
      --optimized-hover-bg: var(--theme-bg-hover);
      --optimized-text-color: var(--theme-text-primary);
      --optimized-transition: background-color 150ms ease-out, border-color 150ms ease-out;
    }
    
    /* Optimize frequently used button styles */
    .theme-optimized .btn-base {
      background: var(--optimized-hover-bg);
      border: var(--optimized-border);
      color: var(--optimized-text-color);
      transition: var(--optimized-transition);
    }
    
    /* Use contain property to limit style recalculation scope */
    .theme-container {
      contain: layout style;
    }
    
    /* Optimize for GPU acceleration on theme changes */
    .theme-gpu-optimized {
      transform: translateZ(0);
      backface-visibility: hidden;
      perspective: 1000px;
    }
  `;

  document.head.appendChild(optimizationStyle);

  // Apply optimization classes to relevant elements
  document.documentElement.classList.add('theme-optimized');
  document.body.classList.add('theme-container', 'theme-gpu-optimized');
}

// Initialize CSS optimizations
document.addEventListener('DOMContentLoaded', () => {
  optimizeThemeVariableInheritance();
});

// Export performance metrics for debugging
(window as any).getThemePerformanceMetrics = () => themePerformanceMetrics;
(window as any).resetThemePerformanceMetrics = () => {
  themePerformanceMetrics = {
    themeChanges: 0,
    totalThemeChangeTime: 0,
    averageThemeChangeTime: 0,
    lastThemeChangeTime: 0,
    slowThemeChanges: 0,
    cacheHits: 0,
    cacheMisses: 0
  };
};

// Export theme debugging functions
(window as any).debugTheme = () => {
  if (!themeManager) {
    console.log('❌ Theme manager not initialized');
    return;
  }

  console.log('=== Theme Debug Info ===');
  const debugInfo = themeManager.getDebugInfo();
  console.log('Theme Mode:', debugInfo.currentThemeMode);
  console.log('System Theme:', debugInfo.systemTheme);
  console.log('Effective Theme:', debugInfo.effectiveTheme);
  console.log('Media Query Matches (dark):', debugInfo.mediaQueryMatches);
  console.log('Cache Valid:', debugInfo.cacheValid);

  // Check actual media query
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  console.log('Direct Media Query Check:', mediaQuery.matches);

  // Check HTML attribute
  const htmlTheme = document.documentElement.getAttribute('data-theme');
  console.log('HTML data-theme:', htmlTheme);

  console.log('=== End Debug ===');

  return debugInfo;
};

// Export theme manager for debugging (will be set after initialization)
if (typeof window !== 'undefined') {
  (window as any).getThemeManager = () => themeManager;
}

// CONTROLS SECTION

// Navigation context state
let navigationContext: NavigationContext = {
  hasSelection: false,
  canEnter: false,
  canExit: false,
  canNavigateSiblings: false,
  containerCount: 0,
  siblingContainerCount: 0,
  hasCollapsibleSiblings: false,
  hasComponentInstance: false
};

// Controls section setting state
let controlsEnabled = true;

// Per-group visibility state
let groupMovementZoomVisible = true;
let groupHierarchyVisible = true;
let groupSizingModesVisible = true;
let groupStyledTextVisible = false;

// Nudge settings (user-configurable)
let smallNudgeAmount = 1;
let bigNudgeAmount = 8;

// Update control button states based on context
function updateControlButtons(context: NavigationContext): void {
  const enterBtn = document.getElementById('nav-enter') as HTMLButtonElement;
  const exitBtn = document.getElementById('nav-exit') as HTMLButtonElement;
  const prevBtn = document.getElementById('nav-prev') as HTMLButtonElement;
  const nextBtn = document.getElementById('nav-next') as HTMLButtonElement;
  const collapseBtn = document.getElementById('nav-collapse') as HTMLButtonElement;
  // const gotoComponentBtn = document.getElementById('nav-goto-component') as HTMLButtonElement; // Button removed from UI

  if (enterBtn) {
    const canEnter = context.canEnter;
    const isPageMode = !context.hasSelection;
    const wasDisabled = enterBtn.disabled;

    enterBtn.disabled = !canEnter;

    if (isPageMode && canEnter) {
      // Page mode - entering page means selecting first layer
      enterBtn.setAttribute('aria-label', 'Enter page (Enter)');
      const labelElement = enterBtn.querySelector('.nav-label');
      if (labelElement) {
        labelElement.textContent = 'Enter';
      }
      const descElement = document.getElementById('nav-enter-desc');
      if (descElement) {
        descElement.textContent = 'Select first layer on page';
      }
    } else if (!isPageMode && canEnter) {
      // Layer mode - entering container
      enterBtn.setAttribute('aria-label', 'Expand container (Enter)');
      const labelElement = enterBtn.querySelector('.nav-label');
      if (labelElement) {
        labelElement.textContent = 'Expand';
      }
      const descElement = document.getElementById('nav-enter-desc');
      if (descElement) {
        descElement.textContent = 'Select all children of container and focus view';
      }
    } else {
      // Disabled state
      const disabledLabel = isPageMode ? 'Enter page (Enter) - no layers on page' : 'Expand container (Enter) - no container selected';
      enterBtn.setAttribute('aria-label', disabledLabel);
      const labelElement = enterBtn.querySelector('.nav-label');
      if (labelElement) {
        labelElement.textContent = isPageMode ? 'Enter' : 'Expand';
      }
      const descElement = document.getElementById('nav-enter-desc');
      if (descElement) {
        descElement.textContent = isPageMode ? 'No layers available on current page' : 'No container selected to expand';
      }
    }
  }

  if (exitBtn) {
    const canExit = context.canExit;
    exitBtn.disabled = !canExit;
    // Determine if we're at root level by checking if we can exit but have no sibling containers
    // This heuristic works because root level items typically don't have sibling containers in the same way
    const isLikelyRootLevel = context.hasSelection && context.canExit && context.siblingContainerCount === 0;
    
    const exitLabel = canExit ? 
      (isLikelyRootLevel ? 'Exit ↑ (Shift+Enter)' : 'Exit (Shift+Enter)') : 
      'Exit (Shift+Enter) - no parent available';
    
    exitBtn.setAttribute('aria-label', exitLabel);
    
    // Also update the visible button label
    const labelElement = exitBtn.querySelector('.nav-label');
    if (labelElement) {
      labelElement.textContent = isLikelyRootLevel ? 'Exit ↑' : 'Exit';
    }

    const descElement = document.getElementById('nav-exit-desc');
    if (descElement) {
      descElement.textContent = canExit ?
        'Move selection to parent container' :
        'No parent container available';
    }
  }

  if (prevBtn) {
    const canNavigate = context.canNavigateSiblings;
    const isPageMode = !context.hasSelection;

    prevBtn.disabled = !canNavigate;

    // Update visible label (icon is already set in HTML as SVG image)
    const labelElement = prevBtn.querySelector('.nav-label');
    if (labelElement) {
      labelElement.textContent = isPageMode ? 'Up' : 'Up';
    }

    if (isPageMode && canNavigate) {
      // Page navigation mode
      prevBtn.setAttribute('aria-label', 'Previous page');
      const descElement = document.getElementById('nav-prev-desc');
      if (descElement) {
        descElement.textContent = 'Navigate to previous page';
      }
    } else if (!isPageMode && canNavigate) {
      // Layer navigation mode
      prevBtn.setAttribute('aria-label', 'Previous sibling');
      const descElement = document.getElementById('nav-prev-desc');
      if (descElement) {
        descElement.textContent = 'Select previous sibling layer (up in layers panel)';
      }
    } else {
      // Disabled state
      const disabledLabel = isPageMode ? 'Previous page - only one page' : 'Previous sibling - no siblings available';
      prevBtn.setAttribute('aria-label', disabledLabel);
      const descElement = document.getElementById('nav-prev-desc');
      if (descElement) {
        descElement.textContent = isPageMode ? 'Only one page in document' : 'No sibling layers available';
      }
    }
  }

  if (nextBtn) {
    const canNavigate = context.canNavigateSiblings;
    const isPageMode = !context.hasSelection;

    nextBtn.disabled = !canNavigate;

    // Update visible label (icon is already set in HTML as SVG image)
    const labelElement = nextBtn.querySelector('.nav-label');
    if (labelElement) {
      labelElement.textContent = isPageMode ? 'Down' : 'Down';
    }

    if (isPageMode && canNavigate) {
      // Page navigation mode
      nextBtn.setAttribute('aria-label', 'Next page');
      const descElement = document.getElementById('nav-next-desc');
      if (descElement) {
        descElement.textContent = 'Navigate to next page';
      }
    } else if (!isPageMode && canNavigate) {
      // Layer navigation mode
      nextBtn.setAttribute('aria-label', 'Next sibling');
      const descElement = document.getElementById('nav-next-desc');
      if (descElement) {
        descElement.textContent = 'Select next sibling layer (down in layers panel)';
      }
    } else {
      // Disabled state
      const disabledLabel = isPageMode ? 'Next page - only one page' : 'Next sibling - no siblings available';
      nextBtn.setAttribute('aria-label', disabledLabel);
      const descElement = document.getElementById('nav-next-desc');
      if (descElement) {
        descElement.textContent = isPageMode ? 'Only one page in document' : 'No sibling layers available';
      }
    }
  }

  if (collapseBtn) {
    // Use existing logic but also consider if selection has collapsible items
    // For now, keep the existing behavior - we'll improve this by modifying containerCount calculation
    const hasContainers = context.containerCount > 0;
    collapseBtn.disabled = !hasContainers;
    const label = hasContainers ?
      `Toggle collapse ${context.containerCount} containers (Alt+L)` :
      'Toggle collapse (Alt+L) - no containers on page';
    collapseBtn.setAttribute('aria-label', label);

    const descElement = document.getElementById('nav-collapse-desc');
    if (descElement) {
      descElement.textContent = hasContainers ?
        `Collapse selected containers, or ${context.containerCount} containers if none selected` :
        'No containers available on current page';
    }
  }

  /* Button removed from UI
  if (gotoComponentBtn) {
    // Check if current selection contains component instances
    // This will be determined by the plugin and sent via context
    const hasComponentInstance = (context as any).hasComponentInstance || false;
    gotoComponentBtn.disabled = !hasComponentInstance;
    
    const label = hasComponentInstance ?
      'Go to main component' :
      'Go to main component - no component instance selected';
    gotoComponentBtn.setAttribute('aria-label', label);

    const descElement = document.getElementById('nav-goto-component-desc');
    if (descElement) {
      descElement.textContent = hasComponentInstance ?
        'Navigate to the main component of selected instance' :
        'Select a component instance to navigate to its main component';
    }
  }
  */

  // Update delete button - enable when elements are selected
  const deleteBtn = document.getElementById('nav-delete') as HTMLButtonElement;
  if (deleteBtn) {
    const hasSelection = context.hasSelection;
    deleteBtn.disabled = !hasSelection;
    
    const label = hasSelection ?
      'Delete selected nodes' :
      'Delete selected nodes - no selection';
    deleteBtn.setAttribute('aria-label', label);

    const descElement = document.getElementById('nav-delete-desc');
    if (descElement) {
      descElement.textContent = hasSelection ?
        'Delete currently selected nodes' :
        'Select nodes to delete them';
    }
  }

  // Update arrow key buttons - enable when elements are selected (for nudging/moving on canvas)
  const arrowUpBtn = document.getElementById('arrow-up') as HTMLButtonElement;
  const arrowDownBtn = document.getElementById('arrow-down') as HTMLButtonElement;
  const arrowLeftBtn = document.getElementById('arrow-left') as HTMLButtonElement;
  const arrowRightBtn = document.getElementById('arrow-right') as HTMLButtonElement;

  const hasSelection = context.hasSelection;

  if (arrowUpBtn) {
    arrowUpBtn.disabled = !hasSelection;
  }

  if (arrowDownBtn) {
    arrowDownBtn.disabled = !hasSelection;
  }

  if (arrowLeftBtn) {
    arrowLeftBtn.disabled = !hasSelection;
  }

  if (arrowRightBtn) {
    arrowRightBtn.disabled = !hasSelection;
  }

  // Zoom to selection button is always enabled - zooms to selection or all page content
  const zoomSelectionBtn = document.getElementById('zoom-selection') as HTMLButtonElement;
  if (zoomSelectionBtn) {
    zoomSelectionBtn.disabled = false;
  }

  // Update layer ordering buttons - enable when elements are selected
  const layerUpBtn = document.getElementById('layer-up') as HTMLButtonElement;
  const layerDownBtn = document.getElementById('layer-down') as HTMLButtonElement;

  if (layerUpBtn) {
    layerUpBtn.disabled = !hasSelection;
  }

  if (layerDownBtn) {
    layerDownBtn.disabled = !hasSelection;
  }

  // Update hide/lock buttons - enable when elements are selected
  const hideBtn = document.getElementById('nav-hide') as HTMLButtonElement;
  const lockBtn = document.getElementById('nav-lock') as HTMLButtonElement;

  if (hideBtn) {
    hideBtn.disabled = !hasSelection;
  }

  if (lockBtn) {
    lockBtn.disabled = !hasSelection;
  }
}

// Update controls section visibility based on setting
function updateControlsVisibility(enabled: boolean): void {
  const controlsSection = document.getElementById('controls-section');
  const controlsHeader = document.getElementById('controls-header');
  const controlsToggle = document.getElementById('controls-toggle') as HTMLInputElement;
  const groupTogglesContainer = document.getElementById('controls-group-toggles');

  if (controlsSection && controlsHeader) {
    if (enabled) {
      controlsSection.style.display = '';
      controlsHeader.style.display = '';
    } else {
      controlsSection.style.display = 'none';
      controlsHeader.style.display = 'none';
    }
  }

  // Sync the master toggle checkbox
  if (controlsToggle) {
    controlsToggle.checked = enabled;
  }

  // Enable/disable sub-toggles based on master toggle
  if (groupTogglesContainer) {
    if (enabled) {
      groupTogglesContainer.classList.remove('disabled');
    } else {
      groupTogglesContainer.classList.add('disabled');
    }
  }

  // Apply per-group visibility when master is enabled
  if (enabled) {
    applyGroupVisibility();
  }
}

// Apply per-group visibility within the controls section
function applyGroupVisibility(): void {
  const movementZoomGroup = document.getElementById('movement-zoom-group');
  const hierarchyGroup = document.getElementById('hierarchy-group');
  const sizingModesGroup = document.getElementById('sizing-modes-group');
  const styledTextGroup = document.getElementById('styled-text-group');

  if (movementZoomGroup) {
    movementZoomGroup.style.display = groupMovementZoomVisible ? '' : 'none';
  }
  if (hierarchyGroup) {
    hierarchyGroup.style.display = groupHierarchyVisible ? '' : 'none';
  }
  if (sizingModesGroup) {
    sizingModesGroup.style.display = groupSizingModesVisible ? '' : 'none';
  }
  if (styledTextGroup) {
    styledTextGroup.style.display = groupStyledTextVisible ? '' : 'none';
  }
}

// Update the group toggle checkboxes to reflect current state
function updateGroupTogglesUI(): void {
  const toggleMovementZoom = document.getElementById('toggle-movement-zoom') as HTMLInputElement;
  const toggleHierarchy = document.getElementById('toggle-hierarchy') as HTMLInputElement;
  const toggleSizingModes = document.getElementById('toggle-sizing-modes') as HTMLInputElement;
  const toggleStyledText = document.getElementById('toggle-styled-text') as HTMLInputElement;

  if (toggleMovementZoom) toggleMovementZoom.checked = groupMovementZoomVisible;
  if (toggleHierarchy) toggleHierarchy.checked = groupHierarchyVisible;
  if (toggleSizingModes) toggleSizingModes.checked = groupSizingModesVisible;
  if (toggleStyledText) toggleStyledText.checked = groupStyledTextVisible;
}

// Accessibility preferences detection and handling
function setupAccessibilitySupport(): void {
  // Detect and respond to reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const handleReducedMotionChange = (e: MediaQueryListEvent) => {
    document.documentElement.setAttribute('data-reduced-motion', e.matches.toString());
    console.log('Reduced motion preference changed:', e.matches);
  };

  // Set initial state
  document.documentElement.setAttribute('data-reduced-motion', prefersReducedMotion.matches.toString());

  // Listen for changes
  if (prefersReducedMotion.addEventListener) {
    prefersReducedMotion.addEventListener('change', handleReducedMotionChange);
  } else {
    // Fallback for older browsers
    prefersReducedMotion.addListener(handleReducedMotionChange);
  }

  // Detect and respond to high contrast preference
  const prefersHighContrast = window.matchMedia('(prefers-contrast: high)');
  const handleHighContrastChange = (e: MediaQueryListEvent) => {
    document.documentElement.setAttribute('data-high-contrast', e.matches.toString());
    console.log('High contrast preference changed:', e.matches);
  };

  // Set initial state
  document.documentElement.setAttribute('data-high-contrast', prefersHighContrast.matches.toString());

  // Listen for changes
  if (prefersHighContrast.addEventListener) {
    prefersHighContrast.addEventListener('change', handleHighContrastChange);
  } else {
    // Fallback for older browsers
    prefersHighContrast.addListener(handleHighContrastChange);
  }

  // Detect forced colors mode (Windows High Contrast)
  const forcedColors = window.matchMedia('(forced-colors: active)');
  const handleForcedColorsChange = (e: MediaQueryListEvent) => {
    document.documentElement.setAttribute('data-forced-colors', e.matches.toString());
    console.log('Forced colors mode changed:', e.matches);

    // Adjust navigation announcements for high contrast users
    if (e.matches) {
      // More verbose announcements for high contrast users
      enhanceScreenReaderAnnouncements(true);
    } else {
      enhanceScreenReaderAnnouncements(false);
    }
  };

  // Set initial state
  document.documentElement.setAttribute('data-forced-colors', forcedColors.matches.toString());

  // Listen for changes
  if (forcedColors.addEventListener) {
    forcedColors.addEventListener('change', handleForcedColorsChange);
  } else {
    // Fallback for older browsers
    forcedColors.addListener(handleForcedColorsChange);
  }
}

// Enhanced screen reader announcements for accessibility
function enhanceScreenReaderAnnouncements(enhanced: boolean): void {
  // Store the preference for use in announcement functions
  (window as any).enhancedAnnouncements = enhanced;
}

// Setup controls event listeners
function setupControls(): void {
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

  // Add keyboard navigation support
  if (controlsGrid) {
    setupControlsKeyboardSupport(controlsGrid as HTMLElement);
  }

  if (arrowKeysGrid) {
    setupControlsKeyboardSupport(arrowKeysGrid as HTMLElement);
  }
}

// Keyboard navigation support for controls grid
function setupControlsKeyboardSupport(controlsGrid: HTMLElement): void {
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
function announceButtonState(button: HTMLButtonElement): void {
  const isDisabled = button.disabled;
  const shortcut = button.dataset.shortcut || '';
  const buttonId = button.id;
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
}

// Announce navigation action results
function announceNavigationResult(result: { success: boolean; message: string }): void {
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
function updateButtonStateWithAnnouncement(button: HTMLButtonElement, enabled: boolean, reason?: string): void {
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

// Setup controls settings
function setupControlsSettings(): void {
  const controlsToggle = document.getElementById('controls-toggle') as HTMLInputElement;

  if (controlsToggle) {
    controlsToggle.addEventListener('change', () => {
      const enabled = controlsToggle.checked;
      console.log('Controls setting changed:', enabled);
      sendMessage('toggle-controls', { enabled });
    });
  }

  // Per-group visibility toggles
  setupGroupToggle('toggle-movement-zoom', 'movementZoom');
  setupGroupToggle('toggle-hierarchy', 'hierarchy');
  setupGroupToggle('toggle-sizing-modes', 'sizingModes');
  setupGroupToggle('toggle-styled-text', 'styledText');
}

// Setup a single group visibility toggle
function setupGroupToggle(toggleId: string, groupKey: string): void {
  const toggle = document.getElementById(toggleId) as HTMLInputElement;
  if (toggle) {
    toggle.addEventListener('change', () => {
      const visible = toggle.checked;
      // Update local state
      switch (groupKey) {
        case 'movementZoom': groupMovementZoomVisible = visible; break;
        case 'hierarchy': groupHierarchyVisible = visible; break;
        case 'sizingModes': groupSizingModesVisible = visible; break;
        case 'styledText': groupStyledTextVisible = visible; break;
      }
      applyGroupVisibility();
      // Persist via plugin
      sendMessage('set-controls-group-visibility', {
        groups: {
          movementZoom: groupMovementZoomVisible,
          hierarchy: groupHierarchyVisible,
          sizingModes: groupSizingModesVisible,
          styledText: groupStyledTextVisible
        }
      });
    });
  }
}

// Setup nudge settings
function setupNudgeSettings(): void {
  const smallNudgeInput = document.getElementById('small-nudge-input') as HTMLInputElement;
  const bigNudgeInput = document.getElementById('big-nudge-input') as HTMLInputElement;

  if (smallNudgeInput) {
    smallNudgeInput.addEventListener('change', () => {
      const value = parseInt(smallNudgeInput.value, 10);
      if (!isNaN(value) && value >= 1 && value <= 100) {
        smallNudgeAmount = value;
        sendMessage('set-nudge-settings', { smallNudge: smallNudgeAmount, bigNudge: bigNudgeAmount });
      } else {
        // Reset to current value if invalid
        smallNudgeInput.value = String(smallNudgeAmount);
      }
    });
  }

  if (bigNudgeInput) {
    bigNudgeInput.addEventListener('change', () => {
      const value = parseInt(bigNudgeInput.value, 10);
      if (!isNaN(value) && value >= 1 && value <= 100) {
        bigNudgeAmount = value;
        sendMessage('set-nudge-settings', { smallNudge: smallNudgeAmount, bigNudge: bigNudgeAmount });
      } else {
        // Reset to current value if invalid
        bigNudgeInput.value = String(bigNudgeAmount);
      }
    });
  }
}

// Update nudge settings UI from plugin storage
function updateNudgeSettingsUI(small: number, big: number): void {
  smallNudgeAmount = small;
  bigNudgeAmount = big;

  const smallNudgeInput = document.getElementById('small-nudge-input') as HTMLInputElement;
  const bigNudgeInput = document.getElementById('big-nudge-input') as HTMLInputElement;

  if (smallNudgeInput) {
    smallNudgeInput.value = String(small);
  }
  if (bigNudgeInput) {
    bigNudgeInput.value = String(big);
  }
}

// Initialize controls
// ===== STYLED TEXT =====

function parseColor(str: string): { r: number; g: number; b: number } | undefined {
  const s = str.trim();
  const rgb = s.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgb) {
    return { r: parseInt(rgb[1]) / 255, g: parseInt(rgb[2]) / 255, b: parseInt(rgb[3]) / 255 };
  }
  const hex = s.match(/^#([0-9a-fA-F]{3,6})$/);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    const n = parseInt(h, 16);
    return { r: ((n >> 16) & 0xff) / 255, g: ((n >> 8) & 0xff) / 255, b: (n & 0xff) / 255 };
  }
  return undefined;
}

interface StyledTextSegment {
  characters: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
  color?: { r: number; g: number; b: number };
  link?: string;
}

function parseHTMLToSegments(html: string): StyledTextSegment[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const segments: StyledTextSegment[] = [];

  interface InheritedStyle {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    fontSize?: number;
    color?: { r: number; g: number; b: number };
    link?: string;
  }

  function walkNode(node: Node, style: InheritedStyle): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (text) {
        segments.push({ characters: text, ...style });
      }
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    // Block elements → prepend newline (if segments already exist)
    if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li'].includes(tag)) {
      if (segments.length > 0) {
        segments.push({ characters: '\n', ...style });
      }
    }
    if (tag === 'br') {
      segments.push({ characters: '\n', ...style });
      return;
    }

    // Inherit and override style
    const next: InheritedStyle = { ...style };

    if (tag === 'b' || tag === 'strong') next.bold = true;
    if (tag === 'i' || tag === 'em') next.italic = true;
    if (tag === 'u') next.underline = true;
    if (tag === 'li') { segments.push({ characters: '• ', ...next }); }
    if (tag === 'a') {
      next.link = el.getAttribute('href') || undefined;
    }
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
      next.bold = true;
      const sizes: Record<string, number> = { h1: 32, h2: 24, h3: 20, h4: 18, h5: 16, h6: 14 };
      next.fontSize = sizes[tag];
    }

    // Inline CSS
    const inlineStyle = el.style;
    if (inlineStyle) {
      if (/^(bold|[6-9]\d{2})$/.test(inlineStyle.fontWeight)) next.bold = true;
      if (inlineStyle.fontStyle === 'italic') next.italic = true;
      if (inlineStyle.textDecoration?.includes('underline')) next.underline = true;
      if (inlineStyle.fontSize) {
        const px = parseFloat(inlineStyle.fontSize);
        if (!isNaN(px)) next.fontSize = Math.round(px);
      }
      if (inlineStyle.color) {
        const c = parseColor(inlineStyle.color);
        if (c) next.color = c;
      }
    }

    for (const child of Array.from(el.childNodes)) {
      walkNode(child, next);
    }
  }

  walkNode(doc.body, { bold: false, italic: false, underline: false });

  // Trim leading/trailing blank segments
  while (segments.length > 0 && segments[0].characters.trim() === '') segments.shift();
  while (segments.length > 0 && segments[segments.length - 1].characters.trim() === '') segments.pop();

  return segments;
}

function updateStyledTextButtons(hasTextNode: boolean): void {
  const copyBtn = document.getElementById('copy-styled') as HTMLButtonElement;
  if (copyBtn) {
    copyBtn.disabled = !hasTextNode;
  }
}

function setupStyledTextControls(): void {
  const pasteBtn = document.getElementById('paste-styled') as HTMLButtonElement;
  const copyBtn = document.getElementById('copy-styled') as HTMLButtonElement;
  const replaceToggle = document.getElementById('styled-text-replace') as HTMLInputElement;
  const clipboardDiv = document.getElementById('styled-text-clipboard') as HTMLDivElement;
  const toggleLabel = document.querySelector('.styled-text-toggle') as HTMLElement;

  if (toggleLabel) {
    attachTooltip(toggleLabel);
  }

  if (replaceToggle) {
    replaceToggle.addEventListener('change', () => {
      replaceToggle.setAttribute('aria-checked', String(replaceToggle.checked));
    });
  }

  if (pasteBtn && clipboardDiv) {
    pasteBtn.addEventListener('click', async () => {
      const doSend = (html: string, plain: string) => {
        const segments = html
          ? parseHTMLToSegments(html)
          : plain
            ? [{ characters: plain }]
            : [];
        if (segments.length === 0) {
          sendMessage('notify', { message: 'No text found in clipboard' });
          return;
        }
        sendMessage('paste-styled-text', {
          segments,
          replaceSelected: replaceToggle?.checked ?? false
        });
      };

      // Primary: modern Clipboard API (not available in all Figma iframe contexts)
      try {
        if (!navigator.clipboard?.read) throw new Error('no clipboard api');
        const items = await navigator.clipboard.read();
        let html = '';
        let plain = '';
        for (const item of items) {
          if (!html && item.types.includes('text/html')) {
            html = await (await item.getType('text/html')).text();
          }
          if (!plain && item.types.includes('text/plain')) {
            plain = await (await item.getType('text/plain')).text();
          }
        }
        doSend(html, plain);
      } catch (_err) {
        // Fallback: contenteditable + execCommand (older browsers / restricted contexts)
        // Must blur() before restoring aria-hidden — setting aria-hidden on a focused
        // element is blocked by browsers and logged as an accessibility violation.
        const restoreClipboardDiv = () => {
          clipboardDiv.blur();
          clipboardDiv.setAttribute('aria-hidden', 'true');
          clipboardDiv.innerHTML = '';
        };

        clipboardDiv.innerHTML = '';
        clipboardDiv.removeAttribute('aria-hidden');
        clipboardDiv.focus();
        const handlePaste = (e: ClipboardEvent) => {
          e.preventDefault();
          clipboardDiv.removeEventListener('paste', handlePaste);
          const html = e.clipboardData?.getData('text/html') || '';
          const plain = e.clipboardData?.getData('text/plain') || '';
          restoreClipboardDiv();
          doSend(html, plain);
        };
        clipboardDiv.addEventListener('paste', handlePaste);
        if (!document.execCommand('paste')) {
          clipboardDiv.removeEventListener('paste', handlePaste);
          restoreClipboardDiv();
          sendMessage('notify', { message: 'Clipboard access unavailable — try copying again' });
        }
      }
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      sendMessage('copy-styled-text', {});
    });
  }
}

function initializeControls(): void {
  setupControls();
  setupControlsSettings();
  setupNudgeSettings();
  setupStyledTextControls();

  // Initialize accessibility features
  initializeAccessibilityFeatures();

  // Request current settings from plugin
  sendMessage('get-controls-setting');
  sendMessage('get-controls-group-settings');
  sendMessage('get-nudge-settings');
}

// Initialize accessibility features for controls
function initializeAccessibilityFeatures(): void {
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
function detectHighContrastMode(): void {
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
function detectReducedMotionPreference(): void {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    document.documentElement.setAttribute('data-reduced-motion', 'true');
    console.log('🎭 Reduced motion preference detected - disabling navigation animations');

    // Apply reduced motion enhancements
    enhanceNavigationForReducedMotion();
  }
}

// Set up media query listeners for accessibility preferences
function setupAccessibilityListeners(): void {
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
function enhanceNavigationForHighContrast(): void {
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
function enhanceNavigationForReducedMotion(): void {
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
function validateNavigationContrast(): void {
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
function testNavigationAccessibility(): void {
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
function testHighContrastMode(): void {
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
function testReducedMotionMode(): void {
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
function testColorContrastRatios(): void {
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
function testKeyboardNavigation(): void {
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
(window as any).testNavigationAccessibility = testNavigationAccessibility;

// Manual accessibility testing function for development
function runAccessibilityTests(): void {
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
(window as any).runAccessibilityTests = runAccessibilityTests;