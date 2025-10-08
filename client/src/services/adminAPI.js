// src/services/adminAPI.js
import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL + '/api/admin',
});

// Add auth token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getUsers = async () => {
  try {
    const response = await API.get('/users');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch users';
  }
};

export const updateUser = async (userId, updates) => {
  try {
    const response = await API.patch(`/users/${userId}`, updates);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update user';
  }
};

export const updateUserBalance = async (userId, amount, operation) => {
  try {
    if (!userId) throw new Error('User ID is required');
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      throw new Error('Please enter a valid amount greater than 0');
    }
    if (!['add', 'subtract'].includes(operation)) {
      throw new Error('Invalid operation type');
    }

    const response = await API.post(`/users/${userId}/balance`, {
      amount: Number(amount),
      operation
    });
    
    // Ensure numeric values are properly formatted and stored as numbers
    const userData = response.data;
    const balance = parseFloat(parseFloat(userData.balance || 0).toFixed(2));
    const availableBalance = parseFloat(parseFloat(userData.availableBalance || 0).toFixed(2));
    
    return {
      ...userData,
      balance,
      availableBalance
    };
  } catch (error) {
    console.error('Balance update error:', error);
    throw error.response?.data?.message || 'Failed to update balance';
  }
};

export const approveKYC = async (userId) => {
  try {
    const response = await API.post(`/users/${userId}/kyc/approve`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to approve KYC';
  }
};

export const rejectKYC = async (userId, reason) => {
  const response = await API.post(`/users/${userId}/kyc/reject`, { reason });
  return response.data;
};

export const updateUserTier = async (userId, tier) => {
  const response = await API.patch(`/users/${userId}/tier`, { tier });
  return response.data;
};

export const updateUserRole = async (userId, role) => {
  const response = await API.patch(`/users/${userId}/role`, { role });
  return response.data;
};

export const getUserKeys = async (userId) => {
  try {
    const response = await API.get(`/users/${userId}/keys`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch user keys';
  }
};

export const sendAdminEmail = async ({ to, subject, html }) => {
  try {
    await API.post('/send-email', { to, subject, html });
  } catch (error) {
    throw error.response?.data?.message || error.message || 'Failed to send email';
  }
};

// Add more admin API calls as needed