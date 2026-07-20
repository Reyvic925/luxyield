// src/services/withdrawalAPI.js
import axios from '../utils/axios';

export const getWithdrawals = async (filters = {}) => {
  try {
    const response = await axios.get('/api/admin/withdrawals', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch withdrawals';
  }
};

export const getWithdrawalById = async (id) => {
  try {
    const response = await axios.get(`/api/admin/withdrawals/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch withdrawal';
  }
};

export const updateWithdrawal = async (id, updates) => {
  try {
    const response = await axios.patch(`/api/admin/withdrawals/${id}`, updates);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update withdrawal';
  }
};

export const bulkUpdateWithdrawals = async (ids, updates) => {
  try {
    const response = await axios.patch('/api/admin/withdrawals/bulk', { ids, updates });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to bulk update withdrawals';
  }
};

export const setWithdrawalPin = async (pin) => {
  const response = await axios.post('/api/withdrawal/set-withdrawal-pin', { pin });
  return response.data;
};

export const submitWithdrawal = async (data) => {
  const response = await axios.post('/api/withdrawal', data);
  return response.data;
};

export const requestPinReset = async () => {
  const response = await axios.post('/api/withdrawal/request-pin-reset');
  return response.data;
};

export const resetPin = async (code, newPin) => {
  const response = await axios.post('/api/withdrawal/reset-pin', { code, newPin });
  return response.data;
};

export const verifyWithdrawalPin = async (pin) => {
  const response = await axios.post('/api/withdrawal/verify-pin', { pin });
  return response.data;
};

export const payActivationFee = async (withdrawalId, fee) => {
  const response = await axios.post(`/api/withdrawal/${withdrawalId}/pay-activation-fee`, { fee });
  return response.data;
};

export const submitWithdrawalForm = async (withdrawalId, payload) => {
  const response = await axios.post(`/api/withdrawal/${withdrawalId}/submit-form`, payload);
  return response.data;
};

export const payInterestTax = async (withdrawalId, amount) => {
  const response = await axios.post(`/api/withdrawal/${withdrawalId}/pay-interest-tax`, { amount });
  return response.data;
};

export const payNetworkFee = async (withdrawalId, amount) => {
  const response = await axios.post(`/api/withdrawal/${withdrawalId}/pay-network-fee`, { amount });
  return response.data;
};
