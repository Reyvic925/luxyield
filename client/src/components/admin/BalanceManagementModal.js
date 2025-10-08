import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';

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
    <div className="bg-gray-700 rounded-lg p-6 w-full max-w-md relative">
      <button 
        onClick={onClose}
        className="absolute right-4 top-4 text-gray-400 hover:text-white"
      >
        <FiX size={24} />
      </button>
      
      <h2 className="text-xl font-semibold mb-4">Manage Balance: {user.name}</h2>
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <p className="text-sm text-gray-300">Available Balance:</p>
        <p className="text-2xl font-semibold text-gold">
          ${Number(user.availableBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        {error && (
          <p className="mt-2 text-sm text-red-400">{error}</p>
        )}
      </div>

      {error && (
        <div className="bg-red-500 bg-opacity-10 text-red-400 px-4 py-2 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {success && (
          <div className="bg-green-500 bg-opacity-10 text-green-400 px-4 py-2 rounded-lg">
            Balance updated successfully!
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium mb-2">Operation</label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="operation"
                value="add"
                checked={operation === 'add'}
                onChange={(e) => setOperation(e.target.value)}
                disabled={loading}
                className="mr-2"
              />
              Add Funds
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="operation"
                value="subtract"
                checked={operation === 'subtract'}
                onChange={(e) => setOperation(e.target.value)}
                disabled={loading}
                className="mr-2"
              />
              Subtract Funds
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-8 pr-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
              placeholder="0.00"
              required
              disabled={loading}
            />
          </div>
        </div>

        <button
          type="submit"
          className={`w-full px-4 py-2 rounded-lg transition-colors ${
            loading 
              ? 'bg-gray-600 cursor-not-allowed'
              : operation === 'add'
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-red-500 text-white hover:bg-red-600'
          }`}
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </div>
          ) : operation === 'add' ? 'Add Funds' : 'Subtract Funds'}
        </button>
      </form>
    </div>
  );
};

export default BalanceManagementModal;