// src/components/admin/WithdrawalDetail.js
import React, { useState, useEffect } from 'react';
import { FiX, FiClock, FiCopy } from 'react-icons/fi';
import API from '../../services/api';
import { getWithdrawalById } from '../../services/withdrawalAPI';

const statusColors = {
  pending: 'bg-yellow-900 bg-opacity-30 text-yellow-400',
  awaiting_activation_fee: 'bg-yellow-900 bg-opacity-30 text-yellow-400',
  activation_fee_paid: 'bg-yellow-900 bg-opacity-30 text-yellow-400',
  activation_fee_rejected: 'bg-red-900 bg-opacity-30 text-red-400',
  activation_fee_approved: 'bg-green-900 bg-opacity-30 text-green-400',
  awaiting_interest_tax: 'bg-yellow-900 bg-opacity-30 text-yellow-400',
  interest_tax_paid: 'bg-yellow-900 bg-opacity-30 text-yellow-400',
  interest_tax_rejected: 'bg-red-900 bg-opacity-30 text-red-400',
  withdrawal_processing: 'bg-blue-900 bg-opacity-30 text-blue-300',
  awaiting_network_fee: 'bg-yellow-900 bg-opacity-30 text-yellow-400',
  network_fee_paid: 'bg-yellow-900 bg-opacity-30 text-yellow-400',
  network_fee_rejected: 'bg-red-900 bg-opacity-30 text-red-400',
  withdrawal_successful: 'bg-green-900 bg-opacity-30 text-green-400',
  completed: 'bg-green-900 bg-opacity-30 text-green-400',
  rejected: 'bg-red-900 bg-opacity-30 text-red-400',
  failed: 'bg-red-900 bg-opacity-30 text-red-400',
};

