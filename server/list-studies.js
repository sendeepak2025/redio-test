const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const Study = require('./src/models/Study');
const Instance = require('./src/models/Instance');

async function listStudies() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const studies = await Study.find({}).lean();
    console.log(`Found ${studies.length} studies in MongoDB:\n`);
    
    for (const study of studies) {
      console.log(`Study: ${study.studyInstanceUID}`);
      console.log(`  Patient: ${study.patientName} (${study.patientID})`);
      console.log(`  Date: ${study.studyDate}`);
      console.log(`  Modality: ${study.modality}`);
      
      const instanceCount = await Instance.countDocuments({ studyInstanceUID: study.studyInstanceUID });
      console.log(`  Instances in DB: ${instanceCount}`);
      console.log('');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

listStudies();
