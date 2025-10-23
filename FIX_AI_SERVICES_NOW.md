# Fix AI Services - Get Real Results! 🚀

## Problem

You're seeing this in the consolidated report:
```
Classification: N/A
Confidence: 0.00%
Most Common Finding: unknown
```

**Reason:** AI services (MedSigLIP & MedGemma) are NOT running!

## Solution - Start AI Services

### Quick Fix (Windows)

```bash
# 1. Open terminal in ai-services folder
cd ai-services

# 2. Run the batch file
start-ai-services.bat
```

This will open 2 windows:
- Window 1: MedSigLIP (Port 5001)
- Window 2: MedGemma (Port 5002)

**Keep both windows open!**

### Manual Start (If batch file doesn't work)

```bash
# Terminal 1
cd ai-services
python medsigclip_server.py

# Terminal 2
cd ai-services
python medgemma_server.py
```

## Verify Services Are Running

### Check Health
```bash
curl http://localhost:5001/health
curl http://localhost:5002/health
```

### Expected Output
```
✅ MedSigLIP Server running on http://localhost:5001
✅ MedGemma Server running on http://localhost:5002
```

## Restart Backend (Important!)

After starting AI services, restart the backend:

```bash
cd server
npm restart
```

Or just stop and start:
```bash
# Press Ctrl+C to stop
# Then:
npm start
```

## Test in Viewer

1. Open viewer: http://localhost:3010
2. Open a study
3. Click "AI Analysis"
4. Select "Analyze All Slices"

### What You Should See

**Console Output:**
```
🤖 Calling BOTH AI models for integrated analysis...
📊 Calling MedSigLIP...
✅ MedSigLIP: fracture (72.0%)
📝 Calling MedGemma...
✅ MedGemma: Report generated
✅ AI analysis complete using: MedSigLIP, MedGemma
```

**In Report:**
```
Classification: fracture
Confidence: 72.0%
Most Common Finding: fracture
Average Confidence: 72.0%
```

## If Still Not Working

### 1. Check if Python is installed
```bash
python --version
# Should show: Python 3.7 or higher
```

### 2. Install dependencies
```bash
cd ai-services
pip install flask flask-cors pillow numpy
```

### 3. Check if ports are free
```bash
netstat -ano | findstr :5001
netstat -ano | findstr :5002
```

If ports are in use, kill the processes:
```bash
# Find PID from netstat output
taskkill /PID <PID> /F
```

### 4. Check firewall
Make sure Windows Firewall allows Python to use ports 5001 and 5002.

## Complete Restart Procedure

If nothing works, do a complete restart:

```bash
# 1. Kill all processes
taskkill /F /IM python.exe
taskkill /F /IM node.exe

# 2. Start AI services
cd ai-services
start-ai-services.bat

# 3. Wait 5 seconds
timeout /t 5

# 4. Start backend
cd server
npm start

# 5. Start frontend (new terminal)
cd viewer
npm run dev
```

## How to Know It's Working

### Backend Console Should Show:
```
🤖 Calling BOTH AI models for integrated analysis...
   MedSigLIP: http://localhost:5001/classify
   MedGemma: http://localhost:5002/generate-report
📊 Calling MedSigLIP...
✅ MedSigLIP: fracture (72.0%)
📝 Calling MedGemma...
✅ MedGemma: Report generated
✅ AI analysis complete using: MedSigLIP, MedGemma
```

### Analysis Response Should Show:
```json
{
  "aiStatus": {
    "status": "full",
    "message": "Both AI services operational",
    "servicesUsed": ["MedSigLIP", "MedGemma"]
  },
  "classification": {
    "label": "fracture",
    "confidence": 0.72
  },
  "report": {
    "findings": "TECHNIQUE:\nCT imaging...",
    "impression": "Fracture identified..."
  }
}
```

### Consolidated Report Should Show:
```
Classification: fracture
Confidence: 72.0%
Most Common Finding: fracture (12 slices)
Average Confidence: 68.5%
```

## Why This Happens

The system has 3 layers:

1. **AI Services** (Ports 5001, 5002) - Generate actual results
2. **Backend** (Port 8001) - Orchestrates AI calls
3. **Frontend** (Port 3010) - Shows results

If AI services are not running:
- Backend still works ✅
- Frontend still works ✅
- But results are empty ❌

**You MUST start AI services to get real results!**

## Quick Test

```bash
# Test if services are responding
curl -X POST http://localhost:5001/classify ^
  -H "Content-Type: application/json" ^
  -d "{\"image\":\"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==\",\"modality\":\"CT\"}"
```

**Expected Response:**
```json
{
  "classification": "fracture",
  "confidence": 0.72,
  "processing_time": 0.207,
  "demo_mode": true
}
```

**If you get "Connection refused":**
→ AI services are NOT running! Start them now!

## Summary

To get REAL AI results instead of "N/A":

1. ✅ Start MedSigLIP: `python medsigclip_server.py`
2. ✅ Start MedGemma: `python medgemma_server.py`
3. ✅ Restart backend: `npm restart`
4. ✅ Test analysis in viewer

**That's it! Ab actual AI se results aayenge!** 🎯

---

**Current Status Check:**
```bash
# Run this to see current status
curl http://localhost:5001/health 2>nul && echo MedSigLIP: RUNNING || echo MedSigLIP: NOT RUNNING
curl http://localhost:5002/health 2>nul && echo MedGemma: RUNNING || echo MedGemma: NOT RUNNING
```
