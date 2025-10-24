# 🏥 Complete AW 4.6 Setup Guide - Step by Step (For Non-Technical Person)

## 📖 What This Guide Does

This guide will help you automatically send DICOM files from your hospital's **GE AW 4.6 workstation** to your cloud system, so doctors can view them from anywhere.

**No technical knowledge needed - just copy and paste the commands!**

---

## 🎯 What You Need

1. **Access to AW 4.6 Server** (the computer in your hospital)
2. **Username and Password** for that server
3. **15 minutes** of time
4. **Internet connection** on AW server

---

## 📍 Step 1: Find Where AW Stores DICOM Files

### What is this?
AW 4.6 saves all X-ray, CT, MRI images in a folder on the computer. We need to find that folder.

### How to do it:

1. **Login to AW Server**
   - Use PuTTY (Windows) or Terminal (Mac)
   - Enter server IP address
   - Enter username and password

2. **Copy and paste this command:**

```bash
find /data /opt /var /mnt -name "*.dcm" -type f 2>/dev/null | head -10
```

3. **Press Enter**

4. **You will see something like this:**

```
/data/dicom/studies/patient1/study1/image001.dcm
/data/dicom/studies/patient1/study1/image002.dcm
/data/dicom/studies/patient2/study2/image001.dcm
```

5. **Write down the folder path** (the part before the filename)
   - Example: `/data/dicom/studies`
   - This is your **DICOM_FOLDER**

### Common AW 4.6 DICOM Locations:

| Location | Description |
|----------|-------------|
| `/data/dicom/studies` | Most common |
| `/opt/ge/aw/data` | Alternative location |
| `/var/ge/dicom` | Older systems |
| `/mnt/dicom` | Network mounted |

**✍️ Write your DICOM folder here:** `_______________________`

---

## 📍 Step 2: Install Required Tools

### What is this?
We need to install two small programs that will watch for new files and send them.

### How to do it:

**Copy and paste these commands one by one:**

```bash
# Command 1: Update system
sudo yum update -y
```

**Press Enter, wait for it to finish (may take 2-3 minutes)**

```bash
# Command 2: Install file watcher
sudo yum install -y inotify-tools
```

**Press Enter, wait for it to finish**

```bash
# Command 3: Install curl (for sending files)
sudo yum install -y curl
```

**Press Enter, wait for it to finish**

```bash
# Command 4: Verify installation
which inotifywait && which curl && echo "✅ All tools installed successfully!"
```

**You should see:**
```
/usr/bin/inotifywait
/usr/bin/curl
✅ All tools installed successfully!
```

---

## 📍 Step 3: Create Folders for Our Script

### What is this?
We need to create folders where our automatic sending program will live.

### How to do it:

**Copy and paste these commands:**

```bash
# Create main folder
sudo mkdir -p /opt/dicom-watcher

# Create log folder (to track what files are sent)
sudo mkdir -p /var/log/dicom-watcher

# Verify folders created
ls -la /opt/dicom-watcher && echo "✅ Folders created successfully!"
```

---

## 📍 Step 4: Create the Automatic Sending Script

### What is this?
This is the program that will watch for new DICOM files and automatically send them to the cloud.

### How to do it:

**⚠️ IMPORTANT: Before running this command, replace `/data/dicom/studies` with YOUR folder from Step 1!**

**Copy and paste this ENTIRE command:**

