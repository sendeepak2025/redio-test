# 🏥 Complete Radiologist Workflow - Implementation Plan

## 📋 Executive Summary

**Goal**: Enable radiologists to upload DICOM files, view actual medical images in the Advanced Imaging Viewer, and create diagnostic reports.

**Current Status**:
- ✅ Orthanc PACS: Running (9 studies uploaded)
- ✅ Backend API: Running and connected to Orthanc
- ⚠️ MongoDB: Only 5/9 studies synced
- ❌ Viewer: Still showing old studies with placeholders
- ❌ Complete workflow: Not fully tested end-to-end

---

## 🎯 Required Workflow for Radiologists

```
┌──────────────────────────────────────────────────────────────────┐
│                    RADIOLOGIST WORKFLOW                          │
└──────────────────────────────────────────────────────────────────┘

1. 📤 UPLOAD DICOM
   └─> User uploads DICOM file(s) via web interface

2. 🏥 ORTHANC PROCESSING
   └─> Orthanc receives, validates, stores, and indexes DICOM
   └─> Preserves ALL metadata and pixel data
   └─> Handles multi-frame DICOMs (96+ frames)

3. 💾 DATABASE SYNC
   └─> Backend creates MongoDB records
   └─> Links MongoDB to Orthanc via Instance IDs
   └─> Makes studies searchable in worklist

4. 👁️ VIEWER DISPLAY
   └─> Radiologist opens study in Advanced Viewer
   └─> Backend fetches DICOM from Orthanc
   └─> Extracts frames and converts to PNG
   └─> Displays ACTUAL medical images (not placeholders)
   └─> All 96 frames available for review

5. 📊 MEASUREMENT & ANNOTATION
   └─> Radiologist uses tools: zoom, pan, measure, annotate
   └─> All measurements saved to MongoDB
   └─> Annotations linked to specific frames

6. 📝 REPORT CREATION
   └─> Structured reporting interface
   └─> AI-assisted findings (optional)
   └─> Export to PDF/DICOM SR
   └─> Sign and finalize report
```

---

## 🔄 Detailed Data Flow

