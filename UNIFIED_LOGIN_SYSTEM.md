# Unified Login System

## Overview

The system now uses a **single unified login endpoint** that handles all user types (Super Admin, Hospital Admin, Radiologist, Staff) through one User model with role-based access control.

## Architecture

### Single User Model
All users are stored in the `User` collection with different roles:
- `system:admin` or `super_admin` - Super Administrator
- `admin` - Hospital Administrator  
- `radiologist` - Radiologist
- `staff` - Staff member
- `user` - Regular user

### Login Flow

```
1. User enters credentials (username/email + password)
   ↓
2. POST /auth/login
   ↓
3. Backend finds user in User collection
   ↓
4. Validates password
   ↓
5. Generates JWT with user info + roles + hospitalId
   ↓
6. Returns:
   - accessToken
   - refreshToken
   - user object
   - role (primary role for routing)
   - hospitalId
   ↓
7. Frontend stores tokens + role + hospitalId
   ↓
8. Redirects to role-based dashboard
```

## User Credentials

### Super Admin
```
Email: superadmin@gmail.com
Password: 12345678
Role: superadmin
Dashboard: /superadmin
Access: All hospitals, all data
```

### Hospital Admin
```
Email: hospital@gmail.com
Password: 123456
Role: admin
Hospital: HOSP001
Dashboard: /dashboard
Access: Only HOSP001 data
```

### Default Admin
```
Email: admin@example.com
Password: admin123
Role: admin
Hospital: HOSP001
Dashboard: /dashboard
Access: Only HOSP001 data
```

## API Endpoints

### POST /auth/login

**Request:**
```json
{
  "username": "superadmin",
  "password": "12345678"
}
```

OR

```json
{
  "email": "superadmin@gmail.com",
  "password": "12345678"
}
```

**Response:**
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
    "mfaEnabled": false,
    "lastLogin": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "role": "superadmin",
  "hospitalId": null
}
```

## JWT Token Payload

```json
{
  "sub": "507f1f77bcf86cd799439011",
  "username": "superadmin",
  "roles": ["system:admin", "super_admin"],
  "permissions": ["*"],
  "hospitalId": null,
  "iat": 1705315800,
  "exp": 1705317600
}
```

## Role-Based Routing

### Frontend Redirect Logic

```typescript
// After successful login
const role = response.role // 'superadmin' | 'admin' | 'radiologist' | 'staff' | 'user'

switch (role) {
  case 'superadmin':
    navigate('/superadmin')
    break
  case 'admin':
  case 'radiologist':
  case 'staff':
  default:
    navigate('/dashboard')
    break
}
```

### Route Protection

#### Super Admin Route
```typescript
<Route
  path="/superadmin"
  element={
    <SuperAdminRoute>
      <MainLayout>
        <SuperAdminDashboard />
      </MainLayout>
    </SuperAdminRoute>
  }
/>
```

The `SuperAdminRoute` component:
- Checks if user is authenticated
- Verifies user has `system:admin` or `super_admin` role
- Redirects non-super-admins to `/dashboard`

#### Protected Routes
```typescript
<Route
  path="/dashboard"
  element={
    <SimpleProtectedRoute>
      <MainLayout>
        <PatientsPage />
      </MainLayout>
    </SimpleProtectedRoute>
  }
/>
```

The `SimpleProtectedRoute` component:
- Checks if user is authenticated
- Redirects unauthenticated users to `/login`

## Data Access Control

### Super Admin Access
```javascript
// Backend controller
const isSuperAdmin = req.user.roles && (
  req.user.roles.includes('system:admin') || 
  req.user.roles.includes('super_admin')
)

if (isSuperAdmin) {
  // No hospital filtering - see all data
  const patients = await Patient.find({})
} else {
  // Filter by hospital
  const patients = await Patient.find({ 
    hospitalId: req.user.hospitalId 
  })
}
```

### Hospital User Access
```javascript
// Backend controller
const query = {}

if (req.user.hospitalId && !isSuperAdmin) {
  query.hospitalId = req.user.hospitalId
}

const studies = await Study.find(query)
```

## Frontend State Management

### Redux Auth State
```typescript
interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  role: string | null // Primary role for routing
  hospitalId: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  lastActivity: number
}
```

### Storage
Tokens and user data are stored in:
- **localStorage** (if "Remember Me" is checked)
- **sessionStorage** (if "Remember Me" is not checked)

Stored items:
- `accessToken`
- `refreshToken`
- `user` (JSON string)
- `role` (primary role)
- `hospitalId`

### Selectors
```typescript
import { useAppSelector } from './store/hooks'
import { selectUserRole, selectHospitalId } from './store/slices/authSlice'

const role = useAppSelector(selectUserRole)
const hospitalId = useAppSelector(selectHospitalId)
```

## User Model Schema

```javascript
{
  username: String (required, unique),
  email: String (required, unique),
  passwordHash: String (required),
  firstName: String (required),
  lastName: String (required),
  roles: [String] (default: ['user']),
  permissions: [String] (default: ['studies:read']),
  hospitalId: String (optional),
  isActive: Boolean (default: true),
  isVerified: Boolean (default: true),
  mfaEnabled: Boolean (default: false),
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Methods

#### toPublicJSON()
Returns user object without sensitive data (password hash)

#### getPrimaryRole()
Returns primary role for routing:
- `'superadmin'` - if has `system:admin` or `super_admin` role
- `'admin'` - if has `admin` role
- `'radiologist'` - if has `radiologist` role
- `'staff'` - if has `staff` role
- `'user'` - default

## Testing

### Test Super Admin Login
```bash
curl -X POST https://apiradio.varnaamedicalbillingsolutions.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@gmail.com",
    "password": "12345678"
  }'
```

Expected: `role: "superadmin"`, `hospitalId: null`

### Test Hospital Admin Login
```bash
curl -X POST https://apiradio.varnaamedicalbillingsolutions.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "hospital@gmail.com",
    "password": "123456"
  }'
```

Expected: `role: "admin"`, `hospitalId: "HOSP001"`

### Frontend Testing

1. **Login as Super Admin**
   - Email: superadmin@gmail.com
   - Password: 12345678
   - Should redirect to `/superadmin`
   - Should see all hospitals' data

2. **Login as Hospital Admin**
   - Email: hospital@gmail.com
   - Password: 123456
   - Should redirect to `/dashboard`
   - Should only see HOSP001 data
   - Attempting to access `/superadmin` should redirect to `/dashboard`

3. **Logout and Re-login**
   - Logout
   - Verify tokens are cleared
   - Login again
   - Verify correct redirect based on role

## Security Features

### Password Hashing
- Uses bcrypt with salt rounds
- Passwords never stored in plain text
- Passwords never returned in API responses

### JWT Tokens
- Access token expires in 30 minutes
- Refresh token expires in 7 days
- Tokens include user roles and hospitalId
- Tokens validated on every protected route

### Role Verification
- Roles checked on backend for every request
- Frontend route guards prevent unauthorized access
- Super admin routes require explicit role check

### Hospital Isolation
- Hospital users can only access their hospital's data
- Super admins can access all hospitals
- HospitalId included in JWT token
- All queries filtered by hospitalId (except super admin)

## Migration from Multiple Models

If you previously had separate SuperAdmin, Hospital, and Admin models:

### Step 1: Export existing users
```javascript
// Export from old models
const superAdmins = await SuperAdmin.find({})
const hospitals = await Hospital.find({})
const admins = await Admin.find({})
```

### Step 2: Import to User model
```javascript
// Import super admins
for (const sa of superAdmins) {
  await User.create({
    username: sa.username,
    email: sa.email,
    passwordHash: sa.passwordHash,
    firstName: sa.firstName,
    lastName: sa.lastName,
    roles: ['system:admin', 'super_admin'],
    permissions: ['*'],
    hospitalId: null,
    isActive: true,
    isVerified: true
  })
}

// Import hospital admins
for (const h of hospitals) {
  await User.create({
    username: h.username,
    email: h.email,
    passwordHash: h.passwordHash,
    firstName: h.firstName,
    lastName: h.lastName,
    roles: ['admin'],
    permissions: ['studies:read', 'studies:write', 'patients:read', 'patients:write'],
    hospitalId: h.hospitalId,
    isActive: true,
    isVerified: true
  })
}
```

### Step 3: Drop old collections
```javascript
await SuperAdmin.collection.drop()
await Hospital.collection.drop()
await Admin.collection.drop()
```

## Troubleshooting

### Login Returns Wrong Role
1. Check user's roles array in database
2. Verify `getPrimaryRole()` method logic
3. Check JWT token payload

### User Can't Access Dashboard
1. Verify user is authenticated
2. Check user's roles
3. Verify route protection logic

### Super Admin Can't Access Super Admin Dashboard
1. Check user has `system:admin` or `super_admin` role
2. Verify `SuperAdminRoute` component logic
3. Check JWT token includes correct roles

### Hospital Filtering Not Working
1. Verify user has `hospitalId` in database
2. Check JWT token includes `hospitalId`
3. Verify backend queries filter by `hospitalId`

### Tokens Not Persisting
1. Check localStorage/sessionStorage
2. Verify store subscription is working
3. Check "Remember Me" checkbox state

## Best Practices

1. **Always use HTTPS in production**
2. **Set strong JWT secrets**
3. **Implement rate limiting on login endpoint**
4. **Log all authentication attempts**
5. **Implement account lockout after failed attempts**
6. **Use MFA for super admin accounts**
7. **Regularly rotate JWT secrets**
8. **Monitor for suspicious login patterns**
9. **Implement session timeout**
10. **Clear tokens on logout**
