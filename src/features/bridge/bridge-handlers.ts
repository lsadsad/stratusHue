/// <reference types="@figma/plugin-typings" />

// Bridge command handlers — sandbox side.
// Each handler processes a command from the MCP client (routed via the WS bridge
// in bridge-client.ts → parent.postMessage → here) and replies with
// figma.ui.postMessage({ type: 'BRIDGE_RESPONSE', requestId, result | error }).

import { buildFileInfo } from './file-info';

function reply(requestId: string, result: unknown): void {
  figma.ui.postMessage({ type: 'BRIDGE_RESPONSE', requestId, result });
}

function replyError(requestId: string, message: string): void {
  figma.ui.postMessage({ type: 'BRIDGE_RESPONSE', requestId, error: message });
}

// ===== HELPERS =====

function hexToRgb(hex: string): { r: number; g: number; b: number; a: number } {
  const clean = hex.replace(/^#/, '');
  if (!/^[0-9A-Fa-f]+$/.test(clean)) throw new Error(`Invalid hex: ${hex}`);
  let r: number, g: number, b: number, a = 1;
  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16) / 255;
    g = parseInt(clean[1] + clean[1], 16) / 255;
    b = parseInt(clean[2] + clean[2], 16) / 255;
  } else if (clean.length === 6) {
    r = parseInt(clean.slice(0, 2), 16) / 255;
    g = parseInt(clean.slice(2, 4), 16) / 255;
    b = parseInt(clean.slice(4, 6), 16) / 255;
  } else if (clean.length === 8) {
    r = parseInt(clean.slice(0, 2), 16) / 255;
    g = parseInt(clean.slice(2, 4), 16) / 255;
    b = parseInt(clean.slice(4, 6), 16) / 255;
    a = parseInt(clean.slice(6, 8), 16) / 255;
  } else {
    throw new Error(`Unsupported hex length: ${hex}`);
  }
  return { r, g, b, a };
}

function serializeVariable(v: Variable) {
  return {
    id: v.id, name: v.name, key: v.key,
    resolvedType: v.resolvedType, valuesByMode: v.valuesByMode,
    variableCollectionId: v.variableCollectionId, scopes: v.scopes,
    codeSyntax: v.codeSyntax ?? {}, description: v.description,
    hiddenFromPublishing: v.hiddenFromPublishing,
  };
}

function serializeCollection(c: VariableCollection) {
  return {
    id: c.id, name: c.name, key: c.key,
    modes: c.modes, defaultModeId: c.defaultModeId, variableIds: c.variableIds,
  };
}

// ===== EXECUTE_CODE =====

export async function handleBridgeExecuteCode(requestId: string, code: string): Promise<void> {
  try {
    // Run arbitrary async code in the plugin sandbox context.
    // The eval'd code has full access to figma.* APIs.
    // eslint-disable-next-line no-new-func
    const fn = new Function('figma', `return (async () => { ${code} })()`);
    const result = await fn(figma);
    reply(requestId, { success: true, result: result ?? null });
  } catch (e) {
    replyError(requestId, e instanceof Error ? e.message : String(e));
  }
}

// ===== FILE INFO =====

// Mirrors the original Figma Desktop Bridge plugin's GET_FILE_INFO_RESULT.fileInfo —
// the figma-studio server keys probe success on `result.fileInfo` being present.
export function handleBridgeGetFileInfo(requestId: string): void {
  try {
    reply(requestId, { success: true, fileInfo: buildFileInfo() });
  } catch (e) {
    replyError(requestId, e instanceof Error ? e.message : String(e));
  }
}

// ===== VARIABLES =====

export async function handleBridgeGetVariables(requestId: string): Promise<void> {
  try {
    const [variables, collections] = await Promise.all([
      figma.variables.getLocalVariablesAsync(),
      figma.variables.getLocalVariableCollectionsAsync(),
    ]);
    reply(requestId, {
      success: true,
      fileKey: figma.fileKey ?? null,
      variables: variables.map(serializeVariable),
      variableCollections: collections.map(serializeCollection),
    });
  } catch (e) {
    replyError(requestId, e instanceof Error ? e.message : String(e));
  }
}

export async function handleBridgeUpdateVariable(
  requestId: string, variableId: string, modeId: string, value: unknown
): Promise<void> {
  try {
    const variable = await figma.variables.getVariableByIdAsync(variableId);
    if (!variable) { replyError(requestId, `Variable not found: ${variableId}`); return; }
    let resolvedValue: VariableValue;
    if (variable.resolvedType === 'COLOR' && typeof value === 'string') {
      const { r, g, b, a } = hexToRgb(value);
      resolvedValue = { r, g, b, a };
    } else {
      resolvedValue = value as VariableValue;
    }
    variable.setValueForMode(modeId, resolvedValue);
    reply(requestId, { success: true, variable: serializeVariable(variable) });
  } catch (e) {
    replyError(requestId, e instanceof Error ? e.message : String(e));
  }
}

