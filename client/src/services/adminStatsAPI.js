// src/services/adminStatsAPI.js
import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL + '/api/admin',
});

// ...existing code...

export const getAdminStats = async () => {
  const res = await API.get('/stats');
  return res.data;
};
