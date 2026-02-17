const axios = require('axios');

const BASE_URL = 'https://api.luxyield.com';
const USER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2VhOTU5ZTM2YWRhZDE1NjEzNTVhOSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzcxMzI1MDYxLCJleHAiOjE3NzE5Mjk4NjF9.79flAN6prvY_a2lpTq9cLW-cLKDU8PwMjkhMnAIRs34';

async function testCompleteFlow() {
  try {
    console.log('🚀 Testing Complete ROI Withdrawal Flow...\n');
    
    const api = axios.create({
      baseURL: BASE_URL,
      headers: {
        Authorization: `Bearer ${USER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    // Step 1: Get current balances
    console.log('📍 Step 1: Fetching current balances...');
    const portfolioRes1 = await api.get('/api/portfolio');
    const userInfo1 = portfolioRes1.data.userInfo || {};
    console.log(`✅ Before Withdrawal:`);
    console.log(`   Available Balance: $${userInfo1.availableBalance || 0}`);
    console.log(`   Locked Balance: $${userInfo1.lockedBalance || 0}\n`);

    const investments = portfolioRes1.data.investments || [];
    const completedInv = investments.find(i => i.status === 'completed' && !i.roiWithdrawn);
    
    if (!completedInv) {
      console.log('⚠️  No completed investment with un-withdrawn ROI\n');
      return;
    }

    const roi = completedInv.currentValue - completedInv.initialAmount;
    console.log(`📍 Step 2: Investment Details:`);
    console.log(`   Initial Amount: $${completedInv.initialAmount}`);
    console.log(`   Current Value: $${completedInv.currentValue}`);
    console.log(`   ROI: $${roi.toFixed(2)}\n`);

    // Step 2: Perform ROI withdrawal
    console.log('📍 Step 3: Performing ROI withdrawal...');
    const withdrawRes = await api.post(`/api/investment/withdraw-roi/${completedInv.id}`, {});
    
    console.log(`✅ Withdrawal Response:`);
    console.log(`   Success: ${withdrawRes.data.success}`);
    console.log(`   Message: ${withdrawRes.data.message}`);
    console.log(`   ROI Withdrawn: $${withdrawRes.data.roi}`);
    console.log(`   Response Locked Balance: $${withdrawRes.data.lockedBalance}`);
    console.log(`   Response Available Balance: $${withdrawRes.data.availableBalance}\n`);

    // Step 3: Fetch updated balances from portfolio
    console.log('📍 Step 4: Fetching updated balances from portfolio API...');
    const portfolioRes2 = await api.get('/api/portfolio');
    const userInfo2 = portfolioRes2.data.userInfo || {};
    console.log(`✅ After Withdrawal:`);
    console.log(`   Available Balance: $${userInfo2.availableBalance || 0}`);
    console.log(`   Locked Balance: $${userInfo2.lockedBalance || 0}\n`);

    // Step 4: Verify the changes
    console.log('📍 Step 5: Verification...');
    const expectedLocked = (userInfo1.lockedBalance || 0) + roi;
    const actualLocked = userInfo2.lockedBalance || 0;
    const lockMatch = Math.abs(actualLocked - expectedLocked) < 0.01;
    
    console.log(`Expected Locked Balance: $${expectedLocked.toFixed(2)}`);
    console.log(`Actual Locked Balance: $${actualLocked.toFixed(2)}`);
    console.log(`Match: ${lockMatch ? '✅ YES' : '❌ NO'}\n`);

    if (lockMatch) {
      console.log('✨ TEST PASSED! Locked balance updated correctly.\n');
    } else {
      console.log('❌ TEST FAILED! Locked balance did not update as expected.\n');
      console.log('Issue Details:');
      console.log(`  - ROI was: $${roi.toFixed(2)}`);
      console.log(`  - Expected increase in locked balance: $${roi.toFixed(2)}`);
      console.log(`  - Actual increase in locked balance: $${(actualLocked - (userInfo1.lockedBalance || 0)).toFixed(2)}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response?.data) {
      console.error('Response:', error.response.data);
    }
  }
}

testCompleteFlow();
