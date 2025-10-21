# Upload Issue Diagnosis

## Problem
- ✅ Direct upload to Orthanc works
- ❌ Upload through app fails with 400 error
- File has DICM marker but first 4 bytes are `00000000`

## Key Observation
```
Buffer details:
- First 4 bytes: 00000000  ← This is correct for DICOM!
- Bytes 128-132: 4449434d ("DICM")  ← This is correct!
```

**IMPORTANT:** The first 4 bytes being `00000000` is actually CORRECT for DICOM files! The first 128 bytes are the preamble (usually zeros), then "DICM" at byte 128.

## Likely Causes

### 1. Axios is modifying the buffer
Axios might be:
- Converting Buffer to string
- Adding extra headers
- Modifying content encoding

### 2. Content-Type issue
Orthanc might be rejecting `application/dicom` and expecting `application/octet-stream`

### 3. Authentication headers
The axios client might not be sending auth correctly

## Solution: Use Raw HTTP Request

Instead of axios, use Node.js native `http` or `https` module to send the exact bytes.
