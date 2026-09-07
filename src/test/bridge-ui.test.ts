import { describe, it, expect, beforeEach } from 'vitest';
import { cloudStatusLabel, applyBridgeUIVisibility } from '../ui/bridge/bridge-ui';

// The Connect button gave no textual feedback (dots only), so a click looked like a
// no-op. cloudStatusLabel maps the cloud connection state — and the state it came
// from — to the message shown in the cloud status line.
describe('cloudStatusLabel', () => {
  it('shows "Connecting…" while connecting', () => {
    expect(cloudStatusLabel('connecting', null)).toBe('Connecting…');
  });

  it('shows "Connected" once connected', () => {
    expect(cloudStatusLabel('connected', 'connecting')).toBe('Connected');
  });

  it('shows a check-the-code error when a connect attempt fails (connecting → disconnected)', () => {
    expect(cloudStatusLabel('disconnected', 'connecting')).toBe("Couldn't connect — check the code");
  });

  it('shows "Disconnected" after a live connection drops (connected → disconnected)', () => {
    expect(cloudStatusLabel('disconnected', 'connected')).toBe('Disconnected');
  });

  it('shows nothing before any attempt (disconnected with no prior state)', () => {
    expect(cloudStatusLabel('disconnected', null)).toBe('');
  });
});

// The prod manifest declares networkAccess ["none"], so the bridge cannot open a
// socket in the Community build — but the settings row is static markup in
// ui.html and shipped visible, giving users a control that does nothing (btg).
// applyBridgeUIVisibility is the runtime gate; the build flag decides which way
// it is called.
describe('applyBridgeUIVisibility', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="bridge-settings-section"></div>
      <li id="bridge-status-dots" hidden></li>`;
  });

  it('hides the settings section and status dots when the bridge UI is off', () => {
    applyBridgeUIVisibility(false);
    expect(document.getElementById('bridge-settings-section')?.hidden).toBe(true);
    expect(document.getElementById('bridge-status-dots')?.hidden).toBe(true);
  });

  it('leaves the settings section alone when the bridge UI is on', () => {
    applyBridgeUIVisibility(true);
    expect(document.getElementById('bridge-settings-section')?.hidden).toBe(false);
  });

  it('does not throw when the bridge markup is absent', () => {
    document.body.innerHTML = '';
    expect(() => applyBridgeUIVisibility(false)).not.toThrow();
  });
});
