# Unified Report Editor - User Guide

## Overview

The Unified Report Editor is your one-stop solution for creating professional medical reports, whether you're starting from AI analysis or creating a report from scratch.

## How to Access

### From AI Analysis (Recommended)
1. Run AI analysis on medical images
2. Wait for analysis to complete
3. Click **"📝 Create Medical Report"** button
4. Report editor opens with AI-generated draft

### From Viewer
1. Open study in medical image viewer
2. Click **"Report History"** button
3. Click **"Create New Report"** or edit existing

## Interface Layout

```
┌─────────────────────────────────────────────────────────────┐
│  📄 Medical Report Editor                    [Save] [Sign]  │
│  🤖 AI-Generated Draft  [DRAFT]                             │
├─────────────────────────────────────────────────────────────┤
│  [Basic Report] [Structured Findings] [Patient Info]        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Content area (changes based on selected tab)               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Tab 1: Basic Report (Quick Reporting)

Perfect for traditional narrative reports.

### Fields:

**Clinical History** 🎤
- Patient symptoms, indication for study
- Voice dictation button available

**Technique** 🎤
- Imaging protocol, contrast, parameters
- Voice dictation button available

**Findings** 🎤
- Detailed observations from images
- AI-generated content appears here
- Voice dictation button available

**Impression** 🎤
- Summary diagnosis and conclusions
- AI-generated content appears here
- Voice dictation button available

**Recommendations**
- Add as list items (click + Add)
- Or enter as free text
- AI-generated recommendations appear here

### When to Use:
- Quick reports
- Traditional narrative style
- AI-generated drafts
- Simple cases

## Tab 2: Structured Findings (Detailed Reporting)

Perfect for complex cases requiring structured data.

### Structured Findings Section:

Each finding includes:
- **Location**: Where the finding is located
- **Severity**: Normal | Mild | Moderate | Severe
- **Description**: Detailed description

**Actions:**
- Click **[+ Add Finding]** to create new
- Edit any field inline
- Click **[🗑️]** to delete

### Measurements Section:

Each measurement includes:
- **Type**: What you're measuring (e.g., "Lesion diameter")
- **Value**: Numeric value
- **Unit**: mm | cm | degrees | HU
- **Location**: Where the measurement was taken

**Actions:**
- Click **[+ Add Measurement]** to create new
- Edit any field inline
- Click **[🗑️]** to delete

### When to Use:
- Complex cases
- Research studies
- Quantitative analysis
- Structured data requirements

## Tab 3: Patient Info (Read-Only)

View patient and study metadata:
- Patient ID
- Patient Name
- Modality (CT, MRI, XR, etc.)
- Study Instance UID
- Created At timestamp
- Signed At timestamp (if signed)

## Workflow

### Creating a New Report

```
1. AI Analysis Complete
   ↓
2. Click "Create Medical Report"
   ↓
3. Review AI-generated content in Tab 1
   ↓
4. Edit/enhance as needed
   ↓
5. (Optional) Add structured data in Tab 2
   ↓
6. Click [Save Draft]
   ↓
7. Click [Sign Report]
   ↓
8. Draw signature or type name
   ↓
9. Report locked and finalized ✅
```

### Editing an Existing Draft

```
1. Open Report History
   ↓
2. Click on draft report
   ↓
3. Edit in any tab
   ↓
4. Click [Save Draft]
   ↓
