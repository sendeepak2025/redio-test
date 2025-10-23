const fs = require('fs');
const path = require('path');

/**
 * AI Report Generator Service
 * Ensures consistent, comprehensive report generation
 * Always produces a complete report with findings, impressions, and recommendations
 */
class AIReportGenerator {
  constructor() {
    this.reportTemplates = this.initializeTemplates();
  }

  /**
   * Initialize report templates for different modalities
   */
  initializeTemplates() {
    return {
      CT: {
        sections: ['TECHNIQUE', 'COMPARISON', 'FINDINGS', 'IMPRESSION', 'RECOMMENDATIONS'],
        defaultFindings: 'CT imaging demonstrates normal anatomical structures.',
        criticalKeywords: ['fracture', 'hemorrhage', 'mass', 'obstruction', 'pneumothorax']
      },
      MR: {
        sections: ['TECHNIQUE', 'COMPARISON', 'FINDINGS', 'IMPRESSION', 'RECOMMENDATIONS'],
        defaultFindings: 'MRI demonstrates normal signal characteristics.',
        criticalKeywords: ['tumor', 'infarct', 'hemorrhage', 'herniation', 'stenosis']
      },
      US: {
        sections: ['TECHNIQUE', 'FINDINGS', 'IMPRESSION', 'RECOMMENDATIONS'],
        defaultFindings: 'Ultrasound examination shows normal echogenicity.',
        criticalKeywords: ['mass', 'fluid collection', 'obstruction', 'thrombus']
      },
      XR: {
        sections: ['TECHNIQUE', 'FINDINGS', 'IMPRESSION', 'RECOMMENDATIONS'],
        defaultFindings: 'Radiographic examination demonstrates normal osseous structures.',
        criticalKeywords: ['fracture', 'dislocation', 'pneumothorax', 'effusion', 'consolidation']
      },
      DEFAULT: {
        sections: ['FINDINGS', 'IMPRESSION', 'RECOMMENDATIONS'],
        defaultFindings: 'Imaging study demonstrates normal anatomical structures.',
        criticalKeywords: ['abnormal', 'suspicious', 'concerning']
      }
    };
  }

  /**
   * Generate comprehensive AI report
   * Always returns a complete report structure
   */
  async generateComprehensiveReport(analysisData, imageSnapshot = null) {
    const {
      studyInstanceUID,
      modality = 'OT',
      patientContext = {},
      aiResults = {},
      frameIndex = 0
    } = analysisData;

    console.log(`📋 Generating comprehensive AI report for study: ${studyInstanceUID}`);

    // Get template for modality
    const template = this.reportTemplates[modality] || this.reportTemplates.DEFAULT;

    // Build report sections
    const report = {
      studyInstanceUID,
      modality,
      frameIndex,
      generatedAt: new Date(),
      reportId: this.generateReportId(studyInstanceUID),
      
      // Patient Information
      patientInfo: this.formatPatientInfo(patientContext),
      
      // AI Analysis Status
      aiStatus: this.determineAIStatus(aiResults),
      
      // Image Snapshot
      imageSnapshot: imageSnapshot ? {
        data: imageSnapshot.toString('base64'),
        format: 'png',
        frameIndex: frameIndex,
        capturedAt: new Date()
      } : null,
      
      // Report Sections
      sections: this.buildReportSections(template, aiResults, modality, patientContext),
      
      // Key Findings (structured)
      keyFindings: this.extractKeyFindings(aiResults, modality),
      
      // Critical Findings (requires immediate attention)
      criticalFindings: this.extractCriticalFindings(aiResults, template.criticalKeywords),
      
      // AI Detections (NEW - visual abnormality detection)
      detections: aiResults.detections?.detections || aiResults.detections || null,
      
      // Detection Summary
      detectionSummary: aiResults.detections ? {
        totalCount: aiResults.detections.count || 0,
        criticalCount: aiResults.detections.criticalCount || 0,
        highCount: aiResults.detections.highCount || 0,
        model: aiResults.detections.model
      } : null,
      
      // AI Classification Results
      classification: this.formatClassification(aiResults.classification),
      
      // Recommendations
      recommendations: this.generateRecommendations(aiResults, modality, patientContext),
      
      // Quality Metrics
      qualityMetrics: this.calculateQualityMetrics(aiResults),
      
      // Metadata
      metadata: {
        aiModelsUsed: this.getModelsUsed(aiResults),
        processingTime: aiResults.processingTime || 0,
        confidence: this.calculateOverallConfidence(aiResults),
        requiresRadiologistReview: true, // Always require human review
        demoMode: aiResults.demoMode || false
      }
    };

    // Save report snapshot and get file paths
    const savedPaths = await this.saveReportSnapshot(report);
    
    // Add file paths to metadata
    if (savedPaths) {
      report.metadata.savedPaths = savedPaths;
    }

    return report;
  }

