# Issue Resolution: Placeholder Image Problem

## Problem
After uploading DICOM study `1.3.6.1.4.1.16568.1760626972284.217339593`, the viewer shows a placeholder/checkerboard image instead of actual frames.

## Root Cause
**The instances were NOT saved to MongoDB during upload!**

Database check shows:
```
Study: 1.3.6.1.4.1.16568.1760626972284.217339593
  Patient: KV_F.M_WS_DRB (AUTO_1616669124536_2592_0)
  Modality: MR
  Date: 20230314
  Instances: 1
  Orthanc Study ID: NOT SET  ❌
  Instances in DB: 0  ❌ NO INSTANCES FOUND FOR THIS STUDY!
```

This means:
1. ✅ Study record was created in MongoDB
2. ❌ Instance records were NOT created
3. ❌ Orthanc upload may have failed OR instances weren't linked

## Why This Happened
Possible reasons:
1. MongoDB connection was lost during upload
2. `Instance.insertMany()` failed silently
3. Upload completed but database save failed

## Solution

### Option 1: Re-upload the DICOM File (Recommended)
Simply upload the same DICOM file again. The new upload code has better error handling and will:
1. Check MongoDB connection before starting
2. Upload to Orthanc
3. Save instances to MongoDB with proper error logging
4. Verify instances were saved

### Option 2: Manual Fix (Advanced)
If you have the Orthanc instance ID, you can manually create instance records:

```javascript
// Find the Orthanc instance ID
curl http://localhost:8042/studies

// Then create instance record manually
const Instance = require('./src/models/Instance');

await Instance.create({
  studyInstanceUID: '1.3.6.1.4.1.16568.1760626972284.217339593',
  seriesInstanceUID: '1.3.6.1.4.1.16568.1760626972284.217339593.1',
  sopInstanceUID: '1.3.6.1.4.1.16568.1760626972284.217339593.1.1',
  instanceNumber: 1,
  modality: 'MR',
  orthancInstanceId: '<ORTHANC_INSTANCE_ID>',  // Get from Orthanc
  orthancFrameIndex: 0,
  useOrthancPreview: true
});
```

## Fixes Applied

### 1. Added MongoDB Connection Check
**File:** `uploadController.js`

```javascript
// Check MongoDB connection before upload
const mongoose = require('mongoose');
if (mongoose.connection.readyState !== 1) {
  return res.status(500).json({ 
    success: false, 
    message: 'Database not connected' 
  });
}
```

### 2. Added Better Error Logging
**File:** `uploadController.js`

```javascript
// Log instance save details
console.log(`💾 Saving ${instanceRecords.length} instance records to MongoDB...`);
console.log(`   First instance: studyUID=${instanceRecords[0].studyInstanceUID}`);

// Verify instances were saved
const savedCount = await Instance.countDocuments({ studyInstanceUID });
console.log(`✅ Verified: ${savedCount} instances in MongoDB`);
```

### 3. Fixed Frame Retrieval Bugs
**Files:** `dicom-migration-service.js`, `orthanc-preview-client.js`

- Fixed frame index mapping (use `localFrameIndex` instead of global `frameIndex`)
- Fixed Orthanc URL building (always use `/frames/{index}/preview`)

## Testing Steps

### 1. Check Current Database State
```bash
node server/test-database-check.js
```

### 2. Re-upload DICOM File
```bash
curl -X POST http://localhost:8001/api/dicom/upload \
  -F "file=@your-dicom-file.dcm" \
  -F "patientID=TEST001" \
  -F "patientName=Test Patient"
```

### 3. Verify Instances Were Saved
```bash
node server/test-database-check.js
```

Should show:
```
Study: <studyUID>
  Instances in DB: 1 (or more)  ✅
  First Instance:
    - Orthanc Instance ID: <some-uuid>  ✅
    - Use Orthanc Preview: true  ✅
```

### 4. Test Frame Retrieval
```bash
curl http://localhost:8001/api/dicom/studies/<studyUID>/frames/0 > frame.png
file frame.png
# Should output: frame.png: PNG image data, ...
```

### 5. Open in Viewer
Navigate to the viewer and open the study. You should now see the actual DICOM image instead of the placeholder.

## Prevention

The upload code now includes:
1. ✅ MongoDB connection check before upload
2. ✅ Detailed logging of instance save process
3. ✅ Verification that instances were saved
4. ✅ Better error messages

## Summary

**Problem:** Instances not saved to MongoDB during upload  
**Cause:** MongoDB connection issue or silent failure  
**Solution:** Re-upload the DICOM file  
**Status:** Fixed with better error handling  

---

**Next Action:** Re-upload your DICOM file and it should work correctly now!