### **Phase 1: DICOM Upload**

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND (Upload Interface)                                 │
│ /app/viewer/src/pages/...                                   │
└─────────────────┬───────────────────────────────────────────┘
                  │ POST /api/dicom/upload
                  │ Content-Type: multipart/form-data
                  │ Body: { file: DICOM_FILE }
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ BACKEND - Upload Controller                                 │
│ /app/server/src/controllers/uploadController.js            │
│                                                             │
│ Actions:                                                    │
│ 1. Receive file from frontend                              │
│ 2. Validate DICOM format                                   │
│ 3. Parse basic metadata (patient, study UID)               │
│ 4. Forward to Orthanc PACS                                 │
└─────────────────┬───────────────────────────────────────────┘
                  │ POST http://localhost:8042/instances
                  │ Auth: Basic orthanc:orthanc_secure_2024
                  │ Body: Raw DICOM buffer
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ ORTHANC PACS                                                │
│ Port: 8042                                                  │
│                                                             │
│ Processing:                                                 │
│ 1. Validate DICOM standard compliance                      │
│ 2. Parse ALL DICOM tags (patient, study, series, etc.)    │
│ 3. Store original DICOM file                               │
│    Location: /etc/orthanc/OrthancStorage/                  │
│ 4. Create SQLite index                                     │
│    Location: /etc/orthanc/OrthancDatabase/                 │
│ 5. Extract metadata for quick access                       │
│ 6. Generate unique Orthanc Instance ID                     │
│                                                             │
│ Storage Structure:                                          │
│ /etc/orthanc/OrthancStorage/                               │
│   ├── abc/                                                 │
│   │   └── 123.../                                          │
│   │       ├── dicom              (50 MB - original file)   │
│   │       └── dicom.dcm-info.txt (metadata)                │
│   └── def/                                                 │
│       └── 456.../                                          │
│           └── dicom              (2 MB - original file)    │
│                                                             │
│ Returns:                                                    │
│ {                                                           │
│   "ID": "abc123-def456-ghi789",    // Orthanc Instance ID  │
│   "Path": "/instances/abc123...",                          │
│   "Status": "Success",                                     │
│   "ParentStudy": "study-orthanc-id",                       │
│   "ParentSeries": "series-orthanc-id"                      │
│ }                                                           │
└─────────────────┬───────────────────────────────────────────┘
                  │ Response with Orthanc IDs
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ BACKEND - Save to MongoDB                                   │
│ /app/server/src/models/                                    │
│                                                             │
│ Create Documents:                                           │
│                                                             │
│ 1. STUDY DOCUMENT                                           │
│    Collection: studies                                      │
│    {                                                        │
│      studyInstanceUID: "1.2.3...",                          │
│      orthancStudyId: "study-orthanc-id",    // NEW!        │
│      patientName: "Doe^John",                               │
│      patientID: "PAT001",                                   │
│      studyDate: "20250116",                                 │
│      studyDescription: "CT Chest",                          │
│      modality: "CT",                                        │
│      numberOfSeries: 1,                                     │
│      numberOfInstances: 96,                                 │
│      uploadedAt: ISODate(),                                 │
│      orthancSynced: true        // Flag for sync status    │
│    }                                                        │
│                                                             │
│ 2. SERIES DOCUMENT                                          │
│    Collection: series                                       │
│    {                                                        │
│      seriesInstanceUID: "1.2.3.4...",                       │
│      studyInstanceUID: "1.2.3...",                          │
│      orthancSeriesId: "series-orthanc-id",  // NEW!        │
│      seriesNumber: 1,                                       │
│      modality: "CT",                                        │
│      seriesDescription: "Chest Axial",                      │
│      numberOfInstances: 96                                  │
│    }                                                        │
│                                                             │
│ 3. INSTANCE DOCUMENT (CRITICAL!)                            │
│    Collection: instances                                    │
│    {                                                        │
│      sopInstanceUID: "1.2.3.4.5...",                        │
│      studyInstanceUID: "1.2.3...",                          │
│      seriesInstanceUID: "1.2.3.4...",                       │
│      orthancInstanceId: "abc123-def456...",  // KEY LINK!  │
│      orthancUrl: "http://localhost:8042/instances/abc...", │
│      instanceNumber: 1,                                     │
│      numberOfFrames: 96,         // Multi-frame info        │
│      rows: 512,                                             │
│      columns: 512,                                          │
│      bitsAllocated: 16,                                     │
│      pixelSpacing: [0.5, 0.5],                              │
│      windowCenter: 40,                                      │
│      windowWidth: 400                                       │
│    }                                                        │
└─────────────────┬───────────────────────────────────────────┘
                  │ Success response
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND - Upload Success                                   │
│ • Show success notification                                 │
│ • Refresh worklist to show new study                        │
│ • Study is now ready for viewing                            │
└─────────────────────────────────────────────────────────────┘
```

---

### **Phase 2: Viewing & Frame Retrieval**

```
┌─────────────────────────────────────────────────────────────┐
│ RADIOLOGIST ACTION                                          │
│ • Opens worklist/studies page                               │
│ • Clicks on study to open in viewer                         │
│ • Navigate to: /viewer/1.2.3.4.5...                         │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND - Viewer Page Load                                 │
│ Component: ViewerPage.tsx                                   │
│                                                             │
│ Step 1: Fetch Study Metadata                                │
│ GET /api/dicom/studies/{studyUID}                           │
│ Response: {                                                 │
│   studyInstanceUID,                                         │
│   patientName,                                              │
│   numberOfInstances: 96,        // Frame count              │
│   series: [...]                                             │
│ }                                                           │
│                                                             │
│ Step 2: Initialize Viewer                                   │
│ • Set totalFrames = 96                                      │
│ • Set currentFrame = 0                                      │
│ • Generate frame URL array:                                 │
│   [                                                         │
│     "/api/dicom/studies/1.2.3.../frames/0",                 │
│     "/api/dicom/studies/1.2.3.../frames/1",                 │
│     ...                                                     │
│     "/api/dicom/studies/1.2.3.../frames/95"                 │
│   ]                                                         │
│                                                             │
│ Step 3: Request First Frame                                 │
│ GET /api/dicom/studies/{studyUID}/frames/0                  │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ BACKEND - Frame Controller                                  │
│ File: /app/server/src/controllers/instanceController.js    │
│ Function: getFrame(req, res)                                │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Step 1: CHECK FILESYSTEM CACHE                       │   │
│ │                                                      │   │
│ │ Path: /app/server/backend/                          │   │
│ │       uploaded_frames_{studyUID}/frame_000.png      │   │
│ │                                                      │   │
│ │ if (fs.existsSync(framePath)) {                     │   │
│ │   ✅ CACHE HIT - Return PNG immediately (1-5ms)     │   │
│ │   return fs.readFileSync(framePath)                 │   │
│ │ }                                                    │   │
│ └──────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           │ ❌ Cache Miss                   │
│                           ▼                                 │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Step 2: QUERY MONGODB FOR ORTHANC ID                │   │
│ │                                                      │   │
│ │ const instance = await Instance.findOne({           │   │
│ │   studyInstanceUID: studyUID                        │   │
│ │ });                                                  │   │
│ │                                                      │   │
│ │ Extract:                                             │   │
│ │ • orthancInstanceId: "abc123-def456..."             │   │
│ │ • numberOfFrames: 96                                │   │
│ │ • rows, cols, bitsAllocated                         │   │
│ └──────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Step 3: FETCH DICOM FROM ORTHANC                    │   │
│ │                                                      │   │
│ │ GET http://localhost:8042/instances/{orthancId}/file│   │
│ │ Auth: Basic orthanc:orthanc_secure_2024             │   │
│ │                                                      │   │
│ │ Response: Raw DICOM file buffer (50 MB)             │   │
│ └──────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Step 4: PARSE DICOM (dicom-parser)                  │   │
│ │                                                      │   │
│ │ const dataSet = dicomParser.parseDicom(buffer)      │   │
│ │                                                      │   │
│ │ Extract Metadata:                                    │   │
│ │ • (0028,0010) Rows = 512                            │   │
│ │ • (0028,0011) Columns = 512                         │   │
│ │ • (0028,0100) BitsAllocated = 16                    │   │
│ │ • (0028,0008) NumberOfFrames = 96                   │   │
│ │ • (0028,1050) WindowCenter = 40                     │   │
│ │ • (0028,1051) WindowWidth = 400                     │   │
│ │ • (7FE0,0010) PixelData element                     │   │
│ │                                                      │   │
│ │ Locate PixelData:                                    │   │
│ │ • offset: byte position in file                     │   │
│ │ • length: total pixel data size                     │   │
│ └──────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Step 5: EXTRACT SPECIFIC FRAME                      │   │
│ │                                                      │   │
│ │ Calculate frame offset:                              │   │
│ │ bytesPerFrame = rows × cols × (bitsAllocated/8)     │   │
│ │ frameOffset = pixelDataOffset + (frameIndex ×       │   │
│ │               bytesPerFrame)                         │   │
│ │                                                      │   │
│ │ Extract pixel array:                                 │   │
│ │ const frameBytes = buffer.slice(                     │   │
│ │   frameOffset,                                       │   │
│ │   frameOffset + bytesPerFrame                       │   │
│ │ )                                                    │   │
│ │                                                      │   │
│ │ Handle compression if needed:                        │   │
│ │ • JPEG: decode with jpeg-js                         │   │
│ │ • RLE: decode with dicom-rle                        │   │
│ │ • Uncompressed: use directly                        │   │
│ └──────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Step 6: APPLY WINDOW/LEVEL (VOI LUT)               │   │
│ │                                                      │   │
│ │ For each pixel value:                                │   │
│ │                                                      │   │
│ │ 1. Apply rescale:                                    │   │
│ │    value = pixel × rescaleSlope + rescaleIntercept  │   │
│ │                                                      │   │
│ │ 2. Apply window:                                     │   │
│ │    low = windowCenter - windowWidth/2               │   │
│ │    high = windowCenter + windowWidth/2              │   │
│ │    normalized = (value - low) / (high - low)        │   │
│ │                                                      │   │
│ │ 3. Map to 0-255 range:                              │   │
│ │    displayValue = normalized × 255                  │   │
│ │                                                      │   │
│ │ 4. Invert if MONOCHROME1:                           │   │
│ │    if (monochrome1) displayValue = 255 - value      │   │
│ └──────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Step 7: CONVERT TO PNG                              │   │
│ │                                                      │   │
│ │ const png = new PNG({                                │   │
│ │   width: cols,                                       │   │
│ │   height: rows                                       │   │
│ │ })                                                   │   │
│ │                                                      │   │
│ │ // Fill PNG data                                     │   │
│ │ for (let i = 0; i < pixels.length; i++) {           │   │
│ │   const idx = i * 4                                 │   │
│ │   png.data[idx] = pixelValue      // R              │   │
│ │   png.data[idx+1] = pixelValue    // G              │   │
│ │   png.data[idx+2] = pixelValue    // B              │   │
│ │   png.data[idx+3] = 255           // A              │   │
│ │ }                                                    │   │
│ │                                                      │   │
│ │ const pngBuffer = PNG.sync.write(png)                │   │
│ └──────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Step 8: SAVE TO CACHE                               │   │
│ │                                                      │   │
│ │ fs.writeFileSync(                                    │   │
│ │   `/app/server/backend/                             │   │
│ │    uploaded_frames_{studyUID}/                      │   │
│ │    frame_000.png`,                                  │   │
│ │   pngBuffer                                          │   │
│ │ )                                                    │   │
│ │                                                      │   │
│ │ ✅ Next request for this frame will be from cache   │   │
│ └──────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Step 9: RETURN PNG TO FRONTEND                      │   │
│ │                                                      │   │
│ │ res.setHeader('Content-Type', 'image/png')          │   │
│ │ res.setHeader('Cache-Control', 'max-age=31536000')  │   │
│ │ res.setHeader('X-Frame-Source', 'orthanc')          │   │
│ │ res.end(pngBuffer)                                   │   │
│ │                                                      │   │
│ │ Time: 50-100ms first time                            │   │
│ │ Time: 1-5ms from cache                              │   │
│ └──────────────────────────────────────────────────────┘   │
└─────────────────┬───────────────────────────────────────────┘
                  │ PNG image
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND - Display Frame                                    │
│ Component: MedicalImageViewer.tsx                           │
│                                                             │
│ const img = new Image()                                     │
│ img.src = "/api/dicom/studies/.../frames/0"                 │
│ img.onload = () => {                                        │
│   const canvas = canvasRef.current                          │
│   const ctx = canvas.getContext('2d')                       │
│   ctx.drawImage(img, x, y, width, height)                   │
│                                                             │
│   // Apply viewport transforms                              │
│   // - Zoom level                                           │
│   // - Pan offset                                           │
│   // - Additional window/level adjustments                  │
│                                                             │
│   // Draw overlays                                          │
│   // - Measurements                                         │
│   // - Annotations                                          │
│   // - Patient info                                         │
│ }                                                           │
│                                                             │
│ ✅ RADIOLOGIST SEES ACTUAL MEDICAL IMAGE                    │
└─────────────────────────────────────────────────────────────┘
```

---

### **Phase 3: Report Creation**

```
┌─────────────────────────────────────────────────────────────┐
│ RADIOLOGIST WORKFLOW IN VIEWER                              │
│                                                             │
│ 1. Review Images:                                           │
│    • Scroll through all 96 frames                           │
│    • Adjust window/level for different tissues             │
│    • Use zoom/pan for detailed inspection                  │
│                                                             │
│ 2. Make Measurements:                                       │
│    • Length: measure lesions                                │
│    • Angle: check alignment                                 │
│    • Area: calculate regions                                │
│    • Saved to MongoDB with frame number                     │
│                                                             │
│ 3. Add Annotations:                                         │
│    • Text: label findings                                   │
│    • Arrows: point to abnormalities                         │
│    • Freehand: circle areas of interest                     │
│    • Saved to MongoDB with coordinates                      │
│                                                             │
│ 4. Switch to Reporting Tab                                  │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ STRUCTURED REPORTING INTERFACE                              │
│ Component: StructuredReporting.tsx                          │
│                                                             │
│ Report Sections:                                            │
│                                                             │
│ 1. Clinical History                                         │
│    • Patient symptoms                                       │
│    • Reason for exam                                        │
│    • Previous studies                                       │
│                                                             │
│ 2. Technique                                                │
│    • Modality: CT/MRI/XR                                    │
│    • Contrast: Yes/No                                       │
│    • Protocol                                               │
│                                                             │
│ 3. Findings (Auto-populated from annotations)               │
│    • Body parts examined                                    │
│    • Normal findings                                        │
│    • Abnormal findings with measurements                    │
│    • AI suggestions (optional)                              │
│                                                             │
│ 4. Impressions                                              │
│    • Summary of key findings                                │
│    • Diagnostic conclusions                                 │
│    • Recommendations                                        │
│                                                             │
│ 5. Comparison (if previous study)                           │
│    • Changes since last exam                                │
│    • Progression/regression                                 │
│                                                             │
│ 6. Signature                                                │
│    • Radiologist name                                       │
│    • Credentials                                            │
│    • Date/time                                              │
│    • Electronic signature                                   │
└─────────────────┬───────────────────────────────────────────┘
                  │ Click "Finalize Report"
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ BACKEND - Save Report                                       │
│ POST /api/structured-reports                                │
│                                                             │
│ MongoDB: structuredreports collection                       │
│ {                                                           │
│   studyInstanceUID: "1.2.3...",                             │
│   patientID: "PAT001",                                      │
│   reportDate: ISODate(),                                    │
│   radiologistName: "Dr. Smith",                             │
│   sections: {                                               │
│     clinicalHistory: "...",                                 │
│     technique: "...",                                       │
│     findings: [...],                                        │
│     impressions: "...",                                     │
│     measurements: [                                         │
│       { type: "length", value: 2.5, unit: "cm" }           │
│     ],                                                      │
│     annotations: [...]                                      │
│   },                                                        │
│   status: "finalized",                                      │
│   signature: {                                              │
│     name: "Dr. Smith",                                      │
│     timestamp: ISODate(),                                   │
│     verified: true                                          │
│   }                                                         │
│ }                                                           │
│                                                             │
│ Export Options:                                             │
│ • PDF: Generate formatted report                            │
│ • DICOM SR: Structured Report object                        │
│ • HL7: Send to EMR system                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Implementation Plan

