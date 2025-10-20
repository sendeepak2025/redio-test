# 🏥 AWS Deployment Architecture
## Multi-Site PACS Integration & Multi-Tenant Access

---

## 🌐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS Cloud (Central)                      │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Application Layer                      │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐               │  │
│  │  │   ALB    │→ │  EC2/ECS │→ │ MongoDB  │               │  │
│  │  │(Load Bal)│  │  (API)   │  │ Atlas    │               │  │
│  │  └──────────┘  └──────────┘  └──────────┘               │  │
│  │                      ↓                                     │  │
│  │  ┌──────────────────────────────────────────────────┐    │  │
│  │  │         S3 (DICOM Storage)                       │    │  │
│  │  │  - Bucket per hospital/site                      │    │  │
│  │  │  - Lifecycle policies                            │    │  │
│  │  └──────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              VPN Gateway / Direct Connect                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  Hospital A   │   │  Hospital B   │   │  Hospital C   │
│               │   │               │   │               │
│ ┌───────────┐ │   │ ┌───────────┐ │   │ ┌───────────┐ │
│ │   PACS    │ │   │ │   PACS    │ │   │ │   PACS    │ │
│ │ (Orthanc) │ │   │ │ (Orthanc) │ │   │ │ (Orthanc) │ │
│ └─────┬─────┘ │   │ └─────┬─────┘ │   │ └─────┬─────┘ │
│       │       │   │       │       │   │       │       │
│ ┌─────▼─────┐ │   │ ┌─────▼─────┐ │   │ ┌─────▼─────┐ │
│ │ CT/MRI/XR │ │   │ │ CT/MRI/XR │ │   │ │ CT/MRI/XR │ │
│ │ Machines  │ │   │ │ Machines  │ │   │ │ Machines  │ │
│ └───────────┘ │   │ └───────────┘ │   │ └───────────┘ │
│               │   │               │   │               │
│ ┌───────────┐ │   │ ┌───────────┐ │   │ ┌───────────┐ │
│ │  Bridge   │ │   │ │  Bridge   │ │   │ │  Bridge   │ │
│ │  Agent    │ │   │ │  Agent    │ │   │ │  Agent    │ │
│ └───────────┘ │   │ └───────────┘ │   │ └───────────┘ │
└───────────────┘   └───────────────┘   └───────────────┘
```

---

## 🔌 Solution 1: VPN-Based PACS Integration (Recommended)

### Architecture

Each hospital site connects to AWS via VPN, allowing secure bidirectional communication.

### Setup Steps

#### 1. AWS Side Configuration

```bash
# Create VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16

# Create VPN Gateway
aws ec2 create-vpn-gateway --type ipsec.1

# Create Customer Gateway (for each hospital)
aws ec2 create-customer-gateway \
  --type ipsec.1 \
  --public-ip <hospital-public-ip> \
  --bgp-asn 65000

# Create VPN Connection
aws ec2 create-vpn-connection \
  --type ipsec.1 \
  --customer-gateway-id <cgw-id> \
  --vpn-gateway-id <vgw-id>
```

#### 2. Hospital Side Configuration

Install VPN client on hospital network:

```bash
# Install strongSwan (Linux) or similar
sudo apt-get install strongswan

# Configure IPSec
# /etc/ipsec.conf
conn aws-vpn
    type=tunnel
    authby=secret
    left=%defaultroute
    leftid=<hospital-public-ip>
    right=<aws-vpn-endpoint>
    rightsubnet=10.0.0.0/16
    ike=aes256-sha2_256-modp2048!
    esp=aes256-sha2_256!
    keyingtries=%forever
    auto=start
