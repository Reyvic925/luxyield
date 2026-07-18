// src/pages/admin/AdminDeposits.js
import React, { useEffect, useState } from 'react';
import { getAdminDeposits, updateAdminDeposit } from '../../services/adminDepositsAPI';
import { useNavigate } from 'react-router-dom';

const AdminDeposits = () => {
  const navigate = useNavigate();
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionStatus, setActionStatus] = useState('');

  useEffect(() => {
    // Redirect to login if no adminToken
    if (!localStorage.getItem('adminToken')) {
      navigate('/admin/login');
      return;
    }
    fetchDeposits();
  }, [navigate]); // Add 'navigate' to dependency array

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const res = await getAdminDeposits();
      setDeposits(res);
    } catch (err) {
      setError('Failed to fetch deposits');
    }
    setLoading(false);
  };

  const handleAction = async (id, status) => {
    setActionStatus('');
    try {
      await updateAdminDeposit(id, { status });
      setActionStatus(`Deposit ${status}`);
      fetchDeposits();
    } catch (err) {
      setActionStatus('Action failed');
    }
  };

  return (
    <div className="p-2 sm:p-4 md:p-6 min-h-screen w-full max-w-full sm:max-w-4xl mx-auto bg-gray-900 overflow-x-auto">
      <h1 className="text-2xl font-bold mb-4 text-white">Admin: Deposits</h1>
      {loading ? (
        <div className="text-white">Loading...</div>
      ) : error ? (
        <div className="text-red-400 font-semibold">{error}</div>
      ) : (
        <>
          <div className="space-y-4 md:hidden">
            {deposits.length === 0 ? (
              <div className="text-gray-400">No deposits found.</div>
            ) : deposits.map((dep) => (
              <div key={dep._id} className="rounded-xl border border-gray-700 bg-gray-900 p-4">
                <div className="mb-3">
                  <div className="text-sm text-gray-400">User</div>
                  <div className="text-white font-semibold break-words">{dep.user?.email || dep.user?.username || dep.user?.name}</div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-gray-300">
                  <div>
                    <div className="text-gray-400">Amount</div>
                    <div className="text-white break-words">{dep.amount}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Currency</div>
                    <div className="text-white break-words">{dep.currency}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Status</div>
                    <div className="text-white capitalize break-words">{dep.status}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Method</div>
                    <div className="text-white break-words">{dep.method}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-gray-400">Created</div>
                    <div className="text-white break-words">{new Date(dep.createdAt).toLocaleString()}</div>
                  </div>
                </div>
                {dep.status === 'pending' && (
                  <div className="mt-4 flex flex-col gap-2">
                    <button className="w-full bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 transition font-semibold" onClick={() => handleAction(dep._id, 'confirmed')}>Approve</button>
                    <button className="w-full bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 transition font-semibold" onClick={() => handleAction(dep._id, 'rejected')}>Reject</button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-700 min-w-0">
            <table className="w-full min-w-full table-auto text-sm whitespace-normal">
              <thead className="bg-gray-700">
                <tr>
                  <th className="w-2/6 py-3 px-4 border-b border-gray-600 font-semibold text-gray-100 text-left">User</th>
                  <th className="w-1/6 py-3 px-4 border-b border-gray-600 font-semibold text-gray-100">Amount</th>
                  <th className="w-1/6 py-3 px-4 border-b border-gray-600 font-semibold text-gray-100">Currency</th>
                  <th className="w-1/6 py-3 px-4 border-b border-gray-600 font-semibold text-gray-100">Status</th>
                  <th className="w-1/6 py-3 px-4 border-b border-gray-600 font-semibold text-gray-100">Method</th>
                  <th className="w-1/6 py-3 px-4 border-b border-gray-600 font-semibold text-gray-100">Created</th>
                  <th className="w-1/6 py-3 px-4 border-b border-gray-600 font-semibold text-gray-100">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map((dep, idx) => (
                  <tr key={dep._id} className={`text-center ${idx % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800'} hover:bg-gray-700 transition`}>
                    <td className="py-3 px-4 border-b border-gray-700 font-bold break-words text-left text-white">{dep.user?.email || dep.user?.username || dep.user?.name}</td>
                    <td className="py-3 px-4 border-b border-gray-700 text-gray-200 break-words">{dep.amount}</td>
                    <td className="py-3 px-4 border-b border-gray-700 text-gray-200 break-words">{dep.currency}</td>
                    <td className="py-3 px-4 border-b border-gray-700 capitalize text-gray-200 break-words">{dep.status}</td>
                    <td className="py-3 px-4 border-b border-gray-700 text-gray-200 break-words">{dep.method}</td>
                    <td className="py-3 px-4 border-b border-gray-700 text-gray-200 break-words">{new Date(dep.createdAt).toLocaleString()}</td>
                    <td className="py-3 px-4 border-b border-gray-700">
                      {dep.status === 'pending' && (
                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                          <button className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition font-semibold" onClick={() => handleAction(dep._id, 'confirmed')}>Approve</button>
                          <button className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition font-semibold" onClick={() => handleAction(dep._id, 'rejected')}>Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {actionStatus && <div className="mt-4 text-blue-600">{actionStatus}</div>}
    </div>
  );
};

export default AdminDeposits;

