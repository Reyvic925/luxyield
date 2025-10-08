import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';

const BalanceManagementModal = ({ user, onClose, onUpdate }) => {
  const [amount, setAmount] = useState('');
  const [operation, setOperation] = useState('add');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const numAmount = parseFloat(amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    setLoading(true);
    try {
      await onUpdate({
        userId: user._id || user.id,
        amount: numAmount,
        operation
      });
      onClose();
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
                className="mr-2"
              />
              Subtract Funds
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Amount</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
            placeholder="Enter amount"
            required
          />
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`px-4 py-2 rounded-lg ${
              operation === 'add'
                ? 'bg-green-500 bg-opacity-20 text-green-400 hover:bg-opacity-30'
                : 'bg-red-500 bg-opacity-20 text-red-400 hover:bg-opacity-30'
            }`}
          >
            {operation === 'add' ? 'Add Funds' : 'Subtract Funds'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BalanceManagementModal;