// routes/admin/roi-approvals.js
const express = require('express');
const router = express.Router();
const Withdrawal = require('../../models/Withdrawal');
const User = require('../../models/User');
const auth = require('../../middleware/authAdmin');

function releaseLockedBalanceToAvailable(user, amount) {
  const releaseAmount = Number(amount || 0);
  if (!user || releaseAmount <= 0) return false;

  const availableBalance = Number(user.availableBalance || 0);
  const lockedBalance = Number(user.lockedBalance || 0);

  if (availableBalance >= releaseAmount && lockedBalance >= releaseAmount && availableBalance === lockedBalance) {
    user.lockedBalance = 0;
    return true;
  }

  if (lockedBalance <= 0 && availableBalance >= releaseAmount) {
    return true;
  }

  const transferableAmount = Math.min(releaseAmount, lockedBalance);
  if (transferableAmount <= 0) return false;

  user.availableBalance = availableBalance + transferableAmount;
  user.lockedBalance = Math.max(lockedBalance - transferableAmount, 0);
  return true;
}

// Get all pending ROI withdrawals
router.get('/', auth, async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({
      type: 'roi',
      status: 'pending'
    })
      .sort('-createdAt')
      .populate('userId', 'email name');
    // Return only essential fields to avoid serialization issues
    const cleanedWithdrawals = withdrawals.map(w => ({
      id: w._id.toString(),
      userId: w.userId?._id?.toString() || w.userId?.toString() || '',
      userEmail: w.userId?.email || '',
      userName: w.userId?.name || '',
      amount: w.amount,
      status: w.status,
      type: w.type,
      createdAt: w.createdAt
    }));
    res.json(cleanedWithdrawals);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve or reject ROI withdrawal for the activation fee stage
router.patch('/:id', auth, async (req, res) => {
  try {
    const { status, destination } = req.body;
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal not found' });

    if ((status === 'activation_fee_approved' || status === 'completed') && destination === 'available') {
      if (!['activation_fee_paid', 'activation_fee_rejected', 'awaiting_activation_fee'].includes(withdrawal.status)) {
        return res.status(400).json({ message: 'Activation fee can only be approved after payment or review.' });
      }
      const user = await User.findById(withdrawal.userId);
      if (!user) return res.status(404).json({ message: 'User not found' });

      const releaseAmount = Number(withdrawal.amount || 0);
      const released = releaseLockedBalanceToAvailable(user, releaseAmount);
      if (!released && releaseAmount > 0) {
        user.lockedBalance = 0;
      }
      await user.save();

      withdrawal.status = 'activation_fee_approved';
      withdrawal.processedAt = new Date();
      withdrawal.processedBy = req.user.id;
      await withdrawal.save();
      return res.json({
        id: withdrawal._id.toString(),
        amount: withdrawal.amount,
        status: withdrawal.status,
        type: withdrawal.type,
        userBalances: {
          availableBalance: user.availableBalance,
          lockedBalance: user.lockedBalance
        }
      });
    } else if (status === 'rejected') {
      if (!['activation_fee_paid', 'awaiting_activation_fee', 'activation_fee_rejected'].includes(withdrawal.status)) {
        return res.status(400).json({ message: 'Activation fee can only be rejected at the activation stage.' });
      }
      withdrawal.status = 'activation_fee_rejected';
      withdrawal.processedAt = new Date();
      withdrawal.processedBy = req.user.id;
      await withdrawal.save();
      return res.json({
        id: withdrawal._id.toString(),
        amount: withdrawal.amount,
        status: withdrawal.status,
        type: withdrawal.type
      });
    }

    return res.status(400).json({ message: 'Unsupported status or destination' });
  } catch (err) {
    console.error('[ROI APPROVALS] Error processing ROI approval:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
