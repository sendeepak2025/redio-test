# Remote Orthanc Sync Setup

## Remote Server Details

```
URL: http://localhost:8042
Username: orthanc
Password: orthanc_secure_2024
```

## Quick Start

### 1. One-Time Sync (Sync all existing studies)

```bash
cd server
npm run sync-remote
```

Yeh command ek baar run karke saari existing studies ko sync kar dega.

### 2. Watch Mode (Auto-sync new studies)

```bash
cd server
npm run watch-remote
```

Yeh command continuously chalti rahegi aur har 60 seconds mein check karegi ki koi naya study upload hua hai ya nahi.

### 3. Fast Watch Mode (Check every 30 seconds)

```bash
cd server
npm run watch-remote-fast
```

Yeh har 30 seconds mein check karega.

## How It Works

1. **Remote Orthanc Server**: http://localhost:8042
   - Jab bhi koi naya DICOM study upload hoga

2. **Sync Script**: `server/sync-remote-orthanc.js`
   - Automatically remote server se studies pull karega
   - Local MongoDB database mein save karega
   - Study metadata aur instances create karega

3. **Your Application**:
   - Studies automatically aapke viewer mein dikhengi
   - No manual intervention needed

## Commands

### Sync Once
```bash
cd server
node sync-remote-orthanc.js
```

### Watch for New Studies (60s interval)
```bash
cd server
node sync-remote-orthanc.js watch
```

### Watch with Custom Interval (e.g., 30s)
```bash
cd server
node sync-remote-orthanc.js watch 30
```

## Configuration

Edit `server/.env.remote-orthanc` to change settings:

```env
# Remote Orthanc Configuration
REMOTE_ORTHANC_URL=http://localhost:8042
REMOTE_ORTHANC_USERNAME=orthanc
REMOTE_ORTHANC_PASSWORD=orthanc_secure_2024

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/dicomdb

# Sync Settings
SYNC_INTERVAL=60  # seconds
```

## What Gets Synced

- ✅ Study metadata (Patient name, ID, date, etc.)
- ✅ Series information
- ✅ Instance data
- ✅ Frame references
- ✅ DICOM tags
- ✅ Remote Orthanc URLs

## Viewing Synced Studies

After sync, studies will be available in:

1. **Viewer**: http://localhost:5173/viewer
2. **API**: http://localhost:8001/api/dicom/studies
3. **Database**: MongoDB `dicomdb` collection

## Troubleshooting

### Connection Failed
```bash
# Test remote Orthanc connection
curl -u orthanc:orthanc_secure_2024 http://localhost:8042/system
```

### MongoDB Not Connected
```bash
# Check MongoDB is running
mongosh
use dicomdb
db.studies.countDocuments()
```

### Studies Not Appearing
```bash
# Check sync status
cd server
node sync-remote-orthanc.js
```

## Production Setup

For production, run as a background service:

### Using PM2
```bash
npm install -g pm2
cd server
pm2 start sync-remote-orthanc.js --name "orthanc-sync" -- watch 60
pm2 save
pm2 startup
```

### Using systemd (Linux)
Create `/etc/systemd/system/orthanc-sync.service`:

```ini
[Unit]
Description=Remote Orthanc Sync Service
After=network.target mongodb.service

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/server
ExecStart=/usr/bin/node sync-remote-orthanc.js watch 60
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable orthanc-sync
sudo systemctl start orthanc-sync
sudo systemctl status orthanc-sync
```

## Security Notes

⚠️ **Important**: 
- Remote Orthanc server is publicly accessible (69.62.70.102)
- Make sure to use strong passwords
- Consider using VPN or firewall rules
- Enable HTTPS for production

## Testing

Test the sync manually:

```bash
# 1. Upload a DICOM file to remote Orthanc
curl -u orthanc:orthanc_secure_2024 \
  -X POST http://localhost:8042/instances \
  --data-binary @test.dcm

# 2. Run sync
cd server
npm run sync-remote

# 3. Check database
mongosh
use dicomdb
db.studies.find().pretty()
```

## Logs

Watch logs in real-time:

```bash
cd server
npm run watch-remote
```

Output:
```
🔄 Starting Remote Orthanc Sync...
📡 Remote Server: http://localhost:8042

📊 Found 5 studies on remote Orthanc

[1/5] Processing study: abc123...
  ✅ Study created: 1.2.3.4.5.6.7.8.9
  ✅ Created 10 instance records

✅ Sync Complete!

📊 Summary:
   Total Studies: 5
   ✅ Created: 3
   ⏭️  Already Exists: 2
   ❌ Errors: 0
```

## API Integration

The synced studies are automatically available via your existing API:

```javascript
// Get all studies
GET http://localhost:8001/api/dicom/studies

// Get specific study
GET http://localhost:8001/api/dicom/studies/:studyUid

// Get study frames
GET http://localhost:8001/api/dicom/studies/:studyUid/frames/:frameIndex
```

## Next Steps

1. ✅ Run one-time sync: `npm run sync-remote`
2. ✅ Start watch mode: `npm run watch-remote`
3. ✅ Open viewer: http://localhost:5173/viewer
4. ✅ Upload test DICOM to remote Orthanc
5. ✅ Watch it appear automatically in your viewer!

---

**Bas itna hi! Ab jab bhi remote Orthanc pe koi study upload hogi, wo automatically aapke system mein aa jayegi.** 🎉
