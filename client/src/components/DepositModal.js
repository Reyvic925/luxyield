// src/components/DepositModal.js
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const DepositModal = ({ isOpen, onClose, fundTypes }) => {
  const [formData, setFormData] = useState({
    fundType: '',
    amount: '',
    simulationDays: 30
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post('/api/user/deposit', formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      toast.success(response.data.message);
      onClose();
      // Refresh dashboard data
      window.dispatchEvent(new Event('dashboardUpdate'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 theme-overlay">
      <div className="glassmorphic p-6 rounded-xl w-full max-w-full sm:max-w-md mx-4 theme-aware-bg-secondary border theme-aware-border-secondary">
        <h2 className="text-2xl font-bold mb-4 text-gold">Simulated Deposit</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block theme-aware-text-secondary mb-2 font-medium">Fund Type</label>
            <select
              name="fundType"
              value={formData.fundType}
              onChange={handleChange}
              className="w-full theme-aware-bg-primary border theme-aware-border-secondary theme-aware-text rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-gold transition-all"
              required
            >
              <option value="">Select Fund</option>
              {fundTypes.map((type, idx) => (
                <option key={idx} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block theme-aware-text-secondary mb-2 font-medium">Amount (USD)</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              min="100"
              step="100"
              className="w-full theme-aware-bg-primary border theme-aware-border-secondary theme-aware-text rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-gold transition-all"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block theme-aware-text-secondary mb-2 font-medium">Simulation Period (Days)</label>
            <input
              type="number"
              name="simulationDays"
              value={formData.simulationDays}
              onChange={handleChange}
              min="7"
              max="365"
              className="w-full theme-aware-bg-primary border theme-aware-border-secondary theme-aware-text rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-gold transition-all"
              required
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:space-x-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 border theme-aware-border-secondary theme-aware-text hover:theme-aware-bg-primary rounded-lg transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 bg-gold text-black rounded-lg hover:bg-opacity-90 transition flex items-center justify-center"
              disabled={loading}
            >
              {loading && <div className="animate-spin rounded-full h-4 w-4 mr-2 border-t-2 border-b-2 border-black"></div>}
              Confirm Deposit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepositModal;
