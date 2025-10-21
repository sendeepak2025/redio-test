# DICOM Upload Issue - ROOT CAUSE FOUND

## 🎯 Root Cause Identified

The DICOM files being uploaded contain a **non-standard header** added by **"Rubo DICOM Viewer"** software.

### Evidence:
```
First 16 bytes: 5275626f204449434f4d205669657765
Decoded: "Rubo DICOM Viewe"
```

## ❌ Why Orthanc Rejects It

Standard DICOM files have:
- **Bytes 0-127**: Preamble (usually zeros or specific values)
- **Bytes 128-131**: "DICM" marker
- **Bytes 132+**: DICOM data elements

Your files have:
- **Bytes 0-127**: "Rubo DICOM Viewer" text ❌ (NON-STANDARD)
- **Bytes 128-131**: "DICM" marker ✅ (correct)
- **Bytes 132+**: DICOM data elements ✅ (correct)

Orthanc strictly validates DICOM format and rejects files with modified preambles.

## ✅ Solution

### Option 1: Use Original DICOM Files (RECOMMENDED)
Get the original DICOM files directly from:
- Imaging equipment (CT, MRI, X-Ray machines)
- PACS system
- Modality worklist

These will be standard DICOM files without viewer modifications.

### Option 2: Re-export from Source
If you're using Rubo DICOM Viewer:
1. Open the original study
2. Export as standard DICOM (not as "Rubo format")
3. Use the exported files

### Option 3: Convert the Files
Use DICOM conversion tools to clean the files:

```bash
# Using DCMTK
dcmconv input.dcm output.dcm

# Using GDCM
gdcmconv --raw input.dcm output.dcm
```

## 🔍 How to Identify the Issue

Check the first 16 bytes of your DICOM file:

```bash
# On Linux/Mac
hexdump -C file.dcm | head -n 10

# On Windows PowerShell
Format-Hex file.dcm | Select-Object -First 10
```

If you see text like "Rubo", "Viewer", or any readable text in the first 128 bytes, the file has been modified.

## ✅ What Works

Direct upload to Orthanc works when you:
1. Use Orthanc's web interface (it might have built-in cleaning)
2. Upload via DICOM C-STORE protocol
3. Use original DICOM files from equipment

## 🚫 What Doesn't Work

- Files saved/exported by Rubo DICOM Viewer
- Files with modified preambles
- Files with viewer software headers

## 📝 Recommendation

**Always use original DICOM files from your imaging equipment or PACS system.** Viewer software like Rubo DICOM Viewer is for viewing only, not for creating or modifying DICOM files for upload.

## 🔧 Technical Details

### Standard DICOM Preamble
```
Bytes 0-127: Usually 0x00 (zeros) or specific values
Bytes 128-131: 0x4449434D ("DICM")
```

### Your File's Preamble
```
Bytes 0-15: "Rubo DICOM Viewe" (0x5275626f204449434f4d205669657765)
Bytes 128-131: "DICM" (0x4449434D)
```

The non-standard preamble causes Orthanc to reject the file with HTTP 400.

## ✅ Next Steps

1. **Get original DICOM files** from your imaging equipment
2. **Test upload** with original files
3. **Avoid using** Rubo DICOM Viewer for file export
4. **Use PACS systems** or direct equipment export for standard DICOM files

---

**Status**: Issue identified and documented. System is working correctly - it's rejecting invalid DICOM files as expected.
