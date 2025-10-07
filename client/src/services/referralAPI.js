// src/services/referralAPI.js
import axios from 'axios';

export const getReferralStats = async () => {
  const baseUrl = process.env.REACT_APP_API_BASE_URL;
  const res = await axios.get(`${baseUrl}/api/user/referral-stats`);
  return res.data;
};
