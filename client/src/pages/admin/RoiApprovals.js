import React, { useState, useEffect } from 'react';
import { getRoiWithdrawals, approveRoiWithdrawal, rejectRoiWithdrawal } from '../../services/roiAPI';

const RoiApprovals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getRoiWithdrawals();
        setWithdrawals(data);
      } catch (e) {
        setError(e?.message || 'Failed to fetch ROI withdrawals');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleApprove = async (id) => {
    await approveRoiWithdrawal(id);
    setWithdrawals(withdrawals.filter(w => w._id !== id));
  };
  const handleReject = async (id) => {
    await rejectRoiWithdrawal(id);
    setWithdrawals(withdrawals.filter(w => w._id !== id));
  };

  return (
    <div className="p-2 sm:p-4 md:p-6 w-full max-w-full sm:max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">ROI Withdrawals Pending Approval</h2>
      {error && <div className="text-red-400 mb-4">{error}</div>}
      {loading ? <div>Loading...</div> : (
        <>
          <div className="space-y-4 md:hidden">
            {withdrawals.length === 0 ? (
              <div className="text-gray-400">No ROI withdrawals found.</div>
            ) : withdrawals.map(w => (
              <div key={w._id} className="rounded-xl border border-gray-700 bg-gray-900 p-4">
                <div className="mb-3">
                  <div className="text-sm text-gray-400">User</div>
                  <div className="text-white font-semibold break-words">{w.userId?.email || w.userId}</div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-gray-300">
                  <div>
                    <div className="text-gray-400">Amount</div>
                    <div className="text-white break-words">{w.amount}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Date</div>
                    <div className="text-white break-words">{new Date(w.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-gray-400">Status</div>
                    <div className="text-white capitalize break-words">{w.status}</div>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  <button className="w-full bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition" onClick={() => handleApprove(w._id)}>Approve</button>
                  <button className="w-full bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 transition" onClick={() => handleReject(w._id)}>Reject</button>
                </div>
              </div>
            ))}
          </div>
          <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-700 min-w-0">
            <table className="w-full min-w-full table-auto text-sm whitespace-normal">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-900 text-left">
                  <th className="w-1/4 py-3 px-4 font-semibold">User</th>
                  <th className="w-1/6 py-3 px-4 font-semibold">Amount</th>
                  <th className="w-1/4 py-3 px-4 font-semibold">Date</th>
                  <th className="w-1/6 py-3 px-4 font-semibold">Status</th>
                  <th className="w-1/6 py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map(w => (
                  <tr key={w._id} className="border-b border-gray-800 hover:bg-gray-800 transition">
                    <td className="py-3 px-4 break-words max-w-[10rem]">{w.userId?.email || w.userId}</td>
                    <td className="py-3 px-4 break-words">{w.amount}</td>
                    <td className="py-3 px-4 break-words">{new Date(w.createdAt).toLocaleString()}</td>
                    <td className="py-3 px-4 capitalize break-words">{w.status}</td>
                    <td className="py-3 px-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
                      <button className="bg-green-600 px-3 py-1 rounded text-white font-semibold hover:bg-green-700 transition" onClick={() => handleApprove(w._id)}>Approve</button>
                      <button className="bg-red-600 px-3 py-1 rounded text-white font-semibold hover:bg-red-700 transition" onClick={() => handleReject(w._id)}>Reject</button>
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

export default RoiApprovals;

