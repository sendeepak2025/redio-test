# 🔧 Complete Fix Guide - 401/404 Errors

## 🐛 Current Errors

```
1. POST .../from-ai/... 401 (Unauthorized)
2. Token refreshed successfully
3. POST .../from-ai/... 404 (Not Found)
```

**Analysis:**
- First call: 401 (no token or expired)
- Token refresh: Success
- Retry call: 404 (route not found after refresh)

**Root Cause:** Backend not restarted properly OR route not registered correctly.

---

## ✅ Complete Fix Steps

### Step 1: Verify Backend is Running
```bash
cd server

# Stop any running instance
# Windows:
taskkill /F /IM node.exe

# Linux/Mac:
pkill -f node

# Start fresh
npm start
```

**Expected Output:**
```
✅ Server running on port 8001
✅ MongoDB connected
✅ Routes loaded
```

### Step 2: Test Route Exists
```bash
# Test without authentication (should work)
curl http://localhost:8001/api/structured-reports/test

# Expected response:
{
  "success": true,
  "message": "✅ Structured Reports API is working!",
  "timestamp": "2025-10-24T..."
}
```

If you get 404 here, route is NOT registered properly.

### Step 3: Test with Authentication
```bash
# Get token first
curl -X POST http://localhost:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"your_username","password":"your_password"}'

# Save the token, then test:
curl http://localhost:8001/api/structured-reports/study/test \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return 200 or proper error (not 404)
```

### Step 4: Check Server Logs
```bash
# In server terminal, you should see:
POST /api/structured-reports/from-ai/AI-123... 
```

If you see:
- `Cannot POST /api/structured-reports/...` → Route not registered
- `401 Unauthorized` → Token issue
- `404 Not Found` → Route path mismatch

---

## 🔍 Debugging Steps

### Debug 1: Check Route Registration
```bash
# In server/src/routes/index.js, verify:
grep "structured-reports" server/src/routes/index.js

# Should show:
# const structuredReportsRoutes = require('./structured-reports');
# router.use('/api/structured-reports', structuredReportsRoutes);
```

### Debug 2: Check Route File
```bash
# Verify file exists:
ls server/src/routes/structured-reports.js

# Should exist and have routes defined
```

### Debug 3: Check Server Restart
```bash
# Make sure server actually restarted
# Look for this in terminal:
# "Server running on port 8001"
# "MongoDB connected"

# If not, manually restart:
cd server
npm start
```

### Debug 4: Check Port
```bash
# Make sure nothing else is using port 8001
# Windows:
netstat -ano | findstr :8001

# Linux/Mac:
lsof -i :8001

# If something is using it, kill it:
# Windows:
taskkill /F /PID <PID>

# Linux/Mac:
kill -9 <PID>
```

---

## 🎯 Token Issue Fix

The 401 → Token Refresh → 404 pattern suggests axios interceptor issue.

### Check authService.ts
```typescript
// Make sure retry uses correct URL
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Refresh token
      await refreshToken();
      
      // Retry with SAME URL (not modified)
      return axios(error.config);  // ← Should use original config
    }
    return Promise.reject(error);
  }
);
```

---

## 🔧 Alternative: Bypass Authentication for Testing

Temporarily disable auth to test if route works:

### In structured-reports.js:
```javascript
// Temporarily remove authenticate middleware
router.post('/from-ai/:analysisId', async (req, res) => {  // ← No authenticate
  try {
    // ... rest of code
  }
});
```

**⚠️ Remember to add it back after testing!**

---

## 📊 Complete Checklist

- [ ] Backend stopped completely
- [ ] Backend restarted fresh
- [ ] Test route works (`/api/structured-reports/test`)
- [ ] Server logs show route registration
- [ ] Port 8001 is free
- [ ] MongoDB connected
- [ ] Token is valid
- [ ] Frontend using correct URL
- [ ] CORS configured
- [ ] Headers allowed

---

## 🎯 Quick Test Script

Create `test-report-api.sh`:
```bash
#!/bin/bash

echo "🧪 Testing Structured Reports API..."

# Test 1: Test route
echo "Test 1: Test route (no auth)"
curl -s http://localhost:8001/api/structured-reports/test | jq

# Test 2: Login
echo "Test 2: Login"
TOKEN=$(curl -s -X POST http://localhost:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' | jq -r '.token')

echo "Token: $TOKEN"

# Test 3: Create report (with auth)
echo "Test 3: Create report from AI"
curl -s -X POST http://localhost:8001/api/structured-reports/from-ai/test-123 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"radiologistName":"Dr. Test","patientID":"P123","patientName":"Test","modality":"CT"}' | jq

echo "✅ Tests complete"
```

Run:
```bash
chmod +x test-report-api.sh
./test-report-api.sh
```

---

## 🎉 Expected Working Flow

### 1. Backend Starts:
```
✅ Server running on port 8001
✅ MongoDB connected
✅ CORS configured
✅ Routes loaded
```

### 2. Test Route Works:
```bash
curl http://localhost:8001/api/structured-reports/test
# Response: {"success": true, "message": "✅ ..."}
```

### 3. Frontend Call Works:
```
Browser Console:
✅ POST /api/structured-reports/from-ai/... 200 OK
✅ Report created successfully
✅ Report Editor shows draft
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot POST /api/structured-reports/..."
**Solution:** Route not registered. Check `server/src/routes/index.js`

### Issue 2: 404 after token refresh
**Solution:** Axios interceptor modifying URL. Check `authService.ts`

### Issue 3: 401 even with valid token
**Solution:** Token not being sent. Check axios headers

### Issue 4: Server not restarting
**Solution:** Kill all node processes and start fresh

### Issue 5: Port already in use
**Solution:** Kill process using port 8001

---

## 🚀 Final Steps

```bash
# 1. Kill all node processes
taskkill /F /IM node.exe  # Windows
# OR
pkill -f node  # Linux/Mac

# 2. Start backend fresh
cd server
npm start

# 3. Wait for "Server running on port 8001"

# 4. Test route
curl http://localhost:8001/api/structured-reports/test

# 5. If test works, try frontend
# Open http://localhost:3010
# Run AI analysis
# Click "Create Medical Report"
# Should work! ✅
```

---

## 📞 Still Not Working?

If still getting 404:

1. **Share server logs** - What does server console show?
2. **Share route file** - Is `structured-reports.js` correct?
3. **Share index.js** - Is route registered?
4. **Test route** - Does `/test` endpoint work?

**Most likely issue:** Backend not actually restarted. Make sure you see "Server running on port 8001" in terminal!

---

## 🎉 Success Indicators

When everything works:
```
✅ curl /test returns success
✅ Server logs show POST requests
✅ No 404 errors
✅ Report creates successfully
✅ Report Editor opens with draft
```

**Backend ko properly restart karo aur test karo!** 🚀
