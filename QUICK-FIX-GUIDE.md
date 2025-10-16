# Quick Fix Guide - Checkered Pattern in DICOM Viewer

## TL;DR
The study you're viewing doesn't exist in the PACS server. You need to re-upload the DICOM file.

## What Happened
- Study exists in database but has no actual image data
- Only placeholder images were cached (the checkered pattern you see)
- Code bugs were caching these placeholders permanently

## What Was Fixed
✅ Code no longer caches placeholder images  
✅ Fixed undefined variable bug  
✅ Deleted 96 cached placeholder frames for your study  
✅ Improved error handling and logging  

## What You Need To Do
1. Find the original DICOM file for study "Rubo DEMO (test)"
2. Upload it through the web interface
3. The viewer will now show real images

## How To Verify It's Working
After re-uploading:
- Images should appear (not checkered pattern)
- Server logs should show "Fetching from Orthanc"
- Cached frames will be larger than 5KB

## If You Have Other Studies With This Issue
Run this command to see which studies need re-uploading:
```bash
node server/audit-studies.js
```

## Files Changed
- `server/src/services/frame-cache-service.js` - Fixed placeholder caching
- `server/src/controllers/instanceController.js` - Fixed undefined variable

## New Utility Scripts
- `server/audit-studies.js` - Check all studies
- `server/clean-placeholder-cache.js` - Remove bad cache
- `server/check-orthanc-study.js` - Verify study in PACS

## Need More Details?
See `ISSUE-SUMMARY.md` for complete technical analysis.
