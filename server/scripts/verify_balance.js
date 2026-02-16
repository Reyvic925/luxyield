// Verify user balance after ROI credit
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI;

async function verifyBalance() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    
    // Get the last created user (should be our test user)
    const user = await User.findOne().sort('-createdAt');
    
    if (!user) {
      console.log('✗ No users found');
      process.exit(1);
    }

    console.log('📊 User Balance Report:');
    console.log('========================');
    console.log(`User ID: ${user._id}`);
    console.log(`Name: ${user.name}`);
    console.log(`Available Balance: $${user.availableBalance.toFixed(2)}`);
    console.log(`Locked Balance: $${user.lockedBalance.toFixed(2)}`);
    console.log(`Total Balance: $${(user.availableBalance + user.lockedBalance).toFixed(2)}`);
    
    if (user.availableBalance > 0) {
      console.log('\n✅ SUCCESS: ROI has been credited to available balance!');
    } else {
      console.log('\n❌ FAILURE: Available balance is still 0');
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

verifyBalance();