### **Current Status Assessment**

✅ **COMPLETED:**
1. Orthanc PACS installed and running (port 8042)
2. Backend connected to Orthanc
3. 9 studies uploaded to Orthanc (30 DICOM files)
4. Frame extraction logic implemented
5. MongoDB connected
6. Basic sync script created

⚠️ **PARTIALLY COMPLETE:**
1. MongoDB has only 5/9 studies synced
2. Old studies still in database (without Orthanc IDs)
3. Viewer showing old studies with placeholders

❌ **NOT WORKING:**
1. Complete upload-to-view workflow not tested
2. Radiologists can't access newly uploaded studies
3. Report creation not linked to actual images

---

### **Step-by-Step Execution Plan**

#### **STEP 1: Clean Database & Full Sync** ⏱️ 5 minutes

**Goal**: Remove old placeholder studies and sync ALL Orthanc studies to MongoDB

**Actions**:
```bash
# 1. Clean old studies without Orthanc IDs
mongosh mongodb://127.0.0.1:27017/dicomdb <<EOF
db.studies.deleteMany({ orthancStudyId: { \$exists: false } })
db.series.deleteMany({})
db.instances.deleteMany({ orthancInstanceId: { \$exists: false } })
EOF

# 2. Run full sync from Orthanc
cd /app/server
node sync-orthanc-to-mongodb.js
```

