# Requirements Document

## Introduction

Add emoji positioning preference to Stratus Hue - let users choose beginning or end placement for layer/page titles.

## Requirements

### Requirement 1: Layer Emoji Positioning

**User Story:** As a designer, I want to choose emoji position in layer titles for consistent naming.

#### Acceptance Criteria
1. Settings show "Beginning", "End", and "Both" options
2. Beginning: "🟥 Layer Name" 
3. End: "Layer Name 🟥"
4. Both: "🟥 Layer Name 🟥"
5. Setting persists for future use

### Requirement 2: Page Emoji Positioning  

**User Story:** As a designer, I want to choose emoji position in page titles.

#### Acceptance Criteria
1. Same Beginning/End/Both options for pages
2. Beginning: "🔴 Page Name"
3. End: "Page Name 🔴"
4. Both: "🔴 Page Name 🔴"
5. Separate from layer setting

### Requirement 3: Handle Existing Content

**User Story:** As a designer, I want positioning to work with my existing titles.

#### Acceptance Criteria
1. Preserve existing text content
2. Replace existing emojis instead of duplicating
3. Maintain proper spacing
4. For "Both" mode, use same emoji at beginning and end
5. For canonical page format "↳ [emoji] [MM.DD] : Title", treat the emoji position within that structure

