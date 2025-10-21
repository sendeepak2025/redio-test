// Quick test script to check if follow-up API is working
const BASE_URL = process.env.API_URL || 'http://localhost:5000';

async function testFollowUpAPI() {
  try {
    console.log('Testing Follow-up API...\n');
    
    // First, login to get a token
    console.log('1. Logging in...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✓ Login successful\n');
    
    // Test follow-ups endpoint
    console.log('2. Testing GET /api/follow-ups...');
    const followUpsResponse = await fetch(`${BASE_URL}/api/follow-ups`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!followUpsResponse.ok) {
      throw new Error(`Follow-ups request failed: ${followUpsResponse.status} ${followUpsResponse.statusText}`);
    }
    
    const followUpsData = await followUpsResponse.json();
    console.log('✓ Follow-ups endpoint working!');
    console.log(`  Found ${followUpsData.data?.length || 0} follow-ups\n`);
    
    // Test statistics endpoint
    console.log('3. Testing GET /api/follow-ups/statistics...');
    const statsResponse = await fetch(`${BASE_URL}/api/follow-ups/statistics`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!statsResponse.ok) {
      throw new Error(`Statistics request failed: ${statsResponse.status} ${statsResponse.statusText}`);
    }
    
    const statsData = await statsResponse.json();
    console.log('✓ Statistics endpoint working!');
    console.log('  Statistics:', JSON.stringify(statsData.data, null, 2));
    
    console.log('\n✅ All follow-up API tests passed!');
    console.log('\n📋 Summary:');
    console.log('  - Backend API: ✓ Working');
    console.log('  - Follow-ups route: ✓ Registered');
    console.log('  - Authentication: ✓ Working');
    console.log('\n💡 If the frontend is not showing follow-ups:');
    console.log('  1. Check browser console for errors');
    console.log('  2. Verify you are logged in with proper permissions');
    console.log('  3. Check that the frontend is connecting to the correct API URL');
    console.log('  4. Try refreshing the page or clearing browser cache');
    
  } catch (error) {
    console.error('\n❌ Error testing follow-up API:');
    console.error(`  ${error.message}`);
    console.error('\n🔍 Troubleshooting:');
    console.error('  - Is the backend server running on port 5000?');
    console.error('  - Check server logs for errors');
    console.error('  - Verify MongoDB is running and connected');
    process.exit(1);
  }
}

testFollowUpAPI();
