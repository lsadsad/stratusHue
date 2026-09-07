// Bridge UI — manages status dots in the footer and bridge settings section.

import {
  initBridgeClient,
  setBridgeEnabled,
  connectCloud,
  disconnectCloudRelay,
  onStatusChange,
  type BridgeStatus,
  type BridgeConnectionState,
} from './bridge-client';

let bridgeEnabled = false;
let lastCloudState: BridgeConnectionState | null = null;

// The bridge settings row and footer status dots are static markup in ui.html, so
// they ship in every build. In production the manifest declares networkAccess
// ["none"] and no socket can open — leaving the controls visible gives users a
// toggle that silently does nothing (btg). Hide them instead. Exported for tests;
// initBridgeUI passes the __BRIDGE_UI__ build flag.
export function applyBridgeUIVisibility(enabled: boolean): void {
  if (enabled) return;
  const section = document.getElementById('bridge-settings-section');
  const statusDots = document.getElementById('bridge-status-dots');
  if (section) section.hidden = true;
  if (statusDots) statusDots.hidden = true;
}

// Maps the cloud connection state (and the state it came from) to the message shown in
// the cloud status line. The Connect button previously gave no textual feedback — dots
// only — so a click read as a no-op. Exported for unit testing.
export function cloudStatusLabel(
  state: BridgeConnectionState,
  prev: BridgeConnectionState | null,
): string {
  switch (state) {
    case 'connecting':
      return 'Connecting…';
    case 'connected':
      return 'Connected';
    case 'disconnected':
      if (prev === 'connecting') return "Couldn't connect — check the code";
      if (prev === 'connected') return 'Disconnected';
      return '';
  }
}

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
  updateToggleUI();
}

// ===== SETTINGS SECTION =====

function updateToggleUI(): void {
  const toggle = document.getElementById('bridge-enable-toggle') as HTMLInputElement | null;
  const cloudSection = document.getElementById('bridge-cloud-section');
  const statusDots = document.getElementById('bridge-status-dots');
  if (toggle) toggle.checked = bridgeEnabled;
  if (cloudSection) cloudSection.hidden = !bridgeEnabled;
  if (statusDots) statusDots.hidden = !bridgeEnabled;
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
  // Production build: hide the controls and wire nothing.
  if (!__BRIDGE_UI__) {
    applyBridgeUIVisibility(false);
    return;
  }

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

    // Cloud status line + Connect-button feedback (dots alone read as a no-op).
    const statusEl = document.getElementById('bridge-cloud-status');
    if (statusEl) {
      statusEl.textContent = cloudStatusLabel(status.cloud, lastCloudState);
      statusEl.dataset.state = status.cloud;
    }
    if (connectBtn) {
      (connectBtn as HTMLButtonElement).disabled = status.cloud === 'connecting';
      connectBtn.textContent = status.cloud === 'connecting' ? 'Connecting…' : 'Connect';
    }
    lastCloudState = status.cloud;
  });

  wireSettingsHandlers();
  updateToggleUI();

  if (savedPairCode) {
    const pairInput = document.getElementById('bridge-cloud-pair-input') as HTMLInputElement | null;
    if (pairInput) pairInput.value = savedPairCode;
  }

  initBridgeClient(enabled, savedPairCode);
}
