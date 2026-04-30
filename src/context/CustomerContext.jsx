import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const CustomerContext = createContext(null);

const API = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({ baseURL: API });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('customerToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (import.meta.env.DEV) {
      console.error('❌ API Error:', {
        status:  err.response?.status,
        url:     err.config?.url,
        message: err.response?.data?.message,
        data:    err.response?.data,
      });
    }
    return Promise.reject(err);
  }
);

export const CustomerProvider = ({ children }) => {
  const [customer, setCustomer] = useState(null);
  const [loading,  setLoading]  = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const token          = localStorage.getItem('customerToken');
    const storedCustomer = localStorage.getItem('customerData');
    if (token && storedCustomer) {
      try { setCustomer(JSON.parse(storedCustomer)); }
      catch { localStorage.removeItem('customerToken'); localStorage.removeItem('customerData'); }
    }
    setLoading(false);
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  // ✅ /api/customer-auth/login  (matches server.js: app.use('/api/customer-auth', customerAuthRoutes))
  const login = useCallback(async (email, password) => {
    const res = await client.post('/customer-auth/login', { email, password });
    const { token, customer: userData } = res.data;
    localStorage.setItem('customerToken', token);
    localStorage.setItem('customerData',  JSON.stringify(userData));
    setCustomer(userData);
    return res.data;
  }, []);

  // ── Register ───────────────────────────────────────────────────────────────
  // ✅ /api/customer-auth/register
  const register = useCallback(async (name, email, password, phone) => {
    const res = await client.post('/customer-auth/register', { name, email, password, phone });
    const { token, customer: userData } = res.data;
    localStorage.setItem('customerToken', token);
    localStorage.setItem('customerData',  JSON.stringify(userData));
    setCustomer(userData);
    return res.data;
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerData');
    setCustomer(null);
  }, []);

  // ── Profile (read/update) ──────────────────────────────────────────────────
  // ✅ /api/customers/me  (matches server.js: app.use('/api/customers', customerRoutes))
  const fetchProfile = useCallback(async () => {
    const res      = await client.get('/customers/me');
    const userData = res.data.data || res.data.customer;
    setCustomer(userData);
    localStorage.setItem('customerData', JSON.stringify(userData));
    return userData;
  }, []);

  const updateProfile = useCallback(async (data) => {
    const res     = await client.put('/customers/me', data);
    const updated = res.data.data || res.data.customer;
    setCustomer(updated);
    localStorage.setItem('customerData', JSON.stringify(updated));
    return updated;
  }, []);

  // ── Password ───────────────────────────────────────────────────────────────
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    const res = await client.put('/customers/me/change-password', { currentPassword, newPassword });
    return res.data;
  }, []);

  // ── Addresses ─────────────────────────────────────────────────────────────
  const addAddress = useCallback(async (addressData) => {
    const res = await client.post('/customers/me/addresses', addressData);
    await fetchProfile();
    return res.data;
  }, [fetchProfile]);

  const deleteAddress = useCallback(async (addressId) => {
    const res = await client.delete(`/customers/me/addresses/${addressId}`);
    await fetchProfile();
    return res.data;
  }, [fetchProfile]);

  // ── Orders ─────────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    const res = await client.get('/customers/orders');
    return res.data?.data || res.data || [];
  }, []);

  const fetchOrderById = useCallback(async (orderId) => {
    const res = await client.get(`/customers/orders/${orderId}`);
    return res.data?.data || res.data;
  }, []);

  return (
    <CustomerContext.Provider value={{
      customer,
      loading,
      isLoggedIn: !!customer,
      login,
      register,
      logout,
      fetchProfile,
      updateProfile,
      changePassword,
      addAddress,
      deleteAddress,
      fetchOrders,
      fetchOrderById,
    }}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error('useCustomer must be used inside <CustomerProvider>');
  return ctx;
};

export default CustomerContext;