const mongoose = require('mongoose');

const BalanceHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'admin_add', 'admin_subtract', 'investment', 'roi'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  previousBalance: {
    type: Number,
    required: true
  },
  newBalance: {
    type: Number,
    required: true
  },
  description: String,
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('BalanceHistory', BalanceHistorySchema);