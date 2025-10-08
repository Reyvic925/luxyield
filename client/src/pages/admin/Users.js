// src/pages/admin/Users.js
import React, { useState, useEffect } from 'react';
import UserTable from '../../components/admin/UserTable';
import UserDetail from '../../components/admin/UserDetail';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import BalanceManagementModal from '../../components/admin/BalanceManagementModal';
import { getUsers, updateUser, updateUserBalance } from '../../services/adminAPI';
import { FiUserPlus, FiDownload } from 'react-icons/fi';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [balanceUser, setBalanceUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getUsers();
        setUsers(data);
      } catch (error) {
        console.error('Failed to fetch users:', error);
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
      setUsers(users.map(u => u.id === user.id ? user : u));
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const actions = (
    <div className="flex items-center gap-3">
      <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-700/50 border border-gray-600/50 text-gray-200 rounded-lg text-sm hover:bg-gray-600/50 transition-colors">
        <FiDownload className="text-gold w-4 h-4" />
        <span>Export CSV</span>
      </button>
      <button className="flex items-center gap-2 px-4 py-2.5 bg-gold border border-gold/50 text-gray-900 rounded-lg text-sm hover:bg-gold/90 transition-colors">
        <FiUserPlus className="w-4 h-4" />
        <span>Add User</span>
      </button>
    </div>
  );

  if (loading) {
    return (
      <AdminPageLayout title="Users" actions={actions}>
        <div className="flex justify-center items-center h-[400px]">
          <div className="relative">
            <div className="h-12 w-12 border-4 border-gray-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 h-12 w-12 border-t-4 border-gold rounded-full animate-spin-slow"></div>
          </div>
        </div>
      </AdminPageLayout>
    );
  }

  const handleBalanceUpdate = async ({ userId, amount, operation }) => {
    try {
      // Convert amount to number and ensure positive value
      const numAmount = Math.abs(Number(amount));
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error('Please enter a valid amount greater than 0');
      }

      const updatedUser = await updateUserBalance(userId, numAmount, operation);
      
      // Format the updated user data
      const updatedUserData = {
        ...balanceUser,
        ...updatedUser,
        balance: Number(updatedUser.balance || 0),
        _id: updatedUser._id || updatedUser.id,
        id: updatedUser._id || updatedUser.id
      };

      // Update both the users list and the modal's user data
      setUsers(prevUsers => 
        prevUsers.map(u => 
          (u._id === userId || u.id === userId) ? updatedUserData : u
        )
      );
      setBalanceUser(updatedUserData);

      // Log successful update
      console.log('Balance updated successfully:', updatedUserData.balance);
    } catch (error) {
      console.error('Failed to update balance:', error);
      throw error;
    }
  };

  return (
    <AdminPageLayout title="Users" actions={actions}>
      <div className="p-8">

        <UserTable
          users={users}
          onSelectUser={setSelectedUser}
          onUpdateUser={handleUpdateUser}
          onManageBalance={(user) => {
            // Always use the latest user data from the users array
            const latestUser = users.find(u => (u._id === user._id || u.id === user.id));
            setBalanceUser(latestUser || user);
          }}
        />
        
        {selectedUser && (
          <UserDetail 
            user={selectedUser} 
            onClose={() => setSelectedUser(null)}
            onUpdate={handleUpdateUser}
          />
        )}

        {balanceUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
            <BalanceManagementModal 
              user={balanceUser}
              onClose={() => setBalanceUser(null)}
              onUpdate={handleBalanceUpdate}
            />
          </div>
        )}
      </div>
    </AdminPageLayout>
  );
};

export default AdminUsers;