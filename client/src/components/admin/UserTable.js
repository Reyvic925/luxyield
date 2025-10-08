import React, { useState } from 'react';
import { FiSearch, FiEdit2, FiEye, FiDollarSign } from 'react-icons/fi';

const UserTable = ({ users, onSelectUser, onUpdateUser, onManageBalance }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('all');

  const safeUsers = Array.isArray(users) ? users : [];

  const filteredUsers = safeUsers.filter(user => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (viewMode === 'all') return matchesSearch;
    if (viewMode === 'verified') return matchesSearch && user.kycStatus === 'verified';
    if (viewMode === 'pending') return matchesSearch && user.kycStatus === 'pending';
    return matchesSearch;
  });

  const normalizedUsers = filteredUsers.map(user => ({ ...user, id: user.id || user._id }));
  const uniqueUsers = Array.from(new Map(normalizedUsers.map(u => [u.id, u])).values());

  return (
    <>
      <div className="mb-6 md:mb-8 flex flex-col md:flex-row gap-4 md:gap-6 justify-between">
        <div className="w-full md:w-80 relative">
          <input
            type="text"
            placeholder="Search users..."
            className="w-full py-2 pl-8 bg-transparent border-b border-gray-700 text-white focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FiSearch className="absolute top-[11px] left-0 text-gray-400" />
        </div>
        <div className="flex flex-wrap items-center gap-4 md:gap-6">
          <button onClick={() => setViewMode('all')} 
            className={`${viewMode === 'all' ? 'text-gold' : 'text-gray-400'} text-sm md:text-base`}>
            All Users
          </button>
          <button onClick={() => setViewMode('verified')} 
            className={`${viewMode === 'verified' ? 'text-green-400' : 'text-gray-400'} text-sm md:text-base`}>
            Verified
          </button>
          <button onClick={() => setViewMode('pending')} 
            className={`${viewMode === 'pending' ? 'text-yellow-400' : 'text-gray-400'} text-sm md:text-base`}>
            Pending KYC
          </button>
          <select className="bg-transparent text-white border-b border-gray-700 py-1 text-sm md:text-base">
            <option>Export</option>
            <option>CSV</option>
            <option>PDF</option>
          </select>
        </div>
      </div>

            <div className="overflow-x-auto -mx-4 md:mx-0">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr>
              <th className="text-left font-medium text-gray-400 px-4">User</th>
              <th className="text-left font-medium text-gray-400">Email</th>
              <th className="text-left font-medium text-gray-400">KYC Status</th>
              <th className="text-left font-medium text-gray-400">Role</th>
              <th className="text-left font-medium text-gray-400">Available Balance</th>
              <th className="text-left font-medium text-gray-400">Total Balance</th>
              <th className="text-left font-medium text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {uniqueUsers.map((user) => (
              <tr key={user.id} className="border-t border-gray-800 hover:bg-gray-900/30">
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center text-white shrink-0">
                      {user.name ? user.name[0].toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-white truncate">{user.name}</div>
                      <div className="text-sm text-gray-400 truncate">Joined {new Date(user.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                </td>
                <td className="py-4 text-white">
                  <div className="truncate max-w-[180px]">{user.email}</div>
                </td>
                <td className="py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap
                    ${user.kycStatus === 'verified' ? 'bg-green-100 text-green-800' : 
                      user.kycStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-gray-100 text-gray-800'}`}>
                    {user.kycStatus || 'Not Started'}
                  </span>
                </td>
                <td className="py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap
                    ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                    {user.role || 'user'}
                  </span>
                </td>
                <td className="py-4 text-white whitespace-nowrap">
                  ${typeof user.availableBalance === 'number' ? 
                    parseFloat(user.availableBalance).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : 
                    '0.00'}
                </td>
                <td className="py-4 text-white whitespace-nowrap">
                  ${typeof user.balance === 'number' ? 
                    parseFloat(user.balance).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : 
                    '0.00'}
                </td>
                <td className="py-4 pr-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectUser(user)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                      aria-label="View user"
                    >
                      <FiEye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onManageBalance(user)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                      aria-label="Manage balance"
                    >
                      <FiDollarSign className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onSelectUser(user)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                      aria-label="Edit user"
                    >
                      <FiEdit2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default UserTable;
