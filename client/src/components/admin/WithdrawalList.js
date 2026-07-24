// src/components/admin/WithdrawalList.js
import React, { useState } from 'react';
import { FiDownload } from 'react-icons/fi';
import axios from '../../utils/axios';

const statusColors = {
  pending: 'bg-yellow-500 bg-opacity-20 text-yellow-400',
  completed: 'bg-green-500 bg-opacity-20 text-green-400',
  rejected: 'bg-red-500 bg-opacity-20 text-red-400'
};

const WithdrawalList = ({ withdrawals = [], onSelect, onExport }) => {
  const [expandedRows, setExpandedRows] = useState({});
  const [expandedAudits, setExpandedAudits] = useState({});

  const toggleAudit = async (id) => {
    // toggle collapsed/expanded
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));

    // if opening and no audits loaded, fetch them
    if (!expandedAudits[id]) {
      setExpandedAudits(prev => ({ ...prev, [id]: { loading: true, items: [] } }));
      try {
        const res = await axios.get(`/api/admin/withdrawals/${id}/audit`);
        setExpandedAudits(prev => ({ ...prev, [id]: { loading: false, items: res.data || [] } }));
      } catch (err) {
        setExpandedAudits(prev => ({ ...prev, [id]: { loading: false, items: [] } }));
        console.error('Failed to load audit', err);
      }
    }
  };

  return (
    <div className="w-full p-0 md:p-2 bg-gradient-to-br from-gray-950 to-gray-900 rounded-2xl shadow-2xl border border-gray-800">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4 flex-wrap">
        <h2 className="text-xl font-bold text-gold tracking-tight whitespace-nowrap">Withdrawals</h2>
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 bg-gold text-black font-semibold rounded-lg shadow hover:bg-yellow-400 transition whitespace-nowrap"
        >
          <FiDownload /> Export CSV
        </button>
      </div>
      <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-800 bg-gray-950">
        <table className="w-full text-sm min-w-full table-fixed">
        <thead>
          <tr className="bg-gray-900 border-b border-gray-800 text-left">
            <th className="py-4 px-4 w-36 font-semibold text-gray-300">ID</th>
            <th className="py-4 px-4 w-48 font-semibold text-gray-300">User</th>
            <th className="py-4 px-4 w-36 font-semibold text-gray-300">Amount</th>
            <th className="py-4 px-4 w-36 font-semibold text-gray-300">Activation Fee</th>
            <th className="py-4 px-4 w-36 font-semibold text-gray-300">Interest Tax</th>
            <th className="py-4 px-4 w-36 font-semibold text-gray-300">Network Fee</th>
            <th className="py-4 px-4 w-28 font-semibold text-gray-300">Network</th>
            <th className="py-4 px-4 w-64 font-semibold text-gray-300">Wallet</th>
            <th className="py-4 px-4 w-28 font-semibold text-gray-300">Date</th>
            <th className="py-4 px-4 w-36 font-semibold text-gray-300">Status</th>
            <th className="py-4 px-4 w-28 font-semibold text-gray-300">Actions</th>
          </tr>
        </thead>
        <tbody>
          {withdrawals.length === 0 ? (
            <tr>
              <td colSpan={11} className="py-12 text-center text-gray-500 text-lg">No withdrawals found.</td>
            </tr>
          ) : (
            withdrawals.map(wd => (
              <React.Fragment key={wd.id}>
              <tr className="border-b border-gray-800 hover:bg-gray-900 transition">
                <td className="py-3 px-4 font-mono text-xs text-gray-500 max-w-[160px] overflow-hidden truncate" title={wd.id}>{wd.id}</td>
                <td className="py-3 px-4 max-w-[220px]">
                  <div className="font-semibold text-gray-100 overflow-hidden truncate max-w-[220px]" title={wd.userId}>{wd.userId}</div>
                  {wd.userFullName && (
                    <div className="text-xs text-gray-400 overflow-hidden truncate max-w-[220px]" title={wd.userFullName}>{wd.userFullName}</div>
                  )}
                  <div className="text-xs text-gray-400 overflow-hidden truncate max-w-[220px]" title={wd.userEmail}>{wd.userEmail}</div>
                </td>
                <td className="py-3 px-4 font-mono text-gold font-bold overflow-hidden truncate">{Number(wd.amount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} {wd.currency}
                  {wd.type === 'roi' && (
                    <span className="ml-2 px-2 py-1 rounded bg-purple-700 text-white text-xs font-bold">ROI</span>
                  )}
                </td>
                <td className="py-3 px-4 text-xs text-gray-200 overflow-hidden truncate">
                  <div className="font-semibold" title={`Activation: ${(wd.activationFeeAmount || 0).toFixed(2)}`}>{(wd.activationFeeAmount || 0).toFixed(2)}</div>
                  <div className="text-xs text-gray-400" title={`paid: ${(wd.activationFeePaid || 0).toFixed(2)}`}>paid: {(wd.activationFeePaid || 0).toFixed(2)}</div>
                </td>
                <td className="py-3 px-4 text-xs text-gray-200 overflow-hidden truncate">
                  <div className="font-semibold" title={`Interest: ${(wd.interestTaxAmount || 0).toFixed(2)}`}>{(wd.interestTaxAmount || 0).toFixed(2)}</div>
                  <div className="text-xs text-gray-400" title={`paid: ${(wd.interestTaxPaid || 0).toFixed(2)}`}>paid: {(wd.interestTaxPaid || 0).toFixed(2)}</div>
                </td>
                <td className="py-3 px-4 text-xs text-gray-200 overflow-hidden truncate">
                  <div className="font-semibold" title={`Network: ${(wd.networkFeeAmount || 0).toFixed(2)}`}>{(wd.networkFeeAmount || 0).toFixed(2)}</div>
                  <div className="text-xs text-gray-400" title={`paid: ${(wd.networkFeePaid || 0).toFixed(2)}`}>paid: {(wd.networkFeePaid || 0).toFixed(2)}</div>
                </td>
                <td className="py-3 px-4 uppercase text-gray-300 truncate">{wd.network}</td>
                <td className={`py-3 px-4 font-mono text-xs overflow-hidden truncate max-w-[20rem] ${wd.walletAddress === 'DEFAULT_ADDRESS' ? 'text-red-500 font-bold' : 'text-gray-400'}`} title={wd.walletAddress}>{wd.walletAddress}</td>
                <td className="py-3 px-4 text-xs text-gray-500 truncate">{new Date(wd.createdAt).toLocaleDateString()}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusColors[wd.status]}`}>{wd.status}</span>
                </td>
                <td className="py-3 px-4 flex items-center gap-2">
                  {wd.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => onSelect(wd)}
                        className="px-4 py-1 bg-gold text-black rounded-lg font-semibold shadow hover:bg-yellow-400 transition whitespace-nowrap"
                      >
                        Review
                      </button>
                      <button onClick={() => toggleAudit(wd.id)} className="px-3 py-1 bg-gray-700 text-gray-200 rounded">History</button>
                    </>
                  ) : (
                    <>
                      <span className="text-gray-500">-</span>
                      <button onClick={() => toggleAudit(wd.id)} className="px-3 py-1 bg-gray-700 text-gray-200 rounded">History</button>
                    </>
                  )}
                </td>
              </tr>

              {expandedRows[wd.id] && (
                <tr className="bg-gray-850">
                  <td colSpan={11} className="py-3 px-4">
                    {expandedAudits[wd.id] && expandedAudits[wd.id].loading ? (
                      <div className="text-gray-400">Loading audit...</div>
                    ) : (
                      <div className="space-y-2">
                        {(expandedAudits[wd.id] && expandedAudits[wd.id].items.length > 0) ? (
                          expandedAudits[wd.id].items.map(a => (
                            <div key={a.id || `${a.action}-${a.createdAt}`} className="text-xs text-gray-200 bg-gray-900 p-2 rounded">
                              <div className="font-semibold">{a.action}</div>
                              <div className="text-gray-400">By: {a.adminName || a.adminId || a.admin || 'system'} • At: {new Date(a.createdAt).toLocaleString()}</div>
                              {a.metadata && <div className="text-gray-300 text-xs mt-1">{typeof a.metadata === 'string' ? a.metadata : JSON.stringify(a.metadata)}</div>}
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-400">No audit entries found.</div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </React.Fragment>
            ))
          )}
        </tbody>
      </table>
      </div>

      {/* Mobile list */}
      <div className="block md:hidden space-y-3">
        {withdrawals.length === 0 ? (
          <div className="bg-gray-950 rounded-lg p-4 text-center text-gray-400">No withdrawals found.</div>
        ) : (
          withdrawals.map(wd => (
            <div key={wd.id} className="bg-gray-900 p-4 rounded-lg border border-gray-800">
              <div className="flex justify-between items-start">
                <div className="min-w-0">
                  <div className="font-semibold truncate break-words max-w-[12rem]">{wd.userFullName || wd.userId}</div>
                  <div className="text-xs text-gray-400 truncate break-words max-w-[12rem]">{wd.userEmail}</div>
                  <div className="text-xs text-gray-400 mt-1 overflow-hidden truncate max-w-[12rem]" title={`ID: ${wd.id}`}>ID: {wd.id}</div>
                </div>
                <div className="text-right ml-3">
                  <div className="font-mono text-gold overflow-hidden truncate max-w-[10rem]" title={`${Number(wd.amount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ${wd.currency}`}>{Number(wd.amount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} {wd.currency}</div>
                  <div className={`mt-1 px-2 py-0.5 rounded-full text-xs ${statusColors[wd.status]}`}>{wd.status}</div>
                </div>
              </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="text-xs">
              <div className="font-semibold">Activation: {(wd.activationFeeAmount || 0).toFixed(2)}</div>
              <div className="text-gray-400 text-xs">paid: {(wd.activationFeePaid || 0).toFixed(2)}</div>
            </div>
            <div className="text-xs">
              <div className="font-semibold">Interest: {(wd.interestTaxAmount || 0).toFixed(2)}</div>
              <div className="text-gray-400 text-xs">paid: {(wd.interestTaxPaid || 0).toFixed(2)}</div>
            </div>
            <div className="text-xs">
              <div className="font-semibold">Network: {(wd.networkFeeAmount || 0).toFixed(2)}</div>
              <div className="text-gray-400 text-xs">paid: {(wd.networkFeePaid || 0).toFixed(2)}</div>
            </div>
            <div className="text-right">
              {wd.status === 'pending' ? (
                <button onClick={() => onSelect(wd)} className="px-4 py-2 bg-gold text-black rounded-lg font-semibold">Review</button>
              ) : (
                <button onClick={() => toggleAudit(wd.id)} className="px-3 py-1 bg-gray-700 text-gray-200 rounded">History</button>
              )}
            </div>
          </div>

          {expandedRows[wd.id] && (
            <div className="mt-3 bg-gray-950 p-3 rounded">
              {expandedAudits[wd.id] && expandedAudits[wd.id].loading ? (
                <div className="text-gray-400">Loading audit...</div>
              ) : (
                (expandedAudits[wd.id] && expandedAudits[wd.id].items.length > 0) ? (
                  expandedAudits[wd.id].items.map(a => (
                    <div key={a.id || `${a.action}-${a.createdAt}`} className="text-xs text-gray-200 bg-gray-900 p-2 rounded mb-2">
                      <div className="font-semibold">{a.action}</div>
                      <div className="text-gray-400">By: {a.adminName || a.adminId || a.admin || 'system'} • At: {new Date(a.createdAt).toLocaleString()}</div>
                      {a.metadata && <div className="text-gray-300 text-xs mt-1">{typeof a.metadata === 'string' ? a.metadata : JSON.stringify(a.metadata)}</div>}
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400">No audit entries found.</div>
                )
              )}
            </div>
          )}

        </div>
      ))
        )}
      </div>
    </div>
  );
};

export default WithdrawalList;