```

#### 3. Configure PACS to Send to AWS

Update Orthanc configuration at each hospital:

```json
{
  "DicomModalities": {
    "AWS-Central": {
      "AET": "AWS_CENTRAL",
      "Host": "10.0.1.100",  // AWS private IP
      "Port": 4242,
      "Manufacturer": "Generic"
    }
  },
  "DicomWeb": {
    "Servers": {
      "aws-api": {
        "Url": "https://api.yourdomain.com/dicom-web",
        "Username": "hospital-a",
        "Password": "secure-token"
      }
    }
  }
}
```

---

## 🌉 Solution 2: Bridge Agent (Easier Setup)

Deploy a lightweight bridge agent at each hospital that syncs data to AWS.

### Bridge Agent Implementation

Create `bridge-agent.js`:

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

class PACSBridgeAgent {
  constructor(config) {
    this.config = {
      hospitalId: config.hospitalId,
      hospitalName: config.hospitalName,
      awsApiUrl: config.awsApiUrl,
      apiKey: config.apiKey,
      orthancUrl: config.orthancUrl || 'http://69.62.70.102:8042',
      orthancUsername: config.orthancUsername || 'orthanc',
      orthancPassword: config.orthancPassword || 'orthanc',
      syncInterval: config.syncInterval || 60000, // 1 minute
      watchFolder: config.watchFolder || null
    };
    
    this.lastSyncTime = new Date();
  }

  /**
   * Start the bridge agent
   */
  async start() {
    console.log(`🌉 Starting PACS Bridge Agent for ${this.config.hospitalName}`);
    
    // Register with AWS
    await this.registerHospital();
    
    // Start periodic sync
    this.startPeriodicSync();
    
    // Watch for new studies (if folder watching enabled)
    if (this.config.watchFolder) {
      this.startFolderWatch();
    }
    
    // Listen for Orthanc webhooks
    this.startWebhookListener();
  }

  /**
   * Register hospital with AWS central system
   */
  async registerHospital() {
    try {
      const response = await axios.post(
        `${this.config.awsApiUrl}/api/hospitals/register`,
        {
          hospitalId: this.config.hospitalId,
          hospitalName: this.config.hospitalName,
          capabilities: ['DICOM', 'DICOMWeb'],
          status: 'online'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Registered with AWS:', response.data);
    } catch (error) {
      console.error('❌ Failed to register:', error.message);
    }
  }

  /**
   * Periodic sync of new studies
   */
  startPeriodicSync() {
    setInterval(async () => {
      await this.syncNewStudies();
    }, this.config.syncInterval);
    
    // Initial sync
    this.syncNewStudies();
  }

  /**
   * Sync new studies from Orthanc to AWS
   */
  async syncNewStudies() {
    try {
      console.log('🔄 Syncing new studies...');
      
      // Get studies from Orthanc since last sync
      const studies = await this.getOrthancStudies();
      
      for (const study of studies) {
        await this.uploadStudyToAWS(study);
      }
      
      this.lastSyncTime = new Date();
      console.log(`✅ Synced ${studies.length} studies`);
    } catch (error) {
      console.error('❌ Sync failed:', error.message);
    }
  }

  /**
   * Get studies from Orthanc
   */
  async getOrthancStudies() {
    const response = await axios.get(
      `${this.config.orthancUrl}/studies`,
      {
        auth: {
          username: this.config.orthancUsername,
          password: this.config.orthancPassword
        }
      }
    );
    
    return response.data;
  }

  /**
   * Upload study to AWS
   */
  async uploadStudyToAWS(studyId) {
    try {
      // Get study metadata
      const metadata = await axios.get(
        `${this.config.orthancUrl}/studies/${studyId}`,
        {
          auth: {
            username: this.config.orthancUsername,
            password: this.config.orthancPassword
          }
        }
      );
      
      // Download study as ZIP
      const studyZip = await axios.get(
        `${this.config.orthancUrl}/studies/${studyId}/archive`,
        {
          auth: {
            username: this.config.orthancUsername,
            password: this.config.orthancPassword
          },
          responseType: 'arraybuffer'
        }
      );
      
      // Upload to AWS
      const formData = new FormData();
      formData.append('file', Buffer.from(studyZip.data), {
        filename: `${studyId}.zip`,
        contentType: 'application/zip'
      });
      formData.append('hospitalId', this.config.hospitalId);
      formData.append('metadata', JSON.stringify(metadata.data));
      
      await axios.post(
        `${this.config.awsApiUrl}/api/pacs/upload`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            ...formData.getHeaders()
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );
      
      console.log(`✅ Uploaded study ${studyId}`);
    } catch (error) {
      console.error(`❌ Failed to upload study ${studyId}:`, error.message);
    }
  }

  /**
   * Watch folder for new DICOM files
   */
  startFolderWatch() {
    console.log(`👁️  Watching folder: ${this.config.watchFolder}`);
    
    const watcher = chokidar.watch(this.config.watchFolder, {
      ignored: /(^|[\/\\])\../,
      persistent: true,
      ignoreInitial: true
    });
    
    watcher.on('add', async (filePath) => {
      if (filePath.endsWith('.dcm')) {
        console.log(`📁 New DICOM file: ${filePath}`);
        await this.uploadDicomFile(filePath);
      }
    });
  }

  /**
   * Upload DICOM file to AWS
   */
  async uploadDicomFile(filePath) {
    try {
      const formData = new FormData();
      formData.append('dicom', fs.createReadStream(filePath));
      formData.append('hospitalId', this.config.hospitalId);
      
      await axios.post(
        `${this.config.awsApiUrl}/api/pacs/upload`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            ...formData.getHeaders()
          }
        }
      );
      
      console.log(`✅ Uploaded ${path.basename(filePath)}`);
    } catch (error) {
      console.error(`❌ Failed to upload ${filePath}:`, error.message);
    }
  }

  /**
   * Start webhook listener for Orthanc events
   */
  startWebhookListener() {
    const express = require('express');
    const app = express();
    
    app.use(express.json());
    
    app.post('/orthanc-webhook', async (req, res) => {
      const { Type, ID } = req.body;
      
      if (Type === 'StableStudy') {
        console.log(`📨 New stable study: ${ID}`);
        await this.uploadStudyToAWS(ID);
      }
      
      res.sendStatus(200);
    });
    
    app.listen(3001, () => {
      console.log('🎧 Webhook listener started on port 3001');
    });
  }
}

// Configuration
const config = {
  hospitalId: process.env.HOSPITAL_ID || 'hospital-a',
  hospitalName: process.env.HOSPITAL_NAME || 'Hospital A',
  awsApiUrl: process.env.AWS_API_URL || 'https://api.yourdomain.com',
  apiKey: process.env.API_KEY || 'your-api-key',
  orthancUrl: process.env.ORTHANC_URL || 'http://69.62.70.102:8042',
  orthancUsername: process.env.ORTHANC_USERNAME || 'orthanc',
  orthancPassword: process.env.ORTHANC_PASSWORD || 'orthanc',
  syncInterval: 60000, // 1 minute
  watchFolder: process.env.WATCH_FOLDER || null
};

// Start agent
const agent = new PACSBridgeAgent(config);
agent.start();

module.exports = PACSBridgeAgent;
```

