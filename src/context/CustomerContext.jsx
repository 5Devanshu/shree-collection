import React, { createContext, useContext, useState, useEffect } from 'react';
import { customerLogin, customerRegister, getMyProfile } from '../api/client';

const CustomerContext = createContext(null);

export const CustomerProvider = ({ children }) => {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('shree_customer_token');
    if (token) {
      getMyProfile()
        .then(res => setCustomer(res.data.data))
        .catch(() => localStorage.removeItem('shree_customer_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await customerLogin({ email, password });
    localStorage.setItem('shree_customer_token', res.data.token);
    setCustomer(res.data.customer);
    // No navigate here — calling component handles it
  };

  const register = async (name, email, password, phone) => {
    const res = await customerRegister({ name, email, password, phone });
    localStorage.setItem('shree_customer_token', res.data.token);
    setCustomer(res.data.customer);
  };

  const logout = () => {
    localStorage.removeItem('shree_customer_token');
    setCustomer(null);
  };

  return (
    <CustomerContext.Provider value={{ customer, loading, login, register, logout }}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => useContext(CustomerContext);