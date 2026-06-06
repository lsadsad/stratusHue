import { describe, it, expect, vi, beforeEach } from 'vitest';

// Minimal fake WebSocket so we can drive bridge-client's connect lifecycle and
// inspect exactly what it sends over the wire (the FILE_INFO identification handshake).
class FakeWebSocket {
  static OPEN = 1;
  static CONNECTING = 0;
  static CLOSING = 2;
  static CLOSED = 3;
  static instances: FakeWebSocket[] = [];

  url: string;
  readyState = FakeWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  sent: string[] = [];

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }
  send(data: string): void { this.sent.push(data); }
  close(): void { this.readyState = FakeWebSocket.CLOSED; }

  simulateOpen(): void {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.();
  }
  fileInfoMessages(): Array<Record<string, any>> {
    return this.sent.map((s) => JSON.parse(s)).filter((m) => m.type === 'FILE_INFO');
  }
}

async function freshClient() {
  vi.resetModules();
  FakeWebSocket.instances = [];
  (globalThis as any).WebSocket = FakeWebSocket;
  return import('../ui/bridge/bridge-client');
}

describe('bridge-client FILE_INFO handshake', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends FILE_INFO over a socket on connect when identity is already known', async () => {
    const mod = await freshClient();
    mod.setBridgeFileInfo({ fileKey: 'KEY1', fileName: 'L3Vs Sandbox' });
    mod.initBridgeClient(true);

    const ws = FakeWebSocket.instances[0];
    expect(ws).toBeTruthy();
    ws.simulateOpen();

    const msgs = ws.fileInfoMessages();
    expect(msgs).toHaveLength(1);
    expect(msgs[0].data).toMatchObject({ fileKey: 'KEY1', fileName: 'L3Vs Sandbox' });
  });

  it('re-sends FILE_INFO to already-open sockets when identity arrives late', async () => {
    const mod = await freshClient();
    mod.initBridgeClient(true);

    const ws = FakeWebSocket.instances[0];
    ws.simulateOpen();
    // No identity yet → nothing identified itself.
    expect(ws.fileInfoMessages()).toHaveLength(0);

    mod.setBridgeFileInfo({ fileKey: 'KEY2', fileName: 'Late File' });

    const msgs = ws.fileInfoMessages();
    expect(msgs).toHaveLength(1);
    expect(msgs[0].data.fileKey).toBe('KEY2');
  });

  it('does not send FILE_INFO when the file has no key (server would reject it)', async () => {
    const mod = await freshClient();
    mod.initBridgeClient(true);
    const ws = FakeWebSocket.instances[0];
    ws.simulateOpen();

    mod.setBridgeFileInfo({ fileKey: null, fileName: 'Unsaved' });

    expect(ws.fileInfoMessages()).toHaveLength(0);
  });
});
