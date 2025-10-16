const axios = require('axios');

/**
 * Medical AI Service
 * Integrates MedSigLIP and MedGemma for comprehensive medical image analysis
 * 
 * Architecture:
 * - MedSigLIP: Fast image classification and retrieval (0.4B params)
 * - MedGemma-4B: Radiology report generation (efficient)
 * - MedGemma-27B: Advanced clinical reasoning (optional, high-resource)
 */
class MedicalAIService {
  constructor(config = {}) {
    // API endpoints (can be local or cloud-hosted)
    this.medSigLIPUrl = config.medSigLIPUrl || process.env.MEDSIGCLIP_API_URL || 'http://localhost:5001';
    this.medGemma4BUrl = config.medGemma4BUrl || process.env.MEDGEMMA_4B_API_URL || 'http://localhost:5002';
    this.medGemma27BUrl = config.medGemma27BUrl || process.env.MEDGEMMA_27B_API_URL || 'http://localhost:5003';
    
    // Feature flags
    this.enableMedSigLIP = config.enableMedSigLIP !== false;
    this.enableMedGemma4B = config.enableMedGemma4B !== false;
    this.enableMedGemma27B = config.enableMedGemma27B || false; // Disabled by default (high resource)
    
    // Timeouts
    this.classificationTimeout = 5000; // 5s for classification
    this.reportGenerationTimeout = 30000; // 30s for report generation
    this.reasoningTimeout = 60000; // 60s for clinical reasoning
  }

  /**
   * Analyze medical image with MedSigLIP
   * Fast classification and feature extraction
   */
  async classifyImage(imageBuffer, modality) {
    if (!this.enableMedSigLIP) {
      return null;
    }

    try {
      console.log('🔍 MedSigLIP: Classifying image...');
      
      const response = await axios.post(
        `${this.medSigLIPUrl}/classify`,
        {
          image: imageBuffer.toString('base64'),
          modality: modality,
          return_features: true // Get embeddings for similarity search
        },
        { timeout: this.classificationTimeout }
      );

      return {
        classification: response.data.classification,
        confidence: response.data.confidence,
        topPredictions: response.data.top_predictions || [],
        features: response.data.features, // For similarity search
        processingTime: response.data.processing_time,
        model: 'MedSigLIP-0.4B'
      };
    } catch (error) {
      console.error('MedSigLIP classification failed:', error.message);
      return null;
    }
  }

  /**
   * Generate radiology report with MedGemma-4B
   * Efficient multimodal report generation
   */
  async generateRadiologyReport(imageBuffer, modality, patientContext = {}) {
    if (!this.enableMedGemma4B) {
      return null;
    }

    try {
      console.log('📝 MedGemma-4B: Generating radiology report...');
      
      const response = await axios.post(
        `${this.medGemma4BUrl}/generate-report`,
        {
          image: imageBuffer.toString('base64'),
          modality: modality,
          patient_context: {
            age: patientContext.age,
            sex: patientContext.sex,
            clinical_history: patientContext.clinicalHistory,
            indication: patientContext.indication
          },
          report_sections: [
            'findings',
            'impression',
            'recommendations'
          ]
        },
        { timeout: this.reportGenerationTimeout }
      );

      return {
        findings: response.data.findings,
        impression: response.data.impression,
        recommendations: response.data.recommendations,
        keyFindings: response.data.key_findings || [],
        criticalFindings: response.data.critical_findings || [],
        confidence: response.data.confidence,
        requiresReview: true, // Always require radiologist review
        generatedAt: new Date(),
        model: 'MedGemma-4B'
      };
    } catch (error) {
      console.error('MedGemma-4B report generation failed:', error.message);
      return null;
    }
  }

  /**
   * Advanced clinical reasoning with MedGemma-27B
   * Multimodal analysis with EHR integration (optional, high-resource)
   */
  async performClinicalReasoning(imageBuffer, modality, ehrData = {}) {
    if (!this.enableMedGemma27B) {
      return null;
    }

    try {
      console.log('🧠 MedGemma-27B: Performing clinical reasoning...');
      
      const response = await axios.post(
        `${this.medGemma27BUrl}/clinical-reasoning`,
        {
          image: imageBuffer.toString('base64'),
          modality: modality,
          ehr_data: {
            patient_history: ehrData.patientHistory,
            medications: ehrData.medications,
            lab_results: ehrData.labResults,
            previous_imaging: ehrData.previousImaging
          },
          reasoning_tasks: [
            'differential_diagnosis',
            'treatment_recommendations',
            'follow_up_plan',
            'risk_assessment'
          ]
        },
        { timeout: this.reasoningTimeout }
      );

      return {
        differentialDiagnosis: response.data.differential_diagnosis,
        treatmentRecommendations: response.data.treatment_recommendations,
        followUpPlan: response.data.follow_up_plan,
        riskAssessment: response.data.risk_assessment,
        clinicalInsights: response.data.clinical_insights,
        confidence: response.data.confidence,
        requiresReview: true,
        generatedAt: new Date(),
        model: 'MedGemma-27B'
      };
    } catch (error) {
      console.error('MedGemma-27B clinical reasoning failed:', error.message);
      return null;
    }
  }

  /**
   * Comprehensive analysis pipeline
   * Combines MedSigLIP + MedGemma for complete analysis
   */
  async analyzeStudy(studyInstanceUID, imageBuffer, modality, patientContext = {}) {
    console.log(`🏥 Starting comprehensive AI analysis for study: ${studyInstanceUID}`);
    
    const results = {
      studyInstanceUID,
      modality,
      timestamp: new Date(),
      analyses: {}
    };

    // 1. Fast classification with MedSigLIP (parallel)
    const classificationPromise = this.classifyImage(imageBuffer, modality);

    // 2. Report generation with MedGemma-4B (parallel)
    const reportPromise = this.generateRadiologyReport(imageBuffer, modality, patientContext);

    // Wait for both to complete
    const [classification, report] = await Promise.all([
      classificationPromise,
      reportPromise
    ]);

    if (classification) {
      results.analyses.classification = classification;
    }

    if (report) {
      results.analyses.report = report;
    }

    // 3. Optional: Advanced reasoning with MedGemma-27B (if enabled and EHR data available)
    if (this.enableMedGemma27B && patientContext.ehrData) {
      const reasoning = await this.performClinicalReasoning(
        imageBuffer, 
        modality, 
        patientContext.ehrData
      );
      
      if (reasoning) {
        results.analyses.clinicalReasoning = reasoning;
      }
    }

    // 4. Save results to database
    await this.saveAnalysisResults(studyInstanceUID, results);

    console.log(`✅ AI analysis complete for study: ${studyInstanceUID}`);
    return results;
  }

  /**
   * Save AI analysis results to database
   */
  async saveAnalysisResults(studyInstanceUID, results) {
    try {
      const Study = require('../models/Study');
      
      await Study.findOneAndUpdate(
        { studyInstanceUID },
        {
          $set: {
            aiAnalysis: results,
            aiAnalyzedAt: new Date(),
            aiModels: Object.keys(results.analyses).map(key => results.analyses[key].model)
          }
        },
        { upsert: false }
      );
      
      console.log(`💾 Saved AI analysis results for study: ${studyInstanceUID}`);
    } catch (error) {
      console.error('Failed to save AI analysis results:', error.message);
    }
  }

  /**
   * Find similar images using MedSigLIP embeddings
   */
  async findSimilarImages(imageBuffer, modality, topK = 5) {
    if (!this.enableMedSigLIP) {
      return [];
    }

    try {
      console.log('🔎 MedSigLIP: Finding similar images...');
      
      const response = await axios.post(
        `${this.medSigLIPUrl}/find-similar`,
        {
          image: imageBuffer.toString('base64'),
          modality: modality,
          top_k: topK
        },
        { timeout: this.classificationTimeout }
      );

      return response.data.similar_images || [];
    } catch (error) {
      console.error('MedSigLIP similarity search failed:', error.message);
      return [];
    }
  }

  /**
   * Summarize medical text with MedGemma
   */
  async summarizeMedicalText(text, summaryType = 'brief') {
    if (!this.enableMedGemma4B) {
      return null;
    }

    try {
      console.log('📄 MedGemma: Summarizing medical text...');
      
      const response = await axios.post(
        `${this.medGemma4BUrl}/summarize`,
        {
          text: text,
          summary_type: summaryType, // 'brief', 'detailed', 'bullet_points'
          max_length: summaryType === 'brief' ? 100 : 500
        },
        { timeout: 10000 }
      );

      return {
        summary: response.data.summary,
        keyPoints: response.data.key_points || [],
        model: 'MedGemma-4B'
      };
    } catch (error) {
      console.error('MedGemma text summarization failed:', error.message);
      return null;
    }
  }

  /**
   * Health check for AI services
   */
  async healthCheck() {
    const health = {
      medSigLIP: { available: false, latency: null },
      medGemma4B: { available: false, latency: null },
      medGemma27B: { available: false, latency: null }
    };

    // Check MedSigLIP
    if (this.enableMedSigLIP) {
      try {
        const start = Date.now();
        await axios.get(`${this.medSigLIPUrl}/health`, { timeout: 2000 });
        health.medSigLIP.available = true;
        health.medSigLIP.latency = Date.now() - start;
      } catch (error) {
        console.warn('MedSigLIP health check failed:', error.message);
      }
    }

    // Check MedGemma-4B
    if (this.enableMedGemma4B) {
      try {
        const start = Date.now();
        await axios.get(`${this.medGemma4BUrl}/health`, { timeout: 2000 });
        health.medGemma4B.available = true;
        health.medGemma4B.latency = Date.now() - start;
      } catch (error) {
        console.warn('MedGemma-4B health check failed:', error.message);
      }
    }

    // Check MedGemma-27B
    if (this.enableMedGemma27B) {
      try {
        const start = Date.now();
        await axios.get(`${this.medGemma27BUrl}/health`, { timeout: 2000 });
        health.medGemma27B.available = true;
        health.medGemma27B.latency = Date.now() - start;
      } catch (error) {
        console.warn('MedGemma-27B health check failed:', error.message);
      }
    }

    return health;
  }
}

// Singleton instance
let medicalAIService = null;

function getMedicalAIService(config = {}) {
  if (!medicalAIService) {
    medicalAIService = new MedicalAIService(config);
  }
  return medicalAIService;
}

module.exports = { MedicalAIService, getMedicalAIService };
