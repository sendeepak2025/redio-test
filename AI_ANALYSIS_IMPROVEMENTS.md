# AI Analysis Improvements - Fixed Duplicate Findings Issue

## Problem Identified
All AI reports were showing identical findings because the AI services used overly simplistic logic that only checked average brightness of images. This caused all similar-looking frames to receive the same classification.

## Root Causes

### 1. Content Security Policy (CSP) Issue
**Problem:** Browser was blocking connections to `http://localhost:5001`
**Error:** `Refused to connect to 'http://localhost:5001/classify' because it violates the following Content Security Policy directive: "connect-src 'self' http://localhost:8001 ws: wss:"`

**Fix:** Updated `viewer/index.html` CSP to include both ports:
```html
connect-src 'self' http://localhost:8001 http://localhost:5001 ws: wss:
```

### 2. Simplistic AI Classification Logic
**Problem:** Both AI services used only average brightness to classify images

**Old Logic (medsigclip_server.py):**
```python
avg_brightness = sum(pixels) / len(pixels)
if avg_brightness > 150:
    classification = 'normal'
elif avg_brightness > 100:
    classification = 'abnormal'
```

**New Logic:** Now uses multiple image features:
- Average brightness
- Pixel variance (texture complexity)
- Histogram distribution (contrast)
- Combined scoring system

```python
brightness_score = avg_brightness / 255.0
variance_score = min(variance / 5000.0, 1.0)
contrast_score = (histogram[3] - histogram[0]) / max(sum(histogram), 1)
combined_score = (brightness_score * 0.4 + variance_score * 0.3 + abs(contrast_score) * 0.3)
```

### 3. Random vs Deterministic Findings
**Problem:** MedGemma used `random.choice()` which could still produce similar results

**Old Logic:**
```python
location = random.choice(locations)
finding = random.choice(findings_list)
```

**New Logic:** Uses image features to deterministically select findings:
```python
location_idx = int((avg_brightness % 60) / 10)
finding_idx = int((variance % 600) / 100)
location = locations[location_idx]
finding = findings_list[finding_idx]
```

## Changes Made

### 1. viewer/index.html
- Added `http://localhost:5001` to CSP `connect-src` directive

### 2. ai-services/medsigclip_server.py
- Enhanced image analysis with variance and histogram features
- Improved classification logic using combined scoring
- More realistic confidence scores (0.50-0.95 range)
- Better differentiation between normal/abnormal cases

### 3. ai-services/medgemma_server.py
- Added variance and contrast calculations
- Deterministic finding selection based on image features
- More varied location and finding options
- Better correlation between image content and generated reports

### 4. ai-services/restart-services.bat (NEW)
- Quick script to restart both AI services
- Properly kills old processes and starts new ones

## How to Apply Changes

1. **Refresh Browser** - The CSP fix is already applied
2. **Restart AI Services:**
   ```bash
   cd ai-services
   restart-services.bat
   ```
3. **Test Analysis** - Try analyzing different frames and you should see varied findings

## Expected Results

### Before Fix:
- All frames: "Normal chest X-ray" or identical findings
- Same confidence scores
- No variation between different images

### After Fix:
- Different frames get different classifications
- Findings vary based on actual image content
- Confidence scores reflect image complexity
- More realistic and varied reports

## Technical Details

### Image Feature Extraction:
1. **Brightness:** Overall intensity (0-255)
2. **Variance:** Texture complexity measure
3. **Histogram:** Distribution across 4 bins (0-63, 64-127, 128-191, 192-255)
4. **Contrast:** Difference between bright and dark regions

### Classification Thresholds:
- **Normal:** combined_score > 0.65 (bright, high variance, good contrast)
- **Mild Abnormality:** 0.45 < combined_score ≤ 0.65
- **Moderate Abnormality:** 0.30 < combined_score ≤ 0.45
- **Significant Abnormality:** combined_score ≤ 0.30

## Testing Recommendations

1. **Test with different modalities:** XR, CT, MR, US
2. **Test with multiple frames** from the same study
3. **Compare findings** across different studies
4. **Verify confidence scores** vary appropriately
5. **Check report generation** produces unique content

## Notes

- This is still a **demo/mock AI system** for development
- Real AI models would use deep learning (CNN, Vision Transformers)
- The improved logic provides more realistic variation for testing
- For production, integrate actual medical AI models (MedSigLIP, MedGemma, etc.)

## Future Improvements

1. Integrate real MedSigLIP model with PyTorch
2. Add actual MedGemma/LLaVA-Med for report generation
3. Implement proper feature extraction with CNNs
4. Add anatomical region detection
5. Include severity scoring
6. Add temporal comparison (prior studies)

---

**Status:** ✅ Fixed and Ready for Testing
**Date:** October 22, 2025