### Deploy Bridge Agent at Each Hospital

```bash
# Install on hospital server
npm install axios form-data chokidar express

# Create .env file
cat > .env << EOF
HOSPITAL_ID=hospital-a
HOSPITAL_NAME=Hospital A Main Campus
AWS_API_URL=https://api.yourdomain.com
API_KEY=secure-api-key-here
ORTHANC_URL=http://69.62.70.102:8042
ORTHANC_USERNAME=orthanc
ORTHANC_PASSWORD=orthanc
WATCH_FOLDER=/path/to/dicom/folder
EOF

# Run with PM2
pm2 start bridge-agent.js --name pacs-bridge
pm2 save
pm2 startup
```

---

## 🏢 Multi-Tenant Access Control

### Database Schema for Multi-Tenancy

```javascript
// Hospital/Organization Model
const HospitalSchema = new mongoose.Schema({
  hospitalId: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  address: String,
  contactEmail: String,
  contactPhone: String,
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  subscription: {
    plan: { type: String, enum: ['basic', 'professional', 'enterprise'] },
    startDate: Date,
    endDate: Date,
    maxUsers: Number,
    maxStorage: Number // in GB
  },
  settings: {
    allowedIPs: [String],
    requireMFA: Boolean,
    dataRetentionDays: Number
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// User Model (Extended)
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  hospitalId: { type: String, required: true }, // Links to hospital
  roles: [String],
  permissions: [String],
  accessibleHospitals: [String], // For users with multi-hospital access
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now }
});

// Study Model (Extended)
const StudySchema = new mongoose.Schema({
  studyInstanceUID: { type: String, unique: true, required: true },
  hospitalId: { type: String, required: true }, // Owner hospital
  patientID: String,
  patientName: String,
  studyDate: String,
  modality: String,
  studyDescription: String,
  numberOfSeries: Number,
  numberOfInstances: Number,
  storageLocation: String, // S3 bucket/path
  accessControl: {
    sharedWith: [String], // Other hospital IDs
    isPublic: Boolean,
    accessLevel: { type: String, enum: ['read', 'write', 'admin'] }
  },
  createdAt: { type: Date, default: Date.now }
});
```

