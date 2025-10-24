# 🔍 Series-Wise Rendering Debug Guide (Hindi)

## Abhi Check Karo

### 1. Browser Console (F12)
Jab aap different series par click karo, yeh dikhna chahiye:

```
[SERIES IDENTIFIER] Frame Count: 2    ← Series 1
[SERIES IDENTIFIER] Frame Count: 132  ← Series 2
[SERIES IDENTIFIER] Frame Count: 132  ← Series 3
```

**Check Karo:**
- ✅ Series UID change ho raha hai?
- ✅ Frame Count sahi hai (2, 132, 132)?
- ✅ URL mein `/series/` hai?
- ❌ Abhi bhi "266" dikh raha hai?

### 2. Backend Terminal
Jab aap series click karo, yeh dikhna chahiye:

```
[SERIES IDENTIFIER - BACKEND] Frame request received
[SERIES IDENTIFIER - BACKEND] Series UID: ...888
[SERIES IDENTIFIER - BACKEND] Found instances: 2
```

**Check Karo:**
- ✅ Backend logs aa rahe hain?
- ✅ Series UID change ho raha hai?
- ✅ Instance count sahi hai?
- ❌ Koi logs nahi aa rahe?

### 3. Network Tab (F12 → Network)
"frames" filter lagao aur URLs dekho:

**Sahi URLs:**
```
/api/.../series/...888/frames/0  ✅
/api/.../series/...893/frames/0  ✅
```

**Galat URLs:**
```
/api/.../frames/0  ❌ /series/ missing!
```

## Common Problems

### Problem 1: Layout Change Ho Gaya / Sidebar Nahi Dikh Raha

**Symptoms:**
- Series selector nahi dikh raha
- Layout alag lag raha hai

**Solution:**
Browser console mein check karo:
```javascript
console.log('Study Data:', studyData)
console.log('Series:', studyData?.series)
```

Agar `series` undefined hai, toh API endpoint galat hai.

### Problem 2: Sabhi Series Mein Same Image

**Symptoms:**
- Sidebar sahi dikh raha hai
- Frame count sahi hai
- Lekin sabhi series mein same image

**Possible Causes:**

#### A. Backend Series Se Filter Nahi Kar Raha
Backend logs check karo. Agar yeh dikhe:
```
⚠️ LEGACY ROUTE HIT  // Galat route!
```

Toh route order galat hai.

#### B. Frontend Series UID Pass Nahi Kar Raha
Console logs check karo. Agar yeh dikhe:
```
[SERIES IDENTIFIER] Series UID: default-series  // ❌ Galat!
```

Toh ViewerPage.tsx mein problem hai.

#### C. Component Re-render Nahi Ho Raha
Check karo ki `key` prop change ho raha hai ya nahi.

### Problem 3: Frame Count Abhi Bhi 266 Dikha Raha Hai

**Solution:**
useEffect mein API call abhi bhi run ho raha hai. MedicalImageViewer.tsx check karo.

## Step-by-Step Debug

### Step 1: Database Check
```bash
cd server
node check-database.js
```

Expected:
```
Series 1: 2 instances
Series 2: 132 instances
Series 3: 132 instances
```

### Step 2: Backend Test
Browser mein kholo:
```
http://localhost:5000/api/dicom/studies/.../metadata
```

Yeh dikhna chahiye:
```json
{
  "numberOfSeries": 3,
  "series": [...]
}
```

### Step 3: Frontend State Check
Console mein:
```javascript
console.log('Study Data:', studyData)
console.log('Selected Series:', selectedSeries)
```

## Quick Fix

### Sab Restart Karo
```bash
# Backend
cd server
npm start

# Frontend
cd viewer
npm start
```

### Browser Hard Refresh
```
Ctrl + Shift + R
```

## Expected Result

### Console:
```
Series 1: Frame Count: 2
Series 2: Frame Count: 132
Series 3: Frame Count: 132
```

### Visual:
- ✅ Left side mein sidebar
- ✅ 3 series dikhengi
- ✅ Click karne par images change hongi
- ✅ Har series mein ALAG images

## Abhi Bhi Problem Hai?

Yeh share karo:
1. Browser console output
2. Backend terminal output
3. Network tab screenshot
4. Layout ka screenshot

Isse main exact problem identify kar sakta hoon!
