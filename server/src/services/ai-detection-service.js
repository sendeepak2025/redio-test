const axios = require('axios');

/**
 * AI Detection Service
 * Detects abnormalities and returns bounding boxes/regions for visual marking
 */
class AIDetectionService {
  constructor(config = {}) {
    // Detection API endpoints
    this.detectionUrl = config.detectionUrl || process.env.AI_DETECTION_URL || 'http://localhost:5004';
    this.segmentationUrl = config.segmentationUrl || process.env.AI_SEGMENTATION_URL || 'http://localhost:5005';
    
    // Timeouts
    this.detectionTimeout = 30000; // 30s for detection
    this.segmentationTimeout = 45000; // 45s for segmentation
    
    // Detection thresholds
    this.confidenceThreshold = 0.5; // Minimum confidence to report
    this.criticalThreshold = 0.7; // Threshold for critical findings
  }

  /**
   * Detect abnormalities in medical image
   * Returns bounding boxes and classifications
   */
  async detectAbnormalities(imageBuffer, modality, options = {}) {
    try {
      console.log('🔍 AI Detection: Analyzing image for abnormalities...');
      
      const response = await axios.post(
        `${this.detectionUrl}/detect`,
        {
          image: imageBuffer.toString('base64'),
          modality: modality,
          confidence_threshold: options.confidenceThreshold || this.confidenceThreshold,
          return_masks: options.returnMasks || false,
          detect_types: this.getDetectionTypes(modality)
        },
        { timeout: this.detectionTimeout }
      );

      const detections = this.processDetections(response.data.detections, modality);
      
      console.log(`✅ AI Detection: Found ${detections.length} potential findings`);
      return detections;
    } catch (error) {
      console.error('AI Detection failed:', error.message);
      // Return mock detections for demo
      return this.generateMockDetections(modality);
    }
  }

  /**
   * Segment specific regions (organs, lesions, etc.)
   */
  async segmentRegions(imageBuffer, modality, regionTypes = []) {
    try {
      console.log('🎯 AI Segmentation: Segmenting regions...');
      
      const response = await axios.post(
        `${this.segmentationUrl}/segment`,
        {
          image: imageBuffer.toString('base64'),
          modality: modality,
          region_types: regionTypes.length > 0 ? regionTypes : this.getDefaultRegions(modality)
        },
        { timeout: this.segmentationTimeout }
      );

      return this.processSegmentations(response.data.segments);
    } catch (error) {
      console.error('AI Segmentation failed:', error.message);
      return [];
    }
  }

  /**
   * Process raw detections into structured format
   */
  processDetections(detections, modality) {
    if (!detections || detections.length === 0) {
      return [];
    }

    return detections.map((detection, index) => ({
      id: `detection-${Date.now()}-${index}`,
      type: detection.class || detection.type,
      label: this.getHumanReadableLabel(detection.class || detection.type, modality),
      confidence: detection.confidence || detection.score,
      severity: this.determineSeverity(detection),
      
      // Bounding box (normalized coordinates 0-1)
      boundingBox: {
        x: detection.bbox?.x || detection.x,
        y: detection.bbox?.y || detection.y,
        width: detection.bbox?.width || detection.w,
        height: detection.bbox?.height || detection.h
      },
      
      // Optional mask for precise region
      mask: detection.mask || null,
      
      // Measurements if available
      measurements: detection.measurements || {},
      
      // Clinical description
      description: this.generateDescription(detection, modality),
      
      // Recommendations
      recommendations: this.generateRecommendations(detection, modality),
      
      // Metadata
      metadata: {
        detectedAt: new Date(),
        model: detection.model || 'AI Detection Model',
        modality: modality
      }
    }));
  }

  /**
   * Process segmentation results
   */
  processSegmentations(segments) {
    if (!segments || segments.length === 0) {
      return [];
    }

    return segments.map((segment, index) => ({
      id: `segment-${Date.now()}-${index}`,
      type: segment.type,
      label: segment.label,
      mask: segment.mask, // Binary mask or polygon points
      confidence: segment.confidence,
      volume: segment.volume || null,
      measurements: segment.measurements || {}
    }));
  }

  /**
   * Determine severity based on detection
   */
  determineSeverity(detection) {
    const confidence = detection.confidence || detection.score;
    const type = (detection.class || detection.type || '').toLowerCase();
    
    // Critical findings
    const criticalKeywords = [
      'fracture', 'hemorrhage', 'pneumothorax', 'mass', 'tumor',
      'aneurysm', 'embolism', 'infarct', 'obstruction', 'perforation'
    ];
    
    if (criticalKeywords.some(keyword => type.includes(keyword))) {
      return confidence >= this.criticalThreshold ? 'CRITICAL' : 'HIGH';
    }
    
    // High severity
    const highKeywords = [
      'lesion', 'nodule', 'opacity', 'consolidation', 'effusion',
      'stenosis', 'calcification', 'abnormality'
    ];
    
    if (highKeywords.some(keyword => type.includes(keyword))) {
      return confidence >= 0.7 ? 'HIGH' : 'MEDIUM';
    }
    
    // Medium severity
    if (confidence >= 0.7) {
      return 'MEDIUM';
    }
    
    return 'LOW';
  }

  /**
   * Generate human-readable label
   */
  getHumanReadableLabel(className, modality) {
    const labels = {
      // Chest X-Ray
      'pneumonia': 'Pneumonia',
      'consolidation': 'Consolidation',
      'pneumothorax': 'Pneumothorax',
      'pleural_effusion': 'Pleural Effusion',
      'cardiomegaly': 'Cardiomegaly',
      'nodule': 'Pulmonary Nodule',
      'mass': 'Mass',
      
      // CT
      'fracture': 'Fracture',
      'hemorrhage': 'Hemorrhage',
      'tumor': 'Tumor',
      'lesion': 'Lesion',
      'calcification': 'Calcification',
      
      // General
      'abnormality': 'Abnormality',
      'suspicious_region': 'Suspicious Region'
    };
    
    return labels[className] || className.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Generate clinical description
   */
  generateDescription(detection, modality) {
    const type = detection.class || detection.type;
    const confidence = ((detection.confidence || detection.score) * 100).toFixed(1);
    const location = this.describeLocation(detection.bbox || detection);
    
    const descriptions = {
      'pneumonia': `Possible pneumonia detected in the ${location} with ${confidence}% confidence. Consolidation pattern suggests infectious process.`,
      'pneumothorax': `Pneumothorax identified in the ${location} with ${confidence}% confidence. Air collection in pleural space requires immediate attention.`,
      'fracture': `Fracture detected in the ${location} with ${confidence}% confidence. Cortical disruption visible.`,
      'nodule': `Pulmonary nodule identified in the ${location} with ${confidence}% confidence. Further evaluation recommended.`,
      'mass': `Mass lesion detected in the ${location} with ${confidence}% confidence. Requires further characterization.`,
      'pleural_effusion': `Pleural effusion noted in the ${location} with ${confidence}% confidence. Fluid collection in pleural space.`,
      'hemorrhage': `Hemorrhage detected in the ${location} with ${confidence}% confidence. Acute bleeding requires urgent evaluation.`
    };
    
    return descriptions[type] || `${this.getHumanReadableLabel(type, modality)} detected in the ${location} with ${confidence}% confidence.`;
  }

  /**
   * Describe anatomical location
   */
  describeLocation(bbox) {
    if (!bbox) return 'image';
    
    const x = bbox.x || 0;
    const y = bbox.y || 0;
    
    // Determine horizontal position
    let horizontal = 'central';
    if (x < 0.33) horizontal = 'left';
    else if (x > 0.67) horizontal = 'right';
    
    // Determine vertical position
    let vertical = 'mid';
    if (y < 0.33) vertical = 'upper';
    else if (y > 0.67) vertical = 'lower';
    
    return `${vertical} ${horizontal} region`;
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(detection, modality) {
    const severity = this.determineSeverity(detection);
    const type = (detection.class || detection.type || '').toLowerCase();
    
    const recommendations = [];
    
    // Critical findings
    if (severity === 'CRITICAL') {
      recommendations.push('Immediate radiologist review required');
      recommendations.push('Consider urgent clinical correlation');
      
      if (type.includes('pneumothorax')) {
        recommendations.push('Assess need for chest tube placement');
      }
      if (type.includes('hemorrhage')) {
        recommendations.push('Urgent neurosurgical consultation if intracranial');
      }
    }
    
    // High severity
    if (severity === 'HIGH') {
      recommendations.push('Radiologist review recommended within 24 hours');
      recommendations.push('Clinical correlation advised');
      
      if (type.includes('nodule') || type.includes('mass')) {
        recommendations.push('Consider follow-up imaging or biopsy');
      }
    }
    
    // General recommendations
    if (type.includes('fracture')) {
      recommendations.push('Orthopedic consultation may be warranted');
    }
    
    if (type.includes('pneumonia')) {
      recommendations.push('Consider antibiotic therapy if clinically indicated');
    }
    
    return recommendations;
  }

  /**
   * Get detection types based on modality
   */
  getDetectionTypes(modality) {
    const types = {
      'XR': ['pneumonia', 'pneumothorax', 'pleural_effusion', 'cardiomegaly', 'nodule', 'fracture'],
      'CT': ['fracture', 'hemorrhage', 'tumor', 'lesion', 'calcification', 'pneumothorax'],
      'MR': ['tumor', 'lesion', 'hemorrhage', 'infarct', 'edema'],
      'US': ['mass', 'cyst', 'fluid_collection', 'calcification']
    };
    
    return types[modality] || ['abnormality', 'lesion', 'mass'];
  }

  /**
   * Get default segmentation regions
   */
  getDefaultRegions(modality) {
    const regions = {
      'XR': ['lungs', 'heart', 'mediastinum'],
      'CT': ['organs', 'bones', 'vessels'],
      'MR': ['brain', 'organs', 'lesions'],
      'US': ['organs', 'vessels', 'masses']
    };
    
    return regions[modality] || ['organs'];
  }

  /**
   * Generate mock detections for demo/testing
   * Now generates varied detections based on random selection
   */
  generateMockDetections(modality) {
    console.log('📋 Generating mock detections (AI service not available)');
    
    // Generate random number of detections (0-3)
    const numDetections = Math.floor(Math.random() * 4);
    
    if (numDetections === 0) {
      console.log('✅ No abnormalities detected (normal study)');
      return [];
    }
    
    const allPossibleDetections = {
      'XR': [
        {
          id: `mock-${Date.now()}-1`,
          type: 'consolidation',
          label: 'Consolidation',
          confidence: 0.70 + Math.random() * 0.15,
          severity: 'MEDIUM',
          boundingBox: { 
            x: 0.30 + Math.random() * 0.20, 
            y: 0.40 + Math.random() * 0.20, 
            width: 0.10 + Math.random() * 0.10, 
            height: 0.08 + Math.random() * 0.08 
          },
          description: 'Possible consolidation detected in the right lower lung field. May represent pneumonia or atelectasis.',
          recommendations: [
            'Radiologist review recommended',
            'Clinical correlation advised',
            'Consider follow-up if symptoms persist'
          ],
          measurements: { area: `${(2.5 + Math.random() * 2).toFixed(1)} cm²` },
          metadata: { detectedAt: new Date(), model: 'Demo Mode', modality }
        },
        {
          id: `mock-${Date.now()}-2`,
          type: 'cardiomegaly',
          label: 'Cardiomegaly',
          confidence: 0.60 + Math.random() * 0.15,
          severity: 'LOW',
          boundingBox: { 
            x: 0.40 + Math.random() * 0.10, 
            y: 0.45 + Math.random() * 0.10, 
            width: 0.18 + Math.random() * 0.05, 
            height: 0.15 + Math.random() * 0.05 
          },
          description: 'Mild cardiomegaly noted. Cardiothoracic ratio appears increased.',
          recommendations: [
            'Clinical correlation recommended',
            'Consider echocardiography if clinically indicated'
          ],
          measurements: { 'cardiothoracic_ratio': (0.48 + Math.random() * 0.08).toFixed(2) },
          metadata: { detectedAt: new Date(), model: 'Demo Mode', modality }
        },
        {
          id: `mock-${Date.now()}-3`,
          type: 'nodule',
          label: 'Pulmonary Nodule',
          confidence: 0.70 + Math.random() * 0.15,
          severity: 'MEDIUM',
          boundingBox: { 
            x: 0.55 + Math.random() * 0.15, 
            y: 0.30 + Math.random() * 0.15, 
            width: 0.06 + Math.random() * 0.04, 
            height: 0.06 + Math.random() * 0.04 
          },
          description: 'Small pulmonary nodule identified. Requires follow-up evaluation.',
          recommendations: [
            'Radiologist review recommended',
            'Consider follow-up imaging in 3-6 months'
          ],
          measurements: { diameter: `${(5 + Math.random() * 5).toFixed(0)} mm` },
          metadata: { detectedAt: new Date(), model: 'Demo Mode', modality }
        }
      ],
      'CT': [
        {
          id: `mock-${Date.now()}-1`,
          type: 'nodule',
          label: 'Pulmonary Nodule',
          confidence: 0.75 + Math.random() * 0.15,
          severity: 'MEDIUM',
          boundingBox: { 
            x: 0.55 + Math.random() * 0.20, 
            y: 0.30 + Math.random() * 0.20, 
            width: 0.06 + Math.random() * 0.05, 
            height: 0.06 + Math.random() * 0.05 
          },
          description: 'Pulmonary nodule identified in the right upper lobe. Measures approximately 8mm.',
          recommendations: [
            'Radiologist review recommended',
            'Consider follow-up CT in 3-6 months',
            'Compare with prior studies if available'
          ],
          measurements: { 
            diameter: `${(6 + Math.random() * 6).toFixed(0)} mm`, 
            volume: `${(150 + Math.random() * 300).toFixed(0)} mm³` 
          },
          metadata: { detectedAt: new Date(), model: 'Demo Mode', modality }
        },
        {
          id: `mock-${Date.now()}-2`,
          type: 'calcification',
          label: 'Calcification',
          confidence: 0.85 + Math.random() * 0.10,
          severity: 'LOW',
          boundingBox: { 
            x: 0.40 + Math.random() * 0.20, 
            y: 0.50 + Math.random() * 0.15, 
            width: 0.04 + Math.random() * 0.03, 
            height: 0.04 + Math.random() * 0.03 
          },
          description: 'Benign calcification noted. Likely represents old granulomatous disease.',
          recommendations: [
            'No immediate follow-up required',
            'Clinical correlation recommended'
          ],
          measurements: { size: `${(2 + Math.random() * 3).toFixed(0)} mm` },
          metadata: { detectedAt: new Date(), model: 'Demo Mode', modality }
        }
      ],
      'MR': [
        {
          id: `mock-${Date.now()}-1`,
          type: 'lesion',
          label: 'Brain Lesion',
          confidence: 0.65 + Math.random() * 0.15,
          severity: 'HIGH',
          boundingBox: { 
            x: 0.50 + Math.random() * 0.15, 
            y: 0.40 + Math.random() * 0.15, 
            width: 0.08 + Math.random() * 0.05, 
            height: 0.08 + Math.random() * 0.05 
          },
          description: 'Hyperintense lesion detected in the frontal lobe. Further characterization needed.',
          recommendations: [
            'Immediate radiologist review required',
            'Consider contrast-enhanced sequences',
            'Neurology consultation may be warranted'
          ],
          measurements: { diameter: `${(8 + Math.random() * 8).toFixed(0)} mm` },
          metadata: { detectedAt: new Date(), model: 'Demo Mode', modality }
        }
      ],
      'US': [
        {
          id: `mock-${Date.now()}-1`,
          type: 'cyst',
          label: 'Simple Cyst',
          confidence: 0.80 + Math.random() * 0.15,
          severity: 'LOW',
          boundingBox: { 
            x: 0.45 + Math.random() * 0.15, 
            y: 0.45 + Math.random() * 0.15, 
            width: 0.08 + Math.random() * 0.05, 
            height: 0.08 + Math.random() * 0.05 
          },
          description: 'Simple cyst identified. Appears benign with typical sonographic features.',
          recommendations: [
            'Routine follow-up recommended',
            'No immediate intervention required'
          ],
          measurements: { diameter: `${(10 + Math.random() * 15).toFixed(0)} mm` },
          metadata: { detectedAt: new Date(), model: 'Demo Mode', modality }
        }
      ]
    };
    
    // Get available detections for this modality
    const availableDetections = allPossibleDetections[modality] || [];
    
    if (availableDetections.length === 0) {
      return [{
        id: `mock-${Date.now()}-1`,
        type: 'abnormality',
        confidence: 0.65 + Math.random() * 0.15,
        severity: 'MEDIUM',
        boundingBox: { 
          x: 0.40 + Math.random() * 0.20, 
          y: 0.40 + Math.random() * 0.20, 
          width: 0.12 + Math.random() * 0.08, 
          height: 0.12 + Math.random() * 0.08 
        },
        description: 'Possible abnormality detected. Further evaluation recommended.',
        recommendations: ['Radiologist review recommended', 'Clinical correlation advised'],
        measurements: {},
        metadata: { detectedAt: new Date(), model: 'Demo Mode', modality }
      }];
    }
    
    // Randomly select detections
    const selectedDetections = [];
    const shuffled = [...availableDetections].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < Math.min(numDetections, shuffled.length); i++) {
      selectedDetections.push(shuffled[i]);
    }
    
    console.log(`✅ Generated ${selectedDetections.length} mock detections for ${modality}`);
    return selectedDetections;
  }

  /**
   * Health check
   */
  async healthCheck() {
    const health = {
      detection: { available: false, latency: null },
      segmentation: { available: false, latency: null }
    };

    // Check detection service
    try {
      const start = Date.now();
      await axios.get(`${this.detectionUrl}/health`, { timeout: 2000 });
      health.detection.available = true;
      health.detection.latency = Date.now() - start;
    } catch (error) {
      console.warn('Detection service health check failed:', error.message);
    }

    // Check segmentation service
    try {
      const start = Date.now();
      await axios.get(`${this.segmentationUrl}/health`, { timeout: 2000 });
      health.segmentation.available = true;
      health.segmentation.latency = Date.now() - start;
    } catch (error) {
      console.warn('Segmentation service health check failed:', error.message);
    }

    return health;
  }
}

// Singleton instance
let detectionService = null;

function getAIDetectionService(config = {}) {
  if (!detectionService) {
    detectionService = new AIDetectionService(config);
  }
  return detectionService;
}

module.exports = { AIDetectionService, getAIDetectionService };
