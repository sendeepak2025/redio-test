# 🔍 Check Database First

## Problem

Same hash aa raha hai sabhi series ke liye. Yeh do reasons se ho sakta hai:

1. ❌ Backend series se filter nahi kar raha
2. ❌ Database mein sabhi instances ka same Orthanc ID hai

## Step 1: Check Database

```bash
cd server
node check-instance-data.js
```

### Expected Output (GOOD):

```
✅ All instances have unique Orthanc IDs

First Instance of Each Series (Frame 0):

SCOUT:
  Orthanc ID: a973acea-9683c6c7-ebc457dd-ed8d0198-58eb891f
  
Pre Contrast Chest:
  Orthanc ID: 0145ebbe-d109199a-cedcc8d0-cdad38e8-a3d85af1
  
lung:
  Orthanc ID: 02bda789-43a773b3-0b3cf495-e56054af-62a74ba9
```

### Bad Output (PROBLEM):

```
❌ PROBLEM FOUND: All instances have the SAME Orthanc ID!
   Orthanc ID: a973acea-9683c6c7-ebc457dd-ed8d0198-58eb891f
   
   This means all series will return the same image!
```

## If Database Has Same Orthanc IDs

Database mein hi problem hai! Re-sync karna hoga:

```bash
# Clean database
mongo dicomdb
> db.studies.deleteOne({ studyInstanceUID: "1.2.840.113619.2.482.3.2831195393.851.1709524269.885" })
> db.instances.deleteMany({ studyInstanceUID: "1.2.840.113619.2.482.3.2831195393.851.1709524269.885" })
> exit

# Re-sync from Orthanc
cd server
node auto-sync-simple.js
# Wait for "✅ Created 266 instance records from 3 series"
# Ctrl+C

# Restart backend
npm start
```

## If Database Has Different Orthanc IDs

Backend filtering ka problem hai. Backend terminal logs share karo:

```
[MIGRATION SERVICE] Series UID: ???
🎯 Migration Service: Filtering by series ???
📊 Migration Service: Found ??? instances
```

## Quick Check

```bash
# Terminal 1
cd server
node check-instance-data.js

# If database is good, check backend logs
# Terminal 2
cd server
npm start
# Watch for [MIGRATION SERVICE] logs

# Terminal 3
cd server
node test-series-backend.js
```

## Next Steps

1. ✅ Run `node check-instance-data.js`
2. ✅ Share output
3. ✅ If database problem, re-sync
4. ✅ If backend problem, share backend terminal logs

This will identify the exact issue!
