// routes/admin/withdrawals.js
const express = require('express');
const router = express.Router();
const Withdrawal = require('../../models/Withdrawal');
const User = require('../../models/User');
const Config = require('../../models/Config');
const auth = require('../../middleware/authAdmin');

async function getActivationFeePercent() {
  const config = await Config.findOne({ key: 'withdrawal.activationFeePercent' }).lean().exec();
  return Number(config?.value ?? process.env.ACTIVATION_FEE_PERCENT ?? 20);
}

// Get withdrawals with filters
router.get('/', auth, async (req, res) => {
  try {
    const { status, currency, dateRange } = req.query;

    const query = {};
    if (currency && currency !== 'all') query.currency = currency;

    if (status && status !== 'all') {
      if (status === 'pending') {
        query.status = {
          $in: [
            'pending',
            'awaiting_activation_fee',
            'activation_fee_paid',
            'activation_fee_rejected',
            'activation_fee_approved',
            'awaiting_interest_tax',
            'interest_tax_paid',
            'interest_tax_rejected',
            'withdrawal_processing',
            'awaiting_network_fee',
            'network_fee_paid'
          ]
        };
      } else if (status === 'completed') {
        query.status = { $in: ['withdrawal_successful', 'completed'] };
      } else if (status === 'rejected') {
        query.status = { $in: ['activation_fee_rejected', 'interest_tax_rejected', 'network_fee_rejected', 'rejected', 'failed'] };
      } else {
        query.status = status;
      }
    }

    if (dateRange) {
      const days = parseInt(dateRange.replace('days', ''));
      if (!isNaN(days)) {
        query.createdAt = {
          $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        };
      }
    }

    const includeLockedBalanceEntries = (!status || status === 'all' || status === 'pending');

    const activationFeePercent = await getActivationFeePercent();
    await Withdrawal.updateMany(
      {
        type: 'roi',
        status: 'activation_fee_approved',
        activationFeeAmount: { $lte: 0 },
        activationFeePaid: { $lte: 0 }
      },
      [{
        $set: {
          activationFeeAmount: { $round: [{ $multiply: ['$amount', activationFeePercent / 100] }, 2] },
          status: 'awaiting_activation_fee'
        }
      }]
    );

    if (includeLockedBalanceEntries) {
      const lockedBalanceUsers = await User.find({
        role: 'user',
        lockedBalance: { $gt: 0 }
      }).select('_id lockedBalance createdAt').lean();

      for (const user of lockedBalanceUsers) {
        const existing = await Withdrawal.findOne({
          userId: user._id,
          lockedBalanceSource: true,
          type: 'roi'
        }).lean();

        if (!existing) {
          await Withdrawal.create({
            type: 'roi',
            userId: user._id,
            amount: Number(user.lockedBalance || 0),
            reservedAmount: Number(user.lockedBalance || 0),
            activationFeeAmount: Number((Number(user.lockedBalance || 0) * activationFeePercent / 100).toFixed(2)),
            activationFeePaid: 0,
            currency: 'USDT',
            network: 'ERC20',
            walletAddress: '',
            status: 'awaiting_activation_fee',
            destination: 'locked',
            lockedBalanceSource: true,
            adminNotes: 'Created from a user locked balance entry. No activation fee is required for ROI/locked-balance withdrawals.'
          });
        }
      }
    }

    const withdrawals = await Withdrawal.find(query)
      .sort('-createdAt')
      .limit(100)
      .populate('userId', 'email name');

    const mapped = withdrawals.map(w => ({
      id: w._id.toString(),
      _id: w._id,
      userId: w.userId?._id?.toString() || w.userId?.toString() || '',
      userEmail: w.userId?.email || '',
      userName: w.userId?.name || '',
      amount: w.amount,
      currency: w.currency,
      network: w.network,
      walletAddress: w.walletAddress,
      status: w.status,
      type: w.type,
      activationFeeAmount: w.activationFeeAmount,
      activationFeePaid: w.activationFeePaid,
      interestTaxAmount: w.interestTaxAmount,
      interestTaxPaid: w.interestTaxPaid,
      networkFeeAmount: w.networkFeeAmount,
      networkFeePaid: w.networkFeePaid,
      adminNotes: w.adminNotes,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
      processedAt: w.processedAt,
      processedBy: w.processedBy,
      lockedBalanceAccount: Boolean(w.lockedBalanceSource),
      lockedBalanceAmount: w.lockedBalanceSource ? Number(w.amount || 0) : 0,
    }));

    mapped.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(mapped.slice(0, 100));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update withdrawal status
router.put('/:id', auth, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found' });
    }
    
    // Validate status transition
    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending withdrawals can be modified' });
    }
    
    withdrawal.status = status;
    withdrawal.adminNotes = adminNotes;
    withdrawal.processedAt = new Date();
    withdrawal.processedBy = req.admin.id;
    
    await withdrawal.save();
    
    // In a real app, you would:
    // 1. For approved withdrawals: process the blockchain transaction
    // 2. Send email notification to user
    // 3. Update user balance if rejected
    
    res.json(withdrawal);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk update withdrawals
router.patch('/bulk', auth, async (req, res) => {
  try {
    const { ids, updates } = req.body;
    
    // Validate updates
    if (!updates.status || !['completed', 'rejected'].includes(updates.status)) {
      return res.status(400).json({ message: 'Invalid status update' });
    }
    
    const result = await Withdrawal.updateMany(
      { _id: { $in: ids }, status: 'pending' },
      { 
        status: updates.status,
        adminNotes: updates.adminNotes,
        processedAt: new Date(),
        processedBy: req.admin.id
      }
    );
    
    res.json({ updatedCount: result.nModified });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;