```bash
sudo tee /opt/dicom-watcher/watch-and-send.sh > /dev/null << 'ENDOFSCRIPT'
#!/bin/bash

###############################################################################
# DICOM File Watcher and Sender
# This script watches for new DICOM files and sends them to cloud
###############################################################################

# ============================================================================
# CONFIGURATION - CHANGE THESE IF NEEDED
# ============================================================================

# Where AW 4.6 saves DICOM files (CHANGE THIS TO YOUR FOLDER FROM STEP 1!)
WATCH_DIR="/data/dicom/studies"

# Cloud Orthanc server details (DO NOT CHANGE)
ORTHANC_URL="http://69.62.70.102:8042"
ORTHANC_USER="orthanc"
ORTHANC_PASS="orthanc_secure_2024"

# Log files
PROCESSED_LOG="/var/log/dicom-watcher/processed.log"
ERROR_LOG="/var/log/dicom-watcher/errors.log"
STATS_LOG="/var/log/dicom-watcher/stats.log"

# ============================================================================
# DO NOT CHANGE ANYTHING BELOW THIS LINE
# ============================================================================

# Create log files if they don't exist
touch "$PROCESSED_LOG"
touch "$ERROR_LOG"
touch "$STATS_LOG"

# Counter for statistics
TOTAL_SENT=0
TOTAL_FAILED=0

# Print startup message
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏥 DICOM File Watcher Started"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📁 Watching folder: $WATCH_DIR"
echo "📡 Sending to: $ORTHANC_URL"
echo "📅 Started at: $(date)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Function to send DICOM file to cloud
send_to_orthanc() {
    local file="$1"
    local filename=$(basename "$file")
    local filesize=$(du -h "$file" | cut -f1)
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 📤 New file detected: $filename (Size: $filesize)"
    
    # Wait 3 seconds to ensure file is completely written
    sleep 3
    
    # Check if file still exists (might have been moved/deleted)
    if [ ! -f "$file" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  File no longer exists, skipping"
        return
    fi
    
    # Send to Orthanc cloud server
    http_code=$(curl -s -u "$ORTHANC_USER:$ORTHANC_PASS" \
        -X POST "$ORTHANC_URL/instances" \
        --data-binary "@$file" \
        --max-time 60 \
        -w "%{http_code}" \
        -o /dev/null)
    
    # Check if successful
    if [ "$http_code" = "200" ]; then
        TOTAL_SENT=$((TOTAL_SENT + 1))
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ SUCCESS: $filename sent to cloud" | tee -a "$PROCESSED_LOG"
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] File: $filename | Size: $filesize | Status: SUCCESS" >> "$STATS_LOG"
    else
        TOTAL_FAILED=$((TOTAL_FAILED + 1))
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ FAILED: $filename (HTTP Error: $http_code)" | tee -a "$ERROR_LOG"
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] File: $filename | Size: $filesize | Status: FAILED (HTTP $http_code)" >> "$STATS_LOG"
    fi
    
    # Print statistics every 10 files
    if [ $((($TOTAL_SENT + $TOTAL_FAILED) % 10)) -eq 0 ]; then
        echo ""
        echo "📊 Statistics: Sent: $TOTAL_SENT | Failed: $TOTAL_FAILED | Total: $(($TOTAL_SENT + $TOTAL_FAILED))"
        echo ""
    fi
}

# Check if watch directory exists
if [ ! -d "$WATCH_DIR" ]; then
    echo "❌ ERROR: Watch directory does not exist: $WATCH_DIR"
    echo "Please check the WATCH_DIR setting in this script"
    exit 1
fi

# Check if Orthanc is reachable
echo "🔍 Testing connection to cloud server..."
if curl -s -u "$ORTHANC_USER:$ORTHANC_PASS" "$ORTHANC_URL/system" > /dev/null 2>&1; then
    echo "✅ Cloud server is reachable"
    echo ""
else
    echo "⚠️  WARNING: Cannot reach cloud server"
    echo "   Will keep trying when files are detected"
    echo ""
fi

# Start watching for new DICOM files
echo "👀 Now watching for new DICOM files..."
echo "   Any new .dcm file in $WATCH_DIR will be automatically sent"
echo "   Press Ctrl+C to stop"
echo ""

# Use inotifywait to monitor directory
inotifywait -m -r -e close_write,moved_to --format '%w%f' "$WATCH_DIR" 2>/dev/null | while read file
do
    # Check if it's a DICOM file
    if [[ "$file" == *.dcm ]] || [[ "$file" == *.DCM ]] || [[ "$file" == *.dicom ]]; then
        send_to_orthanc "$file"
    elif file "$file" 2>/dev/null | grep -q "DICOM"; then
        # File has no extension but is DICOM format
        send_to_orthanc "$file"
    fi
done
ENDOFSCRIPT
```

**Press Enter**

### Now edit the script to use YOUR folder:

```bash
# Open the script in editor
sudo nano /opt/dicom-watcher/watch-and-send.sh
```

