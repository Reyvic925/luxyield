// server/models/Withdrawal.js
const mongoose = require('mongoose');

const WithdrawalSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['regular', 'roi'],
    default: 'regular',
    required: true
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  investmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Investment' },
  amount: { type: Number, required: true, min: 0 },
  reservedAmount: { type: Number, default: 0, min: 0 },
  activationFeeAmount: { type: Number, default: 0, min: 0 },
  activationFeePaid: { type: Number, default: 0, min: 0 },
  activationFeePaidAt: { type: Date },
  activationFeeRefunded: { type: Boolean, default: false },
  activationFeeRefundedAt: { type: Date },
  interestTaxAmount: { type: Number, default: 0, min: 0 },
  interestTaxPaid: { type: Number, default: 0, min: 0 },
  interestTaxPaidAt: { type: Date },
  networkFeeAmount: { type: Number, default: 0, min: 0 },
  networkFeePaid: { type: Number, default: 0, min: 0 },
  networkFeePaidAt: { type: Date },
  processingStartedAt: { type: Date },
  walletAddress: { type: String, default: '' },
  currency: { type: String, required: true, enum: ['USDT', 'BTC', 'ETH', 'BNB'] },
  network: { type: String, required: true, enum: ['ERC20', 'TRC20', 'BEP20', 'BTC', 'ETH'] },
  status: { 
    type: String, 
    required: true, 
    enum: [
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
      'network_fee_paid',
      'network_fee_rejected',
      'withdrawal_successful',
      'completed',
      'rejected',
      'failed'
    ],
    default: 'pending'
  },
  adminNotes: { type: String },
  processedAt: { type: Date },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  transactionHash: { type: String },
  destination: {
    type: String,
    enum: ['available', 'locked'],
    default: 'available',
    required: true
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
WithdrawalSchema.index({ status: 1 });
WithdrawalSchema.index({ userId: 1 });
WithdrawalSchema.index({ createdAt: -1 });
WithdrawalSchema.index({ status: 1, createdAt: -1 }); // For filtering
WithdrawalSchema.index({ userId: 1, status: 1 }); // For user-specific queries
WithdrawalSchema.index({ currency: 1, amount: 1 }); // For amount range queries
WithdrawalSchema.index({ processedBy: 1, processedAt: -1 }); // For admin audit

// Virtual for formatted data
WithdrawalSchema.virtual('formattedAmount').get(function() {
  return `${this.amount.toFixed(8)} ${this.currency}`;
});

module.exports = mongoose.model('Withdrawal', WithdrawalSchema);