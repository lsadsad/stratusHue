# Manual Testing Scenarios for Layer Navigation Controls

## Overview

This document provides comprehensive manual testing scenarios for the Layer Navigation Controls feature. These tests should be performed manually in Figma to verify the complete functionality, user experience, and edge cases that automated tests cannot cover.

## Prerequisites

- Figma desktop app or browser version
- Stratus Hue plugin installed with Layer Navigation Controls feature
- Test files with various layer hierarchies (simple, complex, nested)
- Different device types for responsive testing (if applicable)

## Test Environment Setup

### Test File 1: Simple Hierarchy
```
Page: Simple Test
├── Group "Container A"
│   ├── Rectangle "Child 1"
│   ├── Rectangle "Child 2"
│   └── Rectangle "Child 3"
├── Group "Container B"
│   ├── Text "Label 1"
│   └── Text "Label 2"
└── Rectangle "Top Level Item"
```

### Test File 2: Complex Nested Hierarchy
```
Page: Complex Test
├── Section "Main Section"
│   ├── Frame "Header Frame"
│   │   ├── Group "Logo Group"
│   │   │   ├── Rectangle "Logo Background"
│   │   │   └── Text "Logo Text"
│   │   └── Group "Navigation Group"
│   │       ├── Rectangle "Nav Item 1"
│   │       ├── Rectangle "Nav Item 2"
│   │       └── Rectangle "Nav Item 3"
│   ├── Frame "Content Frame"
│   │   ├── Group "Article Group"
│   │   │   ├── Text "Article Title"
│   │   │   └── Text "Article Body"
│   │   └── Group "Sidebar Group"
│   │       ├── Rectangle "Widget 1"
│   │       └── Rectangle "Widget 2"
│   └── Frame "Footer Frame"
│       └── Text "Footer Text"
└── Rectangle "Background"
```

### Test File 3: Edge Cases
```
Page: Edge Cases
├── Group "Empty Group" (no children)
├── Group "Hidden Children Group"
│   ├── Rectangle "Visible Child"
│   └── Rectangle "Hidden Child" (visibility: hidden)
├── Group "Locked Group" (locked)
│   └── Rectangle "Locked Child"
└── Rectangle "Single Item"
```

---

## Core Navigation Functionality Tests

### Test Group 1: Container Entry Navigation

#### Test 1.1: Enter Container with Multiple Children
**Objective:** Verify entering a container selects all visible children

**Steps:**
1. Open Simple Test file
2. Select "Container A" group
3. Click the Enter button (bottom-right in navigation grid)

**Expected Results:**
- All children (Child 1, Child 2, Child 3) should be selected
- Viewport should focus on the container contents
- Success message should display: "Entered group: Container A (3 children)"
- Selection history should record the navigation

**Pass/Fail:** ___

#### Test 1.2: Enter Empty Container
**Objective:** Verify appropriate feedback when entering empty container

**Steps:**
1. Open Edge Cases file
2. Select "Empty Group"
3. Click the Enter button

**Expected Results:**
- No selection change should occur
- Error message should display: "group 'Empty Group' is empty"
- Enter button should remain enabled (validation happens on action)

**Pass/Fail:** ___

#### Test 1.3: Enter Non-Container Element
**Objective:** Verify error handling for non-container selection

**Steps:**
1. Select "Top Level Item" rectangle
2. Click the Enter button

**Expected Results:**
- No selection change should occur
- Error message should display: "Cannot enter rectangle: not a container"
- Enter button should be disabled when rectangle is selected

**Pass/Fail:** ___

#### Test 1.4: Enter Container with Hidden Children
**Objective:** Verify filtering of invisible children

**Steps:**
1. Open Edge Cases file
2. Select "Hidden Children Group"
3. Click the Enter button

**Expected Results:**
- Only "Visible Child" should be selected
- Success message should display: "Entered group: Hidden Children Group (1 children)"
- Hidden child should not be selected

**Pass/Fail:** ___

### Test Group 2: Container Exit Navigation

