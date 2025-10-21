# AI Medical Assistant Guide

## Overview
The AI Medical Assistant integrates two powerful medical AI models directly into the DICOM viewer for real-time analysis:

- **MedSigLIP**: Medical image understanding and classification
- **MedGemma**: Medical language model for clinical interpretation

## Features

### 1. AI Assistant Button
- Located in the top-right corner of the viewer
- Purple gradient button with brain icon (🧠)
- Always accessible during image viewing

### 2. Model Selection

#### MedSigLIP (Vision Model)
- **Purpose**: Visual analysis and classification
- **Capabilities**:
  - Detect anatomical structures
  - Identify abnormalities
  - Classify pathologies
  - Confidence scoring for each finding
- **Use Case**: Quick visual assessment and object detection

#### MedGemma (Language Model)
- **Purpose**: Clinical interpretation and reporting
- **Capabilities**:
  - Generate detailed clinical findings
  - Provide differential diagnoses
  - Offer recommendations
  - Create structured impressions
- **Use Case**: Comprehensive report generation and clinical insights

### 3. Real-Time Canvas Integration
- AI findings are displayed directly on the canvas
- Visual markers show analyzed regions
- Confidence scores displayed with each finding
- Color-coded severity levels:
  - 🔴 Red: High severity
  - 🟡 Yellow: Medium severity
  - 🟢 Green: Low severity / Normal

## How to Use

### Step 1: Open AI Assistant
1. Click the purple AI button in the top-right corner
2. The AI Assistant dialog will open

### Step 2: Select Model
1. Choose between MedSigLIP (Vision) or MedGemma (Language)
2. Read the model description to understand capabilities

### Step 3: Analyze Current Frame
1. Ensure you're viewing the frame you want to analyze
2. Click "Analyze Current Frame" button
3. Wait for analysis to complete (1-3 seconds)

### Step 4: Review Findings
1. AI findings appear in the dialog
2. Visual markers added to canvas (for MedSigLIP)
3. Review confidence scores and descriptions

### Step 5: Continue Analysis
- Navigate to different frames
- Run analysis on multiple frames
- Compare findings across frames
- Close dialog when done

## API Endpoints

### MedSigLIP Classification
```
POST /api/medical-ai/classify-image
Body: {
  studyInstanceUID: string,
  frameIndex: number
}
```

### MedGemma Report Generation
```
POST /api/medical-ai/generate-report
Body: {
  studyInstanceUID: string,
  frameIndex: number,
  patientContext: object
}
```

### Health Check
```
GET /api/medical-ai/health
```

## Technical Details

### Frontend Integration
- Component: `MedicalImageViewer.tsx`
- State management for AI findings
- Real-time canvas annotation
- Responsive dialog interface

### Backend Services
- Route: `/api/medical-ai/*`
- Service: `medical-ai-service.js`
- Frame caching for performance
- Model inference handling

### Performance
- Analysis time: 1-3 seconds per frame
- Cached results for repeated analysis
- Async processing to prevent UI blocking

## Future Enhancements

1. **Batch Analysis**: Analyze multiple frames simultaneously
2. **Historical Comparison**: Compare with previous studies
3. **Custom Models**: Upload and use custom trained models
4. **Export Findings**: Export AI findings to reports
5. **Real-time Streaming**: Continuous analysis during playback

## Troubleshooting

### AI Service Unavailable
- Check backend server is running
- Verify AI models are loaded
- Check `/api/medical-ai/health` endpoint

### No Findings Displayed
- Ensure frame is loaded properly
- Check network console for errors
- Verify study has valid DICOM data

### Slow Analysis
- Large images may take longer
- Check server resources
- Consider frame caching optimization

## Notes

- AI findings are suggestions, not diagnoses
- Always verify AI results with clinical expertise
- Models are continuously improving
- Confidence scores indicate reliability
- Use in conjunction with traditional analysis tools
