# 🏥 AW 4.6 Workstation Connection Guide
## Step-by-Step Guide to Connect and Retrieve Studies

---

## 📋 Overview

This guide will help you connect your DICOM system to a **GE Advantage Workstation (AW) 4.6** to retrieve medical imaging studies.

**What You'll Achieve:**
- Connect to AW 4.6 workstation via DICOM protocol
- Query and retrieve studies from AW 4.6
- Display studies in your modern viewer
- Automatic synchronization of new studies

---

## 🎯 Prerequisites

Before starting, ensure you have:

- ✅ **AW 4.6 Workstation** running and accessible on network
- ✅ **Network connectivity** between your system and AW 4.6
- ✅ **AW 4.6 IP address** (e.g., 192.168.1.100)
- ✅ **AW 4.6 AE Title** (usually "AW_SERVER" or "AWSERVER")
- ✅ **AW 4.6 DICOM port** (usually 104 or 4006)
- ✅ **Your system running** (Orthanc + Backend + Viewer)

---

## 📊 Connection Architecture

```
┌─────────────────────────┐
│   GE AW Server 4.6      │
│   (SUSE Linux)          │
│                         │
│   IP: 192.168.1.100     │
│   AE Title: AW_SERVER   │
│   Port: 104             │
│   - PACS Storage        │
│   - Query/Retrieve      │
└───────────┬─────────────┘
            │
            │ DICOM Protocol
            │ (C-FIND / C-MOVE)
            │
┌───────────▼─────────────┐
│   Your System           │
│   (Orthanc PACS)        │
│                         │
│   IP: 192.168.1.200     │
│   AE Title: ORTHANC     │
│   Port: 4242            │
└─────────────────────────┘
```

---

## 🔍 Step 1: Gather AW 4.6 Information

### Find AW 4.6 Network Details

**Method A: From AW 4.6 Console**

1. Log into AW 4.6 workstation
2. Open **Service Menu** (usually Ctrl+Alt+S or from system menu)
3. Navigate to: **Service → Network → DICOM Configuration**
4. Note down:
   - **AE Title**: (e.g., "AW_SERVER", "AWSERVER", "AW46")
   - **IP Address**: (e.g., 192.168.1.100)
   - **DICOM Port**: (usually 104 or 4006)

**Method B: Ask Hospital IT Department**

Contact your hospital IT/PACS administrator for:
```
AW Server IP Address: _______________
AW Server AE Title: _______________
AW Server DICOM Port: _______________
```

**Method C: Check Network (if you have access)**

```bash
# From your system, scan for AW server
nmap -p 104,4006 192.168.1.0/24

# Or check specific IP
nmap -p 104,4006 192.168.1.100
```

---

## 🔧 Step 2: Configure Orthanc to Connect to AW 4.6

### Edit Orthanc Configuration

**On Windows:**
```powershell
cd orthanc-config
notepad orthanc.json
```

**On Linux:**
```bash
cd /opt/orthanc
sudo nano orthanc.json
```

### Add AW 4.6 as DICOM Modality

Find the `"DicomModalities"` section and add:

```json
{
  "DicomModalities": {
    "AW_SERVER": {
      "AET": "AW_SERVER",
      "Host": "192.168.1.100",
      "Port": 104,
      "Manufacturer": "Generic"
    }
  }
}
```

**Important:** Replace these values with your actual AW 4.6 details:
- `"AW_SERVER"` → Your AW AE Title
- `"192.168.1.100"` → Your AW IP address
- `104` → Your AW DICOM port

### Full Example Configuration

```json
{
  "Name": "My-Orthanc",
  "HttpPort": 8042,
  "DicomPort": 4242,
  "DicomAet": "ORTHANC",
  
  "DicomModalities": {
    "AW_SERVER": {
      "AET": "AW_SERVER",
      "Host": "192.168.1.100",
      "Port": 104,
      "Manufacturer": "Generic"
    }
  },
  
  "RemoteAccessAllowed": true,
  "AuthenticationEnabled": true,
  "RegisteredUsers": {
    "orthanc": "orthanc_secure_2024"
  }
}
```

### Restart Orthanc

**Windows:**
```powershell
# Stop Orthanc (Ctrl+C in the terminal where it's running)
# Then restart:
cd orthanc-config
Orthanc.exe orthanc.json
```

