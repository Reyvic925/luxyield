const axios = require('axios');

const BASE_URL = 'https://api.luxyield.com';
const USER_ID = '68cea959e36adad156135a9';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2VhOTU5ZTM2YWRhZDE1NjEzNTVhOSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzcxMzI1MDYxLCJleHAiOjE3NzE5Mjk4NjF9.79flAN6prvY_a2lpTq9cLW-cLKDU8PwMjkhMnAIRs34';

async function runTest() {
  try {
    console.log('🚀 Starting Production ROI Test...\n');
    
    // Setup axios with production auth
    const api = axios.create({
      baseURL: BASE_URL,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    // Step 1: Verify user info
    console.log('📍 Step 1: Fetching user details...');
    try {
      const userRes = await api.get(`/api/user/${USER_ID}`);
      console.log('✅ User Response:', JSON.stringify(userRes.data, null, 2).substring(0, 500));
    } catch (e) {
      console.log('⚠️  User endpoint:', e.response?.status, e.response?.statusText);
    }

    // Step 2: Get portfolio
    console.log('\n📍 Step 2: Fetching portfolio...');
    try {
      const portfolioRes = await api.get('/api/portfolio');
      console.log('✅ Portfolio Response:', JSON.stringify(portfolioRes.data, null, 2).substring(0, 500));
    } catch (e) {
      console.log('⚠️  Portfolio endpoint:', e.response?.status, e.response?.statusText);
      if (e.response?.data) {
        console.log('Error:', e.response.data);
      }
    }

    // Step 3: Get plans for creating investment
    console.log('\n📍 Step 3: Fetching available plans...');
    try {
      const plansRes = await api.get('/api/plans');
      const plans = plansRes.data;
      console.log(`✅ Found ${plans.length} plans`);
      if (plans.length > 0) {
        console.log('   Plan 1:', JSON.stringify(plans[0], null, 2).substring(0, 300));
      }
    } catch (e) {
      console.log('⚠️  Plans endpoint:', e.response?.status);
    }

    // Step 4: Get funds
    console.log('\n📍 Step 4: Fetching available funds...');
    try {
      const fundsRes = await api.get('/api/fund');
      const funds = fundsRes.data;
      console.log(`✅ Found ${funds.length} funds`);
      if (funds.length > 0) {
        console.log('   Fund 1:', JSON.stringify(funds[0], null, 2).substring(0, 300));
      }
    } catch (e) {
      console.log('⚠️  Funds endpoint:', e.response?.status);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

runTest();
