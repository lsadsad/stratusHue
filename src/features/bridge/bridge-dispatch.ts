/// <reference types="@figma/plugin-typings" />

// Sandbox-side bridge message dispatch.
//
// Every `bridge-*` case lives here rather than in code.ts's main switch so that
// the community build has exactly ONE guarded reference to bridge code
// (`if (__BRIDGE__)` in code.ts) instead of ~40 scattered ones. With the flag
// false esbuild evaluates that guard as dead, this module becomes unreachable,
// and the whole bridge tree — handlers, client, file-info — is dropped from the
// bundle. Scattered guards were the fragile alternative: one miss leaks bridge
// code into the published artifact.
//
// Returns whether the message was handled, so code.ts can fall through to its
// own switch for anything else.

import { setBridgeEnabledState } from './bridge-state';
import { sendBridgeFileInfo } from '../../ui/ui-communication';

export async function handleBridgeMessage(msg: { type: string } & Record<string, unknown>): Promise<boolean> {
  switch (msg.type) {
    case 'bridge-set-enabled': {
      if ('enabled' in msg && typeof msg.enabled === 'boolean') {
        setBridgeEnabledState(msg.enabled);
        await figma.clientStorage.setAsync('bridgeEnabled', msg.enabled);
        // On enable, push file identity so the UI can send FILE_INFO on connect.
        if (msg.enabled) sendBridgeFileInfo();
      }
      break;
    }

    case 'bridge-set-pair-code': {
      if ('pairCode' in msg && typeof msg.pairCode === 'string') {
        await figma.clientStorage.setAsync('bridgePairCode', msg.pairCode);
      }
      break;
    }

    case 'bridge-connected':
    case 'bridge-disconnected':
      // Informational — no sandbox action needed
      break;

    // ---- Bridge command dispatch ----
    // All bridge-cmd-* types are handled by lazy-importing bridge-handlers.ts.
    // The requestId is echoed in the BRIDGE_RESPONSE so the WS client can route
    // the reply back to the correct MCP request.

    case 'bridge-cmd-execute-code': {
      if ('requestId' in msg && 'code' in msg && typeof msg.requestId === 'string' && typeof msg.code === 'string') {
        const { handleBridgeExecuteCode } = await import('./bridge-handlers');
        await handleBridgeExecuteCode(msg.requestId, msg.code);
      }
      break;
    }

    case 'bridge-cmd-get-file-info': {
      if ('requestId' in msg && typeof msg.requestId === 'string') {
        const { handleBridgeGetFileInfo } = await import('./bridge-handlers');
        handleBridgeGetFileInfo(msg.requestId);
      }
      break;
    }

    case 'bridge-cmd-get-variables': {
      if ('requestId' in msg && typeof msg.requestId === 'string') {
        const { handleBridgeGetVariables } = await import('./bridge-handlers');
        await handleBridgeGetVariables(msg.requestId);
      }
      break;
    }

    case 'bridge-cmd-refresh-variables': {
      if ('requestId' in msg && typeof msg.requestId === 'string') {
        const { handleBridgeGetVariables } = await import('./bridge-handlers');
        await handleBridgeGetVariables(msg.requestId);
      }
      break;
    }

    case 'bridge-cmd-update-variable': {
      if ('requestId' in msg && 'variableId' in msg && 'modeId' in msg && 'value' in msg &&
          typeof msg.requestId === 'string' && typeof msg.variableId === 'string' && typeof msg.modeId === 'string') {
        const { handleBridgeUpdateVariable } = await import('./bridge-handlers');
        await handleBridgeUpdateVariable(msg.requestId, msg.variableId, msg.modeId, msg.value);
      }
      break;
    }

    case 'bridge-cmd-create-variable': {
      if ('requestId' in msg && 'name' in msg && 'collectionId' in msg && 'resolvedType' in msg &&
          typeof msg.requestId === 'string' && typeof msg.name === 'string' &&
          typeof msg.collectionId === 'string' && typeof msg.resolvedType === 'string') {
        const { handleBridgeCreateVariable } = await import('./bridge-handlers');
        await handleBridgeCreateVariable(msg.requestId, msg.name, msg.collectionId,
          msg.resolvedType as VariableResolvedDataType,
          'options' in msg ? msg.options as Record<string, unknown> : undefined
        );
      }
      break;
    }

    case 'bridge-cmd-delete-variable': {
      if ('requestId' in msg && 'variableId' in msg &&
          typeof msg.requestId === 'string' && typeof msg.variableId === 'string') {
        const { handleBridgeDeleteVariable } = await import('./bridge-handlers');
        await handleBridgeDeleteVariable(msg.requestId, msg.variableId);
      }
      break;
    }

    case 'bridge-cmd-rename-variable': {
      if ('requestId' in msg && 'variableId' in msg && 'newName' in msg &&
          typeof msg.requestId === 'string' && typeof msg.variableId === 'string' && typeof msg.newName === 'string') {
        const { handleBridgeRenameVariable } = await import('./bridge-handlers');
        await handleBridgeRenameVariable(msg.requestId, msg.variableId, msg.newName);
      }
      break;
    }

    case 'bridge-cmd-create-variable-collection': {
      if ('requestId' in msg && 'name' in msg &&
          typeof msg.requestId === 'string' && typeof msg.name === 'string') {
        const { handleBridgeCreateVariableCollection } = await import('./bridge-handlers');
        await handleBridgeCreateVariableCollection(msg.requestId, msg.name,
          'options' in msg ? msg.options as Record<string, unknown> : undefined
        );
      }
      break;
    }

    case 'bridge-cmd-delete-variable-collection': {
      if ('requestId' in msg && 'collectionId' in msg &&
          typeof msg.requestId === 'string' && typeof msg.collectionId === 'string') {
        const { handleBridgeDeleteVariableCollection } = await import('./bridge-handlers');
        await handleBridgeDeleteVariableCollection(msg.requestId, msg.collectionId);
      }
      break;
    }

    case 'bridge-cmd-add-mode': {
      if ('requestId' in msg && 'collectionId' in msg && 'modeName' in msg &&
          typeof msg.requestId === 'string' && typeof msg.collectionId === 'string' && typeof msg.modeName === 'string') {
        const { handleBridgeAddMode } = await import('./bridge-handlers');
        await handleBridgeAddMode(msg.requestId, msg.collectionId, msg.modeName);
      }
      break;
    }

    case 'bridge-cmd-rename-mode': {
      if ('requestId' in msg && 'collectionId' in msg && 'modeId' in msg && 'newName' in msg &&
          typeof msg.requestId === 'string' && typeof msg.collectionId === 'string' &&
          typeof msg.modeId === 'string' && typeof msg.newName === 'string') {
        const { handleBridgeRenameMode } = await import('./bridge-handlers');
        await handleBridgeRenameMode(msg.requestId, msg.collectionId, msg.modeId, msg.newName);
      }
      break;
    }

    case 'bridge-cmd-get-component': {
      if ('requestId' in msg && 'nodeId' in msg &&
          typeof msg.requestId === 'string' && typeof msg.nodeId === 'string') {
        const { handleBridgeGetComponent } = await import('./bridge-handlers');
        await handleBridgeGetComponent(msg.requestId, msg.nodeId);
      }
      break;
    }

    case 'bridge-cmd-get-local-components': {
      if ('requestId' in msg && typeof msg.requestId === 'string') {
        const { handleBridgeGetLocalComponents } = await import('./bridge-handlers');
        await handleBridgeGetLocalComponents(msg.requestId);
      }
      break;
    }

    case 'bridge-cmd-instantiate-component': {
      if ('requestId' in msg && 'componentKey' in msg &&
          typeof msg.requestId === 'string' && typeof msg.componentKey === 'string') {
        const { handleBridgeInstantiateComponent } = await import('./bridge-handlers');
        await handleBridgeInstantiateComponent(msg.requestId, msg.componentKey,
          'options' in msg ? msg.options as Record<string, unknown> : undefined
        );
      }
      break;
    }

    case 'bridge-cmd-get-metadata': {
      if ('requestId' in msg && 'nodeId' in msg &&
          typeof msg.requestId === 'string' && typeof msg.nodeId === 'string') {
        const { handleBridgeGetMetadata } = await import('./bridge-handlers');
        await handleBridgeGetMetadata(msg.requestId, msg.nodeId);
      }
      break;
    }

    case 'bridge-cmd-resize-node': {
      if ('requestId' in msg && 'nodeId' in msg && 'width' in msg && 'height' in msg &&
          typeof msg.requestId === 'string' && typeof msg.nodeId === 'string' &&
          typeof msg.width === 'number' && typeof msg.height === 'number') {
        const { handleBridgeResizeNode } = await import('./bridge-handlers');
        await handleBridgeResizeNode(msg.requestId, msg.nodeId, msg.width, msg.height,
          'withConstraints' in msg ? !!(msg.withConstraints) : true
        );
      }
      break;
    }

    case 'bridge-cmd-move-node': {
      if ('requestId' in msg && 'nodeId' in msg && 'x' in msg && 'y' in msg &&
          typeof msg.requestId === 'string' && typeof msg.nodeId === 'string' &&
          typeof msg.x === 'number' && typeof msg.y === 'number') {
        const { handleBridgeMoveNode } = await import('./bridge-handlers');
        await handleBridgeMoveNode(msg.requestId, msg.nodeId, msg.x, msg.y);
      }
      break;
    }

    case 'bridge-cmd-set-node-fills': {
      if ('requestId' in msg && 'nodeId' in msg && 'fills' in msg &&
          typeof msg.requestId === 'string' && typeof msg.nodeId === 'string' && Array.isArray(msg.fills)) {
        const { handleBridgeSetNodeFills } = await import('./bridge-handlers');
        await handleBridgeSetNodeFills(msg.requestId, msg.nodeId, msg.fills as Array<{ type: 'SOLID'; color: string; opacity?: number }>);
      }
      break;
    }

    case 'bridge-cmd-set-node-strokes': {
      if ('requestId' in msg && 'nodeId' in msg && 'strokes' in msg &&
          typeof msg.requestId === 'string' && typeof msg.nodeId === 'string' && Array.isArray(msg.strokes)) {
        const { handleBridgeSetNodeStrokes } = await import('./bridge-handlers');
        await handleBridgeSetNodeStrokes(msg.requestId, msg.nodeId,
          msg.strokes as Array<{ type: 'SOLID'; color: string; opacity?: number }>,
          'strokeWeight' in msg && typeof msg.strokeWeight === 'number' ? msg.strokeWeight : undefined
        );
      }
      break;
    }

    case 'bridge-cmd-clone-node': {
      if ('requestId' in msg && 'nodeId' in msg &&
          typeof msg.requestId === 'string' && typeof msg.nodeId === 'string') {
        const { handleBridgeCloneNode } = await import('./bridge-handlers');
        await handleBridgeCloneNode(msg.requestId, msg.nodeId);
      }
      break;
    }

    case 'bridge-cmd-delete-node': {
      if ('requestId' in msg && 'nodeId' in msg &&
          typeof msg.requestId === 'string' && typeof msg.nodeId === 'string') {
        const { handleBridgeDeleteNode } = await import('./bridge-handlers');
        await handleBridgeDeleteNode(msg.requestId, msg.nodeId);
      }
      break;
    }

    case 'bridge-cmd-rename-node': {
      if ('requestId' in msg && 'nodeId' in msg && 'newName' in msg &&
          typeof msg.requestId === 'string' && typeof msg.nodeId === 'string' && typeof msg.newName === 'string') {
        const { handleBridgeRenameNode } = await import('./bridge-handlers');
        await handleBridgeRenameNode(msg.requestId, msg.nodeId, msg.newName);
      }
      break;
    }

    case 'bridge-cmd-set-text': {
      if ('requestId' in msg && 'nodeId' in msg && 'text' in msg &&
          typeof msg.requestId === 'string' && typeof msg.nodeId === 'string' && typeof msg.text === 'string') {
        const { handleBridgeSetText } = await import('./bridge-handlers');
        await handleBridgeSetText(msg.requestId, msg.nodeId, msg.text,
          'fontSize' in msg && typeof msg.fontSize === 'number' ? msg.fontSize : undefined
        );
      }
      break;
    }

    case 'bridge-cmd-create-child': {
      if ('requestId' in msg && 'parentId' in msg && 'nodeType' in msg &&
          typeof msg.requestId === 'string' && typeof msg.parentId === 'string' && typeof msg.nodeType === 'string') {
        const { handleBridgeCreateChild } = await import('./bridge-handlers');
        await handleBridgeCreateChild(msg.requestId, msg.parentId,
          msg.nodeType as 'RECTANGLE' | 'ELLIPSE' | 'FRAME' | 'TEXT' | 'LINE',
          'properties' in msg ? msg.properties as Record<string, unknown> : undefined
        );
      }
      break;
    }

    case 'bridge-cmd-set-node-description': {
      if ('requestId' in msg && 'nodeId' in msg && 'description' in msg &&
          typeof msg.requestId === 'string' && typeof msg.nodeId === 'string' && typeof msg.description === 'string') {
        const { handleBridgeSetNodeDescription } = await import('./bridge-handlers');
        await handleBridgeSetNodeDescription(msg.requestId, msg.nodeId, msg.description,
          'descriptionMarkdown' in msg && typeof msg.descriptionMarkdown === 'string' ? msg.descriptionMarkdown : undefined
        );
      }
      break;
    }

    // ---- FigJam bridge commands ----
    // Params arrive spread onto msg (see bridge-client routeCommandToSandbox); the
    // handlers validate/extract internally, so the guard only needs requestId.
    case 'bridge-cmd-create-sticky': {
      if ('requestId' in msg && typeof msg.requestId === 'string') {
        const { handleBridgeCreateSticky } = await import('./bridge-handlers');
        await handleBridgeCreateSticky(msg.requestId, msg as unknown as Record<string, unknown>);
      }
      break;
    }

    case 'bridge-cmd-create-stickies': {
      if ('requestId' in msg && typeof msg.requestId === 'string') {
        const { handleBridgeCreateStickies } = await import('./bridge-handlers');
        await handleBridgeCreateStickies(msg.requestId, msg as unknown as Record<string, unknown>);
      }
      break;
    }

    case 'bridge-cmd-create-connector': {
      if ('requestId' in msg && typeof msg.requestId === 'string') {
        const { handleBridgeCreateConnector } = await import('./bridge-handlers');
        await handleBridgeCreateConnector(msg.requestId, msg as unknown as Record<string, unknown>);
      }
      break;
    }

    case 'bridge-cmd-create-section': {
      if ('requestId' in msg && typeof msg.requestId === 'string') {
        const { handleBridgeCreateSection } = await import('./bridge-handlers');
        await handleBridgeCreateSection(msg.requestId, msg as unknown as Record<string, unknown>);
      }
      break;
    }

    case 'bridge-cmd-create-shape-with-text': {
      if ('requestId' in msg && typeof msg.requestId === 'string') {
        const { handleBridgeCreateShapeWithText } = await import('./bridge-handlers');
        await handleBridgeCreateShapeWithText(msg.requestId, msg as unknown as Record<string, unknown>);
      }
      break;
    }

    case 'bridge-cmd-create-table': {
      if ('requestId' in msg && typeof msg.requestId === 'string') {
        const { handleBridgeCreateTable } = await import('./bridge-handlers');
        await handleBridgeCreateTable(msg.requestId, msg as unknown as Record<string, unknown>);
      }
      break;
    }

    case 'bridge-cmd-create-code-block': {
      if ('requestId' in msg && typeof msg.requestId === 'string') {
        const { handleBridgeCreateCodeBlock } = await import('./bridge-handlers');
        await handleBridgeCreateCodeBlock(msg.requestId, msg as unknown as Record<string, unknown>);
      }
      break;
    }

    case 'bridge-cmd-get-board-contents': {
      if ('requestId' in msg && typeof msg.requestId === 'string') {
        const { handleBridgeGetBoardContents } = await import('./bridge-handlers');
        await handleBridgeGetBoardContents(msg.requestId, msg as unknown as Record<string, unknown>);
      }
      break;
    }

    case 'bridge-cmd-get-connections': {
      if ('requestId' in msg && typeof msg.requestId === 'string') {
        const { handleBridgeGetConnections } = await import('./bridge-handlers');
        await handleBridgeGetConnections(msg.requestId);
      }
      break;
    }

    default:
      // Unhandled bridge commands must still reply, or the MCP client's request
      // hangs until it times out. Send an explicit error so the server fails fast.
      if (msg.type.startsWith('bridge-cmd-') && 'requestId' in msg && typeof msg.requestId === 'string') {
        figma.ui.postMessage({
          type: 'BRIDGE_RESPONSE',
          requestId: msg.requestId,
          error: `Unsupported bridge command: ${msg.type}`,
        });
        return true;
      }
      return false;
  }
  return true;
}
