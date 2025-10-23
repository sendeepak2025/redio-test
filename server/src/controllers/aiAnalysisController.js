/**
 * AI Analysis Controller
 * Unified endpoint for all AI analysis operations
 * Handles both single image and multi-slice analysis
 */

const { getAIAnalysisOrchestrator } = require('../services/ai-analysis-orchestrator');

class AIAnalysisController {
  /**
   * Main analysis endpoint - routes to appropriate handler
   * POST /api/medical-ai/analyze
   */
  async analyze(req, res) {
    try {
      const {
        type,
        studyInstanceUID,
        seriesInstanceUID,
        instanceUID,
        frameIndex,
        frameCount,
        sampleRate = 1,
        options = {}
      } = req.body;

      // Validation
      if (!type || !studyInstanceUID) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: type, studyInstanceUID'
        });
      }

      if (!['single', 'multi-slice'].includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid type. Must be "single" or "multi-slice"'
        });
      }

      // Get orchestrator
      const orchestrator = getAIAnalysisOrchestrator();

      // Route to appropriate handler
      let result;
      if (type === 'single') {
        result = await orchestrator.analyzeSingleImage({
          studyInstanceUID,
          seriesInstanceUID,
          instanceUID,
          frameIndex: frameIndex || 0,
          options
        });
      } else {
        result = await orchestrator.analyzeMultiSlice({
          studyInstanceUID,
          seriesInstanceUID,
          frameCount,
          sampleRate,
          options
        });
      }

      res.json(result);

    } catch (error) {
      console.error('AI Analysis error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'AI analysis failed'
      });
    }
  }

  /**
   * Get analysis status
   * GET /api/medical-ai/analysis/:analysisId/status
   */
  async getStatus(req, res) {
    try {
      const { analysisId } = req.params;

      const orchestrator = getAIAnalysisOrchestrator();
      const status = await orchestrator.getAnalysisStatus(analysisId);

      if (!status) {
        return res.status(404).json({
          success: false,
          error: 'Analysis not found'
        });
      }

      res.json(status);

    } catch (error) {
      console.error('Get status error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get saved analyses for a study
   * GET /api/medical-ai/study/:studyUID/analyses
   */
  async getStudyAnalyses(req, res) {
    try {
      const { studyUID } = req.params;

      const orchestrator = getAIAnalysisOrchestrator();
      const analyses = await orchestrator.getStudyAnalyses(studyUID);

      res.json({
        success: true,
        studyInstanceUID: studyUID,
        analyses
      });

    } catch (error) {
      console.error('Get study analyses error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Cancel ongoing analysis
   * POST /api/medical-ai/analysis/:analysisId/cancel
   */
  async cancelAnalysis(req, res) {
    try {
      const { analysisId } = req.params;

      const orchestrator = getAIAnalysisOrchestrator();
      const result = await orchestrator.cancelAnalysis(analysisId);

      res.json(result);

    } catch (error) {
      console.error('Cancel analysis error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Generate consolidated report from multiple analyses
   * POST /api/ai/report/consolidated
   */
  async generateConsolidatedReport(req, res) {
    try {
      const { studyInstanceUID, analysisIds, slices } = req.body;

      if (!studyInstanceUID || !analysisIds || analysisIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      const orchestrator = getAIAnalysisOrchestrator();
      const report = await orchestrator.generateConsolidatedReport({
        studyInstanceUID,
        analysisIds,
        slices
      });

      res.json({
        success: true,
        reportId: report.reportId,
        downloadUrl: `/api/ai/report/${report.reportId}/download`
      });

    } catch (error) {
      console.error('Generate consolidated report error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Download report as PDF
   * GET /api/ai/report/:analysisId/download
   */
  async downloadReport(req, res) {
    try {
      const { analysisId } = req.params;

      const orchestrator = getAIAnalysisOrchestrator();
      const pdfBuffer = await orchestrator.generateReportPDF(analysisId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="AI_Report_${analysisId}.pdf"`);
      res.send(pdfBuffer);

    } catch (error) {
      console.error('Download report error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Save analysis results (from frontend direct processing)
   * POST /api/ai/save-analysis
   */
  async saveAnalysis(req, res) {
    try {
      const {
        studyInstanceUID,
        seriesInstanceUID,
        frameIndex,
        results,
        analyzedAt
      } = req.body;

      // Validation
      if (!studyInstanceUID || frameIndex === undefined || !results) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: studyInstanceUID, frameIndex, results'
        });
      }

      // Generate analysis ID
      const date = new Date().toISOString().split('T')[0];
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      const analysisId = `AI-${date}-${random}`;

      // Save to database
      const AIAnalysis = require('../models/AIAnalysis');
      const analysis = new AIAnalysis({
        analysisId,
        type: 'single',
        studyInstanceUID,
        seriesInstanceUID,
        frameIndex,
        status: 'complete',
        results,
        analyzedAt: analyzedAt || new Date(),
        completedAt: new Date()
      });

      await analysis.save();

      console.log(`✅ Analysis saved to database: ${analysisId}`);

      res.json({
        success: true,
        analysisId,
        message: 'Analysis saved successfully'
      });

    } catch (error) {
      console.error('Save analysis error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new AIAnalysisController();
