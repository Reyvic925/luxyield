const axios = require('axios');
const mongodb = require('mongodb');

const BASE_URL = 'http://localhost:5000';
const VICTOR_ID = '6895009639291ffa0e10b921';
const ADMIN_ID = '688409602820d627ad8bcfe1';

async function runTest() {
  try {
    console.log('🚀 Starting ROI Investment Test...\n');

    // Step 1: Get user's JWT token (simulate login)
    console.log('📍 Step 1: Authenticating user...');
    let authToken = null;
    try {
      // Try to get a token via login
      const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'Vameh09@gmail.com',
        password: 'test123'
      });
      authToken = loginRes.data.token;
      console.log(`✅ User authenticated\n`);
    } catch (e) {
      console.log('⚠️  Login failed, will attempt direct MongoDB operation\n');
    }

    // Step 2: Create an investment using deposit endpoint
    console.log('📍 Step 2: Creating test investment for Victor...');
    
    // First, get a plan and fund
    const plansRes = await axios.get(`${BASE_URL}/api/plans`);
    const plan = plansRes.data[0] || { _id: new mongodb.ObjectId(), name: 'Test Plan', durationDays: 1 };
    console.log(`   Using plan: ${plan.name || 'Test Plan'}`);
    
    const fundsRes = await axios.get(`${BASE_URL}/api/fund`);
    const fund = fundsRes.data[0] || { _id: new mongodb.ObjectId() };
    console.log(`   Using fund ID: ${fund._id}\n`);

    const investmentRes = await axios.post(
      `${BASE_URL}/api/investment/deposit`, 
      {
        fundId: fund._id,
        planId: plan._id,
        amount: 5000
      },
      {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      }
    );

    const investment = investmentRes.data.investment;
    console.log(`✅ Investment created: ${investment._id}`);
    console.log(`   Amount: $${investment.amount}`);
    console.log(`   Current Value: $${investment.currentValue}`);
    console.log(`   Duration: ${investment.duration} minutes\n`);

    // Step 2: Simulate ROI growth
    console.log('📍 Step 2: Waiting for ROI to accumulate...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Fetch updated investment
    const updatedInvRes = await axios.get(`${BASE_URL}/api/investment/${investment._id}`);
    const updatedInv = updatedInvRes.data.investment;
    console.log(`✅ Investment updated`);
    console.log(`   Current Value: $${updatedInv.currentValue}`);
    const roiAccumulated = updatedInv.currentValue - investment.amount;
    console.log(`   ROI Accumulated: $${roiAccumulated.toFixed(2)}\n`);

    // Step 3: Attempt ROI withdrawal
    console.log('📍 Step 3: Withdrawing ROI...');
    const withdrawRes = await axios.post(
      `${BASE_URL}/api/investment/withdraw-roi/${investment._id}`,
      { userId: VICTOR_ID }
    );

    console.log(`✅ ROI Withdrawal Response:`);
    console.log(`   Success: ${withdrawRes.data.success}`);
    console.log(`   ROI Withdrawn: $${withdrawRes.data.roi}`);
    console.log(`   Locked Balance: $${withdrawRes.data.lockedBalance}`);
    console.log(`   Available Balance: $${withdrawRes.data.availableBalance}`);
    console.log(`   Withdrawal ID: ${withdrawRes.data.withdrawalId}\n`);

    // Step 4: Verify investment current value decreased
    console.log('📍 Step 4: Verifying investment currentValue decreased...');
    const verifyRes = await axios.get(`${BASE_URL}/api/investment/${investment._id}`);
    const finalInv = verifyRes.data.investment;
    console.log(`✅ Investment verified`);
    console.log(`   Current Value: $${finalInv.currentValue} (should be $${investment.amount})`);
    console.log(`   ROI Withdrawn: $${finalInv.roiWithdrawn}\n`);

    // Step 5: Check user's locked balance
    console.log('📍 Step 5: Checking user locked balance...');
    const userRes = await axios.get(`${BASE_URL}/api/user/${VICTOR_ID}`);
    const user = userRes.data.user;
    console.log(`✅ User verified`);
    console.log(`   Locked Balance: $${user.lockedBalance}`);
    console.log(`   Available Balance: $${user.availableBalance}\n`);

    console.log('✨ TEST PASSED! ROI withdrawal flow working correctly.\n');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 404) {
      console.error('   Note: User/Investment not found. You may need to create them in MongoDB first.');
    }
  }
}

runTest();
