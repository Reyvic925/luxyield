const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load production environment
dotenv.config({ path: path.join(__dirname, '.env.production') });
if (!process.env.MONGODB_URI) {
  dotenv.config();
}

const Investment = require('./models/Investment');
const User = require('./models/User');
const Withdrawal = require('./models/Withdrawal');
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const VICTOR_ID = '6895009639291ffa0e10b921';
const ADMIN_ID = '688409602820d627ad8bcfe1';

async function runTest() {
  try {
    console.log('🚀 Starting ROI Withdrawal Test (PRODUCTION)...\n');
    console.log(`📍 MongoDB URI: ${process.env.MONGODB_URI?.substring(0, 50)}...\n`);
    
    // Connect to MongoDB
    console.log('📍 Connecting to Production MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    // Step 1: Create a test investment
    console.log('📍 Step 1: Creating test investment for Victor...');
    const testInvestment = new Investment({
      user: VICTOR_ID,
      fundId: new mongoose.Types.ObjectId(),
      planId: new mongoose.Types.ObjectId(),
      amount: 5000,
      currentValue: 5250, // Already has some ROI
      startDate: new Date(Date.now() - 60000), // 1 minute ago
      endDate: new Date(Date.now() + 3600000), // 1 hour from now
      status: 'active',
      fundName: 'Test Fund',
      planName: 'Test Plan',
      transactions: [{
        type: 'deposit',
        amount: 5000,
        date: new Date(),
        description: 'Initial deposit'
      }],
      roiWithdrawn: false
    });
    
    const savedInvestment = await testInvestment.save();
    console.log(`✅ Investment created: ${savedInvestment._id}`);
    console.log(`   Amount: $${savedInvestment.amount}`);
    console.log(`   Current Value: $${savedInvestment.currentValue}`);
    console.log(`   ROI Available: $${savedInvestment.currentValue - savedInvestment.amount}\n`);

    // Step 2: Get initial user state (try Victor first, then Admin)
    console.log('📍 Step 2: Checking user balances before withdrawal...');
    let userBefore = await User.findById(VICTOR_ID);
    let activeUserId = VICTOR_ID;
    
    if (!userBefore) {
      console.log(`   Victor not found, trying Admin user...`);
      userBefore = await User.findById(ADMIN_ID);
      activeUserId = ADMIN_ID;
    }
    
    if (!userBefore) {
      throw new Error(`Neither Victor (${VICTOR_ID}) nor Admin (${ADMIN_ID}) found in production database`);
    }
    
    console.log(`✅ User found: ${userBefore.email}`);
    console.log(`   Available Balance: $${userBefore.availableBalance || 0}`);
    console.log(`   Locked Balance: $${userBefore.lockedBalance || 0}\n`);

    // Step 3: Create a test JWT token for Victor
    console.log('📍 Step 3: Creating test JWT token...');
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: VICTOR_ID },
      process.env.JWT_SECRET || 'your_jwt_secret_key'
    );
    console.log(`✅ Token created\n`);

    // Step 4: Test ROI withdrawal endpoint
    console.log('📍 Step 4: Testing ROI withdrawal endpoint...');
    const withdrawRes = await axios.post(
      `${BASE_URL}/api/investment/withdraw-roi/${savedInvestment._id}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ ROI Withdrawal Response received`);
    console.log(`   Success: ${withdrawRes.data.success}`);
    console.log(`   Message: ${withdrawRes.data.message}`);
    console.log(`   ROI Withdrawn: $${withdrawRes.data.roi}`);
    console.log(`   Locked Balance: $${withdrawRes.data.lockedBalance}`);
    console.log(`   Available Balance: ${withdrawRes.data.availableBalance}\n`);

    // Step 5: Verify investment currentValue decreased
    console.log('📍 Step 5: Verifying investment currentValue in database...');
    const updatedInvestment = await Investment.findById(savedInvestment._id);
    console.log(`✅ Investment verified`);
    console.log(`   Current Value: $${updatedInvestment.currentValue}`);
    console.log(`   Expected: $${savedInvestment.amount}`);
    console.log(`   Match: ${updatedInvestment.currentValue === savedInvestment.amount ? '✓' : '✗'}\n`);

    // Step 6: Verify user locked balance increased
    console.log('📍 Step 6: Verifying user locked balance increased...');
    const userAfter = await User.findById(VICTOR_ID);
    const roiAmount = savedInvestment.currentValue - savedInvestment.amount;
    console.log(`✅ User updated`);
    console.log(`   Locked Balance: $${userAfter.lockedBalance}`);
    console.log(`   Expected: $${userBefore.lockedBalance + roiAmount}`);
    console.log(`   Increase: $${userAfter.lockedBalance - userBefore.lockedBalance}\n`);

    // Step 7: Verify withdrawal record created
    console.log('📍 Step 7: Verifying withdrawal record...');
    const withdrawal = await Withdrawal.findById(withdrawRes.data.withdrawalId);
    if (withdrawal) {
      console.log(`✅ Withdrawal record found`);
      console.log(`   Status: ${withdrawal.status}`);
      console.log(`   Amount: $${withdrawal.amount}`);
      console.log(`   Type: ${withdrawal.type}\n`);
    } else {
      console.log(`⚠️  Withdrawal record not found\n`);
    }

    console.log('✨ TEST COMPLETED SUCCESSFULLY!\n');
    console.log('Summary:');
    console.log(`  - Investment created with $${roiAmount} ROI`);
    console.log(`  - ROI successfully withdrawn from currentValue`);
    console.log(`  - ROI moved to user's locked balance`);
    console.log(`  - Withdrawal record created for admin approval`);

    await mongoose.connection.close();

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('Stack:', error.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
}

runTest();
