// Figma Plugin UI - TypeScript Implementation
// Handles all UI interactions and communication with the plugin sandbox

import lottie from 'lottie-web';
import { LemonSqueezyService, defaultLemonSqueezyConfig } from './lemon-squeezy';

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

// Lemon Squeezy service instance
const lemonSqueezyService = new LemonSqueezyService(defaultLemonSqueezyConfig);

// Toggle state management
let currentToggleMode: 'onPage' | 'onLayer' = 'onPage';
let hasPreviousSelection = false;

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

  // Measure only visible (non-collapsed) children
  const mainRect = main.getBoundingClientRect();
  let visibleBottom = mainRect.top;
  const children = Array.from(main.children) as HTMLElement[];
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

  return Math.ceil(naturalScrollHeight + footerHeight);
}

// Check if scrolling should be enabled based on content height
function updateScrollBehavior(): void {
  const main = document.querySelector('main.scrollable-content') as HTMLElement | null;
  if (!main) return;

  // Get the current container height
  const containerHeight = main.clientHeight;

  // Calculate the actual content height (visible content only)
  let contentHeight = 0;
  const children = Array.from(main.children) as HTMLElement[];

  for (const child of children) {
    const isCollapsible = child.classList.contains('collapsible-content');
    const isCollapsed = child.classList.contains('collapsed');

    // Skip collapsed collapsible content
    if (isCollapsible && isCollapsed) {
      continue;
    }

    contentHeight += child.offsetHeight;
  }

  // Enable/disable scrolling based on whether content exceeds container
  if (contentHeight <= containerHeight) {
    main.classList.add('no-scroll');
  } else {
    main.classList.remove('no-scroll');
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

  // Send ui-ready message to plugin sandbox
  console.log('📤 Sending ui-ready message');
  sendMessage('ui-ready');

  // Initialize toggle state
  updateToggleUI();

  // Initialize Lottie animations
  initializeAllLottieElements();

  // Initialize scroll behavior
  updateScrollBehavior();

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

  // Date button (basic handler; functionality wired later)
  if (dateBtn) {
    dateBtn.addEventListener('click', () => {
      console.log('Date button clicked');
      // Future: sendMessage('add-date') or similar
    });
  }

  // New Page (functionality to be implemented later)
  if (newPageBtn) {
    newPageBtn.addEventListener('click', () => {
      console.log('New Page clicked');
      // Intentionally not sending a message yet; functionality to be implemented later
    });
  }

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

  // Fit height to content
  if (fitBtn) {
    fitBtn.addEventListener('click', () => {
      const contentHeight = computeFitHeight();
      console.log('Fit height to content (natural):', contentHeight);
      sendMessage('resize-ui', { height: contentHeight });
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
      const newHeight = Math.max(150, Math.min(800, Math.round(startHeight + deltaY)));
      sendMessage('resize-ui', { height: newHeight });
    };

    const onMouseUp = () => {
      if (!isDragging) return;
      isDragging = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    resizeHandle.addEventListener('mousedown', (e: MouseEvent) => {
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
        const newHeight = Math.max(150, Math.min(800, window.innerHeight + direction * step));
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
      // After transition, optionally adjust height if needed
      // Small delay allows CSS transition to compute new height
      window.setTimeout(() => {
        updateScrollBehavior();
        const contentHeight = computeFitHeight();
        sendMessage('resize-ui', { height: contentHeight });
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
    });
  }

  // Theme switching
  setupThemeSwitching();

  // Lemon Squeezy event listeners
  setupLemonSqueezyEventListeners();

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
  if (!bookmarkList) return;

  bookmarkList.innerHTML = '';
  bookmarks.forEach(bookmark => {
    const li = document.createElement('li');
    li.className = 'bookmark-item';

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
      sendMessage('jump-to-bookmark', { id: bookmark.id });
    });

    // Remove button behavior
    const removeBtn = li.querySelector('.bookmark-remove');
    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sendMessage('remove-bookmark', { id: bookmark.id });
      });
    }

    bookmarkList.appendChild(li);
  });

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

// Safe localStorage wrapper for Figma plugin environment
function safeLocalStorage() {
  try {
    // Test if localStorage is available
    const test = 'test';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return {
      getItem: (key: string) => localStorage.getItem(key),
      setItem: (key: string, value: string) => localStorage.setItem(key, value),
      available: true
    };
  } catch (e) {
    // localStorage is not available (Figma plugin sandbox)
    console.warn('localStorage not available, using memory storage');
    const memoryStorage: { [key: string]: string } = {};
    return {
      getItem: (key: string) => memoryStorage[key] || null,
      setItem: (key: string, value: string) => { memoryStorage[key] = value; },
      available: false
    };
  }
}

const storage = safeLocalStorage();

// Theme switching functionality
function setupThemeSwitching(): void {
  const themeRadios = document.querySelectorAll('input[name="theme"]');

  // Load saved theme preference (defaults to 'figma' if not available)
  const savedTheme = storage.getItem('figma-plugin-theme') || 'figma';
  applyTheme(savedTheme);

  // Set the correct radio button
  const savedThemeRadio = document.querySelector(`input[name="theme"][value="${savedTheme}"]`) as HTMLInputElement;
  if (savedThemeRadio) {
    savedThemeRadio.checked = true;
  }

  // Add event listeners to theme radio buttons
  themeRadios.forEach((radio) => {
    radio.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.checked) {
        const theme = target.value;
        applyTheme(theme);
        storage.setItem('figma-plugin-theme', theme);
        console.log('Theme changed to:', theme);
      }
    });
  });
}

