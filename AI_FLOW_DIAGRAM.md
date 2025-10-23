# 🔄 AI Analysis Flow Diagram

## New Direct Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                             │
│                     viewer/src/services/                             │
│                     AutoAnalysisService.ts                           │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ 1. User clicks "AI Analysis"
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Health Check (Direct)                           │
│  ┌──────────────────────┐        ┌──────────────────────┐          │
│  │  Check Port 5001     │        │  Check Port 5002     │          │
│  │  (MedSigLIP)         │        │  (MedGemma)          │          │
│  └──────────────────────┘        └──────────────────────┘          │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ 2. Both services available?
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Extract Image Data                              │
│  • Get canvas element                                                │
│  • Convert to base64                                                 │
│  • Fetch study metadata (modality, patient info)                    │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ 3. Image ready
                                  ▼
         ┌────────────────────────┴────────────────────────┐
         │                                                  │
         ▼                                                  ▼
┌──────────────────────┐                      ┌──────────────────────┐
│   MedSigLIP Server   │                      │   MedGemma Server    │
│   (Port 5001)        │                      │   (Port 5002)        │
│                      │                      │                      │
│ POST /classify       │                      │ POST /generate-report│
│                      │                      │                      │
│ Body:                │                      │ Body:                │
│ {                    │                      │ {                    │
│   image: base64,     │                      │   image: base64,     │
│   modality: "CT"     │                      │   modality: "CT",    │
│ }                    │                      │   patientContext: {} │
│                      │                      │ }                    │
└──────────────────────┘                      └──────────────────────┘
         │                                                  │
         │ 4. Classification                                │ 5. Report
         │    Result                                        │    Result
         ▼                                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Process & Combine Results                         │
│                                                                      │
│  Classification:                    Report:                          │
│  • Label: "Pneumonia"              • Findings: "Consolidation..."   │
│  • Confidence: 0.92                • Impression: "Consistent with..." │
│  • Top Predictions: [...]          • Recommendations: [...]          │
│  • Model: "MedSigLIP"              • Model: "MedGemma"              │
│                                                                      │
│  Combined Analysis:                                                  │
│  • Check model agreement                                            │
│  • Calculate combined confidence                                    │
│  • Determine overall status                                         │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ 6. Results processed
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Save to Database (Backend)                        │
│                                                                      │
│  POST /api/ai/save-analysis                                         │
│                                                                      │
│  Body:                                                               │
│  {                                                                   │
│    studyInstanceUID: "1.2.3.4...",                                  │
│    frameIndex: 0,                                                   │
│    results: {                                                       │
│      classification: {...},                                         │
│      report: {...},                                                 │
│      combined: {...},                                               │
│      aiStatus: {...}                                                │
│    }                                                                 │
│  }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ 7. Saved to MongoDB
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Database (MongoDB)                           │
│                                                                      │
│  Collection: aianalyses                                             │
│  {                                                                   │
│    analysisId: "AI-2025-10-22-ABC123",                             │
│    studyInstanceUID: "1.2.3.4...",                                 │
│    frameIndex: 0,                                                   │
│    status: "complete",                                              │
│    results: {...},                                                  │
│    analyzedAt: ISODate("2025-10-22T...")                           │
│  }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ 8. Analysis complete
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Display Results to User                         │
│                                                                      │
│  • Show classification with confidence                              │
│  • Show report findings and impression                              │
│  • Enable PDF download                                              │
│  • Display model agreement status                                   │
└─────────────────────────────────────────────────────────────────────┘
```

## Comparison: Old vs New Flow

### ❌ Old Flow (Dummy Responses)

```
Frontend → Backend (8001) → Dummy Data Generator → Frontend
                                    ↓
                            (No real AI processing)
```

**Problems:**
- Backend generated fake/dummy responses
- No actual AI model calls
- Results were placeholders
- No real medical analysis

### ✅ New Flow (Real AI Processing)

```
Frontend → MedSigLIP (5001) → Real Classification
        → MedGemma (5002)   → Real Report
        → Process Results
        → Backend (8001)    → Save to DB
```

**Benefits:**
- Direct calls to real AI models
- Actual medical image analysis
- Real classification and reports
- Transparent processing
- Faster response times

## Data Flow Details

### 1. Health Check Phase
```
Frontend
   ├─→ GET http://localhost:5001/health (MedSigLIP)
   └─→ GET http://localhost:5002/health (MedGemma)
