// Figma Plugin UI - TypeScript Implementation
// Handles all UI interactions and communication with the plugin sandbox

import lottie from 'lottie-web';

console.log('🔍 Script executing, DOM ready state:', document.readyState);

// Type definitions for better development experience
interface PluginMessage {
  type: string;
  [key: string]: any;
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


// Toggle state management
let currentToggleMode: 'onPage' | 'onLayer' = 'onPage';
let hasPreviousSelection = false;

// Auto-fit state management
let isAutoFitEnabled = false;

// Helper function to send messages to plugin sandbox
function sendMessage(type: string, data: Record<string, any> = {}): void {
  parent.postMessage({ pluginMessage: { type, ...data } }, '*');
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
      // Update toggle state based on selection
      updateToggleState(message.hasLayerSelected);
      // Update previous selection state
      hasPreviousSelection = message.hasPreviousSelection || false;
      updateToggleUI();
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

// Update toggle UI to reflect current state
function updateToggleUI(): void {
  const toggleButton = document.getElementById('toggle-mode');
  if (!toggleButton) return;

  const onPageOption = toggleButton.querySelector('[data-mode="onPage"]');
  const onLayerOption = toggleButton.querySelector('[data-mode="onLayer"]');

  if (onPageOption && onLayerOption) {
    onPageOption.classList.toggle('active', currentToggleMode === 'onPage');
    onLayerOption.classList.toggle('active', currentToggleMode === 'onLayer');

    // Reflect active on root for CSS-driven indicator
    toggleButton.setAttribute('data-active', currentToggleMode);

    // Handle disabled state for onLayer option
    if (currentToggleMode === 'onPage' && !hasPreviousSelection) {
      onLayerOption.classList.add('disabled');
      toggleButton.setAttribute('aria-label', 'Toggle between page and layer mode (layer mode unavailable - no previous selection)');
    } else {
      onLayerOption.classList.remove('disabled');
      toggleButton.setAttribute('aria-label', 'Toggle between page and layer mode');
    }
  }

  // Ensure page-only actions are visible only in onPage mode
  const pageActionsGroup = document.getElementById('page-actions-group');
  if (pageActionsGroup) {
    pageActionsGroup.style.display = currentToggleMode === 'onPage' ? 'inline-flex' : 'none';
  }
}

// Handle toggle click
function handleToggleClick(mode: 'onPage' | 'onLayer'): void {
  if (currentToggleMode === mode) return;

  // Prevent switching to onLayer if no previous selection is available
  if (mode === 'onLayer' && !hasPreviousSelection) {
    console.log('Cannot switch to layer mode - no previous selection available');
    return;
  }

  currentToggleMode = mode;
  updateToggleUI();

  if (mode === 'onPage') {
    // Deselect all layers to switch to page mode
    console.log('Switching to page mode - deselecting layers');
    sendMessage('deselect');
  } else {
    // For layer mode, we need to ensure there's a selection
    // This will be handled by the plugin's selection state
    console.log('Switching to layer mode');
    sendMessage('toggle-mode', { mode: 'onLayer' });
  }
}

// Compute natural content height (ignoring current flex-driven viewport size)
function computeFitHeight(): number {
  const main = document.querySelector('main.scrollable-content') as HTMLElement | null;
  const footer = document.getElementById('footer');
  const footerHeight = footer ? footer.offsetHeight : 0;

  if (!main) {
    const fallback = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) + footerHeight;
    return Math.ceil(fallback);
  }

  // Preserve existing inline styles to restore later
  const prevFlex = main.style.flex;
  const prevHeight = main.style.height;
  const prevMaxHeight = main.style.maxHeight;

  // Temporarily remove flex constraints to measure natural content height
  main.style.flex = '0 0 auto';
  main.style.height = 'auto';
  main.style.maxHeight = 'none';

  // Temporarily lift max-height from expanded collapsible sections so we
  // measure their full natural height (CSS sets max-height: 600px)
  const children = Array.from(main.children) as HTMLElement[];
  const modifiedSections: Array<{ el: HTMLElement; prevMaxHeight: string; prevHeight: string; prevOverflow: string }> = [];
  for (const child of children) {
    const isCollapsible = child.classList.contains('collapsible-content');
    const isCollapsed = child.classList.contains('collapsed');
    if (isCollapsible && !isCollapsed) {
      modifiedSections.push({
        el: child,
        prevMaxHeight: child.style.maxHeight,
        prevHeight: child.style.height,
        prevOverflow: child.style.overflow
      });
      child.style.maxHeight = 'none';
      child.style.height = 'auto';
      child.style.overflow = 'visible';
    }
  }

  // Measure only visible (non-collapsed) children
  const mainRect = main.getBoundingClientRect();
  let visibleBottom = mainRect.top;
  for (const child of children) {
    const isCollapsible = child.classList.contains('collapsible-content');
    const isCollapsed = child.classList.contains('collapsed');
    if (isCollapsible && isCollapsed) {
      continue;
    }
    const rect = child.getBoundingClientRect();
    // Skip elements with zero height (not rendered)
    if (rect.height <= 0) continue;
    visibleBottom = Math.max(visibleBottom, rect.bottom);
  }
  const naturalScrollHeight = Math.max(0, Math.ceil(visibleBottom - mainRect.top));

  // Restore previous styles
  main.style.flex = prevFlex;
  main.style.height = prevHeight;
  main.style.maxHeight = prevMaxHeight;
  for (const entry of modifiedSections) {
    entry.el.style.maxHeight = entry.prevMaxHeight;
    entry.el.style.height = entry.prevHeight;
    entry.el.style.overflow = entry.prevOverflow;
  }

  return Math.ceil(naturalScrollHeight + footerHeight);
}

// Check if scrolling should be enabled based on content height
function updateScrollBehavior(): void {
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
    console.log('Auto-fit: adjusting height to', newHeight);
    sendMessage('resize-ui', { height: newHeight });
  }
}

