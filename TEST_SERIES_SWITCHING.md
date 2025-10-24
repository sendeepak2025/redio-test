# Test Series Switching - Step by Step

## Problem
All series showing same image (pelvis CT).

## Test Procedure

### Step 1: Restart Backend
```bash
cd server
npm start
```

**Watch for these logs when you click series:**
- `🎯 SERIES-SPECIFIC ROUTE HIT` = Good! Series filter working
- `⚠️ LEGACY ROUTE HIT` = Bad! Series not being passed

### Step 2: Open Browser Console
```
http://localhost:3000/viewer/1.2.840.113619.2.482.3.2831195393.851.1709524269.885
```

Press F12 → Console tab

### Step 3: Click Series 1 (SCOUT)

**Expected Console Output:**
```javascript
🔄 Generating frame URLs: {
  studyUID: "1.2.840.113619.2.482.3.2831195393.851.1709524269.885",
  seriesUID: "1.2.840.113619.2.482.3.2831195393.851.1709524269.888",
  totalFrames: 2,
  sampleURL: "/api/dicom/studies/.../series/.../frames/0"
}
```

**Expected Backend Log:**
```
🎯 SERIES-SPECIFIC ROUTE HIT: {
  studyUid: '1.2.840.113619.2.482.3.2831195393.851.1709524269.885',
  seriesUid: '1.2.840.113619.2.482.3.2831195393.851.1709524269.888',
  frameIndex: '0'
}
🔍 getFrame: Filtering by series 1.2.840.113619.2.482.3.2831195393.851.1709524269.888
📊 getFrame: Found 2 instances
```

### Step 4: Click Series 2 (Pre Contrast Chest)

**Expected Console Output:**
```javascript
🔄 Generating frame URLs: {
  studyUID: "1.2.840.113619.2.482.3.2831195393.851.1709524269.885",
  seriesUID: "1.2.840.113619.2.482.3.2831195393.851.1709524269.893",  // ← Different!
  totalFrames: 132,  // ← Different!
  sampleURL: "/api/dicom/studies/.../series/.../frames/0"
}
```

**Expected Backend Log:**
```
🎯 SERIES-SPECIFIC ROUTE HIT: {
  studyUid: '1.2.840.113619.2.482.3.2831195393.851.1709524269.885',
  seriesUid: '1.2.840.113619.2.482.3.2831195393.851.1709524269.893',  // ← Different!
  frameIndex: '0'
}
🔍 getFrame: Filtering by series 1.2.840.113619.2.482.3.2831195393.851.1709524269.893
📊 getFrame: Found 132 instances  // ← Different!
```

### Step 5: Click Series 3 (lung)

**Expected Console Output:**
```javascript
🔄 Generating frame URLs: {
  studyUID: "1.2.840.113619.2.482.3.2831195393.851.1709524269.885",
  seriesUID: "1.2.840.113619.2.482.3.2831195393.851.1709524269.893.3",  // ← Different!
  totalFrames: 132,
  sampleURL: "/api/dicom/studies/.../series/.../frames/0"
}
```

## Diagnostic Questions

### Q1: What do you see in browser console?
- [ ] `seriesUID` is changing for each series?
- [ ] `totalFrames` is changing? (2, 132, 132)
- [ ] `sampleURL` includes `/series/` in the path?

### Q2: What do you see in backend logs?
- [ ] `🎯 SERIES-SPECIFIC ROUTE HIT` appears?
- [ ] `seriesUid` parameter is present and changing?
- [ ] Instance count is changing? (2, 132, 132)

### Q3: If you see `⚠️ LEGACY ROUTE HIT`:
This means frontend is NOT passing seriesUID. Possible causes:
1. `seriesInstanceUID` prop is undefined
2. `selectedSeries` is not updating
3. Component not re-rendering

**Debug in console:**
```javascript
// Check selected series
console.log('Selected Series:', selectedSeries)
console.log('Series UID:', selectedSeries?.seriesInstanceUID)
```

### Q4: Check Network Tab
F12 → Network tab → Filter by "frames"

**Look for URLs like:**
```
✅ Good: /api/dicom/studies/.../series/.../frames/0
❌ Bad:  /api/dicom/studies/.../frames/0  (no /series/ part)
```

## Common Issues & Fixes

### Issue 1: seriesUID is undefined in console

**Cause:** `selectedSeries` not set or missing seriesInstanceUID

**Fix:**
```javascript
// In browser console
console.log('Study Data:', studyData)
console.log('Selected Series:', selectedSeries)
console.log('All Series:', studyData?.series)
```

If `selectedSeries` is null/undefined, the problem is in ViewerPage.tsx

### Issue 2: Backend shows "NO series filter"

**Cause:** seriesUid parameter not reaching controller

**Fix:** Check if route is being hit:
- If `🎯 SERIES-SPECIFIC ROUTE HIT` appears but still "NO series filter", there's an issue in migration service
- If `⚠️ LEGACY ROUTE HIT` appears, frontend isn't generating correct URLs

### Issue 3: Same seriesUID for all series

**Cause:** selectedSeries not updating when clicking different series

**Fix:** Check ViewerPage series selection handler:
```typescript
onSeriesSelect={(seriesUID) => {
  const series = studyData.series.find((s: any) => s.seriesInstanceUID === seriesUID)
  if (series) {
    console.log('Setting selected series:', series)  // Add this
    setSelectedSeries(series)
  }
}}
```

### Issue 4: Correct URLs but same images

**Cause:** Database has wrong seriesInstanceUID for instances

**Fix:** Check database:
```bash
mongo dicomdb

db.instances.aggregate([
  { $match: { studyInstanceUID: "1.2.840.113619.2.482.3.2831195393.851.1709524269.885" } },
  { $group: { _id: "$seriesInstanceUID", count: { $sum: 1 } } }
])

# Should show:
# { _id: "...888", count: 2 }
# { _id: "...893", count: 132 }
# { _id: "...893.3", count: 132 }
```

If all instances have same seriesInstanceUID, re-sync study:
```bash
db.studies.deleteOne({ studyInstanceUID: "1.2.840.113619..." })
db.instances.deleteMany({ studyInstanceUID: "1.2.840.113619..." })
exit

cd server
node auto-sync-simple.js
```

## Quick Debug Commands

### Browser Console:
```javascript
// Check if series selector is working
console.log('Study Data:', studyData)
console.log('Selected Series:', selectedSeries)
console.log('Series UID:', selectedSeries?.seriesInstanceUID)
console.log('Total Frames:', totalFrames)

// Check frame URL generation
console.log('Sample Frame URL:', ApiService.getFrameImageUrl(
  studyData.studyInstanceUID,
  0,
  selectedSeries?.seriesInstanceUID
))
```

### Backend Terminal:
Watch for these patterns when clicking series:
```
🎯 SERIES-SPECIFIC ROUTE HIT  ← Good!
🔍 getFrame: Filtering by series  ← Good!
📊 getFrame: Found X instances  ← Should change (2, 132, 132)
```

## Success Criteria

✅ Browser console shows different `seriesUID` for each series
✅ Browser console shows different `totalFrames` (2, 132, 132)
✅ Backend logs show `🎯 SERIES-SPECIFIC ROUTE HIT`
✅ Backend logs show different instance counts (2, 132, 132)
✅ Network tab shows URLs with `/series/:seriesUid/`
✅ Images are visually different for each series

---

**Next Step:** Run this test and share the logs from BOTH browser console AND backend terminal!
