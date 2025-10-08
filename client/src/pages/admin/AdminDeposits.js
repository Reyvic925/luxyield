// src/pages/admin/AdminDeposits.js
import React, { useState, useEffect } from 'react';
import { 
  FiDollarSign, FiUser, FiCalendar, FiCheck, FiX, FiClock, 
  FiRefreshCw, FiFilter, FiSearch, FiDownload, FiEye,
  FiAlertCircle, FiCheckCircle, FiXCircle
} from 'react-icons/fi';

const AdminDeposits = () => {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('adminToken');
      if (!token) {
        window.location.href = '/admin/login';
        return;
      }

      const response = await fetch('/api/admin/deposits', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDeposits(data);
      } else {
        throw new Error('Failed to fetch deposits');
      }
    } catch (error) {
      console.error('Error fetching deposits:', error);
      setError('Failed to load deposits. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDeposits();
  };

  const handleApprove = async (depositId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/deposits/${depositId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Update local state optimistically
        setDeposits(prev => 
          prev.map(deposit => 
            deposit._id === depositId 
              ? { ...deposit, status: 'confirmed' }
              : deposit
          )
        );
      } else {
        throw new Error('Failed to approve deposit');
      }
    } catch (error) {
      console.error('Error approving deposit:', error);
      setError('Failed to approve deposit. Please try again.');
    }
  };

  const handleReject = async (depositId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/deposits/${depositId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Update local state optimistically
        setDeposits(prev => 
          prev.map(deposit => 
            deposit._id === depositId 
              ? { ...deposit, status: 'rejected' }
              : deposit
          )
        );
      } else {
        throw new Error('Failed to reject deposit');
      }
    } catch (error) {
      console.error('Error rejecting deposit:', error);
      setError('Failed to reject deposit. Please try again.');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <FiCheckCircle className="w-4 h-4 text-green-400" />;
      case 'pending': return <FiClock className="w-4 h-4 text-yellow-400" />;
      case 'rejected': return <FiXCircle className="w-4 h-4 text-red-400" />;
      default: return <FiClock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const filteredDeposits = deposits.filter(deposit => {
    const matchesSearch = 
      deposit.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deposit.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deposit.amount.toString().includes(searchTerm);
    const matchesStatus = statusFilter === '' || deposit.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: deposits.length,
    pending: deposits.filter(d => d.status === 'pending').length,
    confirmed: deposits.filter(d => d.status === 'confirmed').length,
    rejected: deposits.filter(d => d.status === 'rejected').length,
    totalAmount: deposits.reduce((sum, d) => sum + (d.status === 'confirmed' ? d.amount : 0), 0)
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400">Loading deposits...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Deposit Management</h1>
          <p className="text-gray-400">Review and manage user deposit requests</p>
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
              <FiDollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-gray-400 text-sm">Total Deposits</p>
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
              <p className="text-2xl font-bold text-green-400">{stats.confirmed}</p>
              <p className="text-gray-400 text-sm">Confirmed</p>
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
              <p className="text-gray-400 text-sm">Total Value</p>
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
              placeholder="Search by user email, name, or amount..."
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
              <option value="confirmed">Confirmed</option>
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

      {/* Deposits Table */}
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
              {filteredDeposits.map((deposit, index) => (
                <tr 
                  key={deposit._id} 
                  className={`border-b border-white/5 hover:bg-white/5 transition-all duration-200 ${
                    index % 2 === 0 ? 'bg-white/[0.02]' : ''
                  }`}
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white font-bold">
                        {deposit.userId?.name?.charAt(0)?.toUpperCase() || deposit.userId?.email?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-white font-medium">{deposit.userId?.name || 'Unknown User'}</p>
                        <p className="text-gray-400 text-sm">{deposit.userId?.email || 'No email'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-white font-mono font-semibold text-lg">
                      ${deposit.amount.toLocaleString()}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(deposit.status)}`}>
                      {getStatusIcon(deposit.status)}
                      <span className="capitalize">{deposit.status}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-gray-300">
                      {new Date(deposit.createdAt).toLocaleDateString('en-US', {
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
                      {deposit.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleApprove(deposit._id)}
                            className="flex items-center space-x-1 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 transition-all duration-200"
                          >
                            <FiCheck className="w-4 h-4" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleReject(deposit._id)}
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
        
        {filteredDeposits.length === 0 && (
          <div className="text-center py-12">
            <FiDollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No deposits found</p>
            <p className="text-gray-500 text-sm">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDeposits;
