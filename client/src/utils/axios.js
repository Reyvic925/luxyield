import axios from 'axios';

// Set base URL globally for all axios requests
axios.defaults.baseURL = process.env.REACT_APP_API_BASE_URL || '';

// Attach Authorization header for all requests if token exists
axios.interceptors.request.use((config) => {
  // Prefer adminToken for admin routes, else use user token
  const adminToken = localStorage.getItem('adminToken');
  const userToken = localStorage.getItem('token');
  
  // For /api/admin routes, always use adminToken
  if (adminToken && config.url && config.url.includes('/api/admin')) {
    config.headers.Authorization = `Bearer ${adminToken}`;
  } 
  // For non-admin routes, check if admin is viewing (has adminToken) - they may be viewing user data from mirror
  // In this case, still use adminToken for the API call to user endpoints when accessed from mirror feature
  else if (adminToken && config.url && (config.url.includes('/api/user') || config.url.includes('/api/portfolio'))) {
    config.headers.Authorization = `Bearer ${adminToken}`;
  }
  // Otherwise use user token if available
  else if (userToken) {
    config.headers.Authorization = `Bearer ${userToken}`;
  }
  return config;
});

// Global Axios interceptor for 401 errors
// Note: We don't redirect here - components should handle redirects based on their own auth context
axios.interceptors.response.use(
  response => response,
  error => {
    return Promise.reject(error);
  }
);


export default axios;

