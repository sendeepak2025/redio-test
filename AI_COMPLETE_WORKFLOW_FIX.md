# 🎯 Complete AI Workflow - Zero Error Design

## Current Problems Identified:

1. ❌ Frontend calls AI services directly (bypasses backend)
2. ❌ No proper routing - multiple paths doing same thing
3. ❌ Results not saved to database
4. ❌ No distinction between single image vs multi-slice
5. ❌ Error handling incomplete
6. ❌ No retry logic
7. ❌ No progress tracking
8. ❌ Miscommunication between components

---

## ✅ NEW ARCHITECTURE - Single Source of Truth

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User Action: "Analyze with AI"                             │
│       ↓                                                      │
│  AIAnalysisService (NEW - Single Entry Point)               │
│       ↓                                                      │
│  Determines: Single Image OR Multi-Slice                    │
│       ↓                                                      │
│  Calls Backend API (ONLY ONE PATH)                          │
│       ↓                                                      │
└──────┼───────────────────────────────────────────────────────┘
       │
       │ HTTP POST
       │
┌──────▼───────────────────────────────────────────────────────┐
│                    BACKEND API LAYER                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Route: POST /api/medical-ai/analyze                        │
│       ↓                                                      │
│  Controller: Validates request                              │
│       ↓                                                      │
│  Service: Routes to correct handler                         │
│       ├─→ Single Image Handler                              │
│       └─→ Multi-Slice Handler                               │
│                                                              │
└──────┼───────────────────────────────────────────────────────┘
       │
       │
┌──────▼───────────────────────────────────────────────────────┐
│                   AI PROCESSING LAYER                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Get Image from Orthanc                                  │
│  2. Call AI Services (5001, 5002)                           │
│  3. Generate Report                                         │
│  4. Save to Database                                        │
│  5. Return Results                                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 IMPLEMENTATION PLAN

### Phase 1: Create Unified API Endpoint
### Phase 2: Create Frontend Service
### Phase 3: Update Components
### Phase 4: Add Error Handling
### Phase 5: Add Progress Tracking

---

## Files to Create/Update:

1. ✅ `server/src/routes/ai-analysis.js` - NEW unified route
2. ✅ `server/src/controllers/aiAnalysisController.js` - NEW controller
3. ✅ `server/src/services/ai-analysis-orchestrator.js` - NEW orchestrator
4. ✅ `viewer/src/services/AIAnalysisService.ts` - NEW frontend service
5. ✅ Update `MedicalImageViewer.tsx` - Remove direct calls
6. ✅ Update `AIAnalysisPanel.tsx` - Use new service

---

## Detailed Workflow:

### Single Image Analysis:
```
1. User clicks "Analyze Current Frame"
   ↓
2. Frontend: AIAnalysisService.analyzeSingleImage()
   ↓
3. POST /api/medical-ai/analyze
   Body: {
     type: "single",
     studyInstanceUID: "...",
     seriesInstanceUID: "...",
     instanceUID: "...",
     frameIndex: 0
   }
   ↓
4. Backend: aiAnalysisController.analyze()
   ↓
5. Orchestrator: handleSingleImage()
   - Fetch image from Orthanc
   - Call MedSigLIP (classification)
   - Call MedGemma (report)
   - Generate comprehensive report
   - Save to database
   ↓
6. Return: {
     success: true,
     analysisId: "...",
     results: { ... },
     savedAt: "..."
   }
   ↓
7. Frontend: Display results + Save indicator
```

### Multi-Slice Analysis:
```
1. User clicks "Analyze All Slices"
   ↓
2. Frontend: AIAnalysisService.analyzeMultiSlice()
   ↓
3. POST /api/medical-ai/analyze
   Body: {
     type: "multi-slice",
     studyInstanceUID: "...",
     seriesInstanceUID: "...",
     frameCount: 17,
     sampleRate: 1 // analyze every frame
   }
   ↓
4. Backend: aiAnalysisController.analyze()
   ↓
5. Orchestrator: handleMultiSlice()
   - Create analysis job
   - Process frames in batches
   - Aggregate results
   - Generate summary report
   - Save to database
   ↓
6. Return: {
     success: true,
     analysisId: "...",
     jobId: "...",
     status: "processing",
     progress: { current: 0, total: 17 }
   }
   ↓
7. Frontend: Poll for progress
   GET /api/medical-ai/analysis/{jobId}/status
   ↓
8. When complete: Display aggregated results
```

---

## Error Handling Strategy:

### Level 1: Frontend Validation
```typescript
- Check if study is loaded
- Check if image is available
- Check if already analyzing
- Prevent duplicate requests
```

### Level 2: Backend Validation
```javascript
- Validate request body
- Check if study exists in Orthanc
- Check if already analyzed (return cached)
- Rate limiting
```

