// src/components/WithdrawalHistory.js
import React from 'react';
import { FiCheck, FiClock, FiX, FiDollarSign, FiArrowRight, FiAlertTriangle } from 'react-icons/fi';

const statusInfo = {
  pending: { label: 'Pending', color: 'text-yellow-500', icon: <FiClock /> },
  awaiting_activation_fee: { label: 'Awaiting Activation Fee', color: 'text-yellow-500', icon: <FiClock /> },
  activation_fee_paid: { label: 'Activation Fee Paid', color: 'text-yellow-500', icon: <FiClock /> },
  activation_fee_rejected: { label: 'Activation Fee Rejected', color: 'text-red-500', icon: <FiX /> },
  activation_fee_approved: { label: 'Activation Fee Approved', color: 'text-green-500', icon: <FiCheck /> },
  awaiting_interest_tax: { label: 'Awaiting Interest Tax', color: 'text-yellow-500', icon: <FiClock /> },
  interest_tax_paid: { label: 'Interest Tax Paid', color: 'text-yellow-500', icon: <FiClock /> },
  interest_tax_rejected: { label: 'Interest Tax Rejected', color: 'text-red-500', icon: <FiX /> },
  withdrawal_processing: { label: 'Processing', color: 'text-yellow-500', icon: <FiClock /> },
  awaiting_network_fee: { label: 'Awaiting Network Fee', color: 'text-yellow-500', icon: <FiClock /> },
  network_fee_paid: { label: 'Network Fee Paid', color: 'text-yellow-500', icon: <FiClock /> },
  withdrawal_successful: { label: 'Successful', color: 'text-green-500', icon: <FiCheck /> },
  completed: { label: 'Completed', color: 'text-green-500', icon: <FiCheck /> },
  rejected: { label: 'Rejected', color: 'text-red-500', icon: <FiX /> },
  failed: { label: 'Failed', color: 'text-red-500', icon: <FiAlertTriangle /> },
};

const WithdrawalHistory = ({ withdrawals }) => {
  const list = Array.isArray(withdrawals) ? withdrawals : [];

  return (
    <div className="glassmorphic p-6 rounded-xl">
      <h3 className="text-xl font-bold mb-4">Recent Withdrawals</h3>
      {list.length === 0 ? (
        <p className="text-gray-400">No withdrawal history</p>
      ) : (
        <div className="space-y-4">
          {list.map((withdrawal) => {
            const statusKey = withdrawal.status || 'pending';
            const status = statusInfo[statusKey] || { label: statusKey, color: 'text-yellow-500', icon: <FiClock /> };
            return (
              <div key={withdrawal.id || withdrawal._id || Math.random()} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-gray-800 rounded-xl bg-gray-900">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <FiDollarSign className="text-gold" size={18} />
                    <p className="font-semibold text-white">${Math.abs(withdrawal.amount || 0).toFixed(2)}</p>
                  </div>
                  <p className={`text-sm ${withdrawal.type === 'roi' ? 'text-purple-400 font-semibold' : 'text-gray-400'}`}>
                    {withdrawal.type === 'roi' ? 'ROI Withdrawal' : `Withdrawal to ${withdrawal.walletAddress || 'your wallet'}`}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {withdrawal.network || withdrawal.currency || 'N/A'} • {withdrawal.createdAt ? new Date(withdrawal.createdAt).toLocaleDateString() : ''}
                  </p>
                </div>
                <div className="mt-4 sm:mt-0 flex items-center gap-2">
                  <span className={`${status.color} text-lg`}>
                    {status.icon}
                  </span>
                  <span className={`text-sm font-semibold ${status.color}`}>{status.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WithdrawalHistory;
