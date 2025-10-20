# Export Feature - Testing Checklist

## Pre-Testing Setup

- [ ] Server is running (`cd server && npm start`)
- [ ] Viewer is running (`cd viewer && npm run dev`)
- [ ] MongoDB is connected
- [ ] Orthanc PACS is running and accessible
- [ ] Test patient data exists in database
- [ ] Test studies exist with DICOM files
- [ ] User is logged in with valid JWT token

## Functional Testing

### Patient Export

- [ ] **Export button appears on patient cards**
  - Navigate to Patients page
  - Verify "Export Data" button is visible on each patient card
  - Button should be at the bottom of the card

- [ ] **Export dialog opens correctly**
  - Click "Export Data" button
  - Dialog should open with title "Export Patient Data"
  - Options should be visible (include images checkbox)
  - Export details should show patient ID

- [ ] **Export with images works**
  - Check "Include DICOM images and previews"
  - Click "Export Data"
  - Button should show "Exporting..." with spinner
  - ZIP file should download automatically
  - Filename should be `patient_[ID]_export.zip`

- [ ] **Export metadata only works**
  - Uncheck "Include DICOM images and previews"
  - Click "Export Data"
  - File should download (smaller size)
  - Should contain only JSON metadata

- [ ] **Exported ZIP contains correct files**
  - Extract downloaded ZIP file
  - Verify `patient_data.json` exists
  - Verify `studies/` folder exists
  - Verify DICOM files exist (if images included)
  - Verify `previews/` folder exists (if images included)

### Study Export

- [ ] **Export button appears on study rows**
  - Navigate to Studies tab
  - Verify download icon appears on each study row
  - Icon should be on the right side

- [ ] **Export button appears in patient dialog**
  - Click on a patient
  - Patient dialog should open
  - Verify download icon on each study card
  - Icon should be next to chevron

- [ ] **Study export dialog works**
  - Click download icon on any study
  - Dialog should open with title "Export Study Data"
  - Options should be visible
  - Export details should show study UID

- [ ] **Study export with images works**
  - Check "Include DICOM images and previews"
  - Click "Export Data"
  - ZIP file should download
  - Filename should be `study_[UID]_export.zip`

- [ ] **Study export metadata only works**
  - Uncheck "Include DICOM images and previews"
  - Click "Export Data"
  - Smaller file should download

- [ ] **Exported study ZIP contains correct files**
  - Extract downloaded ZIP file
  - Verify `study_data.json` exists
  - Verify `dicom/` folder exists (if images included)
  - Verify `previews/` folder exists (if images included)
  - Verify DICOM files are valid

## UI/UX Testing

### Visual Elements

- [ ] **Export buttons are styled correctly**
  - Buttons have proper colors
  - Icons are visible and correct
  - Text is readable
  - Hover states work

- [ ] **Export dialog is styled correctly**
  - Dialog has gradient header
  - Content is well-organized
  - Buttons are properly aligned
  - Close button works

- [ ] **Loading states work**
  - Button shows spinner during export
  - Button is disabled during export
  - Text changes to "Exporting..."
  - Dialog cannot be closed during export

- [ ] **Error states work**
  - Error alert appears on failure
  - Error message is clear
  - Error can be dismissed
  - User can retry after error

### Interactions

- [ ] **Click events work correctly**
  - Export button click opens dialog
  - Dialog close button works
  - Cancel button works
  - Export button triggers export

- [ ] **Checkbox works**
  - Checkbox can be checked/unchecked
  - State is preserved
  - Label is clickable

- [ ] **Keyboard navigation works**
  - Tab key navigates through elements
  - Enter key confirms export
  - Escape key closes dialog

- [ ] **Mobile responsiveness**
  - Buttons are touch-friendly
  - Dialog fits on mobile screen
  - Text is readable on small screens

## Data Integrity Testing

### Metadata Validation

- [ ] **Patient metadata is complete**
  - Patient ID is correct
  - Patient name is correct
  - Birth date is correct
  - Sex is correct
  - Study count is accurate

- [ ] **Study metadata is complete**
  - Study UID is correct
  - Study date/time is correct
  - Modality is correct
  - Description is correct
  - Instance count is accurate

- [ ] **Instance metadata is complete**
  - SOP Instance UID is correct
  - Series UID is correct
  - Instance number is correct
  - Frame count is correct
  - Orthanc ID is correct

- [ ] **Export metadata is complete**
  - Exported by username is correct
  - Export timestamp is correct
  - Version is correct
  - Include images flag is correct

### File Validation

- [ ] **DICOM files are valid**
  - Files have .dcm extension
  - Files can be opened in DICOM viewer
  - Metadata is intact
  - Images are not corrupted

- [ ] **Preview images are valid**
  - Files have .png extension
  - Images can be opened
  - Images match DICOM frames
  - Image quality is acceptable

- [ ] **JSON files are valid**
  - Files are valid JSON
  - All required fields are present
  - Data types are correct
  - No null/undefined values where not expected

## Performance Testing

### Export Speed

- [ ] **Small patient export (1-2 studies)**
  - Export completes in < 10 seconds
  - No timeout errors
  - File downloads successfully

- [ ] **Medium patient export (5-10 studies)**
  - Export completes in < 30 seconds
  - Progress is visible
  - File downloads successfully

- [ ] **Large patient export (20+ studies)**
  - Export completes in reasonable time
  - No memory errors
  - File downloads successfully

- [ ] **Metadata-only export is fast**
  - Completes in < 5 seconds
  - Regardless of study count

### File Size

- [ ] **Export with images is larger**
  - ZIP file size is appropriate
  - Compression is working
  - File is not corrupted

- [ ] **Metadata-only export is small**
  - JSON file is < 1 MB
  - Contains all metadata
  - No unnecessary data

## Security Testing

### Authentication

- [ ] **Unauthenticated users cannot export**
  - Remove JWT token
  - Try to export
  - Should get 401 error
  - Should redirect to login

- [ ] **Expired tokens are rejected**
  - Use expired JWT token
  - Try to export
  - Should get 401 error

### Authorization

- [ ] **Users can only export their hospital's data**
  - Login as hospital user
  - Try to export patient from different hospital
  - Should get 403 error

- [ ] **Super admin can export all data**
  - Login as super admin
  - Should be able to export any patient
  - Should be able to export any study

### Data Protection

- [ ] **Sensitive data is not exposed**
  - Check exported metadata
  - Verify no passwords/tokens
  - Verify no internal IDs exposed

- [ ] **Audit logging works**
  - Check server logs
  - Verify export is logged
  - Verify user is logged
  - Verify timestamp is logged

## Error Handling Testing

### Network Errors

- [ ] **Handles Orthanc connection failure**
  - Stop Orthanc
  - Try to export
  - Should show error message
  - Should not crash

- [ ] **Handles MongoDB connection failure**
  - Stop MongoDB
  - Try to export
  - Should show error message
  - Should not crash

- [ ] **Handles network timeout**
  - Simulate slow network
  - Try to export large study
  - Should handle timeout gracefully

### Data Errors

- [ ] **Handles missing patient**
  - Try to export non-existent patient
  - Should show 404 error
  - Error message should be clear

- [ ] **Handles missing study**
  - Try to export non-existent study
  - Should show 404 error
  - Error message should be clear

- [ ] **Handles missing DICOM files**
  - Export study with missing files
  - Should export available data
  - Should log warnings
  - Should not crash

### User Errors

- [ ] **Handles invalid patient ID**
  - Try to export with invalid ID
  - Should show error message
  - Should not crash

- [ ] **Handles invalid study UID**
  - Try to export with invalid UID
  - Should show error message
  - Should not crash

## Browser Compatibility

- [ ] **Chrome/Edge**
  - Export works
  - Download works
  - UI renders correctly

- [ ] **Firefox**
  - Export works
  - Download works
  - UI renders correctly

- [ ] **Safari**
  - Export works
  - Download works
  - UI renders correctly

## API Testing

### Endpoint Testing

- [ ] **Patient export endpoint works**
  - `GET /api/export/patient/:patientID`
  - Returns ZIP file
  - Correct content-type header
  - Correct content-disposition header

- [ ] **Study export endpoint works**
  - `GET /api/export/study/:studyUID`
  - Returns ZIP file
  - Correct headers

- [ ] **Query parameters work**
  - `includeImages=true` includes images
  - `includeImages=false` excludes images
  - `format=zip` returns ZIP
  - `format=json` returns JSON

### Response Testing

- [ ] **Success responses are correct**
  - Status code is 200
  - Headers are correct
  - Body is correct format

- [ ] **Error responses are correct**
  - Status codes are appropriate
  - Error messages are clear
  - Response format is consistent

## Documentation Testing

- [ ] **README is accurate**
  - Instructions are clear
  - Examples work
  - Links are valid

- [ ] **API documentation is accurate**
  - Endpoints are correct
  - Parameters are documented
  - Examples are valid

- [ ] **Code comments are helpful**
  - Functions are documented
  - Complex logic is explained
  - TODOs are noted

## Regression Testing

- [ ] **Existing features still work**
  - Patient list loads
  - Study list loads
  - Viewer works
  - Upload works

- [ ] **No console errors**
  - Check browser console
  - Check server logs
  - No unexpected errors

- [ ] **No memory leaks**
  - Export multiple times
  - Check memory usage
  - No significant increase

## Sign-Off

- [ ] All tests passed
- [ ] No critical bugs found
- [ ] Documentation is complete
- [ ] Code is reviewed
- [ ] Ready for production

## Notes

Use this space to document any issues found during testing:

```
Issue 1: [Description]
Status: [Fixed/Open/Deferred]
Priority: [High/Medium/Low]

Issue 2: [Description]
Status: [Fixed/Open/Deferred]
Priority: [High/Medium/Low]
```