export async function handleBridgeCreateVariable(
  requestId: string,
  name: string,
  collectionId: string,
  resolvedType: VariableResolvedDataType,
  options?: { valuesByMode?: Record<string, unknown>; description?: string; scopes?: VariableScope[] }
): Promise<void> {
  try {
    const collection = await figma.variables.getVariableCollectionByIdAsync(collectionId);
    if (!collection) { replyError(requestId, `Collection not found: ${collectionId}`); return; }
    const variable = figma.variables.createVariable(name, collection, resolvedType);
    if (options?.description) variable.description = options.description;
    if (options?.scopes) variable.scopes = options.scopes;
    if (options?.valuesByMode) {
      for (const [modeId, val] of Object.entries(options.valuesByMode)) {
        let resolvedValue: VariableValue;
        if (resolvedType === 'COLOR' && typeof val === 'string') {
          const { r, g, b, a } = hexToRgb(val);
          resolvedValue = { r, g, b, a };
        } else {
          resolvedValue = val as VariableValue;
        }
        variable.setValueForMode(modeId, resolvedValue);
      }
    }
    reply(requestId, { success: true, variable: serializeVariable(variable) });
  } catch (e) {
    replyError(requestId, e instanceof Error ? e.message : String(e));
  }
}

export async function handleBridgeDeleteVariable(requestId: string, variableId: string): Promise<void> {
  try {
    const variable = await figma.variables.getVariableByIdAsync(variableId);
    if (!variable) { replyError(requestId, `Variable not found: ${variableId}`); return; }
    variable.remove();
    reply(requestId, { success: true });
  } catch (e) {
    replyError(requestId, e instanceof Error ? e.message : String(e));
  }
}

export async function handleBridgeRenameVariable(
  requestId: string, variableId: string, newName: string
): Promise<void> {
  try {
    const variable = await figma.variables.getVariableByIdAsync(variableId);
    if (!variable) { replyError(requestId, `Variable not found: ${variableId}`); return; }
    variable.name = newName;
    reply(requestId, { success: true, variable: serializeVariable(variable) });
  } catch (e) {
    replyError(requestId, e instanceof Error ? e.message : String(e));
  }
}

export async function handleBridgeCreateVariableCollection(
  requestId: string, name: string, options?: { initialModeName?: string; additionalModes?: string[] }
): Promise<void> {
  try {
    const collection = figma.variables.createVariableCollection(name);
    if (options?.initialModeName) {
      collection.renameMode(collection.modes[0].modeId, options.initialModeName);
    }
    if (options?.additionalModes) {
      for (const modeName of options.additionalModes) {
        collection.addMode(modeName);
      }
    }
    reply(requestId, { success: true, collection: serializeCollection(collection) });
  } catch (e) {
    replyError(requestId, e instanceof Error ? e.message : String(e));
  }
}

export async function handleBridgeDeleteVariableCollection(
  requestId: string, collectionId: string
): Promise<void> {
  try {
    const collection = await figma.variables.getVariableCollectionByIdAsync(collectionId);
    if (!collection) { replyError(requestId, `Collection not found: ${collectionId}`); return; }
    collection.remove();
    reply(requestId, { success: true });
  } catch (e) {
    replyError(requestId, e instanceof Error ? e.message : String(e));
  }
}

export async function handleBridgeAddMode(
  requestId: string, collectionId: string, modeName: string
): Promise<void> {
  try {
    const collection = await figma.variables.getVariableCollectionByIdAsync(collectionId);
    if (!collection) { replyError(requestId, `Collection not found: ${collectionId}`); return; }
    const modeId = collection.addMode(modeName);
    reply(requestId, { success: true, modeId, collection: serializeCollection(collection) });
  } catch (e) {
    replyError(requestId, e instanceof Error ? e.message : String(e));
  }
}

export async function handleBridgeRenameMode(
  requestId: string, collectionId: string, modeId: string, newName: string
): Promise<void> {
  try {
    const collection = await figma.variables.getVariableCollectionByIdAsync(collectionId);
    if (!collection) { replyError(requestId, `Collection not found: ${collectionId}`); return; }
    collection.renameMode(modeId, newName);
    reply(requestId, { success: true, collection: serializeCollection(collection) });
  } catch (e) {
    replyError(requestId, e instanceof Error ? e.message : String(e));
  }
}

// ===== COMPONENTS =====