**Linux (Docker):**
```bash
cd /opt/orthanc
sudo docker compose restart
```

**Linux (Service):**
```bash
sudo systemctl restart orthanc
```

---

## 🧪 Step 3: Test Connection to AW 4.6

### Test 1: Network Connectivity

**Windows:**
```powershell
# Test if AW server is reachable
ping 192.168.1.100

# Test if DICOM port is open
Test-NetConnection -ComputerName 192.168.1.100 -Port 104
```

**Linux:**
```bash
# Test ping
ping -c 4 192.168.1.100

# Test port
telnet 192.168.1.100 104
# Or
nc -zv 192.168.1.100 104
```

**Expected Result:** Connection successful, port is open

---

### Test 2: DICOM Echo (C-ECHO)

This tests if AW 4.6 accepts DICOM connections.

**Using Orthanc Web Interface:**

1. Open browser: `http://69.62.70.102:8042`
2. Login: `orthanc` / `orthanc_secure_2024`
3. Click **"Query/Retrieve"** in top menu
4. Select **"AW_SERVER"** from dropdown
5. Click **"Echo"** button

**Expected Result:** "Echo succeeded" message

**Using Command Line (if DCMTK installed):**

```bash
# Windows
echoscu -aec AW_SERVER 192.168.1.100 104

# Linux
echoscu -aec AW_SERVER 192.168.1.100 104
```

**Expected Output:**
```
I: Requesting Association
I: Association Accepted (Max Send PDV: 16372)
I: Sending Echo Request (MsgID 1)
I: Received Echo Response (Success)
```

---

### Test 3: Query Studies (C-FIND)

Test if you can query studies from AW 4.6.

**Using Orthanc Web Interface:**

1. Open: `http://69.62.70.102:8042`
2. Go to **"Query/Retrieve"**
3. Select **"AW_SERVER"**
4. Enter search criteria:
   - **Patient Name**: `*` (asterisk for all)
   - **Study Date**: Leave empty or enter date range
5. Click **"Query"**

**Expected Result:** List of studies from AW 4.6

**Using REST API:**

```bash
# Query all studies from today
curl -X POST http://69.62.70.102:8042/modalities/AW_SERVER/query \
  -u orthanc:orthanc_secure_2024 \
  -H "Content-Type: application/json" \
  -d '{
    "Level": "Study",
    "Query": {
      "PatientName": "",
      "StudyDate": "'$(date +%Y%m%d)'"
    }
  }'
```

---

## 📥 Step 4: Configure AW 4.6 to Accept Your System

**Important:** AW 4.6 needs to know about your Orthanc server to send studies.

### On AW 4.6 Workstation:

1. **Access Service Menu**
   - Press `Ctrl+Alt+S` or access from system menu
   - May require service password (ask IT department)

2. **Navigate to DICOM Configuration**
   - Go to: **Service → Network → DICOM Configuration**
   - Or: **Configuration → DICOM → Remote Nodes**

3. **Add New DICOM Node**
   - Click **"Add"** or **"New Node"**
   - Enter details:
     ```
     Node Name: ORTHANC
     AE Title: ORTHANC
     Hostname: 192.168.1.200
     Port: 4242
     Description: Modern DICOM Viewer
     ```

4. **Enable Services**
   - Check: ☑ **Storage** (C-STORE)
   - Check: ☑ **Query/Retrieve** (C-FIND/C-MOVE)
   - Check: ☑ **Echo** (C-ECHO)

5. **Test Connection**
   - Click **"Test"** or **"Echo"** button
   - Should show: "Connection successful"

6. **Save Configuration**
   - Click **"Save"** or **"Apply"**
   - May require AW service restart

### Alternative: Edit Configuration File (Advanced)

If you have SSH access to AW 4.6:

```bash
# SSH into AW Server
ssh root@192.168.1.100

# Backup configuration
cp /usr/g/service/aw/config/dicom.cfg /usr/g/service/aw/config/dicom.cfg.backup

# Edit configuration
vi /usr/g/service/aw/config/dicom.cfg
```

Add:
```ini
[ORTHANC]
AETitle = ORTHANC
Hostname = 192.168.1.200
Port = 4242
Description = Modern DICOM Viewer
Enabled = Yes
```

Restart AW services:
```bash
/etc/init.d/aw stop
sleep 10
/etc/init.d/aw start
```

---

## 🔄 Step 5: Retrieve Studies from AW 4.6

### Method A: Manual Retrieve via Orthanc Web Interface

1. **Open Orthanc**: `http://69.62.70.102:8042`
2. **Login**: `orthanc` / `orthanc_secure_2024`
3. **Go to Query/Retrieve**
4. **Select AW_SERVER** from dropdown
5. **Search for studies**:
   - Patient Name: `*` (or specific name)
   - Study Date: `20241023` (or date range)
6. **Click "Query"**
7. **Select studies** you want to retrieve
8. **Click "Retrieve"** button

**Result:** Studies will be downloaded to your Orthanc server

---

### Method B: Retrieve via REST API

**Query and Retrieve All Studies from Today:**

```bash
# Step 1: Query studies
QUERY_ID=$(curl -s -X POST http://69.62.70.102:8042/modalities/AW_SERVER/query \
  -u orthanc:orthanc_secure_2024 \
  -H "Content-Type: application/json" \
  -d '{
    "Level": "Study",
    "Query": {
      "StudyDate": "'$(date +%Y%m%d)'"
    }
  }' | jq -r '.ID')

# Step 2: Get query results
curl -s http://69.62.70.102:8042/queries/$QUERY_ID/answers \
  -u orthanc:orthanc_secure_2024

# Step 3: Retrieve all results
curl -X POST http://69.62.70.102:8042/queries/$QUERY_ID/retrieve \
  -u orthanc:orthanc_secure_2024 \
  -d "ORTHANC"
```

**Retrieve Specific Patient:**

```bash
curl -X POST http://69.62.70.102:8042/modalities/AW_SERVER/query \
  -u orthanc:orthanc_secure_2024 \
  -H "Content-Type: application/json" \
  -d '{
    "Level": "Study",
    "Query": {
      "PatientName": "SMITH*",
      "StudyDate": ""
    }
  }'
```

---

### Method C: Automatic Sync Script

Create a script to automatically sync studies from AW 4.6.

**Create sync script:**

```bash
# Windows PowerShell
notepad sync-aw46.ps1
```

```powershell
# sync-aw46.ps1
$orthancUrl = "http://69.62.70.102:8042"
$username = "orthanc"
$password = "orthanc_secure_2024"
$base64Auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${username}:${password}"))

$headers = @{
    "Authorization" = "Basic $base64Auth"
    "Content-Type" = "application/json"
}

# Query studies from last 24 hours
$yesterday = (Get-Date).AddDays(-1).ToString("yyyyMMdd")
$today = (Get-Date).ToString("yyyyMMdd")

$queryBody = @{
    Level = "Study"
    Query = @{
        StudyDate = "$yesterday-$today"
    }
} | ConvertTo-Json

Write-Host "Querying AW Server for studies..."
$response = Invoke-RestMethod -Uri "$orthancUrl/modalities/AW_SERVER/query" `
    -Method Post -Headers $headers -Body $queryBody

$queryId = $response.ID
Write-Host "Query ID: $queryId"

# Retrieve all studies
Write-Host "Retrieving studies..."
Invoke-RestMethod -Uri "$orthancUrl/queries/$queryId/retrieve" `
    -Method Post -Headers $headers -Body "ORTHANC"

Write-Host "Sync complete!"
```

**Linux Bash:**

```bash
# Create script
nano sync-aw46.sh
```

```bash
#!/bin/bash
# sync-aw46.sh

ORTHANC_URL="http://69.62.70.102:8042"
USERNAME="orthanc"
PASSWORD="orthanc_secure_2024"

# Get yesterday and today dates
YESTERDAY=$(date -d '1 day ago' +%Y%m%d)
TODAY=$(date +%Y%m%d)

echo "🔄 Syncing studies from AW Server..."

# Query studies
QUERY_RESPONSE=$(curl -s -X POST "$ORTHANC_URL/modalities/AW_SERVER/query" \
  -u "$USERNAME:$PASSWORD" \
  -H "Content-Type: application/json" \
  -d "{
    \"Level\": \"Study\",
    \"Query\": {
      \"StudyDate\": \"$YESTERDAY-$TODAY\"
    }
  }")

QUERY_ID=$(echo $QUERY_RESPONSE | jq -r '.ID')
echo "📋 Query ID: $QUERY_ID"

# Get number of results
ANSWERS=$(curl -s "$ORTHANC_URL/queries/$QUERY_ID/answers" -u "$USERNAME:$PASSWORD")
COUNT=$(echo $ANSWERS | jq '. | length')
echo "📊 Found $COUNT studies"

if [ "$COUNT" -gt 0 ]; then
  # Retrieve all studies
  echo "📥 Retrieving studies..."
  curl -s -X POST "$ORTHANC_URL/queries/$QUERY_ID/retrieve" \
    -u "$USERNAME:$PASSWORD" \
    -d "ORTHANC"
  echo "✅ Sync complete!"
else
  echo "ℹ️  No new studies found"
fi
```

