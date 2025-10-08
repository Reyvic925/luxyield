import React, { useState } from 'react';
import { 
  X, 
  DollarSign, 
  Plus, 
  Minus, 
  CheckCircle, 
  AlertCircle, 
  User,
  Loader2,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

const BalanceManagementModal = ({ user, onClose, onUpdate }) => {
  const [amount, setAmount] = useState('');
  const [operation, setOperation] = useState('add');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    // Validate amount
    const numAmount = parseFloat(amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    // Check if subtracting more than available balance
    if (operation === 'subtract') {
      const availableBalance = Number(user.availableBalance || 0);
      if (numAmount > availableBalance) {
        setError(`Cannot subtract more than the available balance ($${availableBalance.toFixed(2)})`);
        return;
      }
    }

    setLoading(true);
    try {
      await onUpdate({
        userId: user._id || user.id,
        amount: numAmount,
        operation
      });
      setSuccess(true);
      setTimeout(() => onClose(), 1500); // Close after showing success message
    } catch (err) {
      setError(err.message || 'Failed to update balance');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-backdrop">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 p-8 w-full max-w-lg relative backdrop-blur-sm modal-content">
      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute right-6 top-6 p-2 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-red-400/50 transition-all duration-200 group"
      >
        <X className="h-5 w-5 group-hover:text-red-400" />
      </button>
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
          <DollarSign className="h-8 w-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Balance Management</h2>
          <div className="flex items-center gap-2 text-gray-400">
            <User className="h-4 w-4" />
            <span className="text-sm">{user.name || user.email}</span>
          </div>
        </div>
      </div>

      {/* Current Balance Card */}
      <div className="bg-gradient-to-r from-gray-700/50 to-gray-800/50 rounded-xl p-6 mb-8 border border-gray-600/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Current Available Balance</p>
            <p className="text-3xl font-bold text-white">
              ${Number(user.availableBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-3 bg-gradient-to-r from-green-500/20 to-emerald-600/20 rounded-lg border border-green-500/30">
            <TrendingUp className="h-6 w-6 text-green-400" />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 mb-6">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 mb-6">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">Balance updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Operation Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-4">Select Operation</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setOperation('add')}
              disabled={loading}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                operation === 'add'
                  ? 'border-green-500 bg-green-500/10 text-green-400'
                  : 'border-gray-600 bg-gray-700/30 text-gray-400 hover:border-green-500/50 hover:bg-green-500/5'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Plus className="h-5 w-5" />
                <span className="font-medium">Add Funds</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setOperation('subtract')}
              disabled={loading}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                operation === 'subtract'
                  ? 'border-red-500 bg-red-500/10 text-red-400'
                  : 'border-gray-600 bg-gray-700/30 text-gray-400 hover:border-red-500/50 hover:bg-red-500/5'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Minus className="h-5 w-5" />
                <span className="font-medium">Subtract Funds</span>
              </div>
            </button>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">Amount</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="0.00"
              required
              disabled={loading}
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={`w-full px-6 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            loading 
              ? 'bg-gray-600 cursor-not-allowed text-gray-300'
              : operation === 'add'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-green-500/25'
                : 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 shadow-lg hover:shadow-red-500/25'
          }`}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : operation === 'add' ? (
            <>
              <Plus className="h-5 w-5" />
              Add Funds
            </>
          ) : (
            <>
              <Minus className="h-5 w-5" />
              Subtract Funds
            </>
          )}
        </button>
      </form>
      </div>
    </div>
  );
};

export default BalanceManagementModal;