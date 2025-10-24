# 🔍 Get Backend Terminal Logs

## Database is CORRECT ✅

Database check showed:
- ✅ All instances have unique Orthanc IDs
- ✅ Each series has different first instance
- ✅ SCOUT: a973acea-9683...
- ✅ Pre Contrast Chest: 0145ebbe-d109...
- ✅ lung: 02bda789-43a7...

**Problem:** Backend is NOT filtering by series!

## Get Backend Logs

### Step 1: Stop Backend
In backend terminal:
```
Ctrl + C
```

### Step 2: Start Backend with Fresh Logs
```bash
cd server
npm start
```

Wait for:
```
✅ Connected to MongoDB
🚀 Server running on port 8001
```

### Step 3: Run Test (New Terminal)
```bash
cd server
node test-series-backend.js
```

### Step 4: Check Backend Terminal

You MUST see these logs:

```
🎯 SERIES-SPECIFIC ROUTE HIT: { 
  studyUid: '...885',
  seriesUid: '...888',
  frameIndex: '0'
}

═══════════════════════════════════════════════════════
[MIGRATION SERVICE] Frame request received
[MIGRATION SERVICE] Study UID: ...885
[MIGRATION SERVICE] Series UID: ...888
[MIGRATION SERVICE] Frame Index: 0
═══════════════════════════════════════════════════════

🎯 Migration Service: Filtering by series ...888
📊 Migration Service: Found 2 instances
```

### If You DON'T See These Logs:

**Scenario 1: No logs at all**
- Backend is not receiving requests
- Check if backend is running on port 8001
- Check test script is using correct port

**Scenario 2: See "⚠️ LEGACY ROUTE HIT"**
```
⚠️ LEGACY ROUTE HIT (no series filter): {
  studyUid: '...885',
  frameIndex: '0'
}
```
- Route order is wrong
- Series-specific route is not matching

**Scenario 3: See "[MIGRATION SERVICE] Series UID: NOT PROVIDED"**
```
[MIGRATION SERVICE] Series UID: NOT PROVIDED
⚠️ Migration Service: NO series filter
📊 Migration Service: Found 266 instances
```
- Route is not passing seriesUid to migration service
- req.params.seriesUid is undefined

## What to Share

Copy and paste from backend terminal:
1. All logs that appear when you run the test
2. Specifically look for:
   - `🎯 SERIES-SPECIFIC ROUTE HIT`
   - `[MIGRATION SERVICE]` logs
   - `⚠️ LEGACY ROUTE HIT`

## Quick Commands

```bash
# Terminal 1 - Backend
cd server
# Ctrl+C to stop
npm start

# Terminal 2 - Test (wait 5 seconds)
cd server
node test-series-backend.js

# Terminal 1 - Copy all logs and share
```

## Expected vs Actual

### Expected (GOOD):
```
🎯 SERIES-SPECIFIC ROUTE HIT
[MIGRATION SERVICE] Series UID: ...888
🎯 Migration Service: Filtering by series ...888
📊 Migration Service: Found 2 instances
```

### Actual (BAD - what we're seeing):
```
??? (No logs or wrong logs)
```

**Share backend terminal logs!** This will show exactly what's happening.
