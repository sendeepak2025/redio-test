const multer = require('multer');
const Study = require('../models/Study');
const Series = require('../models/Series');
const Instance = require('../models/Instance');
const { generateUID } = require('../utils/uid');
const dicomParser = require('dicom-parser');
const { getUnifiedOrthancService } = require('../services/unified-orthanc-service');

const upload = multer({ storage: multer.memoryStorage() });

function uploadMiddleware() {
  return upload.single('file');
}

function parseDicomMetadata(buffer) {
  try {
    const dataSet = dicomParser.parseDicom(buffer);
    const readStr = (tag, defVal = '') => {
      try { return dataSet.string(tag) || defVal; } catch { return defVal; }
    };
    const readInt = (tag, defVal = 0) => {
      try { return dataSet.intString(tag) ?? defVal; } catch { return defVal; }
    };

    const studyInstanceUID = readStr('x0020000D', generateUID());
    const seriesInstanceUID = readStr('x0020000E', generateUID());
    const sopInstanceUID = readStr('x00080018', generateUID());

    const patientName = readStr('x00100010', 'Unknown');
    const patientID = readStr('x00100020', 'Unknown');
    const patientBirthDate = readStr('x00100030', '');
    const patientSex = readStr('x00100040', '');
    const studyDate = readStr('x00080020', '');
    const studyTime = readStr('x00080030', '');
    const studyDescription = readStr('x00081030', '');
    const modality = readStr('x00080060', 'OT');

    const rows = readInt('x00280010', 0);
    const cols = readInt('x00280011', 0);
    const samplesPerPixel = readInt('x00280002', 1);
    const bitsAllocated = readInt('x00280100', 8);
    const numberOfFrames = readInt('x00280008', 1) || 1;
    const photometricInterpretation = readStr('x00280004', 'MONOCHROME2');

    const pixelDataElement = dataSet.elements.x7fe00010;
    const pixelDataOffset = pixelDataElement ? pixelDataElement.dataOffset : null;

    return {
      studyInstanceUID,
      seriesInstanceUID,
      sopInstanceUID,
      patientName,
      patientID,
      patientBirthDate,
      patientSex,
      studyDate,
      studyTime,
      studyDescription,
      modality,
      rows,
      cols,
      samplesPerPixel,
      bitsAllocated,
      numberOfFrames,
      photometricInterpretation,
      dataSet,
      pixelDataOffset
    };
  } catch (e) {
    // If parsing fails, return minimal metadata
    return {
      studyInstanceUID: generateUID(),
      seriesInstanceUID: generateUID(),
      sopInstanceUID: generateUID(),
      patientName: 'Unknown',
      patientID: 'Unknown',
      patientBirthDate: '',
      patientSex: '',
      studyDate: '',
      studyTime: '',
      studyDescription: '',
      modality: 'OT',
      rows: 0,
      cols: 0,
      samplesPerPixel: 1,
      bitsAllocated: 8,
      numberOfFrames: 1,
      photometricInterpretation: 'MONOCHROME2',
      dataSet: null,
      pixelDataOffset: null
    };
  }
}



