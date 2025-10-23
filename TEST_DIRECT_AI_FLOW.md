# 🧪 Test Direct AI Flow - Quick Guide

## ✅ What Changed

The AI analysis now **directly calls** MedSigLIP (port 5001) and MedGemma (port 5002) from the frontend, processes the results, and saves them to the database. **No more dummy responses!**

## 🚀 Quick Start

### Step 1: Start AI Services

Open **two separate terminals**:

#### Terminal 1 - MedSigLIP (Classification)
```bash
cd ai-services
python medsiglip_server.py
```

You should see:
```
🚀 MedSigLIP server starting on port 5001...
✅ Server ready!
```

#### Terminal 2 - MedGemma (Report Generation)
```bash
cd ai-services
python medgemma_server.py
```

You should see:
```
🚀 MedGemma server starting on port 5002...
✅ Server ready!
```

### Step 2: Verify Services Are Running

```bash
# Check MedSigLIP
curl http://localhost:5001/health

# Check MedGemma
curl http://localhost:5002/health
```

Both should return `200 OK` with health status.

### Step 3: Start Backend Server

```bash
cd server
npm start
```

### Step 4: Start Frontend

```bash
cd viewer
npm run dev
```

### Step 5: Test the Flow

1. **Open browser** to `http://localhost:5173`
2. **Login** to the system
3. **Load a DICOM study**
4. **Click "AI Analysis"** button
5. **Watch the console** (F12) for:
   ```
   🔍 MedSigLIP (port 5001): ✅ Available
   📝 MedGemma (port 5002): ✅ Available
   🔬 Analyzing slice 0...
   📊 Calling MedSigLIP directly (port 5001)...
   ✅ MedSigLIP: [Classification Result]
   📝 Calling MedGemma directly (port 5002)...
   ✅ MedGemma: Report generated
   ✅ Analysis complete!
   ```

## 🔍 What to Look For

### In Browser Console (F12)

✅ **Good Signs:**
- "MedSigLIP (port 5001): ✅ Available"
- "MedGemma (port 5002): ✅ Available"
- "Calling MedSigLIP directly..."
- "Calling MedGemma directly..."
- Classification results with confidence scores
- Report with findings and impressions

❌ **Bad Signs:**
- "MedSigLIP connection failed"
- "MedGemma connection failed"
- "Both AI services unavailable"
- "Analysis failed"

### In Network Tab (F12 → Network)

You should see **direct calls** to:
- `http://localhost:5001/classify` - Status 200
- `http://localhost:5002/generate-report` - Status 200
- `/api/ai/save-analysis` - Status 200

### In AI Services Terminals

**MedSigLIP terminal:**
```
📥 Received classification request
🔍 Processing image...
✅ Classification: Pneumonia (confidence: 0.92)
```

**MedGemma terminal:**
```
📥 Received report generation request
📝 Generating report...
✅ Report generated (2.5s)
```

## 🎯 Expected Results

### AutoAnalysisPopup Should Show:

1. **Health Status**: "All services operational" (green)
2. **Progress Bar**: 0% → 100%
3. **Slice Status**: "Complete" with green checkmark
4. **Download Button**: Available for PDF report

### Database Should Contain:

```javascript
{
  analysisId: "AI-2025-10-22-ABC123",
  studyInstanceUID: "1.2.3.4...",
  frameIndex: 0,
  status: "complete",
  results: {
    classification: {
      label: "Pneumonia",
      confidence: 0.92,
      model: "MedSigLIP"
    },
    report: {
      findings: "Consolidation in right lower lobe...",
      impression: "Findings consistent with pneumonia",
      model: "MedGemma"
    },
    aiStatus: {
      status: "full",
      servicesUsed: ["MedSigLIP", "MedGemma"]
    }
  }
}
```

## 🐛 Troubleshooting

### Problem: "MedSigLIP connection failed"

**Solution:**
```bash
# Check if port 5001 is in use
netstat -an | findstr :5001

# If nothing, start MedSigLIP
cd ai-services
python medsiglip_server.py
```

### Problem: "MedGemma connection failed"

**Solution:**
```bash
# Check if port 5002 is in use
netstat -an | findstr :5002

# If nothing, start MedGemma
cd ai-services
python medgemma_server.py
```

### Problem: "CORS error"

**Solution:**
Check that AI services allow CORS from frontend origin. Add to Python servers:
```python
from flask_cors import CORS
CORS(app, origins=['http://localhost:5173'])
```

### Problem: "CSP violation"

**Solution:**
Already fixed! `viewer/index.html` includes:
```html
connect-src 'self' http://localhost:8001 http://localhost:5001 http://localhost:5002
```

### Problem: "Canvas not found"

**Solution:**
Make sure you're on the viewer page with an image loaded before triggering analysis.

## 📊 Test Scenarios

### Scenario 1: Both Services Available ✅
- **Expected**: Full analysis with classification + report
- **Status**: "full"
- **Services Used**: ["MedSigLIP", "MedGemma"]

### Scenario 2: Only MedSigLIP Available ⚠️
- **Expected**: Classification only, no report
- **Status**: "partial"
- **Services Used**: ["MedSigLIP"]
- **Warning**: "MedGemma unavailable"

### Scenario 3: Only MedGemma Available ⚠️
- **Expected**: Report only, no classification
- **Status**: "partial"
- **Services Used**: ["MedGemma"]
- **Warning**: "MedSigLIP unavailable"

### Scenario 4: No Services Available ❌
- **Expected**: Analysis fails immediately
- **Status**: "failed"
- **Error**: "Both AI services unavailable"

## 🎉 Success Criteria

✅ Health check shows both services available
✅ Console shows direct API calls to ports 5001 & 5002
✅ Classification result appears with confidence score
✅ Report appears with findings and impression
✅ Combined analysis shows model agreement
✅ Results saved to database with unique ID
✅ PDF download works with real AI data
✅ No dummy/placeholder text in results

## 📝 Quick Commands

```bash
# Check all ports
netstat -an | findstr ":5001 :5002 :8001"

# Test MedSigLIP
curl http://localhost:5001/health

# Test MedGemma
curl http://localhost:5002/health

# View backend logs
cd server
npm start

# View frontend logs
cd viewer
npm run dev
```

## 🔗 Related Documentation

- `AI_DIRECT_FLOW_IMPLEMENTATION.md` - Complete technical details
- `ACTIVATE_REAL_AI_NOW.md` - AI services setup guide
- `AI_QUICK_START.txt` - General AI setup

---

**Ready to test?** Start the AI services and watch the magic happen! 🚀