### Level 3: AI Service Errors
```javascript
- Timeout handling (30s max)
- Retry logic (3 attempts)
- Fallback to demo mode
- Graceful degradation
```

### Level 4: Database Errors
```javascript
- Transaction rollback
- Retry save operation
- Log errors
- Return partial results
```

---

## Progress Tracking:

### Single Image:
```
States:
1. "Initializing..." (0%)
2. "Fetching image..." (20%)
3. "Classifying..." (40%)
4. "Generating report..." (60%)
5. "Saving results..." (80%)
6. "Complete!" (100%)
```

### Multi-Slice:
```
States:
1. "Initializing..." (0%)
2. "Processing frame 1/17..." (5%)
3. "Processing frame 2/17..." (11%)
...
17. "Aggregating results..." (95%)
18. "Complete!" (100%)
```

---

## API Specification:

### Endpoint 1: Analyze (Unified)
```
POST /api/medical-ai/analyze

Request Body:
{
  type: "single" | "multi-slice",
  studyInstanceUID: string,
  seriesInstanceUID?: string,
  instanceUID?: string,  // for single
  frameIndex?: number,    // for single
  frameCount?: number,    // for multi-slice
  sampleRate?: number,    // for multi-slice (1 = all, 2 = every other)
  options?: {
    forceReanalyze?: boolean,
    saveResults?: boolean,
    includeSnapshot?: boolean
  }
}

Response:
{
  success: boolean,
  analysisId: string,
  jobId?: string,  // for multi-slice
  status: "complete" | "processing" | "failed",
  results?: {
    classification: { ... },
    report: { ... },
    detections: [ ... ]
  },
  progress?: {
    current: number,
    total: number,
    percentage: number
  },
  error?: string
}
```

### Endpoint 2: Get Analysis Status
```
GET /api/medical-ai/analysis/{analysisId}/status

Response:
{
  analysisId: string,
  status: "processing" | "complete" | "failed",
  progress: {
    current: number,
    total: number,
    percentage: number,
    currentStep: string
  },
  results?: { ... },
  error?: string
}
```

### Endpoint 3: Get Saved Analysis
```
GET /api/medical-ai/study/{studyUID}/analysis

Response:
{
  studyInstanceUID: string,
  analyses: [
    {
      analysisId: string,
      type: "single" | "multi-slice",
      analyzedAt: string,
      frameIndex?: number,
      results: { ... }
    }
  ]
}
```

---

## Database Schema:

### Collection: `aiAnalyses`
```javascript
{
  _id: ObjectId,
  analysisId: "AI-2025-10-22-001",
  type: "single" | "multi-slice",
  
  // Study Reference
  studyInstanceUID: "1.2.3...",
  seriesInstanceUID: "1.2.3...",
  instanceUID: "1.2.3...",  // for single
  frameIndex: 0,             // for single
  
  // Status
  status: "processing" | "complete" | "failed",
  progress: {
    current: 5,
    total: 17,
    percentage: 29
  },
  
  // Results
  results: {
    classification: { ... },
    report: { ... },
    detections: [ ... ]
  },
  
  // Metadata
  analyzedAt: ISODate,
  completedAt: ISODate,
  aiModels: ["BiomedCLIP", "LLaVA-Med"],
  processingTime: 2.5,  // seconds
  
  // Error Info
  error: null,
  retryCount: 0
}
```

---

## Implementation Priority:

### CRITICAL (Do First):
1. Create unified backend endpoint
2. Create frontend service
3. Update MedicalImageViewer to use new service
4. Add basic error handling

### HIGH (Do Next):
5. Add progress tracking
6. Add result caching
7. Add retry logic
8. Update AIAnalysisPanel

### MEDIUM (Do Later):
9. Add batch processing for multi-slice
10. Add result comparison
11. Add export functionality
12. Add audit logging

---

## Testing Checklist:

### Single Image:
- [ ] Can analyze single frame
- [ ] Results are saved to database
- [ ] Can retrieve saved results
- [ ] Error handling works
- [ ] Progress indicator shows
- [ ] No duplicate analyses

### Multi-Slice:
- [ ] Can analyze all frames
- [ ] Progress updates correctly
- [ ] Results are aggregated
- [ ] Can cancel mid-process
- [ ] Memory doesn't leak
- [ ] Database saves correctly

### Error Cases:
- [ ] Network timeout handled
- [ ] AI service down handled
- [ ] Database error handled
- [ ] Invalid study handled
- [ ] Concurrent requests handled

---

## Next Steps:

1. **Implement Backend First** (most critical)
2. **Create Frontend Service** (connects to backend)
3. **Update Components** (use new service)
4. **Test Thoroughly** (all scenarios)
5. **Deploy** (with monitoring)

---

**Ready to implement? I'll start with the backend unified endpoint.**
