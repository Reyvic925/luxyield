// server/routes/admin/userInvestments.js
const express = require('express');
const router = express.Router();
const Investment = require('../../models/Investment');
const User = require('../../models/User');
const Plan = require('../../models/Plan');
const authAdmin = require('../../middleware/authAdmin');

// Get all investments for a user
router.get('/:userId', authAdmin, async (req, res) => {
  const investments = await Investment.find({ user: req.params.userId }).lean();
  const mapped = investments.map(inv => ({
    id: inv._id,
    user: inv.user,
    fundId: inv.fundId,
    fundName: inv.fundName,
    planName: inv.planName,
    amount: inv.amount,
    currentValue: inv.currentValue,
    startDate: inv.startDate,
    endDate: inv.endDate,
    status: inv.status,
    transactionCount: (inv.transactions || []).length
  }));
  res.json(mapped);
});

// Create an investment for any user (admin)
router.post('/create/:userId', authAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { fundId, planId, amount, startDate, endDate, fundName, planName, status } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    let plan = null;
    if (planId) {
      plan = await Plan.findById(planId);
      if (!plan) return res.status(400).json({ msg: 'Plan not found' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return res.status(400).json({ msg: 'Invalid amount' });

    const newInvestment = new Investment({
      user: userId,
      fundId: fundId || '',
      planId: planId || (plan ? plan._id : ''),
      amount: parsedAmount,
      currentValue: parsedAmount,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : new Date(Date.now() + (plan ? plan.durationDays * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000)),
      status: status || 'active',
      fundName: fundName || '',
      planName: planName || (plan ? plan.name : ''),
      transactions: [{ type: 'deposit', amount: parsedAmount, date: new Date(), description: 'Admin created investment' }]
    });

    await newInvestment.save();
    return res.json({ success: true, investmentId: newInvestment._id, investment: newInvestment });
  } catch (err) {
    console.error('[ADMIN CREATE INVESTMENT] Error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Update an investment (admin can change any field)
router.put('/:investmentId', authAdmin, async (req, res) => {
  const investment = await Investment.findByIdAndUpdate(req.params.investmentId, req.body, { new: true }).lean();
  if (!investment) return res.status(404).json({ msg: 'Investment not found' });
  res.json({
    id: investment._id,
    user: investment.user,
    fundId: investment.fundId,
    fundName: investment.fundName,
    planName: investment.planName,
    amount: investment.amount,
    currentValue: investment.currentValue,
    startDate: investment.startDate,
    endDate: investment.endDate,
    status: investment.status,
    transactionCount: (investment.transactions || []).length
  });
});

// Add a transaction (gain, loss, roi, deposit, withdrawal) to an investment
router.post('/:investmentId/transaction', authAdmin, async (req, res) => {
  try {
    const { investmentId } = req.params;
    const { type, amount, description, date } = req.body;
    const validTypes = ['gain', 'loss', 'roi', 'deposit', 'withdrawal'];
    if (!validTypes.includes(type)) return res.status(400).json({ success: false, message: 'Invalid transaction type' });

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return res.status(400).json({ success: false, message: 'Invalid amount' });

    const investment = await Investment.findById(investmentId);
    if (!investment) return res.status(404).json({ success: false, message: 'Investment not found' });

    // Apply effect on currentValue
    if (['gain', 'roi', 'deposit'].includes(type)) {
      investment.currentValue += parsedAmount;
    } else if (['loss', 'withdrawal'].includes(type)) {
      investment.currentValue -= parsedAmount;
      if (investment.currentValue < 0) investment.currentValue = 0;
    }

    investment.transactions.push({ type, amount: parsedAmount, date: date ? new Date(date) : new Date(), description: description || 'Admin adjustment' });

    await investment.save();
    return res.json({ success: true, investmentId: investment._id, currentValue: investment.currentValue, transactionCount: (investment.transactions || []).length });
  } catch (err) {
    console.error('[ADMIN ADD TRANSACTION] Error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Edit a transaction on an investment (adjust currentValue accordingly)
router.put('/:investmentId/transaction/:txId', authAdmin, async (req, res) => {
  try {
    const { investmentId, txId } = req.params;
    const { type, amount, description, date } = req.body;

    const investment = await Investment.findById(investmentId);
    if (!investment) return res.status(404).json({ success: false, message: 'Investment not found' });

    const tx = investment.transactions.id(txId);
    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });

    // Helper to compute effect on currentValue for a type and amount
    const effect = (t, a) => {
      if (!t || !a) return 0;
      const amt = Number(a) || 0;
      if (['gain', 'roi', 'deposit'].includes(t)) return amt;
      if (['loss', 'withdrawal'].includes(t)) return -amt;
      return 0;
    };

    const prevEffect = effect(tx.type, tx.amount);
    const newType = type || tx.type;
    const newAmount = (typeof amount !== 'undefined') ? parseFloat(amount) : tx.amount;
    const newEffect = effect(newType, newAmount);
    const delta = newEffect - prevEffect;

    investment.currentValue += delta;
    if (investment.currentValue < 0) investment.currentValue = 0;

    // Update transaction fields
    tx.type = newType;
    tx.amount = newAmount;
    if (typeof description !== 'undefined') tx.description = description;
    if (typeof date !== 'undefined') tx.date = new Date(date);

    await investment.save();
    return res.json({ success: true, investmentId: investment._id, currentValue: investment.currentValue });
  } catch (err) {
    console.error('[ADMIN EDIT TRANSACTION] Error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Manually add to a user's investment portfolio value (backwards-compatible)
router.post('/:investmentId/add', authAdmin, async (req, res) => {
  const { amount } = req.body;
  const investment = await Investment.findById(req.params.investmentId);
  if (!investment) return res.status(404).json({ msg: 'Investment not found' });
  investment.currentValue += parseFloat(amount);
  investment.transactions.push({
    type: 'roi',
    amount: parseFloat(amount),
    date: new Date(),
    description: 'Manual admin adjustment'
  });
  await investment.save();
  res.json({
    id: investment._id,
    amount: investment.amount,
    currentValue: investment.currentValue,
    status: investment.status,
    transactionCount: (investment.transactions || []).length
  });
});

// Admin can force-complete an investment
router.post('/:investmentId/complete', authAdmin, async (req, res) => {
  const investment = await Investment.findById(req.params.investmentId);
  if (!investment) return res.status(404).json({ msg: 'Investment not found' });
  investment.status = 'completed';
  await investment.save();
  res.json({
    id: investment._id,
    amount: investment.amount,
    currentValue: investment.currentValue,
    status: investment.status,
    transactionCount: (investment.transactions || []).length
  });
});

module.exports = router;
