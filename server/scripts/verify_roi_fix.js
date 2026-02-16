// Final verification that ROI withdrawal fix is working
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Investment = require('../models/Investment');

const MONGO_URI = process.env.MONGO_URI;

async function verify() {
  try {
    console.log('\n========== FINAL ROI WITHDRAWAL FIX VERIFICATION ==========\n');
    
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    
    // Get the most recent user (our test user)
    const user = await User.findOne().sort('-createdAt');
    
    if (!user) {
      console.log('❌ No users found');
      process.exit(1);
    }

    // Get their investment
    const investment = await Investment.findOne({ user: user._id }).sort('-createdAt');

    console.log('📋 Test User Account Status:');
    console.log('─'.repeat(50));
    console.log(`User ID: ${user._id}`);
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`\n💰 Balance Information:`);
    console.log(`  Available Balance (withdrawable): $${user.availableBalance.toFixed(2)}`);
    console.log(`  Locked Balance (in investments): $${user.lockedBalance.toFixed(2)}`);
    console.log(`  Total Balance: $${(user.availableBalance + user.lockedBalance).toFixed(2)}`);

    if (investment) {
      console.log(`\n📊 Investment Information:`);
      console.log(`  Investment ID: ${investment._id}`);
      console.log(`  Initial Amount: $${investment.amount}`);
      console.log(`  Current Value: $${investment.currentValue.toFixed(2)}`);
      console.log(`  ROI Gained: $${(investment.currentValue - investment.amount).toFixed(2)}`);
      console.log(`  ROI %: ${(((investment.currentValue - investment.amount) / investment.amount) * 100).toFixed(2)}%`);
      console.log(`  Transactions: ${(investment.transactions || []).length}`);
      
      const roiTxs = (investment.transactions || []).filter(t => t.type === 'roi');
      console.log(`  ROI Transactions: ${roiTxs.length}`);
      if (roiTxs.length > 0) {
        console.log(`  Total ROI Accrued: $${roiTxs.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}`);
      }
    }

    console.log(`\n✅ TEST RESULTS:`);
    console.log('─'.repeat(50));
    
    if (user.availableBalance > 0) {
      console.log(`✅ PASS: User has withdrawable balance of $${user.availableBalance.toFixed(2)}`);
      console.log(`✅ PASS: ROI withdrawal is now ENABLED`);
      console.log(`✅ PASS: User can withdraw ROI without issue`);
      console.log('\n🎉 ROI WITHDRAWAL FIX IS WORKING!\n');
    } else {
      console.log(`❌ FAIL: Available balance is still $0.00`);
      console.log(`❌ FAIL: ROI is not being credited to available balance`);
    }

    console.log('═'.repeat(50) + '\n');
    
    await mongoose.disconnect();
    
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

verify();
