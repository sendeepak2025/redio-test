# Series Selector Implementation

## Problem
When a study has multiple series (e.g., "CECT CHEST+ABDOMEN" with 3 series), only the first series was being displayed in the viewer. Users couldn't view or switch between different series within the same study.

## Solution
Implemented a **Series Selector** sidebar that displays all series in a study and allows users to switch between them.

## Changes Made

### 1. New Component: `SeriesSelector.tsx`
**Location:** `viewer/src/components/viewer/SeriesSelector.tsx`

**Features:**
- Displays all series in a vertical sidebar
- Shows series number, description, modality, and image count
- Highlights the currently selected series
- Only appears when a study has multiple series (hidden for single-series studies)
- Clean, professional UI with Material-UI components

**Props:**
```typescript
interface SeriesSelectorProps {
  series: Series[]              // Array of all series in the study
  selectedSeriesUID: string     // Currently selected series UID
  onSeriesSelect: (seriesUID: string) => void  // Callback when series is selected
}
```

### 2. Updated: `ViewerPage.tsx`
**Location:** `viewer/src/pages/viewer/ViewerPage.tsx`

**Changes:**
- Added import for `SeriesSelector` component
- Added `selectedSeries` state to track the currently selected series
- Modified the viewer layout to include the series selector sidebar
- Updated all viewer components to use `selectedSeries` instead of hardcoded `series[0]`
- Added `key` prop to `MedicalImageViewer` to force re-render when series changes

**Layout Structure:**
```
┌─────────────────────────────────────┐
│  Series Selector  │   Viewer        │
│  (if multiple)    │                 │
│                   │                 │
│  ┌─────────┐     │                 │
│  │ Series 1│     │                 │
│  │ Series 2│ ◄── │   Image Display │
│  │ Series 3│     │                 │
│  └─────────┘     │                 │
└─────────────────────────────────────┘
```

## How It Works

1. **Study Loading:** When a study is loaded, all series data is fetched from the backend
2. **Initial Selection:** The first series is automatically selected by default
3. **Series Display:** If multiple series exist, the SeriesSelector sidebar appears on the left
4. **Series Switching:** User clicks on any series in the sidebar
5. **Viewer Update:** The viewer re-renders with the selected series data

## User Experience

### Before:
- Only first series visible
- No way to access other series
- Users had to reload the page with different series UID

### After:
- All series visible in sidebar
- One-click switching between series
- Clear indication of which series is active
- Shows series metadata (description, modality, image count)

## Technical Details

### State Management
```typescript
const [selectedSeries, setSelectedSeries] = useState<any>(null)

// Initialize with first series
useEffect(() => {
  if (studyData?.series?.[0]) {
    setSelectedSeries(studyData.series[0])
  }
}, [studyData])
```

### Series Selection Handler
```typescript
onSeriesSelect={(seriesUID) => {
  const series = studyData.series.find((s: any) => s.seriesInstanceUID === seriesUID)
  if (series) {
    setSelectedSeries(series)
  }
}}
```

### Viewer Re-rendering
The `key` prop ensures the viewer component fully re-initializes when series changes:
```typescript
<MedicalImageViewer
  key={selectedSeries?.seriesInstanceUID}
  // ... other props
/>
```

## Testing

To test the implementation:

1. Load a study with multiple series (e.g., "CECT CHEST+ABDOMEN" with 3 series)
2. Verify the series selector appears on the left side
3. Click on different series in the sidebar
4. Confirm the viewer updates to show the selected series
5. Verify the selected series is highlighted in the sidebar

## Future Enhancements

Possible improvements:
- Add thumbnail previews for each series
- Show series loading progress
- Add keyboard shortcuts for series navigation (e.g., Ctrl+Up/Down)
- Add series comparison view (side-by-side)
- Cache loaded series for faster switching
- Add series filtering/search for studies with many series

## Files Modified

1. **Created:** `viewer/src/components/viewer/SeriesSelector.tsx` (new component)
2. **Modified:** `viewer/src/pages/viewer/ViewerPage.tsx` (integrated series selector)

## Dependencies

No new dependencies added. Uses existing Material-UI components.
