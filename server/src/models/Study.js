const mongoose = require('mongoose');

const StudySchema = new mongoose.Schema({
  studyInstanceUID: { type: String, unique: true, index: true },
  studyDate: String,
  studyTime: String,
  patientName: String,
  patientID: String,
  patientBirthDate: String,
  patientSex: String,
  modality: String,
  studyDescription: String,
  numberOfSeries: Number,
  numberOfInstances: Number,
  
  // AI Analysis Results
  aiAnalysis: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  aiAnalyzedAt: Date,
  aiModels: [String] // List of AI models used (e.g., ['MedSigLIP-0.4B', 'MedGemma-4B'])
}, { timestamps: true });

module.exports = mongoose.model('Study', StudySchema);