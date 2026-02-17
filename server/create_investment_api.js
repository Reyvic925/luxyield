const axios = require('axios');

const BASE_URL = 'https://api.luxyield.com';
const ADMIN_TOKEN = 'ADMIN_TOKEN_HERE'; // You'll need to provide this
const VICTOR_ID = '68cea959e36adad156135a9';

async function createTestInvestmentViaAPI() {
  try {
    console.log('🚀 Creating Completed Investment via API...\n');
    
    // NOTE: This would require an admin endpoint to create investments
    // For now, we'll document the process instead
    
    console.log('⚠️  Investment creation via API requires admin privileges\n');
    
    console.log('Two ways to create test investment:\n');
    
    console.log('METHOD 1: Direct MongoDB Access (PREFERRED)');
    console.log('  1. Connect to production MongoDB with credentials');
    console.log('  2. Run command:');
    console.log('     set MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname');
    console.log('     node create_prod_test_investment.js\n');
    
    console.log('METHOD 2: Use MongoDB Atlas UI');
    console.log('  1. Login to MongoDB Atlas');
    console.log('  2. Go to Collections → luxyield → investments');
    console.log('  3. Click "Insert Document"');
    console.log('  4. Paste the following JSON:\n');
    
    const testInvestment = {
      user: VICTOR_ID,
      fundId: '507f1f77bcf86cd799439011',
      planId: '507f1f77bcf86cd799439012',
      amount: 10000,
      currentValue: 12500,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: 'completed',
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
      roiWithdrawn: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log(JSON.stringify(testInvestment, null, 2));
    
    console.log('\n✨ Once created, you can test the ROI withdrawal flow:\n');
    console.log('1. User withdraws ROI → lockedBalance increases');
    console.log('2. Admin approves → lockedBalance decreases, availableBalance increases');
    console.log('3. Verify balances update on Withdraw page\n');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

createTestInvestmentViaAPI();