export async function handleBridgeGetComponent(
  requestId: string, nodeId: string
): Promise<void> {
  try {
    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node) { replyError(requestId, `Node not found: ${nodeId}`); return; }

    const extractComponentData = (n: BaseNode) => {
      const base = {
        id: n.id, name: n.name, type: n.type,
        description: 'description' in n ? n.description : undefined,
        descriptionMarkdown: 'descriptionMarkdown' in n ? (n as ComponentNode).descriptionMarkdown : undefined,
        key: 'key' in n ? n.key : undefined,
        componentPropertyDefinitions: 'componentPropertyDefinitions' in n
          ? (n as ComponentNode).componentPropertyDefinitions : undefined,
      };
      return base;
    };

    reply(requestId, { success: true, component: extractComponentData(node) });
  } catch (e) {
    replyError(requestId, e instanceof Error ? e.message : String(e));
  }
}

export async function handleBridgeGetLocalComponents(requestId: string): Promise<void> {
  try {
    const components = figma.currentPage.findAllWithCriteria({ types: ['COMPONENT', 'COMPONENT_SET'] });
    const data = components.map(c => ({
      id: c.id, name: c.name, type: c.type,
      key: 'key' in c ? c.key : undefined,
      description: 'description' in c ? c.description : undefined,
      componentPropertyDefinitions: 'componentPropertyDefinitions' in c
        ? (c as ComponentNode).componentPropertyDefinitions : undefined,
    }));
    reply(requestId, { success: true, components: data });
  } catch (e) {
    replyError(requestId, e instanceof Error ? e.message : String(e));
  }
}

export async function handleBridgeInstantiateComponent(
  requestId: string,
  componentKey: string,
  options?: {
    nodeId?: string;
    position?: { x: number; y: number };
    parentId?: string;
    overrides?: Record<string, string | boolean>;
    variant?: Record<string, string>;
  }
): Promise<void> {
  try {
    let component: ComponentNode | null = null;

    // Try by key first
    try {
      component = await figma.importComponentByKeyAsync(componentKey);
    } catch {
      // Fall back to local node ID lookup
    }

    if (!component && options?.nodeId) {
      const node = await figma.getNodeByIdAsync(options.nodeId);
      if (node?.type === 'COMPONENT') component = node;
    }

    if (!component) { replyError(requestId, `Component not found: ${componentKey}`); return; }

    const instance = component.createInstance();
    if (options?.position) {
      instance.x = options.position.x;
      instance.y = options.position.y;
    }
    if (options?.variant) {
      instance.setProperties(options.variant);
    }
    if (options?.overrides) {
      const props: Record<string, string | boolean> = {};
      for (const [k, v] of Object.entries(options.overrides)) {
        const matchingKey = Object.keys(instance.componentProperties).find(pk =>
          pk === k || pk.startsWith(k + '#')
        );
        if (matchingKey) props[matchingKey] = v;
      }
      if (Object.keys(props).length > 0) instance.setProperties(props);
    }
    if (options?.parentId) {
      const parent = await figma.getNodeByIdAsync(options.parentId);
      if (parent && 'appendChild' in parent) (parent as FrameNode).appendChild(instance);
    } else {
      figma.currentPage.appendChild(instance);
    }

    reply(requestId, { success: true, instanceId: instance.id, instance: { id: instance.id, name: instance.name, type: instance.type } });
  } catch (e) {
    replyError(requestId, e instanceof Error ? e.message : String(e));
  }
}

// ===== NODE OPERATIONS =====

export async function handleBridgeResizeNode(
  requestId: string, nodeId: string, width: number, height: number, withConstraints = true
): Promise<void> {
  try {
    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node || !('resize' in node)) { replyError(requestId, `Node not found or not resizable: ${nodeId}`); return; }
    if (withConstraints && 'resizeWithoutConstraints' in node) {
      (node as FrameNode).resize(width, height);
    } else if ('resize' in node) {
      (node as RectangleNode).resize(width, height);
    }
    reply(requestId, { success: true });
  } catch (e) {
    replyError(requestId, e instanceof Error ? e.message : String(e));
  }
}

export async function handleBridgeMoveNode(
  requestId: string, nodeId: string, x: number, y: number
): Promise<void> {
  try {
    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node || !('x' in node)) { replyError(requestId, `Node not found or not positionable: ${nodeId}`); return; }
    (node as SceneNode & { x: number; y: number }).x = x;
    (node as SceneNode & { x: number; y: number }).y = y;
    reply(requestId, { success: true });
  } catch (e) {
    replyError(requestId, e instanceof Error ? e.message : String(e));
  }
}

