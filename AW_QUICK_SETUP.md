# 🏥 AW 4.6 Quick Setup - Copy-Paste Commands

## 🚀 Option 1: Automated Setup (Recommended)

### On AW Server (as root):

```bash
# Download and run setup script
curl -o /tmp/setup-aw.sh https://raw.githubusercontent.com/your-repo/main/scripts/setup-aw-watcher.sh
chmod +x /tmp/setup-aw.sh
sudo /tmp/setup-aw.sh
```

---

## 🚀 Option 2: Manual Setup (Step by Step)

### Step 1: Install Dependencies

```bash
# For RHEL/CentOS (common on AW)
sudo yum install -y inotify-tools curl

# For Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y inotify-tools curl
```

### Step 2: Find DICOM Directory

```bash
# Find where AW stores DICOM files
find /data /opt /var /mnt -name "*.dcm" -type f 2>/dev/null | head -5

# Common locations:
# /data/dicom/studies
# /opt/ge/aw/data
# /var/ge/dicom
```

### Step 3: Create Watcher Script

```bash
# Create directory
sudo mkdir -p /opt/dicom-watcher
sudo mkdir -p /var/log/dicom-watcher

# Create script (replace WATCH_DIR with your actual path)
sudo tee /opt/dicom-watcher/watch-and-send.sh > /dev/null << 'EOF'
#!/bin/bash

# Configuration - CHANGE THESE VALUES
WATCH_DIR="/data/dicom/studies"  # ← Change this to your DICOM directory
ORTHANC_URL="http://69.62.70.102:8042"
ORTHANC_USER="orthanc"
ORTHANC_PASS="orthanc_secure_2024"

# Logs
PROCESSED_LOG="/var/log/dicom-watcher/processed.log"
ERROR_LOG="/var/log/dicom-watcher/errors.log"

# Create log files
touch "$PROCESSED_LOG"
touch "$ERROR_LOG"

echo "[$(date)] DICOM Watcher started - Monitoring: $WATCH_DIR"

# Function to send DICOM file
send_to_orthanc() {
    local file="$1"
    local filename=$(basename "$file")
    
    echo "[$(date)] 📤 Processing: $filename"
    
    # Wait for file to be completely written
    sleep 2
    
    # Send to Orthanc
    http_code=$(curl -s -u "$ORTHANC_USER:$ORTHANC_PASS" \
        -X POST "$ORTHANC_URL/instances" \
        --data-binary "@$file" \
        -w "%{http_code}" \
        -o /dev/null)
    
    if [ "$http_code" = "200" ]; then
        echo "[$(date)] ✅ Sent: $filename" >> "$PROCESSED_LOG"
        echo "[$(date)] ✅ Success: $filename"
    else
        echo "[$(date)] ❌ Failed: $filename (HTTP $http_code)" >> "$ERROR_LOG"
        echo "[$(date)] ❌ Failed: $filename (HTTP $http_code)"
    fi
}

# Watch for new DICOM files
inotifywait -m -r -e close_write,moved_to --format '%w%f' "$WATCH_DIR" | while read file
do
    # Check if it's a DICOM file
    if [[ "$file" == *.dcm ]] || [[ "$file" == *.DCM ]] || file "$file" | grep -q "DICOM"; then
        send_to_orthanc "$file"
    fi
done
EOF

# Make executable
sudo chmod +x /opt/dicom-watcher/watch-and-send.sh
```

### Step 4: Create Systemd Service

```bash
sudo tee /etc/systemd/system/dicom-watcher.service > /dev/null << 'EOF'
[Unit]
Description=DICOM File Watcher for AW 4.6
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/dicom-watcher
ExecStart=/opt/dicom-watcher/watch-and-send.sh
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
```

### Step 5: Start Service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service (start on boot)
sudo systemctl enable dicom-watcher

# Start service now
sudo systemctl start dicom-watcher

# Check status
sudo systemctl status dicom-watcher
```

### Step 6: View Logs

```bash
# Live logs
sudo journalctl -u dicom-watcher -f

# Or check log files
sudo tail -f /var/log/dicom-watcher/processed.log
sudo tail -f /var/log/dicom-watcher/errors.log
```

---

## 🧪 Testing

### Test 1: Check Service Status

```bash
sudo systemctl status dicom-watcher
```

Expected output:
```
● dicom-watcher.service - DICOM File Watcher for AW 4.6
   Loaded: loaded (/etc/systemd/system/dicom-watcher.service; enabled)
   Active: active (running) since ...
```

### Test 2: Test with Sample File

```bash
# Copy a DICOM file to watched directory
sudo cp /path/to/test.dcm /data/dicom/studies/test-$(date +%s).dcm

