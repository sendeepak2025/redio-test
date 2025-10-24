# Frontend Debugging Guide - Series Selector Not Showing

## Problem
API returns 3 series correctly but sidebar not appearing in viewer.

## API Response (Correct ✅)
```json
{
  "numberOfSeries": 3,
  "numberOfInstances": 266,
  "series": [
    { "seriesNumber": "1", "numberOfInstances": 2, "seriesDescription": "SCOUT" },
    { "seriesNumber": "2", "numberOfInstances": 132, "seriesDescription": "Pre Contrast Chest" },
    { "seriesNumber": "3", "numberOfInstances": 132, "seriesDescription": "lung" }
  ]
}
```

## Debug Steps

### Step 1: Open Browser Console
1. Open viewer page:
   ```
   http://localhost:3000/viewer/1.2.840.113619.2.482.3.2831195393.851.1709524269.885
   ```

2. Press **F12** to open DevTools
3. Go to **Console** tab

### Step 2: Check Study Data
In console, type:
```javascript
// Check if studyData is loaded
console.log('Study Data:', studyData)

// Check series count
console.log('Number of Series:', studyData?.series?.length)

// Check each series
studyData?.series?.forEach((s, i) => {
  console.log(`Series ${i+1}:`, s.seriesNumber, s.seriesDescription, s.numberOfInstances, 'images')
})
```

**Expected Output:**
```
Study Data: { numberOfSeries: 3, series: [...] }
Number of Series: 3
Series 1: 1 SCOUT 2 images
Series 2: 2 Pre Contrast Chest 132 images
Series 3: 3 lung 132 images
```

### Step 3: Check SeriesSelector Rendering
```javascript
// Check if SeriesSelector should render
const shouldShowSelector = studyData?.series && studyData.series.length > 1
console.log('Should show series selector:', shouldShowSelector)

// Check selected series
console.log('Selected Series:', selectedSeries)
```

**Expected:**
```
Should show series selector: true
Selected Series: { seriesNumber: "1", ... }
```

### Step 4: Check React Components
In React DevTools:
1. Click **Components** tab
2. Find `ViewerPage` component
3. Check props and state:
   - `studyData.series` should be array with 3 items
   - `selectedSeries` should be set
   - `SeriesSelector` component should be rendered

### Step 5: Check for Errors
Look for any errors in console:
- Red error messages
- Failed network requests
- React warnings

## Common Issues & Solutions

### Issue 1: studyData.series is undefined
**Symptom:** Console shows `studyData.series: undefined`

**Solution:**
```bash
# Clear browser cache
Ctrl+Shift+Delete

# Hard refresh
Ctrl+F5

# Restart frontend
cd viewer
npm start
```

### Issue 2: studyData.series.length is 1
**Symptom:** Console shows only 1 series despite API returning 3

**Solution:**
```bash
# Backend might be caching old data
# Restart backend server
cd server
npm start
```

### Issue 3: SeriesSelector component not rendering
**Symptom:** Component tree doesn't show SeriesSelector

**Check:**
1. Is the condition `studyData.series.length > 1` true?
2. Is there a React error preventing render?
3. Check browser console for errors

**Solution:**
```bash
# Rebuild frontend
cd viewer
npm run build
npm start
```

### Issue 4: CSS/Styling Issue
**Symptom:** SeriesSelector exists but not visible

**Check in DevTools:**
1. Elements tab
2. Search for "Series ("
3. Check if element exists but hidden (display: none, opacity: 0, etc.)

**Solution:**
```javascript
// In console, force show if hidden
document.querySelector('[class*="SeriesSelector"]').style.display = 'block'
```

## Manual Test in Console

Paste this in browser console to test:
```javascript
// Test data
const testStudyData = {
  numberOfSeries: 3,
  series: [
    { seriesInstanceUID: "1", seriesNumber: "1", seriesDescription: "SCOUT", numberOfInstances: 2 },
    { seriesInstanceUID: "2", seriesNumber: "2", seriesDescription: "Pre Contrast", numberOfInstances: 132 },
    { seriesInstanceUID: "3", seriesNumber: "3", seriesDescription: "lung", numberOfInstances: 132 }
  ]
}

// Check condition
console.log('Has multiple series:', testStudyData.series && testStudyData.series.length > 1)
// Should print: true

// Check if SeriesSelector would render
console.log('Series count:', testStudyData.series.length)
// Should print: 3
```

## Network Tab Check

1. Open **Network** tab in DevTools
2. Refresh page
3. Find request to `/api/dicom/studies/.../metadata`
4. Click on it
5. Check **Response** tab

**Should see:**
```json
{
  "success": true,
  "data": {
    "numberOfSeries": 3,
    "series": [...]
  }
}
```

If response shows `numberOfSeries: 1`, then backend issue.
If response shows `numberOfSeries: 3`, then frontend issue.

## Force Render Test

Try this in console to force render SeriesSelector:
```javascript
// Get React root
const root = document.getElementById('root')

// Check if SeriesSelector component exists
const selector = document.querySelector('[class*="MuiPaper"]')
console.log('Found selector:', selector)

// If not found, check React component tree
// Use React DevTools to inspect ViewerPage component
```

## Check ViewerPage.tsx Code

The condition for showing SeriesSelector is:
```typescript
{studyData.series && studyData.series.length > 1 && (
  <SeriesSelector
    series={studyData.series}
    selectedSeriesUID={selectedSeries?.seriesInstanceUID}
    onSeriesSelect={...}
  />
)}
```

**Debug this:**
```javascript
// In console
console.log('studyData.series exists:', !!studyData?.series)
console.log('studyData.series.length:', studyData?.series?.length)
console.log('Condition result:', studyData?.series && studyData.series.length > 1)
```

## Quick Fix Commands

```bash
# 1. Clear everything and restart
cd viewer
rm -rf node_modules/.cache
npm start

# 2. Check if SeriesSelector file exists
ls -la src/components/viewer/SeriesSelector.tsx

# 3. Check for TypeScript errors
npm run type-check

# 4. Check for build errors
npm run build
```

## Expected Behavior

When everything works:
1. Page loads
2. API call to `/metadata` returns 3 series
3. `studyData` state updates with 3 series
4. `selectedSeries` state set to first series
5. Condition `series.length > 1` evaluates to `true`
6. `SeriesSelector` component renders
7. Sidebar appears on left showing 3 series

## If Still Not Working

1. **Take screenshot** of:
   - Browser console
   - Network tab (metadata response)
   - React DevTools (ViewerPage state)

2. **Check these values:**
   ```javascript
   console.log({
     studyDataExists: !!studyData,
     seriesExists: !!studyData?.series,
     seriesLength: studyData?.series?.length,
     seriesArray: studyData?.series,
     selectedSeries: selectedSeries,
     shouldShowSelector: studyData?.series && studyData.series.length > 1
   })
   ```

3. **Verify files exist:**
   ```bash
   ls viewer/src/components/viewer/SeriesSelector.tsx
   ls viewer/src/pages/viewer/ViewerPage.tsx
   ```

4. **Check imports:**
   ```bash
   grep "SeriesSelector" viewer/src/pages/viewer/ViewerPage.tsx
   ```

---

**Status:** Debugging Guide Ready
**Next Step:** Open browser console and run debug commands
