import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as loginService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay sesión activa en LocalStorage al cargar
    const sessionStr = sessionStorage.getItem('jf_session');
    const token=sessionStorage.getItem('jf_token')
    if (sessionStr && token) {
      try {
        const session = JSON.parse(sessionStr);
        if (session && session.user) {
          setUser(session.user);
        }
      } catch (e) {
        console.error('Error parsing session', e);
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const result = await loginService(username, password);
    if (result.success) {
      setUser(result.session.user);
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const logout = () => {
    sessionStorage.removeItem('jf_token');
    sessionStorage.removeItem('jf_session');
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
  };

  if (loading) return null; 
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
