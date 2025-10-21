# DICOM Upload - Detailed Troubleshooting

## ✅ Tests Performed

### Direct Orthanc Upload: SUCCESS
- Downloaded DICOM from Orthanc: 1,595,728 bytes
- Re-uploaded to Orthanc: ✅ SUCCESS
- Conclusion: Orthanc is working correctly

### Issue Location
The problem is between **Frontend → Backend → Orthanc**

## 🔍 Enhanced Debugging Added

### New Logs in Backend
When you upload now, you'll see:

```
✅ Accepting file: filename.dcm (mime/type)
📥 Received upload request: { hasFile: true, ... }
📤 Processing PACS upload: {
  filename: 'file.dcm',
  size: '1.62 MB',
  mimetype: 'application/dicom',
  bufferLength: 1702398
}
Uploading file.dcm to Orthanc PACS (1702398 bytes)...
DICOM validation: ✅ Has DICM header  OR  ⚠️ No DICM header
First 16 bytes: [hex dump]

Then either:
✅ Successfully uploaded to Orthanc
OR
❌ Failed to upload to Orthanc
   Error message: ...
   HTTP status: 400
   Orthanc response: ...
```

## 🎯 Next Steps for Testing

### Option 1: Upload from Frontend (Recommended)
1. Go to Patients page
2. Click "Upload Study"
3. **Select a VALID .dcm file** (must be actual DICOM)
4. Watch browser console AND backend logs simultaneously

**Open two terminals:**

Terminal 1 - Backend logs:
```bash
tail -f /var/log/supervisor/backend.out.log | grep -E "(📤|📥|✅|❌|DICOM|Orthanc)"
```

Terminal 2 - Full backend output:
```bash
tail -f /var/log/supervisor/backend.out.log
```

### Option 2: Test with Known Good File
Download a test DICOM and upload it:

```bash
# Download sample DICOM
curl https://www.rubomedical.com/dicom_files/example.dcm -o ~/Downloads/test.dcm

# OR use one from Orthanc
curl -u orthanc:orthanc_secure_2024 \
  http://localhost:8042/instances/93816070-2dd6549b-90905ff2-5cbde0d2-8d8617c9/file \
  -o ~/Downloads/test.dcm
```

Then upload this file from the frontend.

## 🐛 Common Issues & Solutions

### Issue 1: "No DICOM file provided"
**Symptoms**: Upload button does nothing or says "No file"
**Cause**: File not reaching backend
**Debug**:
- Check browser console for errors
- Check Network tab: is request sent?
- Check if file is selected before clicking upload

**Fix**: 
- Refresh page and try again
- Make sure file is actually selected
- Check browser console for JavaScript errors

### Issue 2: "File type not supported"
**Symptoms**: Upload rejected immediately
**Cause**: File doesn't pass file filter
**Debug**:
- Check what file you're uploading
- Look for "❌ Rejecting file" in logs

**Fix**:
- File must have .dcm, .dicom, or .dic extension
- OR file must have valid DICOM MIME type
- Try renaming file to add .dcm extension

### Issue 3: "Orthanc upload failed: Request failed with status code 400"
**Symptoms**: File reaches backend but Orthanc rejects it
**Cause**: File is not valid DICOM format
**Debug**:
- Check logs for "DICOM validation: ⚠️ No DICM header"
- Check "First 16 bytes" in logs
- Check "Orthanc response" for details

**Possible Reasons**:
1. **Not a DICOM file** - File is jpg/png/pdf/other
2. **Corrupted DICOM** - File damaged during download/transfer
3. **Wrong format** - File is compressed/archived
4. **Unsupported transfer syntax** - Rare DICOM encoding

**Fix**:
a) **Verify file is actually DICOM**:
```bash
# Check file type
file yourfile.dcm
# Should say: "DICOM medical imaging data"

# Check for DICM header (should see "DICM" at position 128-131)
xxd -l 132 yourfile.dcm | tail -1
```

b) **Try different file**:
- Download from Orthanc (known good)
- Get sample from https://www.rubomedical.com/dicom_files/
- Use files from DICOM viewer/workstation

c) **Check file isn't compressed**:
```bash
# If file is .zip, .gz, .tar
unzip yourfile.zip  # Extract first
# Then upload the .dcm files inside
```

## 📋 Information to Collect

If issue persists, please provide:

### 1. Backend Logs
```bash
tail -n 100 /var/log/supervisor/backend.out.log > ~/backend_error.log
```

### 2. File Information
```bash
# What file are you trying to upload?
ls -lh yourfile.dcm
file yourfile.dcm
xxd -l 132 yourfile.dcm

# Where did you get it?
# Can you open it in a DICOM viewer?
```

### 3. Browser Console
- Open DevTools (F12)
- Go to Console tab
- Copy any errors (red text)
- Go to Network tab
- Find the upload request
- Copy Request Headers and Response

### 4. Exact Error Message
- Copy the complete error message
- Screenshot if possible

## 🧪 Quick File Validation

Before uploading, validate your DICOM file:

```bash
# Method 1: Check file magic bytes
file yourfile.dcm
# Should output: "DICOM medical imaging data"

# Method 2: Check for DICM header
strings yourfile.dcm | head -20 | grep -i dicm
# Should show: DICM

# Method 3: Check first bytes
xxd yourfile.dcm | head -10
# After 128 bytes preamble, should see: 4449 434d (DICM in hex)
```

## 🎓 Understanding DICOM Format

A valid DICOM file has:
1. **128-byte preamble** (often zeros)
2. **4-byte DICM marker** (bytes: D I C M)
3. **DICOM data elements** (tags, VR, length, value)

Some older DICOM files might not have the DICM marker but are still valid "implicit VR" DICOM.

## 🔄 Workaround: Use /api/dicom/upload Instead

If PACS upload keeps failing, try the alternative endpoint:

**Frontend change**:
```typescript
// Instead of uploadPacsStudy()
const result = await uploadDicomFileForPatient(file, patientID, patientName)
```

This uses a different upload path that might be more lenient.

## 💡 Tips

1. **Start with small file** - Upload a small DICOM first (< 5MB)
2. **Use test file** - Download from Orthanc and upload it back
3. **Check extension** - File must be .dcm, .dicom, or .dic
4. **One file first** - Upload single file before batch
5. **Watch logs** - Monitor backend logs during upload

## 🆘 Still Not Working?

Try this test upload:
```bash
# 1. Download test file
curl -u orthanc:orthanc_secure_2024 \
  http://localhost:8042/instances/93816070-2dd6549b-90905ff2-5cbde0d2-8d8617c9/file \
  -o ~/Downloads/test_orthanc.dcm

# 2. Rename to ensure .dcm extension
mv ~/Downloads/test_orthanc.dcm ~/Downloads/test_orthanc.dcm

# 3. Upload this file from the frontend

# This is a KNOWN GOOD DICOM file from your own Orthanc server.
# If this fails, we know it's a code issue not a file issue.
```

---

**Current Status**: Enhanced debugging active
**Backend**: Logs DICM header check + hex dump
**Next**: Upload a file and share the complete backend logs