// Simple emoji button updater
function updateEmojiButtons(emojis: string[]): void {
  const container = document.getElementById('color-emoji-buttons');
  if (!container) return;

  container.innerHTML = '';
  emojis.forEach(emoji => {
    const button = document.createElement('button');
    button.className = 'emoji-button';
    button.textContent = emoji;

    button.addEventListener('click', () => {
      console.log('Emoji clicked:', emoji);
      sendMessage('add-emoji', { emoji });
    });

    container.appendChild(button);
  });

  // Update scroll behavior after content changes
  setTimeout(updateScrollBehavior, 50);
}

// Lottie Animation Utilities
function initializeLottieAnimation(config: LottieAnimationConfig): any {
  try {
    const animation = lottie.loadAnimation({
      container: config.container,
      renderer: config.renderer || 'svg',
      loop: config.loop !== false, // Default to true
      autoplay: config.autoplay !== false, // Default to true
      animationData: config.animationData,
      name: config.name || `lottie-${Date.now()}`
    });

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

  // Initialize toggle state
  updateToggleUI();

  // Initialize auto-fit button state
  updateAutoFitButtonState();

  // Initialize Lottie animations
  initializeAllLottieElements();

  // Initialize scroll behavior
  updateScrollBehavior();

  // Setup cleanup on page unload
  setupCleanupHandlers();

  console.log('✅ Plugin initialization complete - waiting for emoji data from plugin');
}

// Setup event listeners for UI controls
function setupEventListeners(): void {
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
  const fitBtn = document.getElementById('footer-fit');
  const resizeHandle = document.getElementById('footer-resize');
  const collapsibleHeaders = Array.from(document.querySelectorAll<HTMLElement>('.section-header.collapsible'));
  const toggleModeBtn = document.getElementById('toggle-mode');

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
  }

  // New Page: request plugin to create a new dated page
  if (newPageBtn) {
    newPageBtn.addEventListener('click', () => {
      console.log('New Page clicked');
      sendMessage('create-new-page');
    });
  }

  // Indent page title: insert 4 spaces before title text
  if (indentTitleBtn) {
    indentTitleBtn.addEventListener('click', () => {
      console.log('Indent title clicked');
      sendMessage('indent-title');
    });
  }

  // Outdent page title: remove 4 leading spaces (if present) before arrow/emoji
  if (outdentTitleBtn) {
    outdentTitleBtn.addEventListener('click', () => {
      console.log('Outdent title clicked');
      sendMessage('outdent-title');
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

  // Escape to close
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && settingsOverlay && settingsOverlay.getAttribute('aria-hidden') === 'false') {
      closeSettings();
    }
  });

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

  // Fit height to content - toggle auto-fit mode
  if (fitBtn) {
    fitBtn.addEventListener('click', () => {
      isAutoFitEnabled = !isAutoFitEnabled;
      updateAutoFitButtonState();

      if (isAutoFitEnabled) {
        // Immediately fit to current content when enabling
        const contentHeight = computeFitHeight();
        console.log('Auto-fit enabled: adjusting height to', contentHeight);
        sendMessage('resize-ui', { height: contentHeight });
      } else {
        console.log('Auto-fit disabled');
      }
    });

    // Add hover state management to prevent stuck states
    fitBtn.addEventListener('mouseenter', () => {
      fitBtn.classList.add('hover-active');
    });

    fitBtn.addEventListener('mouseleave', () => {
      fitBtn.classList.remove('hover-active');
      // Force style reset
      fitBtn.style.removeProperty('background');
      fitBtn.style.removeProperty('color');
    });

    fitBtn.addEventListener('blur', () => {
      fitBtn.classList.remove('hover-active');
      // Force style reset
      fitBtn.style.removeProperty('background');
      fitBtn.style.removeProperty('color');
    });
  }

  // Drag to resize height
  if (resizeHandle) {
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
      // After transition, update scroll behavior and auto-fit if enabled
      // Small delay allows CSS transition to compute new height
      window.setTimeout(() => {
        updateScrollBehavior();
      }, 200);
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

  // Toggle mode button
  if (toggleModeBtn) {
    toggleModeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const target = e.currentTarget as HTMLElement;
      const onPageOption = target.querySelector('[data-mode="onPage"]');
      const onLayerOption = target.querySelector('[data-mode="onLayer"]');

      if (onPageOption && onLayerOption) {
        if (onPageOption.classList.contains('active')) {
          handleToggleClick('onLayer');
        } else {
          handleToggleClick('onPage');
        }
      }
      // Update visibility after toggle
      setTimeout(() => updatePageActionsVisibility(), 0);
    });
  }

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

  // Setup footer button state management
  setupFooterButtonStateManagement();
}