export async function handleBridgeSetNodeFills(
  requestId: string, nodeId: string, fills: Array<{ type: 'SOLID'; color: string; opacity?: number }>
): Promise<void> {
  try {
    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node || !('fills' in node)) { replyError(requestId, `Node not found or has no fills: ${nodeId}`); return; }
    const paintFills: SolidPaint[] = fills.map(f => {
      const { r, g, b, a } = hexToRgb(f.color);
      return { type: 'SOLID', color: { r, g, b }, opacity: f.opacity ?? a };
    });
    (node as GeometryMixin).fills = paintFills;
    reply(requestId, { success: true });
  } catch (e) {
    replyError(requestId, e instanceof Error ? e.message : String(e));
  }
}

export async function handleBridgeSetNodeStrokes(
  requestId: string,
  nodeId: string,
  strokes: Array<{ type: 'SOLID'; color: string; opacity?: number }>,
  strokeWeight?: number
): Promise<void> {
  try {
    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node || !('strokes' in node)) { replyError(requestId, `Node not found or has no strokes: ${nodeId}`); return; }
    const paintStrokes: SolidPaint[] = strokes.map(s => {
      const { r, g, b, a } = hexToRgb(s.color);
      return { type: 'SOLID', color: { r, g, b }, opacity: s.opacity ?? a };
    });
    (node as GeometryMixin).strokes = paintStrokes;
    if (strokeWeight !== undefined && 'strokeWeight' in node) {
      (node as GeometryMixin).strokeWeight = strokeWeight;
    }
    reply(requestId, { success: true });
  } catch (e) {
    replyError(requestId, e instanceof Error ? e.message : String(e));
  }
}

export async function handleBridgeCloneNode(requestId: string, nodeId: string): Promise<void> {
  try {
    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node || !('clone' in node)) { replyError(requestId, `Node not found or not cloneable: ${nodeId}`); return; }
    const clone = (node as SceneNode).clone();
    reply(requestId, { success: true, cloneId: clone.id, clone: { id: clone.id, name: clone.name } });
  } catch (e) {
    replyError(requestId, e instanceof Error ? e.message : String(e));
  }
}

export async function handleBridgeDeleteNode(requestId: string, nodeId: string): Promise<void> {
  try {
    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node) { replyError(requestId, `Node not found: ${nodeId}`); return; }
    node.remove();
    reply(requestId, { success: true });
  } catch (e) {
    replyError(requestId, e instanceof Error ? e.message : String(e));
  }
}

export async function handleBridgeRenameNode(
  requestId: string, nodeId: string, newName: string
): Promise<void> {
  try {
    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node) { replyError(requestId, `Node not found: ${nodeId}`); return; }
    node.name = newName;
    reply(requestId, { success: true });
  } catch (e) {
    replyError(requestId, e instanceof Error ? e.message : String(e));
  }
}

export async function handleBridgeSetText(
  requestId: string, nodeId: string, text: string, fontSize?: number
): Promise<void> {
  try {
    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node || node.type !== 'TEXT') { replyError(requestId, `Text node not found: ${nodeId}`); return; }
    const textNode = node as TextNode;
    await figma.loadFontAsync(textNode.fontName as FontName);
    textNode.characters = text;
    if (fontSize !== undefined) textNode.fontSize = fontSize;
    reply(requestId, { success: true });
  } catch (e) {
    replyError(requestId, e instanceof Error ? e.message : String(e));
  }
}

export async function handleBridgeCreateChild(
  requestId: string,
  parentId: string,
  nodeType: 'RECTANGLE' | 'ELLIPSE' | 'FRAME' | 'TEXT' | 'LINE',
  properties?: {
    name?: string; x?: number; y?: number; width?: number; height?: number;
    text?: string;
    fills?: Array<{ type: 'SOLID'; color: string }>;
  }
): Promise<void> {
  try {
    const parent = await figma.getNodeByIdAsync(parentId);
    if (!parent || !('appendChild' in parent)) {
      replyError(requestId, `Parent node not found or not a container: ${parentId}`); return;
    }

    let newNode: SceneNode;
    switch (nodeType) {
      case 'RECTANGLE': newNode = figma.createRectangle(); break;
      case 'ELLIPSE': newNode = figma.createEllipse(); break;
      case 'FRAME': newNode = figma.createFrame(); break;
      case 'TEXT': newNode = figma.createText(); break;
      case 'LINE': newNode = figma.createLine(); break;
    }

    (parent as FrameNode).appendChild(newNode);

    if (properties?.name) newNode.name = properties.name;
    if (properties?.x !== undefined && 'x' in newNode) (newNode as RectangleNode).x = properties.x;
    if (properties?.y !== undefined && 'y' in newNode) (newNode as RectangleNode).y = properties.y;
    if (properties?.width !== undefined && 'resize' in newNode) (newNode as RectangleNode).resize(properties.width, properties.height ?? (newNode as RectangleNode).height);
    if (properties?.height !== undefined && 'resize' in newNode) (newNode as RectangleNode).resize((newNode as RectangleNode).width, properties.height);

    if (properties?.fills && 'fills' in newNode) {
      const paintFills: SolidPaint[] = properties.fills.map(f => {
        const { r, g, b } = hexToRgb(f.color);
        return { type: 'SOLID', color: { r, g, b }, opacity: 1 };
      });
      (newNode as GeometryMixin).fills = paintFills;
    }

    if (properties?.text && newNode.type === 'TEXT') {
      const textNode = newNode as TextNode;
      await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
      textNode.characters = properties.text;
    }

    reply(requestId, { success: true, nodeId: newNode.id, node: { id: newNode.id, name: newNode.name, type: newNode.type } });
  } catch (e) {
    replyError(requestId, e instanceof Error ? e.message : String(e));
  }
}

