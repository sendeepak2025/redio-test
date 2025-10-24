# Series Selector Debugging Guide

## Problem: Series Sidebar Not Showing

### Study UID: `1.2.840.113619.2.482.3.2831195393.851.1709524269.885`
This study should have **3 series** but sidebar is not appearing.

## Root Cause Found ✅

The `getStudyMetadata` API endpoint was returning hardcoded single series data instead of fetching actual series from Orthanc.

### Before (Bug):
```javascript
series: [
  {
    seriesInstanceUID: `${studyUid}.1`,
    seriesNumber: 1,
    // Only 1 series hardcoded!
  }
]
```

### After (Fixed):
```javascript
// Now fetches actual series from Orthanc
const orthancStudy = await orthancViewerService.getStudyComplete(inst.orthancStudyId);
seriesData = orthancStudy.seriesDetails.map(series => ({
  seriesInstanceUID: series.seriesInstanceUID,
  seriesNumber: series.seriesNumber,
  seriesDescription: series.seriesDescription,
  modality: series.modality,
  numberOfInstances: series.instancesCount,
  instances: series.instances.map(...)
}));
```

## How to Test the Fix

### Step 1: Restart the Server
```bash
cd server
npm start
# or
node src/server.js
```

### Step 2: Check Server Logs
Look for this message when loading a study:
```
✅ Loaded 3 series from Orthanc for study 1.2.840.113619.2.482.3.2831195393.851.1709524269.885
```

If you see this, the fix is working!

### Step 3: Test the API Directly

#### Using curl:
```bash
curl http://localhost:5000/api/dicom/studies/1.2.840.113619.2.482.3.2831195393.851.1709524269.885/metadata
```

#### Using the test script:
```bash
node test-series-api.js
```

#### Expected Response:
```json
{
  "success": true,
  "data": {
    "studyInstanceUID": "1.2.840.113619.2.482.3.2831195393.851.1709524269.885",
    "numberOfSeries": 3,
    "series": [
      {
        "seriesInstanceUID": "...",
        "seriesNumber": "1",
        "seriesDescription": "CT Chest",
        "modality": "CT",
        "numberOfInstances": 100
      },
      {
        "seriesInstanceUID": "...",
        "seriesNumber": "2",
        "seriesDescription": "CT Abdomen",
        "modality": "CT",
        "numberOfInstances": 150
      },
      {
        "seriesInstanceUID": "...",
        "seriesNumber": "3",
        "seriesDescription": "CT Pelvis",
        "modality": "CT",
        "numberOfInstances": 120
      }
    ]
  }
}
```

### Step 4: Test in Browser

1. Open the viewer: `http://localhost:3000/viewer/1.2.840.113619.2.482.3.2831195393.851.1709524269.885`
2. Open browser console (F12)
3. Check for logs:
   ```
   Loading study data for: 1.2.840.113619.2.482.3.2831195393.851.1709524269.885
   Study data loaded successfully: { numberOfSeries: 3, series: [...] }
   ```
4. Verify sidebar appears on the left with 3 series listed

## Debugging Checklist

### ✅ Backend (Server)

- [ ] Server is running on port 5000
- [ ] Orthanc is running and accessible
- [ ] Study exists in database
- [ ] Instance has `orthancStudyId` field populated
- [ ] API endpoint returns multiple series
- [ ] No errors in server console

### ✅ Frontend (Viewer)

- [ ] Viewer page loads without errors
- [ ] Study data is fetched successfully
- [ ] `studyData.series` is an array with length > 1
- [ ] `SeriesSelector` component is rendered
- [ ] No errors in browser console

## Common Issues & Solutions

### Issue 1: Sidebar Still Not Showing
**Check:** Browser console for `studyData.series`
```javascript
// In browser console:
console.log(studyData.series)
```

**Expected:** Array with multiple series
**If single series:** Backend fix didn't work, check server logs

### Issue 2: API Returns Single Series
**Check:** Server logs for Orthanc connection errors
```
⚠️ Could not fetch series from Orthanc, using fallback
```