**Make executable and run:**

```bash
chmod +x sync-aw46.sh
./sync-aw46.sh
```

---

### Method D: Scheduled Auto-Sync

**Windows Task Scheduler:**

1. Open **Task Scheduler**
2. Create **New Task**
3. **Trigger**: Daily at specific time (e.g., every hour)
4. **Action**: Run PowerShell script
   ```
   Program: powershell.exe
   Arguments: -File "C:\path\to\sync-aw46.ps1"
   ```

**Linux Cron Job:**

```bash
# Edit crontab
crontab -e

# Add line to run every hour
0 * * * * /opt/dicom-viewer/scripts/sync-aw46.sh >> /var/log/aw-sync.log 2>&1

# Or every 30 minutes
*/30 * * * * /opt/dicom-viewer/scripts/sync-aw46.sh >> /var/log/aw-sync.log 2>&1
```

---

## 🔀 Step 6: Configure Auto-Forward from AW 4.6 (Optional)

Instead of pulling studies, configure AW 4.6 to automatically push studies to your system.

### Option A: Auto-Route Configuration

**On AW 4.6:**

1. **Access Service Menu** → **Auto-Routing**
2. **Create New Rule**:
   ```
   Rule Name: Forward to Orthanc
   Enabled: Yes
   Destination: ORTHANC
   Trigger: On Study Complete
   Modality: All (*)
   Priority: Medium
   ```
3. **Save and Enable**

### Option B: DICOM Store Forward

**Edit AW configuration:**

```bash
# On AW Server
vi /usr/g/service/aw/config/autoroute.cfg
```

Add:
```ini
[RULE_ORTHANC]
Enabled = Yes
Destination = ORTHANC
Modality = *
StudyDescription = *
PatientName = *
Priority = Medium
Delay = 0
```

**Restart AW services:**
```bash
/etc/init.d/aw restart
```

---

## 🖥️ Step 7: View Studies in Your Application

### Verify Studies in Orthanc

1. **Open Orthanc Web**: `http://69.62.70.102:8042`
2. **Check "All studies"** tab
3. **Verify studies appear**

### Sync to Your Application Database

**Manual sync:**

```bash
# Windows
curl -X POST http://localhost:8001/api/orthanc/sync

# Linux
curl -X POST http://localhost:8001/api/orthanc/sync
```

**Check backend logs:**

```bash
# Windows (in server terminal)
# Look for "Syncing studies from Orthanc..."

# Linux
pm2 logs dicom-viewer-backend
```

### Access Your Viewer

1. **Open browser**: `http://localhost:5173`
2. **Login** (if authentication enabled)
3. **Go to Patients page**
4. **Studies should appear automatically**
5. **Click on study to view images**

---

## 🔍 Step 8: Troubleshooting

### Problem 1: Cannot Connect to AW 4.6

**Symptoms:**
- Echo fails
- "Connection refused" error
- Timeout errors

**Solutions:**

1. **Check network connectivity:**
   ```bash
   ping 192.168.1.100
   ```

2. **Verify AW 4.6 is running:**
   - Check if AW workstation is powered on
   - Verify DICOM service is running

3. **Check firewall:**
   ```bash
   # Windows
   Test-NetConnection -ComputerName 192.168.1.100 -Port 104
   
   # Linux
   telnet 192.168.1.100 104
   ```

4. **Verify AE Title and Port:**
   - Double-check AE Title matches exactly
   - Confirm DICOM port (104 or 4006)

5. **Check Orthanc configuration:**
   ```bash
   # View current modalities
   curl http://69.62.70.102:8042/modalities -u orthanc:orthanc_secure_2024
   ```

