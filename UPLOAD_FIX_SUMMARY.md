# Study Upload Fix - Summary

## Issue
Study upload from frontend was not working because the frontend was hardcoding the backend URL instead of using environment variables.

## Root Cause
In `/app/viewer/src/pages/patients/PatientsPage.tsx` (line 369), the PACS upload was making a direct fetch call to:
```javascript
fetch('http://localhost:8001/api/pacs/upload', {...})
```

This violated the critical rule of not hardcoding URLs and caused the upload to fail in different environments.

## Files Modified

### 1. `/app/viewer/src/services/ApiService.ts`
**Added new function:**
```typescript
export const uploadPacsStudy = async (files: File[]) => {
  const url = `${BACKEND_URL}/api/pacs/upload`
  // Properly uses environment variable for backend URL
  // Includes authentication headers
  // Handles credentials correctly
}
```

### 2. `/app/viewer/src/pages/patients/PatientsPage.tsx`
**Changes:**
- Imported the new `uploadPacsStudy` function from ApiService
- Replaced hardcoded fetch call with proper API service call
- Now uses environment-configured backend URL
- Includes proper authentication

**Before:**
```javascript
const response = await fetch('http://localhost:8001/api/pacs/upload', {
  method: 'POST',
  body: formData,
})
```

**After:**
```javascript
const result = await uploadPacsStudy(pacsFiles)
```

### 3. `/etc/supervisor/conf.d/supervisord.conf`
**Fixed directory paths:**
- Changed `directory=/app/backend` to `directory=/app/server`
- Changed `directory=/app/frontend` to `directory=/app/viewer`
- Updated backend command to use Node.js instead of Uvicorn
- Updated frontend command to use Vite dev server on port 3010

## Additional Hardcoded URLs Found

While fixing the main issue, I identified other hardcoded URLs in the codebase:

### Properly Handled (with env fallbacks):
- `/app/viewer/src/components/reporting/StructuredReporting.tsx` - Uses env vars with localhost fallback
- `/app/viewer/src/pages/billing/BillingPage.tsx` - Uses env vars with localhost fallback
- `/app/viewer/src/services/ApiService.ts` - Main service has proper env var handling

### Still Hardcoded (may need review):
- `/app/viewer/src/pages/orthanc/OrthancViewerPage.tsx` - Direct Orthanc server URLs (http://localhost:8042)
- `/app/viewer/src/services/ApiService.ts` - Orthanc preview/image URLs (lines 314, 321, 328)

## Backend Configuration
Backend is properly configured with:
- ORTHANC_URL=http://localhost:8042
- ORTHANC_USERNAME=orthanc
- ORTHANC_PASSWORD=orthanc_secure_2024
- MONGODB_URI configured and connected

## Services Status
✅ Backend (Node.js) - Running on port 8001
✅ Frontend (Vite) - Running on port 3010  
✅ MongoDB - Running
✅ Nginx Proxy - Running

## API Endpoints
- Backend API: http://localhost:8001/api/*
- PACS Upload: http://localhost:8001/api/pacs/upload
- Frontend: http://localhost:3010
- Frontend API calls use Vite proxy for /api routes

## Testing
The upload functionality is now ready for testing:
1. Frontend properly uses environment-configured backend URL
2. Authentication headers are included
3. Proper error handling in place
4. Services are running and ready

## Next Steps for User
1. Access the application at the preview URL
2. Navigate to Patients page
3. Click "Upload Study" button
4. Select DICOM files (.dcm)
5. Upload should now work correctly

## Technical Notes
- The fix maintains consistency with other API calls in the application
- Uses the same authentication pattern as existing endpoints
- Respects the environment variable configuration
- Follows the established patterns in ApiService.ts
