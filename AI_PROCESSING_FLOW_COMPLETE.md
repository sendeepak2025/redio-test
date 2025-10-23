# Complete AI Processing Flow Documentation

## Overview

Ye document explain karta hai ki kaise analysis MedSigLIP aur MedGemma se process hota hai.

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  (viewer/src/services/AutoAnalysisService.ts)                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ POST /api/ai/analyze
                           │ { studyUID, frameIndex, ... }
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND CONTROLLER                            │
│  (server/src/controllers/aiAnalysisController.js)              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ orchestrator.analyzeSingleImage()
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   AI ANALYSIS ORCHESTRATOR                       │
│  (server/src/services/ai-analysis-orchestrator.js)             │
│                                                                  │
│  Step 1: Get image from Orthanc                                │
│  Step 2: Call MedSigLIP (Port 5001)                           │
│  Step 3: Call MedGemma (Port 5002)                            │
│  Step 4: Combine results                                       │
│  Step 5: Save to MongoDB                                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                ┌──────────┴──────────┐
                │                     │
                ▼                     ▼
┌─────────────────────┐   ┌─────────────────────┐
│   MedSigLIP         │   │   MedGemma          │
│   Port 5001         │   │   Port 5002         │
│                     │   │                     │
│   Classification    │   │   Report Generation │
│   • Label           │   │   • Findings        │
│   • Confidence      │   │   • Impression      │
│   • Top Predictions │   │   • Recommendations │
└─────────────────────┘   └─────────────────────┘
```

---

## Detailed Step-by-Step Process

### Step 1: Frontend Request

**File:** `viewer/src/services/AutoAnalysisService.ts`

```typescript
// User clicks "Analyze Slice 5"
const response = await fetch('/api/ai/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'single',
    studyInstanceUID: '1.3.12.2.1107...',
    seriesInstanceUID: '1.3.12.2.1107...',
    frameIndex: 5,
    options: {
      saveResults: true,
      includeSnapshot: true,
      forceReanalyze: false
    }
  })
});
```

### Step 2: Backend Controller

**File:** `server/src/controllers/aiAnalysisController.js`

```javascript
async analyze(req, res) {
  const { type, studyInstanceUID, frameIndex } = req.body;
  
  const orchestrator = getAIAnalysisOrchestrator();
  
  const result = await orchestrator.analyzeSingleImage({
    studyInstanceUID,
    seriesInstanceUID,
    instanceUID,
    frameIndex,
    options
  });
  
  res.json(result);
}
```

### Step 3: AI Orchestrator - Get Image

**File:** `server/src/services/ai-analysis-orchestrator.js`

```javascript
// Get DICOM image from Orthanc
const imageBuffer = await this.getImageFromOrthanc(instanceUID, frameIndex);

// imageBuffer is a Buffer containing PNG/JPEG image data
```

### Step 4: Call MedSigLIP (Classification)

```javascript
// Convert to base64
const imageBase64 = imageBuffer.toString('base64');

// Call MedSigLIP on port 5001
const classificationResponse = await axios.post(
  'http://localhost:5001/classify',
  {
    image: imageBase64,
    modality: 'CT'
  },
  { timeout: 30000 }
);

// Response from MedSigLIP:
{
  classification: 'fracture',
  confidence: 0.72,
  top_predictions: [
    { label: 'fracture', confidence: 0.72 },
    { label: 'normal', confidence: 0.15 },
    { label: 'mass', confidence: 0.08 }
  ],
  processing_time: 0.207,
  demo_mode: true,
  image_features: {
    brightness: 128.5,
    contrast: 45.2,
    entropy: 6.8
  }
}
```

### Step 5: Call MedGemma (Report Generation)

```javascript
// Call MedGemma on port 5002
const reportResponse = await axios.post(
  'http://localhost:5002/generate-report',
  {
    image: imageBase64,
    modality: 'CT',
    patientContext: {
      age: 45,
      sex: 'M',
      clinical_history: 'Routine examination'
    }
  },
  { timeout: 60000 }
);

