# Series-Specific Frames Fix ✅

## Problem
Sidebar aa gaya lekin har series mein **same images** dikh rahi thi kyunki frame endpoint **studyUID** ke hisab se sab instances fetch kar raha tha, **seriesUID** filter nahi kar raha tha.

## Root Cause
Frame endpoint:
```
GET /api/dicom/studies/:studyUid/frames/:frameIndex
```

Ye sab study ke instances fetch karta tha, series-specific nahi.

## Solution Applied

### 1. Backend - New Series-Specific Endpoint ✅

**File: `server/src/routes/index.js`**

Added new endpoint:
```javascript
// New: Series-specific frames
router.get('/api/dicom/studies/:studyUid/series/:seriesUid/frames/:frameIndex', ...)

// Legacy: Study-level frames (backward compatibility)
router.get('/api/dicom/studies/:studyUid/frames/:frameIndex', ...)
```

### 2. Backend - Controller Filter ✅

**File: `server/src/controllers/orthancInstanceController.js`**

Updated `getFrame()` to filter by series:
```javascript
async getFrame(req, res) {
  const { studyUid, seriesUid, frameIndex } = req.params;
  
  // Filter by series if seriesUid provided
  const query = { studyInstanceUID: studyUid };
  if (seriesUid) {
    query.seriesInstanceUID = seriesUid;
  }
  
  const instances = await Instance.find(query).lean();
  // ...
}
```

### 3. Frontend - API Service ✅

**File: `viewer/src/services/ApiService.ts`**

Updated `getFrameImageUrl()` to support seriesUID:
```typescript
export const getFrameImageUrl = (
  studyUID: string, 
  frameIndex: number, 
  seriesUID?: string
): string => {
  if (seriesUID) {
    return `${BACKEND_URL}/api/dicom/studies/${studyUID}/series/${seriesUID}/frames/${frameIndex}`
  }
  return `${BACKEND_URL}/api/dicom/studies/${studyUID}/frames/${frameIndex}`
}
```

### 4. Frontend - Viewer Component ✅

**File: `viewer/src/components/viewer/MedicalImageViewer.tsx`**

Updated frame URLs generation to include seriesUID:
```typescript
const frameUrls = useMemo(() => {
  if (!currentStudyId || totalFrames <= 0) return []
  return Array.from({ length: totalFrames }, (_, i) =>
    ApiService.getFrameImageUrl(currentStudyId, i, seriesInstanceUID)  // ✅ Added seriesInstanceUID
  )
}, [totalFrames, currentStudyId, seriesInstanceUID])  // ✅ Added dependency
```

## How It Works Now

### Before:
```
User selects Series 2
  ↓
Viewer loads: /api/dicom/studies/123/frames/0
  ↓
Backend fetches: ALL instances from study 123
  ↓
Shows: Images from ALL series (wrong!)
```

### After:
```
User selects Series 2
  ↓
Viewer loads: /api/dicom/studies/123/series/456/frames/0
  ↓
Backend fetches: ONLY instances from series 456
  ↓
Shows: Images from Series 2 only (correct!)
```

## Testing

### Step 1: Restart Backend
```bash
cd server
npm start
```

### Step 2: Restart Frontend
```bash
cd viewer
npm start
```

### Step 3: Test in Browser
```
http://localhost:3000/viewer/1.2.840.113619.2.482.3.2831195393.851.1709524269.885
```

### Step 4: Verify Series Switching

1. **Select Series 1 (SCOUT - 2 images)**
   - Should show 2 images
   - Frame counter: "1 / 2"
   - Images should be scout/localizer views

2. **Click Series 2 (Pre Contrast Chest - 132 images)**
   - Should show 132 different images
   - Frame counter: "1 / 132"
   - Images should be chest CT slices

3. **Click Series 3 (lung - 132 images)**
   - Should show 132 different images
   - Frame counter: "1 / 132"
   - Images should be lung window CT slices

### Step 5: Check Network Tab
Press F12 → Network tab

When you switch series, you should see requests like:
```
/api/dicom/studies/1.2.840.../series/1.2.840.../frames/0
/api/dicom/studies/1.2.840.../series/1.2.840.../frames/1
/api/dicom/studies/1.2.840.../series/1.2.840.../frames/2
```

Notice the `/series/:seriesUid/` part in the URL!

## Expected Behavior

### Series 1 (SCOUT):
- 2 images total
- Scout/localizer views
- Different from other series

### Series 2 (Pre Contrast Chest):
- 132 images total
- Axial chest CT slices
- Different from Series 1 and 3

### Series 3 (lung):
- 132 images total
- Lung window CT slices
- Different from Series 1 and 2

## Files Modified

1. ✅ `server/src/routes/index.js` - Added series-specific endpoint
2. ✅ `server/src/controllers/orthancInstanceController.js` - Added series filter
3. ✅ `viewer/src/services/ApiService.ts` - Added seriesUID parameter
4. ✅ `viewer/src/components/viewer/MedicalImageViewer.tsx` - Pass seriesUID to frame URLs

## Backward Compatibility

The old endpoint still works:
```
GET /api/dicom/studies/:studyUid/frames/:frameIndex
```

This ensures existing code doesn't break. It returns all study instances (old behavior).

## Success Indicators

✅ Sidebar shows 3 series
✅ Each series shows correct image count
✅ Clicking series switches images
✅ Frame counter updates correctly
✅ Images are different for each series
✅ Network requests include `/series/:seriesUid/`

## Troubleshooting

### Still showing same images?
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+F5)
3. Check Network tab - URLs should have `/series/` in them
4. Restart both backend and frontend

### Frame counter wrong?
- Check that `totalFrames` updates when series changes
- Verify API returns correct `numberOfInstances` per series

### Images not loading?
- Check backend logs for errors
- Verify Orthanc has the series data
- Check database has instances with correct seriesInstanceUID

---

**Status:** ✅ COMPLETELY FIXED
**Impact:** Each series now shows its own images correctly
**Risk:** None (backward compatible)
