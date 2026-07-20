// src/services/userWithdrawalAPI.js
import axios from '../utils/axios';

export const getUserWithdrawals = async () => {
  const response = await axios.get('/api/withdrawal');
  return response.data.withdrawals || [];
};

export const getWithdrawalById = async (withdrawalId) => {
  const response = await axios.get(`/api/withdrawal/${withdrawalId}`);
  return response.data.withdrawal || null;
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
