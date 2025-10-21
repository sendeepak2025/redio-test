# DICOM Study Upload - Testing Guide

## Current Status

### ✅ Fixed Issues
1. **Frontend URL Configuration** - No longer hardcoding backend URL
2. **API Service** - Proper `uploadPacsStudy()` function created
3. **Authentication** - Headers properly included
4. **Services Running** - Backend and frontend are operational
5. **Orthanc Connection** - Verified working (Version: mainline, API v29)

### ⚠️ Current Issue
Backend is receiving upload requests but Orthanc is returning **HTTP 400 (Bad Request)** error.

## Error Details from Logs
```
📤 Uploading DICOM to Orthanc...
   Buffer size: 1702398 bytes
❌ Failed to upload to Orthanc: Request failed with status code 400
```

## Common Causes of 400 Error from Orthanc

1. **Invalid DICOM File** - File is not a valid DICOM format
2. **Corrupted File** - File was corrupted during upload/transfer
3. **Wrong File Type** - Trying to upload non-DICOM files
4. **Encoding Issues** - Character encoding problems in DICOM tags
5. **Transfer Syntax** - Unsupported DICOM transfer syntax

## Testing Steps

### 1. Verify File Type
The file being uploaded should be:
- DICOM format (.dcm extension)
- Valid medical imaging file
- Not corrupted
- Properly formatted

### 2. Check File Upload
From frontend logs we can see:
- File size: 1,702,398 bytes (~1.7 MB)
- File reached backend successfully
- Buffer was created correctly

### 3. Enhanced Logging Added
The backend now logs:
- File mimetype
- Original filename
- Orthanc error details
- HTTP status codes
- Response headers

### 4. Test with Known Good DICOM
To isolate the issue, try uploading a known valid DICOM file.

## Manual Testing Commands

### Test 1: Upload via cURL with valid DICOM
```bash
# Get a test DICOM file
curl -u orthanc:orthanc_secure_2024 \
  http://69.62.70.102:8042/instances -o test.dcm

# Upload back to test
curl -X POST \
  -H "Content-Type: application/dicom" \
  -u orthanc:orthanc_secure_2024 \
  --data-binary @test.dcm \
  http://69.62.70.102:8042/instances
```

### Test 2: Check Orthanc Studies
```bash
curl -u orthanc:orthanc_secure_2024 http://69.62.70.102:8042/studies
```

### Test 3: Check Backend Logs
```bash
tail -f /var/log/supervisor/backend.out.log | grep -E "(📤|❌|File|Buffer)"
```

## Next Upload Attempt

When you try to upload again, the backend will now show:
```
📤 Uploading DICOM to Orthanc...
   Buffer size: [size] bytes
   File mimetype: [type]
   File name: [filename]
```

If it fails, you'll see:
```
❌ Failed to upload to Orthanc: [error]
   Orthanc error details: [detailed error]
   Orthanc status: [HTTP code]
```

## Possible Solutions

### Solution 1: File Format Issue
If the file is not a valid DICOM:
- Try with a different DICOM file
- Verify the file opens in DICOM viewer
- Check file is not compressed/zipped

### Solution 2: Upload via PACS Worklist
Instead of web upload, try:
- Use DICOM C-STORE to send to Orthanc
- Use Orthanc's built-in upload page
- Use DICOM workstation software

### Solution 3: File Size/Timeout
If file is very large:
- Check timeout settings (currently 60s for PACS upload)
- Try smaller file first
- Monitor network connection

## Current Configuration

### Orthanc
- URL: http://69.62.70.102:8042
- Username: orthanc
- Password: orthanc_secure_2024
- Version: mainline
- API Version: 29
- Status: ✅ Running

### Backend
- Port: 8001
- Status: ✅ Running
- Logging: Enhanced (includes file details)

### Frontend
- Port: 3010
- Status: ✅ Running
- API calls: Using environment URL

## To Resume Testing

1. **Try upload from frontend** - Go to Patients page → Upload Study
2. **Watch backend logs** - `tail -f /var/log/supervisor/backend.out.log`
3. **Check detailed error** - Look for the new logging output
4. **Share the exact error** - The enhanced logs will show what Orthanc rejected

The frontend fix is complete. The remaining issue is with the DICOM file validation/upload to Orthanc, which we can debug with the enhanced logging.
