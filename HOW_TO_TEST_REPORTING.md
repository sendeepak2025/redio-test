# 🧪 HOW TO TEST THE NEW REPORTING SYSTEM

## Quick Start (3 Ways to Test)

### ✅ Method 1: Dedicated Test Page (Easiest!)

1. **Start the application:**
```bash
cd /app/viewer
npm run dev
```

2. **Navigate to the test page:**
```
http://localhost:3000/test-reporting
```

3. **You'll see a test configuration page with:**
   - 3 test scenarios (Basic, AI-Assisted, Edit Existing)
   - Test data configuration
   - Tips and instructions
   - Click "Start Test" to launch the editor

4. **Try different scenarios:**
   - **Basic Report:** Choose a template or skip for free-text
   - **AI-Assisted:** See auto-populated fields (simulated)
   - **Edit Report:** Load existing report by ID

---

### ✅ Method 2: From Study Viewer

1. **Open any study in the viewer:**
```
http://localhost:3000/viewer/{studyInstanceUID}
```

2. **Click the "Report" panel button** (on the right side)

3. **The SuperUnifiedReportEditor will open** in the side panel

4. **You can:**
   - Create a new report for the study
   - Choose from recommended templates
   - Use voice dictation
   - Add structured findings
   - Sign the report

---

### ✅ Method 3: Direct Component Access (For Developers)

Import and use the component anywhere:

```tsx
import { SuperUnifiedReportEditor } from '@/components/reports';

<SuperUnifiedReportEditor
  studyInstanceUID="1.2.3.4.5"
  patientInfo={{
    patientID: "TEST001",
    patientName: "Test Patient",
    modality: "CT"
  }}
  onReportSigned={() => {
    console.log('Report signed!');
  }}
/>
```

---

## 🎯 What to Test

### 1. Template Selection
- [ ] See 10+ templates displayed
- [ ] Templates matching your modality are highlighted as "Recommended"
- [ ] Can select any template
- [ ] Can skip and use basic report (no template)

### 2. Report Editing
- [ ] Template sections appear correctly
- [ ] Can type in all fields
- [ ] Voice dictation buttons (🎤) appear next to fields
- [ ] Can save draft
- [ ] Data persists after save

### 3. Structured Findings Tab
- [ ] Can add new findings
- [ ] Can select severity (Normal, Mild, Moderate, Severe)
- [ ] Can edit finding description
- [ ] Can delete findings
- [ ] Can add measurements

### 4. Quick Findings Tab (Template-specific)
- [ ] Shows template's quick findings library
- [ ] Can click to add finding to report
- [ ] Finding appears in structured findings

### 5. Voice Dictation
- [ ] Click 🎤 button
- [ ] Browser asks for microphone permission
- [ ] Can speak and see text appear
- [ ] Text appends to existing content
- [ ] Works for all fields

### 6. Signature & Finalization
- [ ] Click "Sign & Finalize" button
- [ ] Dialog opens with 2 options
- [ ] Can draw signature on canvas
- [ ] Can type signature text
- [ ] Report saves and locks after signing
- [ ] Can't edit after signing

### 7. AI Integration (if available)
- [ ] If analysisId provided, fields auto-populate
- [ ] AI findings show in findings section
- [ ] AI badge shows on report
- [ ] Can edit AI-generated text

---

## 🐛 Troubleshooting

### Issue: "Cannot find module SuperUnifiedReportEditor"

**Solution:**
```bash
cd /app/viewer
npm install
npm run dev
```

### Issue: "Voice dictation not working"

**Reasons:**
1. Browser doesn't support Web Speech API (use Chrome or Edge)
2. Not on HTTPS (localhost is OK)
3. Microphone permission not granted

**Check in console:**
```javascript
'webkitSpeechRecognition' in window
// Should return true
```

### Issue: "Template not showing"

**Check:**
1. Make sure `/app/viewer/src/data/reportTemplates.ts` exists
2. Check browser console for import errors
3. Try refreshing the page

### Issue: "Backend errors when saving"

**Make sure backend is running:**
```bash
cd /app/server
npm start
# or
node src/index.js
```

**Check backend is accessible:**
```bash
curl http://localhost:8001/api/health
```

### Issue: "Authentication required"

**Make sure you're logged in:**
```
http://localhost:3000/login
```

Default credentials (if using test setup):
- Username: admin / test@test.com
- Password: (check your setup)

---

## 📱 Screenshots of What You Should See

