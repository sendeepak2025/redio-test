# Series Selector Testing Guide

## Quick Test Steps

### Test 1: Single Series Study
**Expected:** Series selector should NOT appear

1. Open a study with only 1 series
2. Verify no sidebar appears on the left
3. Viewer should display the single series normally

**Result:** ✅ Pass / ❌ Fail

---

### Test 2: Multiple Series Study
**Expected:** Series selector SHOULD appear

1. Open a study with multiple series (e.g., "CECT CHEST+ABDOMEN" with 3 series)
2. Verify sidebar appears on the left side
3. Verify all series are listed
4. Verify first series is selected by default (blue background, check mark)

**Result:** ✅ Pass / ❌ Fail

---

### Test 3: Series Metadata Display
**Expected:** Each series shows correct information

For each series in the list, verify:
- [ ] Series number is displayed
- [ ] Series description is shown
- [ ] Modality badge is visible (CT, MRI, etc.)
- [ ] Image count is correct
- [ ] Icon is displayed

**Result:** ✅ Pass / ❌ Fail

---

### Test 4: Series Selection
**Expected:** Clicking a series switches the viewer

1. Click on Series 2 in the sidebar
2. Verify Series 2 becomes highlighted (blue background)
3. Verify Series 1 is no longer highlighted
4. Verify viewer updates to show Series 2 images
5. Verify image count matches Series 2

**Result:** ✅ Pass / ❌ Fail

---

### Test 5: Series Switching
**Expected:** Can switch between all series

1. Click Series 1 → Verify viewer shows Series 1
2. Click Series 2 → Verify viewer shows Series 2
3. Click Series 3 → Verify viewer shows Series 3
4. Click Series 1 again → Verify viewer shows Series 1

**Result:** ✅ Pass / ❌ Fail

---

### Test 6: Visual States
**Expected:** Proper hover and selection states

1. Hover over an unselected series
   - [ ] Background changes to gray
   - [ ] Cursor changes to pointer
2. Click the series
   - [ ] Background changes to blue
   - [ ] Check mark appears
3. Hover over selected series
   - [ ] Background stays blue
   - [ ] No visual glitches

**Result:** ✅ Pass / ❌ Fail

---

### Test 7: Viewer Re-rendering
**Expected:** Viewer properly updates on series change

1. Select Series 1, note the first image
2. Switch to Series 2
3. Verify:
   - [ ] Images are different from Series 1
   - [ ] Frame counter resets to 1
   - [ ] Total frame count updates
   - [ ] No loading errors

**Result:** ✅ Pass / ❌ Fail

---

### Test 8: Performance
**Expected:** Smooth switching with no lag

1. Rapidly click between different series
2. Verify:
   - [ ] No UI freezing
   - [ ] No console errors
   - [ ] Smooth transitions
   - [ ] Images load properly

**Result:** ✅ Pass / ❌ Fail

---

### Test 9: Error Handling
**Expected:** Graceful handling of edge cases

Test with:
- [ ] Study with no series data
- [ ] Series with 0 images
- [ ] Series with missing metadata
- [ ] Invalid series UID

**Result:** ✅ Pass / ❌ Fail

---

### Test 10: Browser Compatibility
**Expected:** Works in all major browsers

Test in:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

**Result:** ✅ Pass / ❌ Fail

---

## Console Checks

Open browser console (F12) and verify:
- [ ] No JavaScript errors
- [ ] No React warnings
- [ ] No network errors
- [ ] Proper API calls being made

## Network Checks

Open Network tab (F12) and verify:
- [ ] Series data is fetched correctly
- [ ] Image requests are made for selected series
- [ ] No 404 or 500 errors
- [ ] Reasonable load times

## Visual Inspection

Check the UI for:
- [ ] Proper alignment
- [ ] Correct colors
- [ ] Readable text
- [ ] No overlapping elements
- [ ] Responsive layout

## Sample Test Data

### Study with 3 Series
```json
{
  "studyInstanceUID": "1.2.840.113619.2.483.3.283195393.851.1709524269.885",
  "series": [
    {
      "seriesInstanceUID": "1.2.840.113619.2.483.3.283195393.851.1709524269.886",
      "seriesNumber": "1",
      "seriesDescription": "CT Chest Arterial",
      "modality": "CT",
      "numberOfInstances": 100
    },
    {
      "seriesInstanceUID": "1.2.840.113619.2.483.3.283195393.851.1709524269.887",
      "seriesNumber": "2",
      "seriesDescription": "CT Abdomen Venous",
      "modality": "CT",
      "numberOfInstances": 150
    },
    {
      "seriesInstanceUID": "1.2.840.113619.2.483.3.283195393.851.1709524269.888",
      "seriesNumber": "3",
      "seriesDescription": "CT Pelvis Delayed",
      "modality": "CT",
      "numberOfInstances": 120
    }
  ]
}
```

## Automated Testing (Future)

### Unit Tests
```typescript
describe('SeriesSelector', () => {
  it('should render all series', () => {})
  it('should highlight selected series', () => {})
  it('should call onSeriesSelect when clicked', () => {})
  it('should not render for single series', () => {})
})
```

### Integration Tests
```typescript
describe('ViewerPage with SeriesSelector', () => {
  it('should switch series on selection', () => {})
  it('should update viewer with new series data', () => {})
  it('should maintain state across series switches', () => {})
})
```

## Troubleshooting

### Series selector not appearing?
1. Check if study has multiple series
2. Verify `studyData.series` is an array with length > 1
3. Check browser console for errors

### Series not switching?
1. Verify `onSeriesSelect` callback is working
2. Check if `selectedSeries` state is updating
3. Verify viewer has `key` prop with series UID

### Images not loading?
1. Check Orthanc server is running
2. Verify series has instances
3. Check network tab for failed requests
4. Verify DICOM web URLs are correct

### UI looks broken?
1. Clear browser cache
2. Check Material-UI version
3. Verify CSS is loading
4. Check for conflicting styles

## Success Criteria

All tests should pass:
- ✅ Sidebar appears for multiple series
- ✅ Sidebar hidden for single series
- ✅ All series metadata displayed correctly
- ✅ Series selection works smoothly
- ✅ Viewer updates on series change
- ✅ No console errors
- ✅ Good performance
- ✅ Works in all browsers

## Reporting Issues

If any test fails, report with:
1. Test number that failed
2. Expected behavior
3. Actual behavior
4. Browser and version
5. Console errors (if any)
6. Screenshots (if applicable)

---

**Last Updated:** 2024
**Version:** 1.0
**Status:** Ready for Testing
