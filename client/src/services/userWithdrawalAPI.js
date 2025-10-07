// src/services/userWithdrawalAPI.js
import axios from 'axios';

const API = axios.create({
  baseURL: '/api/user',
});

// ...existing code...

export const getUserWithdrawals = async () => {
  const response = await API.get('/withdrawals');
  return response.data;
};