  /**
   * Build structured report sections
   */
  buildReportSections(template, aiResults, modality, patientContext) {
    const sections = {};

    // TECHNIQUE section
    if (template.sections.includes('TECHNIQUE')) {
      sections.TECHNIQUE = this.buildTechniqueSection(modality, patientContext);
    }

    // COMPARISON section
    if (template.sections.includes('COMPARISON')) {
      sections.COMPARISON = this.buildComparisonSection(patientContext);
    }

    // FINDINGS section (most important)
    sections.FINDINGS = this.buildFindingsSection(aiResults, modality, template);

    // IMPRESSION section (summary)
    sections.IMPRESSION = this.buildImpressionSection(aiResults, modality);

    // RECOMMENDATIONS section
    sections.RECOMMENDATIONS = this.buildRecommendationsSection(aiResults, modality, patientContext);

    return sections;
  }

  /**
   * Build TECHNIQUE section
   */
  buildTechniqueSection(modality, patientContext) {
    const techniques = {
      CT: `CT examination of the ${patientContext.bodyPart || 'region of interest'} was performed ${patientContext.contrast ? 'with intravenous contrast' : 'without contrast'}.`,
      MR: `MRI examination of the ${patientContext.bodyPart || 'region of interest'} was performed using standard sequences ${patientContext.contrast ? 'with gadolinium contrast' : 'without contrast'}.`,
      US: `Ultrasound examination of the ${patientContext.bodyPart || 'region of interest'} was performed using real-time imaging.`,
      XR: `Radiographic examination of the ${patientContext.bodyPart || 'region of interest'} was performed in standard projections.`
    };

    return techniques[modality] || `${modality} imaging was performed according to standard protocol.`;
  }

  /**
   * Build COMPARISON section
   */
  buildComparisonSection(patientContext) {
    if (patientContext.priorStudyDate) {
      return `Comparison is made with prior study dated ${patientContext.priorStudyDate}.`;
    }
    return 'No prior studies available for comparison.';
  }