# Watch logs (should see file being sent)
sudo journalctl -u dicom-watcher -f
```

### Test 3: Verify on Orthanc

```bash
# Check if file received
curl -u orthanc:orthanc_secure_2024 http://69.62.70.102:8042/studies
```

### Test 4: Check Your Database

Within 30 seconds, study should appear in your database with Patient ID "NA"

---

## 🔧 Management Commands

### Start/Stop/Restart

```bash
# Start
sudo systemctl start dicom-watcher

# Stop
sudo systemctl stop dicom-watcher

# Restart
sudo systemctl restart dicom-watcher

# Status
sudo systemctl status dicom-watcher
```

### View Logs

```bash
# Live logs
sudo journalctl -u dicom-watcher -f

# Last 100 lines
sudo journalctl -u dicom-watcher -n 100

# Today's logs
sudo journalctl -u dicom-watcher --since today

# Processed files
sudo tail -f /var/log/dicom-watcher/processed.log

# Errors
sudo tail -f /var/log/dicom-watcher/errors.log
```

### Disable/Enable

```bash
# Disable (won't start on boot)
sudo systemctl disable dicom-watcher

# Enable (start on boot)
sudo systemctl enable dicom-watcher
```

---

## 🔍 Troubleshooting

### Service Won't Start

```bash
# Check script syntax
bash -n /opt/dicom-watcher/watch-and-send.sh

# Check permissions
ls -la /opt/dicom-watcher/watch-and-send.sh

# Check logs
sudo journalctl -u dicom-watcher -n 50
```

### Files Not Being Sent

```bash
# Check if directory exists
ls -la /data/dicom/studies

# Check if inotify is working
inotifywait -m /data/dicom/studies

# Test manual send
curl -u orthanc:orthanc_secure_2024 \
  -X POST http://69.62.70.102:8042/instances \
  --data-binary @/path/to/test.dcm
```

### Network Issues

```bash
# Test connectivity
ping 69.62.70.102

# Test Orthanc
curl -u orthanc:orthanc_secure_2024 http://69.62.70.102:8042/system

# Check firewall
sudo firewall-cmd --list-all
```

---

## 📊 Complete Workflow

```
AW 4.6 Server
    ↓
DICOM file created/saved
    ↓
inotify detects new file
    ↓
Script sends to Orthanc (69.62.70.102:8042)
    ↓
Your auto-sync script detects new study
    ↓
Saves to MongoDB with Patient ID "NA"
    ↓
Appears in viewer
```

---

## 🎯 One-Line Install

```bash
curl -sSL https://raw.githubusercontent.com/your-repo/main/scripts/setup-aw-watcher.sh | sudo bash
```

---

## 📝 Configuration File Locations

```
Script:     /opt/dicom-watcher/watch-and-send.sh
Service:    /etc/systemd/system/dicom-watcher.service
Logs:       /var/log/dicom-watcher/
Processed:  /var/log/dicom-watcher/processed.log
Errors:     /var/log/dicom-watcher/errors.log
```

---

## 🚀 Quick Start Summary

```bash
# 1. Install tools
sudo yum install -y inotify-tools curl

# 2. Create script (edit WATCH_DIR first!)
sudo nano /opt/dicom-watcher/watch-and-send.sh
# Paste script content, save

# 3. Make executable
sudo chmod +x /opt/dicom-watcher/watch-and-send.sh

# 4. Create service
sudo nano /etc/systemd/system/dicom-watcher.service
# Paste service content, save

# 5. Start
sudo systemctl daemon-reload
sudo systemctl enable dicom-watcher
sudo systemctl start dicom-watcher

# 6. Check
sudo systemctl status dicom-watcher
sudo journalctl -u dicom-watcher -f
```

---

## ✅ Verification Checklist

- [ ] inotify-tools installed
- [ ] curl installed
- [ ] DICOM directory identified
- [ ] Script created and executable
- [ ] Service file created
- [ ] Service enabled and started
- [ ] Test file sent successfully
- [ ] Logs showing activity
- [ ] Study appears in Orthanc
- [ ] Study appears in your database

---

**Need help? Check logs first:**

```bash
sudo journalctl -u dicom-watcher -f
```

**Everything working? You should see:**

```
[2024-10-18 15:30:00] DICOM Watcher started - Monitoring: /data/dicom/studies
[2024-10-18 15:30:15] 📤 Processing: study_001.dcm
[2024-10-18 15:30:17] ✅ Success: study_001.dcm
```

🎉 **Done! Files will now automatically sync from AW to your system!**
