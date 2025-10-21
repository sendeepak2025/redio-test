# Billing System - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Install Dependencies (30 seconds)
```bash
cd server
npm install pdfkit
```

### Step 2: Seed Billing Codes (1 minute)
```bash
node src/scripts/seed-billing-codes.js
```

Expected output:
```
✅ Connected to MongoDB
🗑️  Cleared existing billing codes
✅ Inserted 20 CPT codes
✅ Inserted 21 ICD-10 codes
🎉 Billing code seeding completed successfully!
```

### Step 3: Optional - Configure AI (1 minute)
Add to `server/.env`:
```env
OPENAI_API_KEY=sk-your-openai-key-here
AI_MODEL=gpt-4
```

**Note:** AI is optional! System works with rule-based suggestions if no API key.

### Step 4: Restart Server (30 seconds)
```bash
cd server
npm start
```

### Step 5: Test the System (2 minutes)

#### Test 1: Search CPT Codes
```bash
curl -X GET "http://localhost:8001/api/billing/codes/cpt/search?query=chest" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Test 2: Search ICD-10 Codes
```bash
curl -X GET "http://localhost:8001/api/billing/codes/icd10/search?query=pneumonia" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Test 3: Get AI Suggestions
```bash
curl -X POST "http://localhost:8001/api/billing/suggest-codes" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reportData": {
      "studyData": {
        "modality": "XR",
        "studyDescription": "Chest X-ray 2 views"
      },
      "sections": {
        "findings": "Bilateral infiltrates consistent with pneumonia"
      },
      "findings": [
        {
          "description": "Pneumonia",
          "severity": "moderate"
        }
      ]
    }
  }'
```

Expected response:
```json
{
  "success": true,
  "suggestions": {
    "cptCodes": [
      {
        "code": "71045",
        "description": "Chest X-ray, 2 views",
        "confidence": 95
      }
    ],
    "icd10Codes": [
      {
        "code": "J18.9",
        "description": "Pneumonia, unspecified organism",
        "confidence": 90
      }
    ],
    "confidence": 92
  }
}
```

## 🎯 Integration with Your Viewer

### Option 1: Add to Structured Reporting Component

Edit `viewer/src/components/reporting/StructuredReporting.tsx`:

```tsx
import BillingPanel from '@/components/billing/BillingPanel';

// Add a new tab for billing
const [currentTab, setCurrentTab] = useState(0);

<Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)}>
  <Tab label="Report" />
  <Tab label="Findings" />
  <Tab label="Billing" /> {/* NEW */}
</Tabs>

{currentTab === 2 && (
  <BillingPanel 
    studyData={studyData}
    reportData={{
      sections: reportSections,
      findings: findings,
      measurements: measurements
    }}
    onSuperbillCreated={(superbill) => {
      console.log('Superbill created:', superbill);
      // Show success message
    }}
  />
)}
```

### Option 2: Standalone Billing Page

Create `viewer/src/pages/billing/BillingPage.tsx`:

```tsx
import React from 'react';
import { useParams } from 'react-router-dom';
import BillingPanel from '@/components/billing/BillingPanel';

const BillingPage = () => {
  const { studyId } = useParams();
  const [studyData, setStudyData] = useState(null);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    // Load study and report data
    loadStudyData(studyId);
  }, [studyId]);

  return (
    <BillingPanel 
      studyData={studyData}
      reportData={reportData}
    />
  );
};
```

## 📋 Common Use Cases

### Use Case 1: Chest X-Ray with Pneumonia

**Input:**
- Modality: XR
- Study: Chest X-ray 2 views
- Finding: Bilateral infiltrates, pneumonia

**AI Suggests:**
- CPT: 71045 (Chest X-ray, 2 views)
- ICD-10: J18.9 (Pneumonia)

**Radiologist:**
- Reviews and approves
- Adds charge: $75.00
- Creates superbill

### Use Case 2: Cardiac Catheterization

**Input:**
- Modality: XA
- Study: Cardiac angiography
- Finding: 70% stenosis in LAD

**AI Suggests:**
- CPT: 93458 (Cardiac cath with coronary angio)
- ICD-10: I25.10 (Coronary artery disease)

**Radiologist:**
- Reviews and approves
- Adds modifier: 26 (Professional component)
- Adds charge: $1500.00
- Creates superbill

### Use Case 3: CT Chest for PE

**Input:**
- Modality: CT
- Study: CT angiography chest
- Finding: No pulmonary embolism

**AI Suggests:**
- CPT: 71275 (CT angiography chest)
- ICD-10: R06.02 (Shortness of breath)

**Radiologist:**
- Reviews and approves
- Manually adds: Z03.6 (Encounter for observation for suspected PE, ruled out)
- Creates superbill

## 🔍 Verification Checklist

After setup, verify:

- [ ] Server starts without errors
- [ ] Billing routes registered (`/api/billing/*`)
- [ ] CPT codes searchable (20+ codes)
- [ ] ICD-10 codes searchable (20+ codes)
- [ ] AI suggestions work (or rule-based fallback)
- [ ] Superbill creation works
- [ ] PDF export works
- [ ] Validation catches errors

## 🐛 Quick Troubleshooting

### "Cannot find module 'pdfkit'"
```bash
cd server
npm install pdfkit
```

### "No billing codes found"
```bash
node src/scripts/seed-billing-codes.js
```

### "AI suggestions not working"
- Check `.env` for `OPENAI_API_KEY`
- System will use rule-based fallback automatically
- Rule-based suggestions still work well!

### "Unauthorized" errors
- Ensure you're sending JWT token in Authorization header
- Token format: `Bearer YOUR_TOKEN_HERE`

## 📊 Sample Data Included

### CPT Codes (20+)
- Chest X-rays (71045, 71046, 71047)
- CT scans (70450, 71250, 74150)
- MRI (70551, 71550)
- Cardiac cath (93454, 93458)
- Ultrasound (76700, 93306)

### ICD-10 Codes (20+)
- Respiratory (J18.9, J44.0, J91.8, J93.0)
- Cardiovascular (I25.10, I21.9, I50.9)
- Musculoskeletal (M25.561, S22.9)
- Neurological (G43.909, I63.9)
- General (Z00.00, R07.9, R06.02)

## 🎓 Next Steps

1. ✅ Complete this quick start
2. 📖 Read full guide: `BILLING_SYSTEM_GUIDE.md`
3. 🧪 Test with real reports
4. 🎨 Customize UI to match your branding
5. 📈 Add custom codes for your practice
6. 🔗 Integrate with practice management system

## 💡 Pro Tips

1. **Start with AI disabled** - Test rule-based suggestions first
2. **Review all AI suggestions** - Never auto-submit without review
3. **Build custom templates** - Create code sets for common studies
4. **Train your team** - Ensure radiologists understand the workflow
5. **Monitor accuracy** - Track denial rates and adjust

## 🎉 You're Ready!

Your hybrid billing system is now operational. The system provides:

✅ **Speed** - AI suggests codes in seconds
✅ **Accuracy** - Human review ensures correctness  
✅ **Compliance** - Validation prevents errors
✅ **Flexibility** - Manual override always available
✅ **Audit Trail** - Complete tracking of all changes

Start generating superbills with confidence!