export async function handleBridgeSetNodeDescription(
  requestId: string, nodeId: string, description: string, descriptionMarkdown?: string
): Promise<void> {
  try {
    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node || !('description' in node)) {
      replyError(requestId, `Node not found or does not support description: ${nodeId}`); return;
    }
    (node as ComponentNode).description = description;
    if (descriptionMarkdown !== undefined && 'descriptionMarkdown' in node) {
      (node as ComponentNode).descriptionMarkdown = descriptionMarkdown;
    }
    reply(requestId, { success: true });
  } catch (e) {
    replyError(requestId, e instanceof Error ? e.message : String(e));
  }
}

export async function handleBridgeGetMetadata(
  requestId: string, nodeId: string
): Promise<void> {
  try {
    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node) { replyError(requestId, `Node not found: ${nodeId}`); return; }

    const serializeNode = (n: BaseNode, depth = 0): unknown => {
      const base: Record<string, unknown> = {
        id: n.id, name: n.name, type: n.type,
      };
      if ('x' in n) { base.x = (n as SceneNode & { x: number }).x; base.y = (n as SceneNode & { y: number }).y; }
      if ('width' in n) { base.width = (n as LayoutMixin).width; base.height = (n as LayoutMixin).height; }
      if (depth < 2 && 'children' in n) {
        base.children = (n as ChildrenMixin).children.map(c => serializeNode(c, depth + 1));
      }
      return base;
    };

    reply(requestId, { success: true, node: serializeNode(node) });
  } catch (e) {
    replyError(requestId, e instanceof Error ? e.message : String(e));
  }
}

// ===== FIGJAM =====
// Ported from the original Desktop Bridge (figma-studio/figma-desktop-bridge/code.js).
// These commands only function on a FigJam board (figma.editorType === 'figjam').
// Result `data` shapes mirror the reference so the figma-console-mcp server's
// per-tool parsers accept them unchanged.

const STICKY_COLORS: Record<string, RGB> = {
  YELLOW: { r: 1, g: 0.85, b: 0.4 },
  BLUE: { r: 0.53, g: 0.78, b: 1 },
  GREEN: { r: 0.55, g: 0.87, b: 0.53 },
  PINK: { r: 1, g: 0.6, b: 0.78 },
  ORANGE: { r: 1, g: 0.71, b: 0.42 },
  PURPLE: { r: 0.78, g: 0.65, b: 1 },
  RED: { r: 1, g: 0.55, b: 0.55 },
  LIGHT_GRAY: { r: 0.9, g: 0.9, b: 0.9 },
  GRAY: { r: 0.7, g: 0.7, b: 0.7 },
};

function ensureFigJam(command: string): void {
  if (figma.editorType !== 'figjam') {
    throw new Error(`${command} is only available in FigJam files`);
  }
}

const asStr = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);
const asNum = (v: unknown): number | undefined => (typeof v === 'number' ? v : undefined);

function solidFromHex(hex: string): SolidPaint {
  const { r, g, b } = hexToRgb(hex);
  return { type: 'SOLID', color: { r, g, b } };
}

export async function handleBridgeCreateSticky(requestId: string, p: Record<string, unknown>): Promise<void> {
  try {
    ensureFigJam('CREATE_STICKY');
    const sticky = figma.createSticky();
    await figma.loadFontAsync(sticky.text.fontName as FontName);
    sticky.text.characters = asStr(p.text) ?? '';
    const x = asNum(p.x); if (x !== undefined) sticky.x = x;
    const y = asNum(p.y); if (y !== undefined) sticky.y = y;
    const color = asStr(p.color);
    if (color && STICKY_COLORS[color.toUpperCase()]) {
      sticky.fills = [{ type: 'SOLID', color: STICKY_COLORS[color.toUpperCase()] }];
    }
    reply(requestId, { success: true, data: { id: sticky.id, type: sticky.type, name: sticky.name, x: sticky.x, y: sticky.y } });
  } catch (e) {
    replyError(requestId, e instanceof Error ? e.message : String(e));
  }
}