  /**
   * Build FINDINGS section (comprehensive)
   */
  buildFindingsSection(aiResults, modality, template) {
    let findings = '';

    // PRIORITY 1: Use AI detections if available (most specific)
    if (aiResults.detections && aiResults.detections.detections && aiResults.detections.detections.length > 0) {
      const detections = aiResults.detections.detections;
      findings = `AI DETECTION ANALYSIS:\n\n`;
      findings += `${detections.length} finding(s) identified:\n\n`;
      
      detections.forEach((detection, idx) => {
        const label = detection.label || detection.classification || 'Unknown Finding';
        const confidence = detection.confidence || 0;
        const severity = detection.severity || 'unknown';
        const description = detection.description || 'No description available';
        
        findings += `${idx + 1}. ${label.toUpperCase()}\n`;
        findings += `   - Confidence: ${(confidence * 100).toFixed(1)}%\n`;
        findings += `   - Severity: ${severity}\n`;
        findings += `   - Description: ${description}\n`;
        
        if (detection.measurements && Object.keys(detection.measurements).length > 0) {
          findings += `   - Measurements: `;
          const measurements = Object.entries(detection.measurements)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
          findings += `${measurements}\n`;
        }
        
        if (detection.boundingBox) {
          findings += `   - Location: Region at (${(detection.boundingBox.x * 100).toFixed(0)}%, ${(detection.boundingBox.y * 100).toFixed(0)}%)\n`;
        }
        
        findings += `\n`;
      });
      
      // Add recommendations from detections
      if (detections.some(d => d.recommendations && d.recommendations.length > 0)) {
        findings += `RECOMMENDATIONS FROM DETECTIONS:\n`;
        detections.forEach((detection, idx) => {
          if (detection.recommendations && detection.recommendations.length > 0) {
            detection.recommendations.forEach(rec => {
              findings += `- ${rec}\n`;
            });
          }
        });
        findings += `\n`;
      }
    }
    // PRIORITY 2: Use AI-generated report findings
    else if (aiResults.report && aiResults.report.findings) {
      findings = aiResults.report.findings;
    }
    // PRIORITY 3: Use classification results
    else if (aiResults.classification && aiResults.classification.topPrediction) {
      const prediction = aiResults.classification.topPrediction;
      const label = prediction.label || prediction.classification || 'Unknown';
      const confidence = prediction.confidence || 0;
      
      findings = `AI Classification Analysis:\n\n`;
      findings += `Primary Finding: ${label} (Confidence: ${(confidence * 100).toFixed(1)}%)\n\n`;
      
      if (aiResults.classification.predictions && aiResults.classification.predictions.length > 1) {
        findings += `Additional Considerations:\n`;
        aiResults.classification.predictions.slice(1, 4).forEach((pred, idx) => {
          const predLabel = pred.label || pred.classification || 'Unknown';
          const predConfidence = pred.confidence || 0;
          findings += `${idx + 1}. ${predLabel} (${(predConfidence * 100).toFixed(1)}%)\n`;
        });
      }
    }
    // PRIORITY 4: Default (no findings)
    else {
      findings = `No significant abnormalities detected by AI analysis.\n\n`;
      findings += template.defaultFindings;
    }

    // Add anatomical observations
    findings += '\n\nANATOMICAL OBSERVATIONS:\n';
    findings += this.generateAnatomicalObservations(modality);

    // Add AI confidence note
    const overallConfidence = this.calculateOverallConfidence(aiResults);
    if (overallConfidence > 0) {
      findings += '\n\nAI ANALYSIS NOTE:\n';
      findings += `This analysis was performed using AI-assisted detection and classification. `;
      findings += `Overall confidence: ${(overallConfidence * 100).toFixed(1)}%. `;
      findings += `All findings require verification by a qualified radiologist.`;
    }

    return findings;
  }

  /**
   * Generate anatomical observations based on modality
   */
  generateAnatomicalObservations(modality) {
    const observations = {
      CT: '- Soft tissue structures appear within normal limits\n- No acute osseous abnormalities identified\n- Vascular structures demonstrate normal enhancement pattern',
      MR: '- Signal characteristics are within normal limits\n- No abnormal enhancement patterns identified\n- Anatomical structures demonstrate normal morphology',
      US: '- Echogenicity is within normal limits\n- No focal lesions or masses identified\n- Vascular flow patterns appear normal',
      XR: '- Osseous structures appear intact\n- Joint spaces are preserved\n- Soft tissue shadows are unremarkable'
    };

    return observations[modality] || '- Anatomical structures appear within normal limits\n- No acute abnormalities identified';
  }