**Expected Result**:
- 9 studies in MongoDB (matching Orthanc)
- All studies have orthancInstanceId
- All ready for frame retrieval

**Verification**:
```bash
# Check MongoDB count
mongosh mongodb://127.0.0.1:27017/dicomdb \
  --eval "db.studies.countDocuments({})"
# Expected: 9

# Check Orthanc count
curl -s -u orthanc:orthanc_secure_2024 \
  http://localhost:8042/studies | jq 'length'
# Expected: 9

# Verify linking
mongosh mongodb://127.0.0.1:27017/dicomdb --eval \
  "db.instances.findOne({}, {orthancInstanceId: 1})"
# Should show orthancInstanceId field
```

---

#### **STEP 2: Test Frame Retrieval** ⏱️ 10 minutes

**Goal**: Verify that actual images can be retrieved from Orthanc

**Actions**:
```bash
# 1. Get a study UID from database
STUDY_UID=$(mongosh mongodb://127.0.0.1:27017/dicomdb --quiet \
  --eval "db.studies.findOne({}).studyInstanceUID" | tr -d '"')

echo "Testing study: $STUDY_UID"

# 2. Test frame 0 retrieval
curl "http://localhost:8001/api/dicom/studies/$STUDY_UID/frames/0" \
  -o /tmp/test_frame0.png

# 3. Verify it's a real PNG (not placeholder)
ls -lh /tmp/test_frame0.png
# Should be 50-70 KB

# 4. Check cache was created
ls -lh /app/server/backend/uploaded_frames_$STUDY_UID/
# Should show frame_000.png

# 5. Test multiple frames
for i in 0 1 2 5 10; do
  curl -s "http://localhost:8001/api/dicom/studies/$STUDY_UID/frames/$i" \
    -o /tmp/frame_$i.png
  echo "Frame $i: $(ls -lh /tmp/frame_$i.png | awk '{print $5}')"
done
```

