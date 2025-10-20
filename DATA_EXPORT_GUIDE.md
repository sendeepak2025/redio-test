# Data Export Feature Guide

## Overview

The data export feature allows you to export complete patient and study data including:
- Patient demographics and metadata
- Study information and DICOM metadata
- All DICOM files (.dcm format)
- Preview images (PNG format)
- AI analysis results (if available)

All data is packaged into a convenient ZIP file for easy backup, transfer, or archival.

## Features

### 1. Patient Data Export
Export all data for a specific patient including all their studies.

**What's Included:**
- Patient information (ID, name, birth date, sex)
- All studies associated with the patient
- Complete DICOM files for all studies
- Preview images for all frames
- AI analysis results
- Comprehensive metadata in JSON format

### 2. Study Data Export
Export a single study with all its DICOM files and metadata.

**What's Included:**
- Study metadata (UID, date, time, modality, description)
- Patient information
- All DICOM instances (.dcm files)
- Preview images (PNG format)
- AI analysis results
- Complete metadata in JSON format

### 3. Flexible Export Options
- **Include Images**: Choose whether to include DICOM files and previews
- **Metadata Only**: Export just the JSON metadata (smaller file size)
- **Format Options**: ZIP archive or JSON only

## How to Use

### From Patient List

1. Navigate to the Patients page
2. Find the patient you want to export
3. Click the "Export Data" button on the patient card
4. Choose export options:
   - Check/uncheck "Include DICOM images and previews"
   - Review export details
5. Click "Export Data"
6. The ZIP file will download automatically

### From Studies List

1. Navigate to the Studies tab
2. Find the study you want to export
3. Click the download icon next to the study
4. Choose export options
5. Click "Export Data"
6. The ZIP file will download automatically

### From Patient Details Dialog

1. Click on a patient to view their studies
2. Click the download icon on any study card
3. Choose export options
4. Click "Export Data"
5. The ZIP file will download automatically

## Export Package Structure

### Patient Export (ZIP)
```
patient_[PATIENT_ID]_export.zip
├── patient_data.json          # Complete metadata
└── studies/
    ├── [STUDY_UID_1]/
    │   ├── 1.dcm              # DICOM files
    │   ├── 2.dcm
    │   └── previews/
    │       ├── frame_0.png    # Preview images
    │       └── frame_1.png
    └── [STUDY_UID_2]/
        └── ...
```

### Study Export (ZIP)
```
study_[STUDY_UID]_export.zip
├── study_data.json            # Complete metadata
├── dicom/
│   ├── 1.dcm                  # DICOM files
│   └── 2.dcm
└── previews/
    ├── frame_0.png            # Preview images
    └── frame_1.png
```

## Metadata Format

The JSON metadata file contains:

### Patient Export Metadata
```json
{
  "patient": {
    "patientID": "string",
    "patientName": "string",
    "birthDate": "string",
    "sex": "string",
    "exportDate": "ISO timestamp",
    "studyCount": number
  },
  "studies": [
    {
      "studyInstanceUID": "string",
      "studyDate": "string",
      "studyTime": "string",
      "modality": "string",
      "studyDescription": "string",
      "numberOfSeries": number,
      "numberOfInstances": number,
      "aiAnalysis": object,
      "aiAnalyzedAt": "ISO timestamp",
      "aiModels": ["string"]
    }
  ],
  "instances": [
    {
      "sopInstanceUID": "string",
      "studyInstanceUID": "string",
      "seriesInstanceUID": "string",
      "instanceNumber": number,
      "numberOfFrames": number,
      "orthancInstanceId": "string"
    }
  ],
  "metadata": {
    "exportedBy": "username",
    "exportedAt": "ISO timestamp",
    "version": "1.0",
    "includesImages": boolean
  }
}
```

## API Endpoints

### Export Patient Data
```
GET /api/export/patient/:patientID?includeImages=true&format=zip
```

**Parameters:**
- `patientID` (required): Patient ID to export
- `includeImages` (optional): Include DICOM files (default: true)
- `format` (optional): 'zip' or 'json' (default: 'zip')

**Authentication:** Required (Bearer token)

### Export Study Data
```
GET /api/export/study/:studyUID?includeImages=true&format=zip
```

**Parameters:**
- `studyUID` (required): Study Instance UID to export
- `includeImages` (optional): Include DICOM files (default: true)
- `format` (optional): 'zip' or 'json' (default: 'zip')

**Authentication:** Required (Bearer token)

### Export All Data (Admin Only)
```
GET /api/export/all?includeImages=false
```

**Parameters:**
- `includeImages` (optional): Include DICOM files (default: false)

**Authentication:** Required (Bearer token)

## Use Cases

### 1. Patient Data Backup
Export patient data regularly for backup purposes:
- Full backup with images for complete archival
- Metadata-only backup for quick snapshots

### 2. Data Transfer
Transfer patient data between systems:
- Export from one system
- Import into another PACS or viewer
- Maintain complete data integrity

### 3. Research and Analysis
Export data for research purposes:
- Include AI analysis results
- Export specific studies for analysis
- Maintain DICOM compliance

### 4. Legal and Compliance
Export data for legal or compliance requirements:
- Complete patient records
- Timestamped exports
- Audit trail in metadata

### 5. Patient Portability
Provide patients with their medical imaging data:
- Export in standard DICOM format
- Include preview images for easy viewing
- Comprehensive metadata

## Technical Details

### Backend Implementation
- **Controller**: `server/src/controllers/exportController.js`
- **Routes**: `server/src/routes/export.js`
- **Archive Library**: archiver (v7.0.1)
- **Compression**: ZIP with level 9 compression

### Frontend Implementation
- **API Service**: `viewer/src/services/ApiService.ts`
- **UI Component**: `viewer/src/pages/patients/PatientsPage.tsx`
- **Download Method**: Automatic browser download

### Data Sources
- **Database**: MongoDB (patient, study, instance metadata)
- **PACS**: Orthanc (DICOM files and images)
- **Unified Service**: `unified-orthanc-service.js`

## Security Considerations

1. **Authentication Required**: All export endpoints require valid JWT token
2. **Hospital Isolation**: Users can only export data from their hospital
3. **Audit Logging**: All exports are logged with user and timestamp
4. **Data Integrity**: Checksums and metadata ensure data integrity

## Performance Notes

- **Large Exports**: May take time for patients with many studies
- **Network**: Requires stable connection to Orthanc PACS
- **Storage**: Temporary files are cleaned up automatically
- **Streaming**: Uses streaming to handle large files efficiently

## Troubleshooting

### Export Fails
- Check Orthanc PACS connection
- Verify authentication token is valid
- Ensure sufficient disk space
- Check network connectivity

### Missing Images
- Verify PACS integration is enabled
- Check Orthanc instance IDs are correct
- Ensure DICOM files exist in Orthanc

### Slow Export
- Large studies take longer to export
- Consider metadata-only export for speed
- Check network bandwidth to PACS

## Future Enhancements

- Batch export multiple patients
- Scheduled automatic exports
- Cloud storage integration (S3, Azure)
- Email delivery of exports
- Progress tracking for large exports
- Resume interrupted exports
