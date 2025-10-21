# 🏥 Hospital AW 4.6 Server Setup Guide

## Overview

AW 4.6 (Advantage Workstation) se automatically DICOM files capture karne ke liye multiple methods hain:

---

## 🎯 Method 1: DICOM C-STORE (Recommended)

AW 4.6 ko configure karo ki wo automatically Orthanc ko DICOM files send kare.

### Step 1: Configure Orthanc as DICOM Destination

**On AW 4.6 Server:**

1. Open DICOM Configuration
2. Add New Destination:
   ```
   AE Title: ORTHANC_PROD_AE
   Host: 69.62.70.102
   Port: 4242
   ```

3. Test Connection:
   ```bash
   # From AW server
   echoscu -aet AW_WORKSTATION -aec ORTHANC_PROD_AE 69.62.70.102 4242
   ```

### Step 2: Configure Auto-Send Rules

**Option A: Via AW GUI**
- Go to DICOM Settings
- Enable "Auto-send to destination"
- Select: ORTHANC_PROD_AE
- Apply to: All new studies

**Option B: Via Configuration File**
Edit AW DICOM config (usually in `/opt/ge/aw/config/dicom.cfg`):
```ini
[AutoSend]
Enabled=true
Destination=ORTHANC_PROD_AE
TriggerOn=StudyComplete
```

### Step 3: Verify Auto-Send

```bash
# On AW server, check DICOM logs
tail -f /var/log/dicom/send.log

# Should see:
# [2024-10-18 15:30:00] Sending study to ORTHANC_PROD_AE...
# [2024-10-18 15:30:05] Transfer complete: 150 images
```

---

## 🎯 Method 2: File System Watcher (Alternative)

If DICOM C-STORE not available, watch the file system where AW stores DICOM files.

### Step 1: Find AW Storage Location

```bash
# Common locations on AW 4.6:
/data/dicom/studies/
/opt/ge/aw/data/
/var/ge/dicom/
/mnt/dicom/

# Find actual location:
find /data /opt /var /mnt -name "*.dcm" -type f 2>/dev/null | head -5
```

### Step 2: Install File Watcher Script

Create `/opt/dicom-watcher/watch-and-send.sh`:

```bash
#!/bin/bash

# Configuration
WATCH_DIR="/data/dicom/studies"
ORTHANC_URL="http://localhost:8042"
ORTHANC_USER="orthanc"
ORTHANC_PASS="orthanc_secure_2024"
PROCESSED_LOG="/var/log/dicom-watcher/processed.log"

# Create log directory
mkdir -p /var/log/dicom-watcher

# Function to send DICOM file to Orthanc
send_to_orthanc() {
    local file="$1"
    
    echo "[$(date)] Processing: $file"
    
    # Send to Orthanc
    response=$(curl -s -u "$ORTHANC_USER:$ORTHANC_PASS" \
        -X POST "$ORTHANC_URL/instances" \
        --data-binary "@$file" \
        -w "%{http_code}")
    
    if [ "$response" = "200" ]; then
        echo "[$(date)] ✅ Sent: $file" >> "$PROCESSED_LOG"
        echo "✅ Success: $file"
    else
        echo "[$(date)] ❌ Failed: $file (HTTP $response)" >> "$PROCESSED_LOG"
        echo "❌ Failed: $file"
    fi
}

# Watch for new DICOM files
inotifywait -m -r -e close_write --format '%w%f' "$WATCH_DIR" | while read file
do
    # Check if it's a DICOM file
    if [[ "$file" == *.dcm ]] || file "$file" | grep -q "DICOM"; then
        # Wait a bit to ensure file is completely written
        sleep 2
        send_to_orthanc "$file"
    fi
done
```

### Step 3: Install inotify-tools

```bash
# On AW server (as root)
yum install inotify-tools -y
# or
apt-get install inotify-tools -y
```

### Step 4: Create Systemd Service

Create `/etc/systemd/system/dicom-watcher.service`:

```ini
[Unit]
Description=DICOM File Watcher
After=network.target

[Service]
Type=simple
User=root
ExecStart=/opt/dicom-watcher/watch-and-send.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Step 5: Start Service

```bash
# Make script executable
chmod +x /opt/dicom-watcher/watch-and-send.sh

# Enable and start service
systemctl enable dicom-watcher
systemctl start dicom-watcher

# Check status
systemctl status dicom-watcher

# View logs
journalctl -u dicom-watcher -f
```

---

## 🎯 Method 3: Cron-Based Sync (Simplest)

Periodically scan and send new files.

### Step 1: Create Sync Script

Create `/opt/dicom-sync/sync-to-orthanc.sh`:

```bash
#!/bin/bash

# Configuration
DICOM_DIR="/data/dicom/studies"
ORTHANC_URL="http://localhost:8042"
ORTHANC_USER="orthanc"
ORTHANC_PASS="orthanc_secure_2024"
PROCESSED_LIST="/var/log/dicom-sync/processed.txt"
LOG_FILE="/var/log/dicom-sync/sync.log"