async function handleUpload(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Check MongoDB connection
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ MongoDB not connected! Connection state:', mongoose.connection.readyState);
      return res.status(500).json({
        success: false,
        message: 'Database not connected. Please check MongoDB connection.'
      });
    }

    const buffer = req.file.buffer;

    // Parse DICOM metadata from uploaded file
    const meta = parseDicomMetadata(buffer);
    const { studyInstanceUID, seriesInstanceUID, sopInstanceUID } = meta;

    // Allow overriding patient info from form-data fields
    const overridePatientID = (req.body && req.body.patientID) ? String(req.body.patientID) : null;
    const overridePatientName = (req.body && req.body.patientName) ? String(req.body.patientName) : null;
    if (overridePatientID) meta.patientID = overridePatientID;
    if (overridePatientName) meta.patientName = overridePatientName;

    console.log(`📤 Uploading DICOM to Orthanc: ${sopInstanceUID}`);

    // Upload DICOM file directly to Orthanc PACS
    const orthancService = getUnifiedOrthancService();
    let orthancUploadResult;

    try {
      console.log(`   Buffer size: ${buffer.length} bytes`);
      orthancUploadResult = await orthancService.uploadDicomFile(buffer);
      console.log(`✅ Uploaded to Orthanc:`, orthancUploadResult);
    } catch (orthancError) {
      console.error('❌ Failed to upload to Orthanc:', orthancError.message);
      console.error('   Error details:', orthancError);
      console.error('   Stack:', orthancError.stack);
      return res.status(500).json({
        success: false,
        message: `Failed to upload to Orthanc PACS: ${orthancError.message}`,
        error: orthancError.message,
        details: orthancError.response?.data || null
      });
    }

    // Extract Orthanc IDs from upload result
    const orthancInstanceId = orthancUploadResult.ID;
    const orthancStudyId = orthancUploadResult.ParentStudy;
    const orthancSeriesId = orthancUploadResult.ParentSeries;
    const orthancPatientId = orthancUploadResult.ParentPatient;

    // Get frame count from Orthanc
    let frameCount;
    try {
      frameCount = await orthancService.getFrameCount(orthancInstanceId);
      console.log(`📊 Study: ${studyInstanceUID}, Frames: ${frameCount}`);
    } catch (frameError) {
      console.error('❌ Failed to get frame count:', frameError.message);
      // Try to delete the uploaded instance from Orthanc
      try {
        await orthancService.deleteInstance(orthancInstanceId);
        console.log('   Cleaned up Orthanc instance');
      } catch (cleanupError) {
        console.warn('   Could not cleanup Orthanc instance:', cleanupError.message);
      }
      return res.status(500).json({
        success: false,
        message: `Failed to get frame count: ${frameError.message}`
      });
    }

    // Save study metadata to MongoDB
    await Study.updateOne(
      { studyInstanceUID },
      {
        $set: {
          studyInstanceUID,
          patientName: meta.patientName || 'Unknown',
          patientID: meta.patientID || 'Unknown',
          patientBirthDate: meta.patientBirthDate || '',
          patientSex: meta.patientSex || '',
          studyDate: meta.studyDate || '',
          studyTime: meta.studyTime || '',
          modality: meta.modality || 'OT',
          studyDescription: meta.studyDescription || '',
          numberOfSeries: 1,
          numberOfInstances: frameCount,
          orthancStudyId: orthancStudyId
        }
      },
      { upsert: true }
    );

    // Save series metadata to MongoDB
    await Series.updateOne(
      { studyInstanceUID, seriesInstanceUID },
      {
        $set: {
          studyInstanceUID,
          seriesInstanceUID,
          modality: meta.modality || 'OT',
          seriesNumber: 1,
          description: meta.studyDescription || '',
          orthancSeriesId: orthancSeriesId
        }
      },
      { upsert: true }
    );

    // Create instance records (one per frame for multi-frame DICOM)
    const instanceRecords = [];
    for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
      instanceRecords.push({
        studyInstanceUID,
        seriesInstanceUID,
        sopInstanceUID: frameCount > 1 ? `${sopInstanceUID}.frame${frameIndex}` : sopInstanceUID,
        instanceNumber: frameIndex + 1,
        modality: meta.modality || 'OT',
        rows: meta.rows,
        columns: meta.cols,
        numberOfFrames: frameCount,
        // Orthanc storage (primary)
        orthancInstanceId: orthancInstanceId,
        orthancUrl: `${process.env.ORTHANC_URL || 'http://localhost:8042'}/instances/${orthancInstanceId}`,
        orthancFrameIndex: frameIndex,
        orthancStudyId: orthancStudyId,
        orthancSeriesId: orthancSeriesId,
        useOrthancPreview: true
      });
    }

    // Bulk insert instances
    console.log(`💾 Saving ${instanceRecords.length} instance records to MongoDB...`);
    console.log(`   First instance: studyUID=${instanceRecords[0].studyInstanceUID}, orthancInstanceId=${instanceRecords[0].orthancInstanceId}`);

    let insertedInstances;
    try {
      insertedInstances = await Instance.insertMany(instanceRecords, { ordered: false });
      console.log(`✅ Successfully inserted ${insertedInstances.length} instance records in MongoDB`);
    } catch (error) {
      // Ignore duplicate key errors
      if (error.code === 11000) {
        console.warn(`⚠️  Some instances already exist (duplicate key), continuing...`);
        insertedInstances = instanceRecords;
      } else {
        console.error(`❌ Failed to insert instances:`, error);
        throw error;
      }
    }

    // Verify instances were saved
    const savedCount = await Instance.countDocuments({ studyInstanceUID });
    console.log(`✅ Verified: ${savedCount} instances in MongoDB for study ${studyInstanceUID}`);

    // Link study to patient
    try {
      const Patient = require('../models/Patient');
      const pid = meta.patientID || 'Unknown';
      const pnameOverride = (req.body && req.body.patientName) ? String(req.body.patientName) : null;
      const pnameFromDicom = meta.patientName || 'Unknown';

      const existing = await Patient.findOne({ patientID: pid }).lean();
      if (existing) {
        const update = { $addToSet: { studyIds: studyInstanceUID } };
        if (pnameOverride && pnameOverride.trim()) {
          update.$set = { patientName: pnameOverride.trim() };
        }
        await Patient.updateOne({ patientID: pid }, update, { upsert: true });
      } else {
        await Patient.updateOne(
          { patientID: pid },
          {
            $set: {
              patientID: pid,
              patientName: (pnameOverride && pnameOverride.trim()) ? pnameOverride.trim() : pnameFromDicom,
              orthancPatientId: orthancPatientId
            },
            $addToSet: { studyIds: studyInstanceUID }
          },
          { upsert: true }
        );
      }
    } catch (patientErr) {
      console.warn('Patient linking skipped or failed:', patientErr?.message || patientErr);
    }

    res.json({
      success: true,
      message: `Successfully uploaded DICOM file with ${frameCount} frame(s) to Orthanc PACS`,
      data: {
        studyInstanceUID,
        seriesInstanceUID,
        sopInstanceUID,
        frameCount,
        orthancInstanceId,
        orthancStudyId,
        orthancSeriesId,
        instances: insertedInstances.length || instanceRecords.length,
        patientID: meta.patientID || 'Unknown',
        patientName: meta.patientName || 'Unknown',
        storage: 'orthanc-pacs'
      }
    });
  } catch (e) {
    console.error('Upload failed:', e);
    res.status(500).json({ success: false, message: e.message });
  }
}

module.exports = { uploadMiddleware, handleUpload };