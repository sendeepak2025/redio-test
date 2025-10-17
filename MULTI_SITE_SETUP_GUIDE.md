# 🏥 Multi-Site Setup Guide
## Connect Multiple Hospitals to AWS Central System

---

## 📋 Overview

This guide shows you how to:
1. Deploy your system on AWS
2. Connect multiple hospital PACS systems
3. Enable multi-tenant access control
4. Allow different offices to access their data

---

## 🚀 Quick Start

### Step 1: Deploy on AWS

```bash
# 1. Launch EC2 instance
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.large \
  --key-name your-key \
  --security-group-ids sg-xxxxx

# 2. SSH into instance
ssh -i your-key.pem ec2-user@your-instance-ip

# 3. Install application
git clone your-repo
cd medical-imaging-system
./deploy-aws.sh
```

### Step 2: Register Each Hospital

```bash
# On AWS server, register hospitals
curl -X POST https://your-domain.com/api/hospitals/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Hospital A Main Campus",
    "contactEmail": "admin@hospital-a.com",
    "contactPhone": "+1-555-0100",
    "plan": "professional"
  }'

# Response will include:
# - hospitalId: "hosp_abc123"
# - apiKey: "secure-key-for-bridge-agent"
```

### Step 3: Install Bridge Agent at Each Hospital

```bash
# On hospital server
cd /opt
git clone your-repo/bridge-agent
cd bridge-agent
npm install

# Configure
cp .env.example .env
nano .env

# Set values:
HOSPITAL_ID=hosp_abc123
HOSPITAL_NAME=Hospital A Main Campus
AWS_API_URL=https://your-domain.com
API_KEY=secure-key-from-registration

# Start
pm2 start index.js --name pacs-bridge
pm2 save
pm2 startup
```

---

## 🔌 Connection Methods

### Option 1: VPN Connection (Recommended for Large Hospitals)

**Pros:**
- Most secure
- Bidirectional communication
- Low latency
- Can access hospital PACS directly

**Setup:**
1. Create AWS VPN Gateway
2. Configure hospital firewall
3. Establish VPN tunnel
4. Configure PACS to send to AWS

**Cost:** ~$36/month per VPN connection

### Option 2: Bridge Agent (Recommended for Easy Setup)

**Pros:**
- Easy to install
- No network changes needed
- Works behind firewall
- Automatic retry

**Setup:**
1. Install Node.js on hospital server
2. Install bridge agent
3. Configure with API key
4. Start agent

**Cost:** Free (just server resources)

### Option 3: Direct HTTPS Upload

**Pros:**
- Simplest
- No additional software
- Works from anywhere

**Setup:**
1. Configure PACS DICOMweb
2. Point to AWS API
3. Use API key for auth

**Cost:** Free

---

## 🏢 Multi-Tenant Access Control

### How It Works

```
User Login → Check Hospital → Filter Data → Show Only Their Data
```

### Example Scenarios

#### Scenario 1: Single Hospital User
```javascript
// Dr. Smith works at Hospital A
User: dr.smith@hospital-a.com
Hospital: Hospital A
Access: Can see only Hospital A studies
```

#### Scenario 2: Multi-Hospital Radiologist
```javascript
// Dr. Johnson covers Hospital A and B
User: dr.johnson@radiology.com
Hospitals: [Hospital A, Hospital B]
Access: Can see studies from both hospitals
```

#### Scenario 3: System Administrator
```javascript
// Admin manages all hospitals
User: admin@system.com
Role: system:admin
Access: Can see all hospitals
```

### Configure User Access

```bash
# Create user for Hospital A
curl -X POST https://your-domain.com/api/users \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "dr.smith",
    "email": "dr.smith@hospital-a.com",
    "password": "secure123",
    "firstName": "John",
    "lastName": "Smith",
    "hospitalId": "hosp_abc123",
    "roles": ["radiologist", "provider"]
  }'

# Grant access to multiple hospitals
curl -X PUT https://your-domain.com/api/users/user-id \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{
    "accessibleHospitals": ["hosp_abc123", "hosp_def456"]
  }'
```

---

## 📊 Data Flow

### Study Upload Flow

```
Hospital PACS
    ↓
Bridge Agent (at hospital)
    ↓ HTTPS
AWS API (validates hospital)
    ↓
S3 Storage (hospital-specific bucket)
    ↓
MongoDB (metadata with hospitalId)
    ↓
Email Notification
```

### Study Access Flow

```
User Login
    ↓
Check Hospital Membership
    ↓
Query Studies (filtered by hospitalId)
    ↓
Generate S3 Signed URL
    ↓
Return to User
```

---

## 🔐 Security Features

### 1. Hospital Isolation
- Each hospital's data is isolated
- Users can only see their hospital's data
- Database queries automatically filtered

### 2. API Key Authentication
- Each hospital has unique API key
- Bridge agents use API key
- Keys can be rotated

### 3. Role-Based Access
- Radiologist: Read studies, create reports
- Technician: Upload studies
- Admin: Manage users, settings
- System Admin: Access all hospitals

### 4. Audit Logging
- All access logged
- Who accessed what study
- When and from where
- Compliance ready

---

## 📁 File Structure

