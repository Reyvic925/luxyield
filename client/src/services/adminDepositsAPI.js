// src/services/adminDepositsAPI.js
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000';
const API = axios.create({
  baseURL: API_BASE + '/api/admin/deposits',
});

// Attach admin token if present
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export const getAdminDeposits = async () => {
  try {
    const response = await API.get('/');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch deposits';
  }
};

export const updateAdminDeposit = async (id, data) => {
  try {
    const response = await API.patch(`/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update deposit';
  }
};

