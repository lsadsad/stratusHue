import { sendMessage } from '../shared/send-message';
import { updateScrollBehavior } from '../shared/layout';
import type { Bookmark } from '../../core/types';

// References to shell state (injected via setters)
let _isAutoFitEnabled = true;
let _lastAutoFitHeight = 0;
let _isWidthCompact = false;

export function setBookmarksUIState(state: {
  isAutoFitEnabled: boolean;
  lastAutoFitHeight: number;
  isWidthCompact: boolean;
}): void {
  _isAutoFitEnabled = state.isAutoFitEnabled;
  _lastAutoFitHeight = state.lastAutoFitHeight;
  _isWidthCompact = state.isWidthCompact;
}

// Callback for showCanvasHint
let _showCanvasHintFn: (() => void) | null = null;
export function registerShowCanvasHintBookmarks(fn: () => void): void {
  _showCanvasHintFn = fn;
}
function showCanvasHint(): void {
  if (_showCanvasHintFn) _showCanvasHintFn();
}

// Callback for disableAutoFit
let _disableAutoFitFn: ((reason?: string) => void) | null = null;
export function registerDisableAutoFit(fn: (reason?: string) => void): void {
  _disableAutoFitFn = fn;
}
function disableAutoFit(reason?: string): void {
  if (_disableAutoFitFn) _disableAutoFitFn(reason);
}

// UI state update functions
export function updateUIState(data: unknown): void {
  // Update UI based on plugin state
  console.log('Updating UI state:', data);
}

export function updateBookmarksList(
  bookmarks: Bookmark[],
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

      // Inner content: only show recent-steps icon when this row has recent-history class.
      // When currentAnchorId === previousBookmarkId (tap same anchor twice), the row gets
      // current-anchor but not recent-history, so the icon would be unstyled and fill width.
      const recentHistoryIcon = previousBookmarkId && bookmark.id === previousBookmarkId && bookmark.id !== currentAnchorId
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

export function updateNavigationButtons(canGoBack: boolean, canGoForward: boolean): void {
  const backBtn = document.getElementById('back-btn') as HTMLButtonElement;
  const forwardBtn = document.getElementById('forward-btn') as HTMLButtonElement;

  if (backBtn) backBtn.disabled = !canGoBack;
  if (forwardBtn) forwardBtn.disabled = !canGoForward;
}

export function updateLayoutSizingButtons(horizontal: string | undefined, vertical: string | undefined): void {
  const widthModeSpan = document.getElementById('width-mode');
  const heightModeSpan = document.getElementById('height-mode');
  const widthIconSpan = document.getElementById('width-icon');
  const heightIconSpan = document.getElementById('height-icon');
  const widthIcon = widthIconSpan?.querySelector('img') as HTMLImageElement | null;
  const heightIcon = heightIconSpan?.querySelector('img') as HTMLImageElement | null;
  const cycleWidthBtn = document.getElementById('cycle-width') as HTMLButtonElement;
  const cycleHeightBtn = document.getElementById('cycle-height') as HTMLButtonElement;
  const widthCaption = document.getElementById('width-caption');
  const heightCaption = document.getElementById('height-caption');

  // Base64 data URIs for icons (matching the inlined assets in HTML)
  const ICON_FIXED = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEgNlYxMCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik0xNSA2VjEwIiBzdHJva2U9IndoaXRlIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTEgOEgxNSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=';
  const ICON_HUG = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTYgNVYxMSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik0xMCA1VjExIiBzdHJva2U9IndoaXRlIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTEgOEg1IiBzdHJva2U9IndoaXRlIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTMgMTBMNSA4TDMgNiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik0xNSA4SDExIiBzdHJva2U9IndoaXRlIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTEzIDZMMTEgOEwxMyAxMCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=';
  const ICON_FILL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwLjY2NjcgOEgxNC42NjY3IiBzdHJva2U9IndoaXRlIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTEyLjY2NjcgMTBMMTQuNjY2NyA4TDEyLjY2NjcgNiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik0xMS4zMzMzIDhIMS4zMzMyNSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik0zLjMzMzI1IDZMMS4zMzMyNSA4TDMuMzMzMjUgMTAiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K';

  // Helper function to get icon data URI based on mode
  const getIconDataUri = (mode: string | undefined): string => {
    if (!mode || mode === '—') return ICON_FIXED; // Default icon - show fixed when no hug/fill
    const modeLower = mode.toLowerCase();
    if (modeLower === 'hug') return ICON_HUG;
    if (modeLower === 'fill') return ICON_FILL;
    if (modeLower === 'fixed') return ICON_FIXED;
    return ICON_FIXED; // Fallback - show fixed when no hug/fill
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
    widthIcon.src = getIconDataUri(horizontal);
  }
  if (heightIcon) {
    heightIcon.src = getIconDataUri(vertical);
  }

  // Enable/disable buttons based on whether we have valid layout properties (check each axis independently)
  const hasValidHorizontal = horizontal && horizontal !== '—';
  const hasValidVertical = vertical && vertical !== '—';
  
  if (cycleWidthBtn) {
    cycleWidthBtn.disabled = !hasValidHorizontal;
  }
  if (cycleHeightBtn) {
    cycleHeightBtn.disabled = !hasValidVertical;
  }

  // Update caption labels: show "Width"/"Height" when disabled, show mode when enabled
  if (widthCaption) {
    if (!hasValidHorizontal) {
      widthCaption.textContent = 'Width';
    } else {
      const widthMode = horizontal && horizontal !== '—' ? horizontal : 'Fixed';
      widthCaption.textContent = widthMode.charAt(0).toUpperCase() + widthMode.slice(1).toLowerCase();
    }
  }
  if (heightCaption) {
    if (!hasValidVertical) {
      heightCaption.textContent = 'Height';
    } else {
      const heightMode = vertical && vertical !== '—' ? vertical : 'Fixed';
      heightCaption.textContent = heightMode.charAt(0).toUpperCase() + heightMode.slice(1).toLowerCase();
    }
  }
}

export function updateEmojiSetIndicator(setName: string, _currentIndex: number, _totalSets: number): void {
  const indicator = document.getElementById('emoji-set-indicator');
  if (indicator) {
    const setNameElement = indicator.querySelector('.set-name');
    if (setNameElement) {
      setNameElement.textContent = setName;
    }
  }
}

// Disable auto-fit and update UI state
export function disableAutoFitLocal(reason?: string): void {
  if (_isAutoFitEnabled) {
    _isAutoFitEnabled = false;
    disableAutoFit(reason); // propagate to shell via registered callback
  }
}

// Update auto-fit visual state on resize handle
export function updateAutoFitButtonState(): void {
  const resizeHandle = document.getElementById('footer-resize');
  if (!resizeHandle) return;

  if (_isAutoFitEnabled) {
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
export function resetFooterButtonStates(): void {
  const footerButtons = document.querySelectorAll('.footer-icon-btn');
  footerButtons.forEach((button) => {
    const btn = button as HTMLElement;
    btn.classList.remove('hover-active');
    btn.style.removeProperty('background');
    btn.style.removeProperty('color');
    btn.style.removeProperty('transform');
  });
}
