const Deposit = require('../models/Deposit');
const Investment = require('../models/Investment');
const Withdrawal = require('../models/Withdrawal');
const BalanceHistory = require('../models/BalanceHistory');

// Helper function to calculate available balance
async function calculateAvailableBalance(userId) {
  // Get deposits
  const confirmedDeposits = await Deposit.find({ user: userId, status: 'confirmed' });
  const depositBalance = confirmedDeposits.reduce((sum, d) => sum + d.amount, 0);

  // Get investments
  const allInvestments = await Investment.find({ user: userId });
  const totalInvested = allInvestments.reduce((sum, inv) => sum + inv.amount, 0);

  // Get ROI withdrawals
  const confirmedRoiWithdrawals = await Withdrawal.find({
    userId: userId,
    status: 'confirmed',
    type: 'roi'
  });
  const totalConfirmedRoi = confirmedRoiWithdrawals.reduce((sum, w) => sum + w.amount, 0);

  // Get admin adjustments
  const adminAdjustments = await BalanceHistory.find({
    userId,
    type: { $in: ['admin_add', 'admin_subtract'] }
  });

  // Calculate net admin adjustments
  const netAdminAdjustments = adminAdjustments.reduce((sum, adjustment) => {
    return sum + (adjustment.type === 'admin_add' ? adjustment.amount : -adjustment.amount);
  }, 0);

  // Calculate final available balance
  const calculatedAvailableBalance = depositBalance - totalInvested + totalConfirmedRoi + netAdminAdjustments;

  return {
    depositBalance,
    totalInvested,
    totalConfirmedRoi,
    netAdminAdjustments,
    calculatedAvailableBalance
  };
}

module.exports = {
  calculateAvailableBalance
};