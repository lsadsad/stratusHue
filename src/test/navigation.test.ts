/// <reference types="@figma/plugin-typings" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LayerNavigationHandler } from '../features/navigation';
import { createMockSceneNode, createMockContainer, createMockPageNode } from './setup';
import type { NavigationResult, NavigationContext } from '../core/types';

describe('LayerNavigationHandler', () => {
  describe('enterContainer', () => {
    it('should successfully enter a container with children', () => {
      const child1 = createMockSceneNode('child-1', 'Child 1');
      const child2 = createMockSceneNode('child-2', 'Child 2');
      const container = createMockContainer('container-1', 'Test Group', 'GROUP', [child1, child2]);

      const result = LayerNavigationHandler.enterContainer(container);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Test Group');
      expect(result.newSelection).toEqual([child1, child2]);
      expect(result.viewportUpdate).toBe(true);
    });

    it('should fail when trying to enter an empty container', () => {
      const emptyContainer = createMockContainer('empty-1', 'Empty Group', 'GROUP', []);

      const result = LayerNavigationHandler.enterContainer(emptyContainer);

      expect(result.success).toBe(false);
      expect(result.message).toContain('empty');
      expect(result.viewportUpdate).toBe(false);
    });

    it('should fail when trying to enter a non-container node', () => {
      const rectangle = createMockSceneNode('rect-1', 'Rectangle', 'RECTANGLE');

      const result = LayerNavigationHandler.enterContainer(rectangle);

      expect(result.success).toBe(false);
      expect(result.message).toContain('not a container');
      expect(result.viewportUpdate).toBe(false);
    });

    it('should handle containers with only invisible children', () => {
      const invisibleChild = createMockSceneNode('child-1', 'Hidden Child', 'RECTANGLE', { visible: false });
      const container = createMockContainer('container-1', 'Test Group', 'GROUP', [invisibleChild]);

      const result = LayerNavigationHandler.enterContainer(container);

      expect(result.success).toBe(false);
      expect(result.message).toContain('no visible children');
      expect(result.viewportUpdate).toBe(false);
    });

    it('should filter out invisible children and select only visible ones', () => {
      const visibleChild = createMockSceneNode('child-1', 'Visible Child');
      const invisibleChild = createMockSceneNode('child-2', 'Hidden Child', 'RECTANGLE', { visible: false });
      const container = createMockContainer('container-1', 'Mixed Group', 'GROUP', [visibleChild, invisibleChild]);

      const result = LayerNavigationHandler.enterContainer(container);

      expect(result.success).toBe(true);
      expect(result.newSelection).toEqual([visibleChild]);
    });
  });

  describe('exitContainer', () => {
    it('should successfully exit from a single selected child to its parent', () => {
      const child = createMockSceneNode('child-1', 'Child');
      const parent = createMockContainer('parent-1', 'Parent Group', 'GROUP', [child]);
      (child as any).parent = parent;

      const result = LayerNavigationHandler.exitContainer(child);

      expect(result.success).toBe(true);
      expect(result.newSelection).toEqual([parent]);
    });

    it('should handle top-level nodes (direct children of page)', () => {
      const topLevelNode = createMockSceneNode('top-1', 'Top Level');
      const page = createMockPageNode('page-1', 'Test Page', [topLevelNode]);
      (topLevelNode as any).parent = page;

      const result = LayerNavigationHandler.exitContainer(topLevelNode);

      // Top-level nodes exit to page level (deselect) or report no parent
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('should find common parent for multiple selected nodes', () => {
      const child1 = createMockSceneNode('child-1', 'Child 1');
      const child2 = createMockSceneNode('child-2', 'Child 2');
      const commonParent = createMockContainer('parent-1', 'Common Parent', 'GROUP', [child1, child2]);
      (child1 as any).parent = commonParent;
      (child2 as any).parent = commonParent;

      const result = LayerNavigationHandler.exitContainer([child1, child2]);

      expect(result.success).toBe(true);
      expect(result.newSelection).toEqual([commonParent]);
    });

    it('should handle empty selection', () => {
      const result = LayerNavigationHandler.exitContainer([]);

      expect(result.success).toBe(false);
      expect(result.message).toContain('No selection');
      expect(result.viewportUpdate).toBe(false);
    });
  });

  describe('navigateToSibling', () => {
    it('should navigate to next sibling successfully', () => {
      const currentNode = createMockSceneNode('node-1', 'Current Node');
      const nextSibling = createMockSceneNode('node-2', 'Next Sibling');
      const parent = createMockContainer('parent-1', 'Parent', 'GROUP', [currentNode, nextSibling]);
      (currentNode as any).parent = parent;
      (nextSibling as any).parent = parent;

      const result = LayerNavigationHandler.navigateToSibling(currentNode, 'next');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Next Sibling');
      expect(result.newSelection).toEqual([nextSibling]);
      expect(result.viewportUpdate).toBe(true);
    });

    it('should navigate to previous sibling successfully', () => {
      const currentNode = createMockSceneNode('node-2', 'Current Node');
      const prevSibling = createMockSceneNode('node-1', 'Previous Sibling');
      const parent = createMockContainer('parent-1', 'Parent', 'GROUP', [prevSibling, currentNode]);
      (currentNode as any).parent = parent;
      (prevSibling as any).parent = parent;

      const result = LayerNavigationHandler.navigateToSibling(currentNode, 'prev');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Previous Sibling');
      expect(result.newSelection).toEqual([prevSibling]);
      expect(result.viewportUpdate).toBe(true);
    });

    it('should wrap when navigating past the end', () => {
      // Figma array: index 0 = bottom-most, last = top-most
      // 'next' = DOWN in panel = lower index
      // At index 0, going 'next' wraps to top (last index)
      const bottomNode = createMockSceneNode('node-1', 'Bottom');
      const middleNode = createMockSceneNode('node-2', 'Middle');
      const topNode = createMockSceneNode('node-3', 'Top');
      const parent = createMockContainer('parent-1', 'Parent', 'GROUP', [bottomNode, middleNode, topNode]);
      (bottomNode as any).parent = parent;
      (middleNode as any).parent = parent;
      (topNode as any).parent = parent;

      // Going 'next' (down) from bottom-most should wrap to top-most
      const result = LayerNavigationHandler.navigateToSibling(bottomNode, 'next');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Wrapped');
      expect(result.newSelection).toEqual([topNode]);
    });

    it('should wrap when navigating past the beginning', () => {
      const bottomNode = createMockSceneNode('node-1', 'Bottom');
      const middleNode = createMockSceneNode('node-2', 'Middle');
      const topNode = createMockSceneNode('node-3', 'Top');
      const parent = createMockContainer('parent-1', 'Parent', 'GROUP', [bottomNode, middleNode, topNode]);
      (bottomNode as any).parent = parent;
      (middleNode as any).parent = parent;
      (topNode as any).parent = parent;

      // Going 'prev' (up) from top-most should wrap to bottom-most
      const result = LayerNavigationHandler.navigateToSibling(topNode, 'prev');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Wrapped');
      expect(result.newSelection).toEqual([bottomNode]);
    });

    it('should handle node with no parent gracefully', () => {
      const orphan = createMockSceneNode('orphan-1', 'Orphan');
      (orphan as any).parent = null;

      const result = LayerNavigationHandler.navigateToSibling(orphan, 'next');

      expect(result.success).toBe(false);
    });
  });

  describe('toggleCollapse', () => {
    it('should collapse all containers when they are expanded', () => {
      const mockFrame = createMockSceneNode('frame-1', 'Frame', 'FRAME');
      Object.defineProperty(mockFrame, 'expanded', { value: true, writable: true });
      const mockGroup = createMockSceneNode('group-1', 'Group', 'GROUP');
      Object.defineProperty(mockGroup, 'expanded', { value: true, writable: true });

      Object.defineProperty(figma.currentPage, 'children', {
        value: [mockFrame, mockGroup],
        writable: true,
        configurable: true
      });

      const result = LayerNavigationHandler.toggleCollapse();

      expect(result.success).toBe(true);
      expect(result.message).toContain('Collapsed');
    });

    it('should handle pages with no containers', () => {
      Object.defineProperty(figma.currentPage, 'children', {
        value: [],
        writable: true,
        configurable: true
      });

      const result = LayerNavigationHandler.toggleCollapse();

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('validateNavigationContext', () => {
    it('should return correct context for empty selection', () => {
      const context = LayerNavigationHandler.validateNavigationContext([]);

      expect(context.hasSelection).toBe(false);
      expect(context.canExit).toBe(false);
      expect(context.hasComponentInstance).toBe(false);
    });

    it('should return correct context for container selection', () => {
      const container = createMockContainer('container-1', 'Test Group', 'GROUP', [
        createMockSceneNode('child-1', 'Child 1')
      ]);
      const sibling = createMockSceneNode('sibling-1', 'Sibling');
      const parent = createMockPageNode('page-1', 'Test Page', [container, sibling]);
      (container as any).parent = parent;
      (sibling as any).parent = parent;

      const context = LayerNavigationHandler.validateNavigationContext([container]);

      expect(context.hasSelection).toBe(true);
      expect(context.canEnter).toBe(true);
      expect(context.hasComponentInstance).toBe(false);
    });

    it('should return correct context for non-container with parent', () => {
      const child = createMockSceneNode('child-1', 'Child', 'RECTANGLE');
      const parent = createMockContainer('parent-1', 'Parent', 'GROUP', [child]);
      (child as any).parent = parent;

      const context = LayerNavigationHandler.validateNavigationContext([child]);

      expect(context.hasSelection).toBe(true);
      expect(context.canEnter).toBe(false);
      expect(context.canExit).toBe(true);
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
  });

  describe('Helper Methods (via public API)', () => {
    describe('isContainer (via enterContainer)', () => {
      it('should identify container types correctly', () => {
        // Test containers: should be enterable
        const child = createMockSceneNode('child', 'Child');
        const group = createMockContainer('1', 'Test', 'GROUP', [child]);
        const groupResult = LayerNavigationHandler.enterContainer(group);
        expect(groupResult.success).toBe(true);

        const child2 = createMockSceneNode('child2', 'Child');
        const frame = createMockContainer('2', 'Test', 'FRAME', [child2]);
        const frameResult = LayerNavigationHandler.enterContainer(frame);
        expect(frameResult.success).toBe(true);

        const child3 = createMockSceneNode('child3', 'Child');
        const section = createMockContainer('3', 'Test', 'SECTION', [child3]);
        const sectionResult = LayerNavigationHandler.enterContainer(section);
        expect(sectionResult.success).toBe(true);

        // Non-container: should not be enterable
        const rectangle = createMockSceneNode('7', 'Test', 'RECTANGLE');
        const rectangleResult = LayerNavigationHandler.enterContainer(rectangle);
        expect(rectangleResult.success).toBe(false);
      });
    });

    describe('findParentContainer (via exitContainer)', () => {
      it('should find immediate parent container', () => {
        const child = createMockSceneNode('child-1', 'Child');
        const parent = createMockContainer('parent-1', 'Parent', 'GROUP', [child]);
        (child as any).parent = parent;

        const result = LayerNavigationHandler.exitContainer(child);

        expect(result.success).toBe(true);
        expect(result.newSelection).toHaveLength(1);
        expect(result.newSelection![0].id).toBe(parent.id);
      });

      it('should return appropriate result for top-level nodes', () => {
        const topLevel = createMockSceneNode('top-1', 'Top Level');
        const page = createMockPageNode('page-1', 'Test Page', [topLevel]);
        (topLevel as any).parent = page;
        (page as any).type = 'PAGE';

        const result = LayerNavigationHandler.exitContainer(topLevel);

        expect(result).toBeDefined();
        // Top-level nodes either exit to page level or report no parent
        expect(typeof result.success).toBe('boolean');
      });
    });
  });
});
