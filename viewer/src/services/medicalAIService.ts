import axios from 'axios'

/**
 * Medical AI Service - Frontend
 * Integrates with MedSigLIP and MedGemma backend services
 */

export interface AIClassification {
  classification: string
  confidence: number
  topPredictions: Array<{
    label: string
    confidence: number
  }>
  features?: number[]
  processingTime: number
  model: string
}

export interface AIReport {
  findings: string
  impression: string
  recommendations: string
  keyFindings: string[]
  criticalFindings: string[]
  confidence: number
  requiresReview: boolean
  generatedAt: string
  model: string
}

export interface AIClinicalReasoning {
  differentialDiagnosis: string[]
  treatmentRecommendations: string[]
  followUpPlan: string
  riskAssessment: {
    level: 'low' | 'medium' | 'high'
    factors: string[]
  }
  clinicalInsights: string[]
  confidence: number
  requiresReview: boolean
  generatedAt: string
  model: string
}

export interface AIAnalysisResult {
  studyInstanceUID: string
  modality: string
  timestamp: string
  analyses: {
    classification?: AIClassification
    report?: AIReport
    clinicalReasoning?: AIClinicalReasoning
  }
}

export interface SimilarImage {
  studyInstanceUID: string
  frameIndex: number
  similarity: number
  modality: string
  patientInfo?: {
    age?: number
    sex?: string
  }
}

export interface TextSummary {
  summary: string
  keyPoints: string[]
  model: string
}

export interface AIHealthStatus {
  success: boolean
  status: 'healthy' | 'degraded' | 'unavailable'
  services: {
    medSigLIP: {
      available: boolean
      latency: number | null
    }
    medGemma4B: {
      available: boolean
      latency: number | null
    }
    medGemma27B: {
      available: boolean
      latency: number | null
    }
  }
}

class MedicalAIService {
  private baseURL = '/api/medical-ai'

  /**
   * Perform comprehensive AI analysis on a study
   */
  async analyzeStudy(
    studyInstanceUID: string,
    frameIndex: number = 0,
    patientContext?: {
      age?: number
      sex?: string
      clinicalHistory?: string
      indication?: string
      ehrData?: any
    }
  ): Promise<AIAnalysisResult> {
    const response = await axios.post(`${this.baseURL}/analyze-study`, {
      studyInstanceUID,
      frameIndex,
      patientContext
    })
    return response.data.data
  }

  /**
   * Classify image with MedSigLIP
   */
  async classifyImage(
    studyInstanceUID: string,
    frameIndex: number = 0
  ): Promise<AIClassification> {
    const response = await axios.post(`${this.baseURL}/classify-image`, {
      studyInstanceUID,
      frameIndex
    })
    return response.data.data
  }

  /**
   * Generate radiology report with MedGemma
   */
  async generateReport(
    studyInstanceUID: string,
    frameIndex: number = 0,
    patientContext?: {
      age?: number
      sex?: string
      clinicalHistory?: string
      indication?: string
    }
  ): Promise<AIReport> {
    const response = await axios.post(`${this.baseURL}/generate-report`, {
      studyInstanceUID,
      frameIndex,
      patientContext
    })
    return response.data.data
  }

  /**
   * Find similar images using MedSigLIP
   */
  async findSimilarImages(
    studyInstanceUID: string,
    frameIndex: number = 0,
    topK: number = 5
  ): Promise<SimilarImage[]> {
    const response = await axios.post(`${this.baseURL}/find-similar`, {
      studyInstanceUID,
      frameIndex,
      topK
    })
    return response.data.data.similarImages
  }

  /**
   * Summarize medical text with MedGemma
   */
  async summarizeText(
    text: string,
    summaryType: 'brief' | 'detailed' | 'bullet_points' = 'brief'
  ): Promise<TextSummary> {
    const response = await axios.post(`${this.baseURL}/summarize-text`, {
      text,
      summaryType
    })
    return response.data.data
  }

  /**
   * Get saved AI analysis for a study
   */
  async getStudyAnalysis(studyInstanceUID: string): Promise<AIAnalysisResult | null> {
    try {
      const response = await axios.get(`${this.baseURL}/study/${studyInstanceUID}/analysis`)
      return response.data.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      throw error
    }
  }

  /**
   * Check AI services health
   */
  async checkHealth(): Promise<AIHealthStatus> {
    const response = await axios.get(`${this.baseURL}/health`)
    return response.data
  }
}

// Singleton instance
export const medicalAIService = new MedicalAIService()
export default medicalAIService