**You will see the script. Find this line:**
```bash
WATCH_DIR="/data/dicom/studies"
```

**Change it to YOUR folder from Step 1**

**Example:** If your folder is `/opt/ge/aw/data`, change to:
```bash
WATCH_DIR="/opt/ge/aw/data"
```

**Save and exit:**
- Press `Ctrl + X`
- Press `Y` (for Yes)
- Press `Enter`

### Make the script executable:

```bash
sudo chmod +x /opt/dicom-watcher/watch-and-send.sh
```

### Test the script:

```bash
# Check if script is valid
bash -n /opt/dicom-watcher/watch-and-send.sh && echo "✅ Script is valid!"
```

---

## 📍 Step 5: Create Automatic Startup Service

### What is this?
This makes sure the program starts automatically when the server restarts.

### How to do it:

**Copy and paste this ENTIRE command:**

```bash
sudo tee /etc/systemd/system/dicom-watcher.service > /dev/null << 'ENDOFSERVICE'
[Unit]
Description=DICOM File Watcher and Sender for AW 4.6
Documentation=https://github.com/your-repo
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/dicom-watcher
ExecStart=/opt/dicom-watcher/watch-and-send.sh
Restart=always
RestartSec=10

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=dicom-watcher

# Security
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
ENDOFSERVICE
```

**Press Enter**

---

## 📍 Step 6: Start the Service

### What is this?
Now we start the automatic file sending program.

### How to do it:

**Copy and paste these commands one by one:**

```bash
# Reload systemd to recognize new service
sudo systemctl daemon-reload
```

```bash
# Enable service to start on boot
sudo systemctl enable dicom-watcher
```

```bash
# Start the service now
sudo systemctl start dicom-watcher
```

```bash
# Check if service is running
sudo systemctl status dicom-watcher
```

**You should see:**
```
● dicom-watcher.service - DICOM File Watcher and Sender for AW 4.6
   Loaded: loaded (/etc/systemd/system/dicom-watcher.service; enabled)
   Active: active (running) since ...
```

**If you see "active (running)" in GREEN - SUCCESS! ✅**

---

## 📍 Step 7: Test the System

### What is this?
Let's make sure files are being sent correctly.

### How to do it:

**Option A: Watch Live Logs**

```bash
# See what's happening in real-time
sudo journalctl -u dicom-watcher -f
```

**You should see:**
```
🏥 DICOM File Watcher Started
📁 Watching folder: /data/dicom/studies
📡 Sending to: http://69.62.70.102:8042
✅ Cloud server is reachable
👀 Now watching for new DICOM files...
```

**Press Ctrl+C to stop watching logs**

**Option B: Test with a File**

```bash
# Copy a test DICOM file to the watched folder
# (Replace /path/to/test.dcm with actual test file)
sudo cp /path/to/test.dcm /data/dicom/studies/test-$(date +%s).dcm
```

**Then watch logs:**
```bash
sudo journalctl -u dicom-watcher -f
```

**You should see:**
```
[2024-10-18 15:30:00] 📤 New file detected: test-1234567890.dcm (Size: 2.5M)
[2024-10-18 15:30:03] ✅ SUCCESS: test-1234567890.dcm sent to cloud
```

---

## 📍 Step 8: View Statistics and Logs

### What is this?
Check how many files have been sent successfully.

### How to do it:

**See processed files:**
```bash
sudo tail -20 /var/log/dicom-watcher/processed.log
```

**See any errors:**
```bash
sudo tail -20 /var/log/dicom-watcher/errors.log
```

**See statistics:**
```bash
sudo tail -20 /var/log/dicom-watcher/stats.log
```

**Count total files sent today:**
```bash
sudo grep "$(date +%Y-%m-%d)" /var/log/dicom-watcher/processed.log | wc -l
```

---

## 📍 Common AW 4.6 DICOM Folder Locations

### Where does AW 4.6 save DICOM files?

| Folder Path | When Used | How to Check |
|-------------|-----------|--------------|
| `/data/dicom/studies` | Default installation | `ls -la /data/dicom/studies` |
| `/opt/ge/aw/data` | Custom installation | `ls -la /opt/ge/aw/data` |
| `/var/ge/dicom` | Older versions | `ls -la /var/ge/dicom` |
| `/mnt/dicom` | Network storage | `ls -la /mnt/dicom` |
| `/export/home/sdc_image_pool/images` | Some configurations | `ls -la /export/home/sdc_image_pool/images` |