### Multi-Tenant Middleware

```javascript
// server/src/middleware/tenantMiddleware.js
const Hospital = require('../models/Hospital');
const User = require('../models/User');

/**
 * Tenant isolation middleware
 * Ensures users can only access data from their hospital
 */
async function tenantMiddleware(req, res, next) {
  try {
    // Get user's hospital
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    
    // Check hospital status
    const hospital = await Hospital.findOne({ hospitalId: user.hospitalId });
    
    if (!hospital || hospital.status !== 'active') {
      return res.status(403).json({ 
        success: false, 
        message: 'Hospital account is not active' 
      });
    }
    
    // Attach tenant info to request
    req.tenant = {
      hospitalId: user.hospitalId,
      hospitalName: hospital.name,
      accessibleHospitals: user.accessibleHospitals || [user.hospitalId],
      subscription: hospital.subscription
    };
    
    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    res.status(500).json({ success: false, message: 'Tenant validation failed' });
  }
}

/**
 * Filter query by tenant
 */
function filterByTenant(query, req) {
  // If user has access to multiple hospitals
  if (req.tenant.accessibleHospitals.length > 1) {
    query.hospitalId = { $in: req.tenant.accessibleHospitals };
  } else {
    query.hospitalId = req.tenant.hospitalId;
  }
  
  return query;
}

module.exports = { tenantMiddleware, filterByTenant };
```

### Apply Tenant Middleware to Routes

```javascript
// server/src/routes/index.js
const { tenantMiddleware } = require('../middleware/tenantMiddleware');

// Apply to all protected routes
router.use('/api/dicom', authMiddleware, tenantMiddleware);
router.use('/api/patients', authMiddleware, tenantMiddleware);
router.use('/api/reports', authMiddleware, tenantMiddleware);
```

### Tenant-Aware Study Controller

```javascript
// server/src/controllers/studyController.js
const { filterByTenant } = require('../middleware/tenantMiddleware');

async function getStudies(req, res) {
  try {
    let query = {};
    
    // Apply tenant filter
    query = filterByTenant(query, req);
    
    // Add other filters
    if (req.query.modality) {
      query.modality = req.query.modality;
    }
    
    if (req.query.patientID) {
      query.patientID = req.query.patientID;
    }
    
    const studies = await Study.find(query)
      .sort({ studyDate: -1 })
      .limit(100);
    
    res.json({ success: true, data: studies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
```

---

## 🔐 Hospital Registration API

