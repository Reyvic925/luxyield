import axios from '../utils/axios';

export const getRoiWithdrawals = async () => {
  const res = await axios.get('/api/admin/withdrawals', {
    params: {
      status: 'pending',
      type: 'roi'
    }
  });
  return res.data;
};

export const approveRoiWithdrawal = async (id) => {
  const res = await axios.patch(`/api/admin/withdrawals/${id}`, {
    status: 'activation_fee_approved'
  });
  return res.data;
};

export const rejectRoiWithdrawal = async (id) => {
  const res = await axios.patch(`/api/admin/withdrawals/${id}`, {
    status: 'activation_fee_rejected'
  });
  return res.data;
};

