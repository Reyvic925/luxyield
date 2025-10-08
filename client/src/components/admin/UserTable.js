// src/components/admin/UserTable.js
import React, { useState } from 'react';
import { 
  FiSearch, FiFilter, FiEdit, FiEye, FiDollarSign, FiMoreVertical,
  FiUser, FiMail, FiShield, FiCheckCircle, FiXCircle, FiClock,
  FiTrendingUp, FiSettings, FiDownload
} from 'react-icons/fi';
import BalanceManagementModal from './BalanceManagementModal';

const UserTable = ({ users, onUserUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = filterTier === '' || user.tier === filterTier;
    return matchesSearch && matchesTier;
  }).sort((a, b) => {
    const aValue = a[sortBy] || '';
    const bValue = b[sortBy] || '';
    if (sortOrder === 'asc') {
      return aValue.toString().localeCompare(bValue.toString());
    }
    return bValue.toString().localeCompare(aValue.toString());
  });

  const handleBalanceManagement = (user) => {
    setSelectedUser(user);
    setIsBalanceModalOpen(true);
  };

  const handleBalanceUpdate = (updatedUser) => {
    onUserUpdate(updatedUser);
    setIsBalanceModalOpen(false);
    setSelectedUser(null);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getTierColor = (tier) => {
    switch (tier?.toLowerCase()) {
      case 'bronze': return 'from-amber-600 to-orange-700';
      case 'silver': return 'from-gray-400 to-gray-600';
      case 'gold': return 'from-yellow-400 to-yellow-600';
      case 'platinum': return 'from-purple-400 to-purple-600';
      default: return 'from-gray-500 to-gray-700';
    }
  };

  const getKycStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'verified': return <FiCheckCircle className="w-4 h-4 text-green-400" />;
      case 'pending': return <FiClock className="w-4 h-4 text-yellow-400" />;
      case 'rejected': return <FiXCircle className="w-4 h-4 text-red-400" />;
      default: return <FiClock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getKycStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'verified': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 animate-fade-in-down">
        <div className="animate-fade-in-left">
          <h2 className="text-2xl font-bold text-white mb-2">User Management</h2>
          <p className="text-gray-400">Manage user accounts, KYC status, and balances</p>
        </div>
        <div className="flex items-center space-x-3 animate-fade-in-right">
          <button className="flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 transition-all duration-200 hover-lift button-press">
            <FiDownload className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl text-white font-medium hover:from-amber-500 hover:to-orange-600 transition-all duration-200 hover-lift button-press">
            <FiUser className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-amber-400/50 focus:bg-white/10 transition-all duration-200"
            />
          </div>
          <div className="relative">
            <FiFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="pl-12 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-400/50 focus:bg-white/10 transition-all duration-200 min-w-[150px]"
            >
              <option value="">All Tiers</option>
              <option value="Bronze">Bronze</option>
              <option value="Silver">Silver</option>
              <option value="Gold">Gold</option>
              <option value="Platinum">Platinum</option>
            </select>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{users.length}</p>
            <p className="text-gray-400 text-sm">Total Users</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">{users.filter(u => u.kycStatus === 'verified').length}</p>
            <p className="text-gray-400 text-sm">Verified</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-400">{users.filter(u => u.kycStatus === 'pending').length}</p>
            <p className="text-gray-400 text-sm">Pending KYC</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-400">${users.reduce((sum, u) => sum + (u.availableBalance || 0), 0).toLocaleString()}</p>
            <p className="text-gray-400 text-sm">Total Balance</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th 
                  className="text-left py-4 px-6 text-gray-300 font-semibold cursor-pointer hover:text-white transition-colors duration-200"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-2">
                    <FiUser className="w-4 h-4" />
                    <span>User</span>
                  </div>
                </th>
                <th 
                  className="text-left py-4 px-6 text-gray-300 font-semibold cursor-pointer hover:text-white transition-colors duration-200"
                  onClick={() => handleSort('email')}
                >
                  <div className="flex items-center space-x-2">
                    <FiMail className="w-4 h-4" />
                    <span>Email</span>
                  </div>
                </th>
                <th 
                  className="text-left py-4 px-6 text-gray-300 font-semibold cursor-pointer hover:text-white transition-colors duration-200"
                  onClick={() => handleSort('tier')}
                >
                  <div className="flex items-center space-x-2">
                    <FiTrendingUp className="w-4 h-4" />
                    <span>Tier</span>
                  </div>
                </th>
                <th className="text-left py-4 px-6 text-gray-300 font-semibold">
                  <div className="flex items-center space-x-2">
                    <FiShield className="w-4 h-4" />
                    <span>KYC Status</span>
                  </div>
                </th>
                <th 
                  className="text-left py-4 px-6 text-gray-300 font-semibold cursor-pointer hover:text-white transition-colors duration-200"
                  onClick={() => handleSort('availableBalance')}
                >
                  <div className="flex items-center space-x-2">
                    <FiDollarSign className="w-4 h-4" />
                    <span>Balance</span>
                  </div>
                </th>
                <th className="text-center py-4 px-6 text-gray-300 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr 
                  key={user._id} 
                  className={`border-b border-white/5 hover:bg-white/5 transition-all duration-200 animate-fade-in-up animate-stagger-${Math.min((index % 5) + 1, 5)} hover-lift ${
                    index % 2 === 0 ? 'bg-white/[0.02]' : ''
                  }`}
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getTierColor(user.tier)} flex items-center justify-center text-white font-bold shadow-lg`}>
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-white font-semibold">{user.name || 'Unknown'}</p>
                        <p className="text-gray-400 text-sm">ID: {user._id.slice(-6)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-300">{user.email}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${getTierColor(user.tier)} text-white shadow-lg`}>
                      {user.tier || 'Bronze'}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium border ${getKycStatusColor(user.kycStatus)}`}>
                      {getKycStatusIcon(user.kycStatus)}
                      <span className="capitalize">{user.kycStatus || 'pending'}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-white font-mono font-semibold">
                      ${(user.availableBalance || 0).toLocaleString()}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center space-x-2">
                      <button 
                        className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-blue-400/50 transition-all duration-200 group button-press hover-scale"
                        title="View Details"
                      >
                        <FiEye className="w-4 h-4 text-gray-400 group-hover:text-blue-400" />
                      </button>
                      <button 
                        className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-amber-400/50 transition-all duration-200 group button-press hover-scale"
                        title="Edit User"
                      >
                        <FiEdit className="w-4 h-4 text-gray-400 group-hover:text-amber-400" />
                      </button>
                      <button 
                        onClick={() => handleBalanceManagement(user)}
                        className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-green-400/50 transition-all duration-200 group"
                        title="Manage Balance"
                      >
                        <FiDollarSign className="w-4 h-4 text-gray-400 group-hover:text-green-400" />
                      </button>
                      <button 
                        className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-gray-400/50 transition-all duration-200 group"
                        title="More Options"
                      >
                        <FiMoreVertical className="w-4 h-4 text-gray-400 group-hover:text-gray-300" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {isBalanceModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <BalanceManagementModal
            user={selectedUser}
            onClose={() => setIsBalanceModalOpen(false)}
            onUpdate={handleBalanceUpdate}
          />
        </div>
      )}
    </div>
  );
};

export default UserTable;