#### Test 2.1: Exit from Child to Parent
**Objective:** Verify exiting from child selects parent container

**Steps:**
1. Open Simple Test file
2. Select "Child 1" inside "Container A"
3. Click the Exit button (top-left in navigation grid)

**Expected Results:**
- "Container A" group should be selected
- Viewport should zoom out to show the container
- Success message should display: "Exited to group: Container A"
- Selection history should record the navigation

**Pass/Fail:** ___

#### Test 2.2: Exit from Top-Level Element
**Objective:** Verify error handling when no parent exists

**Steps:**
1. Select "Top Level Item" rectangle
2. Click the Exit button

**Expected Results:**
- No selection change should occur
- Error message should display: "'Top Level Item' has no parent container to exit to"
- Exit button should be disabled when top-level item is selected

**Pass/Fail:** ___

#### Test 2.3: Exit from Multiple Selection with Common Parent
**Objective:** Verify common parent selection for multiple items

**Steps:**
1. Select both "Child 1" and "Child 2" inside "Container A"
2. Click the Exit button

**Expected Results:**
- "Container A" group should be selected
- Success message should display: "Exited to common parent group: Container A"

**Pass/Fail:** ___

#### Test 2.4: Exit from Multiple Selection with No Common Parent
**Objective:** Verify error handling for items with different parents

**Steps:**
1. Select "Child 1" from "Container A" and "Label 1" from "Container B"
2. Click the Exit button

**Expected Results:**
- No selection change should occur
- Error message should display: "Selected items have no common parent container"

**Pass/Fail:** ___

### Test Group 3: Sibling Navigation

#### Test 3.1: Navigate to Next Sibling
**Objective:** Verify forward sibling navigation

**Steps:**
1. Select "Child 1" inside "Container A"
2. Click the Tab button (middle-right in navigation grid)

**Expected Results:**
- "Child 2" should be selected
- Success message should display navigation to "Child 2"
- Viewport should focus on the new selection

**Pass/Fail:** ___

#### Test 3.2: Navigate to Previous Sibling
**Objective:** Verify backward sibling navigation

**Steps:**
1. Select "Child 2" inside "Container A"
2. Click the Shift+Tab button (top-right in navigation grid)

**Expected Results:**
- "Child 1" should be selected
- Success message should display navigation to "Child 1"

**Pass/Fail:** ___

#### Test 3.3: Wrap to First Sibling from Last
**Objective:** Verify wrapping behavior at end of sibling list

**Steps:**
1. Select "Child 3" (last child in "Container A")
2. Click the Tab button

**Expected Results:**
- "Child 1" should be selected (wrapped to first)
- Success message should display: "Wrapped to first sibling: Child 1"

**Pass/Fail:** ___

#### Test 3.4: Wrap to Last Sibling from First
**Objective:** Verify wrapping behavior at beginning of sibling list

**Steps:**
1. Select "Child 1" (first child in "Container A")
2. Click the Shift+Tab button

**Expected Results:**
- "Child 3" should be selected (wrapped to last)
- Success message should display: "Wrapped to last sibling: Child 3"

**Pass/Fail:** ___

#### Test 3.5: Navigate with Only Child
**Objective:** Verify error handling for elements with no siblings

**Steps:**
1. Open Edge Cases file
2. Select "Single Item" rectangle
3. Click the Tab button

**Expected Results:**
- No selection change should occur
- Error message should display: "'Single Item' has no next siblings"
- Sibling navigation buttons should be disabled

**Pass/Fail:** ___

### Test Group 4: Collapse/Expand Toggle

#### Test 4.1: Collapse All Containers
**Objective:** Verify collapsing all containers on page

**Steps:**
1. Open Complex Test file (ensure all containers are expanded)
2. Click the Collapse button (middle-left in navigation grid)

**Expected Results:**
- All Groups, Frames, and Sections should collapse in layers panel
- Success message should display container count: "Collapsed X containers"
- Current selection should be maintained if possible

**Pass/Fail:** ___

#### Test 4.2: Expand All Containers
**Objective:** Verify expanding all containers when collapsed

