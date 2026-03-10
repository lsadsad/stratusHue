import { sendMessage } from '../shared/send-message';
import {
  applyGroupVisibility,
  groupMovementZoomVisible,
  groupHierarchyVisible,
  groupSizingModesVisible,
  groupStyledTextVisible,
  smallNudgeAmount,
  bigNudgeAmount,
  setGroupMovementZoomVisible,
  setGroupHierarchyVisible,
  setGroupSizingModesVisible,
  setGroupStyledTextVisible,
  setSmallNudgeAmount,
  setBigNudgeAmount
} from './controls-ui';

// Setup controls settings
export function setupControlsSettings(): void {
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
export function setupGroupToggle(toggleId: string, groupKey: string): void {
  const toggle = document.getElementById(toggleId) as HTMLInputElement;
  if (toggle) {
    toggle.addEventListener('change', () => {
      const visible = toggle.checked;
      // Update local state
      switch (groupKey) {
        case 'movementZoom': setGroupMovementZoomVisible(visible); break;
        case 'hierarchy': setGroupHierarchyVisible(visible); break;
        case 'sizingModes': setGroupSizingModesVisible(visible); break;
        case 'styledText': setGroupStyledTextVisible(visible); break;
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
export function setupNudgeSettings(): void {
  const smallNudgeInput = document.getElementById('small-nudge-input') as HTMLInputElement;
  const bigNudgeInput = document.getElementById('big-nudge-input') as HTMLInputElement;

  if (smallNudgeInput) {
    smallNudgeInput.addEventListener('change', () => {
      const value = parseInt(smallNudgeInput.value, 10);
      if (!isNaN(value) && value >= 1 && value <= 100) {
        setSmallNudgeAmount(value);
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
        setBigNudgeAmount(value);
        sendMessage('set-nudge-settings', { smallNudge: smallNudgeAmount, bigNudge: bigNudgeAmount });
      } else {
        // Reset to current value if invalid
        bigNudgeInput.value = String(bigNudgeAmount);
      }
    });
  }
}

// Update nudge settings UI from plugin storage
export function updateNudgeSettingsUI(small: number, big: number): void {
  setSmallNudgeAmount(small);
  setBigNudgeAmount(big);

  const smallNudgeInput = document.getElementById('small-nudge-input') as HTMLInputElement;
  const bigNudgeInput = document.getElementById('big-nudge-input') as HTMLInputElement;

  if (smallNudgeInput) {
    smallNudgeInput.value = String(small);
  }
  if (bigNudgeInput) {
    bigNudgeInput.value = String(big);
  }
}
