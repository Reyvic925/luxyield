// src/components/admin/WithdrawalDetail.js
import React, { useState } from 'react';
import { X, Clock, Copy, DollarSign, User, Calendar, Wallet, CheckCircle, XCircle, AlertTriangle, FileText, ArrowRight } from 'lucide-react';

const statusColors = {
  Pending: 'bg-yellow-900 bg-opacity-30 text-yellow-400',
  Approved: 'bg-green-900 bg-opacity-30 text-green-400',
  Rejected: 'bg-red-900 bg-opacity-30 text-red-400',
};

const WithdrawalDetail = ({ withdrawal, onApprove, onReject, onClose }) => {
  const [notes, setNotes] = useState('');
  const [destination, setDestination] = useState('available');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    setIsProcessing(true);
    await onApprove(notes, destination);
    setIsProcessing(false);
  };

  const handleReject = async () => {
    setIsProcessing(true);
    await onReject(notes);
    setIsProcessing(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-backdrop">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto modal-content">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Withdrawal Review</h2>
                <p className="text-gray-400">Review and process withdrawal request</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-red-400/50 transition-all duration-200 group"
            >
              <X className="h-6 w-6 group-hover:text-red-400" />
            </button>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Transaction Details Card */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <User className="h-5 w-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Transaction Details</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-gray-400 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Withdrawal ID
                  </span>
                  <span className="font-mono text-white text-sm">{withdrawal.id}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-gray-400 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    User ID
                  </span>
                  <span className="text-white">{withdrawal.userId}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-gray-400 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    User Email
                  </span>
                  <span className="text-white">{withdrawal.userEmail}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Request Date
                  </span>
                  <span className="text-white">{new Date(withdrawal.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Withdrawal Information Card */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Wallet className="h-5 w-5 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Withdrawal Information</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-gray-400 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Amount
                  </span>
                  <span className="font-mono text-white text-lg font-semibold">
                    {withdrawal.amount} {withdrawal.currency}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Network
                  </span>
                  <span className="text-white">{withdrawal.network}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Wallet Address
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-white text-sm truncate max-w-xs">
                      {withdrawal.walletAddress}
                    </span>
                    <button
                      onClick={() => copyToClipboard(withdrawal.walletAddress)}
                      className="p-1 rounded bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-400 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Status
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[withdrawal.status]}`}>
                    {withdrawal.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Admin Notes */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <FileText className="h-5 w-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Admin Notes</h3>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this withdrawal..."
                className="w-full p-4 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 resize-none"
                rows={4}
              />
            </div>

            {/* Destination Selection */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <ArrowRight className="h-5 w-5 text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Destination</h3>
              </div>
              <select
                value={destination}
                onChange={e => setDestination(e.target.value)}
                className="w-full p-4 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
              >
                <option value="available" className="bg-gray-800">Available Balance</option>
                <option value="locked" className="bg-gray-800">Locked Balance</option>
              </select>
            </div>
          </div>

          {/* Pending Time Alert */}
          <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-white font-medium">Pending Duration</p>
                <p className="text-gray-400 text-sm">
                  This withdrawal has been pending for {Math.floor((new Date() - new Date(withdrawal.createdAt)) / (1000 * 60 * 60))} hours
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <button
              onClick={handleReject}
              disabled={isProcessing}
              className={`px-8 py-3 bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30 text-red-400 rounded-xl hover:from-red-500/30 hover:to-red-600/30 hover:border-red-400/50 transition-all duration-200 flex items-center gap-2 font-medium ${
                isProcessing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <XCircle className="h-5 w-5" />
              Reject Withdrawal
            </button>
            <button
              onClick={handleApprove}
              disabled={isProcessing}
              className={`px-8 py-3 bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/30 text-green-400 rounded-xl hover:from-green-500/30 hover:to-green-600/30 hover:border-green-400/50 transition-all duration-200 flex items-center gap-2 font-medium ${
                isProcessing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <CheckCircle className="h-5 w-5" />
              Approve Withdrawal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalDetail;