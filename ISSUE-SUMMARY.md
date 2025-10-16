# DICOM Viewer Checkered Pattern Issue - Complete Analysis

## Issue Description
The DICOM viewer displays a checkered placeholder pattern instead of actual medical images for study "Rubo DEMO (test)" - Study UID: `1.3.6.1.4.1.16568.1760629278470.775947117`.

## Root Cause
This is a **legacy study** that has incomplete data:
- ✅ Study record exists in MongoDB
- ❌ No Instance records in MongoDB (0 instances)
- ❌ Study not found in Orthanc PACS server
- ❌ Only placeholder frames were cached (96 files, all 4691 bytes)

## Why This Happened
1. The study was uploaded before the current MongoDB integration was complete
2. The DICOM file was either never uploaded to Orthanc, or Orthanc was reset/cleared
3. A bug in the frame cache service was caching placeholder images when it couldn't find the source data
4. Every time you viewed the study, it served the cached placeholders

## Code Bugs Fixed

### Bug 1: Caching Placeholders
**File:** `server/src/services/frame-cache-service.js`

The service was returning and caching placeholder images when it couldn't generate real frames:
```javascript
// BEFORE (BAD)
catch (error) {
  return this.generatePlaceholder(); // ❌ Returns placeholder
}

// AFTER (GOOD)  
catch (error) {
  console.warn(`Could not generate frame from Orthanc`);
  return null; // ✅ Returns null to trigger fallback
}
```

### Bug 2: Undefined Variable
**File:** `server/src/controllers/instanceController.js`

Referenced undefined variable `isMongoConnected`:
```javascript
// BEFORE (BAD)
if (!isMongoConnected) { // ❌ Undefined variable
  
// AFTER (GOOD)
const mongoose = require('mongoose');
if (mongoose.connection.readyState !== 1) { // ✅ Proper check
```

## Actions Taken

### 1. Code Fixes
- ✅ Fixed frame cache service to never cache placeholders
- ✅ Fixed undefined variable in instance controller
- ✅ Improved error handling and logging

### 2. Cache Cleanup
- ✅ Deleted 124 placeholder frames across 6 studies
- ✅ Removed 5 empty frame directories
- ✅ Kept 4 valid frames from other studies

### 3. Audit Performed
- ✅ Found 362 total studies in MongoDB
- ✅ Found 6 studies in Orthanc PACS
- ✅ Identified 30 studies that need re-uploading (no instances + not in Orthanc)

## Solution for This Study

**The study needs to be re-uploaded:**

1. Locate the original DICOM file for "Rubo DEMO (test)" study
2. Upload it through the web interface
3. The new upload will:
   - Store the DICOM in Orthanc PACS
   - Create proper Instance records in MongoDB
   - Generate real frames from the DICOM data
   - Cache the frames for fast access

## Prevention

The code fixes ensure this won't happen again:
- ✅ Placeholders are never cached to disk
- ✅ Proper fallback chain: Cache → Orthanc → Legacy filesystem → Placeholder (in-memory only)
- ✅ Clear error messages in logs
- ✅ Proper MongoDB connection checks

## Utility Scripts Created

For future troubleshooting:

1. **audit-studies.js** - Comprehensive audit of all studies
2. **check-orthanc-study.js** - Check if specific study is in Orthanc
3. **clean-placeholder-cache.js** - Remove placeholder frames
4. **migrate-legacy-studies.js** - Migrate legacy studies with filesystem frames
5. **list-studies.js** - List all studies and instance counts
6. **check-instance-orthanc-id.js** - Verify Instance records have Orthanc IDs
7. **test-frame-fix.js** - Test the frame cache service

## Other Affected Studies

29 other studies also need re-uploading. Run `node server/audit-studies.js` to see the complete list.

## Technical Flow (After Fix)

```
User requests frame
    ↓
Check filesystem cache
    ├─ HIT → Return cached frame ✅
    └─ MISS → Try Orthanc
        ├─ Find Instance in MongoDB
        │   ├─ Found → Get orthancInstanceId
        │   │   ├─ Fetch from Orthanc → Cache → Return ✅
        │   │   └─ Orthanc error → Return null
        │   └─ Not found → Throw error → Return null
        └─ null returned → Controller fallback
            ├─ Check legacy filesystem path
            │   ├─ EXISTS → Return legacy frame ✅
            │   └─ NOT EXISTS → Check MongoDB connection
            │       ├─ Connected → Try MongoDB path (legacy code)
            │       └─ Not connected → Return placeholder (NOT cached) ✅
```

## Verification

To verify the fix is working:
1. Upload a new DICOM file
2. View it in the viewer - should show real images
3. Check server logs - should see "Fetching from Orthanc" messages
4. Check cache directory - frames should be larger than 4691 bytes
5. Refresh page - should load from cache instantly

## Conclusion

The issue was caused by a combination of legacy data and code bugs. All bugs have been fixed. The specific study you're viewing needs to be re-uploaded to work properly.