// Response from MedGemma:
{
  findings: `TECHNIQUE:
CT imaging was performed according to standard protocol.

CLINICAL HISTORY:
Routine examination

FINDINGS:
There is increased opacity in the right upper lobe consistent with 
fracture. The cardiac silhouette is normal in size. No pleural 
effusion or pneumothorax identified.

Image quality is adequate for diagnostic interpretation.`,
  
  impression: 'Fracture identified. Clinical correlation recommended.',
  
  recommendations: [
    'Clinical correlation recommended',
    'Consider follow-up imaging in 4-6 weeks',
    'Radiologist review required'
  ],
  
  confidence: 0.72,
  processing_time: 1.007,
  demo_mode: true,
  patient_age: 45,
  patient_sex: 'M',
  modality: 'CT'
}
```

### Step 6: Combine Results

```javascript
const combinedResults = {
  // From MedSigLIP
  classification: {
    label: 'fracture',
    confidence: 0.72,
    topPredictions: [...],
    model: 'MedSigLIP',
    processingTime: 0.207,
    demoMode: true
  },
  
  // From MedGemma
  report: {
    findings: 'TECHNIQUE:\nCT imaging...',
    impression: 'Fracture identified...',
    recommendations: [...],
    model: 'MedGemma',
    processingTime: 1.007,
    demoMode: true
  },
  
  // Combined metadata
  combined: {
    modelsUsed: ['MedSigLIP', 'MedGemma'],
    agreement: {
      agree: true,
      confidence: 'HIGH',
      note: 'Both models detected same condition'
    },
    overallConfidence: 0.72,
    integrated: true
  },
  
  // AI Status
  aiStatus: {
    status: 'full',
    message: 'Both AI services operational',
    servicesUsed: ['MedSigLIP', 'MedGemma']
  },
  
  // Metadata
  studyInstanceUID: '1.3.12.2.1107...',
  modality: 'CT',
  analyzedAt: new Date()
};
```

### Step 7: Save to MongoDB

```javascript
const AIAnalysis = require('../models/AIAnalysis');

const analysis = new AIAnalysis({
  analysisId: 'AI-2025-10-22-ABC123',
  type: 'single',
  studyInstanceUID: '1.3.12.2.1107...',
  seriesInstanceUID: '1.3.12.2.1107...',
  frameIndex: 5,
  status: 'complete',
  results: combinedResults,
  analyzedAt: new Date()
});

await analysis.save();
```

### Step 8: Return to Frontend

```javascript
// Response sent back to frontend
{
  success: true,
  analysisId: 'AI-2025-10-22-ABC123',
  status: 'complete',
  results: {
    classification: { ... },
    report: { ... },
    aiStatus: { status: 'full', servicesUsed: ['MedSigLIP', 'MedGemma'] }
  },
  analyzedAt: '2025-10-22T15:30:00.000Z'
}
```

---

## Consolidated Report Generation

### Step 1: Request Consolidated Report

```javascript
POST /api/ai/report/consolidated
{
  studyInstanceUID: '1.3.12.2.1107...',
  analysisIds: [
    'AI-2025-10-22-ABC123',
    'AI-2025-10-22-ABC124',
    'AI-2025-10-22-ABC125',
    ...
  ],
  slices: [0, 1, 2, 3, 4, 5, ...]
}
```

### Step 2: Fetch All Analyses from Database

```javascript
const allAnalyses = await AIAnalysis.find({
  analysisId: { $in: analysisIds }
}).sort({ frameIndex: 1 });

// Returns 17 analyses (one per frame)
```

### Step 3: Filter AI-Processed Frames

```javascript
// Only include frames processed by MedSigLIP or MedGemma
const aiProcessedAnalyses = allAnalyses.filter(analysis => {
  const aiStatus = analysis.results?.aiStatus;
  return aiStatus && 
         aiStatus.status !== 'unavailable' && 
         aiStatus.servicesUsed && 
         aiStatus.servicesUsed.length > 0;
});

