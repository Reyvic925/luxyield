// server/scripts/test_roi_withdrawal.js
// Smoke test for ROI withdrawal flow
const mongoose = require('mongoose');
const Investment = require('../models/Investment');
const User = require('../models/User');
const Withdrawal = require('../models/Withdrawal');

const MONGO_URI = process.env.MONGO_URI;
const TEST_USER_ID = process.env.TEST_USER_ID || '6895009639291ffa0e10b921'; // From your logs
const TEST_INVESTMENT_ID = process.env.TEST_INVESTMENT_ID; // Pass as env var or use first found

async function runSmokeTest() {
  console.log('\n========== ROI WITHDRAWAL SMOKE TEST ==========\n');
  
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✓ Connected to MongoDB');

    // 1. Find a matured investment
    const now = new Date();
    const investment = await Investment.findOne({
      user: TEST_USER_ID,
      status: 'active',
      endDate: { $lt: now }
    });

    if (!investment) {
      console.log('✗ No matured (active with past endDate) investments found for user');
      const allInv = await Investment.find({ user: TEST_USER_ID });
      console.log(`  Found ${allInv.length} total investments:`, allInv.map(i => ({
        id: i._id,
        status: i.status,
        amount: i.amount,
        currentValue: i.currentValue,
        endDate: i.endDate,
        isPast: i.endDate < now,
        roiWithdrawn: i.roiWithdrawn
      })));
      return;
    }

    console.log(`✓ Found matured investment:`);
    console.log(`  - ID: ${investment._id}`);
    console.log(`  - Status: ${investment.status}`);
    console.log(`  - Amount: $${investment.amount}`);
    console.log(`  - Current Value: $${investment.currentValue}`);
    console.log(`  - EndDate: ${investment.endDate}`);
    console.log(`  - ROI Withdrawn: ${investment.roiWithdrawn}`);
    console.log(`  - Transactions: ${(investment.transactions || []).length}`);

    // 2. Check ROI calculation
    const roi = investment.currentValue - investment.amount;
    console.log(`✓ ROI Calculation:`);
    console.log(`  - ROI (currentValue - amount): $${roi}`);
    if (roi <= 0) {
      console.log('  - ⚠ WARNING: No ROI available to withdraw');
      return;
    }

    // 3. Check user exists
    const user = await User.findById(TEST_USER_ID);
    if (!user) {
      console.log('✗ User not found');
      return;
    }
    console.log(`✓ User found:`);
    console.log(`  - Wallet count: ${(user.wallets || []).length}`);
    console.log(`  - Available Balance: ${user.availableBalance || 0}`);
    console.log(`  - Locked Balance: ${user.lockedBalance || 0}`);

    // 4. Check if already withdrawn
    if (investment.roiWithdrawn) {
      console.log('✗ ROI already withdrawn for this investment');
      return;
    }
    console.log('✓ ROI not yet withdrawn');

    // 5. Simulate withdrawal (don't actually save, just show what would happen)
    console.log(`\n✓ WITHDRAWAL WOULD SUCCEED:`);
    console.log(`  - Withdrawal Amount: $${roi}`);
    console.log(`  - New Locked Balance: ${(user.lockedBalance || 0) + roi}`);
    console.log(`  - Status: Would be marked roiWithdrawn=true`);

    // 6. Check for existing pending withdrawals
    const existingWithdrawal = await Withdrawal.findOne({
      userId: TEST_USER_ID,
      investmentId: investment._id,
      type: 'roi',
      status: { $in: ['pending', 'processing'] }
    });
    if (existingWithdrawal) {
      console.log(`⚠ WARNING: Existing ${existingWithdrawal.status} withdrawal found:`);
      console.log(`  - Withdrawal ID: ${existingWithdrawal._id}`);
      console.log(`  - Amount: $${existingWithdrawal.amount}`);
      console.log(`  - Created: ${existingWithdrawal.createdAt}`);
    } else {
      console.log('✓ No existing pending withdrawals');
    }

    console.log('\n========== TEST PASSED ==========\n');

  } catch (err) {
    console.error('\n✗ ERROR:', err.message);
    console.error(err.stack);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB\n');
  }
}

runSmokeTest();
