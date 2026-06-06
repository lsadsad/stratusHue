// Bridge WebSocket client — runs in the UI iframe.
// Opens WS connections to local MCP server ports (9223-9232) and
// optionally to the cloud relay at wss://figma-console-mcp.southleft.com
//
// Incoming WS messages (from MCP client):
//   { id: string, method: string, params?: Record<string,unknown> }
// → routed as parent.postMessage to sandbox
//
// Outgoing WS messages (back to MCP client):
//   { id: string, result: unknown } | { id: string, error: string }
//
// Sandbox responses come back as window.message events:
//   { pluginMessage: { type: 'BRIDGE_RESPONSE', requestId, result | error } }

import { sendMessage } from '../shared/send-message';

export type BridgeConnectionState = 'disconnected' | 'connecting' | 'connected';

export interface BridgeStatus {
  local: BridgeConnectionState;
  cloud: BridgeConnectionState;
  localPort?: number;
  cloudPairCode?: string;
}

type StatusChangeCallback = (status: BridgeStatus) => void;

const LOCAL_PORTS = [9223, 9224, 9225, 9226, 9227, 9228, 9229, 9230, 9231, 9232];
const CLOUD_URL = 'wss://figma-console-mcp.southleft.com/ws/pair';
const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_DELAY_MS = 30000;

// Maps requestId → WS socket so we can route responses back
const pendingRequests = new Map<string, { ws: WebSocket; resolve: (v: unknown) => void }>();

let localSockets: Map<number, WebSocket> = new Map();
let cloudSocket: WebSocket | null = null;
let cloudPairCode: string | null = null;
let cloudReconnectDelay = RECONNECT_DELAY_MS;

let status: BridgeStatus = { local: 'disconnected', cloud: 'disconnected' };
let statusChangeCallback: StatusChangeCallback | null = null;

let bridgeEnabled = false;

// Latest file identity pushed from the sandbox. Sent as the FILE_INFO handshake
// on every (re)connect so the figma-studio server can identify this client's file.
let localFileInfo: { fileKey: string | null;[key: string]: unknown } | null = null;

export function onStatusChange(cb: StatusChangeCallback): void {
  statusChangeCallback = cb;
}

function emitStatus(): void {
  statusChangeCallback?.(status);
}

function updateLocalStatus(state: BridgeConnectionState, port?: number): void {
  status = { ...status, local: state, localPort: port };
  emitStatus();
}

function updateCloudStatus(state: BridgeConnectionState): void {
  status = { ...status, cloud: state };
  emitStatus();
}

// ===== COMMAND ROUTING =====

// MCP → sandbox
function routeCommandToSandbox(ws: WebSocket, msg: { id: string; method: string; params?: Record<string, unknown> }): void {
  // Map method names (Desktop Bridge convention) to bridge-cmd message types
  const sandboxType = `bridge-cmd-${msg.method.toLowerCase().replace(/_/g, '-')}`;
  const requestId = `ws-${msg.id}`;

  pendingRequests.set(requestId, {
    ws,
    resolve: (result) => {
      const response = 'error' in (result as Record<string, unknown>)
        ? { id: msg.id, error: (result as { error: string }).error }
        : { id: msg.id, result: (result as { result: unknown }).result };
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(response));
      }
      pendingRequests.delete(requestId);
    }
  });

  parent.postMessage({ pluginMessage: { type: sandboxType, requestId, ...(msg.params ?? {}) } }, '*');
}

// sandbox → MCP (called from window message listener in ui.ts)
export function handleBridgeResponse(requestId: string, result: unknown, error?: string): void {
  const pending = pendingRequests.get(requestId);
  if (!pending) return;
  pending.resolve(error ? { error } : { result });
}

// ===== EVENT BROADCASTING (sandbox → all connected WS clients) =====

export function broadcastEvent(eventType: string, payload: unknown): void {
  // Server matches incoming events on `message.type` (not `event`); keep this key
  // aligned with the figma-studio websocket-server contract.
  const msg = JSON.stringify({ type: eventType, data: payload });
  for (const ws of localSockets.values()) {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  }
  if (cloudSocket?.readyState === WebSocket.OPEN) {
    cloudSocket.send(msg);
  }
}

// ===== LOCAL WS (port scanning) =====

// The figma-studio server holds every new client "pending" and closes it after 30s
// unless it sends a FILE_INFO message carrying a fileKey. Send it on connect.
function sendFileInfo(ws: WebSocket): void {
  if (!localFileInfo || !localFileInfo.fileKey) return;
  if (ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify({ type: 'FILE_INFO', data: localFileInfo }));
}

