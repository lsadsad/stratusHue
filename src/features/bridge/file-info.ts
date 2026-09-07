/// <reference types="@figma/plugin-typings" />

// Shared file-identity builder — sandbox side.
// Used both for the GET_FILE_INFO command reply (bridge-handlers.ts) and for the
// FILE_INFO identification handshake pushed to the UI (ui-communication.ts), so the
// two stay in lockstep. The figma-studio server keys probe success on `fileInfo`
// being present and requires `fileKey` to promote a client out of "pending".

// Keep in sync with package.json "version".
export const PLUGIN_VERSION = '1.6.0';

export interface BridgeFileInfo {
  fileName: string;
  fileKey: string | null;
  currentPage: string;
  currentPageId: string;
  selectionCount: number;
  pluginVersion: string;
  editorType: string;
}

export function buildFileInfo(): BridgeFileInfo {
  return {
    fileName: figma.root.name,
    fileKey: figma.fileKey ?? null,
    currentPage: figma.currentPage.name,
    currentPageId: figma.currentPage.id,
    selectionCount: figma.currentPage.selection.length,
    pluginVersion: PLUGIN_VERSION,
    editorType: figma.editorType,
  };
}