// If AI services were running: 17/17 frames
// If AI services were NOT running: 0/17 frames
```

### Step 4: Generate Summary

```javascript
const summary = {
  totalAnalyzed: 17,  // AI-processed frames
  totalFrames: 17,    // Total requested frames
  
  classifications: {
    'fracture': 12,
    'normal': 3,
    'mass': 2
  },
  
  mostCommonFinding: 'fracture',
  averageConfidence: 0.68,
  
  aiServicesUsed: ['MedSigLIP', 'MedGemma'],
  
  summary: '✅ Analyzed 17 slices using MedSigLIP & MedGemma. Most common finding: fracture (12 slices)',
  
  processingNote: 'All frames successfully processed by AI'
};
```

### Step 5: Create Consolidated Report

```javascript
const consolidatedData = {
  reportId: 'CONSOLIDATED-1729612345678',
  studyInstanceUID: '1.3.12.2.1107...',
  
  // Frame counts
  totalFramesRequested: 17,
  totalFramesProcessedByAI: 17,
  framesSkipped: 0,
  
  // Per-frame analysis (AI-processed only)
  analyses: [
    {
      sliceIndex: 0,
      classification: {
        label: 'fracture',
        confidence: 0.72,
        model: 'MedSigLIP'
      },
      report: {
        findings: 'TECHNIQUE:\nCT imaging...',
        impression: 'Fracture identified...',
        model: 'MedGemma'
      },
      aiStatus: {
        status: 'full',
        servicesUsed: ['MedSigLIP', 'MedGemma']
      }
    },
    // ... 16 more frames
  ],
  
  // Summary
  summary: { ... },
  
  // Metadata
  aiServicesUsed: ['MedSigLIP', 'MedGemma'],
  poweredBy: 'MedSigLIP & MedGemma',
  generatedAt: new Date()
};
```

---

## What Happens When AI Services Are NOT Running

### Scenario: Services Down

```javascript
// MedSigLIP call fails
❌ MedSigLIP failed: connect ECONNREFUSED 127.0.0.1:5001
   → MedSigLIP service not running on port 5001

// MedGemma call fails
❌ MedGemma failed: connect ECONNREFUSED 127.0.0.1:5002
   → MedGemma service not running on port 5002
```

### Result Saved to Database

```javascript
{
  analysisId: 'AI-2025-10-22-ABC123',
  frameIndex: 5,
  results: {
    classification: null,  // ❌ No data
    report: null,          // ❌ No data
    aiStatus: {
      status: 'unavailable',
      message: 'Both AI services unavailable. Please ensure MedSigLIP (port 5001) and MedGemma (port 5002) are running.',
      servicesUsed: [],    // ❌ Empty
      error: 'Both AI services unavailable...'
    }
  }
}
```

### Consolidated Report Output

```javascript
{
  totalFramesRequested: 17,
  totalFramesProcessedByAI: 0,  // ❌ No AI processing
  framesSkipped: 17,             // ❌ All skipped
  
  analyses: [],  // ❌ Empty (no AI-processed frames)
  
  summary: {
    totalAnalyzed: 0,
    mostCommonFinding: 'No AI analysis available',
    averageConfidence: 0,
    aiServicesUsed: [],
    summary: '⚠️ No frames were processed by MedSigLIP or MedGemma. Please ensure AI services are running.',
    warning: 'AI services were not available during analysis'
  }
}
```

---

## How to Ensure AI Processing

### 1. Start AI Services

```bash
cd ai-services
python medsigclip_server.py  # Terminal 1
python medgemma_server.py     # Terminal 2
```

### 2. Verify Services Running

```bash
curl http://localhost:5001/health
curl http://localhost:5002/health
```

### 3. Restart Backend

```bash
cd server
npm restart
```

### 4. Run Analysis

Now when you analyze frames, you'll see:

```
🤖 Calling BOTH AI models for integrated analysis...
📊 Calling MedSigLIP...
✅ MedSigLIP: fracture (72.0%)
📝 Calling MedGemma...
✅ MedGemma: Report generated
✅ AI analysis complete using: MedSigLIP, MedGemma
```

### 5. Consolidated Report Will Show

```
Total Frames Processed by AI: 17/17
AI Services Used: MedSigLIP, MedGemma
Most Common Finding: fracture (12 slices)
Average Confidence: 68.5%
```

---

## Summary

### ✅ When AI Services Are Running:
- MedSigLIP provides classification
- MedGemma provides detailed report
- Results saved with full data
- Consolidated report shows actual findings

### ❌ When AI Services Are NOT Running:
- Both calls fail with ECONNREFUSED
- Results saved with null values
- aiStatus shows 'unavailable'
- Consolidated report filters out these frames
- Shows warning message

### 🎯 Key Point:
**AI services MUST be running on ports 5001 and 5002 for actual AI processing!**

Without them, the system works but returns empty results.
