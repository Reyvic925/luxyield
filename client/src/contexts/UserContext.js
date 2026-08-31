import { useState, useEffect, useContext, createContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [kycStatus, setKycStatus] = useState(null);
  const [kycLoading, setKycLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  const clearUserSession = () => {
    localStorage.removeItem('token');
    setUser(null);
    setKycStatus(null);
    setKycLoading(false);
    setIsEmailVerified(false);
  };

  const fetchKycStatus = async (token) => {
    if (!token) {
      clearUserSession();
      return;
    }

    setKycLoading(true);
    try {
      const decoded = jwtDecode(token);
      setUser(decoded.user);

      const res = await axios.get('/api/auth/kyc/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setKycStatus(res.data?.kyc?.status || 'pending');
      setIsEmailVerified(Boolean(res.data?.isEmailVerified));
    } catch (err) {
      console.warn('[UserContext] fetchKycStatus error', err?.message || err);
      setKycStatus('pending');
      setIsEmailVerified(false);
    } finally {
      setKycLoading(false);
    }
  };

  useEffect(() => {
    const syncUserState = () => {
      const adminToken = localStorage.getItem('adminToken');
      if (adminToken) {
        clearUserSession();
        return;
      }

      const token = localStorage.getItem('token');
      if (token) {
        fetchKycStatus(token);
        return;
      }

      clearUserSession();
    };

    syncUserState();
    window.addEventListener('storage', syncUserState);
    return () => window.removeEventListener('storage', syncUserState);
  }, []);

  const login = (token) => {
    localStorage.removeItem('adminToken');
    localStorage.setItem('token', token);
    fetchKycStatus(token);
  };

  const logout = () => {
    clearUserSession();
  };

  const refreshUserContext = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await axios.get('/api/user/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.userInfo) {
        setIsEmailVerified(Boolean(res.data.userInfo.isEmailVerified));
      }
      await fetchKycStatus(token);
    } catch (err) {
      console.warn('[UserContext] refreshUserContext error', err?.message || err);
      setIsEmailVerified(false);
      setKycStatus('pending');
      setKycLoading(false);
    }
  };

  return (
    <UserContext.Provider value={{ user, login, logout, clearUserSession, kycStatus, kycLoading, isEmailVerified, refreshUserContext }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
