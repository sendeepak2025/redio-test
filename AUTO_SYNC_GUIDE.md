# 🔄 Auto-Sync Simple Guide

## Kya Hoga

Jab bhi remote Orthanc (http://69.62.70.102:8042) pe koi study upload hogi:
- ✅ Automatically database mein save ho jayegi
- ✅ Patient ID hamesha "NA" hogi
- ✅ Har 30 seconds mein check hoga
- ✅ Viewer mein automatically dikhai degi

---

## 🚀 Start Karo

```bash
cd server
npm run auto-sync
```

Bas itna hi! Script chalu ho jayegi aur background mein continuously check karti rahegi.

---

## 📊 Kya Dikhega

### Initial Sync
```
🔄 Starting initial sync...
📡 Remote Orthanc: http://69.62.70.102:8042

📊 Found 2 existing studies

   📥 Processing study: abc123...
   📋 Study Info:
      StudyUID: 1.2.3.4.5.6.7.8.9
      Patient: John Doe (ID: NA)
      Date: 20241017
      Modality: CT
      Instances: 10
   ✅ Study saved to database
   ✅ Created 10 instance records
   ✅ Patient record updated (ID: NA)

✅ Initial sync complete!
   Synced: 2
   Skipped: 0
```

### Watching for New Studies
```
👀 Watching for new studies...
⏱️  Checking every 30 seconds
Press Ctrl+C to stop

✓ No new studies (2 total) - 3:45:30 PM
✓ No new studies (2 total) - 3:46:00 PM

🆕 Found 1 new study(ies)!

   📥 Processing study: xyz789...
   📋 Study Info:
      StudyUID: 1.2.3.4.5.6.7.8.10
      Patient: Jane Smith (ID: NA)
      Date: 20241017
      Modality: MRI
      Instances: 5
   ✅ Study saved to database
   ✅ Created 5 instance records
   ✅ Patient record updated (ID: NA)

✅ Sync complete!
```

---

## 🎯 Features

### Patient ID Always "NA"
```javascript
patientID: 'NA'  // Hamesha yahi hoga
```

### Auto-Detection
- Har 30 seconds mein check hota hai
- Naya study detect hote hi sync ho jata hai
- Duplicate studies skip ho jate hain

### Complete Metadata
- Study information
- Series information
- Instance records
- Frame references
- Patient record (ID: NA)

---

## 📝 Database Structure

### Study Record
```javascript
{
  studyInstanceUID: "1.2.3.4.5.6.7.8.9",
  patientID: "NA",              // ✅ Always "NA"
  patientName: "John Doe",
  studyDate: "20241017",
  modality: "CT",
  numberOfInstances: 10,
  orthancStudyId: "abc123",
  remoteOrthancUrl: "http://69.62.70.102:8042"
}
```

### Patient Record
```javascript
{
  patientID: "NA",              // ✅ Always "NA"
  patientName: "Latest Patient Name",
  studyIds: [
    "1.2.3.4.5.6.7.8.9",
    "1.2.3.4.5.6.7.8.10",
    // ... all studies with Patient ID "NA"
  ]
}
```

### Instance Records
```javascript
{
  studyInstanceUID: "1.2.3.4.5.6.7.8.9",
  seriesInstanceUID: "1.2.3.4.5.6.7.8.9.1",
  sopInstanceUID: "1.2.3.4.5.6.7.8.9.1.1",
  orthancInstanceId: "abc123",
  orthancUrl: "http://69.62.70.102:8042/instances/abc123",
  useOrthancPreview: true
}
```

---

## 🔍 View Studies

### All Studies with Patient ID "NA"
```bash
# MongoDB query
db.studies.find({ patientID: "NA" })
```

### Via API
```bash
curl http://localhost:8001/api/dicom/studies
```

### Via Viewer
```
http://localhost:5173/viewer
```

All studies will show Patient ID as "NA"

---

## 🛑 Stop Auto-Sync

Press `Ctrl+C` in the terminal:

```
^C
👋 Stopping auto-sync...
✅ Disconnected from MongoDB
```

---

## 🔧 Configuration

### Change Check Interval

Edit `server/auto-sync-simple.js`:

```javascript
// Line ~350
await startWatching(30); // Change 30 to desired seconds
```

Or modify the script to accept command line argument:

```bash
# Check every 60 seconds
node auto-sync-simple.js 60
```

### Change Patient ID

Edit `server/auto-sync-simple.js`:

```javascript
// Line ~150
const patientID = 'NA';  // Change to whatever you want
```

---

## 🧪 Testing

### 1. Start Auto-Sync
```bash
cd server
npm run auto-sync
```

### 2. Upload Test Study to Remote Orthanc
```bash
curl -u orthanc:orthanc_secure_2024 \
  -X POST http://69.62.70.102:8042/instances \
  --data-binary @test.dcm
```

### 3. Wait 30 Seconds
Watch the terminal - you should see:
```
🆕 Found 1 new study(ies)!
   📥 Processing study: ...
   ✅ Study saved to database
```

### 4. Check Database
```bash
mongosh "mongodb+srv://mahitechnocrats:qNfbRMgnCthyu59@cluster1.xqa5iyj.mongodb.net/radiology-final-16-10"

use radiology-final-16-10
db.studies.find({ patientID: "NA" }).pretty()
```

### 5. Check Viewer
```
http://localhost:5173/viewer
```

Study should appear with Patient ID "NA"

---

## 🚀 Production Setup

### Using PM2
```bash
npm install -g pm2

cd server
pm2 start auto-sync-simple.js --name "orthanc-auto-sync"
pm2 save
pm2 startup
```

### Check Status
```bash
pm2 status
pm2 logs orthanc-auto-sync
```

### Stop
```bash
pm2 stop orthanc-auto-sync
pm2 delete orthanc-auto-sync
```

---

## 📊 Comparison with Other Scripts

| Script | Purpose | Patient ID | Interval |
|--------|---------|------------|----------|
| `auto-sync-simple.js` | ✅ Simple auto-sync | Always "NA" | 30s |
| `sync-remote-orthanc.js` | Full sync | From DICOM | 60s |
| `start-with-sync.js` | Server + sync | From DICOM | 60s |

---

## ⚠️ Important Notes

✅ **Patient ID**: Hamesha "NA" hogi, DICOM file mein kuch bhi ho

✅ **Auto-Detection**: Har 30 seconds mein check hota hai

✅ **No Duplicates**: Same study dobara save nahi hogi

✅ **Background Process**: Continuously chalti rahegi

✅ **MongoDB**: Metadata only, DICOM files remote Orthanc pe

---

## 🎯 Complete Workflow

1. **Start auto-sync**
   ```bash
   npm run auto-sync
   ```

2. **Upload DICOM to remote Orthanc**
   - Via web UI
   - Via curl
   - Via any DICOM tool

3. **Wait 30 seconds**
   - Script automatically detects
   - Saves to database
   - Patient ID = "NA"

4. **View in viewer**
   - Open http://localhost:5173/viewer
   - Study appears with Patient ID "NA"

---

**Bas itna hi! Ek command se sab automatic ho jayega! 🎉**

```bash
cd server
npm run auto-sync
```
