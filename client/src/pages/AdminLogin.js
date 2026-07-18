import React, { useState } from 'react';
import axios from '../utils/axios';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/api/admin/login', { email, password });
      if (res.data.token) {
        localStorage.setItem('adminToken', res.data.token);
        navigate('/admin/dashboard');
      } else {
        setError(res.data.message || 'Login failed');
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else if (err.request) {
        setError('Could not reach server. Please check your connection or try again later.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark p-2 sm:p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-xl shadow-lg p-4 sm:p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gold mb-2">LUXYIELD</h1>
          <h2 className="text-xl text-white">Admin Login</h2>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-500 bg-opacity-20 text-red-400 rounded-lg">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="w-full">
            <label htmlFor="admin-login-email" className="block text-gray-400 mb-2">Email</label>
            <input
              id="admin-login-email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
              placeholder="admin@email.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="w-full">
            <label htmlFor="admin-login-password" className="block text-gray-400 mb-2">Password</label>
            <input
              id="admin-login-password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
              placeholder="Password"
              required
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gold text-black font-bold py-3 rounded hover:bg-yellow-600 transition text-base sm:text-lg"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
