# Test: AI Services Required (No Fallback)

## Purpose
Verify that analysis FAILS when AI services are not running (no hardcoded/demo data).

---

## Test 1: AI Services NOT Running

### Step 1: Stop AI Services
```bash
# Kill all Python processes
taskkill /F /IM python.exe

# Verify services are down
curl http://localhost:5001/health
# Should fail: Connection refused

curl http://localhost:5002/health
# Should fail: Connection refused
```

### Step 2: Restart Backend (IMPORTANT!)
```bash
cd server
npm restart
```

**Why restart?** Backend needs to reload the updated code with the fix.

### Step 3: Test Analysis
```bash
# Test single analysis
curl -X POST http://localhost:8001/api/ai/analyze ^
  -H "Content-Type: application/json" ^
  -d "{\"type\":\"single\",\"studyInstanceUID\":\"1.2.3.4\",\"frameIndex\":0}"
```

### Expected Response (AI Services Down)
```json
{
  "success": false,
  "analysisId": "AI-2025-10-22-ABC123",
  "status": "failed",
  "error": "AI services not available. Please start MedSigLIP (port 5001) and MedGemma (port 5002).",
  "message": "Analysis failed. Please ensure AI services are running."
}
```

### Expected Backend Console Output
```
🤖 Calling BOTH AI models for integrated analysis...
   MedSigLIP: http://localhost:5001/classify
   MedGemma: http://localhost:5002/generate-report
📊 Calling MedSigLIP...
❌ MedSigLIP failed: connect ECONNREFUSED 127.0.0.1:5001
   → MedSigLIP service not running on port 5001
📝 Calling MedGemma...
❌ MedGemma failed: connect ECONNREFUSED 127.0.0.1:5002
   → MedGemma service not running on port 5002
❌ AI services not available - analysis cannot proceed
❌ Single image analysis failed: AI services not available
```

### Expected Frontend Behavior
```
Slice Analysis Status:
[0❌] [1❌] [2❌] ...

Error: AI services not available. Please start MedSigLIP and MedGemma.
```

---

## Test 2: AI Services Running

### Step 1: Start AI Services
```bash
cd ai-services
python medsigclip_server.py  # Terminal 1
python medgemma_server.py     # Terminal 2
```

### Step 2: Verify Services Running
```bash
curl http://localhost:5001/health
# Should return: {"status": "healthy", ...}

curl http://localhost:5002/health
# Should return: {"status": "healthy", ...}
```

### Step 3: Restart Backend
```bash
cd server
npm restart
```

### Step 4: Test Analysis
```bash
curl -X POST http://localhost:8001/api/ai/analyze ^
  -H "Content-Type: application/json" ^
  -d "{\"type\":\"single\",\"studyInstanceUID\":\"1.2.3.4\",\"frameIndex\":0}"
```

### Expected Response (AI Services Running)
```json
{
  "success": true,
  "analysisId": "AI-2025-10-22-ABC123",
  "status": "complete",
  "results": {
    "classification": {
      "label": "fracture",
      "confidence": 0.72,
      "model": "MedSigLIP"
    },
    "report": {
      "findings": "TECHNIQUE:\nCT imaging...",
      "impression": "Fracture identified...",
      "model": "MedGemma"
    },
    "aiStatus": {
      "status": "full",
      "message": "Both AI services operational",
      "servicesUsed": ["MedSigLIP", "MedGemma"]
    }
  }
}
```

### Expected Backend Console Output
```
🤖 Calling BOTH AI models for integrated analysis...
   MedSigLIP: http://localhost:5001/classify
   MedGemma: http://localhost:5002/generate-report
📊 Calling MedSigLIP...
✅ MedSigLIP: fracture (72.0%)
📝 Calling MedGemma...
✅ MedGemma: Report generated
✅ AI analysis complete using: MedSigLIP, MedGemma
✅ Single image analysis complete: AI-2025-10-22-ABC123
   AI services used: MedSigLIP, MedGemma
```

### Expected Frontend Behavior
```
Slice Analysis Status:
[0✅] [1✅] [2✅] ...

Overall Progress: 100%
3 of 3 slices analyzed
```

---

## Troubleshooting

### Issue: Still Getting Results When Services Are Down

**Possible Causes:**

1. **Backend Not Restarted**
   ```bash
   # Solution: Restart backend
   cd server
   npm restart
   ```

2. **Using Old/Cached Code**
   ```bash
   # Solution: Clear and restart
   cd server
   npm run clean  # If available
   npm restart
   ```

3. **Different Route Being Used**
   - Check if code is using `/api/medical-ai/analyze-study` instead of `/api/ai/analyze`
   - AutoAnalysisService should use `/api/ai/analyze`

4. **Browser Cache**
   ```bash
   # Solution: Hard refresh
   Ctrl + Shift + R (Windows)
   Cmd + Shift + R (Mac)
   ```

### Issue: Backend Shows Old Console Output

**Solution:**
```bash
# Stop backend completely
taskkill /F /IM node.exe

# Start fresh
cd server
npm start
```

### Issue: Services Start But Immediately Crash

**Check:**
```bash
# View Python errors
cd ai-services
python medsigclip_server.py 2>&1 | more
```

Common issues:
- Port already in use
- Missing dependencies
- Python version incompatibility

---

## Verification Checklist

### ✅ When AI Services Are Down:
- [ ] Analysis returns `success: false`
- [ ] Status is `failed`
- [ ] Error message mentions AI services
- [ ] No classification data in response
- [ ] No report data in response
- [ ] Backend console shows ECONNREFUSED errors
- [ ] Frontend shows red error chips

### ✅ When AI Services Are Running:
- [ ] Analysis returns `success: true`
- [ ] Status is `complete`
- [ ] Classification data present
- [ ] Report data present
- [ ] aiStatus shows `servicesUsed: ['MedSigLIP', 'MedGemma']`
- [ ] Backend console shows successful AI calls
- [ ] Frontend shows green success chips

---

## Quick Test Script

Save as `test-ai-required.bat`:

```batch
@echo off
echo ========================================
echo Testing AI Services Requirement
echo ========================================
echo.

echo Step 1: Stopping AI services...
taskkill /F /IM python.exe 2>nul
timeout /t 2 /nobreak >nul

echo Step 2: Testing analysis (should FAIL)...
curl -X POST http://localhost:8001/api/ai/analyze ^
  -H "Content-Type: application/json" ^
  -d "{\"type\":\"single\",\"studyInstanceUID\":\"test\",\"frameIndex\":0}"
echo.
echo.

echo Step 3: Starting AI services...
cd ai-services
start /B python medsigclip_server.py
start /B python medgemma_server.py
cd ..
timeout /t 5 /nobreak >nul

echo Step 4: Testing analysis (should SUCCEED)...
curl -X POST http://localhost:8001/api/ai/analyze ^
  -H "Content-Type: application/json" ^
  -d "{\"type\":\"single\",\"studyInstanceUID\":\"test\",\"frameIndex\":0}"
echo.
echo.

echo ========================================
echo Test Complete
echo ========================================
pause
```

---

## Summary

After the fix:

- ❌ **AI services down** → Analysis FAILS with error
- ✅ **AI services running** → Analysis succeeds with real data
- 🚫 **No fallback/demo data** → Only real AI results or failure

**Key Point:** Backend MUST be restarted after code changes!

```bash
cd server
npm restart
```

Then test again.
