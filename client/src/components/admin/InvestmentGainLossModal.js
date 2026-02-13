import React, { useState } from 'react';
import { FiTrendingUp, FiTrendingDown, FiPercent } from 'react-icons/fi';

const InvestmentGainLossModal = ({ user, onClose, onUpdate }) => {
  const [amount, setAmount] = useState('');
  const [percentage, setPercentage] = useState('');
  const [type, setType] = useState('gain'); // 'gain' or 'loss'
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount && !percentage || !reason) {
      setError('Please fill in required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const axios = require('../../utils/axios').default;
      const response = await axios.post(`/api/admin/users/${user.id}/investment-adjustment`, {
        amount: parseFloat(amount || 0),
        percentage: parseFloat(percentage || 0),
        operation: type,
        reason,
      });

      const data = response.data;
      onUpdate(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Manage Investment {type === 'gain' ? 'Gains' : 'Losses'}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          ✕
        </button>
      </div>

      <div className="mb-4">
        <p className="text-gray-400">Current Investment Value: <span className="text-white font-mono">${user.investmentValue?.toLocaleString() || '0'}</span></p>
        <p className="text-gray-400">User: <span className="text-white">{user.name}</span></p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Operation Type</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={`flex items-center justify-center px-4 py-2 rounded-lg ${
                type === 'gain'
                  ? 'bg-green-500 bg-opacity-20 text-green-400 border border-green-500'
                  : 'bg-gray-700 text-gray-400'
              }`}
              onClick={() => setType('gain')}
            >
              <FiTrendingUp className="mr-2" /> Gain
            </button>
            <button
              type="button"
              className={`flex items-center justify-center px-4 py-2 rounded-lg ${
                type === 'loss'
                  ? 'bg-red-500 bg-opacity-20 text-red-400 border border-red-500'
                  : 'bg-gray-700 text-gray-400'
              }`}
              onClick={() => setType('loss')}
            >
              <FiTrendingDown className="mr-2" /> Loss
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Amount ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                placeholder="Amount"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Percentage (%)</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                className="w-full pl-4 pr-8 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                placeholder="Percentage"
              />
              <FiPercent className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Reason/Notes</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            placeholder="Enter reason for adjustment"
            rows="3"
          />
        </div>

        {error && (
          <div className="bg-red-500 bg-opacity-20 text-red-400 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="mr-3 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 text-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 rounded-lg flex items-center ${
              loading ? 'bg-blue-500 bg-opacity-50 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {loading && (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvestmentGainLossModal;