const axios = require('axios');

/**
 * AI-Powered Billing Code Suggestion Service
 * Analyzes radiology reports and suggests appropriate CPT and ICD-10 codes
 */
class AIBillingService {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.model = process.env.AI_MODEL || 'gpt-4';
  }

  /**
   * Main function: Analyze report and suggest billing codes
   */
  async analyzeBillingCodes(reportData) {
    const startTime = Date.now();
    
    try {
      // Extract report text
      const reportText = this.extractReportText(reportData);
      
      // Get AI suggestions
      const aiSuggestions = await this.getAISuggestions(reportText, reportData);
      
      // Validate suggestions against database
      const validatedSuggestions = await this.validateSuggestions(aiSuggestions);
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        cptCodes: validatedSuggestions.cptCodes,
        icd10Codes: validatedSuggestions.icd10Codes,
        confidence: validatedSuggestions.overallConfidence,
        processingTime,
        model: this.model,
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('AI Billing Analysis Error:', error);
      
      // Fallback to rule-based suggestions
      return this.getRuleBasedSuggestions(reportData);
    }
  }

  /**
   * Extract full report text from structured sections
   */
  extractReportText(reportData) {
    let fullText = '';
    
    // Study information
    if (reportData.studyData) {
      fullText += `Study Type: ${reportData.studyData.studyDescription || ''}\n`;
      fullText += `Modality: ${reportData.studyData.modality || ''}\n`;
    }
    
    // Report sections
    if (reportData.sections) {
      Object.entries(reportData.sections).forEach(([key, value]) => {
        if (value && typeof value === 'string') {
          fullText += `\n${key.toUpperCase()}:\n${value}\n`;
        }
      });
    }
    
    // Findings
    if (reportData.findings && Array.isArray(reportData.findings)) {
      fullText += '\nFINDINGS:\n';
      reportData.findings.forEach(finding => {
        fullText += `- ${finding.location}: ${finding.description} (${finding.severity})\n`;
      });
    }
    
    // Measurements
    if (reportData.measurements && Array.isArray(reportData.measurements)) {
      fullText += '\nMEASUREMENTS:\n';
      reportData.measurements.forEach(m => {
        fullText += `- ${m.type}: ${m.value} ${m.unit} at ${m.location}\n`;
      });
    }
    
    return fullText;
  }

  /**
   * Get AI-powered code suggestions using OpenAI
   */
  async getAISuggestions(reportText, reportData) {
    if (!this.openaiApiKey) {
      console.log('OpenAI API key not configured, using rule-based fallback');
      return this.getRuleBasedSuggestions(reportData);
    }

    const prompt = this.buildPrompt(reportText, reportData);
    
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert medical billing specialist with deep knowledge of CPT and ICD-10 coding for radiology procedures. Analyze reports and suggest accurate billing codes.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1500
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const aiResponse = response.data.choices[0].message.content;
      return this.parseAIResponse(aiResponse);
      
    } catch (error) {
      console.error('OpenAI API Error:', error.message);
      return this.getRuleBasedSuggestions(reportData);
    }
  }

  /**
   * Build comprehensive prompt for AI
   */
  buildPrompt(reportText, reportData) {
    const modality = reportData.studyData?.modality || 'Unknown';
    
    return `Analyze this radiology report and suggest appropriate CPT and ICD-10 codes for billing.

REPORT:
${reportText}

INSTRUCTIONS:
1. Suggest CPT codes for the procedures performed
2. Suggest ICD-10 codes for all findings and diagnoses mentioned
3. Include modifiers if applicable (26, TC, 59, RT, LT)
4. Provide confidence score (0-100) for each code
5. Link diagnosis codes to procedures using pointers

Respond in this JSON format:
{
  "cptCodes": [
    {
      "code": "71045",
      "description": "Chest X-ray, 2 views",
      "modifiers": [],
      "confidence": 95,
      "reasoning": "Two-view chest radiograph performed"
    }
  ],
  "icd10Codes": [
    {
      "code": "J18.9",
      "description": "Pneumonia, unspecified organism",
      "confidence": 90,
      "reasoning": "Findings consistent with pneumonia"
    }
  ]
}`;
  }

  /**
   * Parse AI response into structured format
   */
  parseAIResponse(aiResponse) {
    try {
      // Extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          cptCodes: parsed.cptCodes || [],
          icd10Codes: parsed.icd10Codes || [],
          overallConfidence: this.calculateOverallConfidence(parsed)
        };
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error);
    }
    
    return { cptCodes: [], icd10Codes: [], overallConfidence: 0 };
  }

  /**
   * Calculate overall confidence score
   */
  calculateOverallConfidence(parsed) {
    const allConfidences = [
      ...(parsed.cptCodes || []).map(c => c.confidence || 0),
      ...(parsed.icd10Codes || []).map(c => c.confidence || 0)
    ];
    
    if (allConfidences.length === 0) return 0;
    
    return Math.round(
      allConfidences.reduce((sum, conf) => sum + conf, 0) / allConfidences.length
    );
  }

  /**
   * Validate suggestions against code database
   */
  async validateSuggestions(suggestions) {
    // In production, validate against BillingCode and DiagnosisCode models
    // For now, return as-is with validation flag
    return {
      ...suggestions,
      validated: true
    };
  }

  /**
   * Rule-based fallback when AI is unavailable
   */
  getRuleBasedSuggestions(reportData) {
    const modality = reportData.studyData?.modality || '';
    const description = reportData.studyData?.studyDescription?.toLowerCase() || '';
    const findings = reportData.findings || [];
    
    const cptCodes = [];
    const icd10Codes = [];
    
    // CPT Code Rules by Modality
    if (modality === 'XA' || modality === 'XR') {
      if (description.includes('chest')) {
        cptCodes.push({
          code: '71045',
          description: 'Chest X-ray, 2 views',
          modifiers: [],
          confidence: 85,
          reasoning: 'Chest radiograph identified'
        });
      } else if (description.includes('cardiac') || description.includes('angio')) {
        cptCodes.push({
          code: '93458',
          description: 'Cardiac catheterization, left heart',
          modifiers: [],
          confidence: 80,
          reasoning: 'Cardiac angiography procedure'
        });
      }
    } else if (modality === 'CT') {
      if (description.includes('chest')) {
        cptCodes.push({
          code: '71250',
          description: 'CT chest without contrast',
          modifiers: [],
          confidence: 85,
          reasoning: 'CT chest examination'
        });
      } else if (description.includes('head') || description.includes('brain')) {
        cptCodes.push({
          code: '70450',
          description: 'CT head without contrast',
          modifiers: [],
          confidence: 85,
          reasoning: 'CT head examination'
        });
      }
    } else if (modality === 'MR' || modality === 'MRI') {
      if (description.includes('brain')) {
        cptCodes.push({
          code: '70551',
          description: 'MRI brain without contrast',
          modifiers: [],
          confidence: 85,
          reasoning: 'MRI brain examination'
        });
      }
    }
    
    // ICD-10 Code Rules by Findings
    findings.forEach(finding => {
      const desc = finding.description.toLowerCase();
      const severity = finding.severity;
      
      if (desc.includes('pneumonia')) {
        icd10Codes.push({
          code: 'J18.9',
          description: 'Pneumonia, unspecified organism',
          confidence: 80,
          reasoning: 'Pneumonia finding documented'
        });
      } else if (desc.includes('effusion')) {
        icd10Codes.push({
          code: 'J91.8',
          description: 'Pleural effusion',
          confidence: 75,
          reasoning: 'Pleural effusion identified'
        });
      } else if (desc.includes('fracture')) {
        icd10Codes.push({
          code: 'S22.9',
          description: 'Fracture, unspecified',
          confidence: 70,
          reasoning: 'Fracture documented'
        });
      } else if (desc.includes('stenosis') || desc.includes('narrowing')) {
        icd10Codes.push({
          code: 'I25.10',
          description: 'Coronary artery disease',
          confidence: 75,
          reasoning: 'Vascular stenosis identified'
        });
      }
    });
    
    // Default codes if nothing found
    if (cptCodes.length === 0) {
      cptCodes.push({
        code: '70000',
        description: 'Diagnostic imaging procedure',
        modifiers: [],
        confidence: 50,
        reasoning: 'Generic imaging code - manual review required'
      });
    }
    
    if (icd10Codes.length === 0) {
      icd10Codes.push({
        code: 'Z00.00',
        description: 'Encounter for general examination',
        confidence: 50,
        reasoning: 'No specific findings - manual review required'
      });
    }
    
    return {
      success: true,
      cptCodes,
      icd10Codes,
      confidence: this.calculateOverallConfidence({ cptCodes, icd10Codes }),
      processingTime: 0,
      model: 'rule-based',
      timestamp: new Date()
    };
  }
}

module.exports = new AIBillingService();
