# Implementation Plan

- [x] 1. Set up section container structure and identification system
  - Wrap existing sections in a draggable container with proper data attributes
  - Add unique section IDs and establish section configuration mapping
  - Create section order management utilities for DOM manipulation
  - _Requirements: 1.1, 2.3_

- [x] 2. Implement core drag-and-drop functionality for section headers
  - [x] 2.1 Create section drag handler class based on bookmark drag patterns
    - Adapt existing bookmark drag logic for section header elements
    - Implement drag state management for section reordering operations
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 2.2 Add drag event listeners to section headers
    - Implement dragstart, dragover, drop, and dragend event handlers
    - Handle section header + content pairing during drag operations
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 2.3 Implement section reordering logic in DOM
    - Create functions to reorder section elements while maintaining header-content relationships
    - Handle edge cases like dragging to same position or invalid drop zones
    - _Requirements: 1.3, 1.4, 5.2, 5.3_

- [x] 3. Add visual feedback system for drag operations
  - [x] 3.1 Create drop indicator styling and positioning system
    - Implement CSS classes for section drop indicators using design tokens
    - Add positioning logic for drop indicators between sections
    - _Requirements: 4.1, 4.2, 4.4, 4.6_

  - [x] 3.2 Implement drag preview and visual states
    - Add CSS classes for dragging state with opacity and transform effects
    - Create hover indicators showing drag handle on section headers
    - _Requirements: 4.1, 4.5, 4.6_

  - [x] 3.3 Add theme-compatible drag styling
    - Ensure drag indicators work across all themes (boilerplate, cybertron, figma-light)
    - Use existing design token system for consistent visual feedback
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 4. Integrate with existing state persistence system
  - [x] 4.1 Extend UI state management for section order
    - Add section order to existing UI state persistence mechanism
    - Implement save and load functions for section order using existing patterns
    - _Requirements: 2.1, 2.2, 2.4_
  - [x] 4.2 Add message passing for section order persistence

    - Extend existing message passing system to handle section order updates
    - Implement plugin-side handlers for section order save/load operations
    - _Requirements: 2.1, 2.2_

  - [x] 4.3 Implement section order restoration on plugin initialization





    - Load saved section order during plugin startup before UI becomes visible
    - Apply saved order to DOM elements with fallback to default order
    - _Requirements: 2.2, 2.3, 2.4_

- [x] 5. Add keyboard accessibility for section reordering





  - [x] 5.1 Implement keyboard shortcuts for section movement


    - Add Ctrl+Up and Ctrl+Down keyboard handlers for section reordering
    - Implement focus management during keyboard-driven reordering
    - _Requirements: 3.1, 3.2_

  - [x] 5.2 Add screen reader announcements for reorder operations


    - Implement ARIA announcements for section position changes
    - Add audio feedback for invalid reorder attempts
    - _Requirements: 3.3, 3.4_

- [x] 6. Implement drag cancellation and error handling





  - [x] 6.1 Add drag cancellation mechanisms


    - Implement Escape key cancellation during drag operations
    - Handle drag-to-original-position as cancellation
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 6.2 Add error handling and recovery


    - Implement fallback behavior for failed drag operations
    - Add validation for section order data and graceful degradation
    - _Requirements: 2.4, 5.4_

- [x] 7. Wire together all components and test integration





  - [x] 7.1 Initialize drag system on plugin startup


    - Integrate section drag initialization with existing plugin initialization
    - Ensure proper cleanup of event listeners and state
    - _Requirements: 1.1, 2.2_

  - [x] 7.2 Test complete drag-and-drop workflow

    - Verify end-to-end functionality from drag initiation to state persistence
    - Test interaction with existing collapsible section functionality
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2_

  - [ ]* 7.3 Write unit tests for section reordering logic
    - Create tests for section order management utilities
    - Test drag state management and DOM manipulation functions
    - _Requirements: 1.3, 2.1_

  - [ ]* 7.4 Write integration tests for state persistence
    - Test section order save/load functionality with various data states
    - Test message passing between UI and plugin sandbox for section order
    - _Requirements: 2.1, 2.2, 2.4_