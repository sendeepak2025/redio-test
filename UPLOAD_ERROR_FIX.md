# DICOM Upload Error Fix

## Problem
Upload failing with **500 Internal Server Error** with no clear error message.

## Solution Applied

### Enhanced Error Handling in `uploadController.js`:

#### 1. **Better Logging**
```javascript
console.log('📥 DICOM Upload Request Received');
console.log(`   File: ${filename}, Size: ${size} KB`);
console.log('✅ MongoDB connected');
```

#### 2. **Specific Error Messages**
```javascript
if (error.code === 'ECONNREFUSED') {
  message: 'Cannot connect to Orthanc server'
  hint: 'Check if Orthanc is running at http://...'
}
if (error.code === 'ETIMEDOUT') {
  message: 'Upload timed out'
  hint: 'File may be too large'
}
if (error.code === 'ENOTFOUND') {
  message: 'Orthanc server not found'
  hint: 'Check ORTHANC_URL in .env'
}
```

#### 3. **Detailed Error Response**
```json
{
  "success": false,
  "message": "User-friendly error",
  "error": "Technical error details",
  "code": "ERROR_CODE",
  "hint": "How to fix it",
  "orthancUrl": "http://...",
  "timestamp": "2024-..."
}
```

#### 4. **Health Check Endpoint**
Created `/api/dicom/upload/health` to check:
- MongoDB connection status
- Orthanc connection status
- Overall system health

## Common Upload Errors & Solutions

### Error 1: ECONNREFUSED
**Cause**: Orthanc not running  
**Solution**: Start Orthanc server  
**Check**: `http://69.62.70.102:8042` or your ORTHANC_URL

### Error 2: ETIMEDOUT
**Cause**: File too large or slow connection  
**Solution**: Try smaller file or increase timeout  
**Check**: File size and network speed

### Error 3: ENOTFOUND
**Cause**: Wrong Orthanc URL  
**Solution**: Check ORTHANC_URL in `.env`  
**Check**: DNS resolution of Orthanc host

### Error 4: MongoDB not connected
**Cause**: MongoDB service down  
**Solution**: Start MongoDB  
**Check**: `mongod` service status

### Error 5: Invalid DICOM
**Cause**: Corrupted or non-DICOM file  
**Solution**: Upload valid DICOM file  
**Check**: File extension and content

## How to Diagnose Upload Issues

### Step 1: Check Health Endpoint
```bash
curl http://localhost:8001/api/dicom/upload/health
```

Expected response:
```json
{
  "overall": "healthy",
  "services": {
    "mongodb": { "status": "connected" },
    "orthanc": { "status": "connected" }
  }
}
```

### Step 2: Check Backend Logs
Look for:
```
📥 DICOM Upload Request Received
   File: echo.dcm, Size: 1234 KB
✅ MongoDB connected
📤 Uploading DICOM to Orthanc...
✅ Uploaded to Orthanc
```

### Step 3: Check Orthanc
```bash
curl http://69.62.70.102:8042/system
```

Should return Orthanc system info.

### Step 4: Check MongoDB
```bash
mongosh
> show dbs
> use radiology
> db.studies.find().limit(1)
```

## Error Response Format

### Before (Unhelpful):
```json
{
  "success": false,
  "message": "Upload failed"
}
```

### After (Helpful):
```json
{
  "success": false,
  "message": "Cannot connect to Orthanc server",
  "error": "ECONNREFUSED",
  "code": "ECONNREFUSED",
  "hint": "Check if Orthanc is running at http://69.62.70.102:8042",
  "orthancUrl": "http://69.62.70.102:8042",
  "timestamp": "2024-01-21T10:30:00.000Z"
}
```

## Testing

### Test 1: Upload Valid DICOM
```bash
curl -X POST http://localhost:8001/api/dicom/upload \
  -F "file=@test.dcm"
```

Expected: 200 OK with study details

### Test 2: Upload Without File
```bash
curl -X POST http://localhost:8001/api/dicom/upload
```

Expected: 400 Bad Request "No file uploaded"

### Test 3: Upload with Orthanc Down
Stop Orthanc, then upload.

Expected: 500 with "Cannot connect to Orthanc server"

### Test 4: Upload with MongoDB Down
Stop MongoDB, then upload.

Expected: 500 with "Database not connected"

## Monitoring

### Backend Console Output:
```
📥 DICOM Upload Request Received
   File: echo.dcm, Size: 2.5 MB
✅ MongoDB connected
📤 Uploading DICOM to Orthanc...
   Buffer size: 2621440 bytes (2.50 MB)
   Uploading to Orthanc at: http://69.62.70.102:8042
✅ Uploaded to Orthanc: { ID: 'abc123', ... }
📊 StudyUID: 1.2.3.4.5, Frames: 100
✅ Study upserted
✅ Series upserted
✅ Instances upserted
✅ Upload successful
```

### Error Console Output:
```
📥 DICOM Upload Request Received
   File: echo.dcm, Size: 2.5 MB
✅ MongoDB connected
📤 Uploading DICOM to Orthanc...
❌ Failed to upload to Orthanc: Error: connect ECONNREFUSED
   Error code: ECONNREFUSED
   Error message: connect ECONNREFUSED 69.62.70.102:8042
   Stack: Error: connect ECONNREFUSED...
```

## Summary

Upload errors now provide:
✅ **Clear error messages** - User-friendly descriptions  
✅ **Helpful hints** - How to fix the issue  
✅ **Detailed logging** - Easy debugging  
✅ **Health check** - Verify services before upload  
✅ **Error codes** - Programmatic error handling  

**No more mysterious 500 errors!** 🎉
