# Export Feature - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Restart the Server
The export routes need to be loaded:

```bash
cd server
npm start
```

### Step 2: Open the Application
Navigate to the Patients page:

```
http://localhost:5173/patients
```

### Step 3: Export Data
Click "Export Data" on any patient card!

---

## 📦 What You Get

When you export, you'll download a ZIP file containing:

✅ **Complete Metadata** (JSON format)
- Patient information
- Study details
- Instance data
- AI analysis results

✅ **DICOM Files** (.dcm format)
- Original medical images
- Full DICOM headers
- All metadata intact

✅ **Preview Images** (PNG format)
- Easy-to-view snapshots
- All frames included
- High quality

---

## 🎯 Common Use Cases

### Backup Patient Data
```
1. Go to Patients page
2. Click "Export Data" on patient
3. Keep "Include images" checked
4. Click "Export Data"
5. Save ZIP file to backup location
```

### Quick Metadata Export
```
1. Go to Patients page
2. Click "Export Data" on patient
3. Uncheck "Include images"
4. Click "Export Data"
5. Get small JSON file instantly
```

### Export Single Study
```
1. Go to Studies tab
2. Click download icon on study
3. Choose options
4. Click "Export Data"
5. Get study ZIP file
```

---

## 📍 Where to Find Export Buttons

### Patient Cards
```
┌─────────────────────┐
│  👤 John Doe        │
│  ID: PATIENT123     │
│  ┌───────────────┐  │
│  │ Export Data   │  │ ← Click here
│  └───────────────┘  │
└─────────────────────┘
```

### Study Rows
```
┌──────────────────────────────┐
│ 📁 CT Scan          ⬇️ ➡️    │ ← Click download icon
└──────────────────────────────┘
```

---

## 🔧 Troubleshooting

### Export Button Not Showing?
- Refresh the page
- Check if you're logged in
- Verify server is running

### Export Fails?
- Check Orthanc is running
- Verify MongoDB is connected
- Check browser console for errors

### Download Doesn't Start?
- Check browser download settings
- Try different browser
- Check disk space

---

## 📚 More Information

- **Full Guide**: See `DATA_EXPORT_GUIDE.md`
- **API Examples**: See `EXPORT_API_EXAMPLES.md`
- **Testing**: See `EXPORT_TESTING_CHECKLIST.md`
- **UI Locations**: See `EXPORT_UI_LOCATIONS.md`

---

## 💡 Pro Tips

**Tip 1**: Use metadata-only export for quick backups
**Tip 2**: Export patient to get all their studies at once
**Tip 3**: Exported files are named with IDs for easy identification
**Tip 4**: ZIP files are compressed to save space
**Tip 5**: All exports are logged for audit purposes

---

## 🎉 That's It!

You're ready to start exporting data. It's that simple!

Need help? Check the documentation files or contact support.
