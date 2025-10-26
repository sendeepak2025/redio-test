# 🚀 Quick Integration Guide - Report History in Medical Viewer

## 1️⃣ Add Report History Button to Toolbar

### Step 1: Import Component
```tsx
// In MedicalImageViewer.tsx (line ~100)
import ReportHistoryButton from '../reports/ReportHistoryButton';
```

### Step 2: Add Button to Toolbar
```tsx
// Find the toolbar section (around line 2000+)
// Add this button next to other toolbar buttons:

<ReportHistoryButton studyInstanceUID={studyInstanceUID} />
```

### Complete Example:
```tsx
{/* Existing toolbar buttons */}
<Tooltip title="Settings">
  <IconButton onClick={handleSettingsClick}>
    <SettingsIcon />
  </IconButton>
</Tooltip>

{/* ADD THIS: Report History Button */}
<ReportHistoryButton studyInstanceUID={studyInstanceUID} />

{/* Other buttons */}
<Tooltip title="Fullscreen">
  <IconButton onClick={toggleFullscreen}>
    <FullscreenIcon />
  </IconButton>
</Tooltip>
```

---

## 2️⃣ Add Report Editor to AI Assistant

### Step 1: Import Component
```tsx
// In AutoAnalysisPopup.tsx
import ReportEditor from '../reports/ReportEditor';
```

### Step 2: Add State
```tsx
const [showReportEditor, setShowReportEditor] = useState(false);
const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
```

### Step 3: Add Button After Analysis Completes
```tsx
{/* After analysis is complete, show button */}
{allComplete && (
  <Button
    variant="contained"
    color="primary"
    onClick={() => {
      setCurrentAnalysisId(analysisId);
      setShowReportEditor(true);
    }}
    startIcon={<Description />}
  >
    📝 Create Report
  </Button>
)}

{/* Report Editor Dialog */}
<Dialog open={showReportEditor} onClose={() => setShowReportEditor(false)} maxWidth="md" fullWidth>
  <DialogTitle>📝 Create Medical Report</DialogTitle>
  <DialogContent>
    <ReportEditor
      analysisId={currentAnalysisId || undefined}
      studyInstanceUID={studyInstanceUID}
      patientInfo={{
        patientID: 'P12345', // Get from study metadata
        patientName: 'Patient Name', // Get from study metadata
        modality: 'CT' // Get from study metadata
      }}
      onReportCreated={(reportId) => {
        alert(`✅ Report created: ${reportId}`);
      }}
      onReportSigned={() => {
        alert('✅ Report signed and finalized!');
        setShowReportEditor(false);
      }}
    />
  </DialogContent>
</Dialog>
```

---

## 3️⃣ Complete Workflow Integration

### Scenario: User clicks "Analyze" button

```tsx
// 1. Run AI Analysis
const handleAnalyze = async () => {
  const analysisId = await runAIAnalysis(studyInstanceUID, frameIndex);
  
  // 2. Show option to create report
  setCurrentAnalysisId(analysisId);
  setShowReportOption(true);
};

// 3. User clicks "Create Report"
const handleCreateReport = () => {
  setShowReportEditor(true);
};

// 4. Report Editor opens with AI findings pre-filled
<ReportEditor
  analysisId={currentAnalysisId}
  studyInstanceUID={studyInstanceUID}
  patientInfo={patientInfo}
  onReportCreated={(reportId) => {
    console.log('Draft created:', reportId);
    // Keep editor open for editing
  }}
  onReportSigned={() => {
    console.log('Report finalized!');
    setShowReportEditor(false);
    // Optionally open Report History
    setShowReportHistory(true);
  }}
/>
```

---

## 4️⃣ Minimal Integration (Just 3 Lines!)

If you want the absolute minimal integration:

```tsx
// 1. Import
import ReportHistoryButton from '../reports/ReportHistoryButton';

// 2. Add to toolbar (one line!)
<ReportHistoryButton studyInstanceUID={studyInstanceUID} />

// Done! 🎉
```

---

## 5️⃣ Testing

### Test Report Creation
```bash
# 1. Start backend
cd server
npm start

# 2. Start frontend
cd viewer
npm run dev

# 3. Open browser
http://localhost:5173/reporting-demo

# 4. Test workflow:
# - Click "Report Editor" tab
# - Draft report will be created from AI analysis
# - Edit findings and impression
# - Add signature
# - Click "Sign & Finalize"
# - Go to "Report History" tab
# - View and download report
```

### Test API Directly
```bash
# Get report history
curl -X GET http://localhost:5000/api/structured-reports/study/1.2.840.113619... \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create draft from AI
curl -X POST http://localhost:5000/api/structured-reports/from-ai/analysis-123 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"radiologistName":"Dr. Smith","patientID":"P12345","patientName":"John Doe","modality":"CT"}'
```

---

## 6️⃣ Customization

### Change Colors
```tsx
// In ReportHistoryButton.tsx
sx={{
  color: '#00ff41',  // Change to your theme color
  '&:hover': { backgroundColor: 'rgba(0, 255, 65, 0.1)' }
}}
```

### Add Custom Fields to Report
```tsx
// In ReportEditor.tsx, add new field:
const [customField, setCustomField] = useState('');

// Add to form:
<div>
  <label>Custom Field</label>
  <textarea
    value={customField}
    onChange={(e) => setCustomField(e.target.value)}
    disabled={isFinal}
  />
</div>

// Add to save:
await axios.put(`/api/structured-reports/${report.reportId}`, {
  ...otherFields,
  customField  // Add your custom field
});
```

### Customize PDF Template
```javascript
// In server/src/routes/structured-reports.js
// Find the PDF generation section and customize:

doc.fontSize(20).text('Your Hospital Name', { align: 'center' });
doc.image('logo.png', 50, 50, { width: 100 });
// Add more customizations...
```

---

## 🎯 Summary

**Minimal Integration (3 lines):**
```tsx
import ReportHistoryButton from '../reports/ReportHistoryButton';
// ...
<ReportHistoryButton studyInstanceUID={studyInstanceUID} />
```

**Full Integration (with Report Editor):**
```tsx
import ReportHistoryButton from '../reports/ReportHistoryButton';
import ReportEditor from '../reports/ReportEditor';
// Add button + editor dialog
```

**That's it!** 🚀

Aapka structured reporting system ab fully integrated hai. Koi question ho to batao!
