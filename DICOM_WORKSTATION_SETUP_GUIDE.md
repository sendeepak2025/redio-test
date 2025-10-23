# DICOM Workstation Setup Guide
## How to Send DICOM Files from Local Workstations to Your System

---

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Current Configuration](#current-configuration)
3. [Connection Methods](#connection-methods)
4. [Workstation Configuration](#workstation-configuration)
5. [Testing & Verification](#testing--verification)
6. [Troubleshooting](#troubleshooting)

---

## 🏥 System Overview

Your system receives DICOM files through **Orthanc PACS Server**, which acts as a DICOM receiver and storage system.

```
┌─────────────────────┐
│  X-Ray Machine /    │
│  CT Scanner /       │──┐
│  MRI Machine /      │  │
│  Ultrasound /       │  │
│  PACS Workstation   │  │
└─────────────────────┘  │
                         │ DICOM C-STORE
                         │ (Port 4242)
                         ▼
┌─────────────────────────────────────────┐
│         YOUR SYSTEM (Orthanc)           │
│  ┌───────────────────────────────────┐  │
│  │  Orthanc PACS Server              │  │
│  │  - DICOM AE Title: ORTHANC_DEV_AE │  │
│  │  - DICOM Port: 4242               │  │
│  │  - HTTP Port: 8042                │  │
│  └───────────────────────────────────┘  │
│              │                           │
│              │ Auto-Webhook              │
│              ▼                           │
│  ┌───────────────────────────────────┐  │
│  │  Node.js Backend (Port 8001)      │  │
│  │  - Processes DICOM metadata       │  │
│  │  - Stores in MongoDB              │  │
│  │  - Triggers AI analysis           │  │
│  └───────────────────────────────────┘  │
│              │                           │
│              ▼                           │
│  ┌───────────────────────────────────┐  │
│  │  React Viewer (Port 5173)         │  │
│  │  - View images                    │  │
│  │  - AI-powered analysis            │  │
│  │  - Generate reports               │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## ⚙️ Current Configuration

### Orthanc DICOM Server Settings

| Setting | Value | Description |
|---------|-------|-------------|
| **AE Title** | `ORTHANC_DEV_AE` | Application Entity Title (DICOM identifier) |
| **DICOM Port** | `4242` | Port for receiving DICOM files |
| **HTTP Port** | `8042` | Web interface and REST API |
| **IP Address** | `localhost` or `YOUR_SERVER_IP` | Server address |
| **Username** | `orthanc` | HTTP authentication |
| **Password** | `orthanc_secure_2024` | HTTP authentication |

### Security Settings
- ✅ **DICOM Store Allowed**: Yes (DicomAlwaysAllowStore: true)
- ✅ **DICOM Echo Allowed**: Yes (for connection testing)
- ❌ **DICOM Find**: Disabled (security)
- ❌ **DICOM Move**: Disabled (security)
- ❌ **AE Title Checking**: Disabled (accepts from any source)

---

## 🔌 Connection Methods

### Method 1: Direct DICOM C-STORE (Recommended)
**Best for:** X-ray machines, CT scanners, MRI machines, modality workstations

#### Requirements:
- DICOM-compliant imaging device
- Network connectivity to your server
- DICOM C-STORE capability

#### Configuration on Sending Device:
```
Destination AE Title: ORTHANC_DEV_AE
Destination IP: YOUR_SERVER_IP (e.g., 192.168.1.100)
Destination Port: 4242
Protocol: DICOM C-STORE
```

---

### Method 2: DICOM Upload via Web Interface
**Best for:** Manual uploads, testing, small batches

#### Steps:
1. Open browser: `http://YOUR_SERVER_IP:8042`
2. Login with credentials:
   - Username: `orthanc`
   - Password: `orthanc_secure_2024`
3. Click "Upload" button
4. Select DICOM files (.dcm)
5. Files are automatically processed

---

### Method 3: REST API Upload
**Best for:** Custom applications, batch processing, automation

#### Using cURL:
```bash
curl -X POST http://YOUR_SERVER_IP:8042/instances \
  -u orthanc:orthanc_secure_2024 \
  -H "Content-Type: application/dicom" \
  --data-binary @/path/to/file.dcm
```

#### Using Python:
```python
import requests

url = "http://YOUR_SERVER_IP:8042/instances"
auth = ("orthanc", "orthanc_secure_2024")

with open("file.dcm", "rb") as f:
    response = requests.post(url, auth=auth, data=f.read())
    print(response.json())
```

---

### Method 4: DICOM Send Tools
**Best for:** Testing, one-time transfers, PACS integration

#### Using dcm4che (dcmsend):
```bash
dcmsend -c ORTHANC_DEV_AE@YOUR_SERVER_IP:4242 /path/to/dicom/files/*.dcm
```

#### Using DCMTK (storescu):
```bash
storescu -aec ORTHANC_DEV_AE YOUR_SERVER_IP 4242 /path/to/file.dcm
```

---

## 🖥️ Workstation Configuration

### A. GE Healthcare Modalities
```
Menu → Service → Network → DICOM
  Destination Name: Orthanc
  AE Title: ORTHANC_DEV_AE
  IP Address: YOUR_SERVER_IP
  Port: 4242
  Service: Storage
```

### B. Siemens Modalities
```
Configuration → Network → DICOM Destinations
  Name: Orthanc
  Called AE Title: ORTHANC_DEV_AE
  IP: YOUR_SERVER_IP
  Port: 4242
  Type: Storage SCP
```

### C. Philips Modalities
```
System → Network → Export Destinations
  Destination: Orthanc
  AE Title: ORTHANC_DEV_AE
  Host: YOUR_SERVER_IP
  Port: 4242
  Protocol: DICOM
```

### D. Generic PACS Workstation
```
PACS Configuration → Remote Nodes
  Node Name: Orthanc
  AE Title: ORTHANC_DEV_AE
  Hostname: YOUR_SERVER_IP
  Port: 4242
  Services: [x] Store
```

### E. Horos / OsiriX (Mac)
```
Preferences → Locations
  + Add Location
  Description: Orthanc Server
  AE Title: ORTHANC_DEV_AE
  Address: YOUR_SERVER_IP
  Port: 4242
  Transfer Syntax: Explicit VR Little Endian
```

### F. RadiAnt DICOM Viewer (Windows)
```
Tools → Options → DICOM Network
  + Add Server
  Name: Orthanc
  AE Title: ORTHANC_DEV_AE
  Host: YOUR_SERVER_IP
  Port: 4242
```

---

## 🧪 Testing & Verification

### Step 1: Test Network Connectivity
```bash
# Ping the server
ping YOUR_SERVER_IP

# Test if port 4242 is open
telnet YOUR_SERVER_IP 4242
# or
nc -zv YOUR_SERVER_IP 4242
```

### Step 2: Test DICOM Echo (C-ECHO)
```bash
# Using DCMTK
echoscu -aec ORTHANC_DEV_AE YOUR_SERVER_IP 4242

# Expected output: "Association Accepted"
```

### Step 3: Send Test DICOM File
```bash
# Using DCMTK storescu
storescu -v -aec ORTHANC_DEV_AE YOUR_SERVER_IP 4242 test.dcm

# Expected output: "I: Received Store Response"
```

### Step 4: Verify in Orthanc Web Interface
1. Open: `http://YOUR_SERVER_IP:8042`
2. Login with credentials
3. Check "All studies" - your test file should appear

### Step 5: Verify in Your Application
1. Open: `http://YOUR_SERVER_IP:5173`
2. Navigate to Patients page
3. Your study should appear automatically (via webhook)

---

## 🔧 Troubleshooting

### Problem: Cannot Connect to Port 4242

**Possible Causes:**
1. Firewall blocking the port
2. Orthanc not running
3. Wrong IP address

**Solutions:**

#### Windows Firewall:
```powershell
# Allow port 4242
netsh advfirewall firewall add rule name="Orthanc DICOM" dir=in action=allow protocol=TCP localport=4242
```

#### Check if Orthanc is Running:
```bash
# Windows
netstat -ano | findstr :4242

# Linux/Mac
netstat -an | grep 4242
```

#### Start Orthanc:
```bash
cd orthanc-config
Orthanc.exe orthanc.json
```

---

### Problem: Connection Refused or Timeout

**Check:**
1. Server IP address is correct
2. Port 4242 is not blocked by firewall
3. Orthanc service is running
4. Network connectivity exists

**Test:**
```bash
# Test HTTP port first (easier to debug)
curl http://YOUR_SERVER_IP:8042/system

# If this works, DICOM port should work too
```

---

### Problem: Files Sent but Not Appearing in Viewer

**Check:**
1. Orthanc received the file (check web interface at :8042)
2. Webhook is working (check Node.js logs)
3. MongoDB connection is active

**Debug:**
```bash
# Check Orthanc logs
# Look for "OnStoredInstance" messages

# Check Node.js logs
# Look for webhook processing messages

# Manually trigger sync
curl -X POST http://localhost:8001/api/orthanc/sync
```

---

### Problem: "Unknown AE Title" Error

**Solution:**
Your Orthanc is configured to accept from any AE Title (`DicomCheckCallingAet: false`), so this shouldn't happen. If it does:

1. Check sending device AE Title configuration
2. Verify Orthanc configuration
3. Restart Orthanc service

---

### Problem: "Association Rejected"

**Possible Causes:**
1. Wrong AE Title (should be `ORTHANC_DEV_AE`)
2. Wrong port (should be `4242`)
3. Orthanc not accepting connections

**Solution:**
```json
// In orthanc.json, verify:
"DicomAlwaysAllowStore": true,
"DicomCheckCalledAet": false,
"DicomCheckCallingAet": false
```

---

## 📊 Automatic Processing Flow

When a DICOM file is received:

1. **Orthanc receives** the file via DICOM C-STORE (port 4242)
2. **Stores** the file in `OrthancStorage` directory
3. **Triggers** Lua script `OnStoredInstance`
4. **Sends webhook** to Node.js backend (port 8001)
5. **Backend processes**:
   - Extracts metadata
   - Stores in MongoDB
   - Creates patient/study/series records
   - Triggers AI analysis (if enabled)
6. **Frontend updates** automatically via API
7. **User can view** in React viewer (port 5173)

---

## 🌐 Network Configuration

### For Local Network (LAN):
```
Server IP: 192.168.1.XXX (your local IP)
Accessible from: Same network only
Firewall: Allow port 4242 on local network
```

### For Remote Access (WAN):
```
Server IP: YOUR_PUBLIC_IP or DOMAIN
Port Forwarding: 4242 → YOUR_SERVER_IP:4242
Firewall: Allow port 4242 from specific IPs only
Security: Consider VPN or DICOM TLS
```

### For Cloud Deployment:
```
Server IP: Cloud instance public IP
Security Group: Allow port 4242 from trusted IPs
Consider: DICOM TLS encryption
Consider: VPN tunnel for sensitive data
```

---

## 🔒 Security Recommendations

### For Production:

1. **Enable DICOM TLS:**
```json
"DicomTlsEnabled": true,
"DicomTlsCertificate": "/path/to/cert.pem",
"DicomTlsPrivateKey": "/path/to/key.pem"
```

2. **Enable AE Title Checking:**
```json
"DicomCheckCalledAet": true,
"DicomCheckCallingAet": true
```

3. **Restrict IP Access:**
   - Use firewall rules
   - Only allow known modality IPs

4. **Use VPN:**
   - For remote modalities
   - Encrypt all DICOM traffic

5. **Change Default Password:**
```json
"RegisteredUsers": {
  "orthanc": "YOUR_STRONG_PASSWORD_HERE"
}
```

---

## 📝 Quick Reference Card

### Connection Details:
```
═══════════════════════════════════════
  ORTHANC DICOM SERVER CONNECTION
═══════════════════════════════════════
AE Title:    ORTHANC_DEV_AE
IP Address:  YOUR_SERVER_IP
DICOM Port:  4242
HTTP Port:   8042
Username:    orthanc
Password:    orthanc_secure_2024
═══════════════════════════════════════
```

### Test Commands:
```bash
# Test Echo
echoscu -aec ORTHANC_DEV_AE YOUR_SERVER_IP 4242

# Send File
storescu -aec ORTHANC_DEV_AE YOUR_SERVER_IP 4242 file.dcm

# Check Web Interface
http://YOUR_SERVER_IP:8042
```

---

## 📞 Support & Resources

### Orthanc Documentation:
- https://book.orthanc-server.com/
- https://orthanc.uclouvain.be/

### DICOM Tools:
- **DCMTK**: https://dicom.offis.de/dcmtk
- **dcm4che**: https://www.dcm4che.org/
- **Horos**: https://horosproject.org/
- **RadiAnt**: https://www.radiantviewer.com/

### Testing:
- Sample DICOM files: https://www.rubomedical.com/dicom_files/
- DICOM test images: https://barre.dev/medical/samples/

---

**Last Updated:** October 22, 2025
**System Version:** 1.0
**Orthanc Version:** Latest
