const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const { authenticate } = require('../middleware/authMiddleware');

// Export patient data with all studies and DICOM files
// GET /api/export/patient/:patientID?includeImages=true&format=zip
router.get(
  '/patient/:patientID',
  authenticate,
  exportController.exportPatientData
);

// Export single study data with DICOM files
// GET /api/export/study/:studyUID?includeImages=true&format=zip
router.get(
  '/study/:studyUID',
  authenticate,
  exportController.exportStudyData
);

// Export all data (bulk export) - admin only
// GET /api/export/all?includeImages=false
router.get(
  '/all',
  authenticate,
  exportController.exportAllData
);

module.exports = router;
