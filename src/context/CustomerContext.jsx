/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  customerLogin as apiLogin,
  customerRegister as apiRegister,
  getMyProfile,
} from '../api/client';

const CustomerContext = createContext();

export const CustomerProvider = ({ children }) => {
  const [customer, setCustomer] = useState(null);
  const [loading,  setLoading]  = useState(true); // checking persisted session

  // ── Restore session on mount ──────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('shree_customer_token');
    if (!token) { setLoading(false); return; }

    getMyProfile()
      .then(res => {
        const customerData = res.data.data;
        localStorage.setItem('shree_customer_id', customerData?.id || customerData?._id);
        setCustomer(customerData);
      })
      .catch(()  => {
        localStorage.removeItem('shree_customer_token');
        localStorage.removeItem('shree_customer_id');
      })
      .finally(()=> setLoading(false));
  }, []);

  const register = async (data) => {
    const res = await apiRegister(data);
    localStorage.setItem('shree_customer_token', res.data.token);
    const customerData = res.data.customer;
    localStorage.setItem('shree_customer_id', customerData?.id || customerData?._id);
    setCustomer(customerData);
    return res.data;
  };

  const login = async (data) => {
    const res = await apiLogin(data);
    localStorage.setItem('shree_customer_token', res.data.token);
    const customerData = res.data.customer;
    localStorage.setItem('shree_customer_id', customerData?.id || customerData?._id);
    setCustomer(customerData);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('shree_customer_token');
    localStorage.removeItem('shree_customer_id');
    setCustomer(null);
  };

  const refreshProfile = async () => {
    const res = await getMyProfile();
    setCustomer(res.data.data);
  };

  const isLoggedIn = !!customer;

  return (
    <CustomerContext.Provider value={{
      customer,
      loading,
      isLoggedIn,
      register,
      login,
      logout,
      refreshProfile,
    }}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error('useCustomer must be used within CustomerProvider');
  return ctx;
};