**Solution:** 
1. Verify Orthanc is running: `http://localhost:8042`
2. Check Orthanc credentials in `.env`
3. Verify study exists in Orthanc

### Issue 3: orthancStudyId is null
**Check:** Database instance record
```javascript
// In MongoDB
db.instances.findOne({ studyInstanceUID: "1.2.840.113619..." })
```

**Solution:** Re-upload the study to populate Orthanc IDs

### Issue 4: Series Data is Empty
**Check:** Orthanc study structure
```bash
curl http://localhost:8042/studies/{orthancStudyId}
```

**Expected:** JSON with `Series` array
**Solution:** Verify DICOM files were uploaded correctly

## Verification Steps

### 1. Check Database
```javascript
// MongoDB query
db.studies.findOne({ 
  studyInstanceUID: "1.2.840.113619.2.482.3.2831195393.851.1709524269.885" 
})

db.instances.findOne({ 
  studyInstanceUID: "1.2.840.113619.2.482.3.2831195393.851.1709524269.885" 
})
```

### 2. Check Orthanc
```bash
# List all studies
curl http://localhost:8042/studies

# Get specific study
curl http://localhost:8042/studies/{orthancStudyId}

# Get series details
curl http://localhost:8042/series/{seriesId}
```

### 3. Check API Response
```bash
# Get study metadata
curl http://localhost:5000/api/dicom/studies/1.2.840.113619.2.482.3.2831195393.851.1709524269.885/metadata

# Should return:
# {
#   "success": true,
#   "data": {
#     "numberOfSeries": 3,
#     "series": [...]
#   }
# }
```

### 4. Check Frontend State
```javascript
// In browser console (on viewer page)
// Check if study data has multiple series
console.log('Study data:', studyData)
console.log('Number of series:', studyData?.series?.length)
console.log('Selected series:', selectedSeries)
```

## Expected Behavior After Fix

### When Study Has 1 Series:
- ✅ No sidebar appears
- ✅ Viewer shows the single series
- ✅ Full width viewer

### When Study Has Multiple Series:
- ✅ Sidebar appears on left (280px wide)
- ✅ All series listed with metadata
- ✅ First series selected by default
- ✅ Click any series to switch
- ✅ Selected series highlighted in blue
- ✅ Viewer updates to show selected series

## Files Modified

1. **server/src/controllers/studyController.js**
   - Updated `getStudyMetadata()` function
   - Now fetches actual series from Orthanc
   - Falls back to single series if Orthanc unavailable

2. **viewer/src/components/viewer/SeriesSelector.tsx**
   - New component for series list
   - Shows only when multiple series exist

3. **viewer/src/pages/viewer/ViewerPage.tsx**
   - Integrated SeriesSelector
   - Added series switching logic

## Testing Commands

```bash
# 1. Restart server
cd server
npm start

# 2. In another terminal, test API
curl http://localhost:5000/api/dicom/studies/1.2.840.113619.2.482.3.2831195393.851.1709524269.885/metadata | json_pp

# 3. Start frontend
cd viewer
npm start

# 4. Open browser
# http://localhost:3000/viewer/1.2.840.113619.2.482.3.2831195393.851.1709524269.885
```

## Success Indicators

✅ Server log shows: "Loaded X series from Orthanc"
✅ API returns `numberOfSeries > 1`
✅ Browser console shows study with multiple series
✅ Sidebar appears in viewer
✅ All series are clickable
✅ Viewer switches between series smoothly

## If Still Not Working

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Hard refresh** (Ctrl+F5)
3. **Check all services are running:**
   - MongoDB: `mongod`
   - Orthanc: `http://localhost:8042`
   - Backend: `http://localhost:5000`
   - Frontend: `http://localhost:3000`
4. **Check environment variables** in `server/.env`
5. **Re-upload the study** to ensure proper Orthanc integration

## Contact/Support

If issue persists:
1. Share server logs
2. Share browser console output
3. Share API response
4. Share Orthanc study structure

---

**Last Updated:** 2024
**Status:** Fix Applied - Needs Testing