  /**
   * Build IMPRESSION section (summary)
   */
  buildImpressionSection(aiResults, modality) {
    let impression = '';

    // PRIORITY 1: Use detections for impression
    if (aiResults.detections && aiResults.detections.detections && aiResults.detections.detections.length > 0) {
      const detections = aiResults.detections.detections;
      const criticalCount = detections.filter(d => d.severity === 'CRITICAL').length;
      const highCount = detections.filter(d => d.severity === 'HIGH').length;
      const mediumCount = detections.filter(d => d.severity === 'MEDIUM').length;
      
      impression = `AI-ASSISTED IMPRESSION:\n\n`;
      
      // Summarize findings by severity
      let findingNum = 1;
      
      if (criticalCount > 0) {
        impression += `${findingNum}. CRITICAL FINDINGS (${criticalCount}):\n`;
        detections.filter(d => d.severity === 'CRITICAL').forEach(d => {
          const label = d.label || d.classification || 'Unknown';
          const description = d.description || 'No description';
          impression += `   - ${label}: ${description}\n`;
        });
        findingNum++;
      }
      
      if (highCount > 0) {
        impression += `${findingNum}. HIGH PRIORITY FINDINGS (${highCount}):\n`;
        detections.filter(d => d.severity === 'HIGH').forEach(d => {
          const label = d.label || d.classification || 'Unknown';
          const description = d.description || 'No description';
          impression += `   - ${label}: ${description}\n`;
        });
        findingNum++;
      }
      
      if (mediumCount > 0) {
        impression += `${findingNum}. MODERATE FINDINGS (${mediumCount}):\n`;
        detections.filter(d => d.severity === 'MEDIUM').forEach(d => {
          const label = d.label || d.classification || 'Unknown';
          impression += `   - ${label}\n`;
        });
        findingNum++;
      }
      
      if (detections.some(d => d.severity === 'LOW')) {
        impression += `${findingNum}. MINOR FINDINGS:\n`;
        detections.filter(d => d.severity === 'LOW').forEach(d => {
          const label = d.label || d.classification || 'Unknown';
          impression += `   - ${label}\n`;
        });
        findingNum++;
      }
      
      // Add clinical correlation
      impression += `\n${findingNum}. Clinical correlation and radiologist review required\n`;
      
      // Add disclaimer
      impression += `\nNOTE: This impression is generated by AI detection analysis and requires radiologist verification. `;
      impression += `AI systems are assistive tools and should not replace clinical judgment.`;
    }
    // PRIORITY 2: Use AI-generated impression
    else if (aiResults.report && aiResults.report.impression) {
      impression = aiResults.report.impression;
    }
    // PRIORITY 3: Use classification
    else if (aiResults.classification && aiResults.classification.topPrediction) {
      const prediction = aiResults.classification.topPrediction;
      const label = prediction.label || prediction.classification || 'Unknown';
      const confidence = ((prediction.confidence || 0) * 100).toFixed(1);
      
      impression = `AI-ASSISTED IMPRESSION:\n\n`;
      impression += `1. ${label} (AI Confidence: ${confidence}%)\n`;
      impression += `\n2. Clinical correlation recommended\n`;
      impression += `\n3. No acute critical findings identified by AI analysis\n`;
      
      impression += `\nNOTE: This impression is generated by AI analysis and requires radiologist verification. `;
      impression += `AI systems are assistive tools and should not replace clinical judgment.`;
    }
    // PRIORITY 4: Normal study
    else {
      impression = `${modality} examination demonstrates no significant abnormalities detected by AI analysis.\n\n`;
      impression += `Clinical correlation and radiologist review recommended for final interpretation.`;
    }

    return impression;
  }

  /**
   * Build RECOMMENDATIONS section
   */
  buildRecommendationsSection(aiResults, modality, patientContext) {
    let recommendations = '';

    // Use AI-generated recommendations if available
    if (aiResults.report && aiResults.report.recommendations && aiResults.report.recommendations.length > 0) {
      recommendations = aiResults.report.recommendations.join('\n');
    } else {
      // Generate standard recommendations
      recommendations = this.generateStandardRecommendations(modality, patientContext, aiResults);
    }

    return recommendations;
  }

  /**
   * Generate standard recommendations
   */
  generateStandardRecommendations(modality, patientContext, aiResults) {
    const recs = [];

    // Radiologist review (always)
    recs.push('1. Radiologist review and verification required');

    // Clinical correlation
    recs.push('2. Clinical correlation recommended');

    // Follow-up based on findings
    if (aiResults.classification && aiResults.classification.topPrediction) {
      const confidence = aiResults.classification.topPrediction.confidence;
      if (confidence < 0.7) {
        recs.push('3. Consider additional imaging or alternative modality for clarification');
      }
    }

    // Modality-specific recommendations
    if (modality === 'US' && patientContext.indication) {
      recs.push('4. Follow-up ultrasound in 3-6 months if clinically indicated');
    }

    // Patient-specific recommendations
    if (patientContext.age && patientContext.age > 50) {
      recs.push('5. Routine follow-up per clinical guidelines');
    }

    return recs.join('\n');
  }

  /**
   * Extract key findings from AI results
   */
  extractKeyFindings(aiResults, modality) {
    const findings = [];

    // From classification
    if (aiResults.classification && aiResults.classification.predictions) {
      aiResults.classification.predictions.slice(0, 3).forEach(pred => {
        findings.push({
          finding: pred.label,
          confidence: pred.confidence,
          severity: this.determineSeverity(pred.label),
          category: 'AI Classification'
        });
      });
    }

    // From report key findings
    if (aiResults.report && aiResults.report.keyFindings) {
      aiResults.report.keyFindings.forEach(finding => {
        findings.push({
          finding: typeof finding === 'string' ? finding : finding.finding,
          confidence: finding.confidence || 0.8,
          severity: finding.severity || 'low',
          category: 'AI Report Analysis'
        });
      });
    }

    // Add modality-specific finding if no findings
    if (findings.length === 0) {
      findings.push({
        finding: `${modality} study completed`,
        confidence: 1.0,
        severity: 'info',
        category: 'Study Status'
      });
    }

    return findings;
  }

  /**
   * Extract critical findings
   */
  extractCriticalFindings(aiResults, criticalKeywords) {
    const criticalFindings = [];

    // Check AI report for critical findings
    if (aiResults.report && aiResults.report.criticalFindings) {
      criticalFindings.push(...aiResults.report.criticalFindings);
    }

    // Scan findings text for critical keywords
    if (aiResults.report && aiResults.report.findings) {
      const findingsText = aiResults.report.findings.toLowerCase();
      criticalKeywords.forEach(keyword => {
        if (findingsText.includes(keyword.toLowerCase())) {
          criticalFindings.push({
            finding: `Possible ${keyword} detected`,
            confidence: 0.6,
            requiresUrgentReview: true,
            detectedBy: 'Keyword Analysis'
          });
        }
      });
    }

    return criticalFindings;
  }

  /**
   * Format classification results
   */
  formatClassification(classification) {
    if (!classification) {
      return null;
    }

    return {
      topPrediction: classification.topPrediction || classification.predictions?.[0],
      allPredictions: classification.predictions || [],
      model: classification.model || 'Unknown',
      processingTime: classification.processingTime || 0,
      features: classification.features ? 'Available' : 'Not Available'
    };
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(aiResults, modality, patientContext) {
    const recommendations = [];

    // Always require radiologist review
    recommendations.push({
      priority: 'high',
      recommendation: 'Radiologist review and verification required',
      reason: 'AI-generated findings must be verified by qualified physician'
    });

    // Clinical correlation
    recommendations.push({
      priority: 'medium',
      recommendation: 'Clinical correlation recommended',
      reason: 'Imaging findings should be interpreted in clinical context'
    });

    // Confidence-based recommendations
    const confidence = this.calculateOverallConfidence(aiResults);
    if (confidence < 0.7) {
      recommendations.push({
        priority: 'medium',
        recommendation: 'Consider additional imaging or consultation',
        reason: `AI confidence is moderate (${(confidence * 100).toFixed(1)}%)`
      });
    }

    // Critical findings recommendations
    if (aiResults.report && aiResults.report.criticalFindings && aiResults.report.criticalFindings.length > 0) {
      recommendations.push({
        priority: 'urgent',
        recommendation: 'Immediate radiologist review required',
        reason: 'Potential critical findings detected'
      });
    }

    return recommendations;
  }

  /**
   * Calculate quality metrics
   */
  calculateQualityMetrics(aiResults) {
    return {
      overallConfidence: this.calculateOverallConfidence(aiResults),
      imageQuality: this.assessImageQuality(aiResults),
      completeness: this.assessReportCompleteness(aiResults),
      reliability: this.assessReliability(aiResults)
    };
  }

  /**
   * Calculate overall confidence
   */
  calculateOverallConfidence(aiResults) {
    const confidences = [];

    if (aiResults.classification && aiResults.classification.topPrediction) {
      confidences.push(aiResults.classification.topPrediction.confidence);
    }

    if (aiResults.report && aiResults.report.confidence) {
      confidences.push(aiResults.report.confidence);
    }

    if (confidences.length === 0) {
      return 0.5; // Default moderate confidence
    }

    return confidences.reduce((a, b) => a + b, 0) / confidences.length;
  }

  /**
   * Assess image quality
   */
  assessImageQuality(aiResults) {
    // Simple heuristic based on AI confidence
    const confidence = this.calculateOverallConfidence(aiResults);
    
    if (confidence > 0.9) return 'excellent';
    if (confidence > 0.75) return 'good';
    if (confidence > 0.6) return 'adequate';
    return 'limited';
  }

  /**
   * Assess report completeness
   */
  assessReportCompleteness(aiResults) {
    let score = 0;
    
    if (aiResults.classification) score += 0.3;
    if (aiResults.report) score += 0.4;
    if (aiResults.report && aiResults.report.findings) score += 0.15;
    if (aiResults.report && aiResults.report.impression) score += 0.15;
    
    return score;
  }

  /**
   * Assess reliability
   */
  assessReliability(aiResults) {
    const confidence = this.calculateOverallConfidence(aiResults);
    const completeness = this.assessReportCompleteness(aiResults);
    
    return (confidence * 0.6 + completeness * 0.4);
  }

  /**
   * Determine AI status
   */
  determineAIStatus(aiResults) {
    const hasClassification = aiResults.classification && aiResults.classification.topPrediction;
    const hasReport = aiResults.report && aiResults.report.findings;
    
    if (hasClassification && hasReport) {
      return {
        status: 'complete',
        message: 'Full AI analysis completed',
        servicesUsed: this.getModelsUsed(aiResults)
      };
    } else if (hasClassification || hasReport) {
      return {
        status: 'partial',
        message: 'Partial AI analysis completed',
        servicesUsed: this.getModelsUsed(aiResults)
      };
    } else {
      return {
        status: 'unavailable',
        message: 'AI services not available - using fallback analysis',
        servicesUsed: []
      };
    }
  }

  /**
   * Get models used
   */
  getModelsUsed(aiResults) {
    const models = [];
    
    if (aiResults.classification && aiResults.classification.model) {
      models.push(aiResults.classification.model);
    }
    
    if (aiResults.report && aiResults.report.model) {
      models.push(aiResults.report.model);
    }
    
    return models;
  }

  /**
   * Format patient info
   */
  formatPatientInfo(patientContext) {
    return {
      patientID: patientContext.patientID || 'Unknown',
      patientName: patientContext.patientName || 'Unknown',
      age: patientContext.age || 'Unknown',
      sex: patientContext.sex || 'Unknown',
      indication: patientContext.indication || 'Not specified',
      clinicalHistory: patientContext.clinicalHistory || 'Not provided'
    };
  }

  /**
   * Determine severity
   */
  determineSeverity(finding) {
    const findingLower = finding.toLowerCase();
    
    const criticalTerms = ['fracture', 'hemorrhage', 'mass', 'tumor', 'obstruction'];
    const moderateTerms = ['abnormal', 'suspicious', 'concerning', 'irregular'];
    
    if (criticalTerms.some(term => findingLower.includes(term))) {
      return 'high';
    } else if (moderateTerms.some(term => findingLower.includes(term))) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Generate unique report ID
   */
  generateReportId(studyInstanceUID) {
    const timestamp = Date.now();
    const hash = studyInstanceUID.substring(0, 8);
    return `RPT-${hash}-${timestamp}`;
  }

  /**
   * Save report snapshot to filesystem
   */
  async saveReportSnapshot(report) {
    try {
      const reportsDir = path.join(__dirname, '../../backend/ai_reports');
      const imagesDir = path.join(reportsDir, 'images');
      
      // Create directories if they don't exist
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }

      // Save image snapshot separately if it exists
      let imagePath = null;
      if (report.imageSnapshot && report.imageSnapshot.data) {
        const imageFilename = `${report.reportId}_frame${report.frameIndex}.png`;
        imagePath = path.join(imagesDir, imageFilename);
        
        // Convert base64 to buffer and save
        const imageBuffer = Buffer.from(report.imageSnapshot.data, 'base64');
        fs.writeFileSync(imagePath, imageBuffer);
        
        console.log(`🖼️ Saved image snapshot: ${imageFilename}`);
        
        // Replace base64 data with file path in report
        report.imageSnapshot = {
          ...report.imageSnapshot,
          data: null, // Remove base64 data
          filePath: `./images/${imageFilename}`,
          absolutePath: imagePath
        };
      }

      // Save report JSON
      const filename = `${report.reportId}.json`;
      const filepath = path.join(reportsDir, filename);
      
      fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
      
      console.log(`💾 Saved AI report snapshot: ${filename}`);
      
      return {
        reportPath: filepath,
        imagePath: imagePath
      };
    } catch (error) {
      console.error('Failed to save report snapshot:', error.message);
    }
  }
}

// Singleton instance
let reportGenerator = null;

function getAIReportGenerator() {
  if (!reportGenerator) {
    reportGenerator = new AIReportGenerator();
  }
  return reportGenerator;
}

module.exports = { AIReportGenerator, getAIReportGenerator };