```
medical-imaging-system/
├── server/                    # AWS central system
│   ├── src/
│   │   ├── middleware/
│   │   │   └── tenantMiddleware.js  # Multi-tenant logic
│   │   ├── models/
│   │   │   ├── Hospital.js          # Hospital model
│   │   │   └── User.js              # User model (extended)
│   │   └── routes/
│   │       └── hospitals.js         # Hospital management
│   └── .env
│
├── bridge-agent/              # Install at each hospital
│   ├── src/
│   │   └── bridge-agent.js    # Sync logic
│   ├── index.js
│   ├── package.json
│   └── .env                   # Hospital-specific config
│
└── viewer/                    # Frontend (deployed on AWS)
    └── dist/
```

---

## 🧪 Testing Multi-Tenant Setup

### 1. Register Two Hospitals

```bash
# Register Hospital A
curl -X POST https://your-domain.com/api/hospitals/register \
  -d '{"name":"Hospital A","contactEmail":"admin-a@test.com","plan":"professional"}'

# Register Hospital B
curl -X POST https://your-domain.com/api/hospitals/register \
  -d '{"name":"Hospital B","contactEmail":"admin-b@test.com","plan":"professional"}'
```

### 2. Create Users for Each Hospital

```bash
# User for Hospital A
curl -X POST https://your-domain.com/api/users \
  -d '{"username":"user-a","hospitalId":"hosp_a","roles":["radiologist"]}'

# User for Hospital B
curl -X POST https://your-domain.com/api/users \
  -d '{"username":"user-b","hospitalId":"hosp_b","roles":["radiologist"]}'
```

### 3. Upload Studies

```bash
# Upload to Hospital A (using Hospital A's API key)
curl -X POST https://your-domain.com/api/pacs/upload \
  -H "Authorization: Bearer hospital-a-api-key" \
  -F "dicom=@study1.dcm" \
  -F "hospitalId=hosp_a"

# Upload to Hospital B
curl -X POST https://your-domain.com/api/pacs/upload \
  -H "Authorization: Bearer hospital-b-api-key" \
  -F "dicom=@study2.dcm" \
  -F "hospitalId=hosp_b"
```

### 4. Verify Isolation

```bash
# Login as Hospital A user
# Should see only Hospital A studies

# Login as Hospital B user
# Should see only Hospital B studies
```

---

## 💰 Cost Estimation (AWS)

### Small Setup (1-3 Hospitals)
- EC2 t3.medium: $30/month
- MongoDB Atlas M10: $57/month
- S3 Storage (100GB): $2.30/month
- Data Transfer: $9/month
- **Total: ~$100/month**

### Medium Setup (4-10 Hospitals)
- EC2 t3.large: $60/month
- MongoDB Atlas M20: $140/month
- S3 Storage (1TB): $23/month
- Data Transfer: $90/month
- **Total: ~$313/month**

### Large Setup (10+ Hospitals)
- EC2 t3.xlarge: $120/month
- MongoDB Atlas M30: $280/month
- S3 Storage (10TB): $230/month
- Data Transfer: $900/month
- CloudFront CDN: $50/month
- **Total: ~$1,580/month**

---

## 🔧 Maintenance

### Monitor Bridge Agents

```bash
# Check status
pm2 status

# View logs
pm2 logs pacs-bridge

# Restart if needed
pm2 restart pacs-bridge
```

### Monitor AWS System

```bash
# Check system health
curl https://your-domain.com/api/monitoring/system-health

# Check hospital status
curl https://your-domain.com/api/hospitals/hosp_abc123
```

### Update Bridge Agent

```bash
# On hospital server
cd /opt/bridge-agent
git pull
npm install
pm2 restart pacs-bridge
```

---

## 🆘 Troubleshooting

### Bridge Agent Can't Connect

**Check:**
1. AWS_API_URL is correct
2. API_KEY is valid
3. Firewall allows outbound HTTPS
4. Internet connection working

**Test:**
```bash
curl https://your-domain.com/health
```

### Studies Not Appearing

**Check:**
1. Bridge agent is running: `pm2 status`
2. Check logs: `pm2 logs pacs-bridge`
3. Verify hospitalId matches
4. Check S3 bucket permissions

### User Can't See Studies

**Check:**
1. User's hospitalId matches study's hospitalId
2. User account is active
3. Hospital subscription is active
4. Check audit logs

---

## 📞 Support Checklist

Before contacting support, gather:
- [ ] Hospital ID
- [ ] Bridge agent logs
- [ ] AWS API logs
- [ ] Error messages
- [ ] Network configuration
- [ ] Orthanc version

---

## ✅ Setup Checklist

### AWS Central System
- [ ] EC2 instance running
- [ ] MongoDB configured
- [ ] S3 buckets created
- [ ] Domain configured
- [ ] SSL certificate installed
- [ ] Email configured

### Each Hospital
- [ ] Hospital registered
- [ ] API key obtained
- [ ] Bridge agent installed
- [ ] Bridge agent configured
- [ ] Bridge agent running
- [ ] Test upload successful

### Users
- [ ] Admin users created
- [ ] Radiologist accounts created
- [ ] Roles assigned
- [ ] Multi-hospital access configured (if needed)
- [ ] Users trained

---

## 🎉 You're Ready!

Your multi-site medical imaging system is now configured with:

✅ **Central AWS System** - Scalable, secure cloud infrastructure
✅ **Multiple Hospital Sites** - Each with their own PACS
✅ **Automatic Data Sync** - Bridge agents handle uploads
✅ **Multi-Tenant Access** - Each hospital sees only their data
✅ **Cross-Site Access** - Radiologists can cover multiple sites
✅ **Audit Logging** - Complete compliance tracking

**Questions?** Check AWS_DEPLOYMENT_ARCHITECTURE.md for detailed technical information.
