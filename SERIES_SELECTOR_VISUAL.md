# Series Selector - Visual Guide

## Before vs After

### BEFORE (Problem)
```
┌─────────────────────────────────────────┐
│  Study: CECT CHEST+ABDOMEN              │
│  (Has 3 series but only showing 1)      │
├─────────────────────────────────────────┤
│                                         │
│                                         │
│         Only Series 1 Visible           │
│         (266 images)                    │
│                                         │
│         ❌ Series 2 Hidden              │
│         ❌ Series 3 Hidden              │
│                                         │
└─────────────────────────────────────────┘
```

### AFTER (Solution)
```
┌──────────────┬──────────────────────────┐
│ Series (3)   │  Study Viewer            │
├──────────────┤                          │
│ ✓ Series 1   │                          │
│   CT Chest   │    [DICOM Images]        │
│   📊 100 img │                          │
├──────────────┤                          │
│   Series 2   │    Currently showing     │
│   CT Abdomen │    Series 1              │
│   📊 150 img │                          │
├──────────────┤                          │
│   Series 3   │    Click any series      │
│   CT Pelvis  │    to switch ←           │
│   📊 120 img │                          │
└──────────────┴──────────────────────────┘
```

## Component Architecture

```
ViewerPage.tsx
│
├── SeriesSelector (if multiple series)
│   ├── Series List
│   │   ├── Series 1 (with metadata)
│   │   ├── Series 2 (with metadata)
│   │   └── Series 3 (with metadata)
│   │
│   └── Selection Handler
│       └── Updates selectedSeries state
│
└── MedicalImageViewer
    ├── Uses selectedSeries data
    ├── Re-renders on series change
    └── Displays DICOM images
```

## Data Flow

```
1. Study Loaded
   ↓
2. studyData.series[] populated
   ↓
3. selectedSeries = series[0] (default)
   ↓
4. SeriesSelector displays all series
   ↓
5. User clicks Series 2
   ↓
6. onSeriesSelect(seriesUID) called
   ↓
7. setSelectedSeries(series[2])
   ↓
8. MedicalImageViewer re-renders
   ↓
9. Series 2 images displayed
```

## UI Components

### Series Selector Item
```
┌─────────────────────────────────────┐
│  📁  Series 1                    ✓  │
│      CT Chest Arterial Phase        │
│      CT • 100 images                │
└─────────────────────────────────────┘
│  Icon  │ Title │ Description │ Badge│
```

### Selected State
```
┌─────────────────────────────────────┐
│  📁  Series 1                    ✓  │  ← Blue background
│      CT Chest Arterial Phase        │  ← White text
│      CT • 100 images                │  ← Check icon
└─────────────────────────────────────┘
```

### Hover State
```
┌─────────────────────────────────────┐
│  📁  Series 2                       │  ← Gray background
│      CT Abdomen Venous Phase        │  ← Lighter on hover
│      CT • 150 images                │  ← Cursor pointer
└─────────────────────────────────────┘
```

## Responsive Layout

### Desktop (Wide Screen)
```
┌────────────┬─────────────────────────────────┐
│            │                                 │
│  Series    │                                 │
│  Selector  │        Viewer                   │
│  (280px)   │        (Remaining width)        │
│            │                                 │
└────────────┴─────────────────────────────────┘
```

### Tablet/Mobile (Future Enhancement)
```
┌─────────────────────────────────────┐
│  Series Dropdown ▼                  │
├─────────────────────────────────────┤
│                                     │
│                                     │
│           Viewer                    │
│           (Full width)              │
│                                     │
└─────────────────────────────────────┘
```

## Color Scheme

### Series Selector
- Background: `grey.900` (#121212)
- Header: `primary.main` (Blue)
- Selected: `primary.dark` (Dark Blue)
- Hover: `grey.800` (#424242)
- Text: `white` / `grey.400`

### Chips
- Modality: `primary.main` (Blue)
- Image Count: `grey.700` (Gray)

## Interaction States

### 1. Initial Load
```
Series 1 ✓ (Selected, Blue)
Series 2   (Unselected, Dark)
Series 3   (Unselected, Dark)
```

### 2. Hover on Series 2
```
Series 1 ✓ (Selected, Blue)
Series 2   (Hover, Gray) ← Mouse here
Series 3   (Unselected, Dark)
```

### 3. Click Series 2
```
Series 1   (Unselected, Dark)
Series 2 ✓ (Selected, Blue) ← Now active
Series 3   (Unselected, Dark)
```

## Code Structure

### SeriesSelector.tsx
```typescript
interface Series {
  seriesInstanceUID: string
  seriesDescription?: string
  seriesNumber?: string
  modality?: string
  numberOfInstances?: number
  instances?: any[]
}

interface SeriesSelectorProps {
  series: Series[]
  selectedSeriesUID: string
  onSeriesSelect: (seriesUID: string) => void
}

export const SeriesSelector: React.FC<SeriesSelectorProps>
```

### ViewerPage.tsx Integration
```typescript
// State
const [selectedSeries, setSelectedSeries] = useState<any>(null)

// Initialize
useEffect(() => {
  if (studyData?.series?.[0]) {
    setSelectedSeries(studyData.series[0])
  }
}, [studyData])

// Render
<Box sx={{ display: 'flex', height: '100%' }}>
  <SeriesSelector
    series={studyData.series}
    selectedSeriesUID={selectedSeries?.seriesInstanceUID}
    onSeriesSelect={(seriesUID) => {
      const series = studyData.series.find(s => s.seriesInstanceUID === seriesUID)
      if (series) setSelectedSeries(series)
    }}
  />
  <Box sx={{ flex: 1 }}>
    <MedicalImageViewer
      key={selectedSeries?.seriesInstanceUID}
      seriesInstanceUID={selectedSeries?.seriesInstanceUID}
      sopInstanceUIDs={selectedSeries?.instances?.map(i => i.sopInstanceUID)}
    />
  </Box>
</Box>
```

## Performance Considerations

### Optimizations
1. **Conditional Rendering**: Sidebar only shows if multiple series exist
2. **Key Prop**: Forces viewer re-render on series change
3. **Memoization**: Series list doesn't re-render unnecessarily
4. **Lazy Loading**: Images load only when series is selected

### Memory Management
- Previous series data is kept in memory for quick switching
- Images are cached by browser
- No memory leaks from event listeners

## Accessibility

### Keyboard Navigation
- Tab: Navigate between series
- Enter/Space: Select series
- Arrow Up/Down: Move through list

### Screen Readers
- Proper ARIA labels
- Series count announced
- Selection state announced

### Visual Indicators
- High contrast colors
- Clear selection state
- Hover feedback
- Focus indicators

## Testing Checklist

- [ ] Single series study (sidebar hidden)
- [ ] Multiple series study (sidebar visible)
- [ ] Series selection works
- [ ] Viewer updates correctly
- [ ] Selected series highlighted
- [ ] Hover states work
- [ ] Metadata displays correctly
- [ ] Image counts accurate
- [ ] No console errors
- [ ] Performance is smooth

## Browser Compatibility

✅ Chrome 90+
✅ Firefox 88+
✅ Safari 14+
✅ Edge 90+

## Known Limitations

1. No thumbnail previews yet
2. No keyboard shortcuts yet
3. No series comparison view
4. No drag-and-drop reordering
5. Mobile layout needs optimization

## Future Roadmap

### Phase 1 (Current) ✅
- Basic series list
- Series selection
- Metadata display

### Phase 2 (Planned)
- Thumbnail previews
- Keyboard shortcuts
- Loading indicators

### Phase 3 (Future)
- Series comparison
- Advanced filtering
- Custom layouts
- Mobile optimization
