# 🔍 Series-Wise Rendering Debug Guide

## Current Status Check

### 1. Frontend Console (F12)
When you click different series, you should see:

```
[SERIES IDENTIFIER] 🎯 Frame count set from sopInstanceUIDs
[SERIES IDENTIFIER] Series UID: 1.2.840.113619...888
[SERIES IDENTIFIER] Frame Count: 2

[SERIES IDENTIFIER] 🔄 Generating frame URLs
[SERIES IDENTIFIER] Study UID: 1.2.840.113619...885
[SERIES IDENTIFIER] Series UID: 1.2.840.113619...888
[SERIES IDENTIFIER] Total Frames: 2
[SERIES IDENTIFIER] Sample URL: /api/dicom/studies/.../series/.../frames/0
```

**Check:**
- ✅ Series UID changes when you click different series?
- ✅ Frame Count is correct (2, 132, 132)?
- ✅ Sample URL includes `/series/` part?
- ❌ Still seeing "Total Frames: 266"?

### 2. Backend Terminal
When you click different series, you should see:

```
[SERIES IDENTIFIER - BACKEND] Frame request received
[SERIES IDENTIFIER - BACKEND] Study UID: 1.2.840.113619...885
[SERIES IDENTIFIER - BACKEND] Series UID: 1.2.840.113619...888
[SERIES IDENTIFIER - BACKEND] Frame Index: 0
[SERIES IDENTIFIER - BACKEND] ✅ Filtering by series
[SERIES IDENTIFIER - BACKEND] Found instances: 2
```

**Check:**
- ✅ Backend logs appear when you click series?
- ✅ Series UID changes?
- ✅ Instance count is correct?
- ❌ No backend logs appearing?

### 3. Network Tab (F12 → Network)
Filter by "frames" and check the URLs:

**Good URLs (series-specific):**
```
/api/dicom/studies/.../series/...888/frames/0
/api/dicom/studies/.../series/...893/frames/0
/api/dicom/studies/.../series/...893.3/frames/0
```

**Bad URLs (no series):**
```
/api/dicom/studies/.../frames/0  ❌ Missing /series/ part!
```

## Common Issues & Solutions

### Issue 1: Layout Changed / Sidebar Missing

**Symptoms:**
- Series selector not visible
- Layout looks different

**Solution:**
Check if `studyData.series` has data:
```javascript
// In browser console:
console.log('Study Data:', studyData)
console.log('Series:', studyData?.series)
console.log('Series Count:', studyData?.series?.length)
```

If `series` is undefined or empty, the API endpoint is wrong.

**Fix:**
```typescript
// viewer/src/services/ApiService.ts
// Should be:
const response = await apiCall(`/api/dicom/studies/${studyUID}/metadata`)
// NOT:
const response = await apiCall(`/api/dicom/studies/${studyUID}`)
```

### Issue 2: Same Image in All Series

**Symptoms:**
- Sidebar shows correctly
- Frame count is correct
- But same image appears in all series

**Possible Causes:**

#### A. Backend Not Filtering by Series
Check backend logs. If you see:
```
⚠️ LEGACY ROUTE HIT  // Wrong route!
```

**Fix:** Backend route order is wrong. Check `server/src/routes/index.js`:
```javascript
// Series-specific route MUST come BEFORE legacy route
router.get('/studies/:studyUid/series/:seriesUid/frames/:frameIndex', 
  orthancInstanceController.getFrame)  // ✅ First

router.get('/studies/:studyUid/frames/:frameIndex', 
  orthancInstanceController.getFrame)  // ✅ Second
```

#### B. Frontend Not Passing Series UID
Check console logs. If you see:
```
[SERIES IDENTIFIER] Series UID: default-series  // ❌ Wrong!
```

**Fix:** Check ViewerPage.tsx:
```typescript
<MedicalImageViewer
  key={selectedSeries?.seriesInstanceUID}  // ✅ Must have key
  seriesInstanceUID={selectedSeries?.seriesInstanceUID || 'default-series'}
  sopInstanceUIDs={selectedSeries?.instances?.map(...) || []}
/>
```

#### C. Component Not Re-rendering
Check if `key` prop changes when series changes:
```javascript
// In browser console:
console.log('Selected Series UID:', selectedSeries?.seriesInstanceUID)
```

If UID doesn't change when you click different series, the state update is broken.

### Issue 3: Frame Count Still Shows 266

**Symptoms:**
- Console shows "Total Frames: 266"
- Frame counter shows "1 / 266"

**Solution:**
The useEffect is still running the API fallback. Check MedicalImageViewer.tsx:
```typescript
// Should be:
useEffect(() => {
  if (sopInstanceUIDs && sopInstanceUIDs.length > 0) {
    setTotalFrames(sopInstanceUIDs.length)
  }
  // ✅ No API call here!
}, [sopInstanceUIDs, seriesInstanceUID])
```

## Step-by-Step Debugging

### Step 1: Verify Database
```bash
cd server
node check-database.js
```

Expected output:
```
Series 1: 2 instances
Series 2: 132 instances
Series 3: 132 instances
✅ Multiple series found
```

### Step 2: Test Backend Directly
Open in browser:
```
http://localhost:5000/api/dicom/studies/1.2.840.113619.2.482.3.2831195393.851.1709524269.885/metadata
```

Should return:
```json
{
  "success": true,
  "data": {
    "numberOfSeries": 3,
    "numberOfInstances": 266,
    "series": [
      {
        "seriesInstanceUID": "...888",
        "numberOfInstances": 2
      },
      {
        "seriesInstanceUID": "...893",
        "numberOfInstances": 132
      },
      {
        "seriesInstanceUID": "...893.3",
        "numberOfInstances": 132
      }
    ]
  }
}
```

### Step 3: Test Frame Endpoint
```
http://localhost:5000/api/dicom/studies/.../series/...888/frames/0
```

Should return an image (not JSON).

### Step 4: Check Frontend State
In browser console:
```javascript
// Check if series data is loaded
console.log('Study Data:', studyData)
console.log('Selected Series:', selectedSeries)
console.log('SOP Instance UIDs:', sopInstanceUIDs)
```

## Quick Fix Commands

### Restart Everything
```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend
cd viewer
npm start

# Terminal 3 - Check Database
cd server
node check-database.js
```

### Clear Cache
```bash
cd viewer
rm -rf node_modules/.cache
npm start
```

### Hard Refresh Browser
```
Ctrl + Shift + R  (Windows/Linux)
Cmd + Shift + R   (Mac)
```

## Expected Final Result

### Console Output:
```
Series 1 (SCOUT):
[SERIES IDENTIFIER] Frame Count: 2
[SERIES IDENTIFIER] Total Frames: 2

Series 2 (Pre Contrast Chest):
[SERIES IDENTIFIER] Frame Count: 132
[SERIES IDENTIFIER] Total Frames: 132

Series 3 (lung):
[SERIES IDENTIFIER] Frame Count: 132
[SERIES IDENTIFIER] Total Frames: 132
```

### Visual Result:
- ✅ Sidebar on left showing 3 series
- ✅ Each series shows correct image count
- ✅ Clicking series switches images
- ✅ Frame counter shows correct values (1/2, 1/132, 1/132)
- ✅ Each series shows DIFFERENT images

## Still Not Working?

Share these logs:
1. Browser console output (all [SERIES IDENTIFIER] logs)
2. Backend terminal output (all [SERIES IDENTIFIER - BACKEND] logs)
3. Network tab screenshot (showing frame request URLs)
4. Screenshot of the layout issue

This will help identify the exact problem!
