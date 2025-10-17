/**
 * Test Login Script
 * Tests login for both superadmin and hospital users
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8001';

// Test credentials
const testUsers = [
  {
    name: 'Super Admin (username)',
    credentials: {
      username: 'superadmin',
      password: '12345678'
    },
    expectedRole: 'superadmin',
    expectedHospitalId: null
  },
  {
    name: 'Super Admin (email)',
    credentials: {
      email: 'superadmin@gmail.com',
      password: '12345678'
    },
    expectedRole: 'superadmin',
    expectedHospitalId: null
  },
  {
    name: 'Hospital Admin (username)',
    credentials: {
      username: 'hospital',
      password: '123456'
    },
    expectedRole: 'admin',
    expectedHospitalId: 'HOSP001'
  },
  {
    name: 'Hospital Admin (email)',
    credentials: {
      email: 'hospital@gmail.com',
      password: '123456'
    },
    expectedRole: 'admin',
    expectedHospitalId: 'HOSP001'
  },
  {
    name: 'Default Admin (username)',
    credentials: {
      username: 'admin',
      password: 'admin123'
    },
    expectedRole: 'admin',
    expectedHospitalId: 'HOSP001'
  }
];

async function testLogin(testCase) {
  try {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log(`   Credentials:`, testCase.credentials);

    const response = await axios.post(`${BASE_URL}/auth/login`, testCase.credentials, {
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });

    if (response.data.success) {
      console.log(`   ✅ Login successful`);
      console.log(`   User: ${response.data.user.username} (${response.data.user.email})`);
      console.log(`   Role: ${response.data.role}`);
      console.log(`   Hospital ID: ${response.data.hospitalId || 'null'}`);
      console.log(`   Roles: ${response.data.user.roles.join(', ')}`);
      
      // Verify expected values
      if (response.data.role !== testCase.expectedRole) {
        console.log(`   ⚠️  Expected role: ${testCase.expectedRole}, got: ${response.data.role}`);
      }
      
      if (response.data.hospitalId !== testCase.expectedHospitalId) {
        console.log(`   ⚠️  Expected hospitalId: ${testCase.expectedHospitalId}, got: ${response.data.hospitalId}`);
      }
      
      return true;
    } else {
      console.log(`   ❌ Login failed: ${response.data.message}`);
      return false;
    }
  } catch (error) {
    if (error.response) {
      console.log(`   ❌ Login failed: ${error.response.data.message || error.response.statusText}`);
      console.log(`   Status: ${error.response.status}`);
    } else if (error.request) {
      console.log(`   ❌ No response from server`);
      console.log(`   Make sure the server is running on ${BASE_URL}`);
    } else {
      console.log(`   ❌ Error: ${error.message}`);
    }
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Login Tests');
  console.log(`   Server: ${BASE_URL}`);
  console.log('='.repeat(60));

  let passed = 0;
  let failed = 0;

  for (const testCase of testUsers) {
    const result = await testLogin(testCase);
    if (result) {
      passed++;
    } else {
      failed++;
    }
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(60));
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('✅ All tests passed!');
  } else {
    console.log('❌ Some tests failed. Check the output above.');
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
