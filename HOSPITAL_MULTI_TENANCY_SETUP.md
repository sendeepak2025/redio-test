# Hospital Multi-Tenancy Setup

## Overview

This system now supports multi-hospital tenancy where:
- Each hospital has isolated patients and studies
- Super admins can see all data across hospitals
- Hospital users only see their hospital's data
- Role-based access control protects sensitive routes

## Seeded Users

### 1. Super Admin
- **Email**: superadmin@gmail.com
- **Password**: 12345678
- **Roles**: `system:admin`, `super_admin`
- **Access**: All hospitals, all data, super admin dashboard

### 2. Hospital Admin
- **Email**: hospital@gmail.com
- **Password**: 123456
- **Roles**: `admin`, `radiologist`
- **Hospital**: HOSP001 (General Hospital)
- **Access**: Only General Hospital's patients and studies

### 3. Default Admin (Backward Compatibility)
- **Email**: admin@example.com
- **Password**: admin123
- **Roles**: `admin`
- **Hospital**: HOSP001 (General Hospital)

## Hospital Configuration

### Default Hospital
- **Hospital ID**: HOSP001
- **Name**: General Hospital
- **Status**: Active
- **Subscription**: Enterprise plan
- **Features**:
  - AI Analysis: Enabled
  - Advanced Reporting: Enabled
  - Custom Branding: Enabled
  - Max Users: 100
  - Max Storage**: 1TB

## Data Model Changes

### Patient Model
```javascript
{
  patientID: String,
  patientName: String,
  birthDate: String,
  sex: String,
  studyIds: [String],
  hospitalId: String  // NEW: Hospital reference
}
```

### Study Model
```javascript
{
  studyInstanceUID: String,
  patientID: String,
  patientName: String,
  modality: String,
  studyDate: String,
  studyTime: String,
  studyDescription: String,
  numberOfSeries: Number,
  numberOfInstances: Number,
  hospitalId: String  // NEW: Hospital reference
}
```

## Access Control

### Super Admin Access
- Can view all hospitals' data
- Access to `/superadmin` dashboard
- No hospital filtering applied
- Full system access

### Hospital User Access
- Can only view their hospital's data
- Filtered by `hospitalId` in queries
- Cannot access `/superadmin` route
- Redirected to dashboard if attempting super admin access

## API Endpoints

### Patients API

#### GET /api/patients
Returns patients filtered by user's hospital (unless super admin)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "patientID": "P001",
      "patientName": "John Doe",
      "birthDate": "1980-01-01",
      "sex": "M",
      "studyCount": 3,
      "hospitalId": "HOSP001"
    }
  ]
}
```

#### POST /api/patients
Creates patient with authenticated user's hospitalId

**Request**:
```json
{
  "patientID": "P001",
  "patientName": "John Doe",
  "birthDate": "1980-01-01",
  "sex": "M"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "patientID": "P001",
    "hospitalId": "HOSP001"
  }
}
```

### Studies API

#### GET /api/dicom/studies
Returns studies filtered by user's hospital (unless super admin)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "studyInstanceUID": "1.2.3.4.5",
      "patientName": "John Doe",
      "modality": "CT",
      "numberOfSeries": 1,
      "numberOfInstances": 100,
      "hospitalId": "HOSP001"
    }
  ]
}
```

#### POST /api/dicom/upload
Uploads DICOM file with authenticated user's hospitalId

**Form Data**:
- `file`: DICOM file
- `patientID`: (optional) Override patient ID
- `patientName`: (optional) Override patient name

**Response**:
```json
{
  "success": true,
  "message": "Successfully uploaded DICOM with 100 frame(s)",
  "data": {
    "studyInstanceUID": "1.2.3.4.5",
    "patientID": "P001",
    "hospitalId": "HOSP001"
  }
}
```

## Frontend Changes

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
- Checks authentication
- Verifies user has `system:admin` or `super_admin` role
- Redirects non-super-admins to dashboard

### Logout Functionality

Fixed logout in both:
1. **MainLayout.tsx** - Sidebar logout button
2. **Header.tsx** - User menu logout button

Both now properly:
- Dispatch Redux logout action
- Clear tokens from storage
- Clear axios headers
- Navigate to login page

## Testing

### Test Super Admin Access
1. Login as superadmin@gmail.com / 12345678
2. Navigate to `/superadmin`
3. Should see super admin dashboard
4. Should see all hospitals' data

### Test Hospital User Access
1. Login as hospital@gmail.com / 123456
2. Navigate to `/superadmin`
3. Should be redirected to `/dashboard`
4. Should only see HOSP001 data

### Test Data Isolation
1. Login as hospital@gmail.com
2. Upload a study
3. Verify study has `hospitalId: "HOSP001"`
4. Create a patient
5. Verify patient has `hospitalId: "HOSP001"`
6. Logout and login as superadmin
7. Verify you can see all data

### Test Logout
1. Login as any user
2. Click logout button in sidebar or header
3. Should be redirected to login page
4. Verify tokens are cleared from localStorage
5. Verify cannot access protected routes

## Database Indexes

### Patient Collection
```javascript
// Compound index for hospital-based queries
{ hospitalId: 1, patientID: 1 }
```

### Study Collection
```javascript
// Compound indexes for hospital-based queries
{ hospitalId: 1, studyInstanceUID: 1 }
{ hospitalId: 1, patientID: 1 }
```

## Migration Notes

### Existing Data
Existing patients and studies without `hospitalId` will:
- Still be accessible
- Be assigned to hospital when updated
- Be visible to all users until assigned

### Adding hospitalId to Existing Data
Run this MongoDB script to assign existing data to default hospital:

```javascript
// Update all patients without hospitalId
db.patients.updateMany(
  { hospitalId: { $exists: false } },
  { $set: { hospitalId: "HOSP001" } }
)

// Update all studies without hospitalId
db.studies.updateMany(
  { hospitalId: { $exists: false } },
  { $set: { hospitalId: "HOSP001" } }
)
```

## Security Considerations

1. **Hospital Isolation**
   - All queries filtered by hospitalId
   - Super admin bypass requires explicit role check
   - No cross-hospital data leakage

2. **Role Verification**
   - Roles checked on every protected route
   - JWT token contains user roles
   - Backend validates roles on API calls

3. **Token Management**
   - Tokens stored in localStorage/sessionStorage
   - Authorization header on all requests
   - HTTP-only cookies for refresh tokens
   - Automatic token refresh on expiration

## Future Enhancements

1. **Hospital Management UI**
   - Create/edit hospitals
   - Manage hospital settings
   - View hospital statistics

2. **User Assignment**
   - Assign users to hospitals
   - Transfer users between hospitals
   - Multi-hospital access for some users

3. **Data Transfer**
   - Transfer patients between hospitals
   - Share studies across hospitals
   - Audit trail for transfers

4. **Billing & Usage**
   - Track storage per hospital
   - Monitor API usage
   - Generate billing reports

## Troubleshooting

### User Can't See Data
1. Check user's `hospitalId` in database
2. Verify data has matching `hospitalId`
3. Check user roles for super admin access

### Super Admin Can't Access Dashboard
1. Verify user has `system:admin` or `super_admin` role
2. Check JWT token contains correct roles
3. Clear browser cache and re-login

### Data Showing for Wrong Hospital
1. Check query filters in controller
2. Verify `req.user.hospitalId` is set
3. Check super admin bypass logic

### Logout Not Working
1. Check Redux action is dispatched
2. Verify tokens are cleared from storage
3. Check axios headers are cleared
4. Verify navigation to login page
