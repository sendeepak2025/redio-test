# 🔑 Token Debug Guide - 401 Unauthorized Fix

## 🐛 Problem

```
POST /api/structured-reports/from-ai/... 401 (Unauthorized)
→ Token refreshed successfully
→ POST /api/structured-reports/from-ai/... 404 (Not Found)
```

**Root Cause:** Token nahi mil raha ya invalid hai localStorage me.

---

## 🔍 Debug Steps

### Step 1: Check Token in Browser Console
```javascript
// Open browser console (F12)
// Run these commands:

// Check if token exists
console.log('Token:', localStorage.getItem('token'));

// Check if username exists
console.log('Username:', localStorage.getItem('username'));

// Check all localStorage items
console.log('All localStorage:', {...localStorage});
```

**Expected Output:**
```javascript
Token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  // Long string
Username: "admin"  // or your username
```

**If null or undefined:**
```javascript
Token: null  // ❌ Problem!
Username: null  // ❌ Problem!
```

---

## ✅ Solution 1: Login First

### Option A: Login via UI
```
1. Go to login page
2. Enter username and password
3. Click login
4. Token will be saved automatically
```

### Option B: Login via Console
```javascript
// In browser console:
fetch('http://localhost:8001/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin',
    password: 'admin123'  // Your password
  })
})
.then(res => res.json())
.then(data => {
  if (data.token) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.user.username);
    console.log('✅ Token saved!');
    console.log('Token:', data.token);
  }
});
```

### Option C: Manually Set Token (Testing Only)
```javascript
// If you have a valid token:
localStorage.setItem('token', 'YOUR_VALID_TOKEN_HERE');
localStorage.setItem('username', 'admin');
console.log('✅ Token set manually');
```

---

## ✅ Solution 2: Fix Token Refresh Issue

The 401 → 404 pattern suggests axios interceptor is modifying the URL after token refresh.

### Check authService.ts

Look for axios interceptor:
```typescript
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Refresh token
      const newToken = await refreshToken();
      
      // IMPORTANT: Use original config, don't modify URL
      const originalRequest = error.config;
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      
      // Retry with SAME URL
      return axios(originalRequest);  // ← Should preserve URL
    }
    return Promise.reject(error);
  }
);
```

**Common Bug:**
```typescript
// ❌ WRONG - Modifies URL
return axios({
  ...originalRequest,
  url: originalRequest.url.replace('8001', '5000')  // ← BUG!
});

// ✅ CORRECT - Preserves URL
return axios(originalRequest);
```

---

## 🧪 Test Token

### Test 1: Check Token Validity
```javascript
// In browser console:
const token = localStorage.getItem('token');

fetch('http://localhost:8001/api/structured-reports/test', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(res => res.json())
.then(data => console.log('✅ Token valid:', data))
.catch(err => console.error('❌ Token invalid:', err));
```

### Test 2: Decode Token
```javascript
// Check token expiry
const token = localStorage.getItem('token');
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('Token payload:', payload);
  console.log('Expires:', new Date(payload.exp * 1000));
  console.log('Is expired?', Date.now() > payload.exp * 1000);
}
```

---

## 🔧 Fix Applied in ReportEditor

### Before:
```typescript
const token = localStorage.getItem('token');
// No validation, proceeds even if null
```

### After:
```typescript
const token = localStorage.getItem('token');
if (!token) {
  alert('⚠️ Authentication required. Please login first.');
  console.error('❌ No token found in localStorage');
  return;
}
console.log('🔑 Token found, creating draft report...');
```

---

## 📊 Complete Flow

### Working Flow:
```
1. User logs in
   ↓
2. Token saved to localStorage
   ↓
3. AI analysis runs
   ↓
4. Click "Create Medical Report"
   ↓
5. Token retrieved from localStorage ✅
   ↓
6. API call with Authorization header
   ↓
7. Backend validates token ✅
   ↓
8. Report created successfully ✅
```

### Broken Flow (Current):
```
1. User NOT logged in (or token expired)
   ↓
2. No token in localStorage ❌
   ↓
3. AI analysis runs
   ↓
4. Click "Create Medical Report"
   ↓
5. Token = null ❌
   ↓
6. API call with "Bearer null"
   ↓
7. Backend returns 401 Unauthorized ❌
   ↓
8. Token refresh attempts
   ↓
9. URL gets modified (bug in interceptor)
   ↓
10. Retry with wrong URL → 404 ❌
```

---

## 🎯 Quick Fix Commands

### Check Token:
```javascript
// Browser console (F12)
localStorage.getItem('token')
```

### Login and Save Token:
```javascript
// Browser console
fetch('http://localhost:8001/auth/login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({username: 'admin', password: 'admin123'})
})
.then(r => r.json())
.then(d => {
  localStorage.setItem('token', d.token);
  localStorage.setItem('username', d.user.username);
  alert('✅ Logged in! Token saved.');
  location.reload();
});
```

### Clear and Re-login:
```javascript
// Browser console
localStorage.clear();
alert('Cleared. Please login again.');
location.reload();
```

---

## ✅ Success Indicators

After fix:
```
Browser Console:
✅ Token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
✅ Username: "admin"
✅ 🔑 Token found, creating draft report...
✅ POST /api/structured-reports/from-ai/... 200 OK
✅ Report created successfully
```

---

## 🐛 Still Getting 401?

### Check 1: Token Expired?
```javascript
const token = localStorage.getItem('token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Expired?', Date.now() > payload.exp * 1000);
// If true, login again
```

### Check 2: Wrong Token?
```javascript
// Token should start with "eyJ"
const token = localStorage.getItem('token');
console.log('Valid format?', token?.startsWith('eyJ'));
```

### Check 3: Backend JWT Secret?
```bash
# In server/.env
JWT_SECRET=your-secret-key

# Make sure it's set and backend restarted
```

---

## 🎉 Final Solution

**Sabse pehle:**
```javascript
// Browser console me ye run karo:
localStorage.getItem('token')

// Agar null hai to:
// 1. Login page pe jao
// 2. Login karo
// 3. Token automatically save ho jayega
// 4. Phir report create karo
```

**Ya direct console se login:**
```javascript
fetch('http://localhost:8001/auth/login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({username: 'admin', password: 'admin123'})
})
.then(r => r.json())
.then(d => {
  localStorage.setItem('token', d.token);
  localStorage.setItem('username', d.user.username);
  alert('✅ Done! Now try creating report.');
});
```

**Token save hone ke baad report create karo!** 🚀
