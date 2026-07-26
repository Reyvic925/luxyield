// src/components/admin/UserTable.js
import React, { useState } from 'react';
import { FiSearch, FiFilter, FiEdit2, FiEye } from 'react-icons/fi';


const UserTable = ({ users, onSelectUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  // const [filters, setFilters] = useState({
  //   verified: false,
  //   active: false,
  //   kycPending: false
  // });

  // Ensure users is always an array
  const safeUsers = Array.isArray(users) ? users : [];

  const filteredUsers = safeUsers.filter(user => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase());
    // const matchesFilters = 
    //   (!filters.verified || user.verified) &&
    //   (!filters.active || user.status === 'active') &&
    //   (!filters.kycPending || user.kycStatus === 'pending');
    return matchesSearch; // && matchesFilters;
  });

  // Ensure all users have an 'id' property for consistency
  const normalizedUsers = filteredUsers.map(user => ({ ...user, id: user.id || user._id }));
  // Remove duplicate users by id
  const uniqueUsers = Array.from(new Map(normalizedUsers.map(u => [u.id, u])).values());

  return (
    <div className="theme-aware-bg rounded-xl p-6 theme-aware-border">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="relative w-full md:w-64">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2 theme-aware-bg-secondary theme-aware-text rounded-lg focus:outline-none focus:ring-2 focus:ring-gold border theme-aware-border" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600">
            <FiFilter className="mr-2" /> Filters
          </button>
          <select className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-2 focus:outline-none border border-gray-300 dark:border-gray-600">
            <option>Export</option>
            <option>CSV</option>
            <option>PDF</option>
          </select>
        </div>
      </div>

      <div className="hidden md:block overflow-x-auto rounded-lg theme-aware-border theme-aware-bg-tertiary">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-left">
              <th className="pb-4 px-4 text-gray-900 dark:text-gray-100 font-semibold">User</th>
              <th className="pb-4 px-4 text-gray-900 dark:text-gray-100 font-semibold">Email</th>
              <th className="pb-4 px-4 text-gray-900 dark:text-gray-100 font-semibold">Tier</th>
              <th className="pb-4 px-4 text-gray-900 dark:text-gray-100 font-semibold">KYC Status</th>
              <th className="pb-4 px-4 text-gray-900 dark:text-gray-100 font-semibold">Balance</th>
              <th className="pb-4 px-4 text-gray-900 dark:text-gray-100 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {uniqueUsers.map(user => (
              <tr key={user.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-900 dark:text-gray-100 transition-colors">
                <td className="py-4 px-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center mr-3 text-gray-700 dark:text-gray-300 font-semibold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{user.name}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">ID: {user.id}</div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-gray-700 dark:text-gray-300">{user.email}</td>
                <td className="py-4 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.tier === 'VIP' ? 'bg-purple-500 bg-opacity-20 text-purple-600 dark:text-purple-400' :
                    user.tier === 'Gold' ? 'bg-yellow-500 bg-opacity-20 text-yellow-600 dark:text-yellow-400' :
                    'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}>
                    {user.tier}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.kycStatus === 'verified' ? 'bg-green-500 bg-opacity-20 text-green-600 dark:text-green-400' :
                    user.kycStatus === 'pending' ? 'bg-yellow-500 bg-opacity-20 text-yellow-600 dark:text-yellow-400' :
                    'bg-red-500 bg-opacity-20 text-red-600 dark:text-red-400'
                  }`}>
                    {user.kycStatus}
                  </span>
                </td>
                <td className="py-4 px-4 font-mono text-gray-900 dark:text-gray-100">{
                  typeof user.balance === 'number' ? `$${user.balance.toLocaleString()}` : 'N/A'
                }</td>
                <td className="py-4 px-4">
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => onSelectUser(user)}
                      className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600"
                    >
                      <FiEye />
                    </button>
                    <button className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600">
                      <FiEdit2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="block md:hidden space-y-3">
        {uniqueUsers.map(user => (
          <div key={user.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-300 dark:border-gray-600">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <div className="font-semibold truncate text-gray-900 dark:text-gray-100">{user.name}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 truncate">{user.email}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">ID: {user.id}</div>
              </div>
              <div className="text-right ml-3">
                <div className="font-mono text-gray-900 dark:text-gray-100">{typeof user.balance === 'number' ? `$${user.balance.toLocaleString()}` : 'N/A'}</div>
                <div className={`mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${user.tier === 'VIP' ? 'bg-purple-500 bg-opacity-20 text-purple-600 dark:text-purple-400' : user.tier === 'Gold' ? 'bg-yellow-500 bg-opacity-20 text-yellow-600 dark:text-yellow-400' : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}>{user.tier}</div>
              </div>
            </div>
            <div className="mt-3 flex space-x-2">
              <button onClick={() => onSelectUser(user)} className="flex-1 p-2 bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-500">View</button>
              <button className="flex-1 p-2 bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-500">Edit</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserTable;
