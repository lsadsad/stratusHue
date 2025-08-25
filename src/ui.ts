// Figma Plugin UI - TypeScript Implementation
// Handles all UI interactions and communication with the plugin sandbox

console.log('🔍 Script executing, DOM ready state:', document.readyState);

// Type definitions for better development experience
interface PluginMessage {
  type: string;
  [key: string]: any;
}

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
      break;
    case 'bookmarks':
      updateBookmarksList(message.bookmarks);
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

  console.log('✅ Plugin initialization complete - waiting for emoji data from plugin');
}

// Setup event listeners for UI controls
function setupEventListeners(): void {
  const deselectBtn = document.getElementById('deselect-btn');
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

  if (deselectBtn) {
    deselectBtn.addEventListener('click', () => {
      console.log('Deselect clicked');
      sendMessage('deselect');
    });
  }

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
}

// UI state update functions
function updateUIState(data: any): void {
  // Update UI based on plugin state
  console.log('Updating UI state:', data);
}

function updateBookmarksList(bookmarks: any[]): void {
  const bookmarkList = document.getElementById('bookmark-list');
  if (!bookmarkList) return;

  bookmarkList.innerHTML = '';
  bookmarks.forEach(bookmark => {
    const li = document.createElement('li');
    li.className = 'bookmark-item';
    li.innerHTML = `
      <div class="bookmark-content">
        <div class="bookmark-name">${bookmark.name}</div>
        <div class="bookmark-page">${bookmark.pageName}</div>
      </div>
    `;
    li.addEventListener('click', () => {
      sendMessage('jump-to-bookmark', { id: bookmark.id });
    });
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