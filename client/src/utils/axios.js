
import axios from 'axios';

// Set base URL globally for all axios requests
axios.defaults.baseURL = process.env.REACT_APP_API_BASE_URL || '';

// Attach Authorization header for all requests if token exists
axios.interceptors.request.use((config) => {
  // Prefer adminToken for admin routes, else use user token
  const adminToken = localStorage.getItem('adminToken');
  const userToken = localStorage.getItem('token');
  // Attach adminToken for /api/admin or /api/admin/* routes
  if (adminToken && config.url && config.url.includes('/api/admin')) {
    config.headers.Authorization = `Bearer ${adminToken}`;
  } else if (userToken) {
    config.headers.Authorization = `Bearer ${userToken}`;
  }
  return config;
});

// Global Axios interceptor for 401 errors
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Remove tokens and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('adminToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axios;