**Expected Result**:
- All frames downloaded successfully
- PNG files are 50-70 KB each (real medical images)
- Cache directory populated
- Backend logs show "Orthanc" as frame source

**If FAILS**: Check backend logs for errors
```bash
tail -f /var/log/supervisor/backend.out.log
```

---

#### **STEP 3: Test Complete Upload Flow** ⏱️ 15 minutes

**Goal**: Upload a NEW DICOM and verify end-to-end workflow

**Actions**:
```bash
# 1. Find a test DICOM file
TEST_DICOM="/app/server/backend/uploaded_studies/1.3.6.1.4.1.16568.1759529027419.902310400/1.3.6.1.4.1.16568.1759529027420.331091087/1.3.12.2.1107.5.4.3.321890.19960124.162922.29.dcm"

# 2. Upload via backend API
curl -X POST "http://localhost:8001/api/dicom/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@$TEST_DICOM" \
  -v

# Response should include:
# - studyInstanceUID
# - orthancInstanceId
# - success: true

# 3. Verify in Orthanc
STUDY_COUNT=$(curl -s -u orthanc:orthanc_secure_2024 \
  http://localhost:8042/studies | jq 'length')
echo "Studies in Orthanc: $STUDY_COUNT"
# Should be 10 now (was 9)

# 4. Verify in MongoDB
MONGO_COUNT=$(mongosh mongodb://127.0.0.1:27017/dicomdb --quiet \
  --eval "db.studies.countDocuments({})")
echo "Studies in MongoDB: $MONGO_COUNT"
# Should be 10

# 5. Test viewing the new study
NEW_STUDY_UID=$(mongosh mongodb://127.0.0.1:27017/dicomdb --quiet \
  --eval "db.studies.find().sort({_id:-1}).limit(1).toArray()[0].studyInstanceUID" \
  | tr -d '"')

echo "New study UID: $NEW_STUDY_UID"

curl "http://localhost:8001/api/dicom/studies/$NEW_STUDY_UID/frames/0" \
  -o /tmp/new_study_frame0.png

ls -lh /tmp/new_study_frame0.png
```

