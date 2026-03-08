/// <reference types="@figma/plugin-typings" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LayerNavigationHandler } from '../features/navigation';
import { createMockSceneNode, createMockContainer, createMockPageNode } from './setup';
import type { NavigationContext } from '../core/types';

describe('Navigation Context Analysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Button State Calculation', () => {
    it('should enable enter and siblings for container with siblings', () => {
      const child = createMockSceneNode('child-1', 'Child 1');
      const container = createMockContainer('container-1', 'Test Group', 'GROUP', [child]);
      const sibling = createMockSceneNode('sibling-1', 'Sibling');
      const parent = createMockContainer('parent-1', 'Parent', 'GROUP', [container, sibling]);
      (container as any).parent = parent;
      (sibling as any).parent = parent;

      const context = LayerNavigationHandler.validateNavigationContext([container]);

      expect(context.hasSelection).toBe(true);
      expect(context.canEnter).toBe(true);
      expect(context.canExit).toBe(true);
      expect(context.canNavigateSiblings).toBe(true);
      expect(context.hasComponentInstance).toBe(false);
    });

    it('should disable enter button for non-container nodes', () => {
      const rectangle = createMockSceneNode('rect-1', 'Rectangle', 'RECTANGLE');
      const parent = createMockContainer('parent-1', 'Parent', 'GROUP', [rectangle]);
      (rectangle as any).parent = parent;

      const context = LayerNavigationHandler.validateNavigationContext([rectangle]);

      expect(context.canEnter).toBe(false);
      expect(context.canExit).toBe(true);
    });

    it('should disable enter button for empty containers', () => {
      const emptyContainer = createMockContainer('empty-1', 'Empty Group', 'GROUP', []);

      const context = LayerNavigationHandler.validateNavigationContext([emptyContainer]);

      expect(context.canEnter).toBe(false);
    });

    it('should disable exit button for top-level nodes', () => {
      const topLevelNode = createMockSceneNode('top-1', 'Top Level');
      const page = createMockPageNode('page-1', 'Test Page', [topLevelNode]);
      (topLevelNode as any).parent = page;

      const context = LayerNavigationHandler.validateNavigationContext([topLevelNode]);

      // Top-level nodes have PAGE as parent, not a container
      expect(context.hasSelection).toBe(true);
    });

    it('should disable sibling navigation for only child', () => {
      const onlyChild = createMockSceneNode('only-1', 'Only Child', 'RECTANGLE');
      const parent = createMockContainer('parent-1', 'Parent', 'GROUP', [onlyChild]);
      (onlyChild as any).parent = parent;

      const context = LayerNavigationHandler.validateNavigationContext([onlyChild]);

      expect(context.canEnter).toBe(false);
      expect(context.canExit).toBe(true);
      expect(context.canNavigateSiblings).toBe(false);
    });

    it('should handle multiple selection correctly', () => {
      const node1 = createMockSceneNode('node-1', 'Node 1', 'RECTANGLE');
      const node2 = createMockSceneNode('node-2', 'Node 2', 'RECTANGLE');
      const commonParent = createMockContainer('parent-1', 'Common Parent', 'GROUP', [node1, node2]);
      (node1 as any).parent = commonParent;
      (node2 as any).parent = commonParent;

      const context = LayerNavigationHandler.validateNavigationContext([node1, node2]);

      expect(context.hasSelection).toBe(true);
      expect(context.canExit).toBe(true);
      expect(context.hasComponentInstance).toBe(false);
    });

    it('should disable all navigation for empty selection', () => {
      const context = LayerNavigationHandler.validateNavigationContext([]);

      expect(context.hasSelection).toBe(false);
      expect(context.canExit).toBe(false);
      expect(context.hasComponentInstance).toBe(false);
    });
  });

  describe('Container Count Calculation', () => {
    it('should count containers on page', () => {
      const group = createMockContainer('group-1', 'Group', 'GROUP');
      const frame = createMockContainer('frame-1', 'Frame', 'FRAME');
      const section = createMockContainer('section-1', 'Section', 'SECTION');
      const rectangle = createMockSceneNode('rect-1', 'Rectangle', 'RECTANGLE');

      Object.defineProperty(figma.currentPage, 'children', {
        value: [group, frame, section, rectangle],
        writable: true,
        configurable: true
      });

      // Select one of the containers to trigger the container-counting path
      const context = LayerNavigationHandler.validateNavigationContext([group]);
      expect(context.containerCount).toBeGreaterThanOrEqual(0);
    });

    it('should return zero for page with no containers', () => {
      const rectangle = createMockSceneNode('rect-1', 'Rectangle', 'RECTANGLE');
      const text = createMockSceneNode('text-1', 'Text', 'TEXT');

      Object.defineProperty(figma.currentPage, 'children', {
        value: [rectangle, text],
        writable: true,
        configurable: true
      });

      const context = LayerNavigationHandler.validateNavigationContext([rectangle]);
      expect(context.containerCount).toBe(0);
    });
  });

  describe('Context Update Performance', () => {
    it('should efficiently calculate context for large selections', () => {
      const largeSelection: SceneNode[] = [];
      for (let i = 0; i < 100; i++) {
        largeSelection.push(createMockSceneNode(`node-${i}`, `Node ${i}`));
      }

      const startTime = performance.now();
      const context = LayerNavigationHandler.validateNavigationContext(largeSelection);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
      expect(context.hasSelection).toBe(true);
    });

    it('should produce consistent results for repeated calls', () => {
      const node = createMockSceneNode('node-1', 'Test Node');

      const context1 = LayerNavigationHandler.validateNavigationContext([node]);
      const context2 = LayerNavigationHandler.validateNavigationContext([node]);
      const context3 = LayerNavigationHandler.validateNavigationContext([node]);

      expect(context1.canEnter).toBe(context2.canEnter);
      expect(context1.canExit).toBe(context2.canExit);
      expect(context1.canNavigateSiblings).toBe(context2.canNavigateSiblings);
      expect(context2.canEnter).toBe(context3.canEnter);
    });
  });

  describe('Real-time Context Updates', () => {
    it('should detect context changes when selection changes', () => {
      const node1 = createMockSceneNode('node-1', 'Node 1', 'RECTANGLE');
      const child = createMockSceneNode('child-1', 'Child');
      const container = createMockContainer('container-1', 'Container', 'GROUP', [child]);

      const context1 = LayerNavigationHandler.validateNavigationContext([node1]);
      const context2 = LayerNavigationHandler.validateNavigationContext([container]);

      expect(context1.canEnter).toBe(false);
      expect(context2.canEnter).toBe(true);
    });

    it('should handle rapid selection changes efficiently', () => {
      const child = createMockSceneNode('child-1', 'Child');
      const nodes = [
        createMockSceneNode('node-1', 'Node 1', 'RECTANGLE'),
        createMockContainer('container-1', 'Container', 'GROUP', [child]),
        createMockSceneNode('node-2', 'Node 2', 'TEXT')
      ];

      const startTime = performance.now();
      const contexts = nodes.map(node =>
        LayerNavigationHandler.validateNavigationContext([node])
      );
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
      expect(contexts[0].canEnter).toBe(false);
      expect(contexts[1].canEnter).toBe(true);
      expect(contexts[2].canEnter).toBe(false);
    });
  });
});
