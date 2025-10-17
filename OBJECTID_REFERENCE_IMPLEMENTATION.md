# ObjectId Reference Implementation - हिंदी में

## क्या बदला?

### पहले (String)
```javascript
hospitalId: { type: String }
```

### अब (ObjectId Reference)
```javascript
hospitalId: { 
  type: mongoose.Schema.Types.ObjectId, 
  ref: 'Hospital' 
}
```

## Updated Models

### 1. Patient Model
**File**: `server/src/models/Patient.js`

```javascript
const PatientSchema = new mongoose.Schema({
  patientID: { type: String, unique: true, index: true },
  patientName: { type: String },
  birthDate: { type: String },
  sex: { type: String },
  studyIds: { type: [String], default: [] },
  hospitalId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Hospital',  // ✅ Reference to Hospital model
    index: true 
  }
}, { timestamps: true });
```

**Benefits**:
- ✅ Proper MongoDB reference
- ✅ Can use `.populate('hospitalId')` to get full hospital details
- ✅ Better data integrity

### 2. Study Model
**File**: `server/src/models/Study.js`

```javascript
const StudySchema = new mongoose.Schema({
  studyInstanceUID: { type: String, unique: true, index: true },
  patientID: String,
  patientName: String,
  modality: String,
  hospitalId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Hospital',  // ✅ Reference to Hospital model
    index: true 
  }
}, { timestamps: true });
```

### 3. User Model
**File**: `server/src/models/User.js`

```javascript
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  roles: { type: [String], default: ['user'] },
  hospitalId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Hospital',  // ✅ Reference to Hospital model
    index: true 
  }
}, { timestamps: true });
```

## Seed Script Updates

### Before
```javascript
hospitalId: hospital.hospitalId  // ❌ String
```

### After
```javascript
hospitalId: hospital._id  // ✅ ObjectId
```

**Files Updated**:
- `server/src/seed/seedAdmin.js`
- `server/seed-users-manual.js`

## JWT Token Handling

### In authController
```javascript
function signAccessToken(user) {
  const payload = {
    sub: user.id,
    username: user.username,
    roles: user.roles,
    // Convert ObjectId to string for JWT
    hospitalId: user.hospitalId ? user.hospitalId.toString() : null,
  }
  return jwt.sign(payload, secret, { expiresIn: '30m' })
}
```

**Why?**: JWT tokens can't store ObjectId, so we convert to string

### In User.toPublicJSON()
```javascript
UserSchema.methods.toPublicJSON = function () {
  return {
    id: this._id.toString(),
    username: this.username,
    // Convert ObjectId to string for API response
    hospitalId: this.hospitalId ? this.hospitalId.toString() : undefined,
  }
}
```

## Controller Updates

### Patient Controller

#### Create Patient
```javascript
async function createPatient(req, res) {
  // hospitalId from JWT is already a string
  const hospitalId = req.user.hospitalId
  
  const patient = new Patient({ 
    patientID, 
    patientName, 
    hospitalId  // MongoDB will convert string to ObjectId
  })
  await patient.save()
  
  // Convert ObjectId to string for response
  res.json({ 
    success: true, 
    data: { 
      patientID: patient.patientID, 
      hospitalId: patient.hospitalId.toString() 
    } 
  })
}
```

#### Get Patients
```javascript
async function getPatients(req, res) {
  const query = {}
  
  if (!isSuperAdmin && req.user.hospitalId) {
    // req.user.hospitalId is string from JWT
    // MongoDB will match it with ObjectId in database
    query.hospitalId = req.user.hospitalId
  }
  
  const patients = await Patient.find(query).lean()
  
  // Convert ObjectId to string in response
  const out = patients.map(p => ({
    patientID: p.patientID,
    patientName: p.patientName,
    hospitalId: p.hospitalId ? p.hospitalId.toString() : null
  }))
  
  res.json({ success: true, data: out })
}
```

### Study Controller

Same pattern as Patient Controller:
- JWT has hospitalId as string
- MongoDB stores as ObjectId
- Query works because MongoDB auto-converts
- Response converts ObjectId to string

## Populate Example (Future Use)

```javascript
// Get patient with full hospital details
const patient = await Patient.findOne({ patientID: 'P001' })
  .populate('hospitalId')
  .lean()

console.log(patient.hospitalId)
// Output:
// {
//   _id: ObjectId("..."),
//   hospitalId: "HOSP001",
//   name: "General Hospital",
//   address: { ... },
//   contactInfo: { ... }
// }
```

## Query Patterns

### String to ObjectId (Automatic)
```javascript
// JWT has string
const hospitalId = "507f1f77bcf86cd799439011"

// MongoDB automatically converts to ObjectId for query
const patients = await Patient.find({ hospitalId })
// Works! MongoDB converts string to ObjectId
```

### ObjectId to String (Manual)
```javascript
// Database has ObjectId
const patient = await Patient.findOne({ patientID: 'P001' })

// Convert to string for response
const response = {
  patientID: patient.patientID,
  hospitalId: patient.hospitalId.toString()  // ✅ Convert to string
}
```

## Migration Script

If you have existing data with string hospitalIds:

```javascript
// Run this in MongoDB shell or Node script
const mongoose = require('mongoose');
const Hospital = require('./models/Hospital');
const Patient = require('./models/Patient');
const Study = require('./models/Study');
const User = require('./models/User');

async function migrateToObjectId() {
  // Get all hospitals
  const hospitals = await Hospital.find({});
  
  for (const hospital of hospitals) {
    const hospitalIdString = hospital.hospitalId; // e.g., "HOSP001"
    const hospitalObjectId = hospital._id;
    
    // Update patients
    await Patient.updateMany(
      { hospitalId: hospitalIdString },
      { $set: { hospitalId: hospitalObjectId } }
    );
    
    // Update studies
    await Study.updateMany(
      { hospitalId: hospitalIdString },
      { $set: { hospitalId: hospitalObjectId } }
    );
    
    // Update users
    await User.updateMany(
      { hospitalId: hospitalIdString },
      { $set: { hospitalId: hospitalObjectId } }
    );
    
    console.log(`✅ Migrated ${hospitalIdString} to ObjectId`);
  }
}
```

## Testing

### 1. Create Patient
```javascript
// Login as hospital admin
POST /auth/login
{
  "username": "hospital",
  "password": "123456"
}

// Response includes hospitalId as string
{
  "success": true,
  "user": {
    "hospitalId": "507f1f77bcf86cd799439011"  // String in JWT
  }
}

// Create patient
POST /api/patients
{
  "patientID": "P001",
  "patientName": "John Doe"
}

// Patient saved with ObjectId in database
// Response has string
{
  "success": true,
  "data": {
    "patientID": "P001",
    "hospitalId": "507f1f77bcf86cd799439011"  // String in response
  }
}
```

### 2. Get Patients
```javascript
// Get patients (filtered by hospital)
GET /api/patients
Authorization: Bearer <token>

// Response
{
  "success": true,
  "data": [
    {
      "patientID": "P001",
      "patientName": "John Doe",
      "hospitalId": "507f1f77bcf86cd799439011"  // String
    }
  ]
}
```

### 3. Verify in Database
```javascript
// MongoDB shell
db.patients.findOne({ patientID: "P001" })

// Output
{
  "_id": ObjectId("..."),
  "patientID": "P001",
  "patientName": "John Doe",
  "hospitalId": ObjectId("507f1f77bcf86cd799439011")  // ObjectId in DB
}
```

## Benefits

### ✅ Data Integrity
- MongoDB enforces referential integrity
- Can't assign invalid hospital IDs

### ✅ Better Queries
- Can use `.populate()` to get full hospital details
- More efficient joins

### ✅ Consistent Data Model
- Follows MongoDB best practices
- Easier to maintain

### ✅ Future-Proof
- Easy to add more relationships
- Scalable architecture

## Console Logs

### Patient Creation
```
👤 Creating patient P001 for hospital: 507f1f77bcf86cd799439011 by user: hospital
   ✅ Created new patient with hospitalId: 507f1f77bcf86cd799439011
```

### Get Patients
```
🔒 Filtering patients by hospitalId: 507f1f77bcf86cd799439011 for user: hospital
   📋 Found 5 patients
```

### Super Admin
```
👑 Super admin superadmin - showing all patients
   📋 Found 25 patients
```

## Summary

✅ **Models updated** - Patient, Study, User use ObjectId reference  
✅ **Seed scripts updated** - Use `hospital._id` instead of `hospital.hospitalId`  
✅ **JWT handling** - Convert ObjectId to string for tokens  
✅ **API responses** - Convert ObjectId to string for JSON  
✅ **Queries work** - MongoDB auto-converts string to ObjectId  
✅ **Logging added** - Track all operations  

System ab proper MongoDB references use kar raha hai! 🎯