// Footer button state management to prevent stuck hover states
function setupFooterButtonStateManagement(): void {
  const footerButtons = document.querySelectorAll('.footer-icon-btn');

  footerButtons.forEach((button) => {
    const btn = button as HTMLElement;

    // Add a global mouse move listener to detect when mouse is no longer over the button
    let isMouseOver = false;

    btn.addEventListener('mouseenter', () => {
      isMouseOver = true;
    });

    btn.addEventListener('mouseleave', () => {
      isMouseOver = false;
      // Force reset styles
      btn.style.removeProperty('background');
      btn.style.removeProperty('color');
      btn.style.removeProperty('transform');
    });

    // Handle focus/blur for keyboard navigation
    btn.addEventListener('focus', () => {
      // Focus styles are handled by CSS
    });

    btn.addEventListener('blur', () => {
      if (!isMouseOver) {
        // Force reset styles when losing focus and not hovered
        btn.style.removeProperty('background');
        btn.style.removeProperty('color');
        btn.style.removeProperty('transform');
      }
    });

    // Handle mouse up to reset active states
    btn.addEventListener('mouseup', () => {
      // Small delay to allow CSS transitions to complete
      setTimeout(() => {
        if (!isMouseOver) {
          btn.style.removeProperty('background');
          btn.style.removeProperty('color');
          btn.style.removeProperty('transform');
        }
      }, 150);
    });
  });

  // Global mouse move listener to catch edge cases
  document.addEventListener('mousemove', (e) => {
    footerButtons.forEach((button) => {
      const btn = button as HTMLElement;
      const rect = btn.getBoundingClientRect();
      const isOver = (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      );

      if (!isOver && !btn.matches(':focus')) {
        // Mouse is not over this button and it's not focused
        btn.style.removeProperty('background');
        btn.style.removeProperty('color');
        btn.style.removeProperty('transform');
      }
    });
  });
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
      li.innerHTML = `
        <div class="bookmark-content">
          <div class="bookmark-name">${bookmark.name}</div>
          <div class="bookmark-page">${bookmark.pageName}</div>
        </div>
        <button class="bookmark-remove" aria-label="Remove anchor" title="Remove">
          ✕
        </button>
      `;

      // Navigate on item click
      li.addEventListener('click', () => {
        if (isDragging) return;
        sendMessage('jump-to-bookmark', { id: bookmark.id });
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

// Update auto-fit button visual state
function updateAutoFitButtonState(): void {
  const fitBtn = document.getElementById('footer-fit');
  if (!fitBtn) return;

  if (isAutoFitEnabled) {
    fitBtn.classList.add('active');
    fitBtn.setAttribute('aria-label', 'Auto-fit enabled - click to disable');
    fitBtn.setAttribute('title', 'Auto-fit: ON');
  } else {
    fitBtn.classList.remove('active');
    fitBtn.setAttribute('aria-label', 'Auto-fit disabled - click to enable');
    fitBtn.setAttribute('title', 'Auto-fit: OFF');
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
      setTimeout(() => { announcer.textContent = ''; }, 2000);
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
      setTimeout(() => { announcer.textContent = ''; }, 2000);
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
      setTimeout(() => { announcer.textContent = ''; }, 2000);
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

  // Apply system theme immediately as fallback before loading preferences
  const systemTheme = themeManager.currentSystemTheme;
  const fallbackEffectiveTheme = systemTheme === 'dark' ? 'figma-dark' : 'figma-light';

  console.log(`🔍 System theme detected: ${systemTheme}, applying fallback: ${fallbackEffectiveTheme}`);

  // Additional debugging for system theme detection
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  console.log(`🔍 Media query '(prefers-color-scheme: dark)' matches: ${mediaQuery.matches}`);
  console.log(`🔍 Expected system theme: ${mediaQuery.matches ? 'dark' : 'light'}`);

  applyTheme(fallbackEffectiveTheme);

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

    // Show theme change notification
    const currentMode = themeManager.currentTheme;
    showThemeChangeNotification(currentMode, effectiveTheme);

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

  // Add event listeners to theme radio buttons with enhanced keyboard navigation
  const themeRadios = document.querySelectorAll('input[name="theme"]');
  themeRadios.forEach((radio) => {
    const radioElement = radio as HTMLInputElement;
    const themeOption = radioElement.closest('.theme-option') as HTMLElement;

    // Enhanced change handler
    radioElement.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.checked) {
        const themeMode = target.value as ThemeMode;

        // Hide any active preview before applying the actual theme
        hideThemePreview();

        // Apply the selected theme
        themeManager.setTheme(themeMode);
        console.log('Theme changed to:', themeMode);

        // Announce theme selection for screen readers
        announceThemeSelection(themeMode);
      }
    });

    // Enhanced keyboard navigation
    radioElement.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          navigateToAdjacentTheme(radioElement, 'previous');
          break;
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          navigateToAdjacentTheme(radioElement, 'next');
          break;
        case 'Home':
          e.preventDefault();
          navigateToFirstTheme();
          break;
        case 'End':
          e.preventDefault();
          navigateToLastTheme();
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (!radioElement.checked) {
            radioElement.checked = true;
            radioElement.dispatchEvent(new Event('change', { bubbles: true }));
          }
          break;
      }
    });

    // Enhanced focus management
    radioElement.addEventListener('focus', () => {
      // Add visual focus indicator to the theme option
      themeOption?.classList.add('theme-option-focused');

      // Show preview on focus (but not on initial load)
      if (!radioElement.checked && document.readyState === 'complete') {
        showThemePreview(radioElement.value as ThemeMode);
      }
    });

    radioElement.addEventListener('blur', () => {
      // Remove visual focus indicator
      themeOption?.classList.remove('theme-option-focused');

      // Hide preview when losing focus (unless the theme is selected)
      if (!radioElement.checked) {
        hideThemePreview();
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
  const themeRadio = document.querySelector(`input[name="theme"][value="${currentMode}"]`) as HTMLInputElement;
  if (themeRadio && !themeRadio.checked) {
    themeRadio.checked = true;
  }

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
    statusElement.textContent = `Currently: ${themeLabel}`;
    statusElement.style.display = 'block';

    // Add visual indicator for system theme synchronization
    statusElement.setAttribute('data-system-theme', systemTheme);
  } else {
    // Hide status for non-system themes
    statusElement.style.display = 'none';
    statusElement.removeAttribute('data-system-theme');
  }
}

// Theme change notification system
function showThemeChangeNotification(themeMode: ThemeMode, effectiveTheme: EffectiveTheme): void {
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
  const themeConfig = themeManager?.getThemeConfig(themeMode);
  const displayName = themeConfig?.displayName || themeMode;
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
    notification.classList.remove('show');
  }, 2000);

  // Announce to screen readers
  announceThemeChange(displayName);
}

