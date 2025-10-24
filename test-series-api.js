// Quick test script to check if series are being fetched correctly
// Run with: node test-series-api.js

const axios = require('axios');

const API_BASE = 'http://localhost:8001';
const STUDY_UID = '1.2.840.113619.2.482.3.2831195393.851.1709524269.885';

async function testSeriesAPI() {
    console.log('🧪 Testing Series API...\n');

    try {
        // Test 1: Get study metadata
        console.log('📡 Fetching study metadata...');
        const response = await axios.get(
            `${API_BASE}/api/dicom/studies/${STUDY_UID}/metadata`,
            {
                headers: {
                    'Authorization': 'Bearer YOUR_TOKEN_HERE' // Replace with actual token if needed
                }
            }
        );

        if (response.data.success) {
            const data = response.data.data;
            console.log('✅ Study metadata fetched successfully!\n');

            console.log('📊 Study Information:');
            console.log(`   Study UID: ${data.studyInstanceUID}`);
            console.log(`   Patient: ${data.patientName}`);
            console.log(`   Modality: ${data.modality}`);
            console.log(`   Number of Series: ${data.numberOfSeries}`);
            console.log(`   Total Instances: ${data.numberOfInstances}\n`);

            if (data.series && data.series.length > 0) {
                console.log(`📁 Series Details (${data.series.length} series found):\n`);

                data.series.forEach((series, index) => {
                    console.log(`   Series ${index + 1}:`);
                    console.log(`      UID: ${series.seriesInstanceUID}`);
                    console.log(`      Number: ${series.seriesNumber}`);
                    console.log(`      Description: ${series.seriesDescription || 'N/A'}`);
                    console.log(`      Modality: ${series.modality}`);
                    console.log(`      Images: ${series.numberOfInstances}`);
                    console.log('');
                });

                if (data.series.length > 1) {
                    console.log('✅ Multiple series detected! Series selector should appear.');
                } else {
                    console.log('ℹ️  Only one series found. Series selector will be hidden.');
                }
            } else {
                console.log('⚠️  No series data found!');
            }
        } else {
            console.log('❌ Failed to fetch study metadata:', response.data.message);
        }

    } catch (error) {
        console.error('❌ Error testing API:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
    }
}

// Run the test
testSeriesAPI();
