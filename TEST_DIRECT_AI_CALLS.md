# Test Direct AI Service Calls

## Quick Test Commands

### 1. Check Services Running

```bash
# Check MedSigLIP (Port 5001)
curl http://localhost:5001/health

# Check MedGemma (Port 5002)
curl http://localhost:5002/health

# Check Backend (Port 8001)
curl http://localhost:8001/api/health
```

### 2. Test Direct Classification

```bash
# Test MedSigLIP with base64 image
curl -X POST http://localhost:5001/classify \
  -H "Content-Type: application/json" \
  -d '{
    "image": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "modality": "CT"
  }'
```

### 3. Test Direct Report Generation

```bash
# Test MedGemma with base64 image
curl -X POST http://localhost:5002/generate-report \
  -H "Content-Type: application/json" \
  -d '{
    "image": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "modality": "CT",
    "patient_age": "45",
    "patient_sex": "M",
    "clinical_history": "Routine examination"
  }'
```

## What Changed

### Before (Backend Proxy)
```
Frontend → /api/ai/analyze → Backend (8001) → AI Services → Backend → Frontend
```

### Now (Direct Calls)
```
Frontend → http://localhost:5001/classify → MedSigLIP → Frontend
Frontend → http://localhost:5002/generate-report → MedGemma → Frontend
```

## Expected Console Output

### When Analysis Starts
```
🚀 Auto-triggering analysis...
🔬 Analyzing slice 0 for study 1.2.3.4...
📊 Calling MedSigLIP for slice 0...
```

### MedSigLIP Response
```
✅ MedSigLIP result: {
  classification: "fracture",
  confidence: 0.72,
  processing_time: 0.207,
  demo_mode: true,
  image_features: {
    brightness: 128.5,
    contrast: 45.2,
    entropy: 6.8,
    edge_density: 12.3
  }
}
```

### MedGemma Response
```
📝 Calling MedGemma for slice 0...
✅ MedGemma result: {
  findings: "TECHNIQUE:\nCT imaging was performed...",
  impression: "Fracture identified. Clinical correlation recommended.",
  recommendations: [
    "Clinical correlation recommended",
    "Consider follow-up imaging in 4-6 weeks",
    "Radiologist review required"
  ],
  confidence: 0.72,
  processing_time: 1.007,
  demo_mode: true
}
```

### Analysis Complete
```
✅ Slice 0 analysis complete: analysis-1729612345-0
```

## Browser Network Tab

You should see these requests:

1. **GET** `http://localhost:8001/api/dicom/studies/{uid}/frames/0`
   - Status: 200
   - Type: image/png

2. **POST** `http://localhost:5001/classify`
   - Status: 200
   - Type: application/json
   - Response: Classification data

3. **POST** `http://localhost:5002/generate-report`
   - Status: 200
   - Type: application/json
   - Response: Report data

## Troubleshooting

### Issue: CORS Error
```
Access to fetch at 'http://localhost:5001/classify' from origin 'http://localhost:3010' 
has been blocked by CORS policy
```

**Solution**: Both AI services have CORS enabled. Check if services are running:
```bash
curl http://localhost:5001/health
curl http://localhost:5002/health
```

### Issue: Connection Refused
```
Failed to fetch: net::ERR_CONNECTION_REFUSED
```

**Solution**: Start AI services:
```bash
cd ai-services
python medsigclip_server.py  # Terminal 1
python medgemma_server.py     # Terminal 2
```

### Issue: Frame Not Found
```
Failed to fetch frame image
```

**Solution**: 
1. Ensure backend is running on port 8001
2. Study must be loaded in viewer first
3. Check if frame exists in Orthanc

### Issue: Base64 Decode Error
```
Error: Invalid base64 string
```

**Solution**: The blob to base64 conversion is handled automatically. Check browser console for actual error.

## Data Flow

### Step 1: Get Frame (Backend)
```javascript
GET /api/dicom/studies/{studyUID}/frames/{index}
→ Returns: PNG image blob
```

### Step 2: Convert to Base64
```javascript
const base64 = await blobToBase64(frameBlob)
→ Returns: "iVBORw0KGgoAAAANS..."
```

### Step 3: Call MedSigLIP
```javascript
POST http://localhost:5001/classify
Body: { image: base64, modality: "CT" }
→ Returns: { classification, confidence, ... }
```

### Step 4: Call MedGemma
```javascript
POST http://localhost:5002/generate-report
Body: { image: base64, modality: "CT", patient_age, ... }
→ Returns: { findings, impression, recommendations, ... }
```

### Step 5: Combine Results
```javascript
{
  classification: { label, confidence, ... },
  report: { findings, impression, ... },
  combined: { summary, fullReport }
}
```

## Testing in UI

1. **Start All Services**
   ```bash
   # Terminal 1: AI Services
   cd ai-services
   python medsigclip_server.py
   
   # Terminal 2: AI Services
   cd ai-services
   python medgemma_server.py
   
   # Terminal 3: Backend
   cd server
   npm start
   
   # Terminal 4: Frontend
   cd viewer
   npm run dev
   ```

2. **Open Viewer**
   - Go to http://localhost:3010
   - Login
   - Open a study

3. **Run Analysis**
   - Click "AI Analysis" button
   - Select "Analyze All Slices" or "Analyze Current Slice"
   - Watch browser console for direct API calls

4. **Check Results**
   - See slice chips turn green as analysis completes
   - Click green chips to download reports
   - Check downloaded text files for AI results

## Success Indicators

✅ Health check shows all services online
✅ Console shows direct calls to ports 5001 and 5002
✅ Network tab shows requests to localhost:5001 and localhost:5002
✅ Analysis completes with real AI responses
✅ Reports contain actual findings from AI models
✅ No requests going through port 8001 for AI analysis

## Summary

Ab system directly AI services ko call kar raha hai:
- ✅ Port 5001 → MedSigLIP classification
- ✅ Port 5002 → MedGemma report generation
- ✅ Base64 image encoding
- ✅ JSON request/response format
- ✅ CORS enabled
- ✅ Real-time AI responses

**Bilkul pehle jaisa - direct AI integration!** 🚀
