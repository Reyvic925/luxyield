// src/pages/admin/UserInvestmentsAdmin.js
import React, { useState } from 'react';
import axios from 'axios';

const UserInvestmentsAdmin = () => {
  const [userId, setUserId] = useState('');
  const [investments, setInvestments] = useState([]);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});

  const fetchInvestments = async () => {
    const res = await axios.get(`/api/admin/user-investments/${userId}`);
    setInvestments(res.data);
  };

  const handleEdit = (inv) => {
    setEditing(inv._id);
    setEditForm({ ...inv });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    await axios.put(`/api/admin/user-investments/${editing}`, editForm);
    setEditing(null);
    fetchInvestments();
  };

  const [gainLossAmount, setGainLossAmount] = useState('');
  const [gainLossType, setGainLossType] = useState('gain');

  const handleSetGainLoss = async (id) => {
    if (!gainLossAmount || isNaN(gainLossAmount)) return;
    await axios.post(`/api/admin/investment/${id}/set-gain-loss`, {
      amount: parseFloat(gainLossAmount),
      type: gainLossType
    });
    setGainLossAmount('');
    fetchInvestments();
  };

  const handleComplete = async (id) => {
    await axios.post(`/api/admin/user-investments/${id}/complete`);
    fetchInvestments();
  };

  return (
      <div className="w-full max-w-full sm:max-w-4xl mx-auto p-2 sm:p-6 overflow-x-auto">
      <h1 className="text-2xl font-bold mb-4">User Investments Admin</h1>
      <div className="mb-4 flex flex-col sm:flex-row gap-2">
        <input className="flex-1 p-2 border rounded bg-gray-800 text-white border-gray-700 focus:border-gold outline-none" placeholder="User ID" value={userId} onChange={e => setUserId(e.target.value)} />
        <button className="bg-gold text-black px-4 py-2 rounded font-semibold hover:bg-yellow-400 transition" onClick={fetchInvestments}>Fetch Investments</button>
      </div>
      <div className="space-y-4 md:hidden mb-6">
        {investments.length === 0 ? (
          <div className="text-gray-400">No investments found.</div>
        ) : investments.map(inv => (
          <div key={inv._id} className="rounded-xl border border-gray-700 bg-gray-900 p-4">
            <div className="mb-3">
              <div className="text-sm text-gray-400">ID</div>
              <div className="text-white font-semibold break-words">{inv._id}</div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-300">
              <div>
                <div className="text-gray-400">Plan</div>
                <div className="text-white break-words">{inv.planName}</div>
              </div>
              <div>
                <div className="text-gray-400">Status</div>
                <div className="text-white capitalize break-words">{inv.status}</div>
              </div>
              <div>
                <div className="text-gray-400">Amount</div>
                <div className="text-white break-words">{inv.amount}</div>
              </div>
              <div>
                <div className="text-gray-400">Current Value</div>
                <div className="text-white break-words">{inv.currentValue}</div>
              </div>
            </div>
            <div className="mt-4 grid gap-2">
              <button className="w-full text-blue-600 font-semibold text-left hover:underline" onClick={() => handleEdit(inv)}>Edit</button>
              <button className="w-full text-green-600 font-semibold text-left hover:underline" onClick={() => handleComplete(inv._id)}>Complete</button>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <input className="p-2 border rounded w-full bg-gray-800 text-white border-gray-700 focus:border-gold outline-none" type="number" placeholder="Gain/Loss $" value={gainLossAmount} onChange={e => setGainLossAmount(e.target.value)} />
                <select className="p-2 border rounded w-full bg-gray-800 text-white border-gray-700 focus:border-gold outline-none" value={gainLossType} onChange={e => setGainLossType(e.target.value)}>
                  <option value="gain">Gain</option>
                  <option value="loss">Loss</option>
                </select>
                <button className="w-full text-red-600 font-semibold text-left hover:underline" onClick={() => handleSetGainLoss(inv._id)}>Set</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-700 mb-6 min-w-0">
        <table className="w-full min-w-full table-auto text-sm whitespace-normal">
          <thead>
            <tr className="border-b border-gray-700 bg-gray-900 text-left">
              <th className="w-1/5 py-3 px-4 font-semibold">ID</th>
              <th className="w-1/5 py-3 px-4 font-semibold">Plan</th>
              <th className="w-1/6 py-3 px-4 font-semibold">Amount</th>
              <th className="w-1/6 py-3 px-4 font-semibold">Current Value</th>
              <th className="w-1/6 py-3 px-4 font-semibold">Status</th>
              <th className="w-1/5 py-3 px-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {investments.map(inv => (
              <tr key={inv._id} className="border-b border-gray-800 hover:bg-gray-800 transition">
                <td className="py-3 px-4 break-words max-w-[8rem]">{inv._id}</td>
                <td className="py-3 px-4 break-words">{inv.planName}</td>
                <td className="py-3 px-4 break-words">{inv.amount}</td>
                <td className="py-3 px-4 break-words">{inv.currentValue}</td>
                <td className="py-3 px-4 capitalize break-words">{inv.status}</td>
                <td className="py-3 px-4 flex flex-col sm:flex-row flex-wrap gap-2 items-start">
                  <button className="text-blue-600 font-semibold hover:underline" onClick={() => handleEdit(inv)}>Edit</button>
                  <button className="text-green-600 font-semibold hover:underline" onClick={() => handleComplete(inv._id)}>Complete</button>
                  <input className="p-1 border rounded w-full sm:w-20 bg-gray-800 text-white border-gray-700 focus:border-gold outline-none" type="number" placeholder="Gain/Loss $" value={gainLossAmount} onChange={e => setGainLossAmount(e.target.value)} />
                  <select className="p-1 border rounded w-full sm:w-auto bg-gray-800 text-white border-gray-700 focus:border-gold outline-none" value={gainLossType} onChange={e => setGainLossType(e.target.value)}>
                    <option value="gain">Gain</option>
                    <option value="loss">Loss</option>
                  </select>
                  <button className="text-red-600 font-semibold hover:underline" onClick={() => handleSetGainLoss(inv._id)}>Set</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && (
        <form onSubmit={handleEditSubmit} className="mb-6 space-y-2 bg-gray-900 p-2 sm:p-4 rounded-lg border border-gray-700 overflow-x-auto">
          <h2 className="text-lg font-bold text-gold mb-2">Edit Investment</h2>
          <input className="w-full p-2 border rounded bg-gray-800 text-white border-gray-700 focus:border-gold outline-none" type="number" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: e.target.value })} />
          <input className="w-full p-2 border rounded bg-gray-800 text-white border-gray-700 focus:border-gold outline-none" type="number" value={editForm.currentValue} onChange={e => setEditForm({ ...editForm, currentValue: e.target.value })} />
          <select className="w-full p-2 border rounded bg-gray-800 text-white border-gray-700 focus:border-gold outline-none" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <button className="bg-gold text-black px-4 py-2 rounded font-semibold hover:bg-yellow-400 transition" type="submit">Save</button>
            <button className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600 transition" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default UserInvestmentsAdmin;