---

### Problem 2: Echo Works but Query Fails

**Symptoms:**
- C-ECHO succeeds
- C-FIND fails with "Not authorized" or "Not supported"

**Solutions:**

1. **Check AW 4.6 permissions:**
   - Ensure Query/Retrieve is enabled for your AE Title
   - Verify your IP is allowed

2. **Check query syntax:**
   ```bash
   # Try simple query
   curl -X POST http://69.62.70.102:8042/modalities/AW_SERVER/query \
     -u orthanc:orthanc_secure_2024 \
     -H "Content-Type: application/json" \
     -d '{
       "Level": "Study",
       "Query": {
         "PatientName": "*"
       }
     }'
   ```

3. **Enable verbose logging in Orthanc:**
   ```json
   // In orthanc.json
   "DicomScuTimeout": 60,
   "Verbose": true
   ```

---

### Problem 3: Retrieve Fails

**Symptoms:**
- Query works
- Retrieve fails or times out

**Solutions:**

1. **Check C-MOVE permissions on AW 4.6:**
   - Ensure your AE Title has C-MOVE rights
   - Verify destination AE Title is correct

2. **Increase timeout:**
   ```json
   // In orthanc.json
   "DicomScuTimeout": 120
   ```

3. **Try C-GET instead of C-MOVE:**
   ```bash
   curl -X POST http://69.62.70.102:8042/modalities/AW_SERVER/query \
     -u orthanc:orthanc_secure_2024 \
     -H "Content-Type: application/json" \
     -d '{
       "Level": "Study",
       "Query": {"PatientName": "*"},
       "Retrieve": "C-GET"
     }'
   ```

---

### Problem 4: Studies Retrieved but Not Showing in Viewer

**Symptoms:**
- Studies in Orthanc (http://69.62.70.102:8042)
- Not appearing in your viewer

**Solutions:**

1. **Check backend is running:**
   ```bash
   # Windows
   # Check terminal where "npm start" is running
   
   # Linux
   pm2 status
   pm2 logs
   ```

2. **Manually trigger sync:**
   ```bash
   curl -X POST http://localhost:8001/api/orthanc/sync
   ```

3. **Check MongoDB connection:**
   ```bash
   mongosh
   use dicomdb
   db.studies.countDocuments()
   ```

4. **Check webhook configuration:**
   ```json
   // In orthanc.json, verify:
   "Plugins": ["./OrthancPlugins"],
   "Lua": ["./lua/on-stored-instance.lua"]
   ```

5. **Check browser console:**
   - Open browser DevTools (F12)
   - Check Console tab for errors
   - Check Network tab for failed API calls

---

### Problem 5: Slow Retrieval

**Symptoms:**
- Retrieval works but very slow
- Large studies timeout

**Solutions:**

1. **Increase timeouts:**
   ```json
   // In orthanc.json
   "DicomScuTimeout": 300,
   "HttpTimeout": 300
   ```

2. **Check network speed:**
   ```bash
   # Test bandwidth between servers
   iperf3 -s  # On AW server
   iperf3 -c 192.168.1.100  # On your server
   ```

3. **Retrieve series individually:**
   ```bash
   # Instead of whole study, retrieve one series at a time
   curl -X POST http://69.62.70.102:8042/modalities/AW_SERVER/query \
     -u orthanc:orthanc_secure_2024 \
     -d '{"Level": "Series", "Query": {"StudyInstanceUID": "1.2.3..."}}'
   ```

4. **Use compression:**
   ```json
   // In orthanc.json
   "DicomScuPreferredTransferSyntax": "1.2.840.10008.1.2.4.70"
   ```

---

## 📊 Step 9: Monitoring and Logs

### Check Orthanc Logs

**Windows:**
```powershell
# Orthanc logs appear in the terminal where it's running
# Look for messages like:
# "I: DICOM query against modality AW_SERVER"
# "I: Retrieve from modality AW_SERVER"
```

**Linux:**
```bash
# Docker logs
docker logs hospital-orthanc -f

# Or if running as service
journalctl -u orthanc -f
```

### Check Backend Logs

**Windows:**
```bash
# Check terminal where "npm start" is running
# Look for:
# "✓ Synced study: 1.2.3.4.5..."
# "✓ Created patient: John Doe"
```

**Linux:**
```bash
pm2 logs dicom-viewer-backend --lines 100
```

### Monitor Sync Status

**Create monitoring script:**

```bash
# monitor-aw-sync.sh
#!/bin/bash

echo "=== AW 4.6 Sync Monitor ==="
echo ""

# Check Orthanc studies count
ORTHANC_COUNT=$(curl -s http://69.62.70.102:8042/statistics -u orthanc:orthanc_secure_2024 | jq '.CountStudies')
echo "📊 Orthanc Studies: $ORTHANC_COUNT"

# Check MongoDB studies count
MONGO_COUNT=$(mongosh --quiet --eval "db.studies.countDocuments()" dicomdb)
echo "📊 MongoDB Studies: $MONGO_COUNT"

# Check last sync time
LAST_SYNC=$(mongosh --quiet --eval "db.studies.find().sort({createdAt:-1}).limit(1).pretty()" dicomdb | grep createdAt)
echo "🕐 Last Sync: $LAST_SYNC"

# Test AW connection
echo ""
echo "🔌 Testing AW Connection..."
echoscu -aec AW_SERVER 192.168.1.100 104 2>&1 | grep -q "Accepted" && echo "✓ AW Server: Connected" || echo "✗ AW Server: Not connected"

echo ""
echo "=== End Monitor ==="
```

---

## 🔐 Step 10: Security Considerations

### Network Security

1. **Use VPN for remote access:**
   ```
   Remote Clinic → VPN → Hospital Network → AW Server
   ```

2. **Firewall rules:**
   ```bash
   # Only allow specific IPs to access DICOM ports
   sudo ufw allow from 192.168.1.0/24 to any port 4242
   sudo ufw allow from 192.168.1.100 to any port 4242
   ```

3. **Enable DICOM TLS (if supported):**
   ```json
   // In orthanc.json
   "DicomTlsEnabled": true,
   "DicomTlsCertificate": "/path/to/cert.pem",
   "DicomTlsPrivateKey": "/path/to/key.pem"
   ```

### Access Control

1. **Change default passwords:**
   ```json
   // In orthanc.json
   "RegisteredUsers": {
     "admin": "STRONG_PASSWORD_HERE"
   }
   ```

2. **Enable AE Title checking:**
   ```json
   "DicomCheckCalledAet": true,
   "DicomCheckCallingAet": true
   ```

3. **Restrict API access:**
   ```json
   "RemoteAccessAllowed": false,  // Only localhost
   "AuthenticationEnabled": true
   ```

### Audit Logging

**Enable detailed logging:**

```json
// In orthanc.json
{
  "Verbose": true,
  "LogExportedResources": true,
  "LogIncomingInstances": true,
  "DicomScuTimeout": 60
}
```

**Monitor access logs:**

```bash
# Check who accessed what
grep "DICOM" /var/log/orthanc/orthanc.log
grep "Query" /var/log/orthanc/orthanc.log
grep "Retrieve" /var/log/orthanc/orthanc.log
```

---

## 📋 Quick Reference Card

### Connection Details Template

```
═══════════════════════════════════════════════════
         AW 4.6 CONNECTION DETAILS
═══════════════════════════════════════════════════

AW SERVER:
  IP Address:    192.168.1.100
  AE Title:      AW_SERVER
  DICOM Port:    104
  
YOUR SYSTEM (ORTHANC):
  IP Address:    192.168.1.200
  AE Title:      ORTHANC
  DICOM Port:    4242
  HTTP Port:     8042
  Username:      orthanc
  Password:      orthanc_secure_2024

═══════════════════════════════════════════════════
```

### Common Commands

```bash
# Test connection
echoscu -aec AW_SERVER 192.168.1.100 104

# Query studies
curl -X POST http://69.62.70.102:8042/modalities/AW_SERVER/query \
  -u orthanc:orthanc_secure_2024 \
  -H "Content-Type: application/json" \
  -d '{"Level":"Study","Query":{"PatientName":"*"}}'

# Sync to database
curl -X POST http://localhost:8001/api/orthanc/sync

# Check Orthanc status
curl http://69.62.70.102:8042/system -u orthanc:orthanc_secure_2024

# View studies
http://localhost:5173
```

---

## ✅ Verification Checklist

Before going live, verify:

- [ ] Network connectivity to AW 4.6 confirmed
- [ ] DICOM Echo (C-ECHO) successful
- [ ] DICOM Query (C-FIND) returns results
- [ ] DICOM Retrieve (C-MOVE) downloads studies
- [ ] Studies appear in Orthanc web interface
- [ ] Studies sync to MongoDB database
- [ ] Studies visible in your viewer application
- [ ] Auto-sync script working (if configured)
- [ ] Monitoring and logging enabled
- [ ] Security measures implemented
- [ ] Backup procedures in place
- [ ] Staff trained on new system

---

## 🎓 Training Guide for Staff

### For Radiologists/Technicians:

**To view studies from AW 4.6:**

1. Open browser: `http://192.168.1.200` (or your server IP)
2. Studies automatically sync from AW 4.6
3. Click on patient to view images
4. Use viewer tools for measurements, annotations
5. Generate reports as needed

**To manually retrieve a study:**

1. Go to Orthanc: `http://192.168.1.200:8042`
2. Login with credentials
3. Click "Query/Retrieve"
4. Select "AW_SERVER"
5. Search for patient/study
6. Click "Retrieve"
7. Study will appear in main viewer

### For IT Staff:

**Daily checks:**
```bash
# Run health check
./monitor-aw-sync.sh

# Check logs
pm2 logs
docker logs hospital-orthanc --tail 50

# Verify sync
curl -X POST http://localhost:8001/api/orthanc/sync
```

**Weekly maintenance:**
```bash
# Backup database
mongodump --out /backup/$(date +%Y%m%d)

# Check disk space
df -h

# Review logs for errors
grep -i error /var/log/orthanc/orthanc.log
```

---

## 🆘 Emergency Procedures

### If AW Connection Fails:

1. **Check AW 4.6 is running:**
   - Verify workstation is powered on
   - Check DICOM service status

2. **Test network:**
   ```bash
   ping 192.168.1.100
   telnet 192.168.1.100 104
   ```

3. **Restart Orthanc:**
   ```bash
   docker compose restart  # or
   systemctl restart orthanc
   ```

4. **Contact AW administrator:**
   - Verify your AE Title is still configured
   - Check if AW had updates/changes

### If Studies Not Syncing:

1. **Check backend:**
   ```bash
   pm2 restart all
   pm2 logs
   ```

2. **Manual sync:**
   ```bash
   curl -X POST http://localhost:8001/api/orthanc/sync
   ```

3. **Check MongoDB:**
   ```bash
   mongosh
   use dicomdb
   db.studies.find().limit(5)
   ```

### If Viewer Not Loading:

1. **Check all services:**
   ```bash
   # Orthanc
   curl http://69.62.70.102:8042/system -u orthanc:orthanc_secure_2024
   
   # Backend
   curl http://localhost:8001/api/health
   
   # Frontend
   curl http://localhost:5173
   ```

2. **Restart services:**
   ```bash
   pm2 restart all
   docker compose restart
   sudo systemctl restart nginx
   ```

3. **Check browser console:**
   - Press F12
   - Look for errors in Console tab

---

## 📞 Support Resources

### Documentation:
- **Orthanc Book**: https://book.orthanc-server.com/
- **DICOM Standard**: https://www.dicomstandard.org/
- **GE AW Documentation**: Contact GE Healthcare support

### Tools:
- **DCMTK**: https://dicom.offis.de/dcmtk
- **Horos Viewer**: https://horosproject.org/
- **DICOM Test Images**: https://www.rubomedical.com/dicom_files/

### Community:
- **Orthanc Forum**: https://groups.google.com/g/orthanc-users
- **DICOM Forum**: https://www.dicomstandard.org/community

---

## 🎉 Success Indicators

You've successfully connected when:

✅ DICOM Echo to AW 4.6 succeeds  
✅ Can query studies from AW 4.6  
✅ Can retrieve studies to Orthanc  
✅ Studies appear in your viewer  
✅ Auto-sync working (if configured)  
✅ Staff can access and view studies  
✅ Performance is acceptable  
✅ Monitoring and logging active  

---

**Document Version:** 1.0  
**Last Updated:** October 23, 2024  
**Author:** DICOM Integration Team  

**Need Help?** Contact your IT department or PACS administrator.

