// src/pages/admin/Users.js
import React, { useState, useEffect } from 'react';
import EnhancedUserTable from '../../components/admin/EnhancedUserTable';
import UserDetail from '../../components/admin/UserDetail';
import { getUsers, updateUser } from '../../services/adminAPI';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await getUsers();
        setUsers(data);
        setError(null);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        setError('Failed to load users. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleUpdateUser = async (updatedUser) => {
    try {
      const userId = updatedUser.id || updatedUser._id;
      if (!userId) {
        console.warn('User ID is undefined in handleUpdateUser:', updatedUser);
        return;
      }
      const user = await updateUser(userId, updatedUser);
      setUsers(users.map(u => (u.id || u._id) === (user.id || user._id) ? user : u));
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const handleBalanceOrInvestmentUpdate = (updatedData) => {
    if (!updatedData) return;

    if (updatedData.user) {
      // Update for balance changes
      setUsers(users.map(u => (u.id || u._id) === (updatedData.user.id || updatedData.user._id) 
        ? { 
            ...u, 
            balance: updatedData.user.balance,
            availableBalance: updatedData.user.availableBalance,
            lockedBalance: updatedData.user.lockedBalance
          }
        : u
      ));
    } else if (updatedData.adjustments) {
      // Update for investment changes
      const userId = selectedUser?.id || selectedUser?._id;
      if (!userId) return;

      setUsers(users.map(u => (u.id || u._id) === userId
        ? {
            ...u,
            investments: u.investments?.map(inv => {
              const adjustment = updatedData.adjustments.find(adj => adj.investmentId === (inv.id || inv._id));
              if (adjustment) {
                return { ...inv, currentValue: adjustment.newValue };
              }
              return inv;
            }) || []
          }
        : u
      ));
    }
  };

  return (
    <div className="w-full flex-1 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">User Management</h1>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-400">Loading users...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500 bg-opacity-20 text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* User Table */}
      {!loading && !error && (
        <EnhancedUserTable
          users={users}
          onSelectUser={setSelectedUser}
          onUpdateUser={handleBalanceOrInvestmentUpdate}
        />
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <UserDetail
              user={selectedUser}
              onClose={() => setSelectedUser(null)}
              onUpdate={handleUpdateUser}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;