```javascript
// server/src/routes/hospitals.js
const express = require('express');
const router = express.Router();
const Hospital = require('../models/Hospital');
const crypto = require('crypto');

/**
 * Register new hospital
 */
router.post('/register', async (req, res) => {
  try {
    const { name, contactEmail, contactPhone, address, plan } = req.body;
    
    // Generate unique hospital ID
    const hospitalId = `hosp_${crypto.randomBytes(8).toString('hex')}`;
    
    // Generate API key for bridge agent
    const apiKey = crypto.randomBytes(32).toString('hex');
    
    const hospital = new Hospital({
      hospitalId,
      name,
      contactEmail,
      contactPhone,
      address,
      status: 'active',
      subscription: {
        plan: plan || 'basic',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        maxUsers: plan === 'enterprise' ? 100 : plan === 'professional' ? 50 : 10,
        maxStorage: plan === 'enterprise' ? 10000 : plan === 'professional' ? 1000 : 100 // GB
      },
      apiKey // Store securely
    });
    
    await hospital.save();
    
    res.json({
      success: true,
      data: {
        hospitalId,
        apiKey, // Send once, store securely
        message: 'Hospital registered successfully'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get hospital info
 */
router.get('/:hospitalId', async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ 
      hospitalId: req.params.hospitalId 
    }).select('-apiKey');
    
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }
    
    res.json({ success: true, data: hospital });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
```

---

## 📊 AWS Infrastructure Setup

### 1. EC2/ECS for Application

```bash
# Launch EC2 instance
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.medium \
  --key-name your-key \
  --security-group-ids sg-xxxxx \
  --subnet-id subnet-xxxxx \
  --user-data file://install-script.sh
```

### 2. S3 for DICOM Storage

```bash
# Create S3 bucket per hospital
aws s3 mb s3://medical-imaging-hospital-a
aws s3 mb s3://medical-imaging-hospital-b

# Set lifecycle policy
aws s3api put-bucket-lifecycle-configuration \
  --bucket medical-imaging-hospital-a \
  --lifecycle-configuration file://lifecycle.json
```

### 3. MongoDB Atlas

```bash
# Create cluster via Atlas UI or API
# Configure IP whitelist
# Create database user per hospital
```

### 4. CloudFront for CDN

```bash
# Create distribution
aws cloudfront create-distribution \
  --origin-domain-name your-alb.amazonaws.com \
  --default-root-object index.html
```

---

## 🔄 Data Flow

### Study Upload Flow

```
Hospital PACS → Bridge Agent → AWS API → S3 Storage
                                      ↓
                                  MongoDB (metadata)
                                      ↓
                                  Notification
```

### Study Retrieval Flow

```
User Request → AWS API → Check Tenant → Query MongoDB
                              ↓
                         Get S3 URL → Return to User
```

---

## 📝 Configuration Files

### Bridge Agent Config (Per Hospital)

```json
{
  "hospitalId": "hospital-a",
  "hospitalName": "Hospital A Main Campus",
  "awsApiUrl": "https://api.yourdomain.com",
  "apiKey": "secure-api-key",
  "orthancUrl": "http://69.62.70.102:8042",
  "syncInterval": 60000,
  "features": {
    "autoSync": true,
    "folderWatch": true,
    "webhooks": true
  }
}
```

### AWS API Config

```bash
# .env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/medical-imaging
AWS_S3_BUCKET_PREFIX=medical-imaging
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
ENABLE_MULTI_TENANT=true
```

---

## 🎯 Summary

### For PACS Connectivity:
1. **VPN** - Secure site-to-site connection (best for large hospitals)
2. **Bridge Agent** - Lightweight sync agent (easier setup)
3. **DICOMweb** - Standard protocol over HTTPS

### For Multi-Tenant Access:
1. **Hospital-based isolation** - Each hospital sees only their data
2. **Role-based access** - Users have specific permissions
3. **Cross-hospital sharing** - Optional data sharing between sites
4. **API key authentication** - Secure bridge agent communication

### Next Steps:
1. Deploy AWS infrastructure
2. Install bridge agents at each hospital
3. Configure tenant isolation
4. Test data flow
5. Train users

Would you like me to create the implementation files for any specific component?
