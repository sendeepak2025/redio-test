const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const { authenticationMiddleware } = require('../services/auth-service');

// Export patient data with all studies and DICOM files
// GET /api/export/patient/:patientID?includeImages=true&format=zip
router.get(
  '/patient/:patientID',
  authenticationMiddleware(),
  exportController.exportPatientData
);

// Export single study data with DICOM files
// GET /api/export/study/:studyUID?includeImages=true&format=zip
router.get(
  '/study/:studyUID',
  authenticationMiddleware(),
  exportController.exportStudyData
);

// Export all data (bulk export) - admin only
// GET /api/export/all?includeImages=false
router.get(
  '/all',
  authenticationMiddleware(),
  exportController.exportAllData
);

module.exports = router;
