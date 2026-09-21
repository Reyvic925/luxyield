// src/services/adminStatsAPI.js
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000';
const API = axios.create({
  baseURL: API_BASE + '/api/admin',
});

// ...existing code...

export const getAdminStats = async () => {
  const res = await API.get('/stats');
  return res.data;
};

