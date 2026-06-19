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

  it('sends FILE_INFO over the cloud relay socket on connect', async () => {
    const mod = await freshClient();
    mod.setBridgeFileInfo({ fileKey: 'CKEY', fileName: 'Cloud File' });
    mod.initBridgeClient(true);
    mod.connectCloud('ABCDEF'); // explicit user pairing to cloud relay

    const cloudWs = FakeWebSocket.instances.find((w) => w.url.includes('/ws/pair'));
    expect(cloudWs, 'expected a cloud relay socket').toBeTruthy();
    cloudWs!.simulateOpen();

    const msgs = cloudWs!.fileInfoMessages();
    expect(msgs).toHaveLength(1);
    expect(msgs[0].data).toMatchObject({ fileKey: 'CKEY', fileName: 'Cloud File' });
  });

  it('re-sends FILE_INFO to the cloud socket when identity arrives late', async () => {
    const mod = await freshClient();
    mod.initBridgeClient(true);
    mod.connectCloud('ABCDEF');

    const cloudWs = FakeWebSocket.instances.find((w) => w.url.includes('/ws/pair'));
    cloudWs!.simulateOpen();
    expect(cloudWs!.fileInfoMessages()).toHaveLength(0);

    mod.setBridgeFileInfo({ fileKey: 'CKEY2', fileName: 'Late Cloud File' });

    expect(cloudWs!.fileInfoMessages()[0].data.fileKey).toBe('CKEY2');
  });

  it('does NOT auto-connect to a saved pairing code on init (one-time codes are already consumed)', async () => {
    const mod = await freshClient();
    mod.setBridgeFileInfo({ fileKey: 'CKEY', fileName: 'Cloud File' });
    mod.initBridgeClient(true, 'SAVED1'); // a previously-used, now-consumed code

    const cloudWs = FakeWebSocket.instances.find((w) => w.url.includes('/ws/pair'));
    expect(cloudWs, 'must not auto-open a cloud socket with a consumed code').toBeFalsy();
  });

  it('does NOT auto-reconnect the cloud socket after it closes (would reuse a consumed code and clobber a live socket)', async () => {
    vi.useFakeTimers();
    try {
      const mod = await freshClient();
      mod.setBridgeFileInfo({ fileKey: 'CKEY', fileName: 'Cloud File' });
      mod.initBridgeClient(true);
      mod.connectCloud('ABCDEF');

      const firstCloud = FakeWebSocket.instances.find((w) => w.url.includes('/ws/pair'))!;
      firstCloud.simulateOpen();
      firstCloud.readyState = FakeWebSocket.CLOSED;
      firstCloud.onclose?.();

      // The relay never reissues the same one-time code, so reconnecting is futile.
      vi.advanceTimersByTime(60000);

      const cloudSockets = FakeWebSocket.instances.filter((w) => w.url.includes('/ws/pair'));
      expect(cloudSockets).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('sends a periodic PING keepalive on the cloud socket to survive relay idle-close', async () => {
    vi.useFakeTimers();
    try {
      const mod = await freshClient();
      mod.setBridgeFileInfo({ fileKey: 'CKEY', fileName: 'Cloud File' });
      mod.initBridgeClient(true);
      mod.connectCloud('ABCDEF'); // explicit user pairing to cloud relay

      const cloudWs = FakeWebSocket.instances.find((w) => w.url.includes('/ws/pair'))!;
      cloudWs.simulateOpen();
      cloudWs.sent = []; // drop the FILE_INFO sent on open

      // The Cloudflare relay closes idle hibernatable sockets; a periodic frame keeps it warm.
      vi.advanceTimersByTime(20000);

      const pings = cloudWs.sent.map((s) => JSON.parse(s)).filter((m) => m.type === 'PING');
      expect(pings.length).toBeGreaterThanOrEqual(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('stops the cloud keepalive once the socket closes (no leaked timer)', async () => {
    vi.useFakeTimers();
    try {
      const mod = await freshClient();
      mod.setBridgeFileInfo({ fileKey: 'CKEY', fileName: 'Cloud File' });
      mod.initBridgeClient(true);
      mod.connectCloud('ABCDEF');

      const cloudWs = FakeWebSocket.instances.find((w) => w.url.includes('/ws/pair'))!;
      cloudWs.simulateOpen();
      cloudWs.readyState = FakeWebSocket.CLOSED;
      cloudWs.onclose?.();
      cloudWs.sent = [];

      vi.advanceTimersByTime(60000);

      const pings = cloudWs.sent.map((s) => JSON.parse(s)).filter((m) => m.type === 'PING');
      expect(pings).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('broadcastEvent keys events by `type` (server contract), not `event`', async () => {
    const mod = await freshClient();
    mod.setBridgeFileInfo({ fileKey: 'K', fileName: 'F' });
    mod.initBridgeClient(true);
    const ws = FakeWebSocket.instances[0];
    ws.simulateOpen();
    ws.sent = []; // drop the FILE_INFO sent on open

    mod.broadcastEvent('SELECTION_CHANGE', { nodes: [], count: 0, page: 'P', timestamp: 1 });

    const sent = ws.sent.map((s) => JSON.parse(s));
    const evt = sent.find((m) => m.type === 'SELECTION_CHANGE');
    expect(evt, 'server matches on message.type, so it must be keyed `type`').toBeTruthy();
    expect(evt.data).toMatchObject({ count: 0, page: 'P' });
    // Must NOT use the old `event` key the server ignores.
    expect(sent.find((m) => m.event === 'SELECTION_CHANGE')).toBeFalsy();
  });
});
