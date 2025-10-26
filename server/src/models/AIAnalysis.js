const mongoose = require('mongoose');

const aiAnalysisSchema = new mongoose.Schema({
  analysisId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  type: {
    type: String,
    enum: ['single', 'multi-slice'],
    required: true
  },
  
  // Study References
  studyInstanceUID: {
    type: String,
    required: true,
    index: true
  },
  seriesInstanceUID: String,
  instanceUID: String,
  frameIndex: Number,
  frameCount: Number,
  sampleRate: Number,
  
  // Status
  status: {
    type: String,
    enum: ['processing', 'complete', 'failed', 'cancelled'],
    default: 'processing',
    index: true
  },
  
  // Progress (for multi-slice)
  progress: {
    current: { type: Number, default: 0 },
    total: { type: Number, default: 1 },
    percentage: { type: Number, default: 0 },
    currentStep: String
  },
  
  // Results
  results: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  // AI Models Used
  aiModels: [String],
  
  // Timing
  analyzedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  completedAt: Date,
  failedAt: Date,
  cancelledAt: Date,
  processingTime: Number, // seconds
  
  // Error Info
  error: String,
  retryCount: {
    type: Number,
    default: 0
  },
  
  // Options
  options: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Linked Report (for radiologist review workflow)
  linkedReportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StructuredReport',
    default: null
  },
  
  // Workflow Status
  workflowStatus: {
    type: String,
    enum: ['draft', 'reviewed', 'final'],
    default: 'draft',
    index: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
aiAnalysisSchema.index({ studyInstanceUID: 1, analyzedAt: -1 });
aiAnalysisSchema.index({ status: 1, analyzedAt: -1 });
aiAnalysisSchema.index({ type: 1, status: 1 });

// Virtual for age
aiAnalysisSchema.virtual('age').get(function() {
  if (this.completedAt) {
    return Math.round((this.completedAt - this.analyzedAt) / 1000);
  }
  return Math.round((Date.now() - this.analyzedAt) / 1000);
});

module.exports = mongoose.model('AIAnalysis', aiAnalysisSchema);
