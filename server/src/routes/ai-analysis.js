/**
 * AI Analysis Routes
 * Unified routing for all AI analysis operations
 */

const express = require('express');
const router = express.Router();
const aiAnalysisController = require('../controllers/aiAnalysisController');

// Main analysis endpoint
router.post('/analyze', aiAnalysisController.analyze);

// Get analysis status
router.get('/analysis/:analysisId/status', aiAnalysisController.getStatus);

// Get all analyses for a study
router.get('/study/:studyUID/analyses', aiAnalysisController.getStudyAnalyses);

// Cancel ongoing analysis
router.post('/analysis/:analysisId/cancel', aiAnalysisController.cancelAnalysis);

// Generate consolidated report
router.post('/report/consolidated', aiAnalysisController.generateConsolidatedReport);

// Download report
router.get('/report/:analysisId/download', aiAnalysisController.downloadReport);

// Save analysis results (from frontend direct processing)
router.post('/save-analysis', aiAnalysisController.saveAnalysis);

module.exports = router;
