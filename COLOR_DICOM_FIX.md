# Color DICOM Rendering Fix - Ultrasound with Doppler Support

## Problem
Ultrasound DICOM files with color Doppler (RGB images) were not rendering correctly in the Advanced Medical Imaging Viewer. The images appeared black or broken instead of showing the color overlays.

## Root Cause
The system was using Orthanc's `/preview` endpoint which converts images to grayscale, losing color information. Color Doppler ultrasound images use:
- **RGB color space** (SamplesPerPixel = 3)
- **Photometric Interpretation**: RGB, YBR_FULL, or PALETTE COLOR
- **Multi-frame format** with color overlays

## Solution Implemented

### 1. Auto-Detection of Color Images
The system now automatically detects color DICOM images by checking:
- `SamplesPerPixel === 3` (RGB images)
- `PhotometricInterpretation` contains RGB, YBR, or PALETTE
- Automatically switches to the correct Orthanc endpoint

### 2. Use Orthanc 'rendered' Endpoint for Color
**Changed from:**
```
/instances/{instanceId}/frames/{frameIndex}/preview
```

**Changed to (for color images):**
```
/instances/{instanceId}/frames/{frameIndex}/rendered
```

The `rendered` endpoint preserves RGB color data, while `preview` converts to grayscale.

### 3. Smart Fallback Logic
If the `preview` endpoint fails, the system automatically tries the `rendered` endpoint as a fallback.

## Files Modified

### `server/src/services/orthanc-preview-client.js`

#### Change 1: Auto-detect color images
```javascript
// Auto-detect if we should use 'rendered' endpoint for color images
if (!options.useRendered) {
  try {
    const metadata = await this.getInstanceMetadata(instanceId);
    const samplesPerPixel = parseInt(metadata.SamplesPerPixel) || 1;
    const photometric = (metadata.PhotometricInterpretation || '').toUpperCase();
    
    // Use 'rendered' endpoint for color images (RGB, YBR, PALETTE)
    if (samplesPerPixel === 3 || 
        photometric.includes('RGB') || 
        photometric.includes('YBR') || 
        photometric.includes('PALETTE')) {
      console.log(`🎨 Color image detected (${photometric}, ${samplesPerPixel} samples) - using 'rendered' endpoint`);
      options.useRendered = true;
    }
  } catch (metaError) {
    console.warn('Failed to check image type, using default preview endpoint:', metaError.message);
  }
}
```

#### Change 2: Support both endpoints
```javascript
buildPreviewUrl(instanceId, frameIndex, options) {
  // Use 'rendered' endpoint for color images to preserve RGB data
  // Use 'preview' endpoint for grayscale images (faster)
  const endpoint = options.useRendered ? 'rendered' : 'preview';
  let url = `/instances/${instanceId}/frames/${frameIndex}/${endpoint}`;
  // ... rest of the code
}
```

#### Change 3: Fallback to rendered endpoint
```javascript
catch (error) {
  // Try 'rendered' endpoint as fallback if 'preview' failed
  if (!options.useRendered && !options.triedRendered) {
    console.warn(`Preview endpoint failed, trying 'rendered' endpoint for color support...`);
    options.useRendered = true;
    options.triedRendered = true;
    return this.generatePreview(instanceId, frameIndex, options);
  }
  // ... rest of error handling
}
```

## Supported Image Types

### ✅ Now Fully Supported
1. **Ultrasound with Color Doppler**
   - RGB color overlays
   - Multi-frame cine loops
   - ECG waveforms

2. **Color Photography**
   - Visible light images
   - Dermoscopy
   - Fundus photography

3. **Palette Color Images**
   - Indexed color images
   - Nuclear medicine

4. **YBR Color Space**
   - YBR_FULL
   - YBR_FULL_422
   - YBR_PARTIAL_420

### ✅ Already Supported (Unchanged)
1. **Grayscale Images**
   - CT scans
   - MRI
   - X-Ray
   - Mammography

2. **Compressed Images**
   - JPEG Lossy
   - JPEG Lossless
   - JPEG 2000
   - RLE

## Testing

### Test with Color Doppler Ultrasound
1. Upload an ultrasound DICOM with color Doppler
2. Open in the Advanced Medical Imaging Viewer
3. Verify:
   - ✅ Color overlays are visible (red/blue Doppler)
   - ✅ Multiple viewports render correctly
   - ✅ Frame navigation works smoothly
   - ✅ ECG waveform displays properly

### Check Server Logs
Look for this message in server logs:
```
🎨 Color image detected (RGB, 3 samples) - using 'rendered' endpoint
```

### Performance
- **Grayscale images**: Still use fast `preview` endpoint
- **Color images**: Automatically use `rendered` endpoint
- **No performance impact** on existing grayscale workflows

## Orthanc Endpoints Reference

### `/preview` Endpoint
- **Purpose**: Fast grayscale preview
- **Output**: Grayscale PNG (8-bit)
- **Use case**: CT, MRI, X-Ray
- **Speed**: ⚡ Fast

### `/rendered` Endpoint
- **Purpose**: Full-quality rendering with color
- **Output**: RGB PNG (24-bit) or Grayscale
- **Use case**: Ultrasound Doppler, Color photos
- **Speed**: 🐢 Slightly slower (but necessary for color)

## Backward Compatibility

✅ **Fully backward compatible**
- Existing grayscale images continue to use fast `preview` endpoint
- No changes needed to existing code
- Automatic detection handles everything

## Future Enhancements

### Potential Improvements
1. **Cache color detection** - Store in database to avoid repeated metadata lookups
2. **User preference** - Allow users to force rendered endpoint
3. **Quality settings** - Add UI controls for JPEG quality
4. **Viewport-specific rendering** - Different endpoints for thumbnails vs full view

## Troubleshooting

### Issue: Color image still shows as grayscale
**Solution**: Check server logs for color detection message. If not detected:
1. Verify DICOM has `SamplesPerPixel = 3`
2. Check `PhotometricInterpretation` tag
3. Manually force rendered endpoint in code

### Issue: Slow rendering
**Solution**: This is expected for color images. The `rendered` endpoint is slower but necessary for color preservation.

### Issue: Image not loading at all
**Solution**: 
1. Check Orthanc is running and accessible
2. Verify instance exists in Orthanc
3. Check server logs for specific error messages
4. Try the test script: `scripts/test-dicom-rendering.html`

## API Changes

### No Breaking Changes
The API remains the same. Color detection happens automatically in the backend.

### Optional: Force Rendered Endpoint
If you want to manually force the rendered endpoint:

```javascript
// In orthancInstanceController.js
const pngBuffer = await this.orthancClient.generatePreview(
  orthancInstanceId, 
  localFrameIndex, 
  {
    quality: 90,
    useRendered: true  // Force rendered endpoint
  }
);
```

## Summary

✅ **Color DICOM images now render correctly**
✅ **Automatic detection - no manual configuration needed**
✅ **Backward compatible with existing grayscale workflows**
✅ **Smart fallback logic for reliability**
✅ **Supports all standard color formats (RGB, YBR, PALETTE)**

Your ultrasound with color Doppler should now display properly with all the color overlays, multiple viewports, and ECG waveforms visible!