// Enhanced keyboard navigation helpers for theme selection
function navigateToAdjacentTheme(currentRadio: HTMLInputElement, direction: 'previous' | 'next'): void {
  const allRadios = Array.from(document.querySelectorAll('input[name="theme"]')) as HTMLInputElement[];
  const currentIndex = allRadios.indexOf(currentRadio);

  if (currentIndex === -1) return;

  let targetIndex: number;
  if (direction === 'previous') {
    targetIndex = currentIndex === 0 ? allRadios.length - 1 : currentIndex - 1;
  } else {
    targetIndex = currentIndex === allRadios.length - 1 ? 0 : currentIndex + 1;
  }

  const targetRadio = allRadios[targetIndex];
  if (targetRadio) {
    targetRadio.focus();
    // Optionally select the theme immediately on navigation
    if (!targetRadio.checked) {
      targetRadio.checked = true;
      targetRadio.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
}

function navigateToFirstTheme(): void {
  const firstRadio = document.querySelector('input[name="theme"]') as HTMLInputElement;
  if (firstRadio) {
    firstRadio.focus();
    if (!firstRadio.checked) {
      firstRadio.checked = true;
      firstRadio.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
}

function navigateToLastTheme(): void {
  const allRadios = document.querySelectorAll('input[name="theme"]');
  const lastRadio = allRadios[allRadios.length - 1] as HTMLInputElement;
  if (lastRadio) {
    lastRadio.focus();
    if (!lastRadio.checked) {
      lastRadio.checked = true;
      lastRadio.dispatchEvent(new Event('change', { bubbles: true }));
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
    announcer.textContent = '';
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
    announcer.textContent = '';
  }, 4000);
}

// Theme preview functionality
function setupThemePreview(): void {
  const themeOptions = document.querySelectorAll('.theme-option');

  themeOptions.forEach((option) => {
    const radio = option.querySelector('input[type="radio"]') as HTMLInputElement;
    const content = option.querySelector('.theme-option-content') as HTMLElement;

    if (!radio || !content) return;

    // Add preview on hover
    option.addEventListener('mouseenter', () => {
      if (!radio.checked) {
        showThemePreview(radio.value as ThemeMode);
      }
    });

    // Remove preview on mouse leave
    option.addEventListener('mouseleave', () => {
      if (!radio.checked) {
        hideThemePreview();
      }
    });

    // Add keyboard preview support
    radio.addEventListener('focus', () => {
      if (!radio.checked) {
        showThemePreview(radio.value as ThemeMode);
      }
    });

    radio.addEventListener('blur', () => {
      if (!radio.checked) {
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
    const themeOptions = themeSelector.querySelectorAll('.theme-option');
    themeOptions.forEach((option, index) => {
      const radio = option.querySelector('input[type="radio"]') as HTMLInputElement;
      const themeConfig = themeManager?.getThemeConfig(radio?.value as ThemeMode);

      if (radio && themeConfig) {
        // Enhanced aria-label with description
        radio.setAttribute('aria-label', `${themeConfig.displayName}: ${themeConfig.description}`);

        // Add position information for screen readers
        radio.setAttribute('aria-posinset', (index + 1).toString());
        radio.setAttribute('aria-setsize', themeOptions.length.toString());
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
        // Handle both new ThemePreference objects and legacy string themes
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
  window.addEventListener('systemThemeSync', (event: CustomEvent) => {
    const { effectiveTheme, themeMode, systemTheme } = event.detail;
    console.log(`🔄 System theme sync event: ${effectiveTheme} (mode: ${themeMode}, system: ${systemTheme})`);

    // Additional handling for system theme changes can be added here
    // For example, updating other UI elements that depend on theme
  });

  // Listen for theme change completion events
  window.addEventListener('themeChangeComplete', (event: CustomEvent) => {
    const { effectiveTheme, themeMode, systemTheme, isSystemTheme } = event.detail;
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
  setInterval(() => {
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
        const result = originalApplyTheme.call(this, effectiveTheme, skipTransition);

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

  // Monitor memory usage periodically
  if ('memory' in performance) {
    setInterval(() => {
      const memInfo = (performance as any).memory;
      if (memInfo.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB threshold
        console.warn('High memory usage detected:', {
          used: `${(memInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
          total: `${(memInfo.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
          limit: `${(memInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
        });
      }
    }, 30000); // Check every 30 seconds
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
const activeTimers = new Set<number>();
const originalSetTimeout = window.setTimeout;
const originalSetInterval = window.setInterval;

// Override setTimeout to track timers
window.setTimeout = function (callback: Function, delay?: number, ...args: any[]) {
  const timerId = originalSetTimeout.call(window, (...callbackArgs: any[]) => {
    activeTimers.delete(timerId);
    callback.apply(this, callbackArgs);
  }, delay, ...args);
  activeTimers.add(timerId);
  return timerId;
};

// Override setInterval to track timers
window.setInterval = function (callback: Function, delay?: number, ...args: any[]) {
  const timerId = originalSetInterval.call(window, callback, delay, ...args);
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
const activeEventListeners = new Map<EventTarget, Array<{
  type: string;
  listener: EventListener;
  options?: boolean | AddEventListenerOptions;
}>>();

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

function removeAllEventListeners(): void {
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

// Export theme manager for debugging
(window as any).themeManager = themeManager;