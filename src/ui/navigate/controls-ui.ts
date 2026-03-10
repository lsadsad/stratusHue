import type { NavigationContext } from '../../types';

// Navigation context state
export let navigationContext: NavigationContext = {
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
export let controlsEnabled = true;

// Per-group visibility state
export let groupMovementZoomVisible = true;
export let groupHierarchyVisible = true;
export let groupSizingModesVisible = true;
export let groupStyledTextVisible = false;

// Nudge settings (user-configurable)
export let smallNudgeAmount = 1;
export let bigNudgeAmount = 8;

// Setters for group visibility (used by settings-ui)
export function setGroupMovementZoomVisible(v: boolean): void { groupMovementZoomVisible = v; }
export function setGroupHierarchyVisible(v: boolean): void { groupHierarchyVisible = v; }
export function setGroupSizingModesVisible(v: boolean): void { groupSizingModesVisible = v; }
export function setGroupStyledTextVisible(v: boolean): void { groupStyledTextVisible = v; }
export function setSmallNudgeAmount(v: number): void { smallNudgeAmount = v; }
export function setBigNudgeAmount(v: number): void { bigNudgeAmount = v; }
export function setControlsEnabled(v: boolean): void { controlsEnabled = v; }
export function setNavigationContext(ctx: NavigationContext): void { navigationContext = ctx; }

// Update control button states based on context
export function updateControlButtons(context: NavigationContext): void {
  const enterBtn = document.getElementById('nav-enter') as HTMLButtonElement;
  const exitBtn = document.getElementById('nav-exit') as HTMLButtonElement;
  const prevBtn = document.getElementById('nav-prev') as HTMLButtonElement;
  const nextBtn = document.getElementById('nav-next') as HTMLButtonElement;
  const collapseBtn = document.getElementById('nav-collapse') as HTMLButtonElement;
  // const gotoComponentBtn = document.getElementById('nav-goto-component') as HTMLButtonElement; // Button removed from UI

  if (enterBtn) {
    const canEnter = context.canEnter;
    const isPageMode = !context.hasSelection;
    const _wasDisabled = enterBtn.disabled;

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
export function updateControlsVisibility(enabled: boolean): void {
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
export function applyGroupVisibility(): void {
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
export function updateGroupTogglesUI(): void {
  const toggleMovementZoom = document.getElementById('toggle-movement-zoom') as HTMLInputElement;
  const toggleHierarchy = document.getElementById('toggle-hierarchy') as HTMLInputElement;
  const toggleSizingModes = document.getElementById('toggle-sizing-modes') as HTMLInputElement;
  const toggleStyledText = document.getElementById('toggle-styled-text') as HTMLInputElement;

  if (toggleMovementZoom) toggleMovementZoom.checked = groupMovementZoomVisible;
  if (toggleHierarchy) toggleHierarchy.checked = groupHierarchyVisible;
  if (toggleSizingModes) toggleSizingModes.checked = groupSizingModesVisible;
  if (toggleStyledText) toggleStyledText.checked = groupStyledTextVisible;
}
