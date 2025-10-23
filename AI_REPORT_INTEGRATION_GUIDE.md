# AI Report Integration Guide

## 🚀 Quick Integration

### Step 1: Update Your Viewer Component

Replace the old AI analysis display with the new comprehensive report viewer:

```typescript
// OLD CODE (remove this)
{aiAnalysis && (
  <Box>
    <Typography>{aiAnalysis.findings}</Typography>
  </Box>
)}

// NEW CODE (use this)
import ComprehensiveAIReportViewer from './components/ai/ComprehensiveAIReportViewer';

{aiReport && (
  <ComprehensiveAIReportViewer
    report={aiReport}
    onExport={() => handleExportReport(aiReport)}
    onPrint={() => handlePrintReport(aiReport)}
    onShare={() => handleShareReport(aiReport)}
  />
)}
```

### Step 2: Update AI Analysis Call

```typescript
// Call AI analysis
const handleRunAIAnalysis = async () => {
  setLoading(true);
  try {
    const result = await analyzeStudyWithAI(
      studyInstanceUID,
      currentFrame,
      {
        patientID: patient.patientID,
        patientName: patient.patientName,
        age: patient.age,
        sex: patient.sex,
        indication: study.indication,
        clinicalHistory: patient.clinicalHistory
      }
    );
    
    // Store the comprehensive report
    setAiReport(result.data);
    
    // Show success message
    setSnackbar({
      open: true,
      message: 'AI analysis complete!',
      severity: 'success'
    });
  } catch (error) {
    console.error('AI analysis failed:', error);
    setSnackbar({
      open: true,
      message: 'AI analysis failed: ' + error.message,
      severity: 'error'
    });
  } finally {
    setLoading(false);
  }
};
```

### Step 3: Add Export/Print/Share Handlers

```typescript
const handleExportReport = (report: any) => {
  const json = JSON.stringify(report, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${report.reportId}.json`;
  link.click();
  
  URL.revokeObjectURL(url);
};

const handlePrintReport = (report: any) => {
  window.print();
};

const handleShareReport = (report: any) => {
  // Implement sharing logic (email, copy link, etc.)
  navigator.clipboard.writeText(JSON.stringify(report, null, 2));
  setSnackbar({
    open: true,
    message: 'Report copied to clipboard!',
    severity: 'success'
  });
};
```

---

## 📋 Complete Example Component

```typescript
import React, { useState } from 'react';
import { Box, Button, CircularProgress, Snackbar, Alert } from '@mui/material';
import { Psychology as AIIcon } from '@mui/icons-material';
import ComprehensiveAIReportViewer from './components/ai/ComprehensiveAIReportViewer';
import { analyzeStudyWithAI } from './services/ApiService';

interface StudyViewerProps {
  studyInstanceUID: string;
  currentFrame: number;
  patient: any;
  study: any;
}

