# Login System Verification Checklist

## ✅ Pre-Flight Checks

### 1. Server Running
- [ ] Backend server is running on `http://localhost:8001`
- [ ] Frontend dev server is running on `http://localhost:5173`
- [ ] MongoDB is connected (check server logs)

### 2. Database Seeded
Check server startup logs for:
- [ ] `✅ Super Admin created: superadmin / 12345678`
- [ ] `✅ Hospital created: General Hospital (HOSP001)`
- [ ] `✅ Hospital Admin created: hospital / 123456`
- [ ] `✅ Default Admin created: admin / admin123`

### 3. Verify Users in Database
```bash
mongosh
use dicomdb
db.users.find({}, {username: 1, email: 1, roles: 1, hospitalId: 1}).pretty()
```

Expected output:
```javascript
[
  {
    _id: ObjectId("..."),
    username: "superadmin",
    email: "superadmin@gmail.com",
    roles: ["system:admin", "super_admin"],
    hospitalId: null
  },
  {
    _id: ObjectId("..."),
    username: "hospital",
    email: "hospital@gmail.com",
    roles: ["admin", "radiologist"],
    hospitalId: "HOSP001"
  },
  {
    _id: ObjectId("..."),
    username: "admin",
    email: "admin@example.com",
    roles: ["admin"],
    hospitalId: "HOSP001"
  }
]
```

## 🧪 Backend API Tests

### Test 1: Super Admin Login (Username)
```bash
curl -X POST http://localhost:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin","password":"12345678"}'
```

**Expected Response:**
- [ ] `success: true`
- [ ] `role: "superadmin"`
- [ ] `hospitalId: null`
- [ ] `user.roles: ["system:admin", "super_admin"]`
- [ ] `accessToken` present
- [ ] `refreshToken` present

### Test 2: Super Admin Login (Email)
```bash
curl -X POST http://localhost:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@gmail.com","password":"12345678"}'
```

**Expected Response:**
- [ ] Same as Test 1

### Test 3: Hospital Admin Login (Username)
```bash
curl -X POST http://localhost:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"hospital","password":"123456"}'
```

**Expected Response:**
- [ ] `success: true`
- [ ] `role: "admin"`
- [ ] `hospitalId: "HOSP001"`
- [ ] `user.roles: ["admin", "radiologist"]`
- [ ] `accessToken` present
- [ ] `refreshToken` present

### Test 4: Hospital Admin Login (Email)
```bash
curl -X POST http://localhost:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"hospital@gmail.com","password":"123456"}'
```

**Expected Response:**
- [ ] Same as Test 3

### Test 5: Invalid Credentials
```bash
curl -X POST http://localhost:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin","password":"wrongpassword"}'
```

**Expected Response:**
- [ ] `success: false`
- [ ] `message: "Invalid credentials"`
- [ ] Status code: 401

### Test 6: Missing Password
```bash
curl -X POST http://localhost:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin"}'
```

**Expected Response:**
- [ ] `success: false`
- [ ] `message: "Username/email and password required"`
- [ ] Status code: 400

## 🌐 Frontend Tests

### Test 7: Super Admin Login via UI
1. [ ] Open `http://localhost:5173/login`
2. [ ] Enter username: `superadmin`
3. [ ] Enter password: `12345678`
4. [ ] Click "Login"
5. [ ] Should redirect to `/superadmin`
6. [ ] Should see Super Admin Dashboard
7. [ ] Check browser console for: `Login successful, redirecting to: /superadmin`

### Test 8: Super Admin Login via Email
1. [ ] Open `http://localhost:5173/login`
2. [ ] Enter email: `superadmin@gmail.com`
3. [ ] Enter password: `12345678`
4. [ ] Click "Login"
5. [ ] Should redirect to `/superadmin`

### Test 9: Hospital Admin Login via UI
1. [ ] Open `http://localhost:5173/login`
2. [ ] Enter username: `hospital`
3. [ ] Enter password: `123456`
4. [ ] Click "Login"
5. [ ] Should redirect to `/dashboard`
6. [ ] Should see regular dashboard (not super admin)
7. [ ] Check browser console for: `Login successful, redirecting to: /dashboard`

### Test 10: Hospital Admin Login via Email
1. [ ] Open `http://localhost:5173/login`
2. [ ] Enter email: `hospital@gmail.com`
3. [ ] Enter password: `123456`
4. [ ] Click "Login"
5. [ ] Should redirect to `/dashboard`

### Test 11: Remember Me Functionality
1. [ ] Open `http://localhost:5173/login`
2. [ ] Enter credentials
3. [ ] Check "Remember Me" checkbox
4. [ ] Click "Login"
5. [ ] Open DevTools → Application → Local Storage
6. [ ] Verify `accessToken`, `refreshToken`, `user`, `role`, `hospitalId` are stored
7. [ ] Close browser
8. [ ] Reopen browser and go to `http://localhost:5173`
9. [ ] Should still be logged in

### Test 12: Session-Only Login
1. [ ] Open `http://localhost:5173/login`
2. [ ] Enter credentials
3. [ ] Do NOT check "Remember Me"
4. [ ] Click "Login"
5. [ ] Open DevTools → Application → Session Storage
6. [ ] Verify tokens are in Session Storage (not Local Storage)
7. [ ] Close browser tab
8. [ ] Reopen tab
9. [ ] Should be logged out

## 🔐 Authorization Tests

### Test 13: Super Admin Access
1. [ ] Login as super admin
2. [ ] Navigate to `/superadmin`
3. [ ] Should see Super Admin Dashboard
4. [ ] Should see all hospitals' data

### Test 14: Hospital Admin Cannot Access Super Admin
1. [ ] Login as hospital admin
2. [ ] Try to navigate to `/superadmin`
3. [ ] Should be redirected to `/dashboard`
4. [ ] Check console for: `Not a super admin, redirecting to dashboard`

### Test 15: Unauthenticated Access
1. [ ] Logout (or open incognito window)
2. [ ] Try to navigate to `/dashboard`
3. [ ] Should be redirected to `/login`
4. [ ] Try to navigate to `/superadmin`
5. [ ] Should be redirected to `/login`

## 💾 Token Persistence Tests

### Test 16: Token in LocalStorage
1. [ ] Login with "Remember Me" checked
2. [ ] Open DevTools → Application → Local Storage
3. [ ] Verify these keys exist:
   - [ ] `accessToken`
   - [ ] `refreshToken`
   - [ ] `user`
   - [ ] `role`
   - [ ] `hospitalId` (if hospital user)

### Test 17: Token in Headers
1. [ ] Login successfully
2. [ ] Open DevTools → Network tab
3. [ ] Make any API request (e.g., get patients)
4. [ ] Check request headers
5. [ ] Verify `Authorization: Bearer <token>` header is present

### Test 18: Token Refresh
1. [ ] Login successfully
2. [ ] Wait for token to expire (or manually expire it)
3. [ ] Make an API request
4. [ ] Should automatically refresh token
5. [ ] Request should succeed

## 🚪 Logout Tests

### Test 19: Logout from Sidebar
1. [ ] Login successfully
2. [ ] Click logout button in sidebar
3. [ ] Should redirect to `/login`
4. [ ] Verify tokens are cleared from storage
5. [ ] Try to access `/dashboard`
6. [ ] Should be redirected to `/login`

### Test 20: Logout from Header
1. [ ] Login successfully
2. [ ] Click user menu in header
3. [ ] Click "Logout"
4. [ ] Should redirect to `/login`
5. [ ] Verify tokens are cleared

## 🔄 Role-Based Data Access Tests

### Test 21: Super Admin Sees All Data
1. [ ] Login as super admin
2. [ ] Navigate to patients page
3. [ ] Should see patients from all hospitals
4. [ ] Check API request in Network tab
5. [ ] Query should NOT filter by hospitalId

### Test 22: Hospital Admin Sees Only Their Data
1. [ ] Login as hospital admin
2. [ ] Navigate to patients page
3. [ ] Should only see HOSP001 patients
4. [ ] Check API request in Network tab
5. [ ] Query should filter by `hospitalId: "HOSP001"`

### Test 23: Upload Study as Hospital Admin
1. [ ] Login as hospital admin
2. [ ] Upload a DICOM study
3. [ ] Check database
4. [ ] Study should have `hospitalId: "HOSP001"`
5. [ ] Patient should have `hospitalId: "HOSP001"`

## 🐛 Error Handling Tests

### Test 24: Network Error
1. [ ] Stop backend server
2. [ ] Try to login
3. [ ] Should show error message
4. [ ] Should not crash

### Test 25: Invalid JSON Response
1. [ ] Modify backend to return invalid JSON
2. [ ] Try to login
3. [ ] Should handle error gracefully

### Test 26: Expired Token
1. [ ] Login successfully
2. [ ] Manually expire token in localStorage
3. [ ] Try to access protected route
4. [ ] Should redirect to login

## 📊 Automated Test Script

Run the automated test script:
```bash
node test-login.js
```

**Expected Output:**
```
🚀 Starting Login Tests
   Server: http://localhost:8001
============================================================

🧪 Testing: Super Admin (username)
   ✅ Login successful
   User: superadmin (superadmin@gmail.com)
   Role: superadmin
   Hospital ID: null

🧪 Testing: Super Admin (email)
   ✅ Login successful
   User: superadmin (superadmin@gmail.com)
   Role: superadmin
   Hospital ID: null

🧪 Testing: Hospital Admin (username)
   ✅ Login successful
   User: hospital (hospital@gmail.com)
   Role: admin
   Hospital ID: HOSP001

🧪 Testing: Hospital Admin (email)
   ✅ Login successful
   User: hospital (hospital@gmail.com)
   Role: admin
   Hospital ID: HOSP001

🧪 Testing: Default Admin (username)
   ✅ Login successful
   User: admin (admin@example.com)
   Role: admin
   Hospital ID: HOSP001

============================================================
📊 Test Results: 5 passed, 0 failed
✅ All tests passed!
```

## 📝 Final Verification

- [ ] All backend API tests pass
- [ ] All frontend UI tests pass
- [ ] All authorization tests pass
- [ ] All token persistence tests pass
- [ ] All logout tests pass
- [ ] All role-based data access tests pass
- [ ] All error handling tests pass
- [ ] Automated test script passes

## 🎉 Success Criteria

✅ **Login System is Working** if:
1. Super admin can login with username or email
2. Hospital admin can login with username or email
3. Users are redirected to correct dashboard based on role
4. Tokens are properly stored and persisted
5. Authorization works correctly
6. Data access is filtered by hospital
7. Logout clears all tokens
8. All automated tests pass

## 🔧 Troubleshooting

If any test fails, check:
1. Server logs for errors
2. Browser console for errors
3. Network tab for failed requests
4. Database for user records
5. Redux DevTools for state changes
6. localStorage/sessionStorage for tokens

## 📚 Documentation References

- `LOGIN_CREDENTIALS.md` - Quick reference for credentials
- `UNIFIED_LOGIN_SYSTEM.md` - Complete system documentation
- `HOSPITAL_MULTI_TENANCY_SETUP.md` - Multi-hospital setup
- `TOKEN_MANAGEMENT_GUIDE.md` - Token handling details
