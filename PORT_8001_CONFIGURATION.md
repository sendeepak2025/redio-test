# ✅ Backend Port 8001 Configuration

## 🔧 Changes Made

Backend port ko **5000** se **8001** me change kar diya hai.

---

## 📝 Files Updated

### 1. ReportEditor.tsx
```tsx
// Before: http://localhost:5000
// After:  http://localhost:8001

`${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/api/structured-reports/...`
```

**Lines Changed:**
- Line ~52: GET report by ID
- Line ~82: POST create draft from AI
- Line ~123: PUT update report
- Line ~169: POST sign report

### 2. ReportHistoryTab.tsx
```tsx
// Before: http://localhost:5000
// After:  http://localhost:8001

`${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/api/structured-reports/...`
```

**Lines Changed:**
- Line ~38: GET report history
- Line ~59: GET single report
- Line ~79: GET PDF download
- Line ~291: Signature image URL

### 3. viewer/.env (NEW)
```env
VITE_API_URL=http://localhost:8001
VITE_APP_NAME=Medical Viewer
```

---

## 🚀 How to Use

### Option 1: Using .env File (Recommended)
```bash
# .env file already created with:
VITE_API_URL=http://localhost:8001

# Just restart frontend
cd viewer
npm run dev
```

### Option 2: Manual Override
```bash
# Set environment variable before starting
cd viewer
VITE_API_URL=http://localhost:8001 npm run dev
```

### Option 3: Default Fallback
If no VITE_API_URL is set, it will automatically use `http://localhost:8001`

---

## 🧪 Testing

### 1. Start Backend on Port 8001
```bash
cd server
# Make sure server is running on port 8001
npm start
```

### 2. Start Frontend
```bash
cd viewer
npm run dev
```

### 3. Test API Calls
Open browser console (F12) and check network tab:
```
✅ POST http://localhost:8001/api/structured-reports/from-ai/...
✅ PUT  http://localhost:8001/api/structured-reports/...
✅ GET  http://localhost:8001/api/structured-reports/study/...
```

---

## 🔍 Verify Configuration

### Check Backend Port
```bash
# In server directory
cd server
cat .env | grep PORT

# Or check server logs when starting
npm start
# Should show: Server running on port 8001
```

### Check Frontend Configuration
```bash
# In viewer directory
cd viewer
cat .env | grep VITE_API_URL

# Should show: VITE_API_URL=http://localhost:8001
```

### Check Browser Console
```javascript
// In browser console
console.log(import.meta.env.VITE_API_URL);
// Should show: http://localhost:8001
```

---

## 🐛 Troubleshooting

### Issue: API calls still going to port 5000
**Solution:**
```bash
# 1. Clear browser cache
Ctrl + Shift + Delete

# 2. Restart frontend dev server
cd viewer
npm run dev

# 3. Hard refresh browser
Ctrl + Shift + R
```

### Issue: CORS errors
**Solution:**
```javascript
// In server/src/index.js, make sure CORS is configured:
app.use(cors({
  origin: 'http://localhost:5173', // Frontend URL
  credentials: true
}));
```

### Issue: Connection refused
**Solution:**
```bash
# Make sure backend is running on port 8001
cd server
npm start

# Check if port is in use
netstat -ano | findstr :8001  # Windows
lsof -i :8001                 # Linux/Mac
```

---

## 📊 Port Configuration Summary

| Service | Port | URL |
|---------|------|-----|
| Backend API | 8001 | http://localhost:8001 |
| Frontend Dev | 5173 | http://localhost:5173 |
| MongoDB | 27017 | mongodb://localhost:27017 |
| AI Services | Various | Check ai-services/ |

---

## 🎯 API Endpoints (Port 8001)

All these endpoints now use port **8001**:

```
POST   http://localhost:8001/api/structured-reports/from-ai/:analysisId
PUT    http://localhost:8001/api/structured-reports/:reportId
POST   http://localhost:8001/api/structured-reports/:reportId/sign
GET    http://localhost:8001/api/structured-reports/study/:studyUID
GET    http://localhost:8001/api/structured-reports/:reportId
GET    http://localhost:8001/api/structured-reports/:reportId/pdf
```

---

## ✅ Verification Checklist

- [ ] Backend running on port 8001
- [ ] Frontend .env file has VITE_API_URL=http://localhost:8001
- [ ] Frontend restarted after .env change
- [ ] Browser cache cleared
- [ ] Network tab shows requests to port 8001
- [ ] No CORS errors in console
- [ ] API calls successful (200 status)

---

## 🎉 All Set!

Backend ab port **8001** pe properly configured hai. Saare API calls ab correct port pe jayenge.

**Test karo:**
1. Backend start karo (port 8001)
2. Frontend start karo
3. AI analysis chalaao
4. "Create Medical Report" button click karo
5. Report Editor khulega aur API calls port 8001 pe jayengi ✅
