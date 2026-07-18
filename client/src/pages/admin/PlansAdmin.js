// src/pages/admin/PlansAdmin.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const PlansAdmin = () => {
  const [plans, setPlans] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', percentReturn: 150, durationDays: 4, minInvestment: 10, maxInvestment: 10000, isActive: true });
  const [loading, setLoading] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    const res = await axios.get('/api/admin/plans');
    setPlans(res.data);
    setLoading(false);
  };

  useEffect(() => { fetchPlans(); }, []);

  const handleEdit = (plan) => {
    setEditing(plan._id);
    setForm({ ...plan });
  };

  const handleDelete = async (id) => {
    await axios.delete(`/api/admin/plans/${id}`);
    fetchPlans();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      await axios.put(`/api/admin/plans/${editing}`, form);
    } else {
      await axios.post('/api/admin/plans', form);
    }
    setEditing(null);
    setForm({ name: '', percentReturn: 150, durationDays: 4, minInvestment: 10, maxInvestment: 10000, isActive: true });
    fetchPlans();
  };

  return (
    <div className="w-full min-w-0 max-w-full sm:max-w-2xl mx-auto p-2 sm:p-4 md:p-6 overflow-x-auto">
      <h1 className="text-2xl font-bold mb-4">Investment Plans Admin</h1>
      <form onSubmit={handleSubmit} className="mb-6 space-y-2 bg-gray-900 p-4 rounded-lg border border-gray-700">
        <input className="w-full p-2 border rounded bg-gray-800 text-white border-gray-700 focus:border-gold outline-none" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        <input className="w-full p-2 border rounded bg-gray-800 text-white border-gray-700 focus:border-gold outline-none" type="number" placeholder="% Return" value={form.percentReturn} onChange={e => setForm({ ...form, percentReturn: e.target.value })} required />
        <input className="w-full p-2 border rounded bg-gray-800 text-white border-gray-700 focus:border-gold outline-none" type="number" placeholder="Duration (days)" value={form.durationDays} onChange={e => setForm({ ...form, durationDays: e.target.value })} required />
        <input className="w-full p-2 border rounded bg-gray-800 text-white border-gray-700 focus:border-gold outline-none" type="number" placeholder="Min Investment" value={form.minInvestment} onChange={e => setForm({ ...form, minInvestment: e.target.value })} />
        <input className="w-full p-2 border rounded bg-gray-800 text-white border-gray-700 focus:border-gold outline-none" type="number" placeholder="Max Investment" value={form.maxInvestment} onChange={e => setForm({ ...form, maxInvestment: e.target.value })} />
        <label className="flex items-center gap-2 text-white"><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
        <div className="flex flex-col sm:flex-row gap-2 mt-2">
          <button className="bg-gold text-black px-4 py-2 rounded font-semibold hover:bg-yellow-400 transition" type="submit">{editing ? 'Update' : 'Create'} Plan</button>
          {editing && <button className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600 transition" onClick={() => setEditing(null)}>Cancel</button>}
        </div>
      </form>
      {loading ? <div>Loading...</div> : (
        <>
          <div className="space-y-4 md:hidden">
            {plans.length === 0 ? (
              <div className="text-gray-400">No plans found.</div>
            ) : (
              plans.map(plan => (
                <div key={plan._id} className="rounded-xl border border-gray-700 bg-gray-900 p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold text-white break-words">{plan.name}</h2>
                      <p className="text-sm text-gray-400 mt-1">% Return: <span className="text-white">{plan.percentReturn}</span></p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${plan.isActive ? 'bg-green-600 text-green-100' : 'bg-red-600 text-red-100'}`}>{plan.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-gray-300">
                    <div><span className="text-gray-400">Days:</span> <span className="text-white">{plan.durationDays}</span></div>
                    <div><span className="text-gray-400">Min:</span> <span className="text-white">{plan.minInvestment}</span></div>
                    <div><span className="text-gray-400">Max:</span> <span className="text-white">{plan.maxInvestment}</span></div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button className="text-blue-500 font-semibold hover:underline" onClick={() => handleEdit(plan)}>Edit</button>
                    <button className="text-red-500 font-semibold hover:underline" onClick={() => handleDelete(plan._id)}>Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-700 min-w-0">
            <table className="w-full min-w-full table-auto text-sm whitespace-normal">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-900 text-left">
                  <th className="w-3/12 py-3 px-4 font-semibold">Name</th>
                  <th className="w-1/12 py-3 px-4 font-semibold">% Return</th>
                  <th className="w-1/12 py-3 px-4 font-semibold">Days</th>
                  <th className="w-1/12 py-3 px-4 font-semibold">Min</th>
                  <th className="w-1/12 py-3 px-4 font-semibold">Max</th>
                  <th className="w-1/12 py-3 px-4 font-semibold">Active</th>
                  <th className="w-2/12 py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map(plan => (
                  <tr key={plan._id} className="border-b border-gray-800 hover:bg-gray-800 transition">
                    <td className="py-3 px-4 break-words">{plan.name}</td>
                    <td className="py-3 px-4 break-words">{plan.percentReturn}</td>
                    <td className="py-3 px-4 break-words">{plan.durationDays}</td>
                    <td className="py-3 px-4 break-words">{plan.minInvestment}</td>
                    <td className="py-3 px-4 break-words">{plan.maxInvestment}</td>
                    <td className="py-3 px-4 break-words">{plan.isActive ? 'Yes' : 'No'}</td>
                    <td className="py-3 px-4 flex flex-col sm:flex-row gap-2">
                      <button className="text-blue-600 font-semibold hover:underline" onClick={() => handleEdit(plan)}>Edit</button>
                      <button className="text-red-600 font-semibold hover:underline" onClick={() => handleDelete(plan._id)}>Delete</button>
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

export default PlansAdmin;


