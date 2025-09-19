# Requirements Document

## Introduction

This feature enables users to customize the date format within the canonical page title slug. Currently, the plugin uses a fixed "MM.DD" format in the slug pattern "↳ [emoji] [MM.DD] : Title". This enhancement will allow users to choose from various date schemes (such as MM.DD.YY, DD.MM, YYYY-MM-DD, etc.) to match their personal or organizational preferences while maintaining the overall canonical structure.

## Requirements

### Requirement 1

**User Story:** As a Figma designer, I want to customize the date format in page title slugs, so that I can use a date scheme that matches my team's conventions or personal preferences.

#### Acceptance Criteria

1. WHEN the user accesses date scheme settings THEN the system SHALL display available date format options
2. WHEN the user selects a date format THEN the system SHALL persist this preference across plugin sessions
3. WHEN the user applies date tagging to a page THEN the system SHALL use the selected date format in the canonical slug
4. WHEN the user changes the date format preference THEN existing page titles SHALL remain unchanged until manually updated

### Requirement 2

**User Story:** As a Figma designer, I want to see a preview of how my selected date format will appear, so that I can make an informed choice before applying it.

#### Acceptance Criteria

1. WHEN the user hovers over or selects a date format option THEN the system SHALL display a preview using today's date
2. WHEN the user views date format options THEN the system SHALL show the format pattern alongside the preview
3. WHEN the user confirms a date format selection THEN the system SHALL show a confirmation with the selected format

### Requirement 3

**User Story:** As a Figma designer, I want access to commonly used date formats, so that I don't need to create custom formats for standard conventions.

#### Acceptance Criteria

1. WHEN the user views date format options THEN the system SHALL include at minimum: MM.DD, MM.DD.YY, DD.MM, DD.MM.YY, YYYY-MM-DD, MM/DD, DD/MM
2. WHEN the user selects any predefined format THEN the system SHALL apply it correctly to new date tags
3. IF a date format includes year information THEN the system SHALL use the current year when generating dates

### Requirement 4

**User Story:** As a Figma designer, I want the date scheme setting to integrate seamlessly with existing page title functionality, so that my workflow remains consistent.

#### Acceptance Criteria

1. WHEN the user uses the existing "Add today's date" feature THEN the system SHALL apply the selected date format
2. WHEN the user builds canonical page titles THEN the system SHALL maintain the structure "↳ [emoji] [date] : Title" with the custom date format
3. WHEN the user has no custom date format selected THEN the system SHALL default to the current MM.DD format
4. IF the user updates their date format preference THEN future date operations SHALL use the new format immediately

### Requirement 5

**User Story:** As a Figma designer, I want my date format preference to be saved persistently, so that I don't need to reconfigure it every time I use the plugin.

#### Acceptance Criteria

1. WHEN the user sets a date format preference THEN the system SHALL save it to plugin storage
2. WHEN the user reopens the plugin THEN the system SHALL load and apply the previously selected date format
3. WHEN the user works across multiple Figma files THEN the system SHALL maintain the same date format preference
4. IF no date format preference exists THEN the system SHALL use MM.DD as the default format