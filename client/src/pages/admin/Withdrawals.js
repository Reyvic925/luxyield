// src/pages/admin/Withdrawals.js
import React, { useState, useEffect } from 'react';
import { 
  FiDollarSign, FiUser, FiCalendar, FiCheck, FiX, FiClock, 
  FiRefreshCw, FiFilter, FiSearch, FiDownload, FiEye,
  FiAlertCircle, FiCheckCircle, FiXCircle, FiArrowUpRight,
  FiGlobe, FiCopy
} from 'react-icons/fi';
import { Wallet } from 'lucide-react';

const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('adminToken');
      if (!token) {
        window.location.href = '/admin/login';
        return;
      }

      const response = await fetch('/api/admin/withdrawals', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setWithdrawals(data);
      } else {
        throw new Error('Failed to fetch withdrawals');
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      setError('Failed to load withdrawals. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchWithdrawals();
  };

  const handleApprove = async (withdrawalId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/withdrawals/${withdrawalId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setWithdrawals(prev => 
          prev.map(withdrawal => 
            withdrawal._id === withdrawalId 
              ? { ...withdrawal, status: 'completed' }
              : withdrawal
          )
        );
      } else {
        throw new Error('Failed to approve withdrawal');
      }
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      setError('Failed to approve withdrawal. Please try again.');
    }
  };

  const handleReject = async (withdrawalId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/withdrawals/${withdrawalId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setWithdrawals(prev => 
          prev.map(withdrawal => 
            withdrawal._id === withdrawalId 
              ? { ...withdrawal, status: 'rejected' }
              : withdrawal
          )
        );
      } else {
        throw new Error('Failed to reject withdrawal');
      }
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      setError('Failed to reject withdrawal. Please try again.');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <FiCheckCircle className="w-4 h-4 text-green-400" />;
      case 'pending': return <FiClock className="w-4 h-4 text-yellow-400" />;
      case 'rejected': return <FiXCircle className="w-4 h-4 text-red-400" />;
      default: return <FiClock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const matchesSearch = 
      withdrawal.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdrawal.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdrawal.amount.toString().includes(searchTerm) ||
      withdrawal.walletAddress?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || withdrawal.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: withdrawals.length,
    pending: withdrawals.filter(w => w.status === 'pending').length,
    completed: withdrawals.filter(w => w.status === 'completed').length,
    rejected: withdrawals.filter(w => w.status === 'rejected').length,
    totalAmount: withdrawals.reduce((sum, w) => sum + (w.status === 'completed' ? w.amount : 0), 0)
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400">Loading withdrawals...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Withdrawal Management</h1>
          <p className="text-gray-400">Review and process user withdrawal requests</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 transition-all duration-200 disabled:opacity-50"
          >
            <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 transition-all duration-200">
            <FiDownload className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
              <FiArrowUpRight className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-gray-400 text-sm">Total Withdrawals</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
              <FiClock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
              <p className="text-gray-400 text-sm">Pending</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
              <FiCheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
              <p className="text-gray-400 text-sm">Completed</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center">
              <FiXCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">{stats.rejected}</p>
              <p className="text-gray-400 text-sm">Rejected</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <FiDollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">${stats.totalAmount.toLocaleString()}</p>
              <p className="text-gray-400 text-sm">Total Processed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by user, amount, or wallet address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-amber-400/50 focus:bg-white/10 transition-all duration-200"
            />
          </div>
          <div className="relative">
            <FiFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-12 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-400/50 focus:bg-white/10 transition-all duration-200 min-w-[150px]"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-4 flex items-center space-x-3">
          <FiAlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Withdrawals Table */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left py-4 px-6 text-gray-300 font-semibold">
                  <div className="flex items-center space-x-2">
                    <FiUser className="w-4 h-4" />
                    <span>User</span>
                  </div>
                </th>
                <th className="text-left py-4 px-6 text-gray-300 font-semibold">
                  <div className="flex items-center space-x-2">
                    <FiDollarSign className="w-4 h-4" />
                    <span>Amount</span>
                  </div>
                </th>
                <th className="text-left py-4 px-6 text-gray-300 font-semibold">
                  <div className="flex items-center space-x-2">
                    <Wallet className="w-4 h-4" />
                    <span>Wallet</span>
                  </div>
                </th>
                <th className="text-left py-4 px-6 text-gray-300 font-semibold">
                  <div className="flex items-center space-x-2">
                    <FiGlobe className="w-4 h-4" />
                    <span>Network</span>
                  </div>
                </th>
                <th className="text-left py-4 px-6 text-gray-300 font-semibold">Status</th>
                <th className="text-left py-4 px-6 text-gray-300 font-semibold">
                  <div className="flex items-center space-x-2">
                    <FiCalendar className="w-4 h-4" />
                    <span>Date</span>
                  </div>
                </th>
                <th className="text-center py-4 px-6 text-gray-300 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWithdrawals.map((withdrawal, index) => (
                <tr 
                  key={withdrawal._id} 
                  className={`border-b border-white/5 hover:bg-white/5 transition-all duration-200 ${
                    index % 2 === 0 ? 'bg-white/[0.02]' : ''
                  }`}
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold">
                        {withdrawal.userId?.name?.charAt(0)?.toUpperCase() || withdrawal.userId?.email?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-white font-medium">{withdrawal.userId?.name || 'Unknown User'}</p>
                        <p className="text-gray-400 text-sm">{withdrawal.userId?.email || 'No email'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-white font-mono font-semibold text-lg">
                      ${withdrawal.amount.toLocaleString()}
                    </div>
                    <div className="text-gray-400 text-sm">{withdrawal.currency || 'USD'}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-300 font-mono text-sm">
                        {withdrawal.walletAddress ? 
                          `${withdrawal.walletAddress.slice(0, 6)}...${withdrawal.walletAddress.slice(-4)}` : 
                          'N/A'
                        }
                      </span>
                      {withdrawal.walletAddress && (
                        <button
                          onClick={() => copyToClipboard(withdrawal.walletAddress)}
                          className="p-1 hover:bg-white/10 rounded transition-all duration-200"
                        >
                          <FiCopy className="w-3 h-3 text-gray-400 hover:text-white" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-gray-300 uppercase text-sm font-medium">
                      {withdrawal.network || 'ETH'}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(withdrawal.status)}`}>
                      {getStatusIcon(withdrawal.status)}
                      <span className="capitalize">{withdrawal.status}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-gray-300">
                      {new Date(withdrawal.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center space-x-2">
                      {withdrawal.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleApprove(withdrawal._id)}
                            className="flex items-center space-x-1 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 transition-all duration-200"
                          >
                            <FiCheck className="w-4 h-4" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleReject(withdrawal._id)}
                            className="flex items-center space-x-1 px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-all duration-200"
                          >
                            <FiX className="w-4 h-4" />
                            <span>Reject</span>
                          </button>
                        </>
                      ) : (
                        <button className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-200 group">
                          <FiEye className="w-4 h-4 text-gray-400 group-hover:text-white" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredWithdrawals.length === 0 && (
          <div className="text-center py-12">
            <FiArrowUpRight className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No withdrawals found</p>
            <p className="text-gray-500 text-sm">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminWithdrawals;