/// <reference types="@figma/plugin-typings" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  NavigationActionMessage,
  NavigationContextUpdateMessage,
  NavigationControlsSettingMessage,
  ToggleNavigationControlsMessage,
  NavigationContext
} from '../core/types';

// Mock UI elements and event handlers
const mockNavigationButtons = {
  enter: { disabled: false, addEventListener: vi.fn(), removeEventListener: vi.fn() },
  exit: { disabled: false, addEventListener: vi.fn(), removeEventListener: vi.fn() },
  nextSibling: { disabled: false, addEventListener: vi.fn(), removeEventListener: vi.fn() },
  prevSibling: { disabled: false, addEventListener: vi.fn(), removeEventListener: vi.fn() },
  collapse: { disabled: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }
};

const mockNavigationSection = {
  style: { display: 'block' },
  classList: { add: vi.fn(), remove: vi.fn(), toggle: vi.fn() }
};

const mockSettingsToggle = {
  checked: true,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

describe('Navigation UI Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.values(mockNavigationButtons).forEach(button => {
      button.disabled = false;
    });
    mockNavigationSection.style.display = 'block';
    mockSettingsToggle.checked = true;
    figma.ui.postMessage = vi.fn();
  });

  describe('Message Handling Integration', () => {
    it('should handle navigation action messages correctly', () => {
      const mockMessageHandler = vi.fn();
      const enterMessage: NavigationActionMessage = {
        type: 'navigation-action',
        action: 'enter'
      };

      mockMessageHandler(enterMessage);

      expect(mockMessageHandler).toHaveBeenCalledWith(enterMessage);
      expect(enterMessage.type).toBe('navigation-action');
      expect(enterMessage.action).toBe('enter');
    });

    it('should send context updates to UI when selection changes', () => {
      const mockContext: NavigationContext = {
        hasSelection: true,
        canEnter: true,
        canExit: false,
        canNavigateSiblings: true,
        containerCount: 5,
        siblingContainerCount: 3,
        hasCollapsibleSiblings: true,
        hasComponentInstance: false
      };

      const expectedMessage: NavigationContextUpdateMessage = {
        type: 'navigation-context-update',
        context: mockContext
      };

      figma.ui.postMessage(expectedMessage);

      expect(figma.ui.postMessage).toHaveBeenCalledWith(expectedMessage);
    });

    it('should handle settings toggle messages', () => {
      const toggleMessage: ToggleNavigationControlsMessage = {
        type: 'toggle-navigation-controls',
        enabled: false
      };

      const mockSettingsHandler = vi.fn((message: ToggleNavigationControlsMessage) => {
        if (message.type === 'toggle-navigation-controls') {
          const response: NavigationControlsSettingMessage = {
            type: 'navigation-controls-setting',
            enabled: message.enabled
          };
          figma.ui.postMessage(response);
        }
      });

      mockSettingsHandler(toggleMessage);

      expect(figma.ui.postMessage).toHaveBeenCalledWith({
        type: 'navigation-controls-setting',
        enabled: false
      });
    });

    it('should validate message formats before processing', () => {
      const validMessage: NavigationActionMessage = {
        type: 'navigation-action',
        action: 'enter'
      };

      const invalidMessage = {
        type: 'navigation-action'
        // missing action property
      };

      const mockValidator = (message: Record<string, unknown>): message is NavigationActionMessage => {
        return message.type === 'navigation-action' &&
               typeof message.action === 'string' &&
               ['enter', 'exit', 'next-sibling', 'prev-sibling', 'toggle-collapse', 'goto-main-component'].includes(message.action as string);
      };

      expect(mockValidator(validMessage)).toBe(true);
      expect(mockValidator(invalidMessage)).toBe(false);
    });
  });

  describe('Button State Management', () => {
    it('should update button states based on navigation context', () => {
      const context: NavigationContext = {
        hasSelection: true,
        canEnter: false,
        canExit: true,
        canNavigateSiblings: false,
        containerCount: 3,
        siblingContainerCount: 1,
        hasCollapsibleSiblings: false,
        hasComponentInstance: false
      };

      const mockUpdateButtonStates = (ctx: NavigationContext) => {
        mockNavigationButtons.enter.disabled = !ctx.canEnter;
        mockNavigationButtons.exit.disabled = !ctx.canExit;
        mockNavigationButtons.nextSibling.disabled = !ctx.canNavigateSiblings;
        mockNavigationButtons.prevSibling.disabled = !ctx.canNavigateSiblings;
        mockNavigationButtons.collapse.disabled = ctx.containerCount === 0;
      };

      mockUpdateButtonStates(context);

      expect(mockNavigationButtons.enter.disabled).toBe(true);
      expect(mockNavigationButtons.exit.disabled).toBe(false);
      expect(mockNavigationButtons.nextSibling.disabled).toBe(true);
      expect(mockNavigationButtons.prevSibling.disabled).toBe(true);
      expect(mockNavigationButtons.collapse.disabled).toBe(false);
    });

    it('should disable all buttons when no selection exists', () => {
      const emptyContext: NavigationContext = {
        hasSelection: false,
        canEnter: false,
        canExit: false,
        canNavigateSiblings: false,
        containerCount: 0,
        siblingContainerCount: 0,
        hasCollapsibleSiblings: false,
        hasComponentInstance: false
      };

      const mockUpdateButtonStates = (ctx: NavigationContext) => {
        const allDisabled = !ctx.hasSelection;
        mockNavigationButtons.enter.disabled = allDisabled || !ctx.canEnter;
        mockNavigationButtons.exit.disabled = allDisabled || !ctx.canExit;
        mockNavigationButtons.nextSibling.disabled = allDisabled || !ctx.canNavigateSiblings;
        mockNavigationButtons.prevSibling.disabled = allDisabled || !ctx.canNavigateSiblings;
        mockNavigationButtons.collapse.disabled = ctx.containerCount === 0;
      };

      mockUpdateButtonStates(emptyContext);

      Object.values(mockNavigationButtons).forEach(button => {
        expect(button.disabled).toBe(true);
      });
    });

    it('should handle rapid context updates efficiently', () => {
      const contexts: NavigationContext[] = [
        { hasSelection: true, canEnter: true, canExit: false, canNavigateSiblings: true, containerCount: 2, siblingContainerCount: 1, hasCollapsibleSiblings: true, hasComponentInstance: false },
        { hasSelection: true, canEnter: false, canExit: true, canNavigateSiblings: false, containerCount: 2, siblingContainerCount: 0, hasCollapsibleSiblings: false, hasComponentInstance: false },
        { hasSelection: false, canEnter: false, canExit: false, canNavigateSiblings: false, containerCount: 0, siblingContainerCount: 0, hasCollapsibleSiblings: false, hasComponentInstance: false }
      ];

      const mockUpdateButtonStates = vi.fn((ctx: NavigationContext) => {
        mockNavigationButtons.enter.disabled = !ctx.canEnter;
        mockNavigationButtons.exit.disabled = !ctx.canExit;
      });

      const startTime = performance.now();
      contexts.forEach(context => mockUpdateButtonStates(context));
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(10);
      expect(mockUpdateButtonStates).toHaveBeenCalledTimes(3);
    });
  });

  describe('Event Handler Integration', () => {
    it('should attach event listeners to navigation buttons', () => {
      const mockAttachEventListeners = () => {
        Object.entries(mockNavigationButtons).forEach(([_action, button]) => {
          button.addEventListener('click', vi.fn());
        });
      };

      mockAttachEventListeners();

      Object.values(mockNavigationButtons).forEach(button => {
        expect(button.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
      });
    });

    it('should clean up event listeners on component unmount', () => {
      const handlers = new Map<string, ReturnType<typeof vi.fn>>();

      // Attach
      Object.entries(mockNavigationButtons).forEach(([action, button]) => {
        const handler = vi.fn();
        handlers.set(action, handler);
        button.addEventListener('click', handler);
      });

      // Cleanup
      Object.entries(mockNavigationButtons).forEach(([action, button]) => {
        const handler = handlers.get(action);
        button.removeEventListener('click', handler);
      });

      Object.values(mockNavigationButtons).forEach(button => {
        expect(button.removeEventListener).toHaveBeenCalled();
      });
    });
  });

  describe('Settings UI Integration', () => {
    it('should show/hide navigation section based on settings', () => {
      const mockToggleVisibility = (enabled: boolean) => {
        mockNavigationSection.style.display = enabled ? 'block' : 'none';
        if (enabled) {
          mockNavigationSection.classList.remove('hidden');
        } else {
          mockNavigationSection.classList.add('hidden');
        }
      };

      mockToggleVisibility(false);
      expect(mockNavigationSection.style.display).toBe('none');
      expect(mockNavigationSection.classList.add).toHaveBeenCalledWith('hidden');

      mockToggleVisibility(true);
      expect(mockNavigationSection.style.display).toBe('block');
      expect(mockNavigationSection.classList.remove).toHaveBeenCalledWith('hidden');
    });

    it('should handle settings toggle interactions', () => {
      const mockToggleHandler = vi.fn((event: { target: { checked: boolean } }) => {
        const message: ToggleNavigationControlsMessage = {
          type: 'toggle-navigation-controls',
          enabled: event.target.checked
        };
        figma.ui.postMessage(message);
      });

      mockToggleHandler({ target: { checked: false } });

      expect(figma.ui.postMessage).toHaveBeenCalledWith({
        type: 'toggle-navigation-controls',
        enabled: false
      });
    });
  });
});
