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
