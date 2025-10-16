# 🏥 Quick Reference: System Architecture & Data Flow

## 📋 Current System Status

```bash
# Check all services
sudo supervisorctl status

# Expected output:
✅ orthanc   - RUNNING (port 8042)
✅ backend   - RUNNING (port 8001)
✅ frontend  - RUNNING (port 3000)
✅ mongodb   - RUNNING (port 27017)
```

---

## 🔄 Data Flow Diagram

```
┌──────────────┐
│    USER      │
│  (Browser)   │
└──────┬───────┘
       │ Upload DICOM
       ▼
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                        │
│                     localhost:3000                          │
│  • Upload Interface                                         │
│  • Viewer (Canvas rendering)                                │
│  • Worklist/Studies browser                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP REST API
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (Node.js)                         │
│                   localhost:8001                            │
│  Routes: /api/dicom/*                                       │
│  • Upload controller                                        │
│  • Frame retrieval                                          │
│  • Study management                                         │
└────┬──────────┬──────────┬──────────────────────────────────┘
     │          │          │
     │          │          │
     ▼          ▼          ▼
┌─────────┐ ┌────────┐ ┌──────────────────┐
│ Orthanc │ │MongoDB │ │   Filesystem     │
│  PACS   │ │Database│ │  Cache (PNG)     │
│  :8042  │ │ :27017 │ │ backend/         │
│         │ │        │ │ uploaded_frames/ │
└─────────┘ └────────┘ └──────────────────┘
     │          │               │
     │          │               │
Original    Metadata        Extracted
 DICOM     Study/Series      PNG Frames
  Files    Instance IDs      (Cache)
```

---

## 📤 Upload Workflow (Simplified)

```
User Uploads → Frontend → Backend → Orthanc PACS
                                        ↓
                                   Stores DICOM
                                        ↓
                Backend ← Orthanc Instance ID
                    ↓
                MongoDB ← Save Metadata
                    ↓
            Response to Frontend ✅
```

---

## 👁️ Viewing Workflow (Simplified)

```
User Opens Viewer → Request Frame 0
                         ↓
                   Check Cache?
                    ↙        ↘
              YES (FAST)   NO (FIRST TIME)
               ↓                ↓
          Return PNG      Get from Orthanc
          (1-5ms)              ↓
                          Extract Frame
                               ↓
                          Convert to PNG
                               ↓
                          Save to Cache
                               ↓
                          Return PNG
                          (50-100ms)
```

---

## 🗂️ Storage Locations

```
1. ORIGINAL DICOM FILES:
   /etc/orthanc/OrthancStorage/
   ├── abc/123/dicom          (50 MB - multi-frame DICOM)
   └── def/456/dicom          (2 MB - single image)

2. PNG CACHE:
   /app/server/backend/
   ├── uploaded_frames_1.2.3.../
   │   ├── frame_000.png      (60 KB)
   │   ├── frame_001.png      (62 KB)
   │   └── ... (94 more)
   └── uploaded_frames_4.5.6.../
       └── frame_000.png      (58 KB)

3. METADATA:
   MongoDB: dicomdb
   ├── studies       (Study-level info)
   ├── series        (Series-level info)
   └── instances     (Instance + Orthanc ID mapping)
```

---

## 🔌 Key API Endpoints

### Study Management
```bash
# List all studies
GET http://localhost:8001/api/dicom/studies

# Get study details
GET http://localhost:8001/api/dicom/studies/{studyUID}

# Get study metadata
GET http://localhost:8001/api/dicom/studies/{studyUID}/metadata
```

### Frame Retrieval
```bash
# Get specific frame as PNG
GET http://localhost:8001/api/dicom/studies/{studyUID}/frames/{frameIndex}
```

### Upload
```bash
# Upload DICOM
POST http://localhost:8001/api/dicom/upload
Content-Type: multipart/form-data
Body: { file: DICOM_FILE }

# Upload ZIP
POST http://localhost:8001/api/dicom/upload/zip
Content-Type: multipart/form-data
Body: { file: ZIP_FILE }
```

### PACS
```bash
# Test Orthanc connection
GET http://localhost:8001/api/pacs/test

# Sync PACS to database
POST http://localhost:8001/api/pacs/sync
```

### Direct Orthanc Access
```bash
# System info
curl -u orthanc:orthanc_secure_2024 \
  http://localhost:8042/system

# List studies
curl -u orthanc:orthanc_secure_2024 \
  http://localhost:8042/studies

# Get DICOM file
curl -u orthanc:orthanc_secure_2024 \
  http://localhost:8042/instances/{instanceId}/file \
  -o download.dcm
```

---

## 🎯 Multi-Frame Processing

### Example: 96-Frame CT Scan

