# Series Selector - उपयोग गाइड

## समस्या क्या थी?
जब किसी study में एक से ज्यादा series होती थीं (जैसे "CECT CHEST+ABDOMEN" में 3 series), तो viewer में सिर्फ पहली series ही दिखाई देती थी। बाकी series को देखने का कोई तरीका नहीं था।

## अब क्या बदला?
अब एक **Series Selector** sidebar जोड़ा गया है जो:
- Study की सभी series को list में दिखाता है
- किसी भी series पर click करके उसे देख सकते हैं
- Currently selected series को highlight करता है

## कैसे इस्तेमाल करें?

### Step 1: Study खोलें
जब आप कोई study खोलते हैं जिसमें multiple series हैं, तो automatically left side में एक sidebar दिखेगा।

### Step 2: Series देखें
Sidebar में आपको सभी series की list दिखेगी:
```
┌─────────────────────┐
│ Series (3)          │
├─────────────────────┤
│ ✓ Series 1          │
│   CT Chest          │
│   📊 100 images     │
├─────────────────────┤
│   Series 2          │
│   CT Abdomen        │
│   📊 150 images     │
├─────────────────────┤
│   Series 3          │
│   CT Pelvis         │
│   📊 120 images     │
└─────────────────────┘
```

### Step 3: Series Switch करें
- किसी भी series पर click करें
- Viewer automatically उस series को load कर देगा
- Selected series blue color में highlight होगी

## Features

### हर Series में दिखता है:
1. **Series Number** - Series 1, Series 2, etc.
2. **Description** - Series का नाम/विवरण
3. **Modality** - CT, MRI, XA, etc.
4. **Image Count** - कितनी images हैं
5. **Selection Indicator** - ✓ mark selected series पर

### Smart Behavior:
- अगर study में सिर्फ 1 series है, तो sidebar नहीं दिखेगा
- पहली series automatically select होती है
- Series switch करने पर viewer पूरी तरह refresh होता है

## Layout

```
┌──────────────────────────────────────────────────┐
│  Header / Navigation                              │
├──────────────┬───────────────────────────────────┤
│              │                                    │
│  Series      │                                    │
│  Selector    │        Medical Image Viewer        │
│              │                                    │
│  Series 1 ✓  │                                    │
│  Series 2    │        [DICOM Image Display]       │
│  Series 3    │                                    │
│              │                                    │
│              │                                    │
└──────────────┴───────────────────────────────────┘
```

## Technical Details (Developers के लिए)

### Component Location
```
viewer/src/components/viewer/SeriesSelector.tsx
```

### Usage Example
```typescript
<SeriesSelector
  series={studyData.series}
  selectedSeriesUID={selectedSeries?.seriesInstanceUID}
  onSeriesSelect={(seriesUID) => {
    const series = studyData.series.find(s => s.seriesInstanceUID === seriesUID)
    setSelectedSeries(series)
  }}
/>
```

### Props
- `series`: Array of series objects
- `selectedSeriesUID`: Currently selected series UID
- `onSeriesSelect`: Callback function when series is clicked

## Troubleshooting

### Series selector नहीं दिख रहा?
- Check करें कि study में multiple series हैं या नहीं
- Browser console में errors check करें
- Page refresh करके देखें

### Series switch नहीं हो रही?
- Network tab में API calls check करें
- Series data properly load हो रहा है या नहीं देखें
- Browser console में errors देखें

### Images load नहीं हो रहीं?
- Orthanc server running है या नहीं check करें
- Network connectivity check करें
- Series में instances हैं या नहीं verify करें

## Benefits

### Doctors के लिए:
- सभी series एक ही जगह से access कर सकते हैं
- Different body parts की images आसानी से compare कर सकते हैं
- Workflow faster हो गया

### Radiologists के लिए:
- Multi-phase studies (arterial, venous, delayed) आसानी से देख सकते हैं
- Different sequences (T1, T2, FLAIR) quickly switch कर सकते हैं
- Reporting efficiency बढ़ गई

### Technicians के लिए:
- Study quality check करना आसान हो गया
- सभी series properly uploaded हैं या नहीं verify कर सकते हैं
- Missing series identify करना easy हो गया

## Future Improvements

आगे ये features add किए जा सकते हैं:
- Series के thumbnail previews
- Keyboard shortcuts (Ctrl+Up/Down for series navigation)
- Series comparison view (side-by-side)
- Series filtering और search
- Drag-and-drop series reordering

## Support

अगर कोई problem आए तो:
1. Browser console check करें
2. Network tab में API calls देखें
3. Orthanc server status verify करें
4. Documentation पढ़ें

---

**Note:** यह feature automatically काम करता है। कोई extra configuration की जरूरत नहीं है।
