# Upload Timeout Fix - Large DICOM Files

## Problem
DICOM file uploads were failing with:
```
Failed to upload to Orthanc PACS: timeout of 60000ms exceeded
```

This happened when uploading large files, especially:
- Multi-frame ultrasound studies
- Color Doppler images (RGB data is larger)
- CT/MRI series with many slices
- High-resolution images

## Root Cause
The Orthanc service had a default timeout of 60 seconds (60000ms) for all operations, including uploads. Large DICOM files take longer to:
1. Upload from browser to Node.js server
2. Parse and validate
3. Upload from Node.js to Orthanc PACS
4. Process and store in Orthanc

## Solution Implemented

### 1. Increased Upload Timeout
Changed from **60 seconds** to **5 minutes (300 seconds)** for upload operations specifically.

### 2. Separate Timeouts
- **Regular operations** (queries, metadata): 60 seconds (fast)
- **Upload operations** (large files): 5 minutes (patient)

### 3. Environment Variable Configuration
Added configurable timeouts in `.env`:
```env
ORTHANC_TIMEOUT=60000           # 1 minute for regular operations
ORTHANC_UPLOAD_TIMEOUT=300000   # 5 minutes for uploads
```

### 4. Better Error Messages
Improved error handling to show helpful messages:
- Connection refused → "Cannot connect to Orthanc server"
- Timeout → "Upload timed out. File may be too large"
- 413 error → "File is too large for server"

### 5. Upload Progress Logging
Added detailed logging:
```
📤 Uploading DICOM file to Orthanc (45.23 MB)...
   Buffer size: 47456789 bytes (45.23 MB)
   Uploading to Orthanc at: http://69.62.70.102:8042
✅ Upload successful: abc123-def456-ghi789
```

## Files Modified

### 1. `server/src/services/unified-orthanc-service.js`

#### Added upload timeout configuration:
```javascript
constructor(config = {}) {
  this.config = {
    timeout: config.timeout || parseInt(process.env.ORTHANC_TIMEOUT) || 60000,
    uploadTimeout: config.uploadTimeout || parseInt(process.env.ORTHANC_UPLOAD_TIMEOUT) || 300000,
    // ...
  };
}
```

#### Updated uploadDicomFile method:
```javascript
async uploadDicomFile(fileBuffer) {
  const fileSizeMB = (fileBuffer.length / (1024 * 1024)).toFixed(2);
  console.log(`📤 Uploading DICOM file to Orthanc (${fileSizeMB} MB)...`);
  
  const response = await this.client.post('/instances', fileBuffer, {
    headers: {
      'Content-Type': 'application/dicom'
    },
    timeout: this.config.uploadTimeout, // 5 minutes instead of 1 minute
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });
  
  console.log(`✅ Upload successful: ${response.data.ID}`);
  return response.data;
}
```

### 2. `server/src/controllers/uploadController.js`

#### Improved error handling:
```javascript
catch (orthancError) {
  let errorMessage = orthancError.message;
  
  if (orthancError.code === 'ECONNREFUSED') {
    errorMessage = 'Cannot connect to Orthanc server. Please check if Orthanc is running.';
  } else if (orthancError.code === 'ETIMEDOUT' || errorMessage.includes('timeout')) {
    errorMessage = 'Upload timed out. The file may be too large or the connection is slow. Please try again.';
  } else if (orthancError.response?.status === 413) {
    errorMessage = 'File is too large for the server to handle.';
  }
  
  return res.status(500).json({
    success: false,
    message: `Failed to upload to Orthanc PACS: ${errorMessage}`,
    error: orthancError.message,
    code: orthancError.code
  });
}
```

### 3. `server/.env`

#### Added timeout configuration:
```env
# Orthanc Timeout Configuration (in milliseconds)
ORTHANC_TIMEOUT=60000           # 1 minute for regular operations
ORTHANC_UPLOAD_TIMEOUT=300000   # 5 minutes for uploads
```

## Testing

### Test Upload with Large File
1. Prepare a large DICOM file (>10 MB)
2. Upload through the UI
3. Check server logs for progress:
   ```
   📤 Uploading DICOM file to Orthanc (45.23 MB)...
   ✅ Upload successful: abc123
   ```

### Test Different File Sizes
| File Size | Expected Time | Status |
|-----------|---------------|--------|
| < 1 MB    | < 5 seconds   | ✅ Fast |
| 1-10 MB   | 5-30 seconds  | ✅ Normal |
| 10-50 MB  | 30-120 seconds| ✅ Acceptable |
| 50-100 MB | 2-4 minutes   | ✅ Slow but works |
| > 100 MB  | > 4 minutes   | ⚠️ May timeout |

### Verify Timeout Settings
Check server startup logs:
```
Unified Orthanc Service initialized: {
  url: 'http://69.62.70.102:8042',
  timeout: '60000ms',
  uploadTimeout: '300000ms'
}
```

## Configuration Options

### Increase Timeout Further (if needed)
For very large files or slow connections, increase in `.env`:
```env
ORTHANC_UPLOAD_TIMEOUT=600000  # 10 minutes
```

### Decrease Timeout (for faster failure)
For faster networks where you want quick failure:
```env
ORTHANC_UPLOAD_TIMEOUT=120000  # 2 minutes
```

### Per-Environment Configuration
**Development** (slower, more patient):
```env
ORTHANC_UPLOAD_TIMEOUT=600000  # 10 minutes
```

**Production** (faster network):
```env
ORTHANC_UPLOAD_TIMEOUT=180000  # 3 minutes
```

## Troubleshooting

### Still Getting Timeout Errors?

#### 1. Check Orthanc Server
```bash
curl -u orthanc:orthanc_secure_2024 http://69.62.70.102:8042/system
```
Should return Orthanc system info quickly.

#### 2. Check Network Speed
```bash
# Test upload speed to Orthanc
time curl -u orthanc:orthanc_secure_2024 \
  -X POST http://69.62.70.102:8042/instances \
  --data-binary @test.dcm
```

#### 3. Check File Size
```javascript
// In browser console
const file = document.querySelector('input[type="file"]').files[0];
console.log('File size:', (file.size / (1024 * 1024)).toFixed(2), 'MB');
```

#### 4. Increase Timeout More
Edit `.env`:
```env
ORTHANC_UPLOAD_TIMEOUT=900000  # 15 minutes
```

#### 5. Check Orthanc Disk Space
```bash
# SSH to Orthanc server
df -h
```
Orthanc needs enough disk space to store the file.

### Upload Fails Immediately

#### Check Orthanc Connection
```bash
# From your server
curl http://69.62.70.102:8042/system
```

#### Check Firewall
Ensure port 8042 is open between your server and Orthanc.

#### Check Orthanc Logs
```bash
# On Orthanc server
tail -f /var/log/orthanc/orthanc.log
```

### Upload Succeeds but Study Not Visible

#### Check MongoDB Connection
```javascript
// Server logs should show
✅ Instances upserted
✅ Verified: 96 instances in MongoDB for study 1.2.3.4.5
```

#### Check Study in Orthanc
```bash
curl -u orthanc:orthanc_secure_2024 \
  http://69.62.70.102:8042/studies
```

## Performance Optimization

### For Very Large Files (>100 MB)

#### Option 1: Compress Before Upload
Use DICOM compression (JPEG, JPEG 2000, RLE)

#### Option 2: Split into Multiple Files
Upload series as separate files instead of one large multi-frame file

#### Option 3: Use ZIP Upload
For multiple files, use ZIP upload endpoint:
```javascript
POST /api/dicom/upload/zip
```

#### Option 4: Direct Orthanc Upload
Upload directly to Orthanc, bypassing Node.js:
```javascript
// From browser
const formData = new FormData();
formData.append('file', file);

fetch('http://69.62.70.102:8042/instances', {
  method: 'POST',
  body: file,
  headers: {
    'Authorization': 'Basic ' + btoa('orthanc:orthanc_secure_2024'),
    'Content-Type': 'application/dicom'
  }
});
```

## Monitoring

### Server Logs to Watch
```
📤 Uploading DICOM file to Orthanc (45.23 MB)...
   Buffer size: 47456789 bytes (45.23 MB)
   Uploading to Orthanc at: http://69.62.70.102:8042
✅ Upload successful: abc123-def456
💾 Upserting 96 instance records to MongoDB...
✅ Instances upserted
✅ Verified: 96 instances in MongoDB for study 1.2.3.4.5
```

### Error Logs to Watch
```
❌ Failed to upload to Orthanc: timeout of 300000ms exceeded
❌ Failed to upload to Orthanc: connect ECONNREFUSED
❌ Failed to upload to Orthanc: Request failed with status code 413
```

## Summary

✅ **Upload timeout increased from 1 minute to 5 minutes**
✅ **Configurable via environment variables**
✅ **Better error messages for users**
✅ **Detailed logging for debugging**
✅ **Separate timeouts for different operations**
✅ **No limit on file size (maxContentLength: Infinity)**

Your large DICOM files (especially color ultrasound) should now upload successfully!

## Quick Fix Checklist

- [x] Increased upload timeout to 5 minutes
- [x] Added environment variable configuration
- [x] Improved error messages
- [x] Added upload progress logging
- [x] Removed content length limits
- [x] Separated upload timeout from regular timeout
- [x] Added helpful troubleshooting guide

**The upload should now work for your color Doppler ultrasound files!** 🎉