### Test Page
```
┌─────────────────────────────────────────────────┐
│ 🧪 Super Unified Report Editor - Test Page     │
├─────────────────────────────────────────────────┤
│                                                 │
│ Choose Test Scenario:                          │
│                                                 │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│ │📝 Basic  │  │🤖 AI     │  │✏️ Edit   │     │
│ │  Report  │  │Assisted  │  │ Existing │     │
│ └──────────┘  └──────────┘  └──────────┘     │
│                                                 │
│ Test Data:                                     │
│ Study UID: [________________]                  │
│ Patient ID: [________________]                 │
│ Patient Name: [________________]               │
│ Modality: [CT]                                 │
│                                                 │
│ [Start Test Button]                            │
└─────────────────────────────────────────────────┘
```

### Template Selection
```
┌─────────────────────────────────────────────────┐
│ 🗂️ Choose Report Template     [Skip - Basic]   │
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌──────────────┐  ┌──────────────┐            │
│ │ 🫁 Chest     │  │ 🧠 CT Head   │            │
│ │  X-Ray       │  │  Report      │            │
│ │              │  │              │            │
│ │ CR, DX       │  │ CT           │            │
│ │[RECOMMENDED] │  │              │            │
│ └──────────────┘  └──────────────┘            │
│                                                 │
│ ┌──────────────┐  ┌──────────────┐            │
│ │ ❤️ Cardiac   │  │ 🫃 CT        │            │
│ │  Angiography │  │  Abdomen     │            │
│ └──────────────┘  └──────────────┘            │
└─────────────────────────────────────────────────┘
```

### Report Editor
```
┌─────────────────────────────────────────────────┐
│ 📝 Chest X-Ray Report          [Save] [Sign]   │
│ 🤖 AI-Assisted  📋 Template    [DRAFT]         │
├─────────────────────────────────────────────────┤
│ Workflow: [✓] Template → [●] Edit → [ ] Sign  │
├─────────────────────────────────────────────────┤
│ [Report Content] [Structured Findings] [Patient]│
├─────────────────────────────────────────────────┤
│                                                 │
│ Clinical Indication: * 🎤                       │
│ ┌───────────────────────────────────────────┐ │
│ │ Chest pain, rule out pneumonia            │ │
│ └───────────────────────────────────────────┘ │
│                                                 │
│ Findings: * 🎤                                  │
│ ┌───────────────────────────────────────────┐ │
│ │ Lungs are clear bilaterally...            │ │
│ └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

## 🎓 Testing Checklist

Print this and check off as you test:

**Basic Functionality:**
- [ ] Test page loads at /test-reporting
- [ ] Can select different test scenarios
- [ ] Editor opens when clicking "Start Test"
- [ ] Templates load and display
- [ ] Can skip template and use basic report

**Template System:**
- [ ] All 10 templates show
- [ ] Recommended templates highlighted
- [ ] Template sections render correctly
- [ ] Can fill all required fields
- [ ] Quick findings library works

**Editing Features:**
- [ ] Can type in all text fields
- [ ] Voice dictation buttons appear
- [ ] Can add structured findings
- [ ] Can add measurements
- [ ] Can delete findings/measurements

**Save & Sign:**
- [ ] Save draft button works
- [ ] Data persists after save
- [ ] Sign dialog opens
- [ ] Canvas signature works
- [ ] Text signature works
- [ ] Report locks after signing

**Integration:**
- [ ] Works from study viewer
- [ ] Report panel opens in viewer
- [ ] Patient info auto-fills
- [ ] Modality filtering works

---

## 📞 Need Help?

1. **Check browser console** for errors (F12 → Console tab)
2. **Check network tab** for failed API calls (F12 → Network tab)
3. **Review documentation:** 
   - `/app/SUPER_UNIFIED_REPORTING_SYSTEM.md`
   - `/app/REPORTING_STREAMLINE_ROADMAP.md`

---

## ✅ Success Indicators

You'll know it's working when:

1. ✅ Test page loads without errors
2. ✅ Templates display in a grid
3. ✅ Can select template and editor opens
4. ✅ Can type in fields
5. ✅ Voice buttons appear (🎤)
6. ✅ Can save draft
7. ✅ Can sign report
8. ✅ Report shows as "FINAL" after signing

---

## 🚀 Next Steps After Testing

1. **Works great?** → Update other components to use SuperUnifiedReportEditor
2. **Found bugs?** → Document them and I'll help fix
3. **Need features?** → Let me know what's missing
4. **Ready to deploy?** → Follow deployment checklist in roadmap

---

**Happy Testing!** 🎉

If everything works, you've successfully integrated the new unified reporting system!