**Steps:**
1. With containers collapsed from previous test
2. Click the Collapse button again

**Expected Results:**
- All Groups, Frames, and Sections should expand in layers panel
- Success message should display: "Expanded X containers"
- Current selection should be maintained

**Pass/Fail:** ___

#### Test 4.3: Toggle on Page with No Containers
**Objective:** Verify behavior on page without containers

**Steps:**
1. Create a page with only basic shapes (rectangles, text, etc.)
2. Click the Collapse button

**Expected Results:**
- No visual change in layers panel
- Message should display: "No containers found to collapse"

**Pass/Fail:** ___

---

## Button State and Context Tests

### Test Group 5: Dynamic Button States

#### Test 5.1: Button States with Container Selection
**Objective:** Verify correct button states for container selection

**Steps:**
1. Select a Group with children and siblings

**Expected Button States:**
- Enter: Enabled (can enter container)
- Exit: Enabled/Disabled (based on parent existence)
- Tab/Shift+Tab: Enabled/Disabled (based on sibling existence)
- Collapse: Enabled (containers exist on page)

**Pass/Fail:** ___

#### Test 5.2: Button States with Non-Container Selection
**Objective:** Verify correct button states for non-container selection

**Steps:**
1. Select a Rectangle or Text element

**Expected Button States:**
- Enter: Disabled (not a container)
- Exit: Enabled/Disabled (based on parent existence)
- Tab/Shift+Tab: Enabled/Disabled (based on sibling existence)
- Collapse: Enabled (if containers exist on page)

**Pass/Fail:** ___

#### Test 5.3: Button States with Empty Selection
**Objective:** Verify button states when nothing is selected

**Steps:**
1. Deselect all elements (click empty area)

**Expected Button States:**
- Enter: Disabled (no selection)
- Exit: Disabled (no selection)
- Tab/Shift+Tab: Disabled (no selection)
- Collapse: Enabled (if containers exist on page)

**Pass/Fail:** ___

#### Test 5.4: Button States with Multiple Selection
**Objective:** Verify button states for multiple selected items

**Steps:**
1. Select multiple elements (mix of containers and non-containers)

**Expected Button States:**
- Enter: Disabled (multiple selection)
- Exit: Enabled (if common parent exists)
- Tab/Shift+Tab: Disabled (multiple selection)
- Collapse: Enabled (if containers exist on page)

**Pass/Fail:** ___

---

## Settings Integration Tests

### Test Group 6: Settings Panel Integration

#### Test 6.1: Toggle Navigation Controls Visibility
**Objective:** Verify settings toggle controls section visibility

**Steps:**
1. Open plugin settings panel
2. Locate "Layer Navigation Controls" toggle
3. Toggle the setting off

**Expected Results:**
- Navigation controls section should disappear from main UI
- Setting should be saved and persist across plugin sessions

**Pass/Fail:** ___

#### Test 6.2: Settings Persistence
**Objective:** Verify settings are saved across sessions

**Steps:**
1. Disable navigation controls in settings
2. Close and reopen the plugin
3. Check settings panel

**Expected Results:**
- Navigation controls should remain hidden
- Settings toggle should show as disabled
- Setting should persist correctly

**Pass/Fail:** ___

#### Test 6.3: Default Settings Behavior
**Objective:** Verify default state for new installations

**Steps:**
1. Fresh plugin installation or reset settings
2. Open plugin

**Expected Results:**
- Navigation controls should be visible by default
- Settings toggle should be enabled
- All navigation functionality should work

**Pass/Fail:** ___

---

## Complex Workflow Tests

### Test Group 7: End-to-End Workflows

#### Test 7.1: Deep Navigation Workflow
**Objective:** Test complete navigation through nested hierarchy

**Steps:**
1. Open Complex Test file
2. Select "Main Section"
3. Enter → Select "Header Frame" → Enter → Select "Logo Group" → Enter
4. Navigate siblings within Logo Group
5. Exit → Exit → Exit back to Main Section

