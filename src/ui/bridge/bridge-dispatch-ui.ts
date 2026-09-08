// UI-side bridge message dispatch.
//
// Mirrors src/features/bridge/bridge-dispatch.ts on the sandbox side: all
// `bridge-*` cases live here so ui.ts holds exactly ONE guarded reference to
// bridge code. With __BRIDGE__ false, esbuild drops the guard, this module
// becomes unreachable, and bridge-client.ts / bridge-ui.ts leave the bundle.
//
// Returns whether the message was handled.

export function handleBridgeUIMessage(message: Record<string, unknown> & { type: string }): boolean {
  switch (message.type) {
    case 'bridge-init':
      // Sandbox sends bridge enabled state + saved pair code on startup.
      import('./bridge-ui').then(({ initBridgeUI }) => {
        initBridgeUI(message.enabled as boolean, (message.pairCode as string) || undefined);
      }).catch(console.error);
      break;

    case 'bridge-file-info':
      // Sandbox pushed file identity — cache it for the FILE_INFO handshake.
      import('./bridge-client').then(({ setBridgeFileInfo }) => {
        setBridgeFileInfo(message.fileInfo as { fileKey: string | null;[key: string]: unknown });
      }).catch(console.error);
      break;

    case 'BRIDGE_RESPONSE':
      // Route a sandbox command response back to the waiting WS request.
      import('./bridge-client').then(({ handleBridgeResponse }) => {
        handleBridgeResponse(
          message.requestId as string,
          message.result,
          message.error as string | undefined
        );
      }).catch(console.error);
      break;

    case 'bridge-console-log':
      // Forward sandbox console captures to the bridge for WS broadcast.
      import('./bridge-client').then(({ broadcastEvent }) => {
        broadcastEvent('CONSOLE_CAPTURE', {
          level: message.level as string,
          message: message.message as string,
          timestamp: Date.now(),
        });
      }).catch(console.error);
      break;

    case 'bridge-selection-change':
      import('./bridge-client').then(({ broadcastEvent }) => {
        broadcastEvent('SELECTION_CHANGE', message);
      }).catch(console.error);
      break;

    case 'bridge-document-change':
      import('./bridge-client').then(({ broadcastEvent }) => {
        broadcastEvent('DOCUMENT_CHANGE', message);
      }).catch(console.error);
      break;

    case 'bridge-page-change':
      import('./bridge-client').then(({ broadcastEvent }) => {
        broadcastEvent('PAGE_CHANGE', message);
      }).catch(console.error);
      break;

    default:
      return false;
  }
  return true;
}
