import axios from '../utils/axios';

export const getRoiWithdrawals = async (dateRange = '7days') => {
  const res = await axios.get('/api/admin/withdrawals', {
    params: {
      status: 'pending',
      type: 'roi',
      dateRange
    }
  });
  return res.data;
};

export const updateRoiWithdrawalStatus = async (id, status) => {
  const res = await axios.patch(`/api/admin/withdrawals/${id}`, {
    status
  });
  return res.data;
};