export async function handleBridgeCreateStickies(requestId: string, p: Record<string, unknown>): Promise<void> {
  try {
    ensureFigJam('CREATE_STICKIES');
    const specs = Array.isArray(p.stickies) ? (p.stickies as Array<Record<string, unknown>>) : [];
    const created: Array<Record<string, unknown>> = [];
    const errors: Array<{ index: number; error: string }> = [];
    let fontLoaded = false;
    for (let i = 0; i < specs.length; i++) {
      try {
        const spec = specs[i];
        const sticky = figma.createSticky();
        if (!fontLoaded) { await figma.loadFontAsync(sticky.text.fontName as FontName); fontLoaded = true; }
        sticky.text.characters = asStr(spec.text) ?? '';
        const sx = asNum(spec.x); if (sx !== undefined) sticky.x = sx;
        const sy = asNum(spec.y); if (sy !== undefined) sticky.y = sy;
        const sc = asStr(spec.color);
        if (sc && STICKY_COLORS[sc.toUpperCase()]) sticky.fills = [{ type: 'SOLID', color: STICKY_COLORS[sc.toUpperCase()] }];
        created.push({ id: sticky.id, type: sticky.type, name: sticky.name, x: sticky.x, y: sticky.y });
      } catch (e) {
        errors.push({ index: i, error: e instanceof Error ? e.message : String(e) });
      }
    }
    reply(requestId, { success: errors.length === 0, data: { created: created.length, failed: errors.length, results: created, errors } });
  } catch (e) {
    replyError(requestId, e instanceof Error ? e.message : String(e));
  }
}

export async function handleBridgeCreateConnector(requestId: string, p: Record<string, unknown>): Promise<void> {
  try {
    ensureFigJam('CREATE_CONNECTOR');
    const startNodeId = asStr(p.startNodeId);
    const endNodeId = asStr(p.endNodeId);
    if (!startNodeId || !endNodeId) throw new Error('CREATE_CONNECTOR requires startNodeId and endNodeId');
    const startNode = await figma.getNodeByIdAsync(startNodeId);
    const endNode = await figma.getNodeByIdAsync(endNodeId);
    if (!startNode) throw new Error(`Start node not found: ${startNodeId}`);
    if (!endNode) throw new Error(`End node not found: ${endNodeId}`);
    const connector = figma.createConnector();
    connector.connectorStart = { endpointNodeId: startNodeId, magnet: asStr(p.startMagnet) ?? 'AUTO' } as ConnectorEndpoint;
    connector.connectorEnd = { endpointNodeId: endNodeId, magnet: asStr(p.endMagnet) ?? 'AUTO' } as ConnectorEndpoint;
    const label = asStr(p.label);
    if (label) {
      try { await figma.loadFontAsync(connector.text.fontName as FontName); }
      catch { await figma.loadFontAsync({ family: 'Inter', style: 'Medium' }); connector.text.fontName = { family: 'Inter', style: 'Medium' }; }
      connector.text.characters = label;
    }
    reply(requestId, { success: true, data: { id: connector.id, type: connector.type, name: connector.name } });
  } catch (e) {
    replyError(requestId, e instanceof Error ? e.message : String(e));
  }
}

export async function handleBridgeCreateSection(requestId: string, p: Record<string, unknown>): Promise<void> {
  try {
    ensureFigJam('CREATE_SECTION');
    const section = figma.createSection();
    const name = asStr(p.name); if (name) section.name = name;
    const x = asNum(p.x); if (x !== undefined) section.x = x;
    const y = asNum(p.y); if (y !== undefined) section.y = y;
    const w = asNum(p.width); const h = asNum(p.height);
    if (w !== undefined && h !== undefined) section.resizeWithoutConstraints(w, h);
    const fillColor = asStr(p.fillColor);
    if (fillColor) section.fills = [solidFromHex(fillColor)];
    reply(requestId, { success: true, data: { id: section.id, type: section.type, name: section.name, x: section.x, y: section.y, width: section.width, height: section.height } });
  } catch (e) {
    replyError(requestId, e instanceof Error ? e.message : String(e));
  }
}

export async function handleBridgeCreateShapeWithText(requestId: string, p: Record<string, unknown>): Promise<void> {
  try {
    ensureFigJam('CREATE_SHAPE_WITH_TEXT');
    const shape = figma.createShapeWithText();
    const shapeType = asStr(p.shapeType);
    if (shapeType) shape.shapeType = shapeType as ShapeWithTextNode['shapeType'];
    const x = asNum(p.x); if (x !== undefined) shape.x = x;
    const y = asNum(p.y); if (y !== undefined) shape.y = y;
    const w = asNum(p.width); const h = asNum(p.height);
    if (w !== undefined && h !== undefined) shape.resize(w, h);
    else if (w !== undefined) shape.resize(w, shape.height);
    else if (h !== undefined) shape.resize(shape.width, h);
    const fillColor = asStr(p.fillColor);
    if (fillColor) shape.fills = [solidFromHex(fillColor)];
    const strokeColor = asStr(p.strokeColor);
    if (strokeColor) { shape.strokes = [solidFromHex(strokeColor)]; shape.strokeWeight = 1; }
    const dash = asStr(p.strokeDashPattern);
    if (dash) shape.dashPattern = dash.split(',').map((s) => parseFloat(s.trim()));
    const text = asStr(p.text);
    if (text) {
      try { await figma.loadFontAsync(shape.text.fontName as FontName); }
      catch { await figma.loadFontAsync({ family: 'Inter', style: 'Medium' }); shape.text.fontName = { family: 'Inter', style: 'Medium' }; }
      shape.text.characters = text;
      const fs = asNum(p.fontSize); if (fs !== undefined) shape.text.fontSize = fs;
    }
    reply(requestId, { success: true, data: { id: shape.id, type: shape.type, name: shape.name, x: shape.x, y: shape.y, width: shape.width, height: shape.height } });
  } catch (e) {
    replyError(requestId, e instanceof Error ? e.message : String(e));
  }
}

export async function handleBridgeCreateTable(requestId: string, p: Record<string, unknown>): Promise<void> {
  try {
    ensureFigJam('CREATE_TABLE');
    const rows = asNum(p.rows); const columns = asNum(p.columns);
    if (rows === undefined || columns === undefined) throw new Error('CREATE_TABLE requires rows and columns');
    const table = figma.createTable(rows, columns);
    const x = asNum(p.x); if (x !== undefined) table.x = x;
    const y = asNum(p.y); if (y !== undefined) table.y = y;
    const data = Array.isArray(p.data) ? (p.data as unknown[][]) : null;
    if (data) {
      for (let row = 0; row < data.length && row < rows; row++) {
        const rowArr = Array.isArray(data[row]) ? data[row] : [];
        for (let col = 0; col < rowArr.length && col < columns; col++) {
          const cell = table.cellAt(row, col);
          if (cell && rowArr[col] != null) {
            await figma.loadFontAsync(cell.text.fontName as FontName);
            cell.text.characters = String(rowArr[col]);
          }
        }
      }
    }
    reply(requestId, { success: true, data: { id: table.id, type: table.type, name: table.name, rows, columns } });
  } catch (e) {
    replyError(requestId, e instanceof Error ? e.message : String(e));
  }
}

export async function handleBridgeCreateCodeBlock(requestId: string, p: Record<string, unknown>): Promise<void> {
  try {
    ensureFigJam('CREATE_CODE_BLOCK');
    const codeBlock = figma.createCodeBlock();
    try { await figma.loadFontAsync({ family: 'Source Code Pro', style: 'Medium' }); }
    catch { await figma.loadFontAsync({ family: 'Inter', style: 'Medium' }); }
    const code = asStr(p.code); if (code) codeBlock.code = code;
    const language = asStr(p.language); if (language) codeBlock.codeLanguage = language as CodeBlockNode['codeLanguage'];
    const x = asNum(p.x); if (x !== undefined) codeBlock.x = x;
    const y = asNum(p.y); if (y !== undefined) codeBlock.y = y;
    reply(requestId, { success: true, data: { id: codeBlock.id, type: codeBlock.type, name: codeBlock.name, x: codeBlock.x, y: codeBlock.y } });
  } catch (e) {
    replyError(requestId, e instanceof Error ? e.message : String(e));
  }
}