```
DICOM File: 50 MB
┌────────────────────────────────────┐
│ Header: NumberOfFrames = 96       │
│                                    │
│ PixelData:                         │
│  ├─ Frame 0  (512x512, 16-bit)    │
│  ├─ Frame 1  (512x512, 16-bit)    │
│  ├─ Frame 2  (512x512, 16-bit)    │
│  │  ...                            │
│  └─ Frame 95 (512x512, 16-bit)    │
└────────────────────────────────────┘
           │
           ▼
    Upload to Orthanc
           │
           ▼
   Stored as single file
   Instance ID: "abc123..."
           │
           ▼
  MongoDB Record:
  {
    orthancInstanceId: "abc123...",
    numberOfFrames: 96  ✅
  }
           │
           ▼
  User views frame 0
           │
           ▼
  Backend extracts frame 0
  Saves: uploaded_frames_.../frame_000.png
           │
           ▼
  User scrolls → frame 1
           │
           ▼
  Backend extracts frame 1
  Saves: uploaded_frames_.../frame_001.png
           │
           ▼
  ... continues for all 96 frames
           │
           ▼
  ALL frames cached as PNG
  Total cache: ~6 MB (vs 50 MB DICOM)
  Next playback: ALL frames from cache (fast!)
```

---

## ⚡ Performance Metrics

### Upload
```
Single DICOM (1 frame):    200ms
Multi-frame (96 frames):   1-2 seconds
ZIP (100 files):           10-30 seconds
```

### Frame Retrieval
```
Cache Hit (existing PNG):   1-5ms      ⚡
Cache Miss (first time):    50-100ms   🔄
```

### Playback
```
All cached:    60 FPS possible  🚀
Mixed cache:   10-20 FPS        👍
No cache:      2-5 FPS          🐌
```

---

## 🔧 Quick Troubleshooting

### Services Not Running
```bash
# Restart all
sudo supervisorctl restart all

# Check logs
tail -f /var/log/supervisor/backend.out.log
tail -f /var/log/supervisor/orthanc.out.log
```

### Orthanc Connection Failed
```bash
# Test connection
curl -u orthanc:orthanc_secure_2024 http://localhost:8042/system

# Check if running
sudo supervisorctl status orthanc

# Restart if needed
sudo supervisorctl restart orthanc
```

### Placeholder Images
```bash
# Check cache
ls /app/server/backend/uploaded_frames_{studyUID}/

# Re-upload DICOM through UI (best solution)

# OR manually trigger frame generation by viewing in browser
```

### MongoDB Issues
```bash
# Test connection
mongosh mongodb://127.0.0.1:27017/dicomdb

# Count studies
mongosh mongodb://127.0.0.1:27017/dicomdb \
  --eval "db.studies.countDocuments({})"
```

---

## 📊 Configuration Files

### Backend .env
```bash
/app/server/.env

Key settings:
- ENABLE_PACS_INTEGRATION=true ✅
- ORTHANC_URL=http://localhost:8042
- ORTHANC_USERNAME=orthanc
- ORTHANC_PASSWORD=orthanc_secure_2024
- MONGODB_URI=mongodb://127.0.0.1:27017/dicomdb
```

### Orthanc Config
```bash
/etc/orthanc/orthanc.json

Key settings:
- HttpPort: 8042
- DicomPort: 4242
- RegisteredUsers: { "orthanc": "orthanc_secure_2024" }
- StorageDirectory: "OrthancStorage"
```

### Supervisor Services
```bash
/etc/supervisor/conf.d/

Files:
- supervisord.conf (backend, frontend, mongodb)
- orthanc.conf (orthanc)
```

---

## 🎓 Key Concepts

### Orthanc Instance ID
```
- Unique ID for each DICOM in Orthanc
- Example: "abc123-def456-ghi789"
- Stored in MongoDB: orthancInstanceId field
- Used to fetch DICOM for frame extraction
```

### Frame Caching
```
Strategy: Lazy Loading
- Extract frames on-demand
- Save as PNG for reuse
- Cache persists across restarts

Cache Location:
/app/server/backend/uploaded_frames_{studyUID}/
```

### 3-Tier Architecture
```
Tier 1: Orthanc (Source of Truth)
  - Original DICOM files
  - Full metadata preserved
  - Can regenerate all frames

Tier 2: Filesystem Cache (Performance)
  - Extracted PNG frames
  - Fast access (1-5ms)
  - Can be deleted & regenerated

Tier 3: MongoDB (Metadata)
  - Searchable study index
  - Orthanc ID mapping
  - User data (annotations, etc.)
```

---

## 🚀 Testing Checklist

- [ ] Upload single DICOM → Success
- [ ] Upload multi-frame DICOM (96 frames) → Success
- [ ] View study → Real images (not checkerboard)
- [ ] Scroll through frames → All frames load
- [ ] Play cine loop → Smooth playback
- [ ] Zoom/Pan tools → Working
- [ ] Measurements → Working
- [ ] Annotations → Working
- [ ] Upload ZIP → Success
- [ ] All 4 services running
- [ ] Orthanc accessible at :8042
- [ ] Backend API responding
- [ ] MongoDB connected

---

**Quick Start Testing:**

1. Open preview URL in browser
2. Go to Upload page
3. Upload any DICOM file
4. View in Advanced Viewer
5. Confirm real medical images display
6. Scroll through frames
7. Test tools (zoom, measure)

✅ If you see real medical images instead of checkerboards, **system is working correctly!**

---

For detailed workflow, see: `/app/UPDATED-WORKFLOW.md`
