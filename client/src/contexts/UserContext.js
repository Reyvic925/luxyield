import { useState, useEffect, useContext, createContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [kycStatus, setKycStatus] = useState(null);
  const [kycLoading, setKycLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  const fetchKycStatus = async (token) => {
    if (!token) {
      setUser(null);
      setKycStatus(null);
      setKycLoading(false);
      setIsEmailVerified(false);
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
    const token = localStorage.getItem('token');
    if (token) {
      fetchKycStatus(token);
      return;
    }
    setUser(null);
    setKycStatus(null);
    setKycLoading(false);
    setIsEmailVerified(false);
  }, []);

  const login = (token) => {
    localStorage.setItem('token', token);
    fetchKycStatus(token);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setKycStatus(null);
    setKycLoading(false);
    setIsEmailVerified(false);
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
    <UserContext.Provider value={{ user, login, logout, kycStatus, kycLoading, isEmailVerified, refreshUserContext }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
