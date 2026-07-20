// routes/admin/roi-approvals.js
const express = require('express');
const router = express.Router();
const Withdrawal = require('../../models/Withdrawal');
const User = require('../../models/User');
const auth = require('../../middleware/authAdmin');

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

    if (status === 'completed' && destination === 'available') {
      if (!['activation_fee_paid', 'activation_fee_rejected'].includes(withdrawal.status)) {
        return res.status(400).json({ message: 'Activation fee can only be approved after payment or review.' });
      }
      const user = await User.findById(withdrawal.userId);
      if (!user) return res.status(404).json({ message: 'User not found' });

      user.availableBalance = (user.availableBalance || 0) + withdrawal.amount;
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
