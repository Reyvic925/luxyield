// routes/admin/withdrawalManagement.js
const router = require('express').Router();
const authAdmin = require('../../middleware/authAdmin');
const Withdrawal = require('../../models/Withdrawal');
const User = require('../../models/User');
const Investment = require('../../models/Investment');
const AuditLog = require('../../models/AuditLog');

/**
 * WORKFLOW:
 * 1. User withdraws ROI -> goes to 'pending' status
 * 2. Admin can REJECT -> status becomes 'rejected', amount stays in lockedBalance
 * 3. From rejected withdrawal, admin can MOVE_TO_AVAILABLE -> applies fee, moves to availableBalance
 * 4. Admin can ACCEPT -> moves amount to availableBalance (for pending withdrawals)
 */

// ============================================
// 1. REJECT WITHDRAWAL (stays in locked balance)
// ============================================
router.post('/:withdrawalId/reject', authAdmin, async (req, res) => {
  try {
    console.log('[WITHDRAWAL MANAGEMENT] Rejecting withdrawal:', req.params.withdrawalId);
    const { reason } = req.body;
    
    const withdrawal = await Withdrawal.findById(req.params.withdrawalId);
    if (!withdrawal) {
      return res.status(404).json({ 
        success: false, 
        error: 'Withdrawal not found' 
      });
    }
    
    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        error: `Cannot reject withdrawal with status: ${withdrawal.status}. Only pending withdrawals can be rejected.` 
      });
    }
    
    const user = await User.findById(withdrawal.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    // Update withdrawal status to rejected
    withdrawal.status = 'rejected';
    withdrawal.rejectedAt = new Date();
    withdrawal.rejectionReason = reason || 'Rejected by admin';
    withdrawal.processedBy = req.user.id;
    withdrawal.processedAt = new Date();
    await withdrawal.save();
    
    // Create audit log
    await new AuditLog({
      userId: withdrawal.userId,
      adminId: req.user.id,
      action: 'withdrawal_rejected',
      details: {
        withdrawalId: withdrawal._id,
        amount: withdrawal.amount,
        reason: withdrawal.rejectionReason,
        lockedBalance: user.lockedBalance
      }
    }).save();
    
    console.log('[WITHDRAWAL MANAGEMENT] Withdrawal rejected. Amount stays in user lockedBalance:', withdrawal.amount);
    
    res.json({ 
      success: true, 
      message: 'Withdrawal rejected. Amount remains in user\'s locked balance.',
      withdrawal: {
        _id: withdrawal._id,
        amount: withdrawal.amount,
        status: withdrawal.status,
        type: withdrawal.type,
        rejectionReason: withdrawal.rejectionReason
      },
      userBalance: {
        lockedBalance: user.lockedBalance,
        availableBalance: user.availableBalance
      }
    });
  } catch (err) {
    console.error('[WITHDRAWAL MANAGEMENT] Error rejecting withdrawal:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// ============================================
// 2. MOVE FROM LOCKED TO AVAILABLE (with fee)
// ============================================
router.post('/:withdrawalId/move-to-available', authAdmin, async (req, res) => {
  try {
    console.log('[WITHDRAWAL MANAGEMENT] Moving rejected withdrawal to available balance:', req.params.withdrawalId);
    const { feePercent = 0 } = req.body; // Fee as percentage (e.g., 5 for 5%)
    
    const withdrawal = await Withdrawal.findById(req.params.withdrawalId);
    if (!withdrawal) {
      return res.status(404).json({ 
        success: false, 
        error: 'Withdrawal not found' 
      });
    }
    
    // Can only move rejected withdrawals
    if (withdrawal.status !== 'rejected') {
      return res.status(400).json({ 
        success: false, 
        error: `Can only move rejected withdrawals. Current status: ${withdrawal.status}` 
      });
    }
    
    const user = await User.findById(withdrawal.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    // Validate locked balance
    if ((user.lockedBalance || 0) < withdrawal.amount) {
      return res.status(400).json({ 
        success: false, 
        error: `Insufficient locked balance. Required: $${withdrawal.amount}, Available: $${user.lockedBalance || 0}` 
      });
    }
    
    // Calculate fee and amount after fee
    const totalAmount = withdrawal.amount;
    const feeAmount = (totalAmount * feePercent) / 100;
    const amountAfterFee = totalAmount - feeAmount;
    
    console.log('[WITHDRAWAL MANAGEMENT] Processing move: total=$' + totalAmount.toFixed(2) + ', fee=$' + feeAmount.toFixed(2) + ', afterFee=$' + amountAfterFee.toFixed(2));
    
    // Update user balances
    user.lockedBalance = (user.lockedBalance || 0) - totalAmount; // Remove full amount from locked
    user.availableBalance = (user.availableBalance || 0) + amountAfterFee; // Add net amount to available
    await user.save();
    
    console.log('[WITHDRAWAL MANAGEMENT] User balances updated. lockedBalance: $' + user.lockedBalance.toFixed(2) + ', availableBalance: $' + user.availableBalance.toFixed(2));
    
    // Update withdrawal status - mark as 'moved_to_available'
    withdrawal.status = 'moved_to_available';
    withdrawal.movedToAvailableAt = new Date();
    withdrawal.feeApplied = feeAmount;
    withdrawal.amountAfterFee = amountAfterFee;
    withdrawal.processedBy = req.user.id;
    withdrawal.processedAt = new Date();
    await withdrawal.save();
    
    // Create audit log
    await new AuditLog({
      userId: withdrawal.userId,
      adminId: req.user.id,
      action: 'withdrawal_moved_to_available',
      details: {
        withdrawalId: withdrawal._id,
        amount: totalAmount,
        fee: feeAmount,
        amountAfterFee: amountAfterFee,
        previousLockedBalance: (user.lockedBalance || 0) + totalAmount,
        newLockedBalance: user.lockedBalance,
        newAvailableBalance: user.availableBalance
      }
    }).save();
    
    console.log('[WITHDRAWAL MANAGEMENT] Withdrawal moved to available. Fee: $' + feeAmount.toFixed(2) + ', Net amount: $' + amountAfterFee.toFixed(2));
    
    res.json({ 
      success: true, 
      message: `Withdrawal moved to available balance! Fee applied: $${feeAmount.toFixed(2)}, Net amount added: $${amountAfterFee.toFixed(2)}`,
      withdrawal: {
        _id: withdrawal._id,
        amount: withdrawal.amount,
        status: withdrawal.status,
        type: withdrawal.type,
        feeApplied: feeAmount,
        amountAfterFee: amountAfterFee
      },
      userBalance: {
        lockedBalance: user.lockedBalance,
        availableBalance: user.availableBalance
      }
    });
  } catch (err) {
    console.error('[WITHDRAWAL MANAGEMENT] Error moving to available:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// ============================================
// 3. ACCEPT WITHDRAWAL (from pending status)
// ============================================
router.post('/:withdrawalId/accept', authAdmin, async (req, res) => {
  try {
    console.log('[WITHDRAWAL MANAGEMENT] Accepting withdrawal:', req.params.withdrawalId);
    const { feePercent = 0 } = req.body; // Fee as percentage (e.g., 5 for 5%)
    
    const withdrawal = await Withdrawal.findById(req.params.withdrawalId);
    if (!withdrawal) {
      return res.status(404).json({ 
        success: false, 
        error: 'Withdrawal not found' 
      });
    }
    
    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        error: `Cannot accept withdrawal with status: ${withdrawal.status}. Only pending withdrawals can be accepted.` 
      });
    }
    
    const user = await User.findById(withdrawal.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    // Calculate fee and amount after fee
    const totalAmount = withdrawal.amount;
    const feeAmount = (totalAmount * feePercent) / 100;
    const amountAfterFee = totalAmount - feeAmount;
    
    console.log('[WITHDRAWAL MANAGEMENT] Processing acceptance: total=$' + totalAmount.toFixed(2) + ', fee=$' + feeAmount.toFixed(2) + ', afterFee=$' + amountAfterFee.toFixed(2));
    
    // For pending withdrawals, amount should be in lockedBalance (for ROI) or availableBalance (for regular)
    // Move to final destination with fee
    if (withdrawal.type === 'roi') {
      // ROI: move from lockedBalance to availableBalance
      if ((user.lockedBalance || 0) < totalAmount) {
        return res.status(400).json({ 
          success: false, 
          error: `Insufficient locked balance. Required: $${totalAmount}, Available: $${user.lockedBalance || 0}` 
        });
      }
      user.lockedBalance = (user.lockedBalance || 0) - totalAmount;
    }
    // For regular withdrawals, amount was already deducted from availableBalance during request
    
    user.availableBalance = (user.availableBalance || 0) + amountAfterFee;
    await user.save();
    
    console.log('[WITHDRAWAL MANAGEMENT] User balances updated');
    
    // Update withdrawal status to 'completed'
    withdrawal.status = 'completed';
    withdrawal.approvedAt = new Date();
    withdrawal.feeApplied = feeAmount;
    withdrawal.amountAfterFee = amountAfterFee;
    withdrawal.processedBy = req.user.id;
    withdrawal.processedAt = new Date();
    await withdrawal.save();
    
    // Mark investment as roiWithdrawn if this is ROI withdrawal
    if (withdrawal.type === 'roi' && withdrawal.investmentId) {
      await Investment.findByIdAndUpdate(withdrawal.investmentId, { roiWithdrawn: true });
      console.log('[WITHDRAWAL MANAGEMENT] Investment marked as ROI withdrawn');
    }
    
    // Create audit log
    await new AuditLog({
      userId: withdrawal.userId,
      adminId: req.user.id,
      action: 'withdrawal_accepted',
      details: {
        withdrawalId: withdrawal._id,
        type: withdrawal.type,
        amount: totalAmount,
        fee: feeAmount,
        amountAfterFee: amountAfterFee,
        newAvailableBalance: user.availableBalance
      }
    }).save();
    
    console.log('[WITHDRAWAL MANAGEMENT] Withdrawal accepted. Fee: $' + feeAmount.toFixed(2) + ', Net amount: $' + amountAfterFee.toFixed(2));
    
    res.json({ 
      success: true, 
      message: `Withdrawal accepted! Fee: $${feeAmount.toFixed(2)}, Amount moved to available: $${amountAfterFee.toFixed(2)}`,
      withdrawal: {
        _id: withdrawal._id,
        amount: withdrawal.amount,
        status: withdrawal.status,
        type: withdrawal.type,
        feeApplied: feeAmount,
        amountAfterFee: amountAfterFee
      },
      userBalance: {
        lockedBalance: user.lockedBalance,
        availableBalance: user.availableBalance
      }
    });
  } catch (err) {
    console.error('[WITHDRAWAL MANAGEMENT] Error accepting withdrawal:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// ============================================
// 4. GET WITHDRAWAL STATUS
// ============================================
router.get('/:withdrawalId', authAdmin, async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.withdrawalId).populate('userId', 'name email availableBalance lockedBalance');
    
    if (!withdrawal) {
      return res.status(404).json({ 
        success: false, 
        error: 'Withdrawal not found' 
      });
    }
    
    res.json({
      success: true,
      withdrawal: {
        _id: withdrawal._id,
        userId: withdrawal.userId,
        amount: withdrawal.amount,
        status: withdrawal.status,
        type: withdrawal.type,
        walletAddress: withdrawal.walletAddress,
        network: withdrawal.network,
        currency: withdrawal.currency,
        createdAt: withdrawal.createdAt,
        rejectionReason: withdrawal.rejectionReason,
        feeApplied: withdrawal.feeApplied,
        amountAfterFee: withdrawal.amountAfterFee,
        processedAt: withdrawal.processedAt
      }
    });
  } catch (err) {
    console.error('[WITHDRAWAL MANAGEMENT] Error fetching withdrawal:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// ============================================
// 5. LIST ALL WITHDRAWALS FOR ADMIN
// ============================================
router.get('/', authAdmin, async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    
    const skip = (page - 1) * limit;
    
    const withdrawals = await Withdrawal.find(query)
      .populate('userId', 'name email availableBalance lockedBalance')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Withdrawal.countDocuments(query);
    
    res.json({
      success: true,
      withdrawals: withdrawals.map(w => ({
        _id: w._id,
        userId: w.userId,
        amount: w.amount,
        status: w.status,
        type: w.type,
        walletAddress: w.walletAddress,
        network: w.network,
        currency: w.currency,
        createdAt: w.createdAt,
        rejectionReason: w.rejectionReason,
        feeApplied: w.feeApplied,
        amountAfterFee: w.amountAfterFee
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('[WITHDRAWAL MANAGEMENT] Error listing withdrawals:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

module.exports = router;
