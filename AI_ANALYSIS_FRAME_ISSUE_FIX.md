# AI Analysis "Frame Not Found" Issue - Solution

## The Problem

When you click "RUN AI ANALYSIS", you get a 500 error:
```
POST http://localhost:3010/api/medical-ai/analyze-study 500 (Internal Server Error)
Error: Frame not found
```

## Root Cause

The AI analysis endpoint requires the frame image to be available, but:

1. ✅ Frontend calls `/api/medical-ai/analyze-study`
2. ✅ Backend receives the request
3. ❌ **Frame Cache Service can't find the frame**
4. ❌ Returns 404 "Frame not found"

### Why Frames Are Missing

The frame cache service expects frames to be:
- Already loaded in the viewer (cached)
- OR available in Orthanc
- OR available in filesystem

If the study hasn't been viewed yet, frames aren't cached.

## Solution Options

### Option 1: Load Study First (Current Workaround)

**Steps:**
1. Open the study in the viewer
2. Wait for images to load
3. Then click "RUN AI ANALYSIS"

This ensures frames are cached before analysis.

### Option 2: Auto-Cache Frames (Recommended Fix)

Modify the AI analysis endpoint to automatically cache frames if not found.

**File:** `server/src/routes/medical-ai.js`

```javascript
router.post('/analyze-study', async (req, res) => {
  try {
    const { studyInstanceUID, frameIndex = 0, patientContext = {} } = req.body;

    if (!studyInstanceUID) {
      return res.status(400).json({
        success: false,
        message: 'studyInstanceUID is required'
      });
    }

    // Get frame image
    const frameCacheService = getFrameCacheService();
    let frameBuffer = await frameCacheService.getFrame(studyInstanceUID, frameIndex);

    // NEW: If frame not found, try to cache it first
    if (!frameBuffer) {
      console.log(`⚠️  Frame not cached, attempting to cache frame ${frameIndex} for study ${studyInstanceUID}`);
      
      try {
        // Try to cache the frame from Orthanc
        await frameCacheService.cacheFrame(studyInstanceUID, frameIndex);
        
        // Try to get it again
        frameBuffer = await frameCacheService.getFrame(studyInstanceUID, frameIndex);
      } catch (cacheError) {
        console.error('Failed to cache frame:', cacheError.message);
      }
    }

    if (!frameBuffer) {
      return res.status(404).json({
        success: false,
        message: 'Frame not found. Please ensure the study is loaded in the viewer first.'
      });
    }

    // Rest of the code...
  }
});
```

### Option 3: Generate Report Without Image (Alternative)

Allow AI analysis to generate reports without requiring the frame image.

**Pros:**
- Works immediately
- No frame caching needed

**Cons:**
- Can't include image snapshot in report
- Can't perform visual detection
- Limited to metadata-based analysis

## Implementing Option 2 (Recommended)

Let me implement the auto-cache solution:

