const router = require('express').Router();
const authAdmin = require('../../middleware/authAdmin');
const User = require('../../models/User');
const Investment = require('../../models/Investment');
const AuditLog = require('../../models/AuditLog');

// Admin: Adjust user balance
router.post('/users/:id/balance', authAdmin, async (req, res) => {
  try {
    const { amount, operation, reason } = req.body;
    const userId = req.params.id;

    console.log(`[BALANCE ADJUST] adminId=${req.user?.id} userId=${userId} amount=${amount} operation=${operation}`);

    if (!amount || !operation) {
      return res.status(400).json({ message: 'Missing required fields: amount and operation are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const previousBalance = user.availableBalance || 0;
    if (operation === 'add') {
      user.availableBalance = (user.availableBalance || 0) + amount;
    } else if (operation === 'subtract') {
      if ((user.availableBalance || 0) < amount) {
        return res.status(400).json({ message: 'Insufficient available balance' });
      }
      user.availableBalance = (user.availableBalance || 0) - amount;
    } else {
      return res.status(400).json({ message: 'Invalid operation' });
    }

    // Create audit log
    await new AuditLog({
      userId: user._id,
      adminId: req.user.id,
      action: 'balance_adjustment',
      details: {
        operation,
        amount,
        reason,
        previousBalance,
        newBalance: user.balance
      }
    }).save();

    await user.save();
    
    // Force refresh the user object to ensure all fields are up to date
    const updatedUser = await User.findById(user._id);
    
    res.json({
      message: 'Balance updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        balance: updatedUser.availableBalance,
        availableBalance: updatedUser.availableBalance,
        lockedBalance: updatedUser.lockedBalance,
        depositBalance: updatedUser.depositBalance
      }
    });
  } catch (err) {
    console.error('Balance adjustment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Adjust investment gains/losses
router.post('/users/:id/investment-adjustment', authAdmin, async (req, res) => {
  try {
    const { amount, percentage, operation, reason } = req.body;
    const userId = req.params.id;

    if ((!amount && !percentage) || !operation || !reason) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const investments = await Investment.find({ user: userId, status: 'active' });
    if (!investments.length) {
      return res.status(404).json({ message: 'No active investments found' });
    }

    const adjustments = [];
    for (const investment of investments) {
      const previousValue = investment.currentValue;
      
      // Calculate adjustment amount
      let adjustmentAmount = amount;
      if (percentage) {
        adjustmentAmount = (investment.currentValue * percentage) / 100;
      }

      if (operation === 'gain') {
        investment.currentValue += adjustmentAmount;
      } else if (operation === 'loss') {
        if (investment.currentValue < adjustmentAmount) {
          investment.currentValue = 0; // Prevent negative value
        } else {
          investment.currentValue -= adjustmentAmount;
        }
      }

      // Update ROI
      investment.roi = ((investment.currentValue - investment.amount) / investment.amount) * 100;

      // Add to transaction history
      investment.transactions = investment.transactions || [];
      investment.transactions.push({
        type: operation,
        amount: adjustmentAmount,
        date: new Date(),
        description: reason
      });

      await investment.save();

      // Create audit log
      await new AuditLog({
        userId: userId,
        adminId: req.user.id,
        action: 'investment_adjustment',
        details: {
          investmentId: investment._id,
          operation,
          amount: adjustmentAmount,
          percentage,
          reason,
          previousValue,
          newValue: investment.currentValue
        }
      }).save();

      adjustments.push({
        investmentId: investment._id,
        previousValue,
        newValue: investment.currentValue,
        adjustmentAmount
      });
    }

    res.json({
      message: 'Investment values updated successfully',
      adjustments
    });
  } catch (err) {
    console.error('Investment adjustment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;