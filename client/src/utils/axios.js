import axios from 'axios';

// Set base URL globally for all axios requests
axios.defaults.baseURL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || '';

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

// Default axios is kept for general app use, but it must never guess cross-role tokens.
// User routes must use the user token only, and admin routes must use the admin token only.
axios.interceptors.request.use((config) => {
  const adminToken = pickAdminToken();
  const userToken = pickUserToken();
  const url = typeof config.url === 'string' ? config.url : '';

  const isAdminRoute = url.includes('/api/admin');
  const isUserRoute = (
    url.includes('/api/portfolio') ||
    url.includes('/api/user') ||
    url.includes('/api/deposit') ||
    url.includes('/api/withdrawal') ||
    url.includes('/api/auth/kyc')
  );

  if (isAdminRoute) {
    return attachToken(config, adminToken);
  }

  if (isUserRoute) {
    return attachToken(config, userToken);
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

