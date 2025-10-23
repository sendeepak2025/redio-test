# 🚀 Quick Start - Direct AI Integration

## ⚡ 3-Minute Setup

### Step 1: Start AI Services (2 terminals)

```bash
# Terminal 1
cd ai-services
python medsiglip_server.py

# Terminal 2
cd ai-services
python medgemma_server.py
```

### Step 2: Start Backend

```bash
cd server
npm start
```

### Step 3: Start Frontend

```bash
cd viewer
npm run dev
```

### Step 4: Test

1. Open `http://localhost:5173`
2. Load DICOM study
3. Click "AI Analysis"
4. Watch console for direct calls

## ✅ Success Indicators

### Console Should Show:
```
🔍 MedSigLIP (port 5001): ✅ Available
📝 MedGemma (port 5002): ✅ Available
📊 Calling MedSigLIP directly (port 5001)...
✅ MedSigLIP: [Result]
📝 Calling MedGemma directly (port 5002)...
✅ MedGemma: Report generated
```

### Network Tab Should Show:
- `POST http://localhost:5001/classify` - 200 OK
- `POST http://localhost:5002/generate-report` - 200 OK
- `POST /api/ai/save-analysis` - 200 OK

## 🔍 Quick Verify

```bash
# Check all services
curl http://localhost:5001/health  # MedSigLIP
curl http://localhost:5002/health  # MedGemma
curl http://localhost:8001/health  # Backend
```

## 🎯 What's Different

### ❌ Old (Dummy)
```
Frontend → Backend → Fake Data
```

### ✅ New (Real)
```
Frontend → MedSigLIP (5001) → Real Classification
        → MedGemma (5002)   → Real Report
        → Backend           → Save to DB
```

## 📊 Expected Result

```javascript
{
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
```

## 🐛 Quick Fixes

### Service Not Running?
```bash
netstat -an | findstr ":5001 :5002"
```

### CORS Error?
Check AI services allow `http://localhost:5173`

### Canvas Not Found?
Load DICOM image first

## 📚 Full Documentation

- `AI_DIRECT_FLOW_IMPLEMENTATION.md` - Technical details
- `TEST_DIRECT_AI_FLOW.md` - Complete testing guide
- `AI_FLOW_DIAGRAM.md` - Visual diagrams
- `DIRECT_AI_INTEGRATION_COMPLETE.md` - Summary

---

**Ready in 3 minutes!** 🚀
