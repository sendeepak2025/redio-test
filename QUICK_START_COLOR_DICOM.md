# Quick Start: Testing Color DICOM Fix

## What Was Fixed
Your ultrasound DICOM with color Doppler was showing as black/broken because the system was using Orthanc's grayscale preview endpoint. Now it automatically detects color images and uses the correct endpoint that preserves RGB color data.

## How to Test

### Step 1: Restart Your Server
The server should auto-restart with nodemon. If not:
```bash
cd server
npm start
```

### Step 2: Upload Your Ultrasound DICOM
1. Go to your upload page
2. Upload the ultrasound DICOM file with color Doppler
3. Note the Study UID

### Step 3: Open in Viewer
1. Navigate to the viewer: `http://localhost:5173/viewer/{STUDY_UID}`
2. The image should now display with:
   - ✅ Color Doppler overlays (red/blue)
   - ✅ Multiple viewports
   - ✅ ECG waveform
   - ✅ All technical parameters

### Step 4: Check Server Logs
Look for this message in your server terminal:
```
🎨 Color image detected (RGB, 3 samples) - using 'rendered' endpoint
```

## What Changed

### Before (Broken)
```
GET /api/dicom/studies/{studyUID}/frames/0
  ↓
Orthanc: /instances/{id}/frames/0/preview
  ↓
Grayscale PNG (color lost) ❌
```

### After (Fixed)
```
GET /api/dicom/studies/{studyUID}/frames/0
  ↓
Auto-detect: SamplesPerPixel = 3, Photometric = RGB
  ↓
Orthanc: /instances/{id}/frames/0/rendered
  ↓
RGB PNG (color preserved) ✅
```

## Verification Checklist

- [ ] Server restarted successfully
- [ ] Upload ultrasound DICOM
- [ ] Open in viewer
- [ ] See color Doppler overlays (red/blue)
- [ ] Can navigate through frames
- [ ] Server log shows "Color image detected" message
- [ ] No errors in browser console

## If It Still Doesn't Work

### Check 1: Is the DICOM actually color?
Open browser console and run:
```javascript
fetch('/api/dicom/studies/YOUR_STUDY_UID/metadata')
  .then(r => r.json())
  .then(data => {
    console.log('Samples Per Pixel:', data.data?.technical_info?.samples_per_pixel);
    console.log('Photometric:', data.data?.technical_info?.photometric_interpretation);
  })
```

Expected for color Doppler:
- Samples Per Pixel: 3
- Photometric: RGB or YBR_FULL

### Check 2: Is Orthanc accessible?
```bash
curl -u orthanc:orthanc_secure_2024 http://69.62.70.102:8042/system
```

Should return Orthanc system info.

### Check 3: Check browser network tab
1. Open DevTools (F12)
2. Go to Network tab
3. Load the study
4. Look for frame requests
5. Check if they return 200 OK
6. Check Content-Type: should be `image/png`

### Check 4: Try the test script
```bash
cd scripts
node test-color-dicom.js
```

## Performance Notes

- **Grayscale images**: No change, still fast
- **Color images**: Slightly slower (but necessary for color)
- **First load**: May take 1-2 seconds per frame
- **Cached**: Subsequent loads are instant

## Technical Details

### Orthanc Endpoints Used

**For Grayscale (CT, MRI, X-Ray):**
```
/instances/{id}/frames/{index}/preview
```
- Fast
- 8-bit grayscale
- Window/Level applied

**For Color (Ultrasound Doppler, Photos):**
```
/instances/{id}/frames/{index}/rendered
```
- Preserves RGB
- 24-bit color
- Slightly slower

### Auto-Detection Logic
```javascript
if (SamplesPerPixel === 3 || 
    PhotometricInterpretation.includes('RGB') ||
    PhotometricInterpretation.includes('YBR') ||
    PhotometricInterpretation.includes('PALETTE')) {
  // Use 'rendered' endpoint
} else {
  // Use 'preview' endpoint
}
```

## Need Help?

1. Check `COLOR_DICOM_FIX.md` for detailed technical explanation
2. Run `scripts/test-dicom-rendering.html` in browser for diagnostics
3. Check server logs for error messages
4. Verify Orthanc is running and accessible

## Success Indicators

✅ **Working correctly if you see:**
- Color Doppler overlays in red/blue
- Multiple ultrasound viewports
- ECG waveform at bottom
- Technical parameters displayed
- Smooth frame navigation
- Server log: "Color image detected"

❌ **Still broken if you see:**
- Black screen
- Grayscale only (no color)
- Error messages in console
- Failed network requests
- Placeholder images

---

**Your ultrasound with color Doppler should now render perfectly!** 🎉
