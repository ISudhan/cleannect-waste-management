import { createContext, useContext, useEffect, useState } from 'react';
import apiClient from '../lib/apiClient';

const AuthContext = createContext(null);

const STORAGE_KEY = 'cleannect_auth';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setLoading(false);
      return;
    }
    const parsed = JSON.parse(stored);
    if (!parsed?.token) {
      setLoading(false);
      return;
    }
    setToken(parsed.token);
    apiClient
      .get('/auth/me')
      .then((res) => {
        setUser(res.data?.data?.user ?? null);
      })
      .catch(() => {
        window.localStorage.removeItem(STORAGE_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const saveAuth = (nextUser, nextToken) => {
    setUser(nextUser);
    setToken(nextToken);
    if (nextToken) {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ user: nextUser, token: nextToken }),
      );
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  const login = async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password }, { skipAuthHeader: true });
    const payload = res.data?.data;
    saveAuth(payload?.user, payload?.token);
    return payload;
  };

  const register = async (values) => {
    const res = await apiClient.post('/auth/register', values, { skipAuthHeader: true });
    const payload = res.data?.data;
    saveAuth(payload?.user, payload?.token);
    return payload;
  };

  const logout = () => {
    saveAuth(null, null);
  };

  // Used by OAuth callback page — save token then fetch user profile
  const loginWithToken = async (nextToken) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: nextToken }));
    setToken(nextToken);
    try {
      const res = await apiClient.get('/auth/me', {
        headers: { Authorization: `Bearer ${nextToken}` },
      });
      const u = res.data?.data?.user ?? null;
      saveAuth(u, nextToken);
      return u;
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      setToken(null);
      throw new Error('Failed to fetch user after OAuth');
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    loginWithToken,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}


