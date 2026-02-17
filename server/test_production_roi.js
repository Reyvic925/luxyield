const axios = require('axios');
const mongoose = require('mongoose');

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

    // Step 1: Verify user authentication
    console.log('📍 Step 1: Verifying user authentication...');
    try {
      const userRes = await api.get(`/api/user/${USER_ID}`);
      const user = userRes.data.user || userRes.data;
      console.log(`✅ User authenticated`);
      console.log(`   Name: ${user.name || 'N/A'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Available Balance: $${user.availableBalance || 0}`);
      console.log(`   Locked Balance: $${user.lockedBalance || 0}\n`);
    } catch (e) {
      console.log(`⚠️  Could not fetch user profile: ${e.message}\n`);
    }

    // Step 2: Get user's existing investments
    console.log('📍 Step 2: Fetching user investments...');
    try {
      const portfolioRes = await api.get('/api/portfolio');
      const investments = portfolioRes.data.investments || [];
      console.log(`✅ Found ${investments.length} investments`);
      
      if (investments.length > 0) {
        const investment = investments[0];
        console.log(`\n   Investment 1:`);
        console.log(`   ID: ${investment._id}`);
        console.log(`   Amount: $${investment.amount}`);
        console.log(`   Current Value: $${investment.currentValue}`);
        console.log(`   ROI Available: $${investment.currentValue - investment.amount}`);
        console.log(`   Status: ${investment.status}\n`);

        // If investment has ROI, try to withdraw it
        const roi = investment.currentValue - investment.amount;
        if (roi > 0 && investment.status === 'active') {
          console.log('📍 Step 3: Testing ROI withdrawal...');
          try {
            const withdrawRes = await api.post(
              `/api/investment/withdraw-roi/${investment._id}`,
              {}
            );

            console.log(`✅ ROI Withdrawal Response:`);
            console.log(`   Success: ${withdrawRes.data.success}`);
            console.log(`   Message: ${withdrawRes.data.message}`);
            console.log(`   ROI Withdrawn: $${withdrawRes.data.roi}`);
            console.log(`   Locked Balance: $${withdrawRes.data.lockedBalance}`);
            console.log(`   Available Balance: $${withdrawRes.data.availableBalance}`);
            console.log(`   Withdrawal ID: ${withdrawRes.data.withdrawalId}\n`);

            console.log('✨ TEST PASSED! ROI withdrawal working in production.\n');
          } catch (e) {
            console.error(`❌ Withdrawal failed: ${e.response?.data?.message || e.message}`);
            if (e.response?.data) {
              console.error('Response:', e.response.data);
            }
          }
        } else {
          console.log(`⚠️  No ROI available to withdraw (ROI: $${roi}, Status: ${investment.status})\n`);
        }
      } else {
        console.log(`⚠️  No investments found\n`);
      }
    } catch (e) {
      console.error(`❌ Could not fetch portfolio: ${e.message}`);
      if (e.response?.status === 401) {
        console.error('   Token may have expired. Please update the token.');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTest();