### How to find it yourself:

```bash
# Method 1: Search for recent DICOM files
sudo find / -name "*.dcm" -type f -mtime -1 2>/dev/null | head -10

# Method 2: Check AW configuration
sudo cat /opt/ge/aw/config/dicom.cfg | grep -i "storage"

# Method 3: Check running processes
ps aux | grep -i dicom

# Method 4: Ask AW administrator
# They usually know the exact location
```

---

## 🔧 Management Commands (For Daily Use)

### Start/Stop the Service

```bash
# Start
sudo systemctl start dicom-watcher

# Stop
sudo systemctl stop dicom-watcher

# Restart
sudo systemctl restart dicom-watcher

# Check status
sudo systemctl status dicom-watcher
```

### View Logs

```bash
# Live logs (real-time)
sudo journalctl -u dicom-watcher -f

# Last 50 lines
sudo journalctl -u dicom-watcher -n 50

# Today's logs only
sudo journalctl -u dicom-watcher --since today

# Logs from specific time
sudo journalctl -u dicom-watcher --since "2024-10-18 14:00:00"
```

### Check Statistics

```bash
# Total files sent today
echo "Files sent today: $(sudo grep "$(date +%Y-%m-%d)" /var/log/dicom-watcher/processed.log | wc -l)"

# Total files failed today
echo "Files failed today: $(sudo grep "$(date +%Y-%m-%d)" /var/log/dicom-watcher/errors.log | wc -l)"

# Last 10 successful files
sudo tail -10 /var/log/dicom-watcher/processed.log

# Last 10 failed files
sudo tail -10 /var/log/dicom-watcher/errors.log
```

---

## 🚨 Troubleshooting

### Problem 1: Service won't start

**Check:**
```bash
# Check if script exists
ls -la /opt/dicom-watcher/watch-and-send.sh

# Check if script is executable
ls -la /opt/dicom-watcher/watch-and-send.sh | grep "x"

# Check script for errors
sudo bash -n /opt/dicom-watcher/watch-and-send.sh

# View error logs
sudo journalctl -u dicom-watcher -n 50
```

**Fix:**
```bash
# Make script executable
sudo chmod +x /opt/dicom-watcher/watch-and-send.sh

# Restart service
sudo systemctl restart dicom-watcher
```

### Problem 2: Files not being sent

**Check:**
```bash
# Is service running?
sudo systemctl status dicom-watcher

# Are files being created in watched folder?
ls -lt /data/dicom/studies | head -10

# Can we reach cloud server?
curl -u orthanc:orthanc_secure_2024 http://69.62.70.102:8042/system

# Check logs for errors
sudo journalctl -u dicom-watcher -n 50
```

**Fix:**
```bash
# Restart service
sudo systemctl restart dicom-watcher

# Test manual send
curl -u orthanc:orthanc_secure_2024 \
  -X POST http://69.62.70.102:8042/instances \
  --data-binary @/path/to/test.dcm
```

### Problem 3: Wrong folder being watched

**Check:**
```bash
# View current configuration
sudo grep "WATCH_DIR" /opt/dicom-watcher/watch-and-send.sh
```

**Fix:**
```bash
# Edit script
sudo nano /opt/dicom-watcher/watch-and-send.sh

# Find line: WATCH_DIR="/data/dicom/studies"
# Change to correct folder
# Save: Ctrl+X, Y, Enter

# Restart service
sudo systemctl restart dicom-watcher
```

### Problem 4: Network/Internet issues

**Check:**
```bash
# Can we ping cloud server?
ping -c 4 69.62.70.102

# Can we reach HTTP port?
curl -v http://69.62.70.102:8042/system

# Check firewall
sudo firewall-cmd --list-all
```

**Fix:**
```bash
# Allow outgoing connections
sudo firewall-cmd --permanent --add-rich-rule='rule family="ipv4" destination address="69.62.70.102" port port="8042" protocol="tcp" accept'
sudo firewall-cmd --reload
```

---

