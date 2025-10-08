// src/pages/admin/Users.js
import React, { useState, useEffect } from 'react';
import UserTable from '../../components/admin/UserTable';
import UserDetail from '../../components/admin/UserDetail';
import { FiRefreshCw, FiAlertCircle } from 'react-icons/fi';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        throw new Error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
  };

  const handleUserUpdate = async ({ userId, amount, operation }) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/adjust-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, amount, operation })
      });

      if (response.ok) {
        // Update the user in the local state
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user._id === userId 
              ? { 
                  ...user, 
                  availableBalance: operation === 'add' 
                    ? user.availableBalance + amount 
                    : user.availableBalance - amount 
                }
              : user
          )
        );
      } else {
        throw new Error('Failed to update balance');
      }
    } catch (error) {
      console.error('Error updating user balance:', error);
      setError('Failed to update user balance. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400">Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <FiAlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-red-400 text-center">{error}</p>
        <button 
          onClick={handleRefresh}
          className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-all duration-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-gray-400 mt-1">Manage user accounts and monitor platform activity</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 transition-all duration-200 disabled:opacity-50"
        >
          <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className={selectedUser ? "xl:col-span-3" : "xl:col-span-4"}>
          <UserTable 
            users={users}
            onUserUpdate={handleUserUpdate}
          />
        </div>
        
        {selectedUser && (
          <div className="xl:col-span-1">
            <div className="sticky top-6">
              <UserDetail 
                user={selectedUser}
                onClose={() => setSelectedUser(null)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;