import { sendMessage } from './send-message';

// These are references to mutable state owned by ui.ts shell.
// Functions that need them accept them as parameters or read from module-level vars below.
// The shell passes/sets these via the setter functions.
let _isAutoFitEnabled = true;
let _lastAutoFitHeight = 0;
let _currentToggleMode: 'onPage' | 'onLayer' = 'onPage';

export function setLayoutState(state: {
  isAutoFitEnabled: boolean;
  lastAutoFitHeight: number;
  currentToggleMode: 'onPage' | 'onLayer';
}): void {
  _isAutoFitEnabled = state.isAutoFitEnabled;
  _lastAutoFitHeight = state.lastAutoFitHeight;
  _currentToggleMode = state.currentToggleMode;
}

export function getIsAutoFitEnabled(): boolean { return _isAutoFitEnabled; }
export function setIsAutoFitEnabled(v: boolean): void { _isAutoFitEnabled = v; }
export function getLastAutoFitHeight(): number { return _lastAutoFitHeight; }
export function setLastAutoFitHeight(v: number): void { _lastAutoFitHeight = v; }
export function getCurrentToggleMode(): 'onPage' | 'onLayer' { return _currentToggleMode; }
export function setCurrentToggleMode(v: 'onPage' | 'onLayer'): void { _currentToggleMode = v; }

// Update toggle state based on selection
export function updateToggleState(hasLayerSelected: boolean): void {
  const newMode = hasLayerSelected ? 'onLayer' : 'onPage';
  if (_currentToggleMode !== newMode) {
    _currentToggleMode = newMode;
    updateToggleUI();
  }
}

