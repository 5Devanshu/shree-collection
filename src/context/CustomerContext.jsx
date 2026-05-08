import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const CustomerContext = createContext(null);

const API = import.meta.env.VITE_API_URL || '/api';

// ── Single axios client — token key is consistent everywhere ─────────────────
const TOKEN_KEY    = 'shree_customer_token';
const DATA_KEY     = 'shree_customer_data';

const client = axios.create({ baseURL: API });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY); // ✅ correct key
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (import.meta.env.DEV) {
      console.error('❌ CustomerContext API Error:', {
        status:  err.response?.status,
        url:     err.config?.url,
        message: err.response?.data?.message,
      });
    }
    return Promise.reject(err);
  }
);

export const CustomerProvider = ({ children }) => {
  const [customer, setCustomer] = useState(null);
  const [loading,  setLoading]  = useState(true);

  // ── Restore session on mount ───────────────────────────────────────────────
  useEffect(() => {
    const token  = localStorage.getItem(TOKEN_KEY);
    const stored = localStorage.getItem(DATA_KEY);

    if (!token) { setLoading(false); return; }

    // If we have stored data, show it immediately (no flash)
    if (stored) {
      try { setCustomer(JSON.parse(stored)); } catch { /* ignore */ }
    }

    // Then verify token is still valid with the server
    client.get('/customers/me')
      .then(res => {
        const data = res.data?.data || res.data?.customer || res.data;
        setCustomer(data);
        localStorage.setItem(DATA_KEY, JSON.stringify(data));
      })
      .catch(() => {
        // Token expired — clear everything
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(DATA_KEY);
        setCustomer(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const res = await client.post('/customers/login', { email, password }); // ✅ correct path
    const { token, customer: userData } = res.data;

    localStorage.setItem(TOKEN_KEY, token);                       // ✅ correct key
    localStorage.setItem(DATA_KEY,  JSON.stringify(userData));    // ✅ correct key
    setCustomer(userData);
    return res.data;
  }, []);

  // ── Register ───────────────────────────────────────────────────────────────
  const register = useCallback(async (name, email, password, phone) => {
    const res = await client.post('/customers/register', { name, email, password, phone }); // ✅
    const { token, customer: userData } = res.data;

    localStorage.setItem(TOKEN_KEY, token);                       // ✅ correct key
    localStorage.setItem(DATA_KEY,  JSON.stringify(userData));    // ✅ correct key
    setCustomer(userData);
    return res.data;
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);   // ✅ correct key
    localStorage.removeItem(DATA_KEY);    // ✅ correct key
    setCustomer(null);
  }, []);

  // ── Fetch Profile ──────────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    const res      = await client.get('/customers/me');
    const userData = res.data?.data || res.data?.customer || res.data;
    setCustomer(userData);
    localStorage.setItem(DATA_KEY, JSON.stringify(userData));     // ✅ correct key
    return userData;
  }, []);

  // ── Update Profile ─────────────────────────────────────────────────────────
  const updateProfile = useCallback(async (data) => {
    const res     = await client.put('/customers/me', data);
    const updated = res.data?.data || res.data?.customer || res.data;
    setCustomer(updated);
    localStorage.setItem(DATA_KEY, JSON.stringify(updated));      // ✅ correct key
    return updated;
  }, []);

  // ── Change Password ────────────────────────────────────────────────────────
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    const res = await client.put('/customers/me/change-password', { currentPassword, newPassword });
    return res.data;
  }, []);

  // ── Addresses ──────────────────────────────────────────────────────────────
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