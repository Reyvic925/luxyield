import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminUserList = ({ onSelectUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await axios.get('/api/admin/users');
      setUsers(res.data);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const filtered = users.filter(u => u.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-2 sm:p-4 md:p-6 w-full max-w-full sm:max-w-4xl mx-auto overflow-x-auto min-w-0">
      <h1 className="text-2xl font-bold mb-4">All Users</h1>
      <input
        className="mb-4 p-2 rounded bg-gray-800 text-white w-full border border-gray-700 focus:border-gold outline-none"
        placeholder="Search by email..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      {loading ? <div>Loading...</div> : (
        <>
          <div className="space-y-4 md:hidden">
            {filtered.length === 0 ? (
              <div className="text-gray-400">No users found.</div>
            ) : filtered.map(user => (
              <div key={user._id} className="rounded-xl border border-gray-700 bg-gray-900 p-4 shadow-sm">
                <div className="mb-2 break-words">
                  <div className="text-sm text-gray-400">Email</div>
                  <div className="text-white font-semibold break-words">{user.email}</div>
                </div>
                <div className="mb-2 break-words">
                  <div className="text-sm text-gray-400">Name</div>
                  <div className="text-white break-words">{user.name}</div>
                </div>
                <button className="bg-gold px-3 py-2 rounded text-black font-semibold hover:bg-yellow-400 transition w-full text-left" onClick={() => onSelectUser(user._id)}>Mirror</button>
              </div>
            ))}
          </div>
          <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-700 bg-gray-900 min-w-0">
            <table className="w-full min-w-full table-auto text-sm whitespace-normal">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-900 text-left">
                  <th className="w-1/3 py-3 px-4 font-semibold min-w-0">Email</th>
                  <th className="w-1/3 py-3 px-4 font-semibold min-w-0">Name</th>
                  <th className="w-1/3 py-3 px-4 font-semibold min-w-0">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => (
                  <tr key={user._id} className="border-b border-gray-800 hover:bg-gray-800 transition">
                    <td className="py-3 px-4 break-words max-w-[14rem] min-w-0">{user.email}</td>
                    <td className="py-3 px-4 break-words min-w-0">{user.name}</td>
                    <td className="py-3 px-4 min-w-0">
                      <button className="bg-gold px-3 py-1 rounded text-black font-semibold hover:bg-yellow-400 transition" onClick={() => onSelectUser(user._id)}>Mirror</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminUserList;


