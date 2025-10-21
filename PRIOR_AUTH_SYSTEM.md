# Prior Authorization System - Implementation Guide

## ✅ What's Been Created

### 1. Database Model (`PriorAuthorization.js`)
Complete prior authorization data model with:
- Patient & insurance information
- Procedure & diagnosis codes
- Authorization status tracking
- Automated check results
- Approval/denial workflow
- Unit tracking (approved vs used)

### 2. Automation Service (`prior-auth-automation.js`)
Intelligent automation engine that checks:
- **Medical Necessity** - Diagnosis + procedure alignment
- **Appropriateness** - ACR criteria compliance
- **Duplicate Detection** - Prevents redundant requests
- **Coverage Verification** - Insurance eligibility

### 3. Auto-Approval Logic
- Confidence scoring (0-100%)
- Auto-approves if confidence ≥ 85%
- Routes to manual review if < 85%

## 🎯 Next Steps to Complete

### Step 1: Backend API Routes
Create `server/src/routes/prior-authorization.js`:
```javascript
POST   /api/prior-auth          - Create new request
GET    /api/prior-auth          - List all requests
GET    /api/prior-auth/:id      - Get specific request
PUT    /api/prior-auth/:id      - Update request
POST   /api/prior-auth/:id/approve - Approve request
POST   /api/prior-auth/:id/deny    - Deny request
GET    /api/prior-auth/patient/:id - Get by patient
POST   /api/prior-auth/check       - Run automated checks
```

### Step 2: Frontend Page
Create `viewer/src/pages/prior-auth/PriorAuthPage.tsx`:
- Request submission form
- Status dashboard
- Automated check results display
- Approval/denial workflow
- Document upload
- Search & filter

### Step 3: Integration with Reports
Auto-create prior auth from structured reports:
- Extract CPT codes from report
- Extract ICD-10 codes from findings
- Pre-fill authorization request
- Link to study

### Step 4: Notifications
- Email notifications on status changes
- SMS alerts for urgent requests
- Portal notifications

## 📋 Features Included

### Automated Checks

#### 1. Medical Necessity Check
```
✓ Diagnosis codes provided
✓ Clinical indication detailed
✓ Procedure-diagnosis alignment
Score: 0-100%
```

#### 2. Appropriateness Check
```
✓ Modality appropriate for body part
✓ ACR rating ≥ 7 (Usually Appropriate)
✓ Evidence-based guidelines
```

#### 3. Duplicate Check
```
✓ No similar requests in last 90 days
✓ Same patient + procedure + body part
✓ Prevents waste
```

#### 4. Coverage Check
```
✓ Procedure commonly covered
✓ Insurance provider verified
✓ Special approval requirements
```

### Status Workflow

```
pending → in_review → approved/denied
                   ↓
                expired (after 90 days)
```

### Unit Tracking

```
Approved Units: 3
Used Units: 1
Remaining Units: 2
```

## 🔧 Configuration

### ACR Appropriateness Criteria
Integrate with ACR API or use local database:
```javascript
{
  "indication": "Headache",
  "modality": "CT Head",
  "rating": 8,
  "variant": "Acute onset"
}
```

### Insurance Coverage Rules
Configure per payer:
```javascript
{
  "payer": "Blue Cross",
  "procedure": "70450",
  "covered": true,
  "requiresAuth": true
}
```

## 📊 Dashboard Metrics

Track:
- Total requests (pending/approved/denied)
- Auto-approval rate
- Average processing time
- Denial reasons
- Top procedures
- Payer statistics

## 🤖 Automation Rules

### Auto-Approve If:
1. Medical necessity score ≥ 70%
2. ACR rating ≥ 7
3. No duplicates found
4. Coverage confirmed
5. Overall confidence ≥ 85%

### Route to Review If:
1. Confidence < 85%
2. Duplicate found
3. ACR rating < 7
4. Coverage unclear
5. Emergency/STAT request

## 💡 Usage Example

### Create Prior Auth Request:
```javascript
POST /api/prior-auth
{
  "patientID": "12345",
  "procedureCode": "70450",
  "modality": "CT",
  "bodyPart": "Head",
  "diagnosis": ["G43.909"],
  "clinicalIndication": "Severe headache with neurological symptoms",
  "urgency": "urgent"
}
```

### Response:
```javascript
{
  "authorizationNumber": "PA-2024-001",
  "status": "approved",
  "automatedChecks": {
    "medicalNecessity": { "passed": true, "score": 90 },
    "appropriateness": { "passed": true },
    "duplicateCheck": { "passed": true },
    "coverageCheck": { "passed": true }
  },
  "recommendation": "approve",
  "confidence": 92,
  "approvalDate": "2024-01-21",
  "expirationDate": "2024-04-21"
}
```

## 🔗 Integration Points

### With Structured Reporting:
```javascript
// Auto-create prior auth from report
const report = await getStructuredReport(studyUID);
const priorAuth = await createPriorAuthFromReport(report);
```

### With Billing:
```javascript
// Check prior auth before billing
const auth = await checkPriorAuth(patientID, procedureCode);
if (!auth.isValid()) {
  throw new Error('No valid prior authorization');
}
```

### With Worklist:
```javascript
// Show auth status in worklist
study.priorAuthStatus = 'approved';
study.priorAuthExpires = '2024-04-21';
```

## 📈 Future Enhancements

1. **AI-Powered Predictions** - ML model for approval likelihood
2. **Real-time Payer Integration** - Live eligibility checks
3. **Clinical Decision Support** - Suggest alternative procedures
4. **Peer-to-Peer Scheduling** - Auto-schedule reviews
5. **Appeals Management** - Handle denials and appeals
6. **Analytics Dashboard** - Comprehensive reporting

## 🎓 Best Practices

1. **Always run automated checks** before manual review
2. **Document denial reasons** clearly
3. **Set expiration dates** (typically 90 days)
4. **Track unit usage** to prevent overuse
5. **Send notifications** on status changes
6. **Archive old requests** after 1 year
7. **Audit trail** for compliance

## Summary

The Prior Authorization system provides:
✅ **Automated checking** - 4 comprehensive checks  
✅ **Auto-approval** - High-confidence requests  
✅ **Manual review** - For complex cases  
✅ **Unit tracking** - Prevent overuse  
✅ **Integration ready** - Works with reports & billing  

**Next: Create API routes and frontend page to complete the system!**