export async function handleBridgeGetBoardContents(requestId: string, p: Record<string, unknown>): Promise<void> {
  try {
    ensureFigJam('GET_BOARD_CONTENTS');
    const maxNodes = asNum(p.maxNodes) ?? 500;
    const filterTypes = Array.isArray(p.nodeTypes) ? (p.nodeTypes as string[]) : null;
    const figjamTypes = ['STICKY', 'SHAPE_WITH_TEXT', 'CONNECTOR', 'TABLE', 'CODE_BLOCK', 'SECTION', 'FRAME', 'TEXT'];
    const allNodes = figma.currentPage.children;
    const results: Array<Record<string, unknown>> = [];
    let truncated = false;
    for (let ni = 0; ni < allNodes.length && results.length < maxNodes; ni++) {
      const node = allNodes[ni];
      if (filterTypes && filterTypes.indexOf(node.type) === -1) continue;
      if (!filterTypes && figjamTypes.indexOf(node.type) === -1) continue;
      const geo = node as unknown as { x?: number; y?: number; width?: number; height?: number };
      const entry: Record<string, unknown> = { id: node.id, type: node.type, name: node.name, x: geo.x, y: geo.y, width: geo.width, height: geo.height };
      if (node.type === 'STICKY') {
        const s = node as StickyNode;
        entry.text = s.text ? s.text.characters : '';
        const fills = s.fills;
        if (Array.isArray(fills) && fills.length > 0 && fills[0].type === 'SOLID') entry.color = (fills[0] as SolidPaint).color;
      } else if (node.type === 'SHAPE_WITH_TEXT') {
        const sh = node as ShapeWithTextNode;
        entry.text = sh.text ? sh.text.characters : '';
        entry.shapeType = sh.shapeType;
      } else if (node.type === 'CONNECTOR') {
        const c = node as ConnectorNode;
        entry.connectorStart = c.connectorStart ?? null;
        entry.connectorEnd = c.connectorEnd ?? null;
        entry.text = c.text ? c.text.characters : '';
      } else if (node.type === 'CODE_BLOCK') {
        const cb = node as CodeBlockNode;
        entry.code = cb.code ?? '';
        entry.codeLanguage = cb.codeLanguage ?? '';
      } else if (node.type === 'TABLE') {
        const t = node as TableNode;
        entry.numRows = t.numRows;
        entry.numColumns = t.numColumns;
        const cellData: string[][] = [];
        const maxCellRows = Math.min(t.numRows, 10);
        for (let row = 0; row < maxCellRows; row++) {
          const rowData: string[] = [];
          for (let col = 0; col < t.numColumns; col++) {
            try { const cell = t.cellAt(row, col); rowData.push(cell && cell.text ? cell.text.characters : ''); }
            catch { rowData.push(''); }
          }
          cellData.push(rowData);
        }
        entry.cellData = cellData;
        if (t.numRows > 10) entry.cellDataTruncated = true;
      } else if (node.type === 'SECTION') {
        const sec = node as SectionNode;
        entry.childCount = sec.children ? sec.children.length : 0;
      } else if (node.type === 'TEXT') {
        const tx = node as TextNode;
        entry.text = typeof tx.characters === 'string' ? tx.characters : '';
      }
      results.push(entry);
    }
    if (results.length >= maxNodes) truncated = true;
    reply(requestId, { success: true, data: { nodes: results, totalFound: results.length, truncated, page: figma.currentPage.name } });
  } catch (e) {
    replyError(requestId, e instanceof Error ? e.message : String(e));
  }
}

export async function handleBridgeGetConnections(requestId: string): Promise<void> {
  try {
    ensureFigJam('GET_CONNECTIONS');
    const connectors = figma.currentPage.findAll((n) => n.type === 'CONNECTOR') as ConnectorNode[];
    const edges: Array<Record<string, unknown>> = [];
    const nodeMap: Record<string, unknown> = {};
    const endpointId = (ep: ConnectorEndpoint | undefined): string | null =>
      ep && 'endpointNodeId' in ep ? ep.endpointNodeId : null;
    const summarize = (n: BaseNode): Record<string, unknown> => {
      const wt = n as unknown as { text?: { characters?: string }; characters?: string };
      const text = wt.text && typeof wt.text.characters === 'string'
        ? wt.text.characters
        : (typeof wt.characters === 'string' ? wt.characters : '');
      return { id: n.id, type: n.type, name: n.name, text };
    };
    for (const conn of connectors) {
      const startId = endpointId(conn.connectorStart);
      const endId = endpointId(conn.connectorEnd);
      edges.push({ connectorId: conn.id, startNodeId: startId, endNodeId: endId, label: conn.text ? conn.text.characters : '' });
      if (startId && !nodeMap[startId]) { const sn = await figma.getNodeByIdAsync(startId); if (sn) nodeMap[startId] = summarize(sn); }
      if (endId && !nodeMap[endId]) { const en = await figma.getNodeByIdAsync(endId); if (en) nodeMap[endId] = summarize(en); }
    }
    reply(requestId, { success: true, data: { edges, connectedNodes: nodeMap, totalConnectors: connectors.length, totalConnectedNodes: Object.keys(nodeMap).length } });
  } catch (e) {
    replyError(requestId, e instanceof Error ? e.message : String(e));
  }
}
