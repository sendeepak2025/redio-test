# Test Backend Directly

## Test if backend series filtering works

Open these URLs in your browser (or use curl):

### Series 1 (SCOUT - should return 2 instances):
```
http://localhost:5000/api/dicom/studies/1.2.840.113619.2.482.3.2831195393.851.1709524269.885/series/1.2.840.113619.2.482.3.2831195393.851.1709524269.888/frames/0
```

### Series 2 (Pre Contrast - should return 132 instances):
```
http://localhost:5000/api/dicom/studies/1.2.840.113619.2.482.3.2831195393.851.1709524269.885/series/1.2.840.113619.2.482.3.2831195393.851.1709524269.893/frames/0
```

### Series 3 (lung - should return 132 instances):
```
http://localhost:5000/api/dicom/studies/1.2.840.113619.2.482.3.2831195393.851.1709524269.885/series/1.2.840.113619.2.482.3.2831195393.851.1709524269.893.3/frames/0
```

## What to check:

1. **Do these URLs return DIFFERENT images?**
   - If YES: Backend is working, problem is in frontend
   - If NO: Backend filtering not working

2. **Check backend terminal logs:**
   - Should show: `🎯 SERIES-SPECIFIC ROUTE HIT`
   - Should show: `🔍 getFrame: Filtering by series`
   - Should show different instance counts (2, 132, 132)

3. **If images are SAME:**
   - Backend filtering is not working
   - Check if `seriesUid` parameter is being extracted correctly

## Alternative: Use curl

```bash
# Series 1
curl -o series1.png "http://localhost:5000/api/dicom/studies/1.2.840.113619.2.482.3.2831195393.851.1709524269.885/series/1.2.840.113619.2.482.3.2831195393.851.1709524269.888/frames/0"

# Series 2
curl -o series2.png "http://localhost:5000/api/dicom/studies/1.2.840.113619.2.482.3.2831195393.851.1709524269.885/series/1.2.840.113619.2.482.3.2831195393.851.1709524269.893/frames/0"

# Series 3
curl -o series3.png "http://localhost:5000/api/dicom/studies/1.2.840.113619.2.482.3.2831195393.851.1709524269.885/series/1.2.840.113619.2.482.3.2831195393.851.1709524269.893.3/frames/0"

# Open the images and compare
```

If these 3 images are DIFFERENT, backend is working correctly!