# Create directories
mkdir -p /var/log/dicom-sync
touch "$PROCESSED_LIST"

echo "[$(date)] Starting DICOM sync..." >> "$LOG_FILE"

# Find all DICOM files
find "$DICOM_DIR" -type f \( -name "*.dcm" -o -name "*.DCM" \) | while read file
do
    # Check if already processed
    if grep -q "$file" "$PROCESSED_LIST"; then
        continue
    fi
    
    # Send to Orthanc
    response=$(curl -s -u "$ORTHANC_USER:$ORTHANC_PASS" \
        -X POST "$ORTHANC_URL/instances" \
        --data-binary "@$file" \
        -w "%{http_code}" -o /dev/null)
    
    if [ "$response" = "200" ]; then
        echo "$file" >> "$PROCESSED_LIST"
        echo "[$(date)] ✅ Sent: $file" >> "$LOG_FILE"
    else
        echo "[$(date)] ❌ Failed: $file (HTTP $response)" >> "$LOG_FILE"
    fi
done

echo "[$(date)] Sync complete" >> "$LOG_FILE"
```

### Step 2: Make Executable

```bash
chmod +x /opt/dicom-sync/sync-to-orthanc.sh
```

### Step 3: Add to Crontab

```bash
# Edit crontab
crontab -e

# Add line to run every 5 minutes:
*/5 * * * * /opt/dicom-sync/sync-to-orthanc.sh

# Or every minute:
* * * * * /opt/dicom-sync/sync-to-orthanc.sh
```

### Step 4: Test

```bash
# Run manually first
/opt/dicom-sync/sync-to-orthanc.sh

# Check logs
tail -f /var/log/dicom-sync/sync.log
```

---

## 🎯 Method 4: DICOM Query/Retrieve (C-MOVE)

Configure Orthanc to pull studies from AW server.

### Step 1: Configure AW as DICOM Modality in Orthanc

Edit `orthanc-config/orthanc.json`:

```json
{
  "DicomModalities": {
    "AW_SERVER": {
      "AET": "AW_WORKSTATION",
      "Host": "aw-server-ip",
      "Port": 104,
      "AllowEcho": true,
      "AllowFind": true,
      "AllowMove": true,
      "AllowGet": true,
      "AllowStore": true
    }
  }
}
```

### Step 2: Query and Retrieve Studies

```bash
# Query for studies from today
curl -u orthanc:orthanc_secure_2024 \
  -X POST http://localhost:8042/modalities/AW_SERVER/query \
  -d '{
    "Level": "Study",
    "Query": {
      "StudyDate": "20241018"
    }
  }'

# Retrieve specific study
curl -u orthanc:orthanc_secure_2024 \
  -X POST http://localhost:8042/modalities/AW_SERVER/move \
  -d '{
    "Level": "Study",
    "Resources": ["1.2.3.4.5.6.7.8.9"]
  }'
```

### Step 3: Automate with Script

Create `/opt/orthanc-pull/pull-from-aw.sh`:

```bash
#!/bin/bash

ORTHANC_URL="http://localhost:8042"
ORTHANC_USER="orthanc"
ORTHANC_PASS="orthanc_secure_2024"
MODALITY="AW_SERVER"

# Get today's date in DICOM format (YYYYMMDD)
TODAY=$(date +%Y%m%d)

# Query for today's studies
curl -u "$ORTHANC_USER:$ORTHANC_PASS" \
  -X POST "$ORTHANC_URL/modalities/$MODALITY/query" \
  -d "{
    \"Level\": \"Study\",
    \"Query\": {
      \"StudyDate\": \"$TODAY\"
    }
  }"
```

---

## 📊 Comparison of Methods

| Method | Pros | Cons | Recommended For |
|--------|------|------|-----------------|
| **C-STORE** | Real-time, Standard DICOM | Requires AW config | Production |
| **File Watcher** | Automatic, Fast | Requires inotify | Real-time needs |
| **Cron Sync** | Simple, Reliable | Delayed (5 min) | Simple setups |
| **C-MOVE** | Standard DICOM | Complex setup | Existing PACS |

---

## 🔧 Complete Setup Example

### On AW 4.6 Server (Linux):

```bash
# 1. Install dependencies
yum install inotify-tools curl -y

# 2. Create watcher script
mkdir -p /opt/dicom-watcher
cat > /opt/dicom-watcher/watch-and-send.sh << 'EOF'
#!/bin/bash
WATCH_DIR="/data/dicom/studies"
ORTHANC_URL="http://localhost:8042"
ORTHANC_USER="orthanc"
ORTHANC_PASS="orthanc_secure_2024"

