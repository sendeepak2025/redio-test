# 🚀 Quick Start: Receiving DICOM Files

## 3-Step Setup

### Step 1: Configure Network (Run Once)
```bash
# Right-click and "Run as Administrator"
setup-dicom-network.bat
```
This opens firewall ports for DICOM communication.

### Step 2: Start Services
```bash
# Terminal 1: Start Orthanc
cd orthanc-config
Orthanc.exe orthanc.json

# Terminal 2: Start Backend
cd server
npm start

# Terminal 3: Start Viewer
cd viewer
npm run dev
```

### Step 3: Configure Your Modality/Workstation

**On your X-ray machine, CT scanner, or PACS workstation:**

```
Destination Name: Orthanc
AE Title: ORTHANC_DEV_AE
IP Address: [YOUR_SERVER_IP]  ← Get this from setup-dicom-network.bat
Port: 4242
Service: Storage (C-STORE)
```

**That's it!** Send a test image and it will appear in your viewer.

---

## 🧪 Testing

### Test 1: Check if everything is running
```bash
test-dicom-connection.bat
```

### Test 2: Send a test DICOM file

**Option A: Using Orthanc Web Interface**
1. Open: `http://YOUR_SERVER_IP:8042`
2. Login: `orthanc` / `orthanc_secure_2024`
3. Click "Upload" and select a .dcm file

**Option B: Using DICOM tools (if installed)**
```bash
storescu -aec ORTHANC_DEV_AE YOUR_SERVER_IP 4242 test.dcm
```

### Test 3: View in your application
1. Open: `http://YOUR_SERVER_IP:5173`
2. Go to "Patients" page
3. Your study should appear automatically!

---

## 📱 Common Scenarios

### Scenario 1: X-Ray Machine in Same Room
```
X-Ray Machine → Same Network → Your PC
IP: 192.168.1.XXX (local network)
No special configuration needed
```

### Scenario 2: Remote Clinic
```
Remote Clinic → Internet → Your Server
IP: Your public IP or domain
Requires: Port forwarding or VPN
Security: Use DICOM TLS or VPN tunnel
```

### Scenario 3: Multiple Modalities
```
X-Ray Machine ─┐
CT Scanner    ─┼→ Your Orthanc Server
MRI Machine   ─┤
Ultrasound    ─┘

All use same configuration:
- AE Title: ORTHANC_DEV_AE
- Port: 4242
```

---

## 🔍 Troubleshooting

### Problem: Files not appearing

**Check:**
1. ✓ Orthanc received it: `http://YOUR_IP:8042` (should see study)
2. ✓ Backend processed it: Check Node.js console logs
3. ✓ Database updated: Check MongoDB

**Fix:**
```bash
# Manually sync Orthanc to database
curl -X POST http://localhost:8001/api/orthanc/sync
```

### Problem: Cannot connect from modality

**Check:**
1. ✓ Firewall allows port 4242
2. ✓ Orthanc is running
3. ✓ IP address is correct
4. ✓ Network connectivity exists

**Fix:**
```bash
# Run network setup again
setup-dicom-network.bat

# Test connection
test-dicom-connection.bat
```

---

## 📊 What Happens Automatically

```
1. Modality sends DICOM file
   ↓
2. Orthanc receives and stores it
   ↓
3. Lua script triggers webhook
   ↓
4. Node.js backend processes metadata
   ↓
5. Stores in MongoDB
   ↓
6. AI analysis triggered (if enabled)
   ↓
7. Appears in viewer automatically
```

**No manual intervention needed!**

---

## 🔒 Security Notes

### For Development (Current Setup):
- ✓ Password protected HTTP interface
- ✓ Accepts DICOM from any source
- ⚠️ No encryption on DICOM traffic
- ⚠️ No AE Title verification

### For Production (Recommended):
- ✅ Enable DICOM TLS encryption
- ✅ Enable AE Title checking
- ✅ Restrict IP addresses via firewall
- ✅ Use VPN for remote access
- ✅ Change default passwords

---

## 📞 Need Help?

1. **Check logs:**
   - Orthanc: Console where Orthanc.exe is running
   - Backend: Console where `npm start` is running
   - Browser: F12 → Console

2. **Test connectivity:**
   ```bash
   test-dicom-connection.bat
   ```

3. **Verify configuration:**
   - Orthanc: `orthanc-config/orthanc.json`
   - Backend: `server/.env`

4. **Read full guide:**
   - `DICOM_WORKSTATION_SETUP_GUIDE.md`

---

## ✅ Checklist

Before sending DICOM files, verify:

- [ ] Orthanc is running (port 4242 listening)
- [ ] Backend is running (port 8001 listening)
- [ ] Viewer is running (port 5173 accessible)
- [ ] Firewall allows port 4242
- [ ] You know your server IP address
- [ ] Modality is configured with correct AE Title and IP
- [ ] Network connectivity exists between modality and server

**All checked?** You're ready to receive DICOM files! 🎉

---

**Quick Reference:**
```
AE Title: ORTHANC_DEV_AE
Port: 4242
Web: http://YOUR_IP:8042
User: orthanc
Pass: orthanc_secure_2024
```
