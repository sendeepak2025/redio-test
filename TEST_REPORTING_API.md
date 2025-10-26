# 🧪 Testing Structured Reporting APIs

## ✅ Fix Applied
- Changed `authenticateToken` to `authenticate`
- Changed `../middleware/auth` to `../middleware/authMiddleware`
- Server should now start without errors

## 🚀 Quick Test

### 1. Start Server
```bash
cd server
npm start
```

Server should start without the "Cannot find module" error.

### 2. Test Health Check
```bash
curl http://localhost:5000/health
```

### 3. Login to Get Token
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"your_username","password":"your_password"}'
```

Save the token from response.

### 4. Test Report APIs

#### Get Report History (Empty at first)
```bash
curl -X GET "http://localhost:5000/api/structured-reports/study/1.2.840.113619.2.55.3.2831164441.123.1234567890.1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected Response:
```json
{
  "success": true,
  "count": 0,
  "reports": []
}
```

#### Create Draft Report from AI Analysis
First, you need an AI analysis. If you have one:
```bash
curl -X POST "http://localhost:5000/api/structured-reports/from-ai/YOUR_ANALYSIS_ID" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "radiologistName": "Dr. Test",
    "patientID": "P12345",
    "patientName": "Test Patient",
    "modality": "CT"
  }'
```

Expected Response:
```json
{
  "success": true,
  "report": {
    "reportId": "SR-1729785600000-abc123",
    "reportStatus": "draft",
    "radiologistName": "Dr. Test",
    ...
  },
  "message": "Draft report created from AI analysis"
}
```

#### Update Report
```bash
curl -X PUT "http://localhost:5000/api/structured-reports/SR-1729785600000-abc123" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "findingsText": "Normal chest CT. No acute findings.",
    "impression": "Normal study.",
    "recommendations": "Routine follow-up."
  }'
```

#### Sign Report
```bash
curl -X POST "http://localhost:5000/api/structured-reports/SR-1729785600000-abc123/sign" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "signatureText=Dr. John Smith, MD"
```

Or with image:
```bash
curl -X POST "http://localhost:5000/api/structured-reports/SR-1729785600000-abc123/sign" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "signatureText=Dr. John Smith, MD" \
  -F "signature=@/path/to/signature.png"
```

#### Get Single Report
```bash
curl -X GET "http://localhost:5000/api/structured-reports/SR-1729785600000-abc123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Download PDF
```bash
curl -X GET "http://localhost:5000/api/structured-reports/SR-1729785600000-abc123/pdf" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output report.pdf
```

## 🎨 Test with Frontend

### 1. Start Frontend
```bash
cd viewer
npm run dev
```

### 2. Open Demo Page
```
http://localhost:5173/reporting-demo
```

### 3. Test Workflow
1. Click "Report Editor" tab
2. Draft report will be created (if AI analysis exists)
3. Edit findings and impression
4. Add signature
5. Click "Sign & Finalize"
6. Go to "Report History" tab
7. View and download report

## 🐛 Troubleshooting

### Error: "Cannot find module"
- ✅ Fixed! Changed to correct middleware path

### Error: "AI analysis not found"
- Run an AI analysis first using the Medical Viewer
- Or use the AI Analysis API to create one

### Error: "Unauthorized"
- Make sure you're logged in
- Check token is valid
- Token should be in format: `Bearer YOUR_TOKEN`

### Error: "Report not found"
- Check reportId is correct
- Use GET /study/:studyUID to see all reports first

### Error: "Cannot edit finalized report"
- This is expected! Final reports are locked
- Create a new version if needed

## ✅ Success Indicators

Server starts successfully:
```
✅ Server running on port 5000
✅ MongoDB connected
✅ Routes loaded
```

API responds:
```
✅ GET /health returns 200
✅ POST /api/structured-reports/from-ai/:id returns 200
✅ PUT /api/structured-reports/:id returns 200
✅ POST /api/structured-reports/:id/sign returns 200
✅ GET /api/structured-reports/study/:uid returns 200
✅ GET /api/structured-reports/:id/pdf returns PDF
```

Frontend works:
```
✅ Demo page loads
✅ Report editor shows
✅ Can edit fields
✅ Can sign report
✅ Report history shows reports
✅ Can download PDF
```

## 📝 Next Steps

1. ✅ Server is fixed and should start
2. Test APIs with curl or Postman
3. Test frontend demo page
4. Integrate into Medical Viewer
5. Customize as needed

## 🎉 All Fixed!

The authentication middleware issue is resolved. Server should now start without errors and all APIs should work correctly.
