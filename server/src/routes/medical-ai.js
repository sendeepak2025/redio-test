const express = require('express');
const router = express.Router();
const { getMedicalAIService } = require('../services/medical-ai-service');
const { getFrameCacheService } = require('../services/frame-cache-service');

/**
 * Medical AI Routes
 * Endpoints for MedSigLIP and MedGemma integration
 */

/**
 * POST /api/medical-ai/analyze-study
 * Comprehensive AI analysis of a study
 */
router.post('/analyze-study', async (req, res) => {
  try {
    const { studyInstanceUID, frameIndex = 0, patientContext = {} } = req.body;

    if (!studyInstanceUID) {
      return res.status(400).json({
        success: false,
        message: 'studyInstanceUID is required'
      });
    }

    // Get frame image
    const frameCacheService = getFrameCacheService();
    const frameBuffer = await frameCacheService.getFrame(studyInstanceUID, frameIndex);

    if (!frameBuffer) {
      return res.status(404).json({
        success: false,
        message: 'Frame not found'
      });
    }

    // Get study metadata for modality
    const Study = require('../models/Study');
    const study = await Study.findOne({ studyInstanceUID }).lean();
    const modality = study?.modality || 'OT';

    // Perform AI analysis
    const medicalAIService = getMedicalAIService();
    const results = await medicalAIService.analyzeStudy(
      studyInstanceUID,
      frameBuffer,
      modality,
      patientContext
    );

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('AI analysis failed:', error);
    res.status(500).json({
      success: false,
      message: 'AI analysis failed',
      error: error.message
    });
  }
});

/**
 * POST /api/medical-ai/classify-image
 * Fast image classification with MedSigLIP
 */
router.post('/classify-image', async (req, res) => {
  try {
    const { studyInstanceUID, frameIndex = 0 } = req.body;

    if (!studyInstanceUID) {
      return res.status(400).json({
        success: false,
        message: 'studyInstanceUID is required'
      });
    }

    // Get frame image
    const frameCacheService = getFrameCacheService();
    const frameBuffer = await frameCacheService.getFrame(studyInstanceUID, frameIndex);

    if (!frameBuffer) {
      return res.status(404).json({
        success: false,
        message: 'Frame not found'
      });
    }

    // Get modality
    const Study = require('../models/Study');
    const study = await Study.findOne({ studyInstanceUID }).lean();
    const modality = study?.modality || 'OT';

    // Classify image
    const medicalAIService = getMedicalAIService();
    const classification = await medicalAIService.classifyImage(frameBuffer, modality);

    if (!classification) {
      return res.status(503).json({
        success: false,
        message: 'MedSigLIP service unavailable'
      });
    }

    res.json({
      success: true,
      data: classification
    });
  } catch (error) {
    console.error('Image classification failed:', error);
    res.status(500).json({
      success: false,
      message: 'Image classification failed',
      error: error.message
    });
  }
});

/**
 * POST /api/medical-ai/generate-report
 * Generate radiology report with MedGemma
 */
router.post('/generate-report', async (req, res) => {
  try {
    const { studyInstanceUID, frameIndex = 0, patientContext = {} } = req.body;

    if (!studyInstanceUID) {
      return res.status(400).json({
        success: false,
        message: 'studyInstanceUID is required'
      });
    }

    // Get frame image
    const frameCacheService = getFrameCacheService();
    const frameBuffer = await frameCacheService.getFrame(studyInstanceUID, frameIndex);

    if (!frameBuffer) {
      return res.status(404).json({
        success: false,
        message: 'Frame not found'
      });
    }

    // Get modality
    const Study = require('../models/Study');
    const study = await Study.findOne({ studyInstanceUID }).lean();
    const modality = study?.modality || 'OT';

    // Generate report
    const medicalAIService = getMedicalAIService();
    const report = await medicalAIService.generateRadiologyReport(
      frameBuffer,
      modality,
      patientContext
    );

    if (!report) {
      return res.status(503).json({
        success: false,
        message: 'MedGemma service unavailable'
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Report generation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Report generation failed',
      error: error.message
    });
  }
});

/**
 * POST /api/medical-ai/find-similar
 * Find similar images using MedSigLIP
 */
router.post('/find-similar', async (req, res) => {
  try {
    const { studyInstanceUID, frameIndex = 0, topK = 5 } = req.body;

    if (!studyInstanceUID) {
      return res.status(400).json({
        success: false,
        message: 'studyInstanceUID is required'
      });
    }

    // Get frame image
    const frameCacheService = getFrameCacheService();
    const frameBuffer = await frameCacheService.getFrame(studyInstanceUID, frameIndex);

    if (!frameBuffer) {
      return res.status(404).json({
        success: false,
        message: 'Frame not found'
      });
    }

    // Get modality
    const Study = require('../models/Study');
    const study = await Study.findOne({ studyInstanceUID }).lean();
    const modality = study?.modality || 'OT';

    // Find similar images
    const medicalAIService = getMedicalAIService();
    const similarImages = await medicalAIService.findSimilarImages(
      frameBuffer,
      modality,
      topK
    );

    res.json({
      success: true,
      data: {
        query: { studyInstanceUID, frameIndex },
        similarImages
      }
    });
  } catch (error) {
    console.error('Similar image search failed:', error);
    res.status(500).json({
      success: false,
      message: 'Similar image search failed',
      error: error.message
    });
  }
});

/**
 * POST /api/medical-ai/summarize-text
 * Summarize medical text with MedGemma
 */
router.post('/summarize-text', async (req, res) => {
  try {
    const { text, summaryType = 'brief' } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'text is required'
      });
    }

    const medicalAIService = getMedicalAIService();
    const summary = await medicalAIService.summarizeMedicalText(text, summaryType);

    if (!summary) {
      return res.status(503).json({
        success: false,
        message: 'MedGemma service unavailable'
      });
    }

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Text summarization failed:', error);
    res.status(500).json({
      success: false,
      message: 'Text summarization failed',
      error: error.message
    });
  }
});

/**
 * GET /api/medical-ai/health
 * Health check for AI services
 */
router.get('/health', async (req, res) => {
  try {
    const medicalAIService = getMedicalAIService();
    const health = await medicalAIService.healthCheck();

    const allAvailable = Object.values(health).every(service => service.available);

    res.json({
      success: true,
      status: allAvailable ? 'healthy' : 'degraded',
      services: health
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

/**
 * GET /api/medical-ai/study/:studyInstanceUID/analysis
 * Get saved AI analysis for a study
 */
router.get('/study/:studyInstanceUID/analysis', async (req, res) => {
  try {
    const { studyInstanceUID } = req.params;

    const Study = require('../models/Study');
    const study = await Study.findOne({ studyInstanceUID }).lean();

    if (!study) {
      return res.status(404).json({
        success: false,
        message: 'Study not found'
      });
    }

    if (!study.aiAnalysis) {
      return res.status(404).json({
        success: false,
        message: 'No AI analysis available for this study'
      });
    }

    res.json({
      success: true,
      data: study.aiAnalysis
    });
  } catch (error) {
    console.error('Failed to retrieve AI analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve AI analysis',
      error: error.message
    });
  }
});

module.exports = router;