inotifywait -m -r -e close_write --format '%w%f' "$WATCH_DIR" | while read file
do
    if [[ "$file" == *.dcm ]]; then
        sleep 2
        curl -s -u "$ORTHANC_USER:$ORTHANC_PASS" \
            -X POST "$ORTHANC_URL/instances" \
            --data-binary "@$file"
        echo "[$(date)] Sent: $file"
    fi
done
EOF

# 3. Make executable
chmod +x /opt/dicom-watcher/watch-and-send.sh

# 4. Create systemd service
cat > /etc/systemd/system/dicom-watcher.service << 'EOF'
[Unit]
Description=DICOM File Watcher
After=network.target

[Service]
Type=simple
ExecStart=/opt/dicom-watcher/watch-and-send.sh
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# 5. Start service
systemctl daemon-reload
systemctl enable dicom-watcher
systemctl start dicom-watcher

# 6. Check status
systemctl status dicom-watcher
```

### On Your Server:

```bash
# Start auto-sync to capture studies
cd server
npm run auto-sync
```

---

## 🧪 Testing

### Test 1: Manual Upload from AW

```bash
# On AW server
storescu -aet AW_WORKSTATION -aec ORTHANC_PROD_AE \
  69.62.70.102 4242 /path/to/test.dcm
```

### Test 2: Check File Watcher

```bash
# On AW server
# Copy a DICOM file to watched directory
cp /path/to/test.dcm /data/dicom/studies/

# Check logs
journalctl -u dicom-watcher -f
```

### Test 3: Verify on Orthanc

```bash
# Check if study received
curl -u orthanc:orthanc_secure_2024 \
  http://localhost:8042/studies
```

### Test 4: Check Your Database

```bash
# Should appear in your database within 30 seconds
mongosh "mongodb+srv://mahitechnocrats:qNfbRMgnCthyu59@cluster1.xqa5iyj.mongodb.net/radiology-final-16-10"

use radiology-final-16-10
db.studies.find({ patientID: "NA" }).count()
```

---

## 🚀 Production Checklist

- [ ] Identify AW DICOM storage location
- [ ] Choose sync method (C-STORE recommended)
- [ ] Install required tools (inotify-tools, curl)
- [ ] Create and test sync script
- [ ] Set up systemd service or cron job
- [ ] Configure firewall rules (port 4242 for DICOM)
- [ ] Test with sample DICOM file
- [ ] Monitor logs for 24 hours
- [ ] Set up log rotation
- [ ] Document for hospital IT team

---

## 📝 Firewall Configuration

### On AW Server:

```bash
# Allow outgoing to Orthanc
firewall-cmd --permanent --add-rich-rule='rule family="ipv4" destination address="69.62.70.102" port port="4242" protocol="tcp" accept'
firewall-cmd --permanent --add-rich-rule='rule family="ipv4" destination address="69.62.70.102" port port="8042" protocol="tcp" accept'
firewall-cmd --reload
```

### On Orthanc Server:

```bash
# Allow incoming DICOM
firewall-cmd --permanent --add-port=4242/tcp
firewall-cmd --permanent --add-port=8042/tcp
firewall-cmd --reload
```

---

## 🔍 Troubleshooting

### Files Not Sending

```bash
# Check if watcher is running
systemctl status dicom-watcher

# Check logs
journalctl -u dicom-watcher -n 50

# Test manual send
curl -u orthanc:orthanc_secure_2024 \
  -X POST http://localhost:8042/instances \
  --data-binary @/path/to/test.dcm
```

### Network Issues

```bash
# Test connectivity
ping 69.62.70.102

# Test Orthanc HTTP
curl -u orthanc:orthanc_secure_2024 http://localhost:8042/system

# Test DICOM port
telnet 69.62.70.102 4242
```

### Permission Issues

```bash
# Check file permissions
ls -la /data/dicom/studies/

# Fix permissions
chmod -R 755 /data/dicom/studies/
chown -R dicom:dicom /data/dicom/studies/
```

---

## 📞 Quick Reference

| Component | Location | Port |
|-----------|----------|------|
| AW Server | Hospital Network | - |
| Orthanc DICOM | 69.62.70.102 | 4242 |
| Orthanc HTTP | 69.62.70.102 | 8042 |
| Your API | Your Server | 8001 |
| Auto-Sync | Your Server | - |

---

## 🎯 Recommended Setup

**For Hospital AW 4.6:**

1. **Use File Watcher** (Method 2) - Most reliable for AW
2. **Install on AW server** as systemd service
3. **Monitor logs** for first 24 hours
4. **Set up alerts** for failures

**Complete Command:**

```bash
# On AW server (as root)
curl -o /tmp/setup-dicom-watcher.sh https://your-server/setup-dicom-watcher.sh
chmod +x /tmp/setup-dicom-watcher.sh
/tmp/setup-dicom-watcher.sh
```

---

**Need help with specific AW 4.6 configuration? Let me know the exact setup!** 🏥