**Expected Result**:
- Upload succeeds
- Orthanc count increases by 1
- MongoDB count increases by 1
- New study has orthancInstanceId
- Frame retrieval works for new study

---

#### **STEP 4: Frontend Testing** ⏱️ 20 minutes

**Goal**: Verify radiologist can view actual images in browser

**Manual Testing Steps**:

1. **Open Application**
   - Navigate to preview URL in browser
   - Login if required

2. **Check Worklist**
   - Go to Studies/Worklist page
   - Should see 10 studies listed
   - Each study should show:
     - Patient name
     - Study date
     - Modality
     - Number of instances

3. **Open Study in Viewer**
   - Click on "Rubo DEMO" study (96 frames)
   - Viewer should load
   - Should display ACTUAL medical image (not checkerboard)
   - Frame counter should show "Frame 1 / 96"

4. **Test Navigation**
   - Scroll mouse wheel → Advance through frames
   - Click Next/Previous buttons
   - Use frame slider
   - All frames should show real images

5. **Test Tools**
   - Zoom: Mouse scroll or zoom button
   - Pan: Click and drag
   - Window/Level: Adjust brightness/contrast
   - Measurements: Draw length measurement
   - Annotations: Add text annotation

6. **Test Cine Loop**
   - Click Play button
   - Should smoothly play through all 96 frames
   - Adjust FPS slider
   - Should loop back to frame 1