## ✅ Verification Checklist

After setup, verify everything is working:

- [ ] **Step 1**: Found DICOM folder location
- [ ] **Step 2**: Installed inotify-tools and curl
- [ ] **Step 3**: Created /opt/dicom-watcher folder
- [ ] **Step 4**: Created watch-and-send.sh script
- [ ] **Step 5**: Created systemd service
- [ ] **Step 6**: Service is running (green "active")
- [ ] **Step 7**: Test file sent successfully
- [ ] **Step 8**: Can view logs and statistics

**Check service status:**
```bash
sudo systemctl status dicom-watcher
```

**Should show:** `Active: active (running)` in GREEN

**Check recent activity:**
```bash
sudo journalctl -u dicom-watcher --since "10 minutes ago"
```

---

## 📊 How It Works (Simple Explanation)

```
┌─────────────────────────────────────────────────────────────┐
│  1. Doctor creates X-ray/CT scan on AW 4.6 workstation     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  2. AW 4.6 saves DICOM file to folder                       │
│     Example: /data/dicom/studies/patient123/study1.dcm     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Our watcher detects new file (within 1 second)          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  4. Watcher sends file to cloud (69.62.70.102:8042)        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  5. Cloud auto-sync saves to database (Patient ID: NA)      │
│     (Happens within 30 seconds)                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  6. Doctor can view on web viewer from anywhere             │
│     http://your-domain.com/viewer                           │
└─────────────────────────────────────────────────────────────┘
```

**Total time from scan to viewable online: ~30-60 seconds**

---

## 📞 Quick Reference Card (Print This!)

```
═══════════════════════════════════════════════════════════════
                    DICOM WATCHER QUICK REFERENCE
═══════════════════════════════════════════════════════════════

START SERVICE:
  sudo systemctl start dicom-watcher

STOP SERVICE:
  sudo systemctl stop dicom-watcher

CHECK STATUS:
  sudo systemctl status dicom-watcher

VIEW LIVE LOGS:
  sudo journalctl -u dicom-watcher -f

CHECK FILES SENT TODAY:
  sudo grep "$(date +%Y-%m-%d)" /var/log/dicom-watcher/processed.log | wc -l

CHECK ERRORS:
  sudo tail -20 /var/log/dicom-watcher/errors.log

RESTART IF PROBLEMS:
  sudo systemctl restart dicom-watcher

═══════════════════════════════════════════════════════════════
CONFIGURATION FILES:
  Script:  /opt/dicom-watcher/watch-and-send.sh
  Service: /etc/systemd/system/dicom-watcher.service
  Logs:    /var/log/dicom-watcher/

CLOUD SERVER:
  URL: http://69.62.70.102:8042
  User: orthanc
  Pass: orthanc_secure_2024

SUPPORT:
  Check logs first: sudo journalctl -u dicom-watcher -f
═══════════════════════════════════════════════════════════════
```

---

## 🎉 Success! What Now?

After successful setup:

1. **Monitor for 24 hours**
   ```bash
   sudo journalctl -u dicom-watcher -f
   ```

2. **Check statistics daily**
   ```bash
   echo "Files sent today: $(sudo grep "$(date +%Y-%m-%d)" /var/log/dicom-watcher/processed.log | wc -l)"
   ```

3. **Set up log rotation** (optional, for long-term use)
   ```bash
   sudo tee /etc/logrotate.d/dicom-watcher > /dev/null << 'EOF'
   /var/log/dicom-watcher/*.log {
       daily
       rotate 30
       compress
       delaycompress
       missingok
       notifempty
   }
   EOF
   ```

4. **Document for your team**
   - Print the Quick Reference Card
   - Share with IT team
   - Train backup person

---

## 📝 Summary

You have successfully set up automatic DICOM file sending from AW 4.6 to cloud!

**What happens now:**
- Every time a new scan is done on AW 4.6
- File is automatically detected
- Sent to cloud within seconds
- Saved to database with Patient ID "NA"
- Available in web viewer within 30 seconds

**No manual work needed!** Everything is automatic! 🎉

---

**Need help? Check logs:**
```bash
sudo journalctl -u dicom-watcher -f
```

**Everything working? You should see files being sent in real-time!** ✅