**Expected Results:**
- Each step should work correctly
- Viewport should update appropriately at each level
- Button states should update correctly throughout
- All navigation should be recorded in history

**Pass/Fail:** ___

#### Test 7.2: Mixed Navigation Workflow
**Objective:** Test combination of different navigation types

**Steps:**
1. Start with container selection
2. Enter container
3. Navigate between siblings
4. Exit to parent
5. Navigate to sibling container
6. Collapse all containers
7. Expand all containers

**Expected Results:**
- All navigation steps should work seamlessly
- No conflicts between different navigation types
- Consistent feedback throughout workflow

**Pass/Fail:** ___

#### Test 7.3: Error Recovery Workflow
**Objective:** Test graceful handling of error conditions

**Steps:**
1. Attempt invalid operations (enter non-container, exit top-level)
2. Verify error messages are clear
3. Continue with valid operations
4. Verify functionality remains intact after errors

**Expected Results:**
- Clear error messages for invalid operations
- No permanent state corruption after errors
- Valid operations continue to work normally

**Pass/Fail:** ___

---

## Accessibility Tests

### Test Group 8: Keyboard Navigation

#### Test 8.1: Tab Order Navigation
**Objective:** Verify proper tab order through navigation buttons

**Steps:**
1. Use Tab key to navigate through navigation button grid
2. Verify focus moves in logical order: Exit → Shift+Tab → Collapse → Tab → Enter

**Expected Results:**
- Focus should move in expected order
- Focus indicators should be clearly visible
- All buttons should be reachable via keyboard

**Pass/Fail:** ___

#### Test 8.2: Arrow Key Navigation
**Objective:** Verify arrow key navigation within button grid

**Steps:**
1. Focus on navigation button grid
2. Use arrow keys to navigate between buttons
3. Test all four directions

**Expected Results:**
- Arrow keys should move focus between buttons
- Grid navigation should feel intuitive
- Focus should wrap appropriately at edges

**Pass/Fail:** ___

#### Test 8.3: Keyboard Activation
**Objective:** Verify keyboard activation of navigation buttons

**Steps:**
1. Navigate to each button using keyboard
2. Activate using Enter key and Space bar
3. Verify both activation methods work

**Expected Results:**
- Both Enter and Space should activate buttons
- Activation should trigger same behavior as mouse click
- Disabled buttons should not activate

**Pass/Fail:** ___

### Test Group 9: Screen Reader Support

#### Test 9.1: Button Labels and Descriptions
**Objective:** Verify screen reader accessibility

**Steps:**
1. Use screen reader to navigate navigation controls
2. Verify each button has descriptive label
3. Check that keyboard shortcuts are announced

**Expected Results:**
- Each button should have clear, descriptive label
- Keyboard shortcuts should be included in descriptions
- Button states (enabled/disabled) should be announced

**Pass/Fail:** ___

#### Test 9.2: State Change Announcements
**Objective:** Verify state changes are announced

**Steps:**
1. Change selection to trigger button state changes
2. Verify screen reader announces state changes
3. Test with various selection scenarios

**Expected Results:**
- Button state changes should be announced
- Navigation results should be announced
- Error messages should be accessible

**Pass/Fail:** ___

---

## Performance Tests

### Test Group 10: Large File Performance

#### Test 10.1: Large Hierarchy Navigation
**Objective:** Test performance with large, complex files

**Setup:**
- Create file with 100+ containers, each with 10+ children
- Test navigation operations

**Steps:**
1. Perform various navigation operations
2. Monitor response times and UI responsiveness
3. Test context updates with large selections

**Expected Results:**
- Navigation should remain responsive (< 500ms)
- UI should not freeze during operations
- Memory usage should remain reasonable

**Pass/Fail:** ___

#### Test 10.2: Rapid Navigation Performance
**Objective:** Test performance with rapid navigation actions

**Steps:**
1. Rapidly click navigation buttons in succession
2. Test rapid selection changes
3. Monitor for any lag or UI issues

**Expected Results:**
- UI should remain responsive to rapid inputs
- No visual glitches or state corruption
- Button states should update correctly

