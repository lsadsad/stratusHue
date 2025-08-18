# Implementation Plan

- [x] 1. Add recent history state management to backend


  - Create RecentHistoryState interface with bookmarkIds array and lastUpdated timestamp
  - Implement loadRecentHistory() and saveRecentHistory() functions using figma.clientStorage
  - Add recentHistoryState variable to track state in memory with maximum 5 items
  - _Requirements: 1.1, 3.1_

- [x] 2. Implement recent history management logic


  - Create addToRecentHistory() function that adds bookmark ID to front of array
  - Implement logic to move existing bookmark to front if already in recent history
  - Add automatic removal of oldest items when history exceeds 5 items
  - Ensure current anchor is not included in recent history list
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 3. Integrate recent history with bookmark navigation


  - Modify handleJumpToBookmark() function to call addToRecentHistory() when navigating to bookmarks
  - Update the function to save recent history state after each navigation
  - Test that recent history is properly updated when jumping between bookmarks
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 4. Extend UI message system to include recent history data


  - Update sendBookmarksToUI() function to include recentHistoryIds in the message
  - Modify the bookmarks message interface to include recentHistoryIds field
  - Update plugin initialization to load and send recent history state to UI
  - _Requirements: 1.4, 3.1_

- [x] 5. Implement frontend recent history visual indicators


  - Add CSS classes for recent-history styling with subtle gray accent colors
  - Update bookmark list rendering in ui.html to apply recent-history class based on recentHistoryIds
  - Ensure current anchor styling takes precedence over recent history styling when both apply
  - Test that recent history styling is applied and removed correctly
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 6. Add recent history validation and cleanup


  - Create validateRecentHistory() function to check if recent history bookmarks still exist
  - Call validation on plugin startup and after bookmark operations
  - Implement logic to remove invalid bookmark IDs from recent history
  - Add recent history cleanup when bookmarks are deleted or become inaccessible
  - _Requirements: 3.2, 3.3, 3.4_

- [x] 7. Implement recent history clearing functionality


  - Add clearRecentHistory() function to reset recent history to empty array
  - Create UI control or command to trigger recent history clearing
  - Provide visual confirmation when recent history is cleared
  - Ensure current anchor state is preserved when clearing recent history
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 8. Test and refine recent history system



  - Create test scenarios for recent history rotation, navigation patterns, and edge cases
  - Verify recent history persists across plugin sessions and handles bookmark deletions
  - Test visual integration between current anchor and recent history indicators
  - Optimize performance and ensure smooth operation with existing current anchor system
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4_