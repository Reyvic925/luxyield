const mongoose = require('mongoose');
require('dotenv').config();

const Investment = require('./models/Investment');

const VICTOR_ID = '68cea959e36adad156135a9';

async function createTestInvestment() {
  try {
    console.log('🚀 Creating Completed Investment in PRODUCTION...\n');
    
    // Use production MongoDB URI from environment or provide it manually
    console.log('📍 Connecting to Production MongoDB...');
    
    // Production MongoDB URI - update this with your actual production URI
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://your_production_user:your_production_password@your_cluster.mongodb.net/luxyield?retryWrites=true&w=majority';
    
    if (mongoUri.includes('your_production')) {
      console.error('\n❌ PRODUCTION DATABASE URI NOT CONFIGURED');
      console.error('   Please set the MONGODB_URI environment variable with your production connection string.');
      console.error('   Example: set MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/luxyield\n');
      process.exit(1);
    }
    
    console.log('   Connecting...');
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to Production Database\n');

    // Create a completed investment with ROI
    console.log('📍 Creating Investment...');
    const testInvestment = new Investment({
      user: VICTOR_ID,
      fundId: new mongoose.Types.ObjectId(),
      planId: new mongoose.Types.ObjectId(),
      amount: 10000,                    // Initial investment
      currentValue: 12500,              // Current value with ROI
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),  // 30 days ago
      endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),     // 1 day ago (completed)
      status: 'completed',              // Investment is completed
      fundName: 'Premium Gold Fund',
      planName: 'Platinum Plan',
      transactions: [
        {
          type: 'deposit',
          amount: 10000,
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          description: 'Initial investment'
        },
        {
          type: 'roi',
          amount: 1200,
          date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          description: 'ROI accrual - Week 2'
        },
        {
          type: 'roi',
          amount: 1300,
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          description: 'ROI accrual - Week 3-4'
        }
      ],
      roiWithdrawn: false
    });

    const savedInvestment = await testInvestment.save();
    console.log('✅ Investment Created Successfully in Production!\n');
    
    console.log('📊 Investment Details:');
    console.log(`   ID: ${savedInvestment._id}`);
    console.log(`   User: ${VICTOR_ID}`);
    console.log(`   Fund: ${savedInvestment.fundName}`);
    console.log(`   Plan: ${savedInvestment.planName}`);
    console.log(`   Initial Amount: $${savedInvestment.amount}`);
    console.log(`   Current Value: $${savedInvestment.currentValue}`);
    console.log(`   ROI Available: $${savedInvestment.currentValue - savedInvestment.amount}`);
    console.log(`   Status: ${savedInvestment.status}`);
    console.log(`   Start Date: ${savedInvestment.startDate.toLocaleDateString()}`);
    console.log(`   End Date: ${savedInvestment.endDate.toLocaleDateString()}`);
    console.log(`   ROI Withdrawn: ${savedInvestment.roiWithdrawn}\n`);

    console.log('🎯 ROI WITHDRAWAL TEST WORKFLOW:\n');
    console.log('Step 1: USER WITHDRAWS ROI');
    console.log('   - Go to https://www.luxyield.com/portfolio');
    console.log('   - Find "Premium Gold Fund" investment');
    console.log('   - Click "Withdraw" button');
    console.log('   - ROI ($2,500) should move to locked balance');
    console.log('   - Button should change to "ROI Withdrawn"\n');
    
    console.log('Step 2: CHECK WITHDRAW PAGE');
    console.log('   - Go to https://www.luxyield.com/withdraw');
    console.log('   - Locked Balance should show: $2,500 (pending ROI)');
    console.log('   - Available Balance should remain unchanged\n');
    
    console.log('Step 3: ADMIN APPROVES WITHDRAWAL');
    console.log('   - Admin goes to ROI Approvals');
    console.log('   - Finds the pending withdrawal');
    console.log('   - Clicks "Approve"');
    console.log('   - ROI moves from locked to available balance\n');
    
    console.log('Step 4: VERIFY FINAL STATE');
    console.log('   - Locked Balance should decrease by $2,500');
    console.log('   - Available Balance should increase by $2,500');
    console.log('   - User can now withdraw to wallet\n');

    console.log('✨ Test investment ready for ROI withdrawal testing in PRODUCTION!\n');

    await mongoose.connection.close();

  } catch (error) {
    console.error('❌ Failed:', error.message);
    if (error.message.includes('MONGODB_URI')) {
      console.error('   Make sure .env file has MONGODB_URI for production');
    }
    await mongoose.connection.close();
    process.exit(1);
  }
}

createTestInvestment();
