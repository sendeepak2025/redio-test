# AI Analysis Testing Guide

## Quick Test Steps

### 1. Test Study 1
```
Study UID: 1.3.12.2.1107.5.4.3.4975316777216.19951114.94101.161
```

1. Open viewer
2. Navigate to this study
3. Click **"RUN AI ANALYSIS"**
4. Note the results:
   - Number of findings: _____
   - Finding types: _____
   - Report ID: _____

### 2. Test Study 2
```
Study UID: 3.12.2.1107.5.4.3.123456789012345.19950922.121803.6
```

1. Navigate to this study
2. Click **"RUN AI ANALYSIS"**
3. Note the results:
   - Number of findings: _____
   - Finding types: _____
   - Report ID: _____

### 3. Compare Results

The two studies should have:
- ✅ Different number of findings (0-3 random)
- ✅ Different types of findings
- ✅ Different confidence scores
- ✅ Different bounding box positions
- ✅ Different report IDs
- ✅ Correct study UIDs

## What You Should See

### Example Study 1 Result:
```
Report ID: RPT-1.3.12.2-1729600000000
Study UID: 1.3.12.2.1107.5.4.3.4975316777216.19951114.94101.161

Findings (2):
1. Consolidation - 78% confidence - MEDIUM severity
   Location: (0.35, 0.45)
   
2. Pulmonary Nodule - 82% confidence - MEDIUM severity
   Location: (0.58, 0.32)
```

### Example Study 2 Result:
```
Report ID: RPT-3.12.2.1-1729600100000
Study UID: 3.12.2.1107.5.4.3.123456789012345.19950922.121803.6

Findings (1):
1. Cardiomegaly - 71% confidence - LOW severity
   Location: (0.42, 0.48)
```

## Browser Console Logs

Open browser DevTools (F12) and check console for:

```
🔘 performAnalysis called { studyInstanceUID: "...", frameIndex: 0 }
🔍 Starting AI analysis...
✅ AI analysis complete: { studyInstanceUID: "...", reportId: "...", detections: [...] }
```

## Backend Server Logs

Check terminal for:

```
📋 Generating comprehensive AI report for study: 1.3.12.2...
🔍 Detecting abnormalities...
✅ Generated 2 mock detections for XR
✅ AI analysis complete for study: 1.3.12.2...
```

## Verification Checklist

- [ ] Study 1 generates a report
- [ ] Study 2 generates a different report
- [ ] Each report has correct study UID
- [ ] Each report has unique report ID
- [ ] Findings vary between studies
- [ ] Confidence scores are different
- [ ] Bounding boxes are in different positions
- [ ] Image snapshots are included (if available)
- [ ] Detection summary shows correct counts
- [ ] Reports can be downloaded as PDF

## Troubleshooting

### Issue: "Frame not found"
**Solution:** The study needs to have frames cached. Try viewing the study first, then run analysis.

### Issue: Same findings for all studies
**Solution:** Clear browser cache and refresh. Server should be restarted.

### Issue: No detections shown
**Solution:** Check if `detections` array is empty (normal study) or if there's an error in console.

### Issue: Report not saving
**Solution:** Check server logs for file system permissions. Reports save to `server/backend/ai_reports/`

## Expected Behavior

### Normal Study (No Findings)
```
✅ No abnormalities detected (normal study)
Detections: 0
```

### Study with Findings
```
🔍 Detections Found: 2

Detection 1:
  - Type: consolidation
  - Confidence: 78.5%
  - Severity: MEDIUM
  
Detection 2:
  - Type: nodule
  - Confidence: 82.1%
  - Severity: MEDIUM
```

## Success Criteria

✅ Each study generates unique findings
✅ Study UIDs are correctly displayed
✅ Report IDs are unique per study
✅ Detections include bounding boxes
✅ Image snapshots are included
✅ Reports can be exported

## Demo Mode Notice

Currently running in **Demo Mode** with mock data. The findings are realistic but randomly generated. To enable real AI analysis, start the AI services (see AI-ANALYSIS-STATUS-AND-ACTIVATION.md).
