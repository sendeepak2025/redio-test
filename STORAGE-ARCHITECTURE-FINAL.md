# Final Storage Architecture

## ✅ Current Implementation: Orthanc PACS

### Upload Flow:
```
User uploads DICOM file
    ↓
Parse DICOM metadata (studyUID, seriesUID, sopUID, etc.)
    ↓
Upload buffer directly to Orthanc PACS via REST API
    ↓
Orthanc returns: orthancInstanceId, orthancStudyId, orthancSeriesId
    ↓
Get frame count from Orthanc
    ↓
Save metadata to MongoDB with Orthanc references
    ↓
Create instance records (one per frame for multi-frame DICOM)
    ↓
Return success response with Orthanc IDs
```

### Retrieval Flow:
```
User requests frame: GET /api/dicom/studies/{studyUID}/frames/{frameIndex}
    ↓
Query MongoDB for instance with studyUID and frameIndex
    ↓
Get orthancInstanceId and orthancFrameIndex from instance
    ↓
Call Orthanc API: GET /instances/{orthancInstanceId}/frames/{frameIndex}/preview
    ↓
Orthanc generates PNG on-the-fly (or returns cached)
    ↓
Return PNG buffer to user
```

## Storage Locations

### ❌ NOT Stored in Server Directory:
- No files in `server/backend/uploaded_studies/`
- No files in `server/backend/uploaded_frames_*/`
- No local filesystem storage

### ✅ Stored in Orthanc PACS:
- All DICOM files stored in Orthanc database
- Frames generated on-demand by Orthanc
- Location: Orthanc's internal database (typically `/var/lib/orthanc/db`)

### ✅ Stored in MongoDB:
- Study metadata (studyInstanceUID, patientName, etc.)
- Series metadata (seriesInstanceUID, modality, etc.)
- Instance metadata (sopInstanceUID, orthancInstanceId, frameIndex, etc.)
- **Orthanc references** (orthancInstanceId, orthancStudyId, orthancSeriesId)

## Why Orthanc Instead of Server Directory?

### 1. **DICOM Standard Compliance**
- Orthanc implements full DICOM protocol (C-STORE, C-FIND, C-MOVE, C-ECHO)
- Can communicate with medical imaging devices
- Supports DICOM Query/Retrieve
- Modality Worklist support

### 2. **Production-Grade Performance**
- Optimized for medical imaging workloads
- Handles thousands of studies efficiently
- Built-in caching and optimization
- Fast frame extraction

### 3. **Multi-Frame DICOM Support**
- Natively handles multi-frame DICOM files
- Automatic frame extraction
- No manual PNG generation needed

### 4. **RESTful API**
- Easy integration with web applications
- Well-documented API
- JSON responses
- Image format conversion (PNG, JPEG, etc.)

### 5. **Data Integrity**
- Built-in DICOM validation
- Automatic error checking
- Consistent data storage
- Transaction support

### 6. **Scalability**
- Designed for hospital-scale deployments
- Efficient storage management
- Automatic cleanup and archiving
- Load balancing support

### 7. **Backup & Export**
- Easy study export as ZIP
- DICOM C-MOVE for backup
- Standard DICOM archive format
- Disaster recovery support

### 8. **Security**
- Built-in authentication
- HTTPS support
- Access control
- Audit logging

## Data Flow Diagram

```
┌─────────────────┐
│   Web Client    │
│  (Upload DICOM) │
└────────┬────────┘
         │
         ↓
┌─────────────────────────┐
│   Node.js Backend       │
│  uploadController.js    │
│  - Parse DICOM          │
│  - Extract metadata     │
└────────┬────────────────┘
         │
         ↓
┌─────────────────────────┐
│   Orthanc PACS          │
│  - Store DICOM file     │
│  - Generate frames      │
│  - Return Orthanc IDs   │
└────────┬────────────────┘
         │
         ↓
┌─────────────────────────┐
│   MongoDB               │
│  - Study metadata       │
│  - Instance records     │
│  - Orthanc references   │
└─────────────────────────┘

Retrieval:
┌─────────────────┐
│   Web Client    │
│  (Get Frame)    │
└────────┬────────┘
         │
         ↓
┌─────────────────────────┐
│   Node.js Backend       │
│  instanceController.js  │
│  - Query MongoDB        │
│  - Get orthancInstanceId│
└────────┬────────────────┘
         │
         ↓
┌─────────────────────────┐
│   Orthanc PACS          │
│  - Generate PNG frame   │
│  - Return image buffer  │
└────────┬────────────────┘
         │
         ↓
┌─────────────────┐
│   Web Client    │
│  (Display Frame)│
└─────────────────┘
```

