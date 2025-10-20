# 🚀 Quick Start Guide

## Remote Orthanc Setup Complete!

Your system is now configured to:
1. **Upload** DICOM files to remote Orthanc (69.62.70.102:8042)
2. **Auto-sync** new studies from remote Orthanc to local database

---

## 🎯 Start Everything

### Option 1: Start with Auto-Sync (Recommended)
```bash
cd server
npm run start:sync
```

This will start:
- ✅ API Server (port 8001)
- ✅ Auto-sync watcher (checks every 60s)

### Option 2: Start Separately
```bash
# Terminal 1: Start API server
cd server
npm start

# Terminal 2: Start sync watcher
cd server
npm run watch-remote
```

---

## 📤 Upload DICOM Files

### Method 1: Via Web UI
1. Open: http://localhost:5173/upload
2. Login with credentials
3. Select DICOM file
4. Click Upload
5. File will be uploaded to remote Orthanc (69.62.70.102:8042)

### Method 2: Via API
```bash
curl -X POST https://apiradio.varnaamedicalbillingsolutions.com/api/dicom/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@your-dicom-file.dcm"
```

### Method 3: Direct to Remote Orthanc
```bash
curl -u orthanc:orthanc_secure_2024 \
  -X POST http://69.62.70.102:8042/instances \
  --data-binary @your-dicom-file.dcm
```

---

## 📥 Auto-Sync Process

When a new study is uploaded to remote Orthanc:

1. **Sync watcher detects** new study (checks every 60s)
2. **Downloads metadata** from remote Orthanc
3. **Saves to MongoDB** (studies, series, instances)
4. **Available in viewer** immediately

---

## 🔍 View Studies

### Web Viewer
```
http://localhost:5173/viewer
```

### API Endpoints
```bash
# Get all studies
curl https://apiradio.varnaamedicalbillingsolutions.com/api/dicom/studies

# Get specific study
curl https://apiradio.varnaamedicalbillingsolutions.com/api/dicom/studies/{studyUID}

# Get study frames
curl https://apiradio.varnaamedicalbillingsolutions.com/api/dicom/studies/{studyUID}/frames/0
```

---

## 🧪 Test the Setup

### 1. Test Remote Connection
```bash
cd server
npm run test-remote
```

Expected output:
```
✅ System endpoint OK
✅ Studies endpoint OK
✅ Statistics endpoint OK
```

### 2. Upload Test File
```bash
# Upload a DICOM file via your app
# Or directly to remote Orthanc:
curl -u orthanc:orthanc_secure_2024 \
  -X POST http://69.62.70.102:8042/instances \
  --data-binary @test.dcm
```

### 3. Check Sync
```bash
# Watch the sync logs
cd server
npm run watch-remote
```

You should see:
```
🆕 New studies detected! (1 new)
🔄 Starting Remote Orthanc Sync...
✅ Study created: 1.2.3.4.5.6.7.8.9
```

---

## 📊 Configuration

### Remote Orthanc Server
```
URL: http://69.62.70.102:8042
Username: orthanc
Password: orthanc_secure_2024
```

### Local API Server
```
URL: https://apiradio.varnaamedicalbillingsolutions.com
Port: 8001
```

### MongoDB
```
Database: radiology-final-16-10
Connection: MongoDB Atlas (configured in .env)
```

---

## 🔧 Troubleshooting

### Upload Not Working
```bash
# Check if remote Orthanc is accessible
npm run test-remote

# Check server logs
cd server
npm start
```

### Sync Not Working
```bash
# Check MongoDB connection
mongosh "mongodb+srv://mahitechnocrats:qNfbRMgnCthyu59@cluster1.xqa5iyj.mongodb.net/radiology-final-16-10"

# Manually trigger sync
cd server
npm run sync-remote
```

### Studies Not Appearing in Viewer
```bash
# Check database
mongosh "mongodb+srv://mahitechnocrats:qNfbRMgnCthyu59@cluster1.xqa5iyj.mongodb.net/radiology-final-16-10"
use radiology-final-16-10
db.studies.find().pretty()
```

---

## 🎯 Complete Workflow

1. **Start server with auto-sync**
   ```bash
   cd server
   npm run start:sync
   ```

2. **Upload DICOM file**
   - Via web UI: http://localhost:5173/upload
   - Or directly to remote Orthanc

3. **Wait for sync** (max 60 seconds)
   - Watch logs for "New studies detected!"

4. **View in viewer**
   - Open: http://localhost:5173/viewer
   - Study will appear automatically

---

## 📝 Important Notes

✅ **Upload destination**: All uploads go to remote Orthanc (69.62.70.102:8042)

✅ **Storage**: DICOM files stored on remote Orthanc server

✅ **Database**: Metadata stored in MongoDB Atlas

✅ **Sync interval**: 60 seconds (configurable)

✅ **Auto-sync**: Runs continuously in background

---

## 🚀 Production Deployment

For production, use PM2 or systemd:

```bash
# Install PM2
npm install -g pm2

# Start with PM2
cd server
pm2 start start-with-sync.js --name "dicom-server"
pm2 save
pm2 startup
```

---

## 📞 Support

If you encounter issues:
1. Check logs in terminal
2. Verify remote Orthanc is accessible
3. Confirm MongoDB connection
4. Test with `npm run test-remote`

---

**Everything is ready! Just run `npm run start:sync` and start uploading! 🎉**
