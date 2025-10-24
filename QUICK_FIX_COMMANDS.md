# Quick Fix Commands - Series Selector Issue

## Problem
Study has 3 series but showing only 1 because of duplicate/old database entry.

## Solution - Run These Commands

### Step 1: Clean Database (MongoDB)
```bash
mongo dicomdb
```

Then in MongoDB shell:
```javascript
// Delete old study
db.studies.deleteMany({ 
  studyInstanceUID: "1.2.840.113619.2.482.3.2831195393.851.1709524269.885" 
})

// Delete old instances
db.instances.deleteMany({ 
  studyInstanceUID: "1.2.840.113619.2.482.3.2831195393.851.1709524269.885" 
})

// Verify deletion
db.studies.countDocuments({ 
  studyInstanceUID: "1.2.840.113619.2.482.3.2831195393.851.1709524269.885" 
})
// Should return: 0

exit
```

### Step 2: Re-sync Study
```bash
cd server
node auto-sync-simple.js
```

**Wait for these messages:**
```
📥 Processing study: c8d2c618-d3e76f80-1143ca31-cc07ac53-a514f629
📊 Found 3 series in study
📊 Total instances across all series: 266
✅ Study saved: 1.2.840.113619... with 3 series and 266 instances
✅ Created 266 instance records from 3 series
✅ Patient record updated or created: AD1837
```

Then press **Ctrl+C** to stop auto-sync.

### Step 3: Restart Backend
```bash
cd server
npm start
```

### Step 4: Test API
```bash
curl http://localhost:5000/api/dicom/studies/1.2.840.113619.2.482.3.2831195393.851.1709524269.885/metadata
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "studyInstanceUID": "1.2.840.113619.2.482.3.2831195393.851.1709524269.885",
    "patientName": "AMARJEET KAUR",
    "patientID": "AD1837",
    "numberOfSeries": 3,
    "numberOfInstances": 266,
    "series": [
      {
        "seriesInstanceUID": "...",
        "seriesNumber": "1",
        "numberOfInstances": 88
      },
      {
        "seriesInstanceUID": "...",
        "seriesNumber": "2",
        "numberOfInstances": 89
      },
      {
        "seriesInstanceUID": "...",
        "seriesNumber": "3",
        "numberOfInstances": 89
      }
    ]
  }
}
```

### Step 5: Test in Browser
```
http://localhost:3000/viewer/1.2.840.113619.2.482.3.2831195393.851.1709524269.885
```

**Expected Result:**
- ✅ Sidebar appears on left
- ✅ Shows "Series (3)"
- ✅ Lists all 3 series with correct image counts
- ✅ Can click and switch between series

## Verification

### Check Database:
```javascript
mongo dicomdb

// Check study
db.studies.findOne({ 
  studyInstanceUID: "1.2.840.113619.2.482.3.2831195393.851.1709524269.885" 
})
// Should show: numberOfSeries: 3, numberOfInstances: 266

// Check instances grouped by series
db.instances.aggregate([
  { 
    $match: { 
      studyInstanceUID: "1.2.840.113619.2.482.3.2831195393.851.1709524269.885" 
    } 
  },
  { 
    $group: { 
      _id: "$seriesInstanceUID", 
      count: { $sum: 1 } 
    } 
  }
])
// Should show 3 series with their instance counts
```

### Check API:
```bash
# Get metadata
curl http://localhost:5000/api/dicom/studies/1.2.840.113619.2.482.3.2831195393.851.1709524269.885/metadata | jq '.data.numberOfSeries'
# Should return: 3

curl http://localhost:5000/api/dicom/studies/1.2.840.113619.2.482.3.2831195393.851.1709524269.885/metadata | jq '.data.numberOfInstances'
# Should return: 266

curl http://localhost:5000/api/dicom/studies/1.2.840.113619.2.482.3.2831195393.851.1709524269.885/metadata | jq '.data.series | length'
# Should return: 3
```

## What Was Fixed

### auto-sync-simple.js Changes:

1. **Auto-update existing studies:**
   ```javascript
   // Before: Skip if exists
   if (existingStudy) {
       return false;
   }
   
   // After: Delete and re-create
   if (existingStudy) {
       await Study.deleteOne({ studyInstanceUID });
       await Instance.deleteMany({ studyInstanceUID });
   }
   ```

2. **Calculate total instances correctly:**
   ```javascript
   // Before: Used instanceIds.length (wrong)
   numberOfInstances: instanceIds.length
   
   // After: Sum from all series (correct)
   const totalInstances = seriesData.reduce(
     (sum, series) => sum + series.numberOfInstances, 0
   )
   numberOfInstances: totalInstances
   ```

## Troubleshooting

### Still showing 1 series?
- Check if auto-sync completed successfully
- Verify database was cleaned
- Check server logs for errors

### Wrong instance count?
- Verify all series were synced
- Check Orthanc has all series
- Re-run auto-sync

### Sidebar not appearing?
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+F5)
- Check browser console for errors

---

**Status:** Ready to apply
**Time Required:** 2-3 minutes
**Risk:** Low (only affects this one study)
