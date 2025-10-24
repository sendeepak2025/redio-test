# Debug Series Images Issue

## Problem
All 3 series showing same pelvis image.

## Debug Steps

### Step 1: Restart Both Servers
```bash
# Terminal 1: Backend
cd server
npm start

# Terminal 2: Frontend
cd viewer
npm start
```

### Step 2: Open Browser with Console
```
http://localhost:3000/viewer/1.2.840.113619.2.482.3.2831195393.851.1709524269.885
```

Press **F12** to open DevTools → Console tab

### Step 3: Check Frontend Logs

When you click different series, you should see:
```javascript
🔄 Generating frame URLs: {
  studyUID: "1.2.840.113619...",
  seriesUID: "1.2.840.113619...888",  // ← Should CHANGE for each series
  totalFrames: 2,  // ← Should be different per series
  sampleURL: "/api/dicom/studies/.../series/.../frames/0"
}
```

**Check:**
- Does `seriesUID` change when you click different series?
- Does `totalFrames` change? (2 for Series 1, 132 for Series 2 & 3)
- Does `sampleURL` include `/series/` in the path?

### Step 4: Check Backend Logs

In the backend terminal, you should see:
```
🔍 getFrame: Filtering by series 1.2.840.113619...888
📊 getFrame: Found 2 instances for query: { studyInstanceUID: '...', seriesInstanceUID: '...888' }
```

**Check:**
- Does it say "Filtering by series"?
- Does instance count match the series? (2, 132, 132)
- If it says "NO series filter", that's the problem!

### Step 5: Check Network Tab

F12 → Network tab

Filter by "frames"

You should see requests like:
```
/api/dicom/studies/1.2.840.../series/1.2.840...888/frames/0
/api/dicom/studies/1.2.840.../series/1.2.840...893/frames/0
/api/dicom/studies/1.2.840.../series/1.2.840...893.3/frames/0
```

**Check:**
- Do URLs include `/series/:seriesUid/`?
- Does seriesUid change for different series?

## Common Issues

### Issue 1: seriesUID is undefined
**Symptom:** Console shows `seriesUID: undefined`

**Solution:**
```javascript
// In browser console
console.log('Selected Series:', selectedSeries)
console.log('Series UID:', selectedSeries?.seriesInstanceUID)
```

If undefined, the problem is in ViewerPage series selection.

### Issue 2: Backend not filtering by series
**Symptom:** Backend logs show "NO series filter"

**Possible causes:**
1. Frontend not passing seriesUID in URL
2. Route not matching (check route order in index.js)
3. seriesUid parameter not extracted from req.params

**Solution:**
Check route order - series-specific route should come BEFORE generic route:
```javascript
// ✅ Correct order
router.get('/api/dicom/studies/:studyUid/series/:seriesUid/frames/:frameIndex', ...)
router.get('/api/dicom/studies/:studyUid/frames/:frameIndex', ...)

// ❌ Wrong order (generic route matches first)
router.get('/api/dicom/studies/:studyUid/frames/:frameIndex', ...)
router.get('/api/dicom/studies/:studyUid/series/:seriesUid/frames/:frameIndex', ...)
```

### Issue 3: Same images despite correct URLs
**Symptom:** URLs are correct but images don't change

**Possible causes:**
1. Browser caching
2. Instances in database have wrong seriesInstanceUID
3. All instances accidentally have same seriesInstanceUID

**Solution:**
```bash
# Check database
mongo dicomdb

# Count instances per series
db.instances.aggregate([
  { $match: { studyInstanceUID: "1.2.840.113619..." } },
  { $group: { _id: "$seriesInstanceUID", count: { $sum: 1 } } }
])

# Should show:
# { _id: "...888", count: 2 }
# { _id: "...893", count: 132 }
# { _id: "...893.3", count: 132 }
```

If all instances have same seriesInstanceUID, that's the problem - need to re-sync study.

### Issue 4: Component not re-rendering
**Symptom:** seriesUID changes but viewer doesn't update

**Check:**
```javascript
// In browser console
// Check if key prop is working
document.querySelector('[data-testid="medical-image-viewer"]')
```

**Solution:**
Verify `key={selectedSeries?.seriesInstanceUID}` is on MedicalImageViewer component.

## Quick Fixes

### Fix 1: Clear Everything
```bash
# Clear browser
Ctrl+Shift+Delete (clear cache)
Ctrl+F5 (hard refresh)

# Restart servers
cd server && npm start
cd viewer && npm start
```

### Fix 2: Check Route Order
```javascript
// In server/src/routes/index.js
// Make sure series-specific route comes FIRST
router.get('/api/dicom/studies/:studyUid/series/:seriesUid/frames/:frameIndex', ...)
router.get('/api/dicom/studies/:studyUid/frames/:frameIndex', ...)
```

### Fix 3: Verify Database
```bash
mongo dicomdb

# Check if instances have correct seriesInstanceUID
db.instances.find({ 
  studyInstanceUID: "1.2.840.113619.2.482.3.2831195393.851.1709524269.885" 
}).forEach(function(doc) {
  print(doc.seriesInstanceUID + " - " + doc.instanceNumber)
})

# Should show different seriesInstanceUIDs
```

### Fix 4: Re-sync Study
If database has wrong data:
```bash
mongo dicomdb
db.studies.deleteOne({ studyInstanceUID: "1.2.840.113619..." })
db.instances.deleteMany({ studyInstanceUID: "1.2.840.113619..." })
exit

cd server
node auto-sync-simple.js
# Wait for sync to complete
# Ctrl+C
npm start
```

## Expected Behavior

### Series 1 (SCOUT - 2 images):
- Frontend log: `totalFrames: 2`
- Backend log: `Found 2 instances`
- Network: `/series/...888/frames/0`
- Image: Scout/localizer view

### Series 2 (Pre Contrast Chest - 132 images):
- Frontend log: `totalFrames: 132`
- Backend log: `Found 132 instances`
- Network: `/series/...893/frames/0`
- Image: Chest CT slice

### Series 3 (lung - 132 images):
- Frontend log: `totalFrames: 132`
- Backend log: `Found 132 instances`
- Network: `/series/...893.3/frames/0`
- Image: Lung window CT slice

## Success Indicators

✅ Console shows different seriesUID for each series
✅ totalFrames changes (2, 132, 132)
✅ Backend logs show correct instance counts
✅ Network URLs include `/series/:seriesUid/`
✅ Images are visually different for each series

---

**Next Step:** Follow debug steps and report what you see in logs!
