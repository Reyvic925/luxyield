// Test script to create sample user and investment for testing ROI withdrawal
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Investment = require('../models/Investment');
const Plan = require('../models/Plan');
const Fund = require('../models/Fund');

const MONGO_URI = process.env.MONGO_URI;

async function setupTestData() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✓ Connected to MongoDB');

    // Create test user
    const user = new User({
      name: 'Test User',
      username: `testuser${Date.now()}`,
      email: `testuser${Date.now()}@example.com`,
      password: 'hashed_password',
      phone: '+1234567890',
      country: 'US',
      securityQuestion: 'What is your pet name?',
      securityAnswer: 'Fluffy',
      referralCode: `REF${Date.now()}`,
      role: 'user',
      tier: 'Gold',
      availableBalance: 0,
      lockedBalance: 5000
    });
    
    await user.save();
    console.log(`✓ Created user: ${user._id}`);

    // Create or fetch a plan
    let plan = await Plan.findOne({ name: 'Gold' });
    if (!plan) {
      plan = new Plan({
        name: 'Gold',
        roi: 450,
        duration: 10,
        minInvestment: 1000,
        maxInvestment: 50000
      });
      await plan.save();
      console.log(`✓ Created plan: ${plan._id}`);
    }

    // Create or fetch a fund
    let fund = await Fund.findOne({ name: 'Test Fund' });
    if (!fund) {
      fund = new Fund({
        name: 'Test Fund',
        title: 'Test Fund Investment',
        slug: 'test-fund',
        description: 'Test Fund for ROI withdrawal',
        status: 'active'
      });
      await fund.save();
      console.log(`✓ Created fund: ${fund._id}`);
    }

    // Create test investment
    const investment = new Investment({
      user: user._id,
      fundId: fund._id,
      planId: plan._id,
      fundName: 'Test Fund',
      planName: 'Gold',
      amount: 5000,
      currentValue: 5000,
      startDate: new Date(),
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      status: 'active',
      roiRate: 0.0005, // 0.05% daily
      transactions: []
    });

    await investment.save();
    console.log(`✓ Created investment: ${investment._id}`);
    console.log(`✓ User ID: ${user._id}`);
    console.log(`✓ Initial availableBalance: ${user.availableBalance}`);
    console.log(`✓ Initial lockedBalance: ${user.lockedBalance}`);

    await mongoose.disconnect();
    console.log('✓ Test data setup complete!');
  } catch (err) {
    console.error('Error setting up test data:', err);
    process.exit(1);
  }
}

setupTestData();
