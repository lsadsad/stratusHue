/// <reference types="@figma/plugin-typings" />
import { vi, beforeEach } from 'vitest';
import { clearBookmarksCache } from '../core/state';

// Extend global interface to include figma (avoid conflict with @figma/plugin-typings)
declare global {
  namespace globalThis {
    var mockFigma: any;
  }
}

// In-memory pluginData store backing figma.root.{get,set}PluginData.
// Reset before each test for isolation. Tests that need to simulate a write
// failure (e.g. the pluginData size ceiling) can override these per-test.
let rootPluginData: Record<string, string> = {};

// Mock Figma API for testing
const mockFigma = {
  currentPage: {
    id: 'page-1',
    name: 'Test Page',
    selection: [] as SceneNode[],
    children: [] as PageNode['children']
  },
  root: {
    children: [] as DocumentNode['children'],
    getPluginData: (key: string): string => rootPluginData[key] ?? '',
    setPluginData: (key: string, value: string): void => { rootPluginData[key] = value; }
  },
  viewport: {
    scrollAndZoomIntoView: vi.fn(),
    center: { x: 0, y: 0 },
    zoom: 1
  },
  getNodeByIdAsync: vi.fn(),
  setCurrentPageAsync: vi.fn(),
  notify: vi.fn(),
  clientStorage: {
    getAsync: vi.fn(),
    setAsync: vi.fn(),
    deleteAsync: vi.fn()
  },
  ui: {
    postMessage: vi.fn(),
    onmessage: null as ((message: any) => void) | null
  }
};

// Create mock scene nodes for testing
export function createMockSceneNode(
  id: string,
  name: string,
  type: SceneNode['type'] = 'RECTANGLE',
  options: {
    parent?: SceneNode | PageNode;
    children?: SceneNode[];
    visible?: boolean;
  } = {}
): SceneNode {
  const node = {
    id,
    name,
    type,
    visible: options.visible ?? true,
    parent: options.parent || null,
    children: options.children || [],
    remove: vi.fn(),
    clone: vi.fn()
  } as unknown as SceneNode;

  // Add children property for container types
  if (type === 'GROUP' || type === 'FRAME' || type === 'SECTION') {
    (node as any).children = options.children || [];
  }

  return node;
}

// Create mock page node
export function createMockPageNode(
  id: string,
  name: string,
  children: SceneNode[] = []
): PageNode {
  return {
    id,
    name,
    type: 'PAGE',
    children,
    selection: [],
    backgrounds: []
  } as unknown as PageNode;
}

// Mock container node with children
export function createMockContainer(
  id: string,
  name: string,
  type: 'GROUP' | 'FRAME' | 'SECTION',
  children: SceneNode[] = []
): SceneNode {
  const container = createMockSceneNode(id, name, type, { children });
  
  // Set parent reference for children
  children.forEach(child => {
    (child as any).parent = container;
  });
  
  return container;
}

// Setup global figma mock
globalThis.mockFigma = mockFigma as any;
// Also set it as figma for tests that expect it
(globalThis as any).figma = mockFigma;

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  mockFigma.currentPage.selection = [];
  mockFigma.currentPage.children = [];
  mockFigma.root.children = [];
  // Restore a clean, working pluginData store and matching mock implementations
  // in case a test overrode them, then drop the in-memory bookmark cache so
  // state never leaks across tests.
  rootPluginData = {};
  mockFigma.root.getPluginData = (key: string): string => rootPluginData[key] ?? '';
  mockFigma.root.setPluginData = (key: string, value: string): void => { rootPluginData[key] = value; };
  clearBookmarksCache();
});