function connectToPort(port: number): void {
  if (!bridgeEnabled) return;

  const url = `ws://localhost:${port}`;
  let ws: WebSocket;
  try {
    ws = new WebSocket(url);
  } catch {
    return;
  }

  ws.onopen = () => {
    localSockets.set(port, ws);
    updateLocalStatus('connected', port);
    sendMessage('bridge-connected', { transport: 'local', port });
    sendFileInfo(ws);
  };

  ws.onmessage = (event: MessageEvent) => {
    let msg: { id: string; method: string; params?: Record<string, unknown> };
    try { msg = JSON.parse(event.data as string); } catch { return; }
    if (!msg.id || !msg.method) return;
    routeCommandToSandbox(ws, msg);
  };

  ws.onclose = () => {
    localSockets.delete(port);
    if (localSockets.size === 0) updateLocalStatus('disconnected');
    if (bridgeEnabled) {
      setTimeout(() => connectToPort(port), RECONNECT_DELAY_MS);
    }
  };

  ws.onerror = () => {
    // Connection refused — normal when server isn't running on this port. Suppress.
  };
}

function startLocalConnections(): void {
  updateLocalStatus('connecting');
  for (const port of LOCAL_PORTS) {
    connectToPort(port);
  }
}

function stopLocalConnections(): void {
  for (const ws of localSockets.values()) {
    ws.onclose = null; // prevent reconnect on manual close
    ws.close();
  }
  localSockets = new Map();
  updateLocalStatus('disconnected');
}

// ===== CLOUD RELAY =====

function connectToCloud(pairCode: string): void {
  if (cloudSocket?.readyState === WebSocket.OPEN || cloudSocket?.readyState === WebSocket.CONNECTING) {
    cloudSocket.close();
  }

  cloudPairCode = pairCode;
  const url = `${CLOUD_URL}?code=${encodeURIComponent(pairCode)}`;

  updateCloudStatus('connecting');

  let ws: WebSocket;
  try {
    ws = new WebSocket(url);
  } catch {
    updateCloudStatus('disconnected');
    return;
  }

  cloudSocket = ws;

  ws.onopen = () => {
    cloudReconnectDelay = RECONNECT_DELAY_MS;
    updateCloudStatus('connected');
    sendMessage('bridge-connected', { transport: 'cloud', pairCode });
    // The cloud relay forwards the same FILE_INFO identification the local server needs.
    sendFileInfo(ws);
  };

  ws.onmessage = (event: MessageEvent) => {
    let msg: { id: string; method: string; params?: Record<string, unknown> };
    try { msg = JSON.parse(event.data as string); } catch { return; }
    if (!msg.id || !msg.method) return;
    routeCommandToSandbox(ws, msg);
  };

  ws.onclose = () => {
    if (cloudSocket === ws) cloudSocket = null;
    updateCloudStatus('disconnected');
    sendMessage('bridge-disconnected', { transport: 'cloud' });
    // Auto-reconnect with backoff if still have a pair code
    if (bridgeEnabled && cloudPairCode) {
      setTimeout(() => {
        if (bridgeEnabled && cloudPairCode) connectToCloud(cloudPairCode);
      }, cloudReconnectDelay);
      cloudReconnectDelay = Math.min(cloudReconnectDelay * 2, MAX_RECONNECT_DELAY_MS);
    }
  };

  ws.onerror = () => {
    // Error details not available in Figma's WS implementation, handled in onclose
  };
}

function disconnectCloud(): void {
  cloudPairCode = null;
  if (cloudSocket) {
    cloudSocket.onclose = null;
    cloudSocket.close();
    cloudSocket = null;
  }
  updateCloudStatus('disconnected');
}

// ===== PUBLIC API =====

export function initBridgeClient(enabled: boolean, savedPairCode?: string): void {
  bridgeEnabled = enabled;
  if (!enabled) return;

  startLocalConnections();

  if (savedPairCode) {
    connectToCloud(savedPairCode);
  }
}

export function setBridgeEnabled(enabled: boolean): void {
  if (bridgeEnabled === enabled) return;
  bridgeEnabled = enabled;

  if (enabled) {
    startLocalConnections();
    if (cloudPairCode) connectToCloud(cloudPairCode);
  } else {
    stopLocalConnections();
    disconnectCloud();
  }

  sendMessage('bridge-set-enabled', { enabled });
}

export function connectCloud(pairCode: string): void {
  cloudReconnectDelay = RECONNECT_DELAY_MS;
  connectToCloud(pairCode);
  sendMessage('bridge-set-pair-code', { pairCode });
}

export function disconnectCloudRelay(): void {
  disconnectCloud();
  sendMessage('bridge-set-pair-code', { pairCode: '' });
}

export function getStatus(): BridgeStatus {
  return status;
}

// Called when the sandbox pushes updated file identity (on enable / page change).
// Caches it for future connects and re-sends to any already-open sockets that may
// still be pending identification.
export function setBridgeFileInfo(info: { fileKey: string | null;[key: string]: unknown }): void {
  localFileInfo = info;
  for (const ws of localSockets.values()) sendFileInfo(ws);
  if (cloudSocket) sendFileInfo(cloudSocket);
}
