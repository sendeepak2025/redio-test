# 🎯 AI Detection Integration - Quick Example

## How to Add Visual Detection to Your Viewer

### Step 1: Import the Component

```typescript
import AIDetectionOverlay from '@/components/ai/AIDetectionOverlay';
```

### Step 2: Add State for Detections

```typescript
const [aiDetections, setAiDetections] = useState<any[]>([]);
const [showDetections, setShowDetections] = useState(true);
const [imageSize, setImageSize] = useState({ width: 512, height: 512 });
```

### Step 3: Run AI Analysis

```typescript
const handleRunAIAnalysis = async () => {
  try {
    const result = await analyzeStudyWithAI(
      studyInstanceUID,
      currentFrame,
      patientContext
    );
    
    // Extract detections from result
    if (result.data.detections && result.data.detections.detections) {
      setAiDetections(result.data.detections.detections);
    }
    
    // Store full report
    setAiReport(result.data);
  } catch (error) {
    console.error('AI analysis failed:', error);
  }
};
```

### Step 4: Add Overlay to Viewer

```typescript
<Box sx={{ position: 'relative' }}>
  {/* Your image viewer */}
  <canvas ref={imageCanvasRef} />
  
  {/* AI Detection Overlay */}
  {aiDetections.length > 0 && (
    <AIDetectionOverlay
      detections={aiDetections}
      imageWidth={imageSize.width}
      imageHeight={imageSize.height}
      visible={showDetections}
      onDetectionClick={(detection) => {
        console.log('Detection clicked:', detection);
        // Optionally zoom to detection
        focusOnDetection(detection);
      }}
      onToggleVisibility={() => setShowDetections(!showDetections)}
    />
  )}
</Box>
```

### Step 5: Handle Detection Click (Optional)

```typescript
const focusOnDetection = (detection: any) => {
  const bbox = detection.boundingBox;
  
  // Calculate center of bounding box
  const centerX = (bbox.x + bbox.width / 2) * imageSize.width;
  const centerY = (bbox.y + bbox.height / 2) * imageSize.height;
  
  // Zoom to detection
  // Your zoom logic here
  console.log('Focus on:', centerX, centerY);
};
```

---

## Complete Example Component

```typescript
import React, { useState, useRef, useEffect } from 'react';
import { Box, Button, CircularProgress } from '@mui/material';
import { Psychology as AIIcon } from '@mui/icons-material';
import AIDetectionOverlay from '@/components/ai/AIDetectionOverlay';
import ComprehensiveAIReportViewer from '@/components/ai/ComprehensiveAIReportViewer';
import { analyzeStudyWithAI } from '@/services/ApiService';

interface ViewerWithDetectionProps {
  studyInstanceUID: string;
  currentFrame: number;
  patientContext: any;
}

const ViewerWithDetection: React.FC<ViewerWithDetectionProps> = ({
  studyInstanceUID,
  currentFrame,
  patientContext
}) => {
  const [aiDetections, setAiDetections] = useState<any[]>([]);
  const [aiReport, setAiReport] = useState<any>(null);
  const [showDetections, setShowDetections] = useState(true);
  const [loading, setLoading] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 512, height: 512 });
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);

  // Update image size when canvas changes
  useEffect(() => {
    if (imageCanvasRef.current) {
      setImageSize({
        width: imageCanvasRef.current.width,
        height: imageCanvasRef.current.height
      });
    }
  }, [imageCanvasRef.current]);

  const handleRunAIAnalysis = async () => {
    setLoading(true);
    try {
      const result = await analyzeStudyWithAI(
        studyInstanceUID,
        currentFrame,
        patientContext
      );
      
      // Extract detections
      if (result.data.detections && result.data.detections.detections) {
        setAiDetections(result.data.detections.detections);
        console.log('✅ Detections loaded:', result.data.detections.detections.length);
      }
      
      // Store full report
      setAiReport(result.data);
      
      alert(`AI Analysis Complete!\n\nFound ${result.data.detections?.count || 0} detections`);
    } catch (error: any) {
      console.error('AI analysis failed:', error);
      alert('AI analysis failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const focusOnDetection = (detection: any) => {
    const bbox = detection.boundingBox;
    
    // Calculate center
    const centerX = (bbox.x + bbox.width / 2) * imageSize.width;
    const centerY = (bbox.y + bbox.height / 2) * imageSize.height;
    
    console.log('Focus on detection:', detection.label, 'at', centerX, centerY);
    
    // Your zoom/pan logic here
    // Example: pan to center, zoom to fit detection
  };

  return (
    <Box>
      {/* Toolbar */}
      <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <AIIcon />}
          onClick={handleRunAIAnalysis}
          disabled={loading}
        >
          {loading ? 'Analyzing...' : 'Run AI Analysis'}
        </Button>
        
        {aiDetections.length > 0 && (
          <Button
            variant="outlined"
            onClick={() => setShowDetections(!showDetections)}
          >
            {showDetections ? 'Hide' : 'Show'} Detections ({aiDetections.length})
          </Button>
        )}
      </Box>

      {/* Viewer with Detection Overlay */}
      <Box sx={{ position: 'relative', width: '100%', height: '600px' }}>
        {/* Your image viewer */}
        <canvas
          ref={imageCanvasRef}
          width={512}
          height={512}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
        
        {/* AI Detection Overlay */}
        {aiDetections.length > 0 && (
          <AIDetectionOverlay
            detections={aiDetections}
            imageWidth={imageSize.width}
            imageHeight={imageSize.height}
            visible={showDetections}
            onDetectionClick={focusOnDetection}
            onToggleVisibility={() => setShowDetections(!showDetections)}
          />
        )}
      </Box>

      {/* Comprehensive Report */}
      {aiReport && (
        <Box sx={{ mt: 2 }}>
          <ComprehensiveAIReportViewer
            report={aiReport}
            onExport={() => {
              const json = JSON.stringify(aiReport, null, 2);
              const blob = new Blob([json], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `ai-report-${studyInstanceUID}.json`;
              a.click();
            }}
            onPrint={() => window.print()}
            onShare={() => {
              navigator.clipboard.writeText(JSON.stringify(aiReport, null, 2));
              alert('Report copied to clipboard!');
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default ViewerWithDetection;
```