// Update mode affordance UI to reflect current state
export function updateToggleUI(): void {
  // Update mode affordance badges on section titles
  const modeAffordances = document.querySelectorAll('.mode-affordance');
  const modeLabel = _currentToggleMode === 'onPage' ? 'PAGE' : 'LAYER';
  modeAffordances.forEach((affordance) => {
    affordance.textContent = modeLabel;
    affordance.setAttribute('data-mode', _currentToggleMode);
  });

  // Ensure page-only actions are visible only in onPage mode
  const pageActionsGroup = document.getElementById('page-actions-group');
  if (pageActionsGroup) {
    pageActionsGroup.style.display = _currentToggleMode === 'onPage' ? 'inline-flex' : 'none';
  }

  // Show indent/outdent buttons only in onPage mode
  const buttonsRight = document.querySelector('.buttons-right') as HTMLElement;
  if (buttonsRight) {
    buttonsRight.style.display = _currentToggleMode === 'onPage' ? 'flex' : 'none';
  }

  // Show anatomy-prefix only in onPage mode
  const anatomyPrefix = document.querySelector('.anatomy-prefix') as HTMLElement;
  if (anatomyPrefix) {
    anatomyPrefix.style.display = _currentToggleMode === 'onPage' ? 'inline-flex' : 'none';
  }

  // Swap hierarchy control icons based on mode
  // Base64 data URIs for dynamic icon swapping (required for Figma plugin sandbox)
  const ICON_PAGE_UP = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIgMi41QzIgMS4zOTU0MyAyLjg5NTQzIDAuNSA0IDAuNUg5LjIzMDA5QzkuNzI1NjQgMC41IDEwLjIwMzUgMC42ODM5NjkgMTAuNTcxMiAxLjAxNjI1TDEzLjM0MTEgMy41MTk4MkMxMy43NjA2IDMuODk5MDEgMTQgNC40MzgwNyAxNCA1LjAwMzU3VjEzLjVDMTQgMTQuNjA0NiAxMy4xMDQ2IDE1LjUgMTIgMTUuNUg0QzIuODk1NDMgMTUuNSAyIDE0LjYwNDYgMiAxMy41VjIuNVoiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNOS41IDFWNEM5LjUgNC41NTIyOCA5Ljk0NzcyIDUgMTAuNSA1SDEzLjUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNOCA3LjY2NjVWMTEuNjY2NSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik02IDkuNjY2NUw4IDcuNjY2NUwxMCA5LjY2NjUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4=';
  const ICON_PAGE_DOWN = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIgMi41QzIgMS4zOTU0MyAyLjg5NTQzIDAuNSA0IDAuNUg5LjIzMDA5QzkuNzI1NjQgMC41IDEwLjIwMzUgMC42ODM5NjkgMTAuNTcxMiAxLjAxNjI1TDEzLjM0MTEgMy41MTk4MkMxMy43NjA2IDMuODk5MDEgMTQgNC40MzgwNyAxNCA1LjAwMzU3VjEzLjVDMTQgMTQuNjA0NiAxMy4xMDQ2IDE1LjUgMTIgMTUuNUg0QzIuODk1NDMgMTUuNSAyIDE0LjYwNDYgMiAxMy41VjIuNVoiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNOS41IDFWNEM5LjUgNC41NTIyOCA5Ljk0NzcyIDUgMTAuNSA1SDEzLjUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNOCAxMS42NjY1VjcuNjY2NSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik02IDkuNjY2NUw4IDExLjY2NjVMMTAgOS42NjY1IiBzdHJva2U9IndoaXRlIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+';
  const ICON_PAGE_ENTER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIgN1YyLjVDMiAxLjM5NTQzIDIuODk1NDMgMC41IDQgMC41SDkuMjMwMDlDOS43MjU2NCAwLjUgMTAuMjAzNSAwLjY4Mzk2OSAxMC41NzEyIDEuMDE2MjVMMTMuMzQxMSAzLjUxOTgyQzEzLjc2MDYgMy44OTkwMSAxNCA0LjQzODA3IDE0IDUuMDAzNTdWMTMuNUMxNCAxNC42MDQ2IDEzLjEwNDYgMTUuNSAxMiAxNS41SDRDMS44OTU0MyAxNS41IDIgMTQuNjA0NiAyIDEzLjVWMTIuNzUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNOS41IDFWNEM5LjUgNC41NTIyOCA5Ljk0NzcyIDUgMTAuNSA1SDEzLjUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNOSAxMEwyIDEwIiBzdHJva2U9IndoaXRlIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTcgOEw5IDEwTDcgMTIiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4=';
  const ICON_FOLDER_UP = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEzLjMzMzMgMTMuMzMzM0MxMy42ODY5IDEzLjMzMzMgMTQuMDI2IDEzLjE5MjkgMTQuMjc2MSAxMi45NDI4QzE0LjUyNjEgMTIuNjkyOCAxNC42NjY2IDEyLjM1MzYgMTQuNjY2NiAxMlY1LjMzMzMzQzE0LjY2NjYgNC45Nzk3MSAxNC41MjYxIDQuNjQwNTcgMTQuMjc2MSA0LjM5MDUzQzE0LjAyNiA0LjE0MDQ4IDEzLjY4NjkgNCAxMy4zMzMzIDRIOC4wNjY1OUM3Ljg0MzYgNC4wMDIxOSA3LjYyMzYyIDMuOTQ4NDEgNy40MjY3OSAzLjg0MzU5QzcuMjI5OTYgMy43Mzg3NyA3LjA2MjU2IDMuNTg2MjUgNi45Mzk5MiAzLjRMNi4zOTk5MiAyLjZDNi4yNzg1MSAyLjQxNTY1IDYuMTEzMjQgMi4yNjQzMiA1LjkxODkyIDIuMTU5NkM1LjcyNDYgMi4wNTQ4OCA1LjUwNzMzIDIuMDAwMDQgNS4yODY1OSAySDIuNjY2NTlDMi4zMTI5NiAyIDEuOTczODIgMi4xNDA0OCAxLjcyMzc4IDIuMzkwNTJDMS40NzM3MyAyLjY0MDU3IDEuMzMzMjUgMi45Nzk3MSAxLjMzMzI1IDMuMzMzMzNWMTJDMS4zMzMyNSAxMi4zNTM2IDEuNDczNzMgMTIuNjkyOCAxLjcyMzc4IDEyLjk0MjhDMS45NzM4MiAxMy4xOTI5IDIuMzEyOTYgMTMuMzMzMyAyLjY2NjU5IDEzLjMzMzNIMTMuMzMzM1oiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNOCA2LjY2NjVWMTAuNjY2NSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik02IDguNjY2NUw4IDYuNjY2NUwxMCA4LjY2NjUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4=';
  const ICON_FOLDER_DOWN = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEzLjMzMzMgMTMuMzMzM0MxMy42ODY5IDEzLjMzMzMgMTQuMDI2IDEzLjE5MjkgMTQuMjc2MSAxMi45NDI4QzE0LjUyNjEgMTIuNjkyOCAxNC42NjY2IDEyLjM1MzYgMTQuNjY2NiAxMlY1LjMzMzMzQzE0LjY2NjYgNC45Nzk3MSAxNC41MjYxIDQuNjQwNTcgMTQuMjc2MSA0LjM5MDUzQzE0LjAyNiA0LjE0MDQ4IDEzLjY4NjkgNCAxMy4zMzMzIDRIOC4wNjY1OUM3Ljg0MzYgNC4wMDIxOSA3LjYyMzYyIDMuOTQ4NDEgNy40MjY3OSAzLjg0MzU5QzcuMjI5OTYgMy43Mzg3NyA3LjA2MjU2IDMuNTg2MjUgNi45Mzk5MiAzLjRMNi4zOTk5MiAyLjZDNi4yNzg1MSAyLjQxNTY1IDYuMTEzMjQgMi4yNjQzMiA1LjkxODkyIDIuMTU5NkM1LjcyNDYgMi4wNTQ4OCA1LjUwNzMzIDIuMDAwMDQgNS4yODY1OSAySDIuNjY2NTlDMi4zMTI5NiAyIDEuOTczODIgMi4xNDA0OCAxLjcyMzc4IDIuMzkwNTJDMS40NzM3MyAyLjY0MDU3IDEuMzMzMjUgMi45Nzk3MSAxLjMzMzI1IDMuMzMzMzNWMTJDMS4zMzMyNSAxMi4zNTM2IDEuNDczNzMgMTIuNjkyOCAxLjcyMzc4IDEyLjk0MjhDMS45NzM4MiAxMy4xOTI5IDIuMzEyOTYgMTMuMzMzMyAyLjY2NjU5IDEzLjMzMzNIMTMuMzMzM1oiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNOCAxMC42NjY1VjYuNjY2NSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik0xMCA4LjY2NjVMOCAxMC42NjY1TDYgOC42NjY1IiBzdHJva2U9IndoaXRlIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+';
  const ICON_FOLDER_ENTER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEuMzMzMjUgNS4wMDAwNlYzLjMzMzRDMS4zMzMyNSAyLjk3OTc4IDEuNDczNzMgMi42NDA2NCAxLjcyMzc4IDIuMzkwNTlDMS45NzM4MiAyLjE0MDU0IDIuMzEyOTYgMi4wMDAwNiAyLjY2NjU5IDIuMDAwMDZINS4yNjY1OUM1LjQ4OTU4IDEuOTk3ODggNS43MDk1NiAyLjA1MTY2IDUuOTA2MzkgMi4xNTY0OEM2LjEwMzIyIDIuMjYxMyA2LjI3MDYxIDIuNDEzODEgNi4zOTMyNSAyLjYwMDA2TDYuOTMzMjUgMy40MDAwNkM3LjA1NDY2IDMuNTg0NDIgNy4yMTk5NCAzLjczNTc0IDcuNDE0MjUgMy44NDA0N0M3LjYwODU3IDMuOTQ1MTkgNy44MjU4NSA0LjAwMDAzIDguMDQ2NTkgNC4wMDAwNkgxMy4zMzMzQzEzLjY4NjkgNC4wMDAwNiAxNC4wMjYgNC4xNDA1NCAxNC4yNzYxIDQuMzkwNTlDMTQuNTI2MSA0LjY0MDY0IDE0LjY2NjYgNC45Nzk3OCAxNC42NjY2IDUuMzMzNFYxMi4wMDAxQzE0LjY2NjYgMTIuMzUzNyAxNC41MjYxIDEyLjY5MjggMTQuMjc2MSAxMi45NDI5QzE0LjAyNiAxMy4xOTI5IDEzLjY4NjkgMTMuMzMzNCAxMy4zMzMzIDEzLjMzMzRIMi42NjY1OUMyLjM2MzggMTMuMzQzIDIuMDY2NzcgMTMuMjQ5MiAxLjgyNDQyIDEzLjA2NzRDMS41ODIwNyAxMi44ODU2IDEuNDA4ODQgMTIuNjI2OCAxLjMzMzI1IDEyLjMzMzQiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNOCA4LjY2NjVIMS4zMzMzMyIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik02IDYuNjY2NUw4IDguNjY2NUw2IDEwLjY2NjUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4=';

  const iconSwaps: Array<{ buttonId: string; pageIcon: string; layerIcon: string }> = [
    { buttonId: 'nav-prev', pageIcon: ICON_PAGE_UP, layerIcon: ICON_FOLDER_UP },
    { buttonId: 'nav-next', pageIcon: ICON_PAGE_DOWN, layerIcon: ICON_FOLDER_DOWN },
    { buttonId: 'nav-enter', pageIcon: ICON_PAGE_ENTER, layerIcon: ICON_FOLDER_ENTER }
  ];

  iconSwaps.forEach(({ buttonId, pageIcon, layerIcon }) => {
    const button = document.getElementById(buttonId);
    const iconImg = button?.querySelector('.nav-icon img') as HTMLImageElement | null;
    if (iconImg) {
      iconImg.src = _currentToggleMode === 'onPage' ? pageIcon : layerIcon;
    }
  });
}

// Note: Manual toggle removed - mode is now controlled by selection state only

// Compute natural content height respecting collapsed sections and sticky elements
export function computeFitHeight(): number {
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
  if (Math.abs(totalHeight - _lastAutoFitHeight) > 3) {
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
export const autoFitDebounceTimer: number | null = null;
export let scrollBehaviorDebounceTimer: number | null = null;

// Check if scrolling should be enabled based on content height
export function updateScrollBehavior(): void {
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
  if (_isAutoFitEnabled) {
    const newHeight = computeFitHeight();

    // Only resize if height changed significantly (more than 3px difference)
    if (Math.abs(newHeight - _lastAutoFitHeight) > 3) {
      console.log('Auto-fit: adjusting height from', _lastAutoFitHeight, 'to', newHeight);
      sendMessage('resize-ui', { height: newHeight });
      _lastAutoFitHeight = newHeight;
    }
  }
}
