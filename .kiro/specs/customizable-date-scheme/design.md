# Design Document

## Overview

The customizable date scheme feature extends the existing date tagging functionality by allowing users to select from predefined date formats instead of being locked to the current "MM.DD" format. This enhancement maintains backward compatibility while providing flexibility for different organizational preferences and international date conventions.

The feature integrates seamlessly with the existing canonical page title structure "↳ [emoji] [date] : Title" and layer date tagging functionality, preserving all current behaviors while adding user choice in date representation.

## Architecture

### State Management Extension

The feature extends the existing state management system in `src/core/state.ts` by adding a new date format preference that persists across plugin sessions using Figma's `clientStorage` API.

```typescript
interface DateFormatState {
  selectedFormat: string;
  lastUpdated: number;
}
```

### Date Format System

A new date formatting system will be implemented in `src/utils.ts` that:
- Maintains the existing `getTodayDateToken()` function as the primary interface
- Adds internal format selection logic based on user preference
- Provides format validation and fallback mechanisms
- Ensures consistent date generation across all plugin features

### UI Integration

The date format selection will be integrated into the existing settings overlay, leveraging the current settings infrastructure without requiring major UI restructuring.

## Components and Interfaces

### Core Components

#### 1. Date Format Manager (`src/core/date-formats.ts`)
```typescript
interface DateFormat {
  id: string;
  label: string;
  pattern: string;
  example: string;
  formatter: (date: Date) => string;
}

class DateFormatManager {
  static getAvailableFormats(): DateFormat[]
  static getSelectedFormat(): DateFormat
  static setSelectedFormat(formatId: string): Promise<void>
  static formatDate(date: Date, formatId?: string): string
}
```

#### 2. Settings UI Extension (`src/ui.ts`)
- Add date format selection section to existing settings overlay
- Implement format preview functionality
- Handle user selection and persistence

#### 3. State Management Extension (`src/core/state.ts`)
```typescript
export let dateFormatState: DateFormatState = {
  selectedFormat: 'MM.DD',
  lastUpdated: 0
};

export async function loadDateFormatState(): Promise<void>
export async function saveDateFormatState(): Promise<void>
export function setDateFormat(formatId: string): void
```

### Interface Updates

#### Modified Functions
- `getTodayDateToken()`: Enhanced to use selected format
- `parsePageTitleParts()`: Updated to handle various date patterns
- `addOrReplaceDateInLayerName()`: Uses new date formatting
- `addOrReplaceDateInPageTitle()`: Uses new date formatting

## Data Models

### Date Format Definition
```typescript
interface DateFormat {
  id: string;           // Unique identifier (e.g., 'MM.DD', 'DD.MM.YY')
  label: string;        // Display name (e.g., 'US Format (MM.DD)')
  pattern: string;      // Regex pattern for parsing existing dates
  example: string;      // Example output for preview
  formatter: (date: Date) => string; // Function to generate formatted date
}
```

### Predefined Formats
```typescript
const PREDEFINED_FORMATS: DateFormat[] = [
  {
    id: 'MM.DD',
    label: 'US Format (MM.DD)',
    pattern: '\\d{2}\\.\\d{2}',
    example: '03.15',
    formatter: (date) => `${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}`
  },
  {
    id: 'MM.DD.YY',
    label: 'US Format with Year (MM.DD.YY)',
    pattern: '\\d{2}\\.\\d{2}\\.\\d{2}',
    example: '03.15.24',
    formatter: (date) => `${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}.${date.getFullYear().toString().slice(-2)}`
  },
  {
    id: 'DD.MM',
    label: 'European Format (DD.MM)',
    pattern: '\\d{2}\\.\\d{2}',
    example: '15.03',
    formatter: (date) => `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`
  },
  {
    id: 'DD.MM.YY',
    label: 'European Format with Year (DD.MM.YY)',
    pattern: '\\d{2}\\.\\d{2}\\.\\d{2}',
    example: '15.03.24',
    formatter: (date) => `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear().toString().slice(-2)}`
  },
  {
    id: 'YYYY-MM-DD',
    label: 'ISO Format (YYYY-MM-DD)',
    pattern: '\\d{4}-\\d{2}-\\d{2}',
    example: '2024-03-15',
    formatter: (date) => `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
  },
  {
    id: 'MM/DD',
    label: 'US Slash Format (MM/DD)',
    pattern: '\\d{2}/\\d{2}',
    example: '03/15',
    formatter: (date) => `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`
  },
  {
    id: 'DD/MM',
    label: 'European Slash Format (DD/MM)',
    pattern: '\\d{2}/\\d{2}',
    example: '15/03',
    formatter: (date) => `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`
  }
];
```

### State Persistence
```typescript
interface DateFormatState {
  selectedFormat: string;  // Format ID from predefined formats
  lastUpdated: number;     // Timestamp of last change
}
```

## Error Handling

### Format Validation
- Validate format IDs against predefined list
- Fallback to default 'MM.DD' format for invalid selections
- Handle corrupted state data gracefully

### Parsing Compatibility
- Enhanced `parsePageTitleParts()` to handle multiple date patterns
- Graceful degradation when encountering unrecognized date formats
- Preserve existing functionality for legacy date formats

### State Recovery
- Automatic fallback to default format if state loading fails
- Validation of loaded state data before application
- Error logging for debugging without breaking functionality

## Testing Strategy

### Unit Tests
- Date format generation for all predefined formats
- State persistence and loading functionality
- Format validation and fallback mechanisms
- Parsing compatibility with existing and new date formats

### Integration Tests
- End-to-end date tagging workflow with custom formats
- Settings UI interaction and persistence
- Compatibility with existing page title and layer naming functions
- Cross-session persistence verification

### User Acceptance Tests
- Format selection and preview functionality
- Seamless integration with existing date tagging features
- Backward compatibility with existing page titles and layer names
- Performance impact assessment

### Edge Case Testing
- Invalid format selection handling
- Corrupted state data recovery
- Date parsing with mixed format documents
- Year rollover behavior for year-inclusive formats

## Implementation Considerations

### Backward Compatibility
- Existing page titles and layer names remain unchanged until manually updated
- Default format maintains current "MM.DD" behavior
- No breaking changes to existing API surface

### Performance
- Minimal impact on plugin startup time
- Efficient format lookup and caching
- Lazy loading of format definitions

### Internationalization
- Format examples use consistent sample date (March 15, 2024)
- Clear labeling of regional format conventions
- Extensible design for future format additions

### User Experience
- Immediate preview of selected format
- Clear format descriptions and examples
- Seamless integration with existing workflow
- Persistent preferences across sessions