---

## What You'll See

### 1. Before Analysis:
- Normal image viewer
- "Run AI Analysis" button

### 2. During Analysis:
- Loading indicator
- "Analyzing..." message

### 3. After Analysis:
- **Colored bounding boxes** on image
- **Labels** showing finding + confidence
- **Detection panel** on right side
- **Comprehensive report** below

### 4. Interactions:
- Click detection in list → Highlights on image
- Click again → Zooms to detection
- Expand detection → Shows details
- Toggle eye icon → Hide/show overlay

---

## Example Output

When you run AI analysis, you'll see:

```
🎯 AI Detections (2)

┌─────────────────────────────────┐
│ 🔴 Consolidation         MEDIUM │
│ Confidence: 78%                 │
│ ▼ Expand for details            │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 🟢 Cardiomegaly          LOW    │
│ Confidence: 65%                 │
│ ▼ Expand for details            │
└─────────────────────────────────┘
```

On the image, you'll see:
- Orange box around consolidation area
- Green box around heart
- Labels with "Consolidation (78%)" and "Cardiomegaly (65%)"

---

## Tips

### 1. Image Size
Make sure to pass correct image dimensions:
```typescript
setImageSize({
  width: imageElement.naturalWidth,
  height: imageElement.naturalHeight
});
```

### 2. Canvas Positioning
The detection overlay canvas must be positioned absolutely over your image:
```css
position: absolute;
top: 0;
left: 0;
pointer-events: none;
```

### 3. Detection Visibility
Allow users to toggle detections on/off:
```typescript
<Button onClick={() => setShowDetections(!showDetections)}>
  {showDetections ? 'Hide' : 'Show'} Detections
</Button>
```

### 4. Focus on Detection
Implement zoom/pan to detection:
```typescript
const focusOnDetection = (detection) => {
  const bbox = detection.boundingBox;
  // Pan to center of bbox
  // Zoom to fit bbox with padding
};
```

---

## Testing

### Test with Demo Mode:

1. Don't start AI services
2. Run AI analysis
3. System generates mock detections
4. See visual markers appear
5. Test all interactions

### Test with Real AI:

1. Start AI detection service
2. Run AI analysis
3. See real detections
4. Verify accuracy
5. Review recommendations

---

## 🎉 Done!

Your viewer now has **visual AI detection and marking**!

Users can:
- ✅ See bounding boxes on abnormalities
- ✅ Read clinical descriptions
- ✅ Check confidence scores
- ✅ Review recommendations
- ✅ Focus on specific findings
- ✅ Export reports with detections

**Perfect for clinical workflow!** 🏥
