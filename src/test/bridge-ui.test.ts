import { describe, it, expect } from 'vitest';
import { cloudStatusLabel } from '../ui/bridge/bridge-ui';

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

