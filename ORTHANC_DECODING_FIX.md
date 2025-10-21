# Orthanc DICOM Decoding Issues - Fix Guide

## Problem
Orthanc shows errors like:
```
"Not implemented yet: Cannot decode DICOM instance with ID: xxx"
"Unable to decode frame X from instance xxx"
```

## Important: This is NOT an Upload Failure!
- The DICOM file **WAS successfully uploaded** to Orthanc
- The file is stored and accessible via API
- The error occurs when trying to **render/preview** the image
- This is a **codec/decoder** issue, not a storage issue

## Root Cause
The DICOM file uses a transfer syntax (compression format) that Orthanc's built-in decoders don't support.

Common unsupported transfer syntaxes:
- JPEG 2000 (1.2.840.10008.1.2.4.90, 1.2.840.10008.1.2.4.91)
- JPEG-LS (1.2.840.10008.1.2.4.80, 1.2.840.10008.1.2.4.81)
- RLE (1.2.840.10008.1.2.5)
- Some JPEG variants

## Solutions

### Solution 1: Use Orthanc with Plugins (Recommended)

Replace your Orthanc Docker image with one that includes plugins:

```bash
# Stop current Orthanc
docker stop orthanc

# Use orthanc-plugins image instead
docker run -d \
  --name orthanc \
  -p 4242:4242 \
  -p 8042:8042 \
  -v orthanc-storage:/var/lib/orthanc/db \
  -v ./orthanc-config/orthanc-tls.json:/etc/orthanc/orthanc.json:ro \
  jodogne/orthanc-plugins:latest
```

The `orthanc-plugins` image includes:
- GDCM plugin (handles most transfer syntaxes)
- Web Viewer plugin
- DICOM Web plugin
- PostgreSQL plugin

### Solution 2: Install GDCM Plugin Manually

If using custom Orthanc image:

```dockerfile
FROM jodogne/orthanc:latest

# Install GDCM plugin
RUN apt-get update && \
    apt-get install -y orthanc-gdcm && \
    rm -rf /var/lib/apt/lists/*
```

### Solution 3: Enable More Transfer Syntaxes

I've updated `orthanc-config/orthanc-tls.json` to include:

```json
{
  "UnknownSopClassAccepted": true,
  "DecodingTransferSyntaxes": [
    "1.2.840.10008.1.2",      // Implicit VR Little Endian
    "1.2.840.10008.1.2.1",    // Explicit VR Little Endian
    "1.2.840.10008.1.2.2",    // Explicit VR Big Endian
    "1.2.840.10008.1.2.4.50", // JPEG Baseline
    "1.2.840.10008.1.2.4.51", // JPEG Extended
    "1.2.840.10008.1.2.4.57", // JPEG Lossless
    "1.2.840.10008.1.2.4.70", // JPEG Lossless First-Order
    "1.2.840.10008.1.2.4.80", // JPEG-LS Lossless
    "1.2.840.10008.1.2.4.81", // JPEG-LS Lossy
    "1.2.840.10008.1.2.4.90", // JPEG 2000 Lossless
    "1.2.840.10008.1.2.4.91", // JPEG 2000 Lossy
    "1.2.840.10008.1.2.5"     // RLE Lossless
  ]
}
```

Restart Orthanc after config change:
```bash
docker restart orthanc
```

### Solution 4: Convert DICOM Files

If you control the source, convert files to a supported format:

```bash
# Using DCMTK
dcmconv --write-xfer-little input.dcm output.dcm

# Using GDCM
gdcmconv --raw input.dcm output.dcm
```

## Verification

### Check Transfer Syntax of Your File

```bash
# Using dcmdump (DCMTK)
dcmdump input.dcm | grep TransferSyntax

# Using Orthanc API
curl -u orthanc:orthanc \
  http://localhost:8042/instances/{instanceId}/tags?simplify=true | \
  jq '.TransferSyntaxUID'
```

### Check Orthanc Plugins

```bash
# List installed plugins
curl -u orthanc:orthanc http://localhost:8042/plugins

# Check system info
curl -u orthanc:orthanc http://localhost:8042/system
```

### Test Image Rendering

```bash
# Try to get preview (will fail if codec missing)
curl -u orthanc:orthanc \
  http://localhost:8042/instances/{instanceId}/preview \
  -o preview.png

# Try to get raw frame data (should work even without codec)
curl -u orthanc:orthanc \
  http://localhost:8042/instances/{instanceId}/frames/0/raw \
  -o frame.raw
```

## Workaround: Use Raw Pixel Data

If you can't install plugins, you can still access the raw pixel data:

```javascript
// Get raw pixel data
const response = await axios.get(
  `${orthancUrl}/instances/${instanceId}/frames/0/raw`,
  { responseType: 'arraybuffer' }
);

// Parse and render manually using your own decoder
// (requires knowing the transfer syntax and implementing decoder)
```

## Current Status

Your DICOM file:
- ✅ Successfully uploaded to Orthanc
- ✅ Stored with ID: `1a430a89-16db2731-8ef19e46-c238c4d3-709cb35d`
- ✅ Metadata accessible via API
- ❌ Cannot render preview (missing codec)

## Next Steps

1. **Immediate**: Use Solution 1 (switch to orthanc-plugins image)
2. **Alternative**: Install GDCM plugin (Solution 2)
3. **Temporary**: Access raw pixel data and decode client-side

## Additional Resources

- Orthanc Transfer Syntaxes: https://book.orthanc-server.com/faq/transcoding.html
- GDCM Plugin: https://book.orthanc-server.com/plugins/gdcm.html
- DICOM Transfer Syntax UIDs: https://dicom.nema.org/medical/dicom/current/output/chtml/part05/chapter_10.html