```

### 2. Analysis Phase
```
Frontend
   ├─→ POST http://localhost:5001/classify
   │   Request: { image: base64, modality: "CT" }
   │   Response: { classification, confidence, top_predictions }
   │
   └─→ POST http://localhost:5002/generate-report
       Request: { image: base64, modality: "CT", patientContext }
       Response: { findings, impression, recommendations }
```

### 3. Storage Phase
```
Frontend
   └─→ POST http://localhost:8001/api/ai/save-analysis
       Request: { studyInstanceUID, frameIndex, results }
       Response: { analysisId, success }
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Health Check                                 │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
            ┌───────────┐  ┌───────────┐  ┌───────────┐
            │   Both    │  │   One     │  │   None    │
            │ Available │  │ Available │  │ Available │
            └───────────┘  └───────────┘  └───────────┘
                    │             │             │
                    ▼             ▼             ▼
            ┌───────────┐  ┌───────────┐  ┌───────────┐
            │   Full    │  │  Partial  │  │   Fail    │
            │ Analysis  │  │ Analysis  │  │ Analysis  │
            └───────────┘  └───────────┘  └───────────┘
                    │             │             │
                    ▼             ▼             ▼
            ┌───────────┐  ┌───────────┐  ┌───────────┐
            │  Status:  │  │  Status:  │  │  Status:  │
            │  "full"   │  │ "partial" │  │  "failed" │
            └───────────┘  └───────────┘  └───────────┘
```

## Timing Diagram

```
Time →
0ms     User clicks "AI Analysis"
        │
100ms   Health check starts
        ├─→ Check MedSigLIP (5001)
        └─→ Check MedGemma (5002)
        │
300ms   Health check complete
        │
400ms   Extract canvas image data
        │
500ms   Start parallel AI calls
        ├─→ MedSigLIP classification (150ms)
        └─→ MedGemma report (2500ms)
        │
650ms   MedSigLIP complete ✓
        │
3000ms  MedGemma complete ✓
        │
3100ms  Process & combine results
        │
3200ms  Save to database
        │
3300ms  Display results to user ✓
```

## Network Traffic

```
Browser Console:
┌────────────────────────────────────────────────────────────┐
│ 🔍 MedSigLIP (port 5001): ✅ Available                     │
│ 📝 MedGemma (port 5002): ✅ Available                      │
│ 🔬 Analyzing slice 0 for study 1.2.3.4...                 │
│ 📊 Calling MedSigLIP directly (port 5001)...              │
│ ✅ MedSigLIP: Pneumonia (92.3%)                           │
│ 📝 Calling MedGemma directly (port 5002)...               │
│ ✅ MedGemma: Report generated                             │
│ ✅ Slice 0 analysis complete: AI-2025-10-22-ABC123        │
└────────────────────────────────────────────────────────────┘

Network Tab:
┌────────────────────────────────────────────────────────────┐
│ Name                          Status    Time    Size        │
│ ────────────────────────────────────────────────────────── │
│ localhost:5001/health         200 OK    50ms    120 B      │
│ localhost:5002/health         200 OK    45ms    115 B      │
│ localhost:5001/classify       200 OK    150ms   2.1 KB     │
│ localhost:5002/generate-report 200 OK   2.5s    5.3 KB     │
│ /api/ai/save-analysis         200 OK    80ms    250 B      │
└────────────────────────────────────────────────────────────┘
```

## Security Considerations

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Content Security Policy (CSP)                     │
│                                                                      │
│  connect-src 'self'                                                 │
│              http://localhost:8001  ← Backend API                   │
│              http://localhost:5001  ← MedSigLIP                     │
│              http://localhost:5002  ← MedGemma                      │
│              ws: wss:               ← WebSockets                    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         CORS Configuration                           │
│                                                                      │
│  AI Services must allow:                                            │
│  • Origin: http://localhost:5173 (Frontend)                         │
│  • Methods: GET, POST                                               │
│  • Headers: Content-Type                                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

**Architecture Version**: 2.0 - Direct Flow
**Last Updated**: October 22, 2025
