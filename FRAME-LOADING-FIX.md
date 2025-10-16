# Frame Loading Issue - Root Cause and Fix

## Problem Summary

The DICOM viewer was showing checkered placeholder images instead of actual medical images for study `1.3.6.1.4.1.16568.1760629278470.775947117`.

## Root Cause Analysis

### Issue 1: Missing Instance Records in MongoDB
- The study exists in MongoDB but has **0 Instance records**
- This is a legacy study uploaded before the current MongoDB integration was fully implemented
- Without Instance records, the frame cache service cannot map frame indices to Orthanc instances

### Issue 2: Study Not in Orthanc PACS
- The study does not exist in the Orthanc PACS server
- Only 6 studies total are in Orthanc, and this study is not one of them
- This means frames cannot be regenerated from the source DICOM data

### Issue 3: Cached Placeholders
- The filesystem cache contained 96 PNG files for this study
- All files were exactly 4691 bytes (the size of the placeholder image)
- These placeholders were generated when the frame cache service failed to find Instance records
- **BUG**: The old code was caching placeholder images, which should never happen

### Issue 4: Undefined Variable Bug
- The `instanceController.js` referenced `isMongoConnected` which was never defined
- This would cause a ReferenceError if the fallback path was reached

## Code Fixes Applied

### 1. Fixed Frame Cache Service (`frame-cache-service.js`)
**Before:**
```javascript
async generateFrame(studyUID, frameIndex) {
  try {
    // ... code ...
  } catch (error) {
    // ❌ BAD: Returns placeholder on error
    return this.generatePlaceholder();
  }
}
```

**After:**
```javascript
async generateFrame(studyUID, frameIndex) {
  // ... code ...
  // ✅ GOOD: Throws error instead of returning placeholder
  throw new Error(`Could not map frame ${frameIndex} to Orthanc instance`);
}

async getFrame(studyUID, frameIndex) {
  // 1. Try cache first
  const cachedFrame = this.getFromCache(studyUID, frameIndex);
  if (cachedFrame) return cachedFrame;

  // 2. Try to generate from Orthanc (may fail for legacy studies)
  try {
    const frameBuffer = await this.generateFrame(studyUID, frameIndex);
    this.saveToCache(studyUID, frameIndex, frameBuffer);
    return frameBuffer;
  } catch (error) {
    console.warn(`⚠️  Could not generate frame from Orthanc: ${error.message}`);
    // ✅ GOOD: Return null to trigger fallback in controller
    return null;
  }
}
```

### 2. Fixed Instance Controller (`instanceController.js`)
**Before:**
```javascript
if (!isMongoConnected) {  // ❌ Undefined variable
  // ...
}
```

**After:**
```javascript
const mongoose = require('mongoose');
if (mongoose.connection.readyState !== 1) {  // ✅ Proper check
  // ...
}
```

## Cleanup Actions Performed

### Removed Placeholder Cache
- Deleted 124 placeholder PNG files across 6 studies
- Removed 5 empty frame directories
- Kept 4 valid frames (from other studies)

### Studies Affected
- `1.3.6.1.4.1.16568.1760625755855.96873040` - 24 placeholders deleted
- `1.3.6.1.4.1.16568.1760629278470.775947117` - 96 placeholders deleted (the problematic study)
- 4 other studies with 1 placeholder each

## Resolution Steps for Users

### For the Problematic Study
Since the study is not in Orthanc and only had placeholder frames:

1. **Re-upload the DICOM file** through the upload interface
2. The new upload will:
   - Store the DICOM in Orthanc PACS
   - Create proper Instance records in MongoDB
   - Generate real frames (not placeholders)
   - Cache the frames for fast access

### For Future Uploads
The fixes ensure:
- ✅ Placeholders are never cached
- ✅ Legacy filesystem frames are used as fallback
- ✅ Proper error handling and logging
- ✅ MongoDB connection state is checked correctly

## Migration Script Created

Created `migrate-legacy-studies.js` to handle future legacy studies:
- Scans for studies with 0 Instance records
- Checks if frames exist in filesystem
- Searches for study in Orthanc
- Creates Instance records linking to Orthanc
- Updates study metadata

## Utility Scripts Created

1. **check-instance-orthanc-id.js** - Check if instances have Orthanc IDs
2. **list-studies.js** - List all studies and their instance counts
3. **clean-placeholder-cache.js** - Remove placeholder frames from cache
4. **check-orthanc-study.js** - Verify if study exists in Orthanc
5. **test-frame-fix.js** - Test the frame cache service fix

## Testing

To verify the fix works:

1. Start the server
2. Upload a new DICOM file
3. Verify frames load correctly in the viewer
4. Check that no placeholders are cached

## Technical Details

### Frame Cache Flow (After Fix)
```
1. Request frame → Check filesystem cache
   ├─ HIT → Return cached frame ✅
   └─ MISS → Try to generate from Orthanc
       ├─ SUCCESS → Cache and return ✅
       └─ FAIL → Return null (triggers controller fallback)
           └─ Controller checks legacy filesystem path
               ├─ EXISTS → Return legacy frame ✅
               └─ NOT EXISTS → Return placeholder (not cached) ✅
```

### Key Improvements
- Placeholders are only returned as a last resort
- Placeholders are never cached to disk
- Proper error propagation through the stack
- Graceful fallback to legacy filesystem frames
- Clear logging for debugging

## Conclusion

The issue was caused by a combination of:
1. Legacy study without MongoDB Instance records
2. Study missing from Orthanc PACS
3. Bug that cached placeholder images
4. Undefined variable in fallback code

All code issues have been fixed. The problematic study needs to be re-uploaded to work properly.
