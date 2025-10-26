const express = require('express');
const router = express.Router();
const StructuredReport = require('../models/StructuredReport');
const AIAnalysis = require('../models/AIAnalysis');
const { authenticate } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for signature uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/signatures');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `signature-${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed for signatures'));
  }
});

/**
 * 🧪 Test route - Check if structured-reports routes are working
 * GET /api/structured-reports/test
 */
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: '✅ Structured Reports API is working!',
    timestamp: new Date().toISOString()
  });
});

/**
 * 🆕 Create draft report from AI analysis
 * POST /api/structured-reports/from-ai/:analysisId
 */
router.post('/from-ai/:analysisId', authenticate, async (req, res) => {
  try {
    const { analysisId } = req.params;
    const { radiologistName, aiFindings, aiClassification, aiConfidence } = req.body;
    
    console.log(`📝 Creating draft report from AI analysis: ${analysisId}`);
    
    // Try to get AI analysis from database
    const aiAnalysis = await AIAnalysis.findOne({ analysisId });
    
    // Extract AI data
    let findings = [];
    let findingsText = '';
    let impression = '';
    let technique = '';
    let aiMetadata = {};
    
    if (aiAnalysis && aiAnalysis.status === 'complete' && aiAnalysis.results) {
      console.log('✅ AI analysis found in DB, extracting data...');
      
      const results = aiAnalysis.results;
      
      // Extract MedSigLIP classification data
      if (results.classification) {
        const classification = results.classification;
        const confidence = results.confidence || 0;
        
        findings.push({
          id: `ai-${Date.now()}-1`,
          type: 'finding',
          category: 'ai-classification',
          description: `Primary Finding: ${classification} (Confidence: ${(confidence * 100).toFixed(1)}%)`,
          severity: confidence > 0.8 ? 'moderate' : confidence > 0.5 ? 'mild' : 'normal',
          frameIndex: aiAnalysis.frameIndex || 0,
          timestamp: new Date()
        });
        
        // Add top predictions if available
        if (results.topPredictions && Array.isArray(results.topPredictions)) {
          const topPreds = results.topPredictions
            .map(p => `${p.label}: ${(p.confidence * 100).toFixed(1)}%`)
            .join(', ');
          
          findings.push({
            id: `ai-${Date.now()}-2`,
            type: 'finding',
            category: 'ai-predictions',
            description: `Top Predictions: ${topPreds}`,
            severity: 'normal',
            frameIndex: aiAnalysis.frameIndex || 0,
            timestamp: new Date()
          });
        }
      }
      
      // Extract MedGemma clinical report
      if (results.findings) {
        findings.push({
          id: `ai-${Date.now()}-3`,
          type: 'finding',
          category: 'ai-clinical-report',
          description: results.findings,
          severity: 'normal',
          frameIndex: aiAnalysis.frameIndex || 0,
          timestamp: new Date()
        });
      }
      
      // Build comprehensive findings text
      findingsText = `🏥 AI MEDICAL ANALYSIS REPORT\n`;
      findingsText += `Powered by MedSigLIP & MedGemma\n`;
      findingsText += `Generated: ${new Date().toLocaleString()}\n`;
      findingsText += `Analysis ID: ${analysisId}\n`;
      findingsText += `Slice Index: ${aiAnalysis.frameIndex || 0}\n\n`;
      
      // Classification section
      if (results.classification) {
        findingsText += `📊 CLASSIFICATION (MedSigLIP)\n`;
        findingsText += `Primary Finding: ${results.classification}\n`;
        findingsText += `Confidence: ${((results.confidence || 0) * 100).toFixed(1)}%\n\n`;
        
        if (results.topPredictions && Array.isArray(results.topPredictions)) {
          findingsText += `Top Predictions:\n`;
          results.topPredictions.forEach(p => {
            findingsText += `  • ${p.label}: ${(p.confidence * 100).toFixed(1)}%\n`;
          });
          findingsText += `\n`;
        }
      }
      
      // Clinical report section
      if (results.findings) {
        findingsText += `📝 CLINICAL REPORT (MedGemma)\n`;
        findingsText += `${results.findings}\n\n`;
      }
      
      // Technique
      technique = `${req.body.modality || 'XA'} imaging was performed using AI-assisted analysis with MedSigLIP and MedGemma models.`;
      
      // Impression
      if (results.classification) {
        impression = `AI Analysis Summary:\n`;
        impression += `Primary Finding: ${results.classification} (${((results.confidence || 0) * 100).toFixed(1)}% confidence)\n`;
        impression += `\nThis is a preliminary AI-generated analysis. `;
        impression += `Radiologist review and clinical correlation are required for final diagnosis.`;
      } else {
        impression = `Preliminary AI analysis completed. Awaiting radiologist review and clinical correlation.`;
      }
      
      // Store AI metadata
      aiMetadata = {
        analysisId: analysisId,
        models: ['MedSigLIP', 'MedGemma'],
        classification: results.classification,
        confidence: results.confidence,
        analyzedAt: aiAnalysis.analyzedAt,
        frameIndex: aiAnalysis.frameIndex
      };
      
    } else {
      // Use data from request body (if analysis not in DB)
      console.log('⚠️  AI analysis not found in DB, using provided data');
      
      if (aiClassification) {
        findings.push({
          id: `ai-${Date.now()}-1`,
          type: 'finding',
          category: 'ai-detected',
          description: `AI Classification: ${aiClassification}`,
          severity: (aiConfidence || 0) > 0.8 ? 'moderate' : 'mild',
          frameIndex: 0,
          timestamp: new Date()
        });
      }
      
      findingsText = aiFindings || 'AI analysis completed. Awaiting detailed findings.';
      impression = 'Preliminary AI analysis completed. Awaiting radiologist review.';
      technique = `${req.body.modality || 'CT'} imaging performed.`;
    }
    
    // Create draft report
    const report = new StructuredReport({
      studyInstanceUID: req.body.studyInstanceUID || aiAnalysis?.studyInstanceUID || 'UNKNOWN',
      patientID: req.body.patientID || 'UNKNOWN',
      patientName: req.body.patientName || 'Unknown Patient',
      modality: req.body.modality || 'CT',
      reportStatus: 'draft',
      radiologistId: req.user.userId,
      radiologistName: radiologistName || req.user.username || 'Radiologist',
      findings,
      findingsText,
      impression,
      technique,
      reportDate: new Date(),
      tags: ['AI-Generated', 'MedSigLIP', 'MedGemma'],
      // Store AI metadata in a custom field (if your schema supports it)
      // aiMetadata: aiMetadata
    });
    
    await report.save();
    
    // Link report to AI analysis (if exists)
    if (aiAnalysis) {
      aiAnalysis.linkedReportId = report._id;
      aiAnalysis.workflowStatus = 'draft';
      await aiAnalysis.save();
    }
    
    console.log(`✅ Draft report created: ${report.reportId}`);
    console.log(`📝 Findings text length: ${findingsText?.length || 0}`);
    console.log(`💡 Impression length: ${impression?.length || 0}`);
    console.log(`🔬 Technique length: ${technique?.length || 0}`);
    
    const reportObject = report.toObject();
    console.log(`📤 Sending report with findingsText: ${reportObject.findingsText?.substring(0, 100)}...`);
    
    res.json({
      success: true,
      report: reportObject,
      message: 'Draft report created from AI analysis'
    });
    
  } catch (error) {
    console.error('❌ Error creating draft report:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 📝 Update report (radiologist edits)
 * PUT /api/structured-reports/:reportId
 */
router.put('/:reportId', authenticate, async (req, res) => {
  try {
    const { reportId } = req.params;
    const updates = req.body;
    
    console.log(`📝 Updating report: ${reportId}`);
    
    const report = await StructuredReport.findOne({ reportId });
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Only allow updates if not final
    if (report.reportStatus === 'final') {
      return res.status(400).json({ error: 'Cannot edit finalized report' });
    }
    
    // Update allowed fields
    const allowedFields = [
      'findings', 'measurements', 'annotations',
      'clinicalHistory', 'technique', 'comparison',
      'findingsText', 'impression', 'recommendations',
      'keyImages', 'tags', 'priority'
    ];
    
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        report[field] = updates[field];
      }
    });
    
    // Add to revision history
    report.revisionHistory.push({
      revisedBy: req.user.username,
      revisedAt: new Date(),
      changes: 'Report updated',
      previousStatus: report.reportStatus
    });
    
    await report.save();
    
    console.log(`✅ Report updated: ${reportId}`);
    
    res.json({
      success: true,
      report: report.toObject()
    });
    
  } catch (error) {
    console.error('❌ Error updating report:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * ✍️ Sign and finalize report
 * POST /api/structured-reports/:reportId/sign
 */
router.post('/:reportId/sign', authenticate, upload.single('signature'), async (req, res) => {
  try {
    const { reportId } = req.params;
    const { signatureText } = req.body;
    
    console.log(`✍️ Signing report: ${reportId}`);
    
    const report = await StructuredReport.findOne({ reportId });
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Update signature
    if (req.file) {
      report.radiologistSignatureUrl = `/uploads/signatures/${req.file.filename}`;
      report.radiologistSignaturePublicId = req.file.filename;
    }
    
    if (signatureText) {
      report.radiologistSignature = signatureText;
    }
    
    // Finalize report
    report.reportStatus = 'final';
    report.signedAt = new Date();
    report.version += 1;
    
    // Add to revision history
    report.revisionHistory.push({
      revisedBy: req.user.username,
      revisedAt: new Date(),
      changes: 'Report signed and finalized',
      previousStatus: 'draft'
    });
    
    await report.save();
    
    // Update linked AI analysis
    if (report.studyInstanceUID) {
      await AIAnalysis.updateMany(
        { studyInstanceUID: report.studyInstanceUID, linkedReportId: report._id },
        { workflowStatus: 'final' }
      );
    }
    
    console.log(`✅ Report signed: ${reportId}`);
    
    res.json({
      success: true,
      report: report.toObject(),
      message: 'Report signed and finalized'
    });
    
  } catch (error) {
    console.error('❌ Error signing report:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 📋 Get report history for a study
 * GET /api/structured-reports/study/:studyInstanceUID
 */
router.get('/study/:studyInstanceUID', authenticate, async (req, res) => {
  try {
    const { studyInstanceUID } = req.params;
    
    console.log(`📋 Fetching report history for study: ${studyInstanceUID}`);
    
    const reports = await StructuredReport.find({ studyInstanceUID })
      .sort({ reportDate: -1 })
      .select('reportId reportDate reportStatus radiologistName signedAt modality studyDescription version');
    
    res.json({
      success: true,
      count: reports.length,
      reports
    });
    
  } catch (error) {
    console.error('❌ Error fetching report history:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 📄 Get single report
 * GET /api/structured-reports/:reportId
 */
router.get('/:reportId', authenticate, async (req, res) => {
  try {
    const { reportId } = req.params;
    
    const report = await StructuredReport.findOne({ reportId });
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json({
      success: true,
      report: report.toObject()
    });
    
  } catch (error) {
    console.error('❌ Error fetching report:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 📥 Download report as PDF
 * GET /api/structured-reports/:reportId/pdf
 */
router.get('/:reportId/pdf', authenticate, async (req, res) => {
  try {
    const { reportId } = req.params;
    
    const report = await StructuredReport.findOne({ reportId });
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Generate PDF (simplified version - you can enhance this)
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report-${reportId}.pdf"`);
    
    doc.pipe(res);
    
    // Header
    doc.fontSize(20).text('Medical Report', { align: 'center' });
    doc.moveDown();
    
    // Patient Info
    doc.fontSize(12).text(`Patient: ${report.patientName}`);
    doc.text(`Patient ID: ${report.patientID}`);
    doc.text(`Study: ${report.studyDescription || 'N/A'}`);
    doc.text(`Date: ${report.reportDate.toLocaleDateString()}`);
    doc.moveDown();
    
    // Findings
    doc.fontSize(14).text('Findings:', { underline: true });
    doc.fontSize(11).text(report.findingsText || 'No findings documented');
    doc.moveDown();
    
    // Impression
    doc.fontSize(14).text('Impression:', { underline: true });
    doc.fontSize(11).text(report.impression || 'No impression documented');
    doc.moveDown();
    
    // Signature
    doc.fontSize(12).text(`Signed by: ${report.radiologistName}`);
    if (report.signedAt) {
      doc.text(`Date: ${report.signedAt.toLocaleDateString()}`);
    }
    
    if (report.radiologistSignature) {
      doc.text(`Signature: ${report.radiologistSignature}`);
    }
    
    doc.end();
    
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
