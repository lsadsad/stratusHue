/// <reference types="@figma/plugin-typings" />
import { vi, beforeEach } from 'vitest';

// Extend global interface to include figma (avoid conflict with @figma/plugin-typings)
declare global {
  namespace globalThis {
    var mockFigma: any;
  }
}

// Mock Figma API for testing
const mockFigma = {
  currentPage: {
    id: 'page-1',
    name: 'Test Page',
    selection: [] as SceneNode[],
    children: [] as PageNode['children']
  },
  root: {
    children: [] as DocumentNode['children']
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
});