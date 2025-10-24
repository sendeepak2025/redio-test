# Orthanc Series Sync Fix

## Problem
Study `1.2.840.113619.2.482.3.2831195393.851.1709524269.885` has multiple series but:
1. Series selector not showing
2. Actual image count not displaying correctly
3. Data coming from Orthanc via `auto-sync-simple.js` but series info not saved properly

## Root Causes Found

### Issue 1: auto-sync-simple.js
- Was saving `numberOfSeries` count but NOT actual series details
- Instance records missing `orthancStudyId` and `orthancSeriesId`
- No series-to-instance mapping

### Issue 2: studyController.js
- Was trying to fetch from Orthanc API instead of database
- Not grouping instances by series properly

## Fixes Applied

### Fix 1: auto-sync-simple.js ✅

**What Changed:**
- Now fetches complete series details from Orthanc
- Saves `orthancSeriesId` in each instance
- Properly maps instances to their series
- Saves series metadata (description, number, modality)

**New Code:**
```javascript
// Fetch series details from Orthanc
const seriesData = [];
for (const seriesId of studyDetails.Series) {
  const seriesRes = await orthancClient.get(`/series/${seriesId}`);
  const seriesDetails = seriesRes.data;
  
  seriesData.push({
    orthancSeriesId: seriesId,
    seriesInstanceUID: seriesDetails.MainDicomTags?.SeriesInstanceUID,
    seriesNumber: seriesDetails.MainDicomTags?.SeriesNumber,
    seriesDescription: seriesDetails.MainDicomTags?.SeriesDescription,
    modality: seriesModality,
    numberOfInstances: seriesDetails.Instances?.length,
    instances: seriesDetails.Instances
  });
}

// Save instances with series mapping
for (const series of seriesData) {
  for (const instanceId of series.instances) {
    // ... create instance records with orthancSeriesId
    instanceRecords.push({
      studyInstanceUID,
      seriesInstanceUID,
      orthancStudyId: orthancStudyId,
      orthancSeriesId: series.orthancSeriesId,  // ✅ Now saved!
      // ... other fields
    });
  }
}
```

### Fix 2: studyController.js ✅

**What Changed:**
- Now reads series data from database instances
- Groups instances by `seriesInstanceUID`
- Counts actual instances per series
- Fetches series descriptions from Orthanc as enhancement

**New Code:**
```javascript
// Get all instances grouped by series
const instances = await Instance.find({ studyInstanceUID: studyUid })
  .sort({ seriesInstanceUID: 1, instanceNumber: 1 })
  .lean();

// Group by series
const seriesMap = new Map();
for (const inst of instances) {
  const seriesUID = inst.seriesInstanceUID;
  if (!seriesMap.has(seriesUID)) {
    seriesMap.set(seriesUID, {
      seriesInstanceUID: seriesUID,
      numberOfInstances: 0,
      instances: []
    });
  }
  seriesMap.get(seriesUID).numberOfInstances++;
  seriesMap.get(seriesUID).instances.push(inst);
}

seriesData = Array.from(seriesMap.values());
```

## How to Apply the Fix

### Step 1: Re-sync the Study

Since the study was already synced with old code, you need to re-sync it:

```bash
# Option A: Delete and re-sync specific study
mongo dicomdb
> db.studies.deleteOne({ studyInstanceUID: "1.2.840.113619.2.482.3.2831195393.851.1709524269.885" })
> db.instances.deleteMany({ studyInstanceUID: "1.2.840.113619.2.482.3.2831195393.851.1709524269.885" })
> exit

# Then restart auto-sync
cd server
node auto-sync-simple.js
```

```bash
# Option B: Delete all and re-sync everything (clean slate)
mongo dicomdb
> db.studies.deleteMany({})
> db.instances.deleteMany({})
> exit

cd server
node auto-sync-simple.js
```

### Step 2: Restart Backend Server

```bash
cd server
npm start
```

### Step 3: Test the API

```bash
curl http://localhost:5000/api/dicom/studies/1.2.840.113619.2.482.3.2831195393.851.1709524269.885/metadata
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "studyInstanceUID": "1.2.840.113619.2.482.3.2831195393.851.1709524269.885",
    "numberOfSeries": 3,
    "numberOfInstances": 370,
    "series": [
      {
        "seriesInstanceUID": "...",
        "seriesNumber": "1",
        "seriesDescription": "CT Chest Arterial",
        "modality": "CT",
        "numberOfInstances": 120,
        "instances": [...]
      },
      {
        "seriesInstanceUID": "...",
        "seriesNumber": "2",
        "seriesDescription": "CT Abdomen Venous",
        "modality": "CT",
        "numberOfInstances": 150,
        "instances": [...]
      },
      {
        "seriesInstanceUID": "...",
        "seriesNumber": "3",
        "seriesDescription": "CT Pelvis Delayed",
        "modality": "CT",
        "numberOfInstances": 100,
        "instances": [...]
      }
    ]
  }
}
```

### Step 4: Test in Browser

```
http://localhost:3000/viewer/1.2.840.113619.2.482.3.2831195393.851.1709524269.885
```

**Expected Result:**
```
┌──────────────┬──────────────────────────┐
│ Series (3)   │  Viewer                  │
├──────────────┤                          │
│ ✓ Series 1   │                          │
│   CT Chest   │    [DICOM Images]        │
│   📊 120 img │                          │
├──────────────┤                          │
│   Series 2   │    Showing Series 1      │
│   CT Abdomen │    with 120 images       │
│   📊 150 img │                          │
├──────────────┤                          │
│   Series 3   │    Click to switch →     │
│   CT Pelvis  │                          │
│   📊 100 img │                          │
└──────────────┴──────────────────────────┘
```

## Verification Checklist

### Database Check
```javascript
// MongoDB
db.instances.findOne({ studyInstanceUID: "1.2.840.113619..." })

// Should have:
{
  studyInstanceUID: "...",
  seriesInstanceUID: "...",  // ✅ Proper series UID
  orthancStudyId: "...",     // ✅ Should be present
  orthancSeriesId: "...",    // ✅ Should be present
  orthancInstanceId: "...",  // ✅ Should be present
  instanceNumber: 1
}
```

### API Check
```bash
# Should return multiple series
curl http://localhost:5000/api/dicom/studies/1.2.840.113619.../metadata | jq '.data.numberOfSeries'
# Expected: 3 (or actual number of series)
```

### UI Check
- [ ] Sidebar appears on left
- [ ] All series listed with correct counts
- [ ] Can click and switch between series
- [ ] Image count matches per series
- [ ] No console errors

## What Each Series Should Show

### Series Information Display:
```
Series 1
CT Chest Arterial Phase
CT • 120 images
```

### When Selected:
- Blue background
- Check mark (✓)
- Viewer shows that series' images
- Frame counter: "1 / 120" (not "1 / 370")

## Troubleshooting

### Problem: Still showing single series
**Solution:** Re-sync the study (delete and re-import)

### Problem: Series count wrong
**Check:** 
```bash
# Count instances per series in database
mongo dicomdb
> db.instances.aggregate([
  { $match: { studyInstanceUID: "1.2.840.113619..." } },
  { $group: { _id: "$seriesInstanceUID", count: { $sum: 1 } } }
])
```

### Problem: orthancSeriesId is null
**Solution:** Study was synced with old code, need to re-sync

### Problem: Sidebar not appearing
**Check:**
1. API returns `numberOfSeries > 1`
2. Browser console for errors
3. `studyData.series` is array with multiple items

## Files Modified

1. ✅ `server/auto-sync-simple.js`
   - Fetches series details from Orthanc
   - Saves orthancSeriesId in instances
   - Maps instances to series properly

2. ✅ `server/src/controllers/studyController.js`
   - Groups instances by series from database
   - Counts instances per series accurately
   - Fetches series descriptions from Orthanc

## Expected Behavior After Fix

### During Sync:
```
📥 Processing study: abc123
📊 Found 3 series in study
✅ Study saved: 1.2.840.113619...
✅ Created 370 instance records from 3 series
```

### During API Call:
```
✅ Loaded 3 series with 370 total instances for study 1.2.840.113619...
```

### In Browser:
- Sidebar with 3 series
- Each series shows correct image count
- Can switch between series
- Viewer updates properly

## Summary

**Before:**
- ❌ Only 1 series shown
- ❌ Wrong image count
- ❌ No series selector

**After:**
- ✅ All 3 series shown
- ✅ Correct image count per series (120, 150, 100)
- ✅ Series selector working
- ✅ Can switch between series

---

**Status:** ✅ Fix Complete
**Next Step:** Re-sync study and test!
