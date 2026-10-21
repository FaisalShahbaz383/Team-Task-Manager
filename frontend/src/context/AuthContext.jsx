import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Check current session state on initial application load
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/me');
      if (res.data?.success && res.data.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      // 401 indicates user is not logged in yet, which is expected
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login handler
  const login = async (email, password) => {
    setAuthError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.success) {
        setUser(res.data.user);
        return res.data.user;
      }
      throw new Error(res.data?.message || 'Login failed.');
    } catch (err) {
      const message = err.friendlyMessage || 'Invalid email or password.';
      setAuthError(message);
      throw err;
    }
  };

  // Register handler
  const register = async (name, email, password) => {
    setAuthError(null);
    try {
      const res = await api.post('/auth/register', { name, email, password });
      if (res.data?.success) {
        setUser(res.data.user);
        return res.data.user;
      }
      throw new Error(res.data?.message || 'Registration failed.');
    } catch (err) {
      const message = err.friendlyMessage || 'Registration failed.';
      setAuthError(message);
      throw err;
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout network error, clearing local state anyway:', err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        setAuthError,
        login,
        register,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