**Pass/Fail:** ___

---

## Cross-Feature Integration Tests

### Test Group 11: Integration with Existing Features

#### Test 11.1: Bookmark System Integration
**Objective:** Verify navigation works with bookmarks

**Steps:**
1. Create bookmarks on various layers
2. Use navigation controls to move between layers
3. Jump to bookmarks and continue navigation
4. Verify no conflicts between systems

**Expected Results:**
- Navigation and bookmarks should work independently
- No interference between the two systems
- Both should update selection history correctly

**Pass/Fail:** ___

#### Test 11.2: Color Tagging Integration
**Objective:** Verify navigation works with color tags

**Steps:**
1. Add color tags to various layers
2. Navigate between tagged and untagged layers
3. Verify tags remain intact during navigation

**Expected Results:**
- Color tags should be preserved during navigation
- No conflicts between navigation and tagging
- Both features should work simultaneously

**Pass/Fail:** ___

#### Test 11.3: Theme Compatibility
**Objective:** Verify navigation controls work across all themes

**Steps:**
1. Test navigation controls in each supported theme:
   - Boilerplate (dark)
   - Cybertron (neon)
   - Figma Light
2. Verify visual consistency and functionality

**Expected Results:**
- Navigation controls should be visible in all themes
- Button states should be clearly distinguishable
- No visual artifacts or layout issues

**Pass/Fail:** ___

---

## Edge Case and Error Handling Tests

### Test Group 12: Edge Cases

#### Test 12.1: Locked Layer Handling
**Objective:** Test behavior with locked layers

**Steps:**
1. Lock a container and its children
2. Attempt navigation operations
3. Verify appropriate handling

**Expected Results:**
- Locked layers should be handled gracefully
- Clear feedback for operations that can't be performed
- No crashes or unexpected behavior

**Pass/Fail:** ___

#### Test 12.2: Hidden Layer Handling
**Objective:** Test behavior with hidden layers

**Steps:**
1. Hide various layers in hierarchy
2. Attempt navigation operations
3. Verify hidden layers are filtered appropriately

**Expected Results:**
- Hidden layers should be excluded from navigation
- Visible layers should remain navigable
- Clear feedback when no visible targets exist

**Pass/Fail:** ___

#### Test 12.3: Deleted Layer Recovery
**Objective:** Test recovery when layers are deleted during navigation

**Steps:**
1. Select a layer for navigation
2. Delete the layer while plugin is open
3. Attempt navigation operations

**Expected Results:**
- Plugin should detect deleted layers
- Graceful error handling with clear messages
- No crashes or corrupted state

**Pass/Fail:** ___

---

## Test Results Summary

### Overall Test Results
- **Total Tests:** ___
- **Passed:** ___
- **Failed:** ___
- **Skipped:** ___

### Critical Issues Found
1. ___
2. ___
3. ___

### Minor Issues Found
1. ___
2. ___
3. ___

### Recommendations
1. ___
2. ___
3. ___

### Sign-off
- **Tester:** _______________
- **Date:** _______________
- **Version Tested:** _______________
- **Approved for Release:** Yes / No

---

## Notes for Testers

### General Testing Guidelines
1. **Test Environment:** Always test in a clean Figma environment with the latest plugin version
2. **Documentation:** Document any unexpected behavior, even if it doesn't cause a failure
3. **User Experience:** Pay attention to the overall user experience, not just functionality
4. **Performance:** Note any performance issues, especially with large files
5. **Accessibility:** Test with keyboard-only navigation and screen readers when possible

### Common Issues to Watch For
- Button states not updating correctly
- Viewport not focusing on selections
- Error messages not displaying or being unclear
- Performance degradation with large files
- Conflicts with other plugin features
- Accessibility issues with keyboard navigation

### Reporting Issues
When reporting issues, include:
- Exact steps to reproduce
- Expected vs. actual behavior
- Screenshots or screen recordings
- File structure being tested
- Browser/Figma version information
- Any console errors (if accessible)