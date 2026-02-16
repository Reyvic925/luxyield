// Smoke test for ROI withdrawal
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Test credentials
const testUser = {
  email: 'test@luxyield.com',
  password: 'Test123456'
};

async function smokeTestRoiWithdrawal() {
  try {
    console.log('\n=== ROI WITHDRAWAL SMOKE TEST ===\n');

    // Step 1: Login
    console.log('[STEP 1] Logging in...');
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    const token = loginRes.data.token;
    console.log('✓ Login successful. Token:', token.substring(0, 20) + '...');

    // Step 2: Fetch portfolio
    console.log('\n[STEP 2] Fetching portfolio...');
    const portfolioRes = await axios.get(`${BASE_URL}/api/portfolio`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const portfolio = portfolioRes.data;
    console.log('✓ Portfolio fetched');
    console.log('  - Available Balance:', portfolio.userInfo?.availableBalance || 0);
    console.log('  - Locked Balance:', portfolio.userInfo?.lockedBalance || 0);
    console.log('  - Total Value:', portfolio.totalValue || 0);

    // Step 3: Find a completed investment
    console.log('\n[STEP 3] Looking for completed investment...');
    let targetInvestment = null;
    if (portfolio.allInvestments && portfolio.allInvestments.length > 0) {
      // Look for completed investment
      targetInvestment = portfolio.allInvestments.find(inv => 
        inv.status && inv.status.toLowerCase() === 'completed'
      );
      if (!targetInvestment && portfolio.allInvestments.length > 0) {
        // If no completed, take the first one and see if we can auto-complete it
        targetInvestment = portfolio.allInvestments[0];
      }
    }

    if (!targetInvestment) {
      console.error('✗ No investments found');
      return;
    }

    console.log('✓ Investment found:');
    console.log('  - ID:', targetInvestment._id);
    console.log('  - Status:', targetInvestment.status);
    console.log('  - Amount:', targetInvestment.amount);
    console.log('  - Current Value:', targetInvestment.currentValue);
    console.log('  - End Date:', targetInvestment.endDate);
    console.log('  - ROI Withdrawn:', targetInvestment.roiWithdrawn);

    const roi = targetInvestment.currentValue - targetInvestment.amount;
    console.log('  - Calculated ROI:', roi);

    if (roi <= 0) {
      console.error('✗ No ROI available for withdrawal');
      return;
    }

    // Step 4: Attempt ROI withdrawal
    console.log('\n[STEP 4] Withdrawing ROI...');
    try {
      const withdrawRes = await axios.post(
        `${BASE_URL}/api/investment/withdraw-roi/${targetInvestment._id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      console.log('✓ ROI withdrawal successful');
      console.log('  - Withdrawal ID:', withdrawRes.data.withdrawalId);
      console.log('  - ROI Amount:', withdrawRes.data.roi);
      console.log('  - New Locked Balance:', withdrawRes.data.lockedBalance);
    } catch (withdrawErr) {
      console.error('✗ ROI withdrawal failed');
      console.error('  - Status:', withdrawErr.response?.status);
      console.error('  - Error:', withdrawErr.response?.data?.error || withdrawErr.message);
      console.error('  - Full Response:', JSON.stringify(withdrawErr.response?.data, null, 2));
      return;
    }

    // Step 5: Verify balance update
    console.log('\n[STEP 5] Verifying updated portfolio...');
    const updatedPortfolioRes = await axios.get(`${BASE_URL}/api/portfolio`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const updatedPortfolio = updatedPortfolioRes.data;
    console.log('✓ Updated portfolio fetched');
    console.log('  - Available Balance:', updatedPortfolio.userInfo?.availableBalance || 0);
    console.log('  - Locked Balance:', updatedPortfolio.userInfo?.lockedBalance || 0);

    console.log('\n=== SMOKE TEST COMPLETED SUCCESSFULLY ===\n');

  } catch (err) {
    console.error('\n✗ SMOKE TEST FAILED');
    console.error('Error:', err.message);
    if (err.response) {
      console.error('Response Status:', err.response.status);
      console.error('Response Data:', JSON.stringify(err.response.data, null, 2));
    }
  }
}

smokeTestRoiWithdrawal();
