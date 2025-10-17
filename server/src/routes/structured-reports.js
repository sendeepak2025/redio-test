const express = require('express');
const router = express.Router();
const structuredReportController = require('../controllers/structuredReportController');
const { authenticate } = require('../middleware/authMiddleware');

/**
 * Structured Reporting API Routes
 * All routes require authentication
 */

// Create or update a structured report
router.post('/',
  
  structuredReportController.saveReport
);

// Get reports by study
router.get('/study/:studyInstanceUID',
  
  structuredReportController.getReportsByStudy
);

// Get reports by patient
router.get('/patient/:patientID',
  
  structuredReportController.getReportsByPatient
);

// Get reports by current radiologist
router.get('/my-reports',
  
  structuredReportController.getReportsByRadiologist
);

// Get report statistics
router.get('/stats',
  
  structuredReportController.getReportStats
);

// Get specific report by ID
router.get('/:reportId',
  
  structuredReportController.getReportById
);

// Export report
router.get('/:reportId/export',
  
  structuredReportController.exportReport
);

// Delete (cancel) report
router.delete('/:reportId',
  
  structuredReportController.deleteReport
);

module.exports = router;
