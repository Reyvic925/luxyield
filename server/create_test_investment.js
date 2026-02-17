const mongoose = require('mongoose');
require('dotenv').config();

const Investment = require('./models/Investment');

const VICTOR_ID = '68cea959e36adad156135a9';

async function createTestInvestment() {
  try {
    console.log('🚀 Creating Completed Investment for Testing...\n');
    
    // Connect to MongoDB
    console.log('📍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/luxyield');
    console.log('✅ Connected\n');

    // Create a completed investment with ROI
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
    console.log('✅ Investment Created Successfully!\n');
    console.log('Investment Details:');
    console.log(`  ID: ${savedInvestment._id}`);
    console.log(`  User: ${VICTOR_ID}`);
    console.log(`  Fund: ${savedInvestment.fundName}`);
    console.log(`  Plan: ${savedInvestment.planName}`);
    console.log(`  Initial Amount: $${savedInvestment.amount}`);
    console.log(`  Current Value: $${savedInvestment.currentValue}`);
    console.log(`  ROI Available: $${savedInvestment.currentValue - savedInvestment.amount}`);
    console.log(`  Status: ${savedInvestment.status}`);
    console.log(`  Start Date: ${savedInvestment.startDate.toLocaleDateString()}`);
    console.log(`  End Date: ${savedInvestment.endDate.toLocaleDateString()}`);
    console.log(`  ROI Withdrawn: ${savedInvestment.roiWithdrawn}\n`);

    console.log('🎯 Testing ROI Withdrawal Flow...\n');
    console.log('Next Steps:');
    console.log('1. Go to https://www.luxyield.com/portfolio');
    console.log('2. Find the "Premium Gold Fund" investment (just created)');
    console.log('3. Click "Withdraw" button on the investment');
    console.log('4. Confirm withdrawal - ROI should move to locked balance');
    console.log('5. Check Withdraw page - locked balance should show pending amount');
    console.log('6. Share admin token to approve withdrawal');
    console.log('7. After approval, locked balance → available balance\n');

    console.log('✨ Test investment ready! Start the ROI withdrawal process.\n');

    await mongoose.connection.close();

  } catch (error) {
    console.error('❌ Failed to create investment:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

createTestInvestment();
