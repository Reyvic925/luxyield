import axios from '../utils/axios';

// Use the configured axios instance so auth headers and baseURL are applied
export const getRoiWithdrawals = async () => {
  const res = await axios.get('/api/admin/roi-approvals');
  return res.data;
};

export const approveRoiWithdrawal = async (id) => {
  const res = await axios.patch(`/api/admin/roi-approvals/${id}`, { status: 'completed', destination: 'available' });
  return res.data;
};

export const rejectRoiWithdrawal = async (id) => {
  const res = await axios.patch(`/api/admin/roi-approvals/${id}`, { status: 'rejected' });
  return res.data;
};
