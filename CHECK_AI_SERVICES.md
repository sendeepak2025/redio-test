# Check AI Services Status

## Quick Check Commands

### 1. Check if Services are Running

```bash
# Check MedSigLIP (Port 5001)
curl http://localhost:5001/health

# Check MedGemma (Port 5002)
curl http://localhost:5002/health
```

### 2. Check Processes

```powershell
# Windows - Check if Python processes are running
Get-Process python

# Check specific ports
netstat -ano | findstr :5001
netstat -ano | findstr :5002
```

### 3. Test Classification Directly

```bash
# Test MedSigLIP with dummy image
curl -X POST http://localhost:5001/classify ^
  -H "Content-Type: application/json" ^
  -d "{\"image\":\"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==\",\"modality\":\"CT\"}"
```

## Start AI Services

### Method 1: Batch File (Recommended)
```bash
cd ai-services
start-ai-services.bat
```

### Method 2: Manual Start
```bash
# Terminal 1
cd ai-services
python medsigclip_server.py

# Terminal 2  
cd ai-services
python medgemma_server.py
```

### Method 3: Background Processes
```bash
cd ai-services
start /B python medsigclip_server.py
start /B python medgemma_server.py
```

## Verify Services Started

### Expected Output - MedSigLIP
```
🚀 Starting MedSigLIP Server
   Mode: DEMO
   Device: cpu
   Port: 5001
   PyTorch: Not Available
   Cloud: Not Configured

✅ MedSigLIP Server running on http://localhost:5001
   Mode: DEMO
   Test with: curl http://localhost:5001/health

⚠️  DEMO MODE: Using enhanced image analysis (not real AI)
```

### Expected Output - MedGemma
```
🚀 Starting MedGemma Server
   Mode: DEMO
   Device: cpu
   Port: 5002
   PyTorch: Not Available
   Cloud: Not Configured

✅ MedGemma Server running on http://localhost:5002
   Mode: DEMO
   Test with: curl http://localhost:5002/health

⚠️  DEMO MODE: Using template-based reports (not real AI)
```

## Test Backend Integration

```bash
# Check backend can reach AI services
curl http://localhost:8001/api/medical-ai/health
```

### Expected Response
```json
{
  "success": true,
  "status": "healthy",
  "services": {
    "medsiglip": {
      "available": true,
      "url": "http://localhost:5001"
    },
    "medgemma": {
      "available": true,
      "url": "http://localhost:5002"
    }
  }
}
```

## Common Issues

### Issue 1: Port Already in Use
```
Error: [Errno 10048] error while attempting to bind on address ('0.0.0.0', 5001)
```

**Solution:**
```bash
# Find process using port
netstat -ano | findstr :5001

# Kill process (replace PID)
taskkill /PID <PID> /F

# Restart service
python medsigclip_server.py
```

### Issue 2: Python Not Found
```
'python' is not recognized as an internal or external command
```

**Solution:**
```bash
# Try py command
py medsigclip_server.py

# Or use full path
C:\Python39\python.exe medsigclip_server.py
```

### Issue 3: Module Not Found
```
ModuleNotFoundError: No module named 'flask'
```

**Solution:**
```bash
cd ai-services
pip install -r requirements.txt

# Or install manually
pip install flask flask-cors pillow numpy
```

### Issue 4: Services Start But Crash
```
Traceback (most recent call last):
  ...
```

**Solution:**
Check the full error message and ensure:
- Python version is 3.7+
- All dependencies installed
- No syntax errors in code

## Restart Everything

If things aren't working, restart in this order:

```bash
# 1. Stop everything
taskkill /F /IM python.exe
taskkill /F /IM node.exe

# 2. Start AI services
cd ai-services
start /B python medsigclip_server.py
start /B python medgemma_server.py

# Wait 5 seconds for services to start
timeout /t 5

# 3. Start backend
cd server
npm start

# 4. Start frontend
cd viewer
npm run dev
```

## Verify Analysis Works

### Test Single Analysis
```bash
curl -X POST http://localhost:8001/api/ai/analyze ^
  -H "Content-Type: application/json" ^
  -d "{\"type\":\"single\",\"studyInstanceUID\":\"1.2.3.4\",\"frameIndex\":0}"
```

### Expected Response (Services Running)
```json
{
  "success": true,
  "analysisId": "AI-2025-10-22-ABC123",
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
      "servicesUsed": ["MedSigLIP", "MedGemma"]
    }
  }
}
```

### Expected Response (Services NOT Running)
```json
{
  "success": true,
  "analysisId": "AI-2025-10-22-ABC123",
  "results": {
    "classification": null,
    "report": null,
    "aiStatus": {
      "status": "unavailable",
      "message": "AI services not available...",
      "servicesUsed": []
    }
  }
}
```

## Summary

To get REAL AI results:

1. ✅ **Start MedSigLIP** on port 5001
2. ✅ **Start MedGemma** on port 5002
3. ✅ **Verify health endpoints** return 200 OK
4. ✅ **Restart backend** to pick up services
5. ✅ **Test analysis** in viewer

If you see `"classification": null` in results, it means AI services are NOT running!

**Start them now:**
```bash
cd ai-services
python medsigclip_server.py  # Terminal 1
python medgemma_server.py     # Terminal 2
```
