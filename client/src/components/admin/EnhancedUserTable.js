import React, { useState } from 'react';
import { FiSearch, FiFilter, FiEdit2, FiEye, FiDownload, FiSliders, FiChevronDown, FiUser, FiDollarSign, FiTrendingUp } from 'react-icons/fi';
import BalanceManagementModal from './BalanceManagementModal';
import InvestmentGainLossModal from './InvestmentGainLossModal';

const EnhancedUserTable = ({ users, onSelectUser, onUpdateUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    tier: 'all',
    kycStatus: 'all',
    activeOnly: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedUserForBalance, setSelectedUserForBalance] = useState(null);
  const [selectedUserForInvestment, setSelectedUserForInvestment] = useState(null);

  const handleBalanceUpdate = (updatedUser) => {
    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }
    setSelectedUserForBalance(null);
  };

  const handleInvestmentUpdate = (updatedData) => {
    if (onUpdateUser) {
      onUpdateUser(updatedData);
    }
    setSelectedUserForInvestment(null);
  };

  // Ensure users is always an array
  const safeUsers = Array.isArray(users) ? users : [];

  // Apply filters and search
  const filteredUsers = safeUsers.filter(user => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTier = filters.tier === 'all' || user.tier === filters.tier;
    const matchesKYC = filters.kycStatus === 'all' || user.kycStatus === filters.kycStatus;
    const matchesActive = !filters.activeOnly || user.status === 'active';

    return matchesSearch && matchesTier && matchesKYC && matchesActive;
  });

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'email':
        comparison = a.email.localeCompare(b.email);
        break;
      case 'balance':
        comparison = (a.balance || 0) - (b.balance || 0);
        break;
      default:
        comparison = 0;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Remove duplicate users by id
  const uniqueUsers = Array.from(new Map(sortedUsers.map(u => [u.id || u._id, u])).values());

  const getTierColor = (tier) => {
    switch (tier?.toLowerCase()) {
      case 'diamond':
        return 'bg-blue-500 bg-opacity-20 text-blue-400';
      case 'gold':
        return 'bg-yellow-500 bg-opacity-20 text-yellow-400';
      case 'starter':
        return 'bg-gray-500 bg-opacity-20 text-gray-400';
      default:
        return 'bg-gray-600 bg-opacity-20 text-gray-400';
    }
  };

  const getKYCStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'verified':
        return 'bg-green-500 bg-opacity-20 text-green-400';
      case 'pending':
        return 'bg-yellow-500 bg-opacity-20 text-yellow-400';
      case 'rejected':
        return 'bg-red-500 bg-opacity-20 text-red-400';
      default:
        return 'bg-gray-500 bg-opacity-20 text-gray-400';
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4 md:p-6 shadow-xl w-full min-w-0 overflow-hidden">
      <div className="w-full flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 min-w-0">
        {/* Search Bar */}
        <div className="relative w-full lg:w-96 min-w-0">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email or ID..."
            className="w-full pl-10 pr-4 py-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all min-w-0"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Action Buttons */}
  <div className="flex flex-wrap items-center gap-3 justify-end w-full lg:w-auto">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-all"
          >
            <FiFilter className="mr-2" />
            <span>Filters</span>
            <FiChevronDown className={`ml-2 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          <div className="relative group">
            <button className="flex items-center px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-all">
              <FiDownload className="mr-2" />
              <span>Export</span>
              <FiChevronDown className="ml-2" />
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-lg shadow-xl hidden group-hover:block z-10">
              <button className="w-full text-left px-4 py-2 hover:bg-gray-600 transition-all">Export as CSV</button>
              <button className="w-full text-left px-4 py-2 hover:bg-gray-600 transition-all">Export as PDF</button>
              <button className="w-full text-left px-4 py-2 hover:bg-gray-600 transition-all">Export as Excel</button>
            </div>
          </div>

          <button className="flex items-center px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-all">
            <FiSliders className="mr-2" />
            <span>Columns</span>
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-700 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Tier</label>
            <select
              value={filters.tier}
              onChange={(e) => setFilters({ ...filters, tier: e.target.value })}
              className="w-full bg-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Tiers</option>
              <option value="diamond">Diamond</option>
              <option value="gold">Gold</option>
              <option value="starter">Starter</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">KYC Status</label>
            <select
              value={filters.kycStatus}
              onChange={(e) => setFilters({ ...filters, kycStatus: e.target.value })}
              className="w-full bg-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filters.activeOnly}
                onChange={(e) => setFilters({ ...filters, activeOnly: e.target.checked })}
                className="form-checkbox h-5 w-5 text-blue-500 rounded focus:ring-blue-500 border-gray-500 bg-gray-600"
              />
              <span className="ml-2">Active Users Only</span>
            </label>
          </div>
        </div>
      )}

      {/* Table */}
      {/* Desktop/table view (hidden on small screens) */}
      <div className="hidden md:block overflow-x-auto min-w-0">
        <table className="w-full table-auto min-w-full whitespace-normal">
          <thead>
            <tr className="border-b border-gray-700 text-left">
              <th className="py-4 px-4 min-w-0 cursor-pointer" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-2">
                  <span>User</span>
                  {sortBy === 'name' && (
                    <FiChevronDown className={`ml-1 transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                  )}
                </div>
              </th>
              <th className="py-4 px-4 min-w-0 cursor-pointer" onClick={() => handleSort('email')}>
                <div className="flex items-center gap-2">
                  <span>Email</span>
                  {sortBy === 'email' && (
                    <FiChevronDown className={`ml-1 transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                  )}
                </div>
              </th>
              <th className="py-4 px-4 min-w-0">Tier</th>
              <th className="py-4 px-4 min-w-0">KYC Status</th>
              <th className="py-4 px-4 min-w-0 cursor-pointer" onClick={() => handleSort('balance')}>
                <div className="flex items-center gap-2">
                  <span>Balance</span>
                  {sortBy === 'balance' && (
                    <FiChevronDown className={`ml-1 transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                  )}
                </div>
              </th>
              <th className="py-4 px-4 min-w-0">Actions</th>
            </tr>
          </thead>
          <tbody>
            {uniqueUsers.map(user => (
              <tr key={user.id || user._id} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                <td className="py-4 px-4 min-w-0">
                  <div className="flex items-center min-w-0 gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <FiUser className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0 overflow-hidden">
                      <div className="font-medium truncate">{user.name || 'No name'}</div>
                      <div className="text-xs text-gray-400 truncate">ID: {user.id || user._id}</div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 min-w-0 break-words max-w-[16rem]">{user.email || 'N/A'}</td>
                <td className="py-4 px-4 min-w-0">
                  <span className={`px-3 py-1 rounded-full text-xs ${getTierColor(user.tier)}`}>
                    {user.tier || 'Unknown'}
                  </span>
                </td>
                <td className="py-4 px-4 min-w-0">
                  <span className={`px-3 py-1 rounded-full text-xs ${getKYCStatusColor(user.kycStatus)}`}>
                    {user.kycStatus || 'Not Submitted'}
                  </span>
                </td>
                <td className="py-4 px-4 min-w-0 font-mono">{typeof user.balance === 'number' ? `$${user.balance.toLocaleString()}` : 'N/A'}</td>
                <td className="py-4 px-4 min-w-0">
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => onSelectUser(user)}
                      className="p-2 bg-gray-700 rounded-lg hover:bg-blue-600 transition-colors"
                      title="View Details"
                    >
                      <FiEye className="w-4 h-4" />
                    </button>
                    <button 
                      className="p-2 bg-gray-700 rounded-lg hover:bg-blue-600 transition-colors"
                      title="Edit User"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setSelectedUserForBalance(user)}
                      className="p-2 bg-gray-700 rounded-lg hover:bg-green-600 transition-colors"
                      title="Manage Balance"
                    >
                      <FiDollarSign className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setSelectedUserForInvestment(user)}
                      className="p-2 bg-gray-700 rounded-lg hover:bg-yellow-600 transition-colors"
                      title="Manage Investment"
                    >
                      <FiTrendingUp className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
 
      {/* Mobile card view */}
      <div className="block md:hidden space-y-3">
        {uniqueUsers.map(user => (
          <div key={user.id || user._id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold text-white truncate">{user.name || 'No name'}</div>
                <div className="text-xs text-gray-400 break-words truncate">{user.email || 'N/A'}</div>
                <div className="text-xs text-gray-400 mt-1">ID: {user.id || user._id}</div>
              </div>
              <div className="flex flex-col items-start sm:items-end text-right gap-2">
                <div className="font-mono text-sm">{typeof user.balance === 'number' ? `$${user.balance.toLocaleString()}` : 'N/A'}</div>
                <div className={`px-2 py-0.5 rounded-full text-xs ${getTierColor(user.tier)}`}>{user.tier || 'Unknown'}</div>
                <div className={`px-2 py-0.5 rounded-full text-xs ${getKYCStatusColor(user.kycStatus)}`}>{user.kycStatus || 'Not Submitted'}</div>
              </div>
            </div>
 
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg bg-gray-900 p-3">
                <div className="text-gray-400 text-xs">Email</div>
                <div className="text-sm text-white break-words">{user.email || 'N/A'}</div>
              </div>
              <div className="rounded-lg bg-gray-900 p-3">
                <div className="text-gray-400 text-xs">Tier</div>
                <div className="text-sm text-white break-words">{user.tier || 'Unknown'}</div>
              </div>
              <div className="rounded-lg bg-gray-900 p-3">
                <div className="text-gray-400 text-xs">KYC Status</div>
                <div className="text-sm text-white break-words">{user.kycStatus || 'Not Submitted'}</div>
              </div>
              <div className="rounded-lg bg-gray-900 p-3">
                <div className="text-gray-400 text-xs">Balance</div>
                <div className="text-sm text-white break-words">{typeof user.balance === 'number' ? `$${user.balance.toLocaleString()}` : 'N/A'}</div>
              </div>
            </div>
 
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={() => onSelectUser(user)} className="w-full p-2 bg-gray-700 rounded-lg hover:bg-blue-600 transition-colors">View</button>
              <button className="w-full p-2 bg-gray-700 rounded-lg hover:bg-blue-600 transition-colors">Edit</button>
              <button onClick={() => setSelectedUserForBalance(user)} className="w-full p-2 bg-gray-700 rounded-lg hover:bg-green-600 transition-colors">Balance</button>
              <button onClick={() => setSelectedUserForInvestment(user)} className="w-full p-2 bg-gray-700 rounded-lg hover:bg-yellow-600 transition-colors">Invest</button>
            </div>
          </div>
        ))}
      </div>

      {/* Balance Management Modal */}
      {selectedUserForBalance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <BalanceManagementModal
            user={selectedUserForBalance}
            onClose={() => setSelectedUserForBalance(null)}
            onUpdate={handleBalanceUpdate}
          />
        </div>
      )}

      {/* Investment Management Modal */}
      {selectedUserForInvestment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <InvestmentGainLossModal
            user={selectedUserForInvestment}
            onClose={() => setSelectedUserForInvestment(null)}
            onUpdate={handleInvestmentUpdate}
          />
        </div>
      )}

      {/* Table Footer */}
      <div className="mt-4 flex flex-wrap justify-between items-center text-sm text-gray-400 gap-2">
        <div className="min-w-0 truncate">
          Showing {uniqueUsers.length} of {safeUsers.length} users
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 transition-all">Previous</button>
          <button className="px-3 py-1 bg-blue-500 rounded">1</button>
          <button className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 transition-all">2</button>
          <button className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 transition-all">3</button>
          <button className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 transition-all">Next</button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedUserTable;


