# Check Series Issue - Complete Diagnosis

## Problem
Still seeing same image in every series despite all fixes.

## Step-by-Step Diagnosis

### Step 1: Check Backend Terminal Logs

When you click different series, you should see in backend terminal:

**For Series 1:**
```
🎯 SERIES-SPECIFIC ROUTE HIT: {
  studyUid: '1.2.840.113619.2.482.3.2831195393.851.1709524269.885',
  seriesUid: '1.2.840.113619.2.482.3.2831195393.851.1709524269.888',
  frameIndex: '0'
}
🔍 getFrame: Filtering by series 1.2.840.113619.2.482.3.2831195393.851.1709524269.888
📊 getFrame: Found 2 instances
```

**For Series 2:**
```
🎯 SERIES-SPECIFIC ROUTE HIT: {
  studyUid: '1.2.840.113619.2.482.3.2831195393.851.1709524269.885',
  seriesUid: '1.2.840.113619.2.482.3.2831195393.851.1709524269.893',
  frameIndex: '0'
}
🔍 getFrame: Filtering by series 1.2.840.113619.2.482.3.2831195393.851.1709524269.893
📊 getFrame: Found 132 instances
```

### Step 2: Check Browser Console

Press F12 → Console tab

You should see:
```javascript
🔄 Generating frame URLs: {
  studyUID: "1.2.840.113619.2.482.3.2831195393.851.1709524269.885",
  seriesUID: "1.2.840.113619.2.482.3.2831195393.851.1709524269.888",
  totalFrames: 2,
  sampleURL: "/api/dicom/studies/.../series/.../frames/0"
}
```

### Step 3: Check Network Tab

F12 → Network tab → Filter by "frames"

Look at the actual URLs being requested:
```
✅ CORRECT: /api/dicom/studies/.../series/...888/frames/0
❌ WRONG:   /api/dicom/studies/.../frames/0  (no series)
```

## Possible Issues & Solutions

### Issue A: Backend shows "LEGACY ROUTE HIT"

**Symptom:**
```
⚠️ LEGACY ROUTE HIT (no series filter): {
  studyUid: '...',
  frameIndex: '0'
}
```

**Cause:** Frontend not generating series-specific URLs

**Solution:** Check if `seriesInstanceUID` is being passed to `getFrameImageUrl`

### Issue B: Backend shows "NO series filter"

**Symptom:**
```
🎯 SERIES-SPECIFIC ROUTE HIT
⚠️ getFrame: NO series filter - will return all study instances
```

**Cause:** `seriesUid` parameter not being extracted from route

**Solution:** Check route parameter extraction in controller

### Issue C: Database has wrong seriesInstanceUID

**Symptom:** Backend logs show correct filtering but same images

**Check Database:**
```bash
mongo dicomdb

# Check if instances have correct seriesInstanceUID
db.instances.find({ 
  studyInstanceUID: "1.2.840.113619.2.482.3.2831195393.851.1709524269.885" 
}).forEach(function(doc) {
  print(doc.seriesInstanceUID + " - instance " + doc.instanceNumber + " - orthanc: " + doc.orthancInstanceId)
})

# Count instances per series
db.instances.aggregate([
  { $match: { studyInstanceUID: "1.2.840.113619.2.482.3.2831195393.851.1709524269.885" } },
  { $group: { _id: "$seriesInstanceUID", count: { $sum: 1 } } }
])
```

**Expected Output:**
```
{ _id: "1.2.840.113619.2.482.3.2831195393.851.1709524269.888", count: 2 }
{ _id: "1.2.840.113619.2.482.3.2831195393.851.1709524269.893", count: 132 }
{ _id: "1.2.840.113619.2.482.3.2831195393.851.1709524269.893.3", count: 132 }
```

**If all instances have SAME seriesInstanceUID:**
This is the problem! Database has wrong data. Need to re-sync.

### Issue D: Orthanc returning same image

**Symptom:** Everything looks correct but images are same

**Cause:** Orthanc instances might be mapped incorrectly

**Check:** Look at `orthancInstanceId` in database - are they different?

## Quick Database Check Script

```bash
mongo dicomdb

# Check first 5 instances from each series
print("=== Series 1 (SCOUT) ===")
db.instances.find({ 
  studyInstanceUID: "1.2.840.113619.2.482.3.2831195393.851.1709524269.885",
  seriesInstanceUID: "1.2.840.113619.2.482.3.2831195393.851.1709524269.888"
}).limit(5).forEach(function(doc) {
  print("Instance " + doc.instanceNumber + " - Orthanc: " + doc.orthancInstanceId)
})

print("\n=== Series 2 (Pre Contrast) ===")
db.instances.find({ 
  studyInstanceUID: "1.2.840.113619.2.482.3.2831195393.851.1709524269.885",
  seriesInstanceUID: "1.2.840.113619.2.482.3.2831195393.851.1709524269.893"
}).limit(5).forEach(function(doc) {
  print("Instance " + doc.instanceNumber + " - Orthanc: " + doc.orthancInstanceId)
})

print("\n=== Series 3 (lung) ===")
db.instances.find({ 
  studyInstanceUID: "1.2.840.113619.2.482.3.2831195393.851.1709524269.885",
  seriesInstanceUID: "1.2.840.113619.2.482.3.2831195393.851.1709524269.893.3"
}).limit(5).forEach(function(doc) {
  print("Instance " + doc.instanceNumber + " - Orthanc: " + doc.orthancInstanceId)
})
```

## Re-sync Solution

If database has wrong data:

```bash
# 1. Stop backend server (Ctrl+C)

# 2. Clean database
mongo dicomdb
db.studies.deleteOne({ studyInstanceUID: "1.2.840.113619.2.482.3.2831195393.851.1709524269.885" })
db.instances.deleteMany({ studyInstanceUID: "1.2.840.113619.2.482.3.2831195393.851.1709524269.885" })
exit

# 3. Re-sync from Orthanc
cd server
node auto-sync-simple.js

# Wait for:
# 📊 Found 3 series in study
# ✅ Created 266 instance records from 3 series

# Press Ctrl+C when done

# 4. Start backend
npm start

# 5. Restart frontend
cd viewer
npm start
```

## What to Share

Please share:

1. **Backend Terminal Output** when clicking Series 1, 2, 3
2. **Browser Console Output** when clicking Series 1, 2, 3  
3. **Network Tab** - screenshot of frame request URLs
4. **Database Check** - output of the MongoDB queries above

This will tell me EXACTLY where the problem is!

---

**Most Likely Issue:** Database has wrong `seriesInstanceUID` values. All instances probably have the same seriesInstanceUID, so filtering doesn't work.

**Quick Test:** Run the MongoDB query above. If all instances show same seriesInstanceUID, that's the problem - need to re-sync study.
