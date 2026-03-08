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

export function showTooltip(target: HTMLElement, immediate = false): void {
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

export function hideTooltip(immediate = false): void {
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

export function initializeQuickActionTooltips(): void {
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