function applyTheme(theme: string): void {
  const htmlElement = document.documentElement;

  // Remove existing theme attributes
  htmlElement.removeAttribute('data-theme');

  // Apply new theme
  switch (theme) {
    case 'light':
      htmlElement.setAttribute('data-theme', 'light');
      break;
    case 'dark':
      htmlElement.setAttribute('data-theme', 'dark');
      break;
    case 'figma':
    default:
      // Figma theme is the default (no data-theme attribute needed)
      break;
  }

  // Update the UI to reflect theme change
  updateThemeUI(theme);
}

function updateThemeUI(theme: string): void {
  // Update any theme-specific UI elements if needed
  const themeRadio = document.querySelector(`input[name="theme"][value="${theme}"]`) as HTMLInputElement;
  if (themeRadio && !themeRadio.checked) {
    themeRadio.checked = true;
  }

  // Dispatch a custom event for other parts of the app to listen to
  window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
}

// DOM Ready handling
function handleDOMReady(): void {
  // Initialize plugin functionality
  initializePlugin();

  // Setup all event listeners
  setupEventListeners();

  // Listen for messages from plugin
  window.addEventListener('message', handlePluginMessage);

  // Update scroll behavior on window resize
  window.addEventListener('resize', () => {
    setTimeout(updateScrollBehavior, 100);
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

// ===== LEMON SQUEEZY FUNCTIONS =====

function setupLemonSqueezyEventListeners(): void {
  const testApiBtn = document.getElementById('test-api-btn');
  const validateLicenseBtn = document.getElementById('validate-license-btn');
  const upgradeBtn = document.getElementById('upgrade-btn');
  const licenseKeyInput = document.getElementById('license-key-input') as HTMLInputElement;

  if (testApiBtn) {
    testApiBtn.addEventListener('click', handleTestApiConnection);
  }

  if (validateLicenseBtn && licenseKeyInput) {
    validateLicenseBtn.addEventListener('click', () => {
      const licenseKey = licenseKeyInput.value.trim();
      if (licenseKey) {
        handleValidateLicense(licenseKey);
      } else {
        showFeedback('license-feedback', 'Please enter a license key', 'error');
      }
    });

    // Validate on Enter key
    licenseKeyInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const licenseKey = licenseKeyInput.value.trim();
        if (licenseKey) {
          handleValidateLicense(licenseKey);
        }
      }
    });
  }

  if (upgradeBtn) {
    upgradeBtn.addEventListener('click', handleUpgradeClick);
  }

  // Initialize subscription status check
  checkSubscriptionStatus();
}

async function handleTestApiConnection(): Promise<void> {
  const testApiBtn = document.getElementById('test-api-btn') as HTMLButtonElement;
  const originalText = testApiBtn.textContent;

  testApiBtn.disabled = true;
  testApiBtn.textContent = 'Testing...';

  try {
    const result = await lemonSqueezyService.testConnection();
    showFeedback('api-feedback', result.message, result.success ? 'success' : 'error');
  } catch (error) {
    showFeedback('api-feedback', 'Connection test failed', 'error');
  } finally {
    testApiBtn.disabled = false;
    testApiBtn.textContent = originalText;
  }
}

async function handleValidateLicense(licenseKey: string): Promise<void> {
  const validateBtn = document.getElementById('validate-license-btn') as HTMLButtonElement;
  const originalText = validateBtn.textContent;

  validateBtn.disabled = true;
  validateBtn.textContent = 'Validating...';

  try {
    const result = await lemonSqueezyService.validateLicense(licenseKey);

    if (result && result.valid) {
      showFeedback('license-feedback', 'License validated successfully!', 'success');
      updateSubscriptionStatus(true, result.license_key.expires_at);

      // Store license key locally (you might want to encrypt this)
      localStorage.setItem('figma-plugin-license', licenseKey);
    } else {
      showFeedback('license-feedback', 'Invalid license key', 'error');
      updateSubscriptionStatus(false);
    }
  } catch (error) {
    showFeedback('license-feedback', 'License validation failed', 'error');
  } finally {
    validateBtn.disabled = false;
    validateBtn.textContent = originalText;
  }
}

function handleUpgradeClick(): void {
  const checkoutUrl = lemonSqueezyService.generateCheckoutUrl();

  // Send message to plugin to open URL
  sendMessage('open-url', { url: checkoutUrl });

  showFeedback('api-feedback', 'Opening checkout page...', 'info');
}

function showFeedback(elementId: string, message: string, type: 'success' | 'error' | 'info'): void {
  const feedbackElement = document.getElementById(elementId);
  if (feedbackElement) {
    feedbackElement.textContent = message;
    feedbackElement.className = `feedback-message ${type}`;

    // Auto-hide after 5 seconds for success/info messages
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        feedbackElement.style.display = 'none';
      }, 5000);
    }
  }
}

function updateSubscriptionStatus(isActive: boolean, expiresAt?: string | null): void {
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');

  if (statusDot && statusText) {
    statusDot.className = `status-dot ${isActive ? 'active' : 'inactive'}`;

    if (isActive) {
      const expiryText = expiresAt ? ` (expires ${new Date(expiresAt).toLocaleDateString()})` : '';
      statusText.textContent = `Premium Active${expiryText}`;
    } else {
      statusText.textContent = 'Free Version';
    }
  }
}

async function checkSubscriptionStatus(): Promise<void> {
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');

  if (statusDot && statusText) {
    statusDot.className = 'status-dot checking';
    statusText.textContent = 'Checking subscription...';
  }

  // Check for stored license key
  const storedLicense = localStorage.getItem('figma-plugin-license');

  if (storedLicense) {
    try {
      const result = await lemonSqueezyService.validateLicense(storedLicense);
      if (result && result.valid) {
        updateSubscriptionStatus(true, result.license_key.expires_at);
        return;
      }
    } catch (error) {
      console.error('Failed to validate stored license:', error);
    }
  }

  // Default to free version
  updateSubscriptionStatus(false);
}

