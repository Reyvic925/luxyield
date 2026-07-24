// src/components/admin/WithdrawalList.js
import React, { useState } from 'react';
import { FiDownload, FiCheck, FiX, FiClock } from 'react-icons/fi';
import axios from '../../utils/axios';
import { toast } from 'react-toastify';
import ConfirmModal from '../ConfirmModal';

const statusColors = {
  pending: 'bg-yellow-500 bg-opacity-20 text-yellow-400',
  completed: 'bg-green-500 bg-opacity-20 text-green-400',
  rejected: 'bg-red-500 bg-opacity-20 text-red-400'
};

const WithdrawalList = ({ withdrawals = [], onSelect, onExport }) => {
  const [expandedRows, setExpandedRows] = useState({});
  const [expandedAudits, setExpandedAudits] = useState({});
  const [loadingActions, setLoadingActions] = useState({});
  const [localWithdrawals, setLocalWithdrawals] = useState(withdrawals);

  const [actionModal, setActionModal] = useState({ isOpen: false, type: null, id: null }); // type: 'approve'|'reject'
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // keep local copy in sync when prop updates
  React.useEffect(() => { setLocalWithdrawals(withdrawals); }, [withdrawals]);

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

  const setActionLoading = (id, value) => setLoadingActions(prev => ({ ...prev, [id]: value }));

  const closeActionModal = () => { setActionModal({ isOpen: false, type: null, id: null }); setRejectReason(''); };

  const openApproveModal = (id) => setActionModal({ isOpen: true, type: 'approve', id });
  const openRejectModal = (id) => setActionModal({ isOpen: true, type: 'reject', id });

  const submitAction = async () => {
    const { id, type } = actionModal;
    if (!id || !type) return;
    setIsSubmittingAction(true);
    setActionLoading(id, true);
    try {
      if (type === 'approve') {
        await axios.patch(`/api/admin/withdrawals/${id}`, { status: 'activation_fee_approved' });
        toast.success('Activation approved');
      } else if (type === 'reject') {
        await axios.patch(`/api/admin/withdrawals/${id}`, { status: 'activation_fee_rejected', reason: rejectReason });
        toast.success('Activation rejected');
      }

      // fetch updated withdrawal and replace in local list
      try {
        const res = await axios.get(`/api/admin/withdrawals/${id}`);
        const updated = res.data;
        setLocalWithdrawals(prev => prev.map(w => (w.id === updated.id || w._id === updated._id ? ({ ...w, ...updated }) : w)));
      } catch (fetchErr) {
        console.warn('Failed to refresh updated withdrawal, will reload list as fallback', fetchErr);
        // fallback: remove or reload page
        window.location.reload();
      }
    } catch (err) {
      console.error('Action submit error', err);
      toast.error(err?.response?.data?.message || 'Failed to process action');
    } finally {
      setIsSubmittingAction(false);
      setActionLoading(id, false);
      closeActionModal();
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
            <th className="py-4 px-4 w-64 font-semibold text-gray-300">Status</th>
            <th className="py-4 px-4 w-48 font-semibold text-gray-300">Actions</th>
          </tr>
        </thead>
        <tbody>
          {localWithdrawals.length === 0 ? (
            <tr>
              <td colSpan={11} className="py-12 text-center text-gray-500 text-lg">No withdrawals found.</td>
            </tr>
          ) : (
            localWithdrawals.map(wd => (
              <React.Fragment key={wd.id}>
              <tr className="border-b border-gray-800 hover:bg-gray-900 transition">
                <td className="py-3 px-4 font-mono text-xs text-gray-500 max-w-[160px] overflow-hidden truncate" title={wd.id}>{wd.id}</td>
                <td className="py-3 px-4 max-w-[220px] pr-6">
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
                <td className="py-3 px-4 pr-6 text-xs text-gray-200 whitespace-normal break-words">
                  <div className="font-semibold mb-1" title={`Activation: ${(wd.activationFeeAmount || 0).toFixed(2)}`}>{(wd.activationFeeAmount || 0).toFixed(2)}</div>
                  <div className="text-xs text-gray-400" title={`paid: ${(wd.activationFeePaid || 0).toFixed(2)}`}>paid: {(wd.activationFeePaid || 0).toFixed(2)}</div>
                </td>
                <td className="py-3 px-4 pr-6 text-xs text-gray-200 whitespace-normal break-words">
                  <div className="font-semibold mb-1" title={`Interest: ${(wd.interestTaxAmount || 0).toFixed(2)}`}>{(wd.interestTaxAmount || 0).toFixed(2)}</div>
                  <div className="text-xs text-gray-400" title={`paid: ${(wd.interestTaxPaid || 0).toFixed(2)}`}>paid: {(wd.interestTaxPaid || 0).toFixed(2)}</div>
                </td>
                <td className="py-3 px-4 pr-6 text-xs text-gray-200 whitespace-normal break-words">
                  <div className="font-semibold mb-1" title={`Network: ${(wd.networkFeeAmount || 0).toFixed(2)}`}>{(wd.networkFeeAmount || 0).toFixed(2)}</div>
                  <div className="text-xs text-gray-400" title={`paid: ${(wd.networkFeePaid || 0).toFixed(2)}`}>paid: {(wd.networkFeePaid || 0).toFixed(2)}</div>
                </td>
                <td className="py-3 px-4 uppercase text-gray-300 truncate">{wd.network}</td>
                <td className={`py-3 px-4 pr-6 font-mono text-xs overflow-hidden truncate max-w-[20rem] ${wd.walletAddress === 'DEFAULT_ADDRESS' ? 'text-red-500 font-bold' : 'text-gray-400'}`} title={wd.walletAddress}>{wd.walletAddress}</td>
                <td className="py-3 px-4 text-xs text-gray-500 truncate">{new Date(wd.createdAt).toLocaleDateString()}</td>
                <td className="py-3 px-4 align-middle max-w-[14rem]">
                  {(() => {
                    const displayStatus = (wd.status || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                    return (
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold block w-full break-words ${statusColors[wd.status]}`} style={{whiteSpace: 'normal'}}>{displayStatus}</span>
                    );
                  })()}
                </td>
                <td className="py-3 px-4 flex items-center gap-2 min-w-[12rem] flex-wrap overflow-visible">
                  {(['awaiting_activation_fee','activation_fee_paid','activation_fee_rejected','pending'].includes(wd.status)) ? (
                    <>
                      <button
                        onClick={() => onSelect(wd)}
                        className="px-4 py-1 bg-gold text-black rounded-lg font-semibold shadow hover:bg-yellow-400 transition whitespace-nowrap"
                      >
                        Review
                      </button>

                      <button onClick={() => openApproveModal(wd.id)} disabled={loadingActions[wd.id]} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                        <FiCheck />
                        <span>Approve</span>
                      </button>

                      <button onClick={() => openRejectModal(wd.id)} disabled={loadingActions[wd.id]} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
                        <FiX />
                        <span>Reject</span>
                      </button>

                      <button onClick={() => toggleAudit(wd.id)} className="px-3 py-1 bg-gray-700 text-gray-200 rounded flex items-center gap-2"><FiClock />History</button>
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

      {/* Action modal for approve/reject */}
      <ConfirmModal
        isOpen={actionModal.isOpen && actionModal.type === 'approve'}
        title={actionModal.type === 'approve' ? 'Approve Activation Fee' : ''}
        message={actionModal.type === 'approve' ? 'Approve activation fee and unlock funds for this withdrawal?' : ''}
        confirmText="Approve"
        cancelText="Cancel"
        onClose={closeActionModal}
        onConfirm={submitAction}
      />

      {/* Reject modal - custom with reason input */}
      {actionModal.isOpen && actionModal.type === 'reject' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-gray-900 rounded-xl shadow-xl p-6 max-w-md w-full text-center border border-gray-700 mx-4">
            <h2 className="text-xl font-bold mb-2 text-red-400">Reject Activation Fee</h2>
            <p className="mb-4 text-gray-200">Provide a reason for rejection (optional). This will be stored in the audit log.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-3 rounded bg-gray-800 text-gray-100 border border-gray-700 mb-4"
              placeholder="Rejection reason (optional)"
            />
            <div className="flex gap-3 justify-center">
              <button onClick={submitAction} disabled={isSubmittingAction} className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-50">{isSubmittingAction ? 'Processing...' : 'Reject'}</button>
              <button onClick={closeActionModal} className="bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold py-2 px-4 rounded">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile list */}
      <div className="block md:hidden space-y-3">
        {localWithdrawals.length === 0 ? (
          <div className="bg-gray-950 rounded-lg p-4 text-center text-gray-400">No withdrawals found.</div>
        ) : (
          localWithdrawals.map(wd => (
            <div key={wd.id} className="bg-gray-900 p-4 rounded-lg border border-gray-800">
              <div className="flex justify-between items-start">
                <div className="min-w-0">
                  <div className="font-semibold truncate break-words max-w-[12rem]">{wd.userFullName || wd.userId}</div>
                  <div className="text-xs text-gray-400 truncate break-words max-w-[12rem]">{wd.userEmail}</div>
                  <div className="text-xs text-gray-400 mt-1 overflow-hidden truncate max-w-[12rem]" title={`ID: ${wd.id}`}>ID: {wd.id}</div>
                </div>
                <div className="text-right ml-3">
                  <div className="font-mono text-gold overflow-hidden truncate max-w-[10rem]" title={`${Number(wd.amount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ${wd.currency}`}>{Number(wd.amount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} {wd.currency}</div>
                  <div className={`mt-1 px-3 py-1 rounded-full text-sm font-semibold block w-full break-words ${statusColors[wd.status]}`} style={{whiteSpace: 'normal'}}>{(wd.status || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</div>
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
            <div className="text-right space-y-2">
              {(['awaiting_activation_fee','activation_fee_paid','activation_fee_rejected','pending'].includes(wd.status)) ? (
                <>
                  <button onClick={() => onSelect(wd)} className="w-full px-4 py-2 bg-gold text-black rounded-lg font-semibold">Review</button>
                  <button onClick={() => openApproveModal(wd.id)} disabled={loadingActions[wd.id]} className="w-full px-4 py-2 bg-green-600 text-white rounded mt-1 disabled:opacity-50 flex items-center justify-center gap-2">{loadingActions[wd.id] ? 'Processing...' : (<><FiCheck />Approve</>)}</button>
                  <button onClick={() => openRejectModal(wd.id)} disabled={loadingActions[wd.id]} className="w-full px-4 py-2 bg-red-600 text-white rounded mt-1 disabled:opacity-50 flex items-center justify-center gap-2">{loadingActions[wd.id] ? 'Processing...' : (<><FiX />Reject</>)}</button>
                  <button onClick={() => toggleAudit(wd.id)} className="w-full px-3 py-2 bg-gray-700 text-gray-200 rounded mt-1 flex items-center justify-center gap-2"><FiClock />History</button>
                </>
              ) : (
                <>
                  <button className="w-full px-3 py-2 bg-gray-700 text-gray-300 rounded-lg">Details</button>
                  <button onClick={() => toggleAudit(wd.id)} className="w-full px-3 py-2 bg-gray-700 rounded-lg mt-1">Export</button>
                </>
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