## Configuration

### Environment Variables:
```bash
# Orthanc PACS
ORTHANC_URL=http://localhost:8042
ORTHANC_USERNAME=orthanc
ORTHANC_PASSWORD=orthanc
ENABLE_PACS_INTEGRATION=true

# MongoDB
MONGODB_URI=mongodb://localhost:27017/dicomdb
```

### Docker Compose:
```yaml
services:
  orthanc:
    image: jodogne/orthanc-plugins:latest
    ports:
      - "8042:8042"  # REST API
      - "4242:4242"  # DICOM protocol
    environment:
      - ORTHANC_USERNAME=orthanc
      - ORTHANC_PASSWORD=orthanc
    volumes:
      - orthanc-data:/var/lib/orthanc/db
    restart: unless-stopped

  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    restart: unless-stopped

  node-server:
    build: ./server
    ports:
      - "8001:8001"
    environment:
      - ORTHANC_URL=http://orthanc:8042
      - MONGODB_URI=mongodb://mongodb:27017/dicomdb
    depends_on:
      - orthanc
      - mongodb
    restart: unless-stopped

volumes:
  orthanc-data:
  mongo-data:
```

## API Examples

### Upload DICOM:
```bash
curl -X POST http://localhost:8001/api/dicom/upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@scan.dcm" \
  -F "patientID=PAT001" \
  -F "patientName=John Doe"
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully uploaded DICOM file with 120 frame(s) to Orthanc PACS",
  "data": {
    "studyInstanceUID": "1.2.840.113619.2.55.3.604688119.868.1234567890.123",
    "frameCount": 120,
    "orthancInstanceId": "abc123-def456-ghi789",
    "storage": "orthanc-pacs"
  }
}
```

### Get Study:
```bash
curl http://localhost:8001/api/dicom/studies/1.2.840.113619.2.55.3.604688119.868.1234567890.123
```

### Get Frame:
```bash
curl http://localhost:8001/api/dicom/studies/1.2.840.113619.2.55.3.604688119.868.1234567890.123/frames/0 \
  -o frame_0.png
```

### Get All Studies:
```bash
curl http://localhost:8001/api/dicom/studies
```

## Advantages Over Local Filesystem

| Feature | Local Filesystem | Orthanc PACS |
|---------|-----------------|--------------|
| DICOM Protocol | ❌ No | ✅ Yes (C-STORE, C-FIND, C-MOVE) |
| Frame Extraction | ❌ Manual | ✅ Automatic |
| Multi-frame Support | ❌ Complex | ✅ Native |
| Query/Retrieve | ❌ No | ✅ Yes |
| Scalability | ❌ Limited | ✅ High |
| Performance | ⚠️ Moderate | ✅ Excellent |
| Standard Compliance | ❌ No | ✅ Full DICOM |
| Production Ready | ❌ No | ✅ Yes |
| Backup/Export | ❌ Manual | ✅ Built-in |
| Medical Device Integration | ❌ No | ✅ Yes |

## Summary

✅ **All DICOM files are stored in Orthanc PACS**  
✅ **No files stored in server directory**  
✅ **Frames retrieved on-demand from Orthanc**  
✅ **MongoDB stores metadata and Orthanc references**  
✅ **Production-grade, scalable, DICOM-compliant solution**  

This architecture is:
- **Standard**: Full DICOM compliance
- **Scalable**: Handles thousands of studies
- **Fast**: Optimized for medical imaging
- **Reliable**: Battle-tested in hospitals
- **Maintainable**: Clean separation of concerns
- **Secure**: Built-in authentication and access control

---

**Architecture**: Orthanc PACS + MongoDB  
**Storage**: Orthanc (DICOM files) + MongoDB (metadata)  
**Retrieval**: Orthanc REST API  
**Status**: ✅ Production Ready  