const WithdrawalDetail = ({ withdrawal, onApprove, onReject, onClose }) => {
  const [notes, setNotes] = useState('');
  const [destination, setDestination] = useState('available');
  const [transactionHash, setTransactionHash] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [localWithdrawal, setLocalWithdrawal] = useState(withdrawal);

  // Modals and audit state
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [modalAmount, setModalAmount] = useState('');
  const [isSubmittingModal, setIsSubmittingModal] = useState(false);

  const [auditHistory, setAuditHistory] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  useEffect(() => {
    setLocalWithdrawal(withdrawal);
  }, [withdrawal]);

  useEffect(() => {
    // fetch audit history whenever the displayed withdrawal changes
    const fetchAudit = async () => {
      if (!localWithdrawal || !(localWithdrawal._id || localWithdrawal.id)) return;
      setLoadingAudit(true);
      try {
        const id = localWithdrawal._id || localWithdrawal.id;
        const res = await API.get(`/admin/withdrawals/${id}/audit`);
        setAuditHistory(res.data || res);
      } catch (err) {
        console.error('Failed to load audit history', err);
        setAuditHistory([]);
      }
      setLoadingAudit(false);
    };
    fetchAudit();
  }, [localWithdrawal]);

  const getActionContext = (status) => {
    if (['awaiting_activation_fee', 'activation_fee_paid', 'activation_fee_rejected'].includes(status)) {
      return {
        approveLabel: 'Approve Activation Fee',
        rejectLabel: 'Reject Activation Fee',
        showDestination: false,
        showTransactionHash: false
      };
    }

    if (['awaiting_interest_tax', 'interest_tax_paid', 'interest_tax_rejected'].includes(status)) {
      return {
        approveLabel: 'Approve Interest Tax',
        rejectLabel: 'Reject Interest Tax',
        showDestination: false,
        showTransactionHash: false
      };
    }

    if (['awaiting_network_fee', 'network_fee_paid', 'network_fee_rejected'].includes(status)) {
      return {
        approveLabel: 'Approve Network Fee',
        rejectLabel: 'Reject Network Fee',
        showDestination: false,
        showTransactionHash: true
      };
    }

    if (status === 'pending') {
      return {
        approveLabel: 'Approve Withdrawal',
        rejectLabel: 'Reject Withdrawal',
        showDestination: true,
        showTransactionHash: false
      };
    }

    return {
      approveLabel: null,
      rejectLabel: null,
      showDestination: false,
      showTransactionHash: false
    };
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    await onApprove(notes, destination, transactionHash);
    setIsProcessing(false);
  };

  const handleReject = async () => {
    setIsProcessing(true);
    await onReject(notes);
    setIsProcessing(false);
  };

  // Modal submit handler for mark-as-paid actions
  const submitModal = async () => {
    if (!modalAmount || Number(modalAmount) <= 0) return alert('Enter a valid amount');
    setIsSubmittingModal(true);
    const id = localWithdrawal._id || localWithdrawal.id;
    try {
      if (showActivationModal) {
        await API.post(`/admin/withdrawals/${id}/mark-activation-paid`, { amount: Number(modalAmount) });
      } else if (showInterestModal) {
        await API.post(`/admin/withdrawals/${id}/mark-interest-paid`, { amount: Number(modalAmount) });
      } else if (showNetworkModal) {
        await API.post(`/admin/withdrawals/${id}/mark-network-paid`, { amount: Number(modalAmount) });
      }

      // Refresh withdrawal and audit history
      try {
        const wres = await API.get(`/admin/withdrawals/${id}`);
        const wdata = wres.data || wres;
        setLocalWithdrawal(wdata);
      } catch (e) {
        console.error('Failed to refresh withdrawal after mark-paid', e);
      }
      try {
        const ares = await API.get(`/admin/withdrawals/${id}/audit`);
        setAuditHistory(ares.data || ares);
      } catch (e) {
        console.error('Failed to refresh audit after mark-paid', e);
      }

      // close modal
      setShowActivationModal(false);
      setShowInterestModal(false);
      setShowNetworkModal(false);
      setModalAmount('');
    } catch (err) {
      console.error('Mark paid failed', err.response || err.message);
      alert('Failed to mark paid: ' + (err.response?.data?.message || err.message));
    }
    setIsSubmittingModal(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-full sm:max-w-2xl mx-4 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gold scrollbar-track-gray-900/60">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold">Withdrawal Review</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-700"
            >
              <FiX size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-lg font-bold mb-3">Transaction Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Withdrawal ID</span>
                  <span className="font-mono">{withdrawal._id || withdrawal.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">User ID</span>
                  <span>{withdrawal.userId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">User Email</span>
                  <span>{withdrawal.userEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Request Date</span>
                  <span>{new Date(withdrawal.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-3">Withdrawal Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount</span>
                  <span className="font-mono">
                    {localWithdrawal?.amount} {localWithdrawal?.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Network</span>
                  <span>{localWithdrawal?.network}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Wallet Address</span>
                  <div className="flex items-center">
                    <span className="font-mono text-sm truncate max-w-xs">
                      {localWithdrawal?.walletAddress}
                    </span>
                    <button
                      onClick={() => copyToClipboard(localWithdrawal?.walletAddress)}
                      className="ml-2 text-gray-400 hover:text-gold"
                    >
                      <FiCopy />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${statusColors[localWithdrawal?.status]}`}>
                    {localWithdrawal?.status}
                  </span>
                </div>

                {/* Fees summary and admin mark-as-paid controls */}
                <div className="mt-3 border-t border-gray-700 pt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-gray-400 text-sm">Activation Fee</div>
                      <div className="text-white text-sm">${(localWithdrawal?.activationFeeAmount || 0).toFixed(2)} paid: ${(localWithdrawal?.activationFeePaid || 0).toFixed(2)}</div>
                    </div>
                    <div>
                      <button
                        onClick={() => { setModalAmount(''); setShowActivationModal(true); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Mark Activation Paid
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-gray-400 text-sm">Interest Tax</div>
                      <div className="text-white text-sm">${(localWithdrawal?.interestTaxAmount || 0).toFixed(2)} paid: ${(localWithdrawal?.interestTaxPaid || 0).toFixed(2)}</div>
                    </div>
                    <div>
                      <button
                        onClick={() => { setModalAmount(''); setShowInterestModal(true); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Mark Interest Paid
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-gray-400 text-sm">Network Fee</div>
                      <div className="text-white text-sm">${(localWithdrawal?.networkFeeAmount || 0).toFixed(2)} paid: ${(localWithdrawal?.networkFeePaid || 0).toFixed(2)}</div>
                    </div>
                    <div>
                      <button
                        onClick={() => { setModalAmount(''); setShowNetworkModal(true); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Mark Network Fee Paid
                      </button>
                    </div>
                  </div>

                  {/* Audit history quick view */}
                  <div className="mt-4">
                    <div className="text-gray-400 text-sm">Audit History</div>
                    {loadingAudit ? (
                      <div className="text-gray-400 text-sm">Loading...</div>
                    ) : (
                      <div className="mt-2 max-h-40 overflow-y-auto text-sm space-y-2">
                        {auditHistory.length === 0 && <div className="text-gray-500">No audit records</div>}
                        {auditHistory.map(a => (
                          <div key={a.id} className="p-2 bg-gray-900 rounded border border-gray-700">
                            <div className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleString()} — Admin: {a.admin || 'system'}</div>
                            <div className="text-white">{a.action}</div>
                            {a.metadata && <div className="text-gray-300 text-xs">{JSON.stringify(a.metadata)}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-bold mb-3">Admin Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this withdrawal..."
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
              rows={3}
            />
          </div>

          {(() => {
            const { approveLabel, rejectLabel, showDestination, showTransactionHash } = getActionContext(withdrawal.status);
            return (
              <>
                {showDestination && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold mb-3">Destination</h3>
                    <select
                      value={destination}
                      onChange={e => setDestination(e.target.value)}
                      className="w-full p-2 rounded bg-gray-700 text-white mb-2"
                    >
                      <option value="available">Available Balance</option>
                      <option value="locked">Locked Balance</option>
                    </select>
                  </div>
                )}

                {showTransactionHash && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold mb-3">Transaction Hash</h3>
                    <input
                      value={transactionHash}
                      onChange={(e) => setTransactionHash(e.target.value)}
                      placeholder="Enter transaction hash"
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                    />
                  </div>
                )}

                <div className="bg-gray-700 bg-opacity-50 p-4 rounded-lg mb-6">
                  <div className="flex items-center">
                    <FiClock className="mr-2 text-yellow-400" />
                    <span>This withdrawal has been pending for {Math.floor((new Date() - new Date(withdrawal.createdAt)) / (1000 * 60 * 60))} hours</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:space-x-4 justify-end">
                  <button
                    onClick={handleReject}
                    disabled={isProcessing || !rejectLabel}
                    className={`w-full sm:w-auto px-6 py-2 bg-red-500 bg-opacity-20 text-red-400 rounded-lg hover:bg-opacity-30 transition ${
                      isProcessing || !rejectLabel ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {rejectLabel || 'Reject'}
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={isProcessing || !approveLabel}
                    className={`w-full sm:w-auto px-6 py-2 bg-green-500 bg-opacity-20 text-green-400 rounded-lg hover:bg-opacity-30 transition ${
                      isProcessing || !approveLabel ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {approveLabel || 'Approve'}
                  </button>
                </div>
              </>
            );
          })()}
        </div>

        {/* Mark-as-paid modal */}
        {(showActivationModal || showInterestModal || showNetworkModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-60">
            <div className="bg-gray-800 rounded-lg w-full max-w-md p-6">
              <h3 className="text-lg font-bold mb-3">
                {showActivationModal && 'Mark Activation Fee Paid'}
                {showInterestModal && 'Mark Interest Tax Paid'}
                {showNetworkModal && 'Mark Network Fee Paid'}
              </h3>
              <p className="text-sm text-gray-400 mb-3">Enter the amount you want to record as paid for this fee.</p>
              <input
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white mb-4"
                value={modalAmount}
                onChange={e => setModalAmount(e.target.value)}
                placeholder="Amount"
                type="number"
                step="0.01"
                min="0"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => { setShowActivationModal(false); setShowInterestModal(false); setShowNetworkModal(false); setModalAmount(''); }}
                  className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={submitModal}
                  disabled={isSubmittingModal}
                  className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${isSubmittingModal ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmittingModal ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default WithdrawalDetail;

