import React, { useState, useEffect } from 'react';
import { getRoiWithdrawals, updateRoiWithdrawalStatus } from '../../services/roiAPI';
import axios from '../../utils/axios';

// Only show activation fee (unlock) actions on the ROI approvals page
const getRoiActionForStatus = (status) => {
  if (['pending', 'awaiting_activation_fee', 'activation_fee_paid', 'activation_fee_rejected'].includes(status)) {
    return { approve: 'activation_fee_approved', reject: 'activation_fee_rejected', approveLabel: 'Approve Activation Fee (Unlock)', rejectLabel: 'Reject Activation Fee' };
  }
  // For interest tax / network fee stages, do not show actions here — these belong on the main Withdrawals page
  return null;
};

const RoiApprovals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('7days');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getRoiWithdrawals(dateRange);
        setWithdrawals(data.map(w => ({ ...w, id: w.id || w._id })));
      } catch (e) {
        setError(e?.message || 'Failed to fetch ROI withdrawals');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange]);

  const handleUpdate = async (id, status) => {
    await updateRoiWithdrawalStatus(id, status);
    setWithdrawals(withdrawals.filter(w => (w.id || w._id) !== id));
  };

  const handleMarkActivationPaid = async (id) => {
    const input = window.prompt('Enter activation fee amount to mark as paid');
    const amt = Number(input);
    if (!amt || amt <= 0) return alert('Invalid amount');
    try {
      await axios.post(`/api/admin/withdrawals/${id}/mark-activation-paid`, { amount: amt });
      // refresh list
      const data = await getRoiWithdrawals(dateRange);
      setWithdrawals(data.map(w => ({ ...w, id: w.id || w._id })));
      alert('Marked activation fee as paid');
    } catch (err) {
      console.error('Mark activation fee failed', err.response || err.message);
      alert('Failed to mark activation fee: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="p-2 sm:p-4 md:p-6 w-full max-w-full sm:max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">ROI Withdrawals Pending Approval</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Date Range</label>
          <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="bg-gray-800 text-white p-2 rounded">
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>
      {error && <div className="text-red-400 mb-4">{error}</div>}
      {loading ? <div>Loading...</div> : (
        <>
          <div className="space-y-4 md:hidden">
            {withdrawals.length === 0 ? (
              <div className="text-gray-400">No ROI withdrawals found.</div>
            ) : withdrawals.map(w => (
              <div key={w.id || w._id} className="rounded-xl border border-gray-700 bg-gray-900 p-4">
                <div className="mb-3">
                  <div className="text-sm text-gray-400">User</div>
                  <div className="text-white font-semibold break-words">{w.userEmail || w.userId}</div>
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
                  {(() => {
                    const action = getRoiActionForStatus(w.status);
                    if (!action) {
                      return <div className="text-gray-400 text-sm">Awaiting next step</div>;
                    }
                    return (
                      <>
                        <button
                          className="w-full bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition"
                          onClick={() => handleUpdate(w.id || w._id, action.approve)}
                        >
                          {action.approveLabel}
                        </button>
                        <button
                          className="w-full bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 transition"
                          onClick={() => handleUpdate(w.id || w._id, action.reject)}
                        >
                          {action.rejectLabel}
                        </button>
                        <button
                          className="w-full bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition"
                          onClick={() => handleMarkActivationPaid(w.id || w._id)}
                        >
                          Mark Activation Paid
                        </button>
                      </>
                    );
                  })()}
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
                  <tr key={w.id || w._id} className="border-b border-gray-800 hover:bg-gray-800 transition">
                    <td className="py-3 px-4 break-words max-w-[10rem]">{w.userEmail || w.userId}</td>
                    <td className="py-3 px-4 break-words">{w.amount}</td>
                    <td className="py-3 px-4 break-words">{new Date(w.createdAt).toLocaleString()}</td>
                    <td className="py-3 px-4 capitalize break-words">{w.status}</td>
                    <td className="py-3 px-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
                      {(() => {
                        const action = getRoiActionForStatus(w.status);
                        if (!action) {
                          return <span className="text-gray-400 text-sm">Awaiting next step</span>;
                        }
                        return (
                          <>
                            <button
                              className="bg-green-600 px-3 py-1 rounded text-white font-semibold hover:bg-green-700 transition"
                              onClick={() => handleUpdate(w.id || w._id, action.approve)}
                            >
                              {action.approveLabel}
                            </button>
                            <button
                              className="bg-red-600 px-3 py-1 rounded text-white font-semibold hover:bg-red-700 transition"
                              onClick={() => handleUpdate(w.id || w._id, action.reject)}
                            >
                              {action.rejectLabel}
                            </button>
                            <button
                              className="bg-blue-600 px-3 py-1 rounded text-white font-semibold hover:bg-blue-700 transition"
                              onClick={() => handleMarkActivationPaid(w.id || w._id)}
                            >
                              Mark Activation Paid
                            </button>
                          </>
                        );
                      })()}
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