5. Continue editing or sign
```

## Signing Reports

### Option 1: Draw Signature
1. Click **[Sign Report]** button
2. Draw signature on canvas with mouse/touch
3. Click **[Clear]** to redraw if needed
4. Click **[Sign Report]** to finalize

### Option 2: Type Signature
1. Click **[Sign Report]** button
2. Scroll down to "Type Signature" field
3. Enter your name
4. Click **[Sign Report]** to finalize

### After Signing:
- ✅ Report status changes to "SIGNED"
- 🔒 All fields become read-only
- 📅 Signed timestamp recorded
- 📄 PDF available for download

## Voice Dictation (Coming Soon)

Microphone buttons (🎤) are visible next to major text fields:
- Click to start dictation
- Speak naturally
- Click again to stop
- Text appears in field automatically

**Note**: Requires browser support for Web Speech API

## Tips & Best Practices

### For Quick Reports:
1. Use Tab 1 (Basic Report) only
2. Review AI-generated content
3. Make minor edits
4. Sign and done!

### For Detailed Reports:
1. Start with Tab 1 for narrative
2. Switch to Tab 2 for structured data
3. Add findings with severity levels
4. Add measurements with units
5. Return to Tab 1 to review
6. Sign when complete

### For Research/Teaching:
1. Use structured findings extensively
2. Add precise measurements
3. Document severity levels
4. Include detailed descriptions
5. Export to PDF for sharing

## Keyboard Shortcuts

- **Ctrl+S**: Save draft
- **Tab**: Navigate between fields
- **Enter**: Add recommendation (when in recommendation field)
- **Esc**: Close dialogs

## Status Indicators

- **🤖 AI-Generated Draft**: Report created from AI analysis
- **[DRAFT]**: Report is editable
- **[SIGNED]**: Report is finalized and locked
- **🔒**: Field is locked (signed report)

## Common Workflows

### Workflow 1: AI-Assisted Quick Report
```
AI Analysis → Create Report → Review Tab 1 → Minor edits → Sign → Done
Time: 2-3 minutes
```

### Workflow 2: Detailed Structured Report
```
AI Analysis → Create Report → Review Tab 1 → Add findings in Tab 2 
→ Add measurements → Review → Sign → Done
Time: 5-10 minutes
```

### Workflow 3: Manual Report (No AI)
```
Create New Report → Fill Tab 1 manually → (Optional) Add Tab 2 data 
→ Save → Sign → Done
Time: 10-15 minutes
```

### Workflow 4: Collaborative Review
```
AI Analysis → Create Report → Save Draft → Share with colleague 
→ Colleague reviews → Edit → Sign → Done
Time: Variable
```

## Troubleshooting

### "Authentication required" error
- **Solution**: Log in again, token may have expired

### Cannot edit report
- **Check**: Is report status "SIGNED"? Signed reports are locked
- **Solution**: Create a new report or contact admin

### AI content not appearing
- **Check**: Was report created from AI analysis?
- **Solution**: Ensure analysisId is provided when creating report

### Signature not saving
- **Check**: Is signature drawn or text entered?
- **Solution**: Ensure at least one signature method is used

### Save button disabled
- **Check**: Is report already signed?
- **Solution**: Signed reports cannot be edited

## Feature Comparison

| Feature | Available | Notes |
|---------|:---------:|-------|
| Free-text reporting | ✅ | Tab 1 |
| Structured findings | ✅ | Tab 2 |
| Measurements | ✅ | Tab 2 |
| Recommendations | ✅ | Tab 1 |
| Digital signature | ✅ | Canvas + Text |
| Voice dictation | 🔄 | UI ready, coming soon |
| Templates | 🔄 | Coming soon |
| Report comparison | 🔄 | Coming soon |
| AI suggestions | 🔄 | Coming soon |
| PDF export | ✅ | After signing |
| Report history | ✅ | Separate component |

## Support

### Need Help?
- Check this guide first
- Review tooltips in the interface
- Contact system administrator
- Submit feedback for improvements

### Report Issues:
- Describe what you were doing
- Include error messages
- Note which tab you were on
- Provide report ID if available

## Updates & Changelog

### Version 1.0 (Current)
- ✅ Unified interface combining two systems
- ✅ Three-tab organization
- ✅ AI integration
- ✅ Structured findings
- ✅ Measurements
- ✅ Digital signature
- ✅ Report locking

### Coming Soon (Version 1.1)
- 🔄 Voice dictation implementation
- 🔄 Template system
- 🔄 Report comparison
- 🔄 AI-powered suggestions

---

**Quick Start**: AI Analysis → Create Report → Review → Sign → Done!

**Questions?** Contact your system administrator or refer to the technical documentation.
