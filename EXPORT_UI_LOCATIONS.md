# Export Feature - UI Locations

## Where to Find Export Buttons

### 1. Patient Cards (Main Patients Page)

```
┌─────────────────────────────────────┐
│  👤 John Doe                        │
│  ID: PATIENT123                     │
│  DOB: 1980-01-01                    │
│  Sex: M                             │
│  ┌─────────────────────────────┐   │
│  │ 📥 Export Data              │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Location**: Bottom of each patient card
**Action**: Opens export dialog for that patient
**Exports**: All studies for the patient

### 2. Studies List (All Studies Tab)

```
┌─────────────────────────────────────────────┐
│ 📁 John Doe - CT Scan                  ⬇️ ➡️ │
│    No description                           │
│    🖼️ 150 images • 1 series                │
└─────────────────────────────────────────────┘
```

**Location**: Right side of each study row
**Icon**: Download icon (⬇️)
**Action**: Opens export dialog for that study
**Exports**: Single study only

### 3. Patient Details Dialog

When you click on a patient, a dialog opens showing their studies:

```
┌──────────────────────────────────────────────┐
│  John Doe                              ✕     │
│  Patient ID: PATIENT123                      │
│  DOB: 1980-01-01                             │
├──────────────────────────────────────────────┤
│  Medical Studies (3)                         │
│                                              │
│  ┌────────────────────────────────────┐     │
│  │ CT • CT Scan                  ⬇️ ➡️ │     │
│  │ 🖼️ 150 images • 1 series           │     │
│  │ UID: 1.2.3.4.5.6                   │     │
│  └────────────────────────────────────┘     │
│                                              │
│  ┌────────────────────────────────────┐     │
│  │ MR • MRI Brain                ⬇️ ➡️ │     │
│  │ 🖼️ 200 images • 2 series           │     │
│  │ UID: 1.2.3.4.5.7                   │     │
│  └────────────────────────────────────┘     │
└──────────────────────────────────────────────┘
```

**Location**: Right side of each study card in the dialog
**Icon**: Download icon (⬇️)
**Action**: Opens export dialog for that study
**Exports**: Single study only

## Export Dialog

When you click any export button, this dialog appears:

```
┌──────────────────────────────────────────────┐
│  Export Patient Data                    ✕    │
│  Download complete data package with DICOM   │
├──────────────────────────────────────────────┤
│                                              │
│  ℹ️ This will create a ZIP file containing: │
│    • Complete metadata (JSON format)         │
│    • Patient and study information           │
│    • All DICOM files (.dcm)                  │
│    • Preview images (PNG format)             │
│    • AI analysis results (if available)      │
│                                              │
│  ☑️ Include DICOM images and previews       │
│     Unchecking this will only export         │
│     metadata (smaller file size)             │
│                                              │
│  ┌────────────────────────────────────┐     │
│  │ Export Details:                    │     │
│  │ Type: Patient Data                 │     │
│  │ ID: PATIENT123                     │     │
│  └────────────────────────────────────┘     │
│                                              │
├──────────────────────────────────────────────┤
│              [Cancel]  [📥 Export Data]      │
└──────────────────────────────────────────────┘
```

## Export Options

### Include Images (Checked)
- ✅ DICOM files (.dcm)
- ✅ Preview images (PNG)
- ✅ Complete metadata (JSON)
- 📦 Larger file size
- ⏱️ Takes longer to export

### Metadata Only (Unchecked)
- ✅ Complete metadata (JSON)
- ❌ No DICOM files
- ❌ No preview images
- 📦 Small file size
- ⚡ Fast export

## Export Process

1. **Click Export Button**
   - On patient card, study row, or study card

2. **Choose Options**
   - Check/uncheck "Include DICOM images and previews"
   - Review export details

3. **Click "Export Data"**
   - Button shows "Exporting..." with spinner
   - Export happens in background

4. **Download Starts**
   - ZIP file downloads automatically
   - Filename: `patient_[ID]_export.zip` or `study_[UID]_export.zip`

5. **Success**
   - Dialog closes automatically
   - File is in your Downloads folder

## Visual Indicators

### Export Button States

**Normal State:**
```
┌─────────────────────┐
│ 📥 Export Data      │
└─────────────────────┘
```

**Hover State:**
```
┌─────────────────────┐
│ 📥 Export Data      │  (highlighted)
└─────────────────────┘
```

**Exporting State:**
```
┌─────────────────────┐
│ ⏳ Exporting...     │  (disabled)
└─────────────────────┘
```

### Download Icon States

**Normal:**
⬇️ (gray)

**Hover:**
⬇️ (blue)

**Exporting:**
⏳ (spinning)

## Keyboard Shortcuts

- **Esc**: Close export dialog
- **Enter**: Confirm export (when dialog is open)

## Mobile View

On mobile devices:
- Export buttons are full-width
- Dialog is full-screen
- Touch-friendly button sizes
- Simplified layout

## Accessibility

- ✅ Keyboard navigation supported
- ✅ Screen reader friendly
- ✅ Clear button labels
- ✅ Status announcements
- ✅ Error messages visible

## Tips

💡 **Quick Export**: Click the download icon for fast study export

💡 **Metadata Only**: Uncheck images for quick metadata backup

💡 **Bulk Export**: Export patient to get all their studies at once

💡 **File Names**: Exports are named with patient ID or study UID for easy identification
