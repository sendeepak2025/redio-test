# Quick Fix Guide - Series Selector Not Showing

## Problem
Study `1.2.840.113619.2.482.3.2831195393.851.1709524269.885` has 3 series but sidebar not appearing.

## Root Cause
Backend API was returning hardcoded single series instead of fetching actual series from Orthanc.

## Solution Applied ✅

### Changed File: `server/src/controllers/studyController.js`

**Before:**
```javascript
// Always returned 1 series
series: [{ seriesInstanceUID: `${studyUid}.1`, seriesNumber: 1 }]
```

**After:**
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

## How to Test

### 1. Restart Server
```bash
cd server
npm start
```

### 2. Check Server Logs
Look for:
```
✅ Loaded 3 series from Orthanc for study 1.2.840.113619...
```

### 3. Test in Browser
```
http://localhost:3000/viewer/1.2.840.113619.2.482.3.2831195393.851.1709524269.885
```

**Expected Result:**
```
┌──────────────┬──────────────────┐
│ Series (3)   │  Viewer          │
│              │                  │
│ ✓ Series 1   │  [Images]        │
│   Series 2   │                  │
│   Series 3   │                  │
└──────────────┴──────────────────┘
```

### 4. Test API Directly
```bash
curl http://localhost:5000/api/dicom/studies/1.2.840.113619.2.482.3.2831195393.851.1709524269.885/metadata
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "numberOfSeries": 3,
    "series": [...]
  }
}
```

## Verification Checklist

- [ ] Server restarted
- [ ] Orthanc is running (http://localhost:8042)
- [ ] API returns `numberOfSeries: 3`
- [ ] Browser shows sidebar with 3 series
- [ ] Can click and switch between series
- [ ] No console errors

## If Still Not Working

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Hard refresh** (Ctrl+F5)
3. **Check Orthanc is running:**
   ```bash
   curl http://localhost:8042/system
   ```
4. **Check server logs for errors**
5. **Check browser console (F12) for errors**

## Files Modified

1. ✅ `server/src/controllers/studyController.js` - Backend fix
2. ✅ `viewer/src/components/viewer/SeriesSelector.tsx` - New component
3. ✅ `viewer/src/pages/viewer/ViewerPage.tsx` - Integration

## Success Indicators

✅ Server log: "Loaded 3 series from Orthanc"
✅ API: `numberOfSeries: 3`
✅ UI: Sidebar visible with 3 series
✅ Functionality: Can switch between series

---

**Status:** Fix Applied ✅
**Next Step:** Restart server and test!
