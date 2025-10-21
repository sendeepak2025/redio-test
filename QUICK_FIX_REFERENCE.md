# Quick Fix Reference Card

## 🎨 Color DICOM Not Rendering?

**Check:** Server logs for "Color image detected" message

**Fix:** Already applied! System auto-detects color images.

**Manual override if needed:**
```javascript
// In orthancInstanceController.js
const pngBuffer = await this.orthancClient.generatePreview(
  orthancInstanceId, 
  localFrameIndex, 
  { useRendered: true }  // Force color rendering
);
```

---

## ⏱️ Upload Timing Out?

**Check:** `.env` file has these lines:
```env
ORTHANC_UPLOAD_TIMEOUT=300000
```

**Increase if needed:**
```env
ORTHANC_UPLOAD_TIMEOUT=600000  # 10 minutes
```

**Restart server:**
```bash
cd server
npm start
```

---

## 🔌 Orthanc Not Connecting?

**Test connection:**
```bash
curl -u orthanc:orthanc_secure_2024 http://localhost:8042/system
```

**Check `.env`:**
```env
ORTHANC_URL=http://localhost:8042
ORTHANC_USERNAME=orthanc
ORTHANC_PASSWORD=orthanc_secure_2024
```

---

## 🗄️ MongoDB Not Connected?

**Check connection string in `.env`:**
```env
MONGODB_URI=mongodb+srv://...
```

**Test connection:**
```bash
mongosh "mongodb+srv://..."
```

---

## 📊 Server Logs to Monitor

### ✅ Good Signs:
```
Unified Orthanc Service initialized: { url: '...', uploadTimeout: '300000ms' }
📤 Uploading DICOM file to Orthanc (45.23 MB)...
✅ Upload successful: abc123
🎨 Color image detected (RGB, 3 samples) - using 'rendered' endpoint
✅ Instances upserted
```

### ❌ Bad Signs:
```
❌ MongoDB not connected!
❌ Failed to upload to Orthanc: timeout
❌ Cannot find module
ECONNREFUSED
```

---

## 🚀 Quick Test Commands

### Test Upload:
```bash
curl -X POST http://localhost:8001/api/dicom/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.dcm"
```

### Test Orthanc:
```bash
curl -u orthanc:orthanc_secure_2024 \
  http://localhost:8042/system
```

### Test Server:
```bash
curl http://localhost:8001/health
```

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `server/.env` | Configuration (timeouts, URLs) |
| `server/src/services/unified-orthanc-service.js` | Orthanc communication |
| `server/src/services/orthanc-preview-client.js` | Image rendering |
| `server/src/controllers/uploadController.js` | Upload handling |

---

## 🔧 Common Fixes

### Restart Server:
```bash
cd server
npm start
```

### Clear Node Cache:
```bash
cd server
rm -rf node_modules
npm install
```

### Check Environment:
```bash
cd server
cat .env | grep ORTHANC
```

---

## 📞 Need Help?

1. Check `FIXES_SUMMARY.md` for overview
2. Check `UPLOAD_TIMEOUT_FIX.md` for upload issues
3. Check `COLOR_DICOM_FIX.md` for rendering issues
4. Check server terminal for error messages
5. Check browser console (F12) for frontend errors

---

## ✅ Success Indicators

- [ ] Server starts without errors
- [ ] Can upload DICOM files
- [ ] Color images show color (not grayscale)
- [ ] Large files upload successfully
- [ ] Studies appear in viewer
- [ ] Frame navigation works

**All checked? You're good to go! 🎉**
