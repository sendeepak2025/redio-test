# Browser Console Test

## Open Browser Console

1. Go to: `http://localhost:3000/viewer/1.2.840.113619.2.482.3.2831195393.851.1709524269.885`
2. Press **F12**
3. Go to **Console** tab
4. Paste this code and press Enter:

```javascript
// Test frame URL generation
console.log('=== TESTING FRAME URL GENERATION ===\n');

const studyUID = '1.2.840.113619.2.482.3.2831195393.851.1709524269.885';

// Series 1 (SCOUT)
const series1UID = '1.2.840.113619.2.482.3.2831195393.851.1709524269.888';
const url1 = ApiService.getFrameImageUrl(studyUID, 0, series1UID);
console.log('Series 1 URL:', url1);

// Series 2 (Pre Contrast)
const series2UID = '1.2.840.113619.2.482.3.2831195393.851.1709524269.893';
const url2 = ApiService.getFrameImageUrl(studyUID, 0, series2UID);
console.log('Series 2 URL:', url2);

// Series 3 (lung)
const series3UID = '1.2.840.113619.2.482.3.2831195393.851.1709524269.893.3';
const url3 = ApiService.getFrameImageUrl(studyUID, 0, series3UID);
console.log('Series 3 URL:', url3);

console.log('\n=== EXPECTED URLS ===');
console.log('Should include /series/ in the path');
console.log('Each URL should have different seriesUID');
```

## Expected Output:

```
Series 1 URL: /api/dicom/studies/.../series/...888/frames/0
Series 2 URL: /api/dicom/studies/.../series/...893/frames/0
Series 3 URL: /api/dicom/studies/.../series/...893.3/frames/0
```

## If URLs are WRONG (no /series/ part):

Then `ApiService.getFrameImageUrl` is not working correctly.

## Next: Check Network Tab

1. Stay in DevTools (F12)
2. Go to **Network** tab
3. Filter by "frames"
4. Click Series 1, then Series 2, then Series 3
5. Look at the actual HTTP requests

**Take a screenshot and share!**

## Also Check Console Logs

When you click different series, you should see:

```
🔄 Generating frame URLs: {
  studyUID: "...",
  seriesUID: "...888",  // ← Should CHANGE
  totalFrames: 2,       // ← Should CHANGE
  sampleURL: "..."
}
```

**Copy and paste the console output when you click Series 1, 2, 3**
