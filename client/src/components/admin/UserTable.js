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
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 theme-aware-text-secondary" />
          <input
            type="text"
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2 theme-aware-bg-secondary theme-aware-text rounded-lg focus:outline-none focus:ring-2 focus:ring-gold border theme-aware-border" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="flex items-center px-4 py-2 theme-aware-bg-secondary theme-aware-text rounded-lg theme-aware-hover-bg border theme-aware-border">
            <FiFilter className="mr-2" /> Filters
          </button>
          <select className="theme-aware-bg-secondary theme-aware-text rounded-lg px-4 py-2 focus:outline-none border theme-aware-border">
            <option>Export</option>
            <option>CSV</option>
            <option>PDF</option>
          </select>
        </div>
      </div>

      <div className="hidden md:block overflow-x-auto rounded-lg theme-aware-border theme-aware-bg-tertiary">
        <table className="w-full">
          <thead>
            <tr className="border-b theme-aware-border-secondary theme-aware-bg-secondary text-left">
              <th className="pb-4 px-4 theme-aware-text font-semibold">User</th>
              <th className="pb-4 px-4 theme-aware-text font-semibold">Email</th>
              <th className="pb-4 px-4 theme-aware-text font-semibold">Tier</th>
              <th className="pb-4 px-4 theme-aware-text font-semibold">KYC Status</th>
              <th className="pb-4 px-4 theme-aware-text font-semibold">Balance</th>
              <th className="pb-4 px-4 theme-aware-text font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {uniqueUsers.map(user => (
              <tr key={user.id} className="border-b theme-aware-border-secondary theme-aware-hover-bg theme-aware-text transition-colors">
                <td className="py-4 px-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full theme-aware-bg-secondary flex items-center justify-center mr-3 theme-aware-text-secondary font-semibold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium theme-aware-text">{user.name}</div>
                      <div className="text-xs theme-aware-text-secondary">ID: {user.id}</div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 theme-aware-text-secondary">{user.email}</td>
                <td className="py-4 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.tier === 'VIP' ? 'bg-purple-500 bg-opacity-20 text-purple-600 dark:text-purple-400' :
                    user.tier === 'Gold' ? 'bg-yellow-500 bg-opacity-20 text-yellow-600 dark:text-yellow-400' :
                    'theme-aware-bg-secondary theme-aware-text-secondary'
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
                <td className="py-4 px-4 font-mono theme-aware-text">{
                  typeof user.balance === 'number' ? `$${user.balance.toLocaleString()}` : 'N/A'
                }</td>
                <td className="py-4 px-4">
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => onSelectUser(user)}
                      className="p-2 theme-aware-bg-secondary theme-aware-text rounded-lg theme-aware-hover-bg border theme-aware-border"
                    >
                      <FiEye />
                    </button>
                    <button className="p-2 theme-aware-bg-secondary theme-aware-text rounded-lg theme-aware-hover-bg border theme-aware-border">
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
          <div key={user.id} className="theme-aware-bg-secondary rounded-lg p-3 border theme-aware-border">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <div className="font-semibold truncate theme-aware-text">{user.name}</div>
                <div className="text-xs theme-aware-text-secondary truncate">{user.email}</div>
                <div className="text-xs theme-aware-text-secondary mt-1">ID: {user.id}</div>
              </div>
              <div className="text-right ml-3">
                <div className="font-mono theme-aware-text">{typeof user.balance === 'number' ? `$${user.balance.toLocaleString()}` : 'N/A'}</div>
                <div className={`mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${user.tier === 'VIP' ? 'bg-purple-500 bg-opacity-20 text-purple-600 dark:text-purple-400' : user.tier === 'Gold' ? 'bg-yellow-500 bg-opacity-20 text-yellow-600 dark:text-yellow-400' : 'theme-aware-bg-tertiary theme-aware-text-secondary'}`}>{user.tier}</div>
              </div>
            </div>
            <div className="mt-3 flex space-x-2">
              <button onClick={() => onSelectUser(user)} className="flex-1 p-2 theme-aware-bg-secondary theme-aware-text rounded-lg theme-aware-hover-bg border theme-aware-border">View</button>
              <button className="flex-1 p-2 theme-aware-bg-secondary theme-aware-text rounded-lg theme-aware-hover-bg border theme-aware-border">Edit</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserTable;