const StudyViewer: React.FC<StudyViewerProps> = ({
  studyInstanceUID,
  currentFrame,
  patient,
  study
}) => {
  const [aiReport, setAiReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const handleRunAIAnalysis = async () => {
    setLoading(true);
    try {
      const result = await analyzeStudyWithAI(
        studyInstanceUID,
        currentFrame,
        {
          patientID: patient.patientID,
          patientName: patient.patientName,
          age: patient.age,
          sex: patient.sex,
          indication: study.indication,
          clinicalHistory: patient.clinicalHistory
        }
      );
      
      setAiReport(result.data);
      setSnackbar({
        open: true,
        message: 'AI analysis complete!',
        severity: 'success'
      });
    } catch (error: any) {
      console.error('AI analysis failed:', error);
      setSnackbar({
        open: true,
        message: 'AI analysis failed: ' + error.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = (report: any) => {
    const json = JSON.stringify(report, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.reportId}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleShareReport = (report: any) => {
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setSnackbar({
      open: true,
      message: 'Report copied to clipboard!',
      severity: 'success'
    });
  };

  return (
    <Box>
      {/* AI Analysis Button */}
      <Button
        variant="contained"
        color="primary"
        startIcon={loading ? <CircularProgress size={20} /> : <AIIcon />}
        onClick={handleRunAIAnalysis}
        disabled={loading}
      >
        {loading ? 'Analyzing...' : 'Run AI Analysis'}
      </Button>

      {/* AI Report Viewer */}
      {aiReport && (
        <Box sx={{ mt: 2 }}>
          <ComprehensiveAIReportViewer
            report={aiReport}
            onExport={() => handleExportReport(aiReport)}
            onPrint={handlePrintReport}
            onShare={() => handleShareReport(aiReport)}
          />
        </Box>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity as any}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StudyViewer;
```

---

## 🎨 Styling Customization

### Custom Theme Colors

```typescript
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Blue for primary actions
    },
    success: {
      main: '#2e7d32', // Green for success/high confidence
    },
    warning: {
      main: '#ed6c02', // Orange for warnings/medium confidence
    },
    error: {
      main: '#d32f2f', // Red for errors/critical findings
    },
  },
});
```

### Custom Report Styles

```typescript
<ComprehensiveAIReportViewer
  report={aiReport}
  sx={{
    '& .MuiAccordion-root': {
      boxShadow: 2,
      mb: 1,
    },
    '& .MuiAlert-root': {
      borderRadius: 2,
    },
  }}
/>
```

---

## 🔧 Advanced Configuration

### Custom Report Templates

Edit `server/src/services/ai-report-generator.js`:

```javascript
this.reportTemplates = {
  // Add custom modality
  MG: {
    sections: ['TECHNIQUE', 'FINDINGS', 'BIRADS', 'IMPRESSION', 'RECOMMENDATIONS'],
    defaultFindings: 'Mammography demonstrates normal breast tissue.',
    criticalKeywords: ['mass', 'calcifications', 'asymmetry', 'distortion']
  },
  
  // Customize existing modality
  CT: {
    sections: ['TECHNIQUE', 'COMPARISON', 'FINDINGS', 'IMPRESSION', 'RECOMMENDATIONS'],
    defaultFindings: 'CT imaging demonstrates normal anatomical structures.',
    criticalKeywords: ['fracture', 'hemorrhage', 'mass', 'obstruction', 'pneumothorax'],
    // Add custom fields
    customFields: {
      contrastUsed: true,
      reconstructionThickness: '5mm'
    }
  }
};
```

### Custom Findings Extraction

```javascript
extractKeyFindings(aiResults, modality) {
  const findings = [];
  
  // Your custom logic
  if (modality === 'MG') {
    // Mammography-specific findings
    if (aiResults.classification) {
      findings.push({
        finding: 'BIRADS Category',
        confidence: 0.9,
        severity: 'medium',
        category: 'Breast Imaging'
      });
    }
  }
  
  return findings;
}
```

---

## 🧪 Testing

### Test AI Analysis

```typescript
// Test with mock data
const mockReport = {
  reportId: 'RPT-TEST-123',
  studyInstanceUID: '1.2.3.4.5',
  modality: 'CT',
  frameIndex: 0,
  generatedAt: new Date(),
  patientInfo: {
    patientID: 'P12345',
    patientName: 'Test Patient',
    age: 45,
    sex: 'M'
  },
  sections: {
    FINDINGS: 'Test findings',
    IMPRESSION: 'Test impression'
  },
  keyFindings: [
    {
      finding: 'Normal study',
      confidence: 0.95,
      severity: 'low',
      category: 'AI Classification'
    }
  ],
  qualityMetrics: {
    overallConfidence: 0.85,
    imageQuality: 'good',
    completeness: 0.90,
    reliability: 0.87
  }
};

<ComprehensiveAIReportViewer report={mockReport} />
```

### Test Backend Endpoint

```bash
# Test AI analysis endpoint
curl -X POST http://localhost:8001/api/medical-ai/analyze-study \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "studyInstanceUID": "1.2.3.4.5",
    "frameIndex": 0,
    "patientContext": {
      "patientID": "P12345",
      "patientName": "Test Patient",
      "age": 45,
      "sex": "M"
    }
  }'
```

---

## 📊 Monitoring

### Check Report Generation

```javascript
// server/src/services/ai-report-generator.js
console.log(`📋 Generating comprehensive AI report for study: ${studyInstanceUID}`);
console.log(`💾 Saved AI report snapshot: ${filename}`);
```

### Check AI Service Status

```typescript
import { checkAIHealth } from './services/ApiService';

const checkServices = async () => {
  const health = await checkAIHealth();
  console.log('AI Services Status:', health);
};
```

---

## 🐛 Troubleshooting

### Issue: Report Not Generating

**Solution:** Check backend logs:
```bash
# Check if report generator is being called
grep "Generating comprehensive AI report" server/logs/app.log

# Check if report is being saved
grep "Saved AI report snapshot" server/logs/app.log
```

### Issue: Image Snapshot Missing

**Solution:** Verify frame cache service:
```javascript
// Check if frame is available
const frameBuffer = await frameCacheService.getFrame(studyUID, frameIndex);
if (!frameBuffer) {
  console.error('Frame not found:', studyUID, frameIndex);
}
```

### Issue: AI Services Not Available

**Solution:** System automatically falls back to demo mode:
```javascript
// Check AI status in report
if (report.metadata.demoMode) {
  console.log('AI services not available - using demo mode');
}
```

---

## ✅ Checklist

- [ ] Import `ComprehensiveAIReportViewer` component
- [ ] Update AI analysis call to use new API
- [ ] Add export/print/share handlers
- [ ] Test with real study data
- [ ] Test with demo mode (AI services off)
- [ ] Verify image snapshots are included
- [ ] Check critical findings detection
- [ ] Verify quality metrics display
- [ ] Test report export functionality
- [ ] Test print functionality

---

## 🎉 You're Done!

Your AI report system is now fully integrated and will:

✅ Always generate complete reports
✅ Include image snapshots
✅ Show clear findings and explanations
✅ Display quality metrics
✅ Detect critical findings
✅ Provide export/print/share functionality

**No more inconsistent AI results!**
