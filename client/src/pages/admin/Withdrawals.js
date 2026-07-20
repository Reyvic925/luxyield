// src/pages/admin/Withdrawals.js
import React, { useState, useEffect } from 'react';
import WithdrawalList from '../../components/admin/WithdrawalList';
import WithdrawalDetail from '../../components/admin/WithdrawalDetail';
import { getWithdrawals, updateWithdrawal } from '../../services/withdrawalAPI';
import { FiChevronDown, FiChevronUp, FiCheckCircle, FiX } from 'react-icons/fi';

const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [filters, setFilters] = useState({
    status: 'pending',
    currency: 'all',
    dateRange: '7days'
  });

  useEffect(() => {
    const fetchWithdrawals = async () => {
      try {
        const data = await getWithdrawals(filters);
        setWithdrawals(data.map(w => ({ ...w, id: w.id || w._id })));
      } catch (error) {
        console.error('Failed to fetch withdrawals:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWithdrawals();
  }, [filters]);

  const getStageActions = (withdrawal) => {
    if (!withdrawal) return {};
    const status = withdrawal.status;

    if (['awaiting_activation_fee', 'activation_fee_paid', 'activation_fee_rejected'].includes(status)) {
      return {
        approveStatus: 'activation_fee_approved',
        rejectStatus: 'activation_fee_rejected',
        approveLabel: 'Approve Activation Fee',
        rejectLabel: 'Reject Activation Fee',
        showDestination: false,
        showTransactionHash: false
      };
    }

    if (['awaiting_interest_tax', 'interest_tax_paid', 'interest_tax_rejected'].includes(status)) {
      return {
        approveStatus: 'interest_tax_approved',
        rejectStatus: 'interest_tax_rejected',
        approveLabel: 'Approve Interest Tax',
        rejectLabel: 'Reject Interest Tax',
        showDestination: false,
        showTransactionHash: false
      };
    }

    if (['awaiting_network_fee', 'network_fee_paid', 'network_fee_rejected'].includes(status)) {
      return {
        approveStatus: 'network_fee_approved',
        rejectStatus: 'network_fee_rejected',
        approveLabel: 'Approve Network Fee',
        rejectLabel: 'Reject Network Fee',
        showDestination: false,
        showTransactionHash: true
      };
    }

    if (status === 'pending') {
      return {
        approveStatus: 'completed',
        rejectStatus: 'rejected',
        approveLabel: 'Approve Withdrawal',
        rejectLabel: 'Reject Withdrawal',
        showDestination: true,
        showTransactionHash: false
      };
    }

    return {};
  };

  const handleUpdateWithdrawal = async (id, status, notes, destination = 'available', transactionHash) => {
    try {
      const updates = { status, adminNotes: notes };
      if (destination) updates.destination = destination;
      if (transactionHash) updates.transactionHash = transactionHash;
      const updated = await updateWithdrawal(id, updates);
      setWithdrawals(withdrawals.map(w => (w.id === updated.id ? { ...w, ...updated } : w)));
      setSelectedWithdrawal(null);
      setExpandedId(null);
    } catch (error) {
      console.error('Failed to update withdrawal:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8 min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div>
        <span className="ml-3 text-gray-300">Loading withdrawals...</span>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-900 overflow-auto">
      <div className="p-3 sm:p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Withdrawal Management</h1>
          <div className="text-sm text-gray-400">
            Pending: {withdrawals.filter(w => ['pending', 'awaiting_activation_fee', 'activation_fee_paid', 'activation_fee_rejected', 'awaiting_interest_tax', 'interest_tax_paid', 'interest_tax_rejected', 'withdrawal_processing', 'awaiting_network_fee', 'network_fee_paid', 'network_fee_rejected'].includes(w.status)).length}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 sm:pb-0">
          {['pending', 'completed', 'rejected'].map(status => (
            <button
              key={status}
              onClick={() => setFilters({ ...filters, status })}
              className={`px-3 sm:px-4 py-2 rounded-lg font-semibold whitespace-nowrap text-sm sm:text-base transition ${
                filters.status === status
                  ? 'bg-gold text-black'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block">
          <WithdrawalList 
            withdrawals={withdrawals}
            filters={filters}
            onFilterChange={setFilters}
            onSelect={setSelectedWithdrawal}
            onBulkUpdate={(ids, status) => ids.forEach(id => handleUpdateWithdrawal(id, status, 'Bulk action'))}
          />
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {withdrawals.map((withdrawal) => (
            <div key={withdrawal._id} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              {/* Card Header */}
              <button
                onClick={() => setExpandedId(expandedId === withdrawal._id ? null : withdrawal._id)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-750 transition"
              >
                <div className="flex-1 text-left">
                  <p className="font-semibold text-white text-sm">Withdrawal</p>
                  <p className="text-gold font-bold text-base mt-1">
                    ${withdrawal.amount?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                    ['completed', 'activation_fee_approved', 'withdrawal_successful'].includes(withdrawal.status) ? 'bg-green-900 text-green-200' :
                    ['pending', 'awaiting_activation_fee', 'activation_fee_paid', 'awaiting_interest_tax', 'interest_tax_paid', 'withdrawal_processing', 'awaiting_network_fee', 'network_fee_paid'].includes(withdrawal.status) ? 'bg-yellow-900 text-yellow-200' :
                    'bg-red-900 text-red-200'
                  }`}>
                    {withdrawal.status}
                  </span>
                  {expandedId === withdrawal._id ? <FiChevronUp /> : <FiChevronDown />}
                </div>
              </button>

              {/* Card Expanded Content */}
              {expandedId === withdrawal._id && (
                <div className="bg-gray-850 px-4 py-3 border-t border-gray-700 space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type:</span>
                      <span className="text-gray-200">{withdrawal.type || 'withdrawal'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Network:</span>
                      <span className="text-gray-200">{withdrawal.network || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Currency:</span>
                      <span className="text-gray-200">{withdrawal.currency || 'USD'}</span>
                    </div>
                    {withdrawal.walletAddress && (
                      <div className="break-all">
                        <span className="text-gray-400">Address:</span>
                        <p className="text-gray-200 text-xs mt-1 bg-gray-900 p-2 rounded font-mono break-all">
                          {withdrawal.walletAddress}
                        </p>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400">Date:</span>
                      <span className="text-gray-200 text-xs">{new Date(withdrawal.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  {(() => {
                    const { approveStatus, rejectStatus, approveLabel, rejectLabel } = getStageActions(withdrawal);
                    if (!approveLabel || !rejectLabel) return null;
                    return (
                      <div className="flex gap-2 pt-2">
                        <button
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded font-semibold text-sm transition flex items-center justify-center gap-2"
                          onClick={() => handleUpdateWithdrawal(withdrawal._id, approveStatus, 'Approved')}
                        >
                          <FiCheckCircle size={16} /> {approveLabel}
                        </button>
                        <button
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded font-semibold text-sm transition flex items-center justify-center gap-2"
                          onClick={() => handleUpdateWithdrawal(withdrawal._id, rejectStatus, 'Rejected')}
                        >
                          <FiX size={16} /> {rejectLabel}
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* No Results */}
        {withdrawals.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No {filters.status} withdrawals found
          </div>
        )}
      </div>

      {/* Detail Modal - Desktop Only */}
      {selectedWithdrawal && (
        <WithdrawalDetail 
          withdrawal={selectedWithdrawal}
          onApprove={(notes, destination, transactionHash) => {
            const { approveStatus } = getStageActions(selectedWithdrawal);
            return handleUpdateWithdrawal(selectedWithdrawal.id, approveStatus || 'completed', notes, destination, transactionHash);
          }}
          onReject={(notes) => {
            const { rejectStatus } = getStageActions(selectedWithdrawal);
            return handleUpdateWithdrawal(selectedWithdrawal.id, rejectStatus || 'rejected', notes);
          }}
          onClose={() => setSelectedWithdrawal(null)}
        />
      )}
    </div>
  );
};

export default AdminWithdrawals;


