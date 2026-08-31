import axios from 'axios';

// Set base URL globally for all axios requests
axios.defaults.baseURL = process.env.REACT_APP_API_BASE_URL || '';

// Attach Authorization header for all requests if token exists
axios.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem('adminToken');
  const userToken = localStorage.getItem('token');
  config.headers = config.headers || {};

  const url = typeof config.url === 'string' ? config.url : '';

  // Explicit admin-only routes must use the admin token.
  if (adminToken && url.includes('/api/admin')) {
    config.headers.Authorization = `Bearer ${adminToken}`;
    return config;
  }

  // User portfolio/profile requests must use the regular user token even if an admin is logged in.
  // This prevents mirrored admin views from accidentally querying the admin's own portfolio.
  if (userToken && (url.includes('/api/portfolio') || url.includes('/api/user'))) {
    config.headers.Authorization = `Bearer ${userToken}`;
    return config;
  }

  // General authenticated requests use the user's token when present.
  if (userToken) {
    config.headers.Authorization = `Bearer ${userToken}`;
    return config;
  }

  // Fall back to admin token only for admin-specific requests when no user token exists.
  if (adminToken) {
    config.headers.Authorization = `Bearer ${adminToken}`;
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

