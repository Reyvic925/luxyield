// server/routes/investment.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Investment = require('../models/Investment');
const Plan = require('../models/Plan');
const User = require('../models/User');
const Withdrawal = require('../models/Withdrawal');

// Simulate deposit
router.post('/deposit', auth, async (req, res) => {
  try {
    const { fundId, planId, amount } = req.body;

    // Validate input
    if (!fundId || !planId || !amount) {
      return res.status(400).json({ msg: 'Please provide all required fields' });
    }

    // Validate plan
    const plan = await Plan.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(400).json({ msg: 'Invalid or inactive plan' });
    }

    // Check user balance
    const user = await User.findById(req.user.id);
    if (!user) return res.status(400).json({ msg: 'User not found' });
    if (user.depositBalance < amount) {
      return res.status(400).json({ msg: 'Insufficient balance' });
    }

    // Subtract from available balance
    user.depositBalance -= amount;
    await user.save();

    // Create investment
    const endDate = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);
    const newInvestment = new Investment({
      user: req.user.id,
      fundId,
      planId,
      amount: parseFloat(amount),
      currentValue: parseFloat(amount),
      startDate: new Date(),
      endDate,
      status: 'active',
      fundName: '',
      planName: plan.name,
      transactions: [{
        type: 'deposit',
        amount: parseFloat(amount),
        date: new Date(),
        description: 'Initial deposit'
      }]
    });

    await newInvestment.save();

    // Referral bonus logic: credit 10% of first investment to referrer
    if (user.referredBy) {
      const previousInvestments = await Investment.find({ user: user._id });
      if (previousInvestments.length === 1) { // This is the first investment
        const referrer = await User.findById(user.referredBy);
        if (referrer) {
          const bonus = 0.10 * parseFloat(amount);
          referrer.referralEarnings = (referrer.referralEarnings || 0) + bonus;
          await referrer.save();
          // Optionally, log the transaction
          console.log(`[REFERRAL BONUS] Credited $${bonus} to referrer ${referrer._id} for user ${user._id}'s first investment.`);
        }
      }
    }

    // Return success
    const transactionId = `TX-${Math.random().toString(36).substr(2, 10).toUpperCase()}`;
    res.json({
      success: true,
      transactionId,
      investment: {
        id: newInvestment._id,
        fundId,
        planId,
        amount,
        startDate: newInvestment.startDate,
        endDate: newInvestment.endDate
      }
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Withdraw ROI from a completed investment
router.post('/withdraw-roi/:investmentId', auth, async (req, res) => {
  try {
    console.log('[WITHDRAW ROI] Request started for investmentId:', req.params.investmentId, 'userId:', req.user.id);
    const { investmentId } = req.params;
    const userId = req.user.id;
    
    const investment = await Investment.findOne({ _id: investmentId, user: userId });
    if (!investment) {
      console.error('[WITHDRAW ROI] Investment not found:', investmentId, 'for user:', userId);
      return res.status(404).json({ success: false, error: 'Investment not found.' });
    }
    console.log('[WITHDRAW ROI] Investment found, status:', investment.status);
    
    if (investment.status !== 'completed') {
      console.error('[WITHDRAW ROI] Investment not completed:', investmentId, 'status:', investment.status);
      return res.status(400).json({ success: false, error: 'ROI can only be withdrawn from completed investments.' });
    }
    // Prevent double withdrawal
    if (investment.roiWithdrawn) {
      console.error('[WITHDRAW ROI] ROI already withdrawn for investment:', investmentId);
      return res.status(400).json({ success: false, error: 'ROI already withdrawn for this investment.' });
    }
    // Calculate withdrawable ROI (currentValue - amount)
    const roi = investment.currentValue - investment.amount;
    console.log('[WITHDRAW ROI] Calculated ROI:', roi, 'currentValue:', investment.currentValue, 'amount:', investment.amount);
    
    if (roi <= 0) {
      console.error('[WITHDRAW ROI] No ROI available to withdraw for investment:', investmentId, 'roi:', roi);
      return res.status(400).json({ success: false, error: 'No ROI available to withdraw.' });
    }
    // Get wallet info from user or use defaults
    let { walletAddress, network, currency } = req.body;
    const user = await User.findById(userId);
    console.log('[WITHDRAW ROI] User found:', !!user);
    
    if (!user) {
      console.error('[WITHDRAW ROI] User not found:', userId);
      return res.status(404).json({ success: false, error: 'User not found.' });
    }
    let wallet = null;
    if (user.wallets && user.wallets.length > 0) {
      wallet = user.wallets[0];
    }
    walletAddress = walletAddress || wallet?.address || 'DEFAULT_ADDRESS';
    network = network || wallet?.network || 'ERC20';
    currency = currency || wallet?.currency || 'USDT';

    // Create a pending withdrawal for ROI
    const withdrawal = new Withdrawal({
      userId,
      investmentId,
      amount: roi,
      status: 'pending',
      type: 'roi',
      walletAddress,
      network,
      currency,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('[WITHDRAW ROI] About to save withdrawal');
    await withdrawal.save();
    console.log('[WITHDRAW ROI] Withdrawal saved, now updating investment');
    
    // Mark ROI as withdrawn
    investment.roiWithdrawn = true;
    await investment.save();
    console.log('[WITHDRAW ROI] Investment updated');
    
    // Add ROI to lockedBalance
    user.lockedBalance = (user.lockedBalance || 0) + roi;
    await user.save();
    console.log('[WITHDRAW ROI] User balance updated');
    
    // Fetch updated locked balance
    const newLockedBalance = user.lockedBalance;
    console.log('[WITHDRAW ROI] Sending success response');
    res.json({ 
      success: true, 
      withdrawal, 
      roi, 
      lockedBalance: newLockedBalance, 
      user: { id: user._id, lockedBalance: newLockedBalance } 
    });
  } catch (err) {
    console.error('[WITHDRAW ROI] Internal error:', err.message, err.stack);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;