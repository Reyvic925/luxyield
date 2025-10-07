import React, { useState } from 'react';
import { FiPlus, FiMinus, FiDollarSign } from 'react-icons/fi';

const BalanceManagementModal = ({ user, onClose, onUpdate }) => {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('add'); // 'add' or 'subtract'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount) {
      setError('Please enter an amount');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (!user || !user._id) {
        throw new Error('Invalid user data');
      }

      // Use user._id instead of user.id as MongoDB uses _id
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/users/${user._id}/balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          operation: type
        }),
      });

      // Read response body once and try to parse JSON safely
      const respText = await response.text();
      let parsed = null;
      try {
        parsed = respText ? JSON.parse(respText) : null;
      } catch (e) {
        // Non-JSON response; leave parsed as null
        parsed = null;
      }

      if (!response.ok) {
        const errorData = parsed || { message: `HTTP error! status: ${response.status}` };
        console.error('Balance update failed:', errorData);
        throw new Error(errorData.message);
      }

      const updatedUser = parsed.user || {};
      
      // Update the UI with new balance data
      onUpdate({ user: updatedUser });
      
      // Trigger a global refresh of balance data
      window.dispatchEvent(new Event('dashboardUpdate'));
      
      // Close the modal
      onClose();
    } catch (err) {
      console.error('An error occurred during balance update:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Manage User Balance</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          ✕
        </button>
      </div>

      <div className="mb-4">
        <p className="text-gray-400">Available Balance: <span className="text-white font-mono">${(user.availableBalance || user.balance || 0).toLocaleString()}</span></p>
        <p className="text-gray-400">User: <span className="text-white">{user.name}</span></p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Operation Type</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={`flex items-center justify-center px-4 py-2 rounded-lg ${
                type === 'add' 
                  ? 'bg-green-500 bg-opacity-20 text-green-400 border border-green-500' 
                  : 'bg-gray-700 text-gray-400'
              }`}
              onClick={() => setType('add')}
            >
              <FiPlus className="mr-2" /> Add
            </button>
            <button
              type="button"
              className={`flex items-center justify-center px-4 py-2 rounded-lg ${
                type === 'subtract' 
                  ? 'bg-red-500 bg-opacity-20 text-red-400 border border-red-500' 
                  : 'bg-gray-700 text-gray-400'
              }`}
              onClick={() => setType('subtract')}
            >
              <FiMinus className="mr-2" /> Subtract
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Amount ($)</label>
          <div className="relative">
            <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              placeholder="Enter amount"
            />
          </div>
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

export default BalanceManagementModal;