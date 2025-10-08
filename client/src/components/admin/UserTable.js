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
      <div className="mb-8 flex justify-between items-center">
        <div className="w-80">
          <input
            type="text"
            placeholder="Search users..."
            className="w-full py-2 pl-8 bg-transparent border-b border-gray-700 text-white focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FiSearch className="absolute top-[11px] left-0 text-gray-400" />
        </div>
        <div className="flex items-center space-x-6">
          <button onClick={() => setViewMode('all')} 
            className={viewMode === 'all' ? 'text-gold' : 'text-gray-400'}>
            All Users
          </button>
          <button onClick={() => setViewMode('verified')} 
            className={viewMode === 'verified' ? 'text-green-400' : 'text-gray-400'}>
            Verified
          </button>
          <button onClick={() => setViewMode('pending')} 
            className={viewMode === 'pending' ? 'text-yellow-400' : 'text-gray-400'}>
            Pending KYC
          </button>
          <select className="bg-transparent text-white border-b border-gray-700 py-1">
            <option>Export</option>
            <option>CSV</option>
            <option>PDF</option>
          </select>
        </div>
      </div>

      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left py-4 font-normal text-gray-400">User</th>
            <th className="text-left py-4 font-normal text-gray-400">Email</th>
            <th className="text-left py-4 font-normal text-gray-400">Tier</th>
            <th className="text-left py-4 font-normal text-gray-400">KYC Status</th>
            <th className="text-left py-4 font-normal text-gray-400">Available Balance</th>
            <th className="text-left py-4 font-normal text-gray-400">Actions</th>
          </tr>
        </thead>
        <tbody>
          {uniqueUsers.map(user => (
            <tr key={user.id} className="border-t border-gray-800">
              <td className="py-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 flex items-center justify-center bg-gray-800 mr-3">
                    {user.name?.charAt(0)}
                  </div>
                  <div>
                    <div className="text-white">{user.name}</div>
                    <div className="text-sm text-gray-400">ID: {user.id}</div>
                  </div>
                </div>
              </td>
              <td className="py-4 text-white">{user.email}</td>
              <td className="py-4">
                <span className={
                  user.tier === 'VIP' ? 'text-purple-400' :
                  user.tier === 'Gold' ? 'text-gold' :
                  'text-gray-400'
                }>{user.tier}</span>
              </td>
              <td className="py-4">
                <span className={
                  user.kycStatus === 'verified' ? 'text-green-400' :
                  user.kycStatus === 'pending' ? 'text-yellow-400' :
                  'text-red-400'
                }>{user.kycStatus || 'Not Started'}</span>
              </td>
              <td className="py-4 text-white">
                {typeof user.availableBalance === 'number' ? `$${user.availableBalance.toLocaleString()}` : 
                 typeof user.balance === 'number' ? `$${user.balance.toLocaleString()}` : '$0.00'}
              </td>
              <td className="py-4">
                <div className="flex gap-4">
                  <button onClick={() => onSelectUser(user)} className="text-blue-400 hover:text-blue-300">
                    <FiEye />
                  </button>
                  <button onClick={() => onUpdateUser(user)} className="text-purple-400 hover:text-purple-300">
                    <FiEdit2 />
                  </button>
                  <button onClick={() => onManageBalance?.(user)} className="text-gold hover:text-gold/80">
                    <FiDollarSign />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

export default UserTable;