7. **Check Performance**
   - First playthrough: May be slow (generating cache)
   - Second playthrough: Should be fast (from cache)
   - Open browser DevTools → Network tab
   - Frame requests should be < 50ms

**Success Criteria**:
- ✅ All 96 frames display real medical images
- ✅ No checkerboard placeholders
- ✅ Smooth navigation between frames
- ✅ Tools work correctly
- ✅ Cine playback is smooth on second run

---

#### **STEP 5: Report Creation Testing** ⏱️ 15 minutes

**Goal**: Verify report creation workflow

**Testing Steps**:

1. **Open Study in Viewer**
   - Load a study with measurements/annotations

2. **Switch to Reporting Tab**
   - Click "Structured Reporting" tab

3. **Fill Report Sections**
   - Clinical History: Enter test data
   - Technique: Select modality
   - Findings: Should auto-populate from annotations
   - Impressions: Enter diagnostic summary

4. **Add Measurements**
   - Should pull from viewer measurements
   - Verify values are correct

5. **Finalize Report**
   - Click "Finalize Report"
   - Enter signature
   - Submit

6. **Verify Report Saved**
```bash
# Check MongoDB
mongosh mongodb://127.0.0.1:27017/dicomdb --eval \
  "db.structuredreports.find().pretty()"
```

7. **Export Report**
   - Export as PDF
   - Verify PDF contains:
     - Patient info
     - Study images
     - Findings
     - Measurements
     - Signature

---

### **Critical Files to Review/Update**

#### **Backend Files**:

1. **Upload Controller**: `/app/server/src/controllers/uploadController.js`
   - Should send to Orthanc
   - Should save MongoDB with orthancInstanceId

2. **Instance Controller**: `/app/server/src/controllers/instanceController.js`
   - Should fetch from Orthanc using orthancInstanceId
   - Should extract correct frame
   - Should cache PNG

3. **Instance Model**: `/app/server/src/models/Instance.js`
   - Must have orthancInstanceId field
   - Must have orthancUrl field

4. **Frame Cache Service**: `/app/server/src/services/frame-cache-service.js`
   - Should query MongoDB for orthancInstanceId
   - Should fetch from Orthanc
   - Should handle multi-frame extraction

#### **Frontend Files**:

1. **Viewer Page**: `/app/viewer/src/pages/viewer/ViewerPage.tsx`
   - Should fetch study metadata
   - Should generate frame URLs
   - Should display from /api/dicom/studies/{uid}/frames/{index}

2. **Medical Image Viewer**: `/app/viewer/src/components/viewer/MedicalImageViewer.tsx`
   - Should render frames on canvas
   - Should handle frame navigation
   - Should support measurements/annotations

