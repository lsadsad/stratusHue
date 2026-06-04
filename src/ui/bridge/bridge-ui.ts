// Bridge UI — manages status dots in the footer and bridge settings section.

import {
  initBridgeClient,
  setBridgeEnabled,
  connectCloud,
  disconnectCloudRelay,
  onStatusChange,
  type BridgeStatus,
} from './bridge-client';

let bridgeEnabled = false;

// ===== STATUS INDICATORS =====

function setDotState(dot: HTMLElement | null, state: 'disconnected' | 'connecting' | 'connected'): void {
  if (!dot) return;
  dot.dataset.bridgeState = state;
  dot.title = `Bridge ${dot.dataset.bridgeType}: ${state}`;
}

function updateStatusDots(status: BridgeStatus): void {
  const localDot = document.getElementById('bridge-status-local');
  const cloudDot = document.getElementById('bridge-status-cloud');
  setDotState(localDot, status.local);
  setDotState(cloudDot, status.cloud);

  const section = document.getElementById('bridge-status-dots');
  if (section) section.hidden = !bridgeEnabled;
}

// ===== SETTINGS SECTION =====

function updateToggleUI(): void {
  const toggle = document.getElementById('bridge-enable-toggle') as HTMLInputElement | null;
  const cloudSection = document.getElementById('bridge-cloud-section');
  if (toggle) toggle.checked = bridgeEnabled;
  if (cloudSection) cloudSection.hidden = !bridgeEnabled;
}

function wireSettingsHandlers(): void {
  // Enable/disable toggle
  const toggle = document.getElementById('bridge-enable-toggle');
  toggle?.addEventListener('change', (e) => {
    bridgeEnabled = (e.target as HTMLInputElement).checked;
    setBridgeEnabled(bridgeEnabled);
    updateToggleUI();
  });

  // Cloud pairing connect button
  const connectBtn = document.getElementById('bridge-cloud-connect-btn');
  const pairInput = document.getElementById('bridge-cloud-pair-input') as HTMLInputElement | null;
  connectBtn?.addEventListener('click', () => {
    const code = pairInput?.value.trim().toUpperCase();
    if (code && code.length === 6) {
      connectCloud(code);
    }
  });

  // Allow Enter key in pair code input
  pairInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') connectBtn?.click();
  });

  // Cloud disconnect button
  const disconnectBtn = document.getElementById('bridge-cloud-disconnect-btn');
  disconnectBtn?.addEventListener('click', () => {
    disconnectCloudRelay();
    if (pairInput) pairInput.value = '';
  });
}

// ===== INIT =====

export function initBridgeUI(enabled: boolean, savedPairCode?: string): void {
  bridgeEnabled = enabled;

  // Register status update handler before init so we catch initial state
  onStatusChange((status) => {
    updateStatusDots(status);
    // Update cloud button visibility based on connection state
    const connectBtn = document.getElementById('bridge-cloud-connect-btn');
    const disconnectBtn = document.getElementById('bridge-cloud-disconnect-btn');
    const pairInput = document.getElementById('bridge-cloud-pair-input') as HTMLInputElement | null;

    if (connectBtn) connectBtn.hidden = status.cloud === 'connected';
    if (disconnectBtn) disconnectBtn.hidden = status.cloud !== 'connected';
    if (pairInput && status.cloud === 'connected') {
      pairInput.disabled = true;
    } else if (pairInput) {
      pairInput.disabled = false;
    }
  });

  wireSettingsHandlers();
  updateToggleUI();

  if (savedPairCode) {
    const pairInput = document.getElementById('bridge-cloud-pair-input') as HTMLInputElement | null;
    if (pairInput) pairInput.value = savedPairCode;
  }

  initBridgeClient(enabled, savedPairCode);
}
