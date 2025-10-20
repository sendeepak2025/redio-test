# Export API - Usage Examples

## Frontend Usage (TypeScript/React)

### 1. Export Patient Data

```typescript
import { exportPatientData } from '../../services/ApiService'

// Export patient with all images
const handleExportPatient = async (patientID: string) => {
  try {
    await exportPatientData(patientID, true, 'zip')
    console.log('Export successful!')
  } catch (error) {
    console.error('Export failed:', error)
  }
}

// Export patient metadata only (no images)
const handleExportMetadata = async (patientID: string) => {
  try {
    await exportPatientData(patientID, false, 'json')
    console.log('Metadata export successful!')
  } catch (error) {
    console.error('Export failed:', error)
  }
}
```

### 2. Export Study Data

```typescript
import { exportStudyData } from '../../services/ApiService'

// Export study with images
const handleExportStudy = async (studyUID: string) => {
  try {
    await exportStudyData(studyUID, true, 'zip')
    console.log('Study exported!')
  } catch (error) {
    console.error('Export failed:', error)
  }
}

// Export study metadata only
const handleExportStudyMetadata = async (studyUID: string) => {
  try {
    await exportStudyData(studyUID, false, 'json')
    console.log('Study metadata exported!')
  } catch (error) {
    console.error('Export failed:', error)
  }
}
```

### 3. Export with User Feedback

```typescript
import { useState } from 'react'
import { exportPatientData } from '../../services/ApiService'

const ExportButton = ({ patientID }: { patientID: string }) => {
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async () => {
    try {
      setExporting(true)
      setError(null)
      await exportPatientData(patientID, true, 'zip')
      // Success - file downloads automatically
    } catch (err: any) {
      setError(err.message || 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <button onClick={handleExport} disabled={exporting}>
        {exporting ? 'Exporting...' : 'Export Data'}
      </button>
      {error && <div className="error">{error}</div>}
    </div>
  )
}
```

## Backend Usage (Node.js/Express)

### 1. Direct API Calls

```javascript
// Using fetch
const token = 'your-jwt-token'

// Export patient
fetch('https://api.example.com/api/export/patient/PATIENT123?includeImages=true&format=zip', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
  .then(response => response.blob())
  .then(blob => {
    // Download the file
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'patient_export.zip'
    a.click()
  })

// Export study
fetch('https://api.example.com/api/export/study/1.2.3.4.5.6?includeImages=true&format=zip', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
  .then(response => response.blob())
  .then(blob => {
    // Handle download
  })
```

### 2. Using Axios

```javascript
const axios = require('axios')
const fs = require('fs')

// Export patient data
async function exportPatient(patientID, token) {
  const response = await axios({
    method: 'GET',
    url: `https://api.example.com/api/export/patient/${patientID}`,
    params: {
      includeImages: true,
      format: 'zip'
    },
    headers: {
      'Authorization': `Bearer ${token}`
    },
    responseType: 'arraybuffer'
  })

  // Save to file
  fs.writeFileSync(`patient_${patientID}_export.zip`, response.data)
  console.log('Export saved!')
}

// Export study data
async function exportStudy(studyUID, token) {
  const response = await axios({
    method: 'GET',
    url: `https://api.example.com/api/export/study/${studyUID}`,
    params: {
      includeImages: true,
      format: 'zip'
    },
    headers: {
      'Authorization': `Bearer ${token}`
    },
    responseType: 'arraybuffer'
  })

  fs.writeFileSync(`study_${studyUID}_export.zip`, response.data)
  console.log('Export saved!')
}
```

### 3. Bulk Export (Admin Only)

```javascript
// Export all data
async function exportAllData(token) {
  const response = await axios({
    method: 'GET',
    url: 'https://api.example.com/api/export/all',
    params: {
      includeImages: false // Metadata only for bulk export
    },
    headers: {
      'Authorization': `Bearer ${token}`
    },
    responseType: 'arraybuffer'
  })

  fs.writeFileSync('complete_export.zip', response.data)
  console.log('Bulk export saved!')
}
```

## cURL Examples

### Export Patient (with images)
```bash
curl -X GET \
  "https://api.example.com/api/export/patient/PATIENT123?includeImages=true&format=zip" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o patient_export.zip
```

### Export Patient (metadata only)
```bash
curl -X GET \
  "https://api.example.com/api/export/patient/PATIENT123?includeImages=false&format=json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o patient_metadata.json
```

### Export Study (with images)
```bash
curl -X GET \
  "https://api.example.com/api/export/study/1.2.3.4.5.6?includeImages=true&format=zip" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o study_export.zip
```

### Export Study (metadata only)
```bash
curl -X GET \
  "https://api.example.com/api/export/study/1.2.3.4.5.6?includeImages=false&format=json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o study_metadata.json
```

### Bulk Export (Admin)
```bash
curl -X GET \
  "https://api.example.com/api/export/all?includeImages=false" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o complete_export.zip
```

## Python Examples

### Using requests library

```python
import requests

def export_patient(patient_id, token, include_images=True):
    """Export patient data"""
    url = f"https://api.example.com/api/export/patient/{patient_id}"
    params = {
        'includeImages': str(include_images).lower(),
        'format': 'zip'
    }
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    response = requests.get(url, params=params, headers=headers)
    
    if response.status_code == 200:
        filename = f"patient_{patient_id}_export.zip"
        with open(filename, 'wb') as f:
            f.write(response.content)
        print(f"Export saved to {filename}")
    else:
        print(f"Export failed: {response.status_code}")

def export_study(study_uid, token, include_images=True):
    """Export study data"""
    url = f"https://api.example.com/api/export/study/{study_uid}"
    params = {
        'includeImages': str(include_images).lower(),
        'format': 'zip'
    }
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    response = requests.get(url, params=params, headers=headers)
    
    if response.status_code == 200:
        filename = f"study_{study_uid}_export.zip"
        with open(filename, 'wb') as f:
            f.write(response.content)
        print(f"Export saved to {filename}")
    else:
        print(f"Export failed: {response.status_code}")

# Usage
token = "your-jwt-token"
export_patient("PATIENT123", token, include_images=True)
export_study("1.2.3.4.5.6", token, include_images=False)
```

## Response Formats

### Success Response (ZIP)
- Content-Type: `application/zip`
- Content-Disposition: `attachment; filename="patient_[ID]_export.zip"`
- Body: Binary ZIP file

### Success Response (JSON)
- Content-Type: `application/json`
- Content-Disposition: `attachment; filename="patient_[ID]_export.json"`
- Body: JSON metadata

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

## Error Handling

### Common Errors

**401 Unauthorized**
```json
{
  "success": false,
  "message": "Authentication required"
}
```

**403 Forbidden**
```json
{
  "success": false,
  "message": "Access denied - you can only view studies from your hospital"
}
```

**404 Not Found**
```json
{
  "success": false,
  "message": "Patient not found"
}
```

**500 Server Error**
```json
{
  "success": false,
  "message": "Export failed"
}
```

### Error Handling Example

```typescript
const handleExport = async (patientID: string) => {
  try {
    await exportPatientData(patientID, true, 'zip')
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.error('Not authenticated')
      // Redirect to login
    } else if (error.response?.status === 403) {
      console.error('Access denied')
      // Show error message
    } else if (error.response?.status === 404) {
      console.error('Patient not found')
      // Show error message
    } else {
      console.error('Export failed:', error.message)
      // Show generic error
    }
  }
}
```

## Rate Limiting

The export API may have rate limits:
- Maximum 10 exports per minute per user
- Maximum 100 exports per hour per user
- Bulk exports limited to 1 per hour

## Best Practices

1. **Always handle errors gracefully**
2. **Show progress indicators for large exports**
3. **Validate patient/study IDs before exporting**
4. **Use metadata-only exports for quick backups**
5. **Implement retry logic for failed exports**
6. **Cache export results when appropriate**
7. **Clean up downloaded files after processing**

## Testing

### Test Export Functionality

```typescript
// Test patient export
describe('Export API', () => {
  it('should export patient data', async () => {
    const result = await exportPatientData('TEST123', true, 'zip')
    expect(result.success).toBe(true)
  })

  it('should export study data', async () => {
    const result = await exportStudyData('1.2.3.4.5.6', true, 'zip')
    expect(result.success).toBe(true)
  })

  it('should handle errors', async () => {
    try {
      await exportPatientData('INVALID', true, 'zip')
    } catch (error) {
      expect(error).toBeDefined()
    }
  })
})
```