3. **Reporting Interface**: `/app/viewer/src/components/reporting/ReportingInterface.tsx`
   - Should collect report data
   - Should save to backend
   - Should support export

---

## ✅ Success Criteria

### **For Radiologists**:

1. ✅ Upload DICOM file → Study appears in worklist within 5 seconds
2. ✅ Click study → Viewer opens with ACTUAL medical images (no placeholders)
3. ✅ All frames accessible (96/96 not 1/96)
4. ✅ Smooth cine playback after first load
5. ✅ Measurements accurate and saved
6. ✅ Annotations visible and persistent
7. ✅ Reports created with all data
8. ✅ Reports exportable as PDF/DICOM SR

### **Technical Metrics**:

1. ✅ Upload time: < 2 seconds per DICOM
2. ✅ First frame load: < 100ms (from Orthanc)
3. ✅ Cached frame load: < 5ms
4. ✅ Cine playback: > 15 FPS on second run
5. ✅ Database queries: < 50ms
6. ✅ No 404 errors on frame requests
7. ✅ 100% of frames render correctly

---

## 🚨 Troubleshooting

### **Issue: Checkerboard Still Showing**

**Cause**: Viewing old study without Orthanc ID

**Solution**:
```bash
# Check if study has Orthanc ID
mongosh mongodb://127.0.0.1:27017/dicomdb --eval \
  "db.instances.findOne({studyInstanceUID: 'YOUR_STUDY_UID'}, \
   {orthancInstanceId: 1})"

# If null, study needs re-upload
```

### **Issue: Frame Request Returns 500**

**Check Backend Logs**:
```bash
tail -f /var/log/supervisor/backend.out.log | grep -i error
```

**Common causes**:
- Orthanc not running
- MongoDB instance missing orthancInstanceId
- DICOM file corrupt

### **Issue: Slow Frame Loading**

**Check Cache**:
```bash
ls -lh /app/server/backend/uploaded_frames_*/
```

**Check Network**:
- Open browser DevTools → Network
- Frame requests should be < 100ms
- If > 1 second, Orthanc may be slow

---

## 📊 Monitoring & Verification

### **Real-time Monitoring**:

```bash
# Watch backend logs
tail -f /var/log/supervisor/backend.out.log

# Watch Orthanc logs
tail -f /var/log/supervisor/orthanc.out.log

# Monitor services
watch -n 2 'sudo supervisorctl status'
```

### **Database Checks**:

```bash
# Count studies
mongosh mongodb://127.0.0.1:27017/dicomdb --eval \
  "db.studies.countDocuments({})"

# Check Orthanc linking
mongosh mongodb://127.0.0.1:27017/dicomdb --eval \
  "db.instances.countDocuments({orthancInstanceId: {\$exists: true}})"

# List recent uploads
mongosh mongodb://127.0.0.1:27017/dicomdb --eval \
  "db.studies.find({}, {patientName:1, studyDate:1, numberOfInstances:1}) \
   .sort({_id:-1}).limit(5).toArray()"
```

### **Orthanc Checks**:

```bash
# System status
curl -s -u orthanc:orthanc_secure_2024 \
  http://localhost:8042/system | jq '.'

# Statistics
curl -s -u orthanc:orthanc_secure_2024 \
  http://localhost:8042/statistics | jq '.'

# List studies
curl -s -u orthanc:orthanc_secure_2024 \
  http://localhost:8042/studies | jq 'length'
```

---

## 🎯 Next Actions - YOUR APPROVAL NEEDED

Before I proceed with implementation, please confirm:

1. ✅ **Architecture Approved?**
   - Upload → Orthanc → MongoDB → Viewer workflow correct?

2. ✅ **Testing Plan Approved?**
   - Steps 1-5 cover all requirements?

3. ✅ **Report Requirements?**
   - What specific fields needed in reports?
   - PDF export sufficient or need DICOM SR?

4. ✅ **Ready to Execute?**
   - Shall I proceed with Step 1 (Clean & Sync)?
   - Or do you want to review anything first?

**Please confirm and I'll execute the complete plan!** 🚀
