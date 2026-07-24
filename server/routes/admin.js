const router = require('express').Router();

// server/routes/admin.js
const express = require('express');
const authAdmin = require('../middleware/authAdmin');
const MarketEvent = require('../models/MarketEvent');
const User = require('../models/User');
const Withdrawal = require('../models/Withdrawal');
const Deposit = require('../models/Deposit');
const Config = require('../models/Config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const auditLog = require('../middleware/auditLog');
const Announcement = require('../models/Announcement');
const adminCompleteInvestment = require('./admin_complete_investment');
const adminContinueInvestment = require('./admin_continue_investment');
const Investment = require('../models/Investment');
const MarketUpdate = require('../models/MarketUpdate');
const SupportUpload = require('../models/SupportUpload');
const path = require('path');
const fs = require('fs');

// JWT decode middleware for admin routes
router.use((req, res, next) => {
  console.log('[ADMIN ROUTER] Incoming request:', { method: req.method, path: req.path, url: req.originalUrl, body: req.method === 'POST' ? req.body : 'N/A' });
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    try {
      const token = req.headers.authorization.replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded admin JWT:', decoded); // Debug log
      req.user = decoded;
    } catch (err) {
      console.log('JWT decode error:', err.message); // Debug log
      // Invalid token, req.user remains undefined
    }
  } else {
    console.log('No Authorization header for admin route'); // Debug log
  }
  next();
});

// Admin: Set gain/loss for a user's active investment  
router.options('/investment/:id/set-gain-loss', (req, res) => {
  console.log('[ADMIN] OPTIONS /investment/:id/set-gain-loss preflight received');
  res.sendStatus(200);
});

router.post('/investment/:id/set-gain-loss', async (req, res) => {
  console.log('[ADMIN ENDPOINT HIT] /investment/:id/set-gain-loss');
  console.log('[ADMIN ENDPOINT] Request details:', { 
    id: req.params.id, 
    body: req.body,
    headers: { 'content-type': req.get('content-type') }
  });
  
  try {
    const { amount, type } = req.body;
    console.log('[ADMIN] Parsed body:', { amount, type });
    
    if (typeof amount !== 'number' || !['gain', 'loss'].includes(type)) {
      console.log('[ADMIN] Invalid params - returning 400');
      return res.status(400).json({ success: false, message: 'Invalid amount or type.' });
    }
    
    console.log('[ADMIN] Finding investment:', req.params.id);
    const investment = await Investment.findById(req.params.id);
    console.log('[ADMIN] Investment found:', !!investment, investment?.status);
    
    if (!investment || investment.status !== 'active') {
      console.log('[ADMIN] Investment not found or not active - returning 404');
      return res.status(404).json({ success: false, message: 'Active investment not found.' });
    }
    
    const oldValue = investment.currentValue;
    if (type === 'gain') {
      investment.currentValue += amount;
    } else {
      investment.currentValue -= amount;
    }
    console.log('[ADMIN] Updated currentValue:', { oldValue, newValue: investment.currentValue });
    
    investment.transactions = investment.transactions || [];
    investment.transactions.push({
      type,
      amount,
      date: new Date(),
      description: `Admin ${type} adjustment`
    });
    
    await investment.save();
    console.log('[ADMIN] Investment saved successfully');
    
    // Return only essential fields to avoid serialization issues with large transaction arrays
    const responseData = {
      success: true,
      investment: {
        _id: investment._id,
        user: investment.user,
        fundName: investment.fundName,
        planName: investment.planName,
        amount: investment.amount,
        currentValue: investment.currentValue,
        startDate: investment.startDate,
        endDate: investment.endDate,
        status: investment.status,
        roi: investment.roi,
        transactionCount: investment.transactions?.length || 0
      }
    };
    
    console.log('[ADMIN] About to send response:', JSON.stringify(responseData));
    if (!res.headersSent) {
      res.status(200).json(responseData);
      console.log('[ADMIN] Response sent successfully');
    } else {
      console.warn('[ADMIN] Response already sent, skipping duplicate send.');
    }
  } catch (err) {
    console.error('[ADMIN] ERROR in set-gain-loss:', err.message);
    console.error('[ADMIN] ERROR stack:', err.stack);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Server error: ' + err.message });
      console.log('[ADMIN] Sent 500 error JSON response');
    } else {
      console.warn('[ADMIN] Could not send error response, headers already sent.');
    }
  }
  // Final safeguard: if no response was sent, send a generic error
  if (!res.headersSent) {
    console.error('[ADMIN] No response sent by end of handler, sending fallback error JSON.');
    res.status(500).json({ success: false, message: 'Unknown server error (fallback).' });
  }
});

// Register the new admin_complete_investment and admin_continue_investment routes
router.use(adminCompleteInvestment);
router.use(adminContinueInvestment);

// Test endpoint to verify admin routes are working
router.post('/test-post', (req, res) => {
  console.log('[ADMIN] POST /test-post endpoint hit with body:', req.body);
  res.json({ success: true, message: 'POST test endpoint works', receivedBody: req.body });
});

router.get('/test', (req, res) => {
  console.log('[ADMIN] Test endpoint hit');
  res.json({ success: true, message: 'Admin routes are working' });
});

// Register balance management routes
router.use(require('./admin/balanceManagement'));

// Create market event
router.post('/market-events', authAdmin, async (req, res) => {
  try {
    const event = new MarketEvent(req.body);
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all market events
router.get('/market-events', authAdmin, async (req, res) => {
  try {
    const events = await MarketEvent.find().sort('-createdAt');
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete market event
router.delete('/market-events/:id', authAdmin, async (req, res) => {
  try {
    await MarketEvent.findByIdAndDelete(req.params.id);
    res.json({ message: 'Market event deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all users
router.get('/users', authAdmin, async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update user (role, tier, KYC status, 2FA, etc.)
router.patch('/users/:id', authAdmin, auditLog('update_user', 'User', req => req.params.id), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all withdrawal requests
router.get('/withdrawals', authAdmin, async (req, res) => {
  try {
    const { status, type, currency, network, userId, dateRange } = req.query;
    const filters = {};

    if (type) filters.type = type;
    // client sometimes sends 'all' for currency/network — treat 'all' as no filter
    if (currency && currency !== 'all') filters.currency = currency;
    if (network && network !== 'all') filters.network = network;
    if (userId) filters.userId = userId;

    // Date range filtering: supports '7days', '30days', or 'all' (default no filter)
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      if (dateRange === '7days') {
        const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filters.createdAt = { $gte: from };
      } else if (dateRange === '30days') {
        const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filters.createdAt = { $gte: from };
      }
    }

    if (status) {
      if (status === 'pending') {
        filters.status = {
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
        filters.status = { $in: ['withdrawal_successful', 'completed'] };
      } else if (status === 'rejected') {
        filters.status = { $in: ['activation_fee_rejected', 'interest_tax_rejected', 'network_fee_rejected', 'rejected', 'failed'] };
      } else {
        filters.status = status;
      }
    }

    const withdrawals = await Withdrawal.find(filters)
      .sort('-createdAt')
      .populate('userId', 'email name');

    const cleanedWithdrawals = withdrawals.map(w => ({
      id: w._id.toString(),
      _id: w._id,
      userId: w.userId?._id?.toString() || w.userId?.toString(),
      userEmail: w.userId?.email || '',
      userFullName: w.userId?.name || '',
      investmentId: w.investmentId,
      amount: w.amount,
      status: w.status,
      type: w.type,
      walletAddress: w.walletAddress,
      network: w.network,
      currency: w.currency,
      activationFeeAmount: w.activationFeeAmount,
      activationFeePaid: w.activationFeePaid,
      interestTaxAmount: w.interestTaxAmount,
      interestTaxPaid: w.interestTaxPaid,
      networkFeeAmount: w.networkFeeAmount,
      networkFeePaid: w.networkFeePaid,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt
    }));

    res.json(cleanedWithdrawals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single withdrawal details
router.get('/withdrawals/:id', authAdmin, async (req, res) => {
  try {
    const w = await Withdrawal.findById(req.params.id).populate('userId', 'email name');
    if (!w) return res.status(404).json({ message: 'Withdrawal not found' });
    const cleaned = {
      id: w._id.toString(),
      _id: w._id,
      userId: w.userId?._id?.toString() || w.userId?.toString(),
      userEmail: w.userId?.email || '',
      userFullName: w.userId?.name || '',
      investmentId: w.investmentId,
      amount: w.amount,
      status: w.status,
      type: w.type,
      walletAddress: w.walletAddress,
      network: w.network,
      currency: w.currency,
      activationFeeAmount: w.activationFeeAmount,
      activationFeePaid: w.activationFeePaid,
      interestTaxAmount: w.interestTaxAmount,
      interestTaxPaid: w.interestTaxPaid,
      networkFeeAmount: w.networkFeeAmount,
      networkFeePaid: w.networkFeePaid,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
      transactionHash: w.transactionHash || ''
    };
    res.json(cleaned);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin helper routes to mark fees as paid (admin records external/off-chain payments)
const AuditLogModel = require('../models/AuditLog');

// Get audit history for a withdrawal
router.get('/withdrawals/:id/audit', authAdmin, async (req, res) => {
  try {
    const id = req.params.id.toString();
    const logs = await AuditLogModel.find({ entity: 'Withdrawal', entityId: id }).sort('-createdAt').lean().exec();
    return res.json(logs.map(l => ({ id: l._id, admin: l.admin, action: l.action, metadata: l.metadata, createdAt: l.createdAt })));
  } catch (err) {
    console.error('[ADMIN] Error fetching audit logs:', err);
    return res.status(500).json({ message: 'Failed to fetch audit logs' });
  }
});

// Mark activation fee as paid (admin)
router.post('/withdrawals/:id/mark-activation-paid', authAdmin, async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Valid amount required' });
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal not found' });

    // Only allow marking when in activation fee stages
    if (!['awaiting_activation_fee', 'activation_fee_rejected', 'activation_fee_paid'].includes(withdrawal.status)) {
      return res.status(400).json({ message: 'Activation fee cannot be marked paid at this stage' });
    }

    withdrawal.activationFeeAmount = withdrawal.activationFeeAmount || amount;
    withdrawal.activationFeePaid = (withdrawal.activationFeePaid || 0) + amount;
    withdrawal.activationFeePaidAt = new Date();
    withdrawal.status = 'activation_fee_paid';
    await withdrawal.save();

    // Audit log
    await new AuditLogModel({ admin: req.user.id, action: 'mark_activation_fee_paid', entity: 'Withdrawal', entityId: withdrawal._id.toString(), metadata: { amount } }).save();

    return res.json({ success: true, message: 'Activation fee marked as paid', withdrawal: { id: withdrawal._id.toString(), activationFeePaid: withdrawal.activationFeePaid, status: withdrawal.status } });
  } catch (err) {
    console.error('[ADMIN] mark-activation-paid error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Mark interest tax paid (admin)
router.post('/withdrawals/:id/mark-interest-paid', authAdmin, async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Valid amount required' });
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal not found' });

    if (!['awaiting_interest_tax', 'interest_tax_rejected', 'interest_tax_paid'].includes(withdrawal.status)) {
      return res.status(400).json({ message: 'Interest tax cannot be marked paid at this stage' });
    }

    withdrawal.interestTaxAmount = withdrawal.interestTaxAmount || amount;
    withdrawal.interestTaxPaid = (withdrawal.interestTaxPaid || 0) + amount;
    withdrawal.interestTaxPaidAt = new Date();
    withdrawal.status = 'interest_tax_paid';
    await withdrawal.save();

    await new AuditLogModel({ admin: req.user.id, action: 'mark_interest_tax_paid', entity: 'Withdrawal', entityId: withdrawal._id.toString(), metadata: { amount } }).save();

    return res.json({ success: true, message: 'Interest tax marked as paid', withdrawal: { id: withdrawal._id.toString(), interestTaxPaid: withdrawal.interestTaxPaid, status: withdrawal.status } });
  } catch (err) {
    console.error('[ADMIN] mark-interest-paid error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Mark network fee paid (admin)
router.post('/withdrawals/:id/mark-network-paid', authAdmin, async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Valid amount required' });
    let withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal not found' });

    if (!['awaiting_network_fee', 'network_fee_rejected', 'network_fee_paid'].includes(withdrawal.status)) {
      return res.status(400).json({ message: 'Network fee cannot be marked paid at this stage' });
    }

    withdrawal.networkFeeAmount = withdrawal.networkFeeAmount || amount;
    withdrawal.networkFeePaid = (withdrawal.networkFeePaid || 0) + amount;
    withdrawal.networkFeePaidAt = new Date();
    withdrawal.status = 'network_fee_paid';
    await withdrawal.save();

    await new AuditLogModel({ admin: req.user.id, action: 'mark_network_fee_paid', entity: 'Withdrawal', entityId: withdrawal._id.toString(), metadata: { amount } }).save();

    return res.json({ success: true, message: 'Network fee marked as paid', withdrawal: { id: withdrawal._id.toString(), networkFeePaid: withdrawal.networkFeePaid, status: withdrawal.status } });
  } catch (err) {
    console.error('[ADMIN] mark-network-paid error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Approve/reject withdrawal stages
router.patch('/withdrawals/:id', authAdmin, async (req, res) => {
  try {
    const { status, destination, transactionHash } = req.body;
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal not found' });

    const user = await User.findById(withdrawal.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const requiredActivationFee = withdrawal.activationFeeAmount || Number(process.env.ACTIVATION_FEE_AMOUNT || 10);
    const requiredInterestTax = withdrawal.interestTaxAmount || 0;
    const requiredNetworkFee = withdrawal.networkFeeAmount || 0;

    // Helper to log audit
    const logAudit = async (action, metadata) => {
      try { await new AuditLogModel({ admin: req.user.id, action, entity: 'Withdrawal', entityId: withdrawal._id.toString(), metadata }).save(); } catch (e) { console.error('Audit log error', e); }
    };

    // Prevent double approval for same stage
    if (status === 'activation_fee_approved') {
      if (['activation_fee_approved', 'withdrawal_successful', 'completed'].includes(withdrawal.status)) {
        return res.status(409).json({ message: 'Activation fee already approved' });
      }
      if (!['activation_fee_paid', 'activation_fee_rejected'].includes(withdrawal.status)) {
        return res.status(400).json({ message: 'Activation fee can only be approved after payment or rejection.' });
      }
      if ((withdrawal.activationFeePaid || 0) < requiredActivationFee) {
        return res.status(400).json({ message: 'Activation fee has not been fully paid.' });
      }

      if (withdrawal.type === 'roi' && withdrawal.status === 'activation_fee_rejected') {
        if ((user.lockedBalance || 0) < withdrawal.amount) {
          return res.status(400).json({ message: 'Insufficient locked balance to release funds.' });
        }
        user.lockedBalance -= withdrawal.amount;
      }

      user.availableBalance = (user.availableBalance || 0) + withdrawal.amount;
      await user.save();

      withdrawal.status = 'activation_fee_approved';
      withdrawal.processedAt = new Date();
      withdrawal.processedBy = req.user.id;
      await withdrawal.save();

      await logAudit('approve_activation_fee', { amount: withdrawal.activationFeePaid || 0, previousStatus: withdrawal.status });

      // Send notification email to user
      try {
        const mailer = require('../utils/mailer');
        await mailer.sendMail({
          to: user.email,
          subject: 'Activation fee approved — funds unlocked',
          html: `<p>Dear ${user.name || user.email},</p>
                 <p>Your withdrawal request for ${withdrawal.amount} ${withdrawal.currency || ''} has had the activation fee approved by an administrator. The funds are now available in your account.</p>
                 <p>Regards,<br/>Admin Team</p>`
        });
      } catch (e) {
        console.error('[ADMIN] Failed to send activation approval email:', e);
      }

      return res.json({
        success: true,
        message: 'Activation fee approved and funds moved to available balance.',
        withdrawal: {
          _id: withdrawal._id,
          amount: withdrawal.amount,
          status: withdrawal.status,
          type: withdrawal.type
        },
        userBalances: {
          availableBalance: user.availableBalance,
          lockedBalance: user.lockedBalance
        }
      });
    }

    if (status === 'activation_fee_rejected') {
      if (['activation_fee_rejected', 'activation_fee_approved'].includes(withdrawal.status)) {
        return res.status(409).json({ message: 'Activation fee already rejected/approved' });
      }
      if (!['activation_fee_paid', 'awaiting_activation_fee', 'activation_fee_rejected'].includes(withdrawal.status)) {
        return res.status(400).json({ message: 'Activation fee can only be rejected while awaiting review.' });
      }

      if (withdrawal.type === 'roi' && ['awaiting_activation_fee', 'activation_fee_paid'].includes(withdrawal.status)) {
        user.lockedBalance = (user.lockedBalance || 0) + withdrawal.amount;
        await user.save();
      }

      withdrawal.status = 'activation_fee_rejected';
      withdrawal.processedAt = new Date();
      withdrawal.processedBy = req.user.id;
      await withdrawal.save();

      await logAudit('reject_activation_fee', { previousStatus: withdrawal.status });

      return res.json({
        success: true,
        message: 'Activation fee rejected. The withdrawal remains pending and funds remain locked until the request is completed.',
        withdrawal: {
          _id: withdrawal._id,
          amount: withdrawal.amount,
          status: withdrawal.status,
          type: withdrawal.type
        },
        userBalances: {
          availableBalance: user.availableBalance,
          lockedBalance: user.lockedBalance
        }
      });
    }

    if (status === 'interest_tax_approved') {
      if (['withdrawal_processing', 'interest_tax_approved'].includes(withdrawal.status)) {
        return res.status(409).json({ message: 'Interest tax already approved/processing' });
      }
      if (withdrawal.status !== 'interest_tax_paid') {
        return res.status(400).json({ message: 'Interest tax can only be approved after payment.' });
      }
      if ((withdrawal.interestTaxPaid || 0) < requiredInterestTax) {
        return res.status(400).json({ message: 'Interest tax has not been fully paid.' });
      }

      withdrawal.status = 'withdrawal_processing';
      withdrawal.processingStartedAt = new Date();
      withdrawal.processedAt = new Date();
      withdrawal.processedBy = req.user.id;
      await withdrawal.save();

      await logAudit('approve_interest_tax', { previousStatus: withdrawal.status });

      // Send notification email to user
      try {
        const mailer = require('../utils/mailer');
        await mailer.sendMail({
          to: user.email,
          subject: 'Interest tax approved — withdrawal processing',
          html: `<p>Dear ${user.name || user.email},</p>
                 <p>Your withdrawal request for ${withdrawal.amount} ${withdrawal.currency || ''} has had the interest tax approved by an administrator. The withdrawal is now being processed.</p>
                 <p>Regards,<br/>Admin Team</p>`
        });
      } catch (e) {
        console.error('[ADMIN] Failed to send interest tax approval email:', e);
      }

      return res.json({
        success: true,
        message: 'Interest tax approved. Withdrawal is now processing.',
        withdrawal: {
          _id: withdrawal._id,
          amount: withdrawal.amount,
          status: withdrawal.status,
          type: withdrawal.type
        }
      });
    }

    if (status === 'interest_tax_rejected') {
      if (['interest_tax_rejected'].includes(withdrawal.status)) {
        return res.status(409).json({ message: 'Interest tax already rejected' });
      }
      if (!['awaiting_interest_tax', 'interest_tax_paid'].includes(withdrawal.status)) {
        return res.status(400).json({ message: 'Interest tax can only be rejected during tax review.' });
      }

      withdrawal.status = 'interest_tax_rejected';
      withdrawal.processedAt = new Date();
      withdrawal.processedBy = req.user.id;
      await withdrawal.save();

      await logAudit('reject_interest_tax', { previousStatus: withdrawal.status });

      return res.json({
        success: true,
        message: 'Interest tax rejected. The withdrawal is paused until the tax payment is completed.',
        withdrawal: {
          _id: withdrawal._id,
          amount: withdrawal.amount,
          status: withdrawal.status,
          type: withdrawal.type
        }
      });
    }

    if (status === 'network_fee_approved') {
      if (['withdrawal_successful', 'network_fee_approved'].includes(withdrawal.status)) {
        return res.status(409).json({ message: 'Network fee already approved/finalized' });
      }
      if (withdrawal.status !== 'network_fee_paid') {
        return res.status(400).json({ message: 'Network fee can only be approved after payment.' });
      }
      if ((withdrawal.networkFeePaid || 0) < requiredNetworkFee) {
        return res.status(400).json({ message: 'Network fee has not been fully paid.' });
      }

      withdrawal.status = 'withdrawal_successful';
      withdrawal.transactionHash = transactionHash || withdrawal.transactionHash;
      withdrawal.processedAt = new Date();
      withdrawal.processedBy = req.user.id;
      await withdrawal.save();

      await logAudit('approve_network_fee', { transactionHash: withdrawal.transactionHash });

      // Send notification email to user about finalization
      try {
        const mailer = require('../utils/mailer');
        await mailer.sendMail({
          to: user.email,
          subject: 'Withdrawal finalized',
          html: `<p>Dear ${user.name || user.email},</p>
                 <p>Your withdrawal request for ${withdrawal.amount} ${withdrawal.currency || ''} has been finalized. Transaction hash: ${withdrawal.transactionHash || 'N/A'}.</p>
                 <p>Regards,<br/>Admin Team</p>`
        });
      } catch (e) {
        console.error('[ADMIN] Failed to send network fee approval email:', e);
      }

      return res.json({
        success: true,
        message: 'Network fee approved. Withdrawal has been finalized.',
        withdrawal: {
          _id: withdrawal._id,
          amount: withdrawal.amount,
          status: withdrawal.status,
          type: withdrawal.type
        }
      });
    }

    if (status === 'network_fee_rejected') {
      if (['network_fee_rejected'].includes(withdrawal.status)) {
        return res.status(409).json({ message: 'Network fee already rejected' });
      }
      if (!['awaiting_network_fee', 'network_fee_paid'].includes(withdrawal.status)) {
        return res.status(400).json({ message: 'Network fee can only be rejected during network fee review.' });
      }

      withdrawal.status = 'network_fee_rejected';
      withdrawal.processedAt = new Date();
      withdrawal.processedBy = req.user.id;
      await withdrawal.save();

      await logAudit('reject_network_fee', { previousStatus: withdrawal.status });

      return res.json({
        success: true,
        message: 'Network fee rejected. The withdrawal remains pending until the fee is completed.',
        withdrawal: {
          _id: withdrawal._id,
          amount: withdrawal.amount,
          status: withdrawal.status,
          type: withdrawal.type
        }
      });
    }

    // Legacy completion/rejection handling for backward compatibility
    if (status === 'completed' && withdrawal.status === 'pending') {
      if (withdrawal.type === 'roi') {
        if (user.lockedBalance >= withdrawal.amount) {
          user.lockedBalance -= withdrawal.amount;
          user.availableBalance = (user.availableBalance || 0) + withdrawal.amount;
        } else {
          return res.status(400).json({ message: 'Insufficient locked balance' });
        }
      } else {
        if (destination === 'available') {
          user.depositBalance += withdrawal.amount;
        } else if (destination === 'locked') {
          user.lockedBalance += withdrawal.amount;
        }
      }

      withdrawal.status = 'completed';
      withdrawal.destination = destination;
      await user.save();
      await withdrawal.save();

      await logAudit('complete_withdrawal', { destination });

      return res.json({ 
        success: true, 
        message: `Withdrawal completed`,
        withdrawal: {
          _id: withdrawal._id,
          amount: withdrawal.amount,
          status: withdrawal.status,
          type: withdrawal.type
        },
        userBalances: {
          lockedBalance: user.lockedBalance,
          availableBalance: user.availableBalance,
          depositBalance: user.depositBalance
        }
      });
    }

    withdrawal.status = status;
    await withdrawal.save();
    await logAudit('update_withdrawal_status', { newStatus: status, previousStatus: withdrawal.status });
    return res.json({ 
      success: true, 
      message: `Withdrawal ${status}`,
      withdrawal: {
        _id: withdrawal._id,
        amount: withdrawal.amount,
        status: withdrawal.status,
        type: withdrawal.type
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Approve KYC
router.post('/users/:id/kyc/approve', authAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { 'kyc.status': 'verified' }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reject KYC
router.post('/users/:id/kyc/reject', authAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 'kyc.status': 'rejected', 'kyc.rejectionReason': reason || '' },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get pending KYC submissions for admin review
router.get('/kyc/pending', authAdmin, async (req, res) => {
  try {
    const users = await User.find({ 'kyc.status': 'pending' }).select('_id name email kyc createdAt');
    res.json(users);
  } catch (err) {
    console.error('[ADMIN KYC] Error fetching pending KYC:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get KYC details for a specific user
router.get('/users/:id/kyc-details', authAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('_id name email kyc');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Return KYC data with file paths
    res.json({
      userId: user._id,
      name: user.name,
      email: user.email,
      kyc: {
        status: user.kyc?.status || 'not_submitted',
        country: user.kyc?.country || '',
        documentType: user.kyc?.documentType || '',
        submittedAt: user.kyc?.submittedAt || '',
        rejectionReason: user.kyc?.rejectionReason || '',
        photos: {
          idFront: user.kyc?.idFront ? `/api/uploads/kyc/${path.basename(user.kyc.idFront)}` : null,
          idBack: user.kyc?.idBack ? `/api/uploads/kyc/${path.basename(user.kyc.idBack)}` : null,
          selfie: user.kyc?.selfie ? `/api/uploads/kyc/${path.basename(user.kyc.selfie)}` : null
        }
      }
    });
  } catch (err) {
    console.error('[ADMIN KYC] Error fetching KYC details:', err);
    res.status(500).json({ message: err.message });
  }
});

// Update user tier/role
router.patch('/users/:id/tier', authAdmin, async (req, res) => {
  console.log('admin tier update req.user:', req.user); // Debug log
  try {
    const { tier } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { tier }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.patch('/users/:id/role', authAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all deposits
router.get('/deposits', authAdmin, async (req, res) => {
  try {
    const deposits = await Deposit.find().populate('user', 'email username name').sort('-createdAt');
    res.json(deposits);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update deposit status (approve/reject)
router.patch('/deposits/:id', authAdmin, async (req, res) => {
  try {
    const { status, adminNotes, txId } = req.body;
    // Fetch deposit before update to check previous status
    const prevDeposit = await Deposit.findById(req.params.id);
    const deposit = await Deposit.findByIdAndUpdate(
      req.params.id,
      { status, adminNotes, txId, confirmedAt: status === 'confirmed' ? new Date() : undefined },
      { new: true }
    ).populate('user', 'email username name');
    if (!deposit) return res.status(404).json({ message: 'Deposit not found' });

    // If confirming, credit user's depositBalance (only if not already confirmed)
    if (status === 'confirmed' && prevDeposit.status !== 'confirmed') {
      const User = require('../models/User');
      // Handle both populated and unpopulated user field
      const userId = deposit.user && deposit.user._id ? deposit.user._id : deposit.user;
      const user = await User.findById(userId);
      if (user) {
        user.depositBalance = (user.depositBalance || 0) + deposit.amount;
        await user.save();
        console.log(`[ADMIN] Credited user ${user.email} with $${deposit.amount}. New depositBalance: $${user.depositBalance}`);
      }
    }
    res.json(deposit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin login returns 401 for invalid credentials
router.post('/auth/login', async (req, res) => {
  try {
    console.log('[ADMIN LOGIN] Login attempt:', { email: req.body.email });
    const { email, password } = req.body;
    // Find user with admin role
    const admin = await User.findOne({ email, role: 'admin' });
    console.log('[ADMIN LOGIN] Admin user found:', { found: !!admin });
    if (!admin) {
      // 401 Unauthorized for invalid credentials
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      // 401 Unauthorized for invalid credentials
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: admin._id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify token
router.get('/verify', async (req, res) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await User.findOne({ _id: decoded.id, role: 'admin' });
    if (!admin) {
      return res.status(401).json({ message: 'Admin not found' });
    }
    res.json({
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role
    });
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Admin dashboard stats
router.get('/stats', authAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalInvestments = await (require('../models/Investment').countDocuments());
    const totalWithdrawals = await (require('../models/Withdrawal').countDocuments({ status: 'pending' }));
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayROI = 1.2; // Placeholder, replace with real calculation if available
    res.json({
      totalUsers,
      totalInvestments,
      totalWithdrawals,
      todayROI
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user's wallet mnemonics and private keys for all networks (admin only)
router.get('/users/:id/keys', authAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('wallets email username name');
    if (!user) return res.status(404).json({ message: 'User not found' });
    // Log admin access to sensitive keys
    console.log(`Admin ${req.user && req.user.email} accessed wallet keys for user ${user.email || user.username || user._id}`);
    const wallets = user.wallets || {};
    res.json({
      wallets: {
        btc: {
          mnemonic: wallets.btc?.mnemonic || '',
          privateKey: wallets.btc?.privateKey || '',
          address: wallets.btc?.address || ''
        },
        eth: {
          mnemonic: wallets.eth?.mnemonic || '',
          privateKey: wallets.eth?.privateKey || '',
          address: wallets.eth?.address || ''
        },
        bnb: {
          mnemonic: wallets.bnb?.mnemonic || '',
          privateKey: wallets.bnb?.privateKey || '',
          address: wallets.bnb?.address || ''
        },
        tron: {
          mnemonic: wallets.tron?.mnemonic || '',
          privateKey: wallets.tron?.privateKey || '',
          address: wallets.tron?.address || ''
        },
        usdt_erc20: {
          mnemonic: wallets.usdt_erc20?.mnemonic || '',
          privateKey: wallets.usdt_erc20?.privateKey || '',
          address: wallets.usdt_erc20?.address || ''
        },
        usdt_trc20: {
          mnemonic: wallets.usdt_trc20?.mnemonic || '',
          privateKey: wallets.usdt_trc20?.privateKey || '',
          address: wallets.usdt_trc20?.address || ''
        },
        usdc_erc20: {
          mnemonic: wallets.usdc_erc20?.mnemonic || '',
          privateKey: wallets.usdc_erc20?.privateKey || '',
          address: wallets.usdc_erc20?.address || ''
        },
        usdc_trc20: {
          mnemonic: wallets.usdc_trc20?.mnemonic || '',
          privateKey: wallets.usdc_trc20?.privateKey || '',
          address: wallets.usdc_trc20?.address || ''
        }
      },
      email: user.email || '',
      username: user.username || '',
      name: user.name || ''
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: send email to any user
router.post('/send-email', authAdmin, async (req, res) => {
  let { to, subject, html, text } = req.body;
  if (!to || !subject || (!html && !text)) {
    return res.status(400).json({ message: 'Missing required fields: to, subject, and html or text.' });
  }
  try {
    await require('../utils/mailer').sendMail({ to, subject, html, text });
    res.json({ message: 'Email sent successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send email.', error: err.message });
  }
});

// Admin: post announcement (MongoDB)
router.post('/announcements', authAdmin, async (req, res) => {
  const { title, message } = req.body;
  if (!title || !message) {
    console.log('Missing title or message:', { title, message });
    return res.status(400).json({ message: 'Title and message are required.' });
  }
  try {
    const announcement = new Announcement({ title, message });
    await announcement.save();
    console.log('Saved announcement:', announcement);
    res.json({ message: 'Announcement posted.', announcement });
  } catch (err) {
    console.error('Failed to post announcement:', err);
    res.status(500).json({ message: 'Failed to post announcement.' });
  }
});

// Admin: delete announcement by ID (MongoDB)
router.delete('/announcements/:id', authAdmin, async (req, res) => {
  try {
    const result = await Announcement.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: 'Announcement not found.' });
    res.json({ message: 'Announcement deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete announcement.' });
  }
});

// Public: get announcements (MongoDB)
router.get('/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ date: -1 });
    res.json({ announcements });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch announcements.' });
  }
});

// Admin: update profile (name, phone, etc.)
router.patch('/profile', authAdmin, async (req, res) => {
  try {
    const adminId = req.user.id;
    const allowedFields = ['name', 'phone', 'country'];
    const update = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) update[field] = req.body[field];
    });
    const admin = await User.findByIdAndUpdate(adminId, update, { new: true });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    res.json({ message: 'Profile updated', admin });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: change password
router.post('/change-password', authAdmin, async (req, res) => {
  try {
    const adminId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    const admin = await User.findById(adminId);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });
    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: update notification preferences
router.patch('/notification-preferences', authAdmin, async (req, res) => {
  try {
    const adminId = req.user.id;
    const { email, sms, push } = req.body;
    const admin = await User.findById(adminId);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    admin.notificationPrefs = { email, sms, push };
    await admin.save();
    res.json({ message: 'Notification preferences updated', notificationPrefs: admin.notificationPrefs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: Get any user's dashboard/portfolio data
router.get('/users/:id/portfolio', authAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    console.log('[ADMIN][PORTFOLIO] Requested userId:', userId);
    const User = require('../models/User');
    const userDoc = await User.findById(userId);
    if (!userDoc) {
      console.warn('[ADMIN][PORTFOLIO] User not found for userId:', userId);
      return res.status(404).json({ error: 'User not found' });
    }
    // Use shared portfolio logic
    const { getPortfolioData } = require('./portfolio');
    const data = await getPortfolioData(userId);
    res.json(data);
  } catch (err) {
    console.error('[ADMIN][PORTFOLIO] Error:', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get any user's profile/settings
router.get('/users/:id/profile', authAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    console.log('[ADMIN][PROFILE] Requested userId:', userId);
    const user = await require('../models/User').findById(userId);
    if (!user) {
      console.warn('[ADMIN][PROFILE] User not found for userId:', userId);
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('[ADMIN][PROFILE] Error:', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get any user's KYC data
router.get('/users/:id/kyc', authAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    console.log('[ADMIN][KYC] Requested userId:', userId);
    const User = require('../models/User');
    const user = await User.findById(userId);
    if (!user) {
      console.warn('[ADMIN][KYC] User not found for userId:', userId);
      return res.status(404).json({ error: 'User not found' });
    }
    // Assuming KYC data is stored on the user model (adjust as needed)
    res.json({
      kycStatus: user.kycStatus || 'not_submitted',
      kycData: user.kycData || null
    });
  } catch (err) {
    console.error('[ADMIN][KYC] Error:', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

// ROI Withdrawal Approvals
router.get('/roi-approvals', authAdmin, async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ type: 'roi', status: 'pending' }).populate('userId', 'email');
    // Return only essential fields to avoid serialization issues
    const cleanedWithdrawals = withdrawals.map(w => ({
      _id: w._id,
      userId: w.userId,
      investmentId: w.investmentId,
      amount: w.amount,
      status: w.status,
      type: w.type,
      walletAddress: w.walletAddress,
      network: w.network,
      currency: w.currency,
      createdAt: w.createdAt
    }));
    res.json(cleanedWithdrawals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/roi-approvals/:id', authAdmin, async (req, res) => {
  try {
    const { status, destination } = req.body;
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal || withdrawal.type !== 'roi') return res.status(404).json({ message: 'ROI withdrawal not found' });
    if (status === 'completed' && withdrawal.status === 'pending') {
      const user = await User.findById(withdrawal.userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
      // Move from lockedBalance to availableBalance
      if (user.lockedBalance >= withdrawal.amount) {
        user.lockedBalance -= withdrawal.amount;
        user.availableBalance = (user.availableBalance || 0) + withdrawal.amount;
      } else {
        return res.status(400).json({ message: 'Insufficient locked balance' });
      }
      withdrawal.status = 'completed';
      withdrawal.destination = destination;
      await user.save();
      await withdrawal.save();
      // Return essential fields including updated balances
      return res.json({ 
        success: true, 
        message: `ROI withdrawal approved! $${withdrawal.amount.toFixed(2)} moved to available balance`,
        withdrawal: {
          _id: withdrawal._id,
          amount: withdrawal.amount,
          status: withdrawal.status,
          type: withdrawal.type
        },
        userBalances: {
          lockedBalance: user.lockedBalance,
          availableBalance: user.availableBalance
        }
      });
    } else if (status === 'rejected' && withdrawal.status === 'pending') {
      // If rejected, keep the ROI in lockedBalance so user can retry withdrawal
      // Do NOT move it back to availableBalance - it should remain locked until successfully withdrawn
      withdrawal.status = 'rejected';
      await withdrawal.save();
      // Return essential fields
      return res.json({ 
        success: true,
        message: `ROI withdrawal rejected. Amount remains in locked balance`,
        withdrawal: {
          _id: withdrawal._id,
          amount: withdrawal.amount,
          status: withdrawal.status,
          type: withdrawal.type
        }
      });
    } else {
      withdrawal.status = status;
      await withdrawal.save();
      // Return only essential fields
      return res.json({ success: true, withdrawal: {
        _id: withdrawal._id,
        amount: withdrawal.amount,
        status: withdrawal.status,
        type: withdrawal.type
      }});
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin can manually adjust investment ROI (add gain/loss)
router.post('/investment-adjust', authAdmin, async (req, res) => {
  try {
    const { investmentId, amount, description } = req.body;
    if (!investmentId || typeof amount !== 'number') {
      return res.status(400).json({ message: 'investmentId and amount are required' });
    }
    const investment = await Investment.findById(investmentId);
    if (!investment) return res.status(404).json({ message: 'Investment not found' });
    investment.currentValue += amount;
    investment.transactions.push({
      type: 'admin-adjust',
      amount,
      date: new Date(),
      description: description || (amount >= 0 ? 'Admin Gain' : 'Admin Loss')
    });
    await investment.save();
    res.json({ message: 'Investment adjusted', investment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: Create a new market update
router.post('/market-updates', authAdmin, async (req, res) => {
  try {
    const { title, summary } = req.body;
    const update = new MarketUpdate({ title, summary });
    await update.save();
    res.status(201).json(update);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create market update', error: err.message });
  }
});

// Admin: Delete a market update
router.delete('/market-updates/:id', authAdmin, async (req, res) => {
  try {
    await MarketUpdate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Market update deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete market update', error: err.message });
  }
});

// List support uploads (admin)
router.get('/support/uploads', authAdmin, async (req, res) => {
  try {
    const uploads = await SupportUpload.find().sort('-createdAt').lean();
    const BASE = process.env.API_URL || (req.protocol + '://' + req.get('host')) || 'https://api.luxyield.com';
    const normalized = uploads.map(u => ({
      ...u,
      url: `${BASE}/api/support/file/${u.filename}`,
      thumbUrl: `${BASE}/api/support/file/${u.filename}_thumb.jpg`
    }));
    res.json(normalized);
  } catch (e) {
    console.error('List uploads error:', e && e.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete upload (admin): removes file(s) and DB record
router.delete('/support/uploads/:id', authAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const record = await SupportUpload.findById(id);
    if (!record) return res.status(404).json({ message: 'Not found' });
    // Delete files (original + thumb)
    const file = path.join(uploadPath, record.filename);
    const thumb = path.join(uploadPath, record.filename + '_thumb.jpg');
    try { await fs.promises.unlink(file); } catch (err) { /* ignore */ }
    try { await fs.promises.unlink(thumb); } catch (err) { /* ignore */ }
    await SupportUpload.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (e) {
    console.error('Delete upload error:', e && e.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reassign upload to another user
router.patch('/support/uploads/:id/reassign', authAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const { userId } = req.body;
    const record = await SupportUpload.findByIdAndUpdate(id, { userId }, { new: true }).lean();
    if (!record) return res.status(404).json({ message: 'Not found' });
    res.json(record);
  } catch (e) {
    console.error('Reassign upload error:', e && e.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get all pending ROI withdrawals
router.get('/roi-withdrawals/pending', authAdmin, async (req, res) => {
  try {
    console.log('[ADMIN] Fetching pending ROI withdrawals');
    const withdrawals = await Withdrawal.find({ 
      type: 'roi', 
      status: 'pending' 
    }).populate('userId', 'name email').lean();
    
    res.json({ 
      success: true, 
      withdrawals,
      count: withdrawals.length 
    });
  } catch (err) {
    console.error('[ADMIN] Error fetching ROI withdrawals:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Reject ROI withdrawal (ROI stays in lockedBalance)
router.post('/roi-withdrawals/:withdrawalId/reject', authAdmin, async (req, res) => {
  try {
    console.log('[ADMIN] Rejecting ROI withdrawal:', req.params.withdrawalId);
    const { reason } = req.body;
    
    const withdrawal = await Withdrawal.findById(req.params.withdrawalId);
    if (!withdrawal) {
      return res.status(404).json({ success: false, error: 'Withdrawal not found' });
    }
    
    if (withdrawal.type !== 'roi') {
      return res.status(400).json({ success: false, error: 'Not an ROI withdrawal' });
    }
    
    // Update withdrawal status to rejected
    withdrawal.status = 'rejected';
    withdrawal.rejectedAt = new Date();
    withdrawal.rejectionReason = reason || 'Rejected by admin';
    await withdrawal.save();
    
    console.log('[ADMIN] ROI withdrawal rejected. Amount stays in user lockedBalance:', withdrawal.amount);
    
    res.json({ 
      success: true, 
      message: 'ROI withdrawal rejected. Amount remains in user\'s locked balance.',
      withdrawal 
    });
  } catch (err) {
    console.error('[ADMIN] Error rejecting ROI withdrawal:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Accept ROI withdrawal with fee (move from lockedBalance to availableBalance)
router.post('/roi-withdrawals/:withdrawalId/accept', authAdmin, async (req, res) => {
  try {
    console.log('[ADMIN] Accepting ROI withdrawal:', req.params.withdrawalId);
    const { feePercent = 0 } = req.body; // Fee as percentage (e.g., 5 for 5%)
    
    const withdrawal = await Withdrawal.findById(req.params.withdrawalId);
    if (!withdrawal) {
      return res.status(404).json({ success: false, error: 'Withdrawal not found' });
    }
    
    if (withdrawal.type !== 'roi') {
      return res.status(400).json({ success: false, error: 'Not an ROI withdrawal' });
    }
    
    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ success: false, error: `Cannot accept withdrawal with status: ${withdrawal.status}` });
    }
    
    // Calculate fee and amount after fee
    const totalAmount = withdrawal.amount;
    const feeAmount = (totalAmount * feePercent) / 100;
    const amountAfterFee = totalAmount - feeAmount;
    
    console.log('[ADMIN] Processing ROI withdrawal: total=$' + totalAmount.toFixed(2) + ', fee=$' + feeAmount.toFixed(2) + ', afterFee=$' + amountAfterFee.toFixed(2));
    
    // Get user and update balances
    const user = await User.findById(withdrawal.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Move from lockedBalance to availableBalance (after fee)
    user.lockedBalance = (user.lockedBalance || 0) - totalAmount; // Remove full amount from locked
    user.availableBalance = (user.availableBalance || 0) + amountAfterFee; // Add net amount to available
    await user.save();
    
    console.log('[ADMIN] User balances updated. lockedBalance reduced by $' + totalAmount.toFixed(2) + ', availableBalance increased by $' + amountAfterFee.toFixed(2));
    
    // Update withdrawal status
    withdrawal.status = 'confirmed';
    withdrawal.approvedAt = new Date();
    withdrawal.feeApplied = feeAmount;
    withdrawal.amountAfterFee = amountAfterFee;
    await withdrawal.save();
    
    // Mark investment as roiWithdrawn
    if (withdrawal.investmentId) {
      await Investment.findByIdAndUpdate(withdrawal.investmentId, { roiWithdrawn: true });
      console.log('[ADMIN] Investment marked as ROI withdrawn');
    }
    
    console.log('[ADMIN] ROI withdrawal accepted and confirmed');
    
    res.json({ 
      success: true, 
      message: `ROI withdrawal accepted! Fee: $${feeAmount.toFixed(2)}, Amount moved to available: $${amountAfterFee.toFixed(2)}`,
      withdrawal,
      userBalances: {
        lockedBalance: user.lockedBalance,
        availableBalance: user.availableBalance
      }
    });
  } catch (err) {
    console.error('[ADMIN] Error accepting ROI withdrawal:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Release funds from lockedBalance to availableBalance
router.post('/users/:userId/release-locked-funds', authAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, reason } = req.body;
    
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid amount' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    if ((user.lockedBalance || 0) < amount) {
      return res.status(400).json({ 
        success: false, 
        error: `Insufficient locked balance. Available: $${(user.lockedBalance || 0).toFixed(2)}, Requested: $${amount.toFixed(2)}` 
      });
    }
    
    // Move from locked to available
    user.lockedBalance = (user.lockedBalance || 0) - amount;
    user.availableBalance = (user.availableBalance || 0) + amount;
    await user.save();
    
    console.log(`[ADMIN] Released $${amount.toFixed(2)} from lockedBalance to availableBalance for user ${userId}. Reason: ${reason || 'Not specified'}`);
    
    res.json({
      success: true,
      message: `Released $${amount.toFixed(2)} from locked to available balance`,
      userBalances: {
        availableBalance: user.availableBalance,
        lockedBalance: user.lockedBalance
      }
    });
  } catch (err) {
    console.error('[ADMIN] Error releasing locked funds:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
