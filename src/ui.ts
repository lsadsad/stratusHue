// Figma Plugin UI - TypeScript Implementation
// Handles all UI interactions and communication with the plugin sandbox

console.log('🔍 Script executing, DOM ready state:', document.readyState);

// Type definitions for better development experience
interface PluginMessage {
  type: string;
  [key: string]: any;
}

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
}

// Main plugin initialization
function initializePlugin(): void {
  console.log('🚀 Initializing plugin functionality...');
  
  // Send ui-ready message to plugin sandbox
  console.log('📤 Sending ui-ready message');
  sendMessage('ui-ready');

  // Initialize toggle state
  updateToggleUI();

  console.log('✅ Plugin initialization complete - waiting for emoji data from plugin');
}

// Setup event listeners for UI controls
function setupEventListeners(): void {
  const backBtn = document.getElementById('back-btn');
  const forwardBtn = document.getElementById('forward-btn');
  const clearBtn = document.getElementById('clear-color');
  const saveBtn = document.getElementById('save-bookmark');
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
  }

  // Fit height to content
  if (fitBtn) {
    fitBtn.addEventListener('click', () => {
      const contentHeight = computeFitHeight();
      console.log('Fit height to content (natural):', contentHeight);
      sendMessage('resize-ui', { height: contentHeight });
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

// DOM Ready handling
function handleDOMReady(): void {
  // Initialize plugin functionality
  initializePlugin();
  
  // Setup all event listeners
  setupEventListeners();
  
  // Listen for messages from plugin
  window.addEventListener('message', handlePluginMessage);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', handleDOMReady);
} else {
  handleDOMReady();
}