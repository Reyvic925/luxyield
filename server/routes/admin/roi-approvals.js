// routes/admin/roi-approvals.js
const express = require('express');
const router = express.Router();
const Withdrawal = require('../../models/Withdrawal');
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

// Approve or reject ROI withdrawal
router.patch('/:id', auth, async (req, res) => {
  try {
    const { status, destination } = req.body;
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal not found' });
    if (status === 'completed' && destination === 'available') {
      withdrawal.status = 'confirmed';
      // Optionally, update user balances here if needed
    } else if (status === 'rejected') {
      withdrawal.status = 'rejected';
    }
    await withdrawal.save();
    // Return only essential fields
    res.json({
      id: withdrawal._id.toString(),
      amount: withdrawal.amount,
      status: withdrawal.status,
      type: withdrawal.type
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
