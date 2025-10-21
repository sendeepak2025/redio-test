# Login Credentials Reference

## Quick Access

### 🔴 Super Admin
```
Username: superadmin
Email: superadmin@gmail.com
Password: 12345678

Dashboard: /superadmin
Access: All hospitals, all data
```

### 🔵 Hospital Admin
```
Username: hospital
Email: hospital@gmail.com
Password: 123456

Hospital: HOSP001 (General Hospital)
Dashboard: /dashboard
Access: Only HOSP001 data
```

### 🟢 Default Admin
```
Username: admin
Email: admin@example.com
Password: admin123

Hospital: HOSP001 (General Hospital)
Dashboard: /dashboard
Access: Only HOSP001 data
```

## Login Methods

You can login using **either username OR email**:

### Method 1: Username + Password
```json
{
  "username": "superadmin",
  "password": "12345678"
}
```

### Method 2: Email + Password
```json
{
  "email": "superadmin@gmail.com",
  "password": "12345678"
}
```

## Testing Login

### Using cURL

#### Test Super Admin Login (Username)
```bash
curl -X POST http://localhost:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin","password":"12345678"}' \
  -c cookies.txt
```

#### Test Super Admin Login (Email)
```bash
curl -X POST http://localhost:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@gmail.com","password":"12345678"}' \
  -c cookies.txt
```

#### Test Hospital Admin Login (Username)
```bash
curl -X POST http://localhost:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"hospital","password":"123456"}' \
  -c cookies.txt
```

#### Test Hospital Admin Login (Email)
```bash
curl -X POST http://localhost:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"hospital@gmail.com","password":"123456"}' \
  -c cookies.txt
```

### Using Node.js Test Script

Run the automated test script:
```bash
node test-login.js
```

This will test all login methods and verify:
- ✅ Login succeeds
- ✅ Correct role is returned
- ✅ Correct hospitalId is returned
- ✅ JWT tokens are generated

## Expected Response

### Super Admin Login Response
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "superadmin",
    "email": "superadmin@gmail.com",
    "firstName": "Super",
    "lastName": "Admin",
    "roles": ["system:admin", "super_admin"],
    "permissions": ["*"],
    "hospitalId": null,
    "isActive": true,
    "isVerified": true,
    "mfaEnabled": false
  },
  "role": "superadmin",
  "hospitalId": null
}
```

### Hospital Admin Login Response
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439012",
    "username": "hospital",
    "email": "hospital@gmail.com",
    "firstName": "Hospital",
    "lastName": "Admin",
    "roles": ["admin", "radiologist"],
    "permissions": ["studies:read", "studies:write", "patients:read", "patients:write", "users:read"],
    "hospitalId": "HOSP001",
    "isActive": true,
    "isVerified": true,
    "mfaEnabled": false
  },
  "role": "admin",
  "hospitalId": "HOSP001"
}
```

## Frontend Login

### Login Form
The login form accepts either username or email:

```typescript
// Login with username
await login({
  username: 'superadmin',
  password: '12345678',
  rememberMe: true
})

// OR login with email
await login({
  email: 'superadmin@gmail.com',
  password: '12345678',
  rememberMe: true
})
```

### Automatic Redirect
After successful login, users are automatically redirected based on their role:

- **Super Admin** → `/superadmin`
- **Admin/Radiologist/Staff** → `/dashboard`

## Verification Steps

### 1. Check Server is Running
```bash
# Server should be running on port 8001
curl http://localhost:8001/health
```

### 2. Check Database Connection
```bash
# MongoDB should be connected
# Check server logs for: "MongoDB connected successfully"
```

### 3. Run Seed Script
```bash
# Make sure users are seeded
# Check server logs for:
# ✅ Super Admin created: superadmin / 12345678
# ✅ Hospital Admin created: hospital / 123456
```

### 4. Test Login
```bash
# Run the test script
node test-login.js

# Expected output:
# 🧪 Testing: Super Admin (username)
#    ✅ Login successful
#    User: superadmin (superadmin@gmail.com)
#    Role: superadmin
#    Hospital ID: null
```

### 5. Test in Browser
1. Open http://localhost:5173/login
2. Enter credentials:
   - Username: `superadmin`
   - Password: `12345678`
3. Click "Login"
4. Should redirect to `/superadmin`

## Troubleshooting

### Login Fails with "Invalid credentials"
1. Check if users are seeded:
   ```bash
   # Check MongoDB
   mongosh
   use dicomdb
   db.users.find({}, {username: 1, email: 1, roles: 1})
   ```

2. Verify password is correct
3. Check if user is active: `isActive: true`

### Login Succeeds but Wrong Redirect
1. Check `role` in login response
2. Verify `getPrimaryRole()` method in User model
3. Check `getRoleBasedRedirect()` function

### Token Not Persisting
1. Check browser localStorage/sessionStorage
2. Verify "Remember Me" checkbox
3. Check Redux store subscription

### Super Admin Can't Access /superadmin
1. Verify user has `system:admin` or `super_admin` role
2. Check `SuperAdminRoute` component
3. Verify JWT token includes correct roles

## Security Notes

⚠️ **IMPORTANT**: Change these default passwords in production!

1. Set strong passwords via environment variables:
   ```bash
   ADMIN_USERNAME=your_admin
   ADMIN_PASSWORD=your_strong_password
   ADMIN_EMAIL=admin@yourdomain.com
   ```

2. Use HTTPS in production
3. Enable MFA for super admin accounts
4. Implement rate limiting on login endpoint
5. Monitor failed login attempts
6. Regularly rotate JWT secrets

## Database Queries

### Find All Users
```javascript
db.users.find({}, {
  username: 1,
  email: 1,
  roles: 1,
  hospitalId: 1,
  isActive: 1
}).pretty()
```

### Find Super Admins
```javascript
db.users.find({
  roles: { $in: ['system:admin', 'super_admin'] }
}).pretty()
```

### Find Hospital Users
```javascript
db.users.find({
  hospitalId: { $exists: true, $ne: null }
}).pretty()
```

### Update User Password
```javascript
const bcrypt = require('bcryptjs')
const newPassword = 'new_password_here'
const passwordHash = await bcrypt.hash(newPassword, 10)

db.users.updateOne(
  { username: 'superadmin' },
  { $set: { passwordHash: passwordHash } }
)
```
