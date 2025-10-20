# 🏥 AW 4.6 Setup - One Page Cheat Sheet

## 📋 Complete Setup in 8 Steps (Copy-Paste All Commands)

### ✅ Step 1: Find DICOM Folder
```bash
find /data /opt /var /mnt -name "*.dcm" -type f 2>/dev/null | head -10
```
**Write down the folder path (e.g., `/data/dicom/studies`)**

---

### ✅ Step 2: Install Tools
```bash
sudo yum install -y inotify-tools curl && echo "✅ Tools installed!"
```

---

### ✅ Step 3: Create Folders
```bash
sudo mkdir -p /opt/dicom-watcher /var/log/dicom-watcher && echo "✅ Folders created!"
```

---

### ✅ Step 4: Create Script (⚠️ CHANGE `/data/dicom/studies` TO YOUR FOLDER!)
```bash
sudo tee /opt/dicom-watcher/watch-and-send.sh > /dev/null << 'EOF'
#!/bin/bash
WATCH_DIR="/data/dicom/studies"
ORTHANC_URL="http://69.62.70.102:8042"
ORTHANC_USER="orthanc"
ORTHANC_PASS="orthanc_secure_2024"
PROCESSED_LOG="/var/log/dicom-watcher/processed.log"
ERROR_LOG="/var/log/dicom-watcher/errors.log"

touch "$PROCESSED_LOG" "$ERROR_LOG"
echo "[$(date)] DICOM Watcher started - Monitoring: $WATCH_DIR"

send_to_orthanc() {
    local file="$1"
    echo "[$(date)] 📤 Processing: $(basename "$file")"
    sleep 2
    http_code=$(curl -s -u "$ORTHANC_USER:$ORTHANC_PASS" -X POST "$ORTHANC_URL/instances" --data-binary "@$file" -w "%{http_code}" -o /dev/null)
    if [ "$http_code" = "200" ]; then
        echo "[$(date)] ✅ Sent: $(basename "$file")" | tee -a "$PROCESSED_LOG"
    else
        echo "[$(date)] ❌ Failed: $(basename "$file")" | tee -a "$ERROR_LOG"
    fi
}

inotifywait -m -r -e close_write,moved_to --format '%w%f' "$WATCH_DIR" | while read file; do
    if [[ "$file" == *.dcm ]] || [[ "$file" == *.DCM ]]; then
        send_to_orthanc "$file"
    fi
done
EOF

sudo chmod +x /opt/dicom-watcher/watch-and-send.sh && echo "✅ Script created!"
```

**⚠️ EDIT THE SCRIPT TO USE YOUR FOLDER:**
```bash
sudo nano /opt/dicom-watcher/watch-and-send.sh
# Change WATCH_DIR="/data/dicom/studies" to YOUR folder
# Save: Ctrl+X, Y, Enter
```

---

### ✅ Step 5: Create Service
```bash
sudo tee /etc/systemd/system/dicom-watcher.service > /dev/null << 'EOF'
[Unit]
Description=DICOM File Watcher for AW 4.6
After=network.target

[Service]
Type=simple
User=root
ExecStart=/opt/dicom-watcher/watch-and-send.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Service created!"
```

---

### ✅ Step 6: Start Service
```bash
sudo systemctl daemon-reload
sudo systemctl enable dicom-watcher
sudo systemctl start dicom-watcher
sudo systemctl status dicom-watcher
```
**Should show: "active (running)" in GREEN ✅**

---

### ✅ Step 7: View Logs
```bash
sudo journalctl -u dicom-watcher -f
```
**Press Ctrl+C to stop**

---

### ✅ Step 8: Test
```bash
# Copy test file (replace path with actual test file)
sudo cp /path/to/test.dcm /data/dicom/studies/test-$(date +%s).dcm

# Watch logs
sudo journalctl -u dicom-watcher -f
```

---

## 🔧 Daily Commands

| Task | Command |
|------|---------|
| **Start** | `sudo systemctl start dicom-watcher` |
| **Stop** | `sudo systemctl stop dicom-watcher` |
| **Restart** | `sudo systemctl restart dicom-watcher` |
| **Status** | `sudo systemctl status dicom-watcher` |
| **Live Logs** | `sudo journalctl -u dicom-watcher -f` |
| **Files Sent Today** | `sudo grep "$(date +%Y-%m-%d)" /var/log/dicom-watcher/processed.log \| wc -l` |
| **Errors Today** | `sudo grep "$(date +%Y-%m-%d)" /var/log/dicom-watcher/errors.log \| wc -l` |

---

## 📍 Common AW 4.6 DICOM Folders

| Folder | Check Command |
|--------|---------------|
| `/data/dicom/studies` | `ls -la /data/dicom/studies` |
| `/opt/ge/aw/data` | `ls -la /opt/ge/aw/data` |
| `/var/ge/dicom` | `ls -la /var/ge/dicom` |
| `/mnt/dicom` | `ls -la /mnt/dicom` |
| `/export/home/sdc_image_pool/images` | `ls -la /export/home/sdc_image_pool/images` |

---

## 🚨 Troubleshooting

### Service Not Running?
```bash
sudo systemctl restart dicom-watcher
sudo journalctl -u dicom-watcher -n 50
```

### Files Not Sending?
```bash
# Check if folder is correct
sudo grep "WATCH_DIR" /opt/dicom-watcher/watch-and-send.sh

# Test cloud connection
curl -u orthanc:orthanc_secure_2024 http://69.62.70.102:8042/system
```

### Change Watched Folder?
```bash
sudo nano /opt/dicom-watcher/watch-and-send.sh
# Edit WATCH_DIR line
# Save: Ctrl+X, Y, Enter
sudo systemctl restart dicom-watcher
```

---

## 📊 How It Works

```
AW 4.6 saves file → Watcher detects (1 sec) → Sends to cloud (2-3 sec) 
→ Auto-sync saves to DB (30 sec) → Viewable in web viewer
```

**Total time: ~30-60 seconds from scan to online** ⚡

---

## ✅ Verification

```bash
# All should return OK
sudo systemctl status dicom-watcher | grep "active (running)"
sudo journalctl -u dicom-watcher --since "5 minutes ago"
sudo tail -5 /var/log/dicom-watcher/processed.log
```

---

## 📞 Quick Help

**Problem:** Service won't start
**Solution:** `sudo journalctl -u dicom-watcher -n 50`

**Problem:** Files not sending
**Solution:** Check folder path in script

**Problem:** Network error
**Solution:** `ping 69.62.70.102`

---

## 🎉 Done!

After setup, files will automatically send from AW 4.6 to cloud!

**Monitor:** `sudo journalctl -u dicom-watcher -f`

**Print this page and keep it handy!** 📄
