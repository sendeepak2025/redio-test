# Upload Bugs Found & Fixed

## Bug #1: Service Reset on Every Upload ❌

**Location:** `server/src/controllers/uploadController.js`

**Problem:**
```javascript
// This was being called on EVERY upload
resetUnifiedOrthancService();
const orthancService = getUnifiedOrthancService({
  uploadTimeout: parseInt(process.env.ORTHANC_UPLOAD_TIMEOUT) || 300000
});
```

**Issues:**
- Recreated the axios client on every upload
- Wasted resources
- Potential auth credential issues
- Unnecessary overhead

**Fix:**
```javascript
// Simple singleton usage
const orthancService = getUnifiedOrthancService();
```

---

## Bug #2: Timeout Not Read from Environment ❌

**Location:** `server/src/services/unified-orthanc-service.js`

**Problem:**
```javascript
constructor(config = {}) {
  this.config = {
    timeout: config.timeout || 60000,  // ❌ Not reading from env
    // uploadTimeout was missing!
  };
}
```

**Issues:**
- `ORTHANC_UPLOAD_TIMEOUT` environment variable was ignored
- Always used 60-second timeout instead of 300 seconds
- Caused timeout errors on slow connections

**Fix:**
```javascript
constructor(config = {}) {
  this.config = {
    timeout: config.timeout || parseInt(process.env.ORTHANC_TIMEOUT) || 60000,
    uploadTimeout: config.uploadTimeout || parseInt(process.env.ORTHANC_UPLOAD_TIMEOUT) || 300000,
    ...config
  };
}
```

---

## Bug #3: Upload Method Not Using Upload Timeout ❌

**Location:** `server/src/services/unified-orthanc-service.js`

**Problem:**
```javascript
async uploadDicomFile(fileBuffer) {
  const response = await this.client.post('/instances', fileBuffer, {
    headers: { 'Content-Type': 'application/dicom' }
    // ❌ No timeout specified - uses default 60s
  });
}
```

**Issues:**
- Used default axios client timeout (60s)
- Ignored the `uploadTimeout` config
- Large files would timeout

**Fix:**
```javascript
async uploadDicomFile(fileBuffer) {
  const response = await this.client.post('/instances', fileBuffer, {
    headers: {
      'Content-Type': 'application/dicom',
      'Content-Length': fileBuffer.length
    },
    timeout: this.config.uploadTimeout,  // ✅ Now uses 300s
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });
}
```

---

## Bug #4: Connection Test Blocking Upload ❌

**Location:** `server/src/controllers/uploadController.js`

**Problem:**
```javascript
// Connection test with 60s timeout
const connectionTest = await orthancService.testConnection();
if (!connectionTest.connected) {
  throw new Error('Orthanc is not accessible');
}
// If this times out, upload never happens
```

**Issues:**
- Added unnecessary delay
- Could timeout before upload even starts
- Connection test uses default 60s timeout

**Fix:**
```javascript
// Removed connection test - let upload fail directly if Orthanc is down
// Upload method has better error handling anyway
```

---

## Bug #5: Singleton Not Initialized with Env Config ❌

**Location:** `server/src/services/unified-orthanc-service.js`

**Problem:**
```javascript
function getUnifiedOrthancService(config = {}) {
  if (!unifiedOrthancServiceInstance) {
    unifiedOrthancServiceInstance = new UnifiedOrthancService(config);
    // ❌ config is empty {}, so env vars not read
  }
  return unifiedOrthancServiceInstance;
}
```

**Issues:**
- First call had empty config
- Environment variables not read
- Timeouts defaulted to hardcoded values

**Fix:**
```javascript
function getUnifiedOrthancService(config = {}) {
  if (!unifiedOrthancServiceInstance) {
    unifiedOrthancServiceInstance = new UnifiedOrthancService({
      orthancUrl: process.env.ORTHANC_URL,
      orthancUsername: process.env.ORTHANC_USERNAME,
      orthancPassword: process.env.ORTHANC_PASSWORD,
      timeout: parseInt(process.env.ORTHANC_TIMEOUT) || 60000,
      uploadTimeout: parseInt(process.env.ORTHANC_UPLOAD_TIMEOUT) || 300000,
      ...config  // Allow override
    });
  }
  return unifiedOrthancServiceInstance;
}
```

---

## Summary

### Before Fixes:
- ❌ 60-second timeout (too short)
- ❌ Service recreated on every upload
- ❌ Environment variables ignored
- ❌ Unnecessary connection test
- ❌ Inefficient resource usage

### After Fixes:
- ✅ 300-second timeout (5 minutes)
- ✅ Singleton pattern working correctly
- ✅ Environment variables properly read
- ✅ Direct upload without pre-checks
- ✅ Efficient resource usage

---

## Testing

**Restart your Node.js server** to apply these fixes:

```bash
# Stop server
Ctrl+C

# Start server
cd server
node src/index.js
```

Then try uploading a DICOM file. You should see:
```
📤 Uploading DICOM file to Orthanc (0.71 MB)...
   Using upload timeout: 300000ms
✅ Upload successful: 1a430a89-16db2731-8ef19e46-c238c4d3-709cb35d
✅ Uploaded to Orthanc in 2.34s
```

---

## Environment Variables

Make sure these are set in `server/.env`:

```env
ORTHANC_URL=http://69.62.70.102:8042
ORTHANC_USERNAME=orthanc
ORTHANC_PASSWORD=orthanc_secure_2024
ORTHANC_TIMEOUT=60000
ORTHANC_UPLOAD_TIMEOUT=300000
```

---

## Additional Improvements Made

1. **Better logging** - Shows timeout being used
2. **Buffer validation** - Checks if buffer is valid
3. **Upload timing** - Shows how long upload took
4. **Error details** - Better error messages with codes
5. **Content-Length header** - Helps with large files
