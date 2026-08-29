import React, { createContext, useState } from 'react';
import API from '../services/api';

// Pura application me user session aur role share karne ke liye AuthContext
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // LocalStorage se saved user login info load karna (Page refresh par login maintain rahe)
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('userInfo');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  // 1. User Login function
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await API.post('/auth/login', { email, password });
      setUser(res.data.data);
      // Token aur user data ko browser ke localStorage me save karna
      localStorage.setItem('userInfo', JSON.stringify(res.data.data));
      setLoading(false);
      return { success: true, data: res.data.data };
    } catch (error) {
      setLoading(false);
      return {
        success: false,
        message: error.response?.data?.message || 'Login fail ho gaya'
      };
    }
  };

  // 2. User Registration function
  const register = async (userData) => {
    setLoading(true);
    try {
      const res = await API.post('/auth/register', userData);
      setUser(res.data.data);
      localStorage.setItem('userInfo', JSON.stringify(res.data.data));
      setLoading(false);
      return { success: true, data: res.data.data };
    } catch (error) {
      setLoading(false);
      return {
        success: false,
        message: error.response?.data?.message || 'Registration fail ho gaya'
      };
    }
  };

  // 3. Logout function (Token delete karna aur state clear karna)
  const logout = () => {
    setUser(null);
    localStorage.removeItem('userInfo');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
