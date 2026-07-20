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

export const updateRoiWithdrawalStatus = async (id, status) => {
  const res = await axios.patch(`/api/admin/withdrawals/${id}`, {
    status
  });
  return res.data;
};

