const axios = require('axios');

const BASE_URL = 'https://api.luxyield.com';
const USER_ID = '68cea959e36adad156135a9';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2VhOTU5ZTM2YWRhZDE1NjEzNTVhOSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzcxMzI1MDYxLCJleHAiOjE3NzE5Mjk4NjF9.79flAN6prvY_a2lpTq9cLW-cLKDU8PwMjkhMnAIRs34';

async function runTest() {
  try {
    console.log('🚀 Starting Production ROI Withdrawal Test...\n');
    
    const api = axios.create({
      baseURL: BASE_URL,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    // Step 1: Get portfolio
    console.log('📍 Step 1: Fetching portfolio...');
    const portfolioRes = await api.get('/api/portfolio');
    const investments = portfolioRes.data.investments || [];
    console.log(`✅ Found ${investments.length} investment(s)\n`);

    if (investments.length === 0) {
      console.log('⚠️  No investments to test\n');
      return;
    }

    const investment = investments[0];
    console.log(`   Investment Details:`);
    console.log(`   ID: ${investment.id}`);
    console.log(`   Fund: ${investment.fundName}`);
    console.log(`   Amount: $${investment.initialAmount}`);
    console.log(`   Current Value: $${investment.currentValue}`);
    console.log(`   ROI Accumulated: $${investment.roi}`);
    console.log(`   Status: ${investment.status}`);
    console.log(`   ROI Withdrawn: ${investment.roiWithdrawn}\n`);

    // Step 2: Attempt ROI withdrawal
    console.log('📍 Step 2: Attempting ROI withdrawal...');
    try {
      const withdrawRes = await api.post(
        `/api/investment/withdraw-roi/${investment.id}`,
        {}
      );

      console.log(`✅ ROI Withdrawal Successful!`);
      console.log(`   Response:`);
      console.log(`   - Success: ${withdrawRes.data.success}`);
      console.log(`   - Message: ${withdrawRes.data.message}`);
      console.log(`   - ROI Withdrawn: $${withdrawRes.data.roi}`);
      console.log(`   - Locked Balance: $${withdrawRes.data.lockedBalance}`);
      console.log(`   - Available Balance: $${withdrawRes.data.availableBalance}`);
      console.log(`   - Withdrawal ID: ${withdrawRes.data.withdrawalId}\n`);

      console.log('✨ TEST PASSED! ROI withdrawal endpoint is working correctly.\n');

      // Step 3: Verify updated investment
      console.log('📍 Step 3: Verifying updated investment...');
      const updatedPortfolio = await api.get('/api/portfolio');
      const updatedInv = updatedPortfolio.data.investments.find(i => i.id === investment.id);
      if (updatedInv) {
        console.log(`   Current Value (updated): $${updatedInv.currentValue}`);
        console.log(`   ROI Withdrawn Flag: ${updatedInv.roiWithdrawn}\n`);
      }

    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data?.msg || error.message;
      const errorCode = error.response?.status;
      
      console.log(`❌ ROI Withdrawal Failed`);
      console.log(`   Status Code: ${errorCode}`);
      console.log(`   Error: ${errorMsg}\n`);

      if (errorCode === 400) {
        console.log('   → Investment may not be in a withdrawable state');
      } else if (errorCode === 404) {
        console.log('   → Endpoint not found or investment not found');
      } else if (errorCode === 401) {
        console.log('   → Token expired or invalid');
      }

      if (error.response?.data) {
        console.log('   Full Response:', error.response.data);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response?.data) {
      console.error('Response:', error.response.data);
    }
  }
}

runTest();
