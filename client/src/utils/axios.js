import axios from 'axios';

// Set base URL globally for all axios requests
axios.defaults.baseURL = process.env.REACT_APP_API_BASE_URL || '';

const attachToken = (config, token) => {
  if (!config) return config;
  config.headers = config.headers || {};
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

const pickUserToken = () => localStorage.getItem('token');
const pickAdminToken = () => localStorage.getItem('adminToken');

// Explicit user client: all normal user routes must use the user token.
export const userApi = axios.create({
  baseURL: axios.defaults.baseURL,
});
userApi.interceptors.request.use((config) => {
  const userToken = pickUserToken();
  return attachToken(config, userToken);
});

// Explicit admin client: all admin-only routes must use the admin token.
export const adminApi = axios.create({
  baseURL: axios.defaults.baseURL,
});
adminApi.interceptors.request.use((config) => {
  const adminToken = pickAdminToken();
  return attachToken(config, adminToken);
});

// Default axios is kept for general app use, but it must never let the admin token override a user route.
axios.interceptors.request.use((config) => {
  const adminToken = pickAdminToken();
  const userToken = pickUserToken();
  const url = typeof config.url === 'string' ? config.url : '';

  if (adminToken && url.includes('/api/admin')) {
    return attachToken(config, adminToken);
  }

  if (userToken && (url.includes('/api/portfolio') || url.includes('/api/user') || url.includes('/api/deposit') || url.includes('/api/withdrawal'))) {
    return attachToken(config, userToken);
  }

  if (userToken) {
    return attachToken(config, userToken);
  }

  if (adminToken) {
    return attachToken(config, adminToken);
  }

  return config;
});

// Global Axios interceptor for 401 errors
axios.interceptors.response.use(
  response => response,
  error => {
    return Promise.reject(error);
  }
);

export default axios;

