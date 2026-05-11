// src/pages/admin/Users.js
import React, { useState, useEffect } from 'react';
import EnhancedUserTable from '../../components/admin/EnhancedUserTable';
import UserDetail from '../../components/admin/UserDetail';
import { getUsers, updateUser } from '../../services/adminAPI';
import { FiChevronDown, FiChevronUp, FiEdit } from 'react-icons/fi';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

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
        console.warn('User ID is undefined');
        return;
      }
      const user = await updateUser(userId, updatedUser);
      setUsers(users.map(u => (u.id || u._id) === (user.id || user._id) ? user : u));
      setSelectedUser(null);
      setExpandedId(null);
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8 min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div>
        <span className="ml-3 text-gray-300">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-900 overflow-auto">
      <div className="p-3 sm:p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">User Management</h1>
          <input
            type="text"
            placeholder="Search by email, name, or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-gold focus:outline-none"
          />
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-900 bg-opacity-30 text-red-300 p-4 rounded-lg border border-red-700 mb-4">
            {error}
          </div>
        )}

        {/* Desktop Table View */}
        {!error && (
          <>
            <div className="hidden md:block">
              <EnhancedUserTable
                users={filteredUsers}
                onSelectUser={setSelectedUser}
                onUpdateUser={handleUpdateUser}
              />
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {filteredUsers.map((user) => (
                <div key={user._id} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                  {/* Card Header */}
                  <button
                    onClick={() => setExpandedId(expandedId === user._id ? null : user._id)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-750 transition"
                  >
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-white text-sm">{user.email}</p>
                      <p className="text-gray-400 text-xs mt-1">{user.name || 'No name'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-gold text-black whitespace-nowrap">
                        {user.tier || 'Starter'}
                      </span>
                      {expandedId === user._id ? <FiChevronUp /> : <FiChevronDown />}
                    </div>
                  </button>

                  {/* Card Expanded Content */}
                  {expandedId === user._id && (
                    <div className="bg-gray-850 px-4 py-3 border-t border-gray-700 space-y-3">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Username:</span>
                          <span className="text-gray-200">{user.username || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Email Verified:</span>
                          <span className={`font-semibold ${user.isEmailVerified ? 'text-green-400' : 'text-red-400'}`}>
                            {user.isEmailVerified ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">KYC Status:</span>
                          <span className={`font-semibold ${
                            user.kyc?.status === 'verified' ? 'text-green-400' :
                            user.kyc?.status === 'pending' ? 'text-yellow-400' :
                            user.kyc?.status === 'rejected' ? 'text-red-400' :
                            'text-gray-400'
                          }`}>
                            {user.kyc?.status || 'not_submitted'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Deposit Balance:</span>
                          <span className="text-gray-200">${user.depositBalance?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Available:</span>
                          <span className="text-gold font-semibold">${user.availableBalance?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Locked:</span>
                          <span className="text-orange-400">${user.lockedBalance?.toFixed(2) || '0.00'}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedUser(user)}
                        className="w-full bg-gold hover:bg-yellow-500 text-black px-4 py-2 rounded font-semibold text-sm transition flex items-center justify-center gap-2"
                      >
                        <FiEdit size={16} /> View Details
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* No Results */}
        {!loading && !error && filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No users found
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
