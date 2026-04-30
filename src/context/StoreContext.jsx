import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const StoreContext = createContext(null);

const API = import.meta.env.VITE_API_URL || '/api';

// ── One session ID for the entire app lifetime ───────────────────────────────
// Created once, stored in localStorage, sent as header on every cart request
const getOrCreateSessionId = () => {
  let id = localStorage.getItem('cartSessionId');
  if (!id) {
    id = `sc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem('cartSessionId', id);
  }
  return id;
};

// Axios instance that always sends the session header
const cartClient = axios.create({ baseURL: API });
cartClient.interceptors.request.use((config) => {
  config.headers['x-session-id'] = getOrCreateSessionId();
  return config;
});

export const StoreProvider = ({ children }) => {
  const [cart,      setCart]      = useState({ items: [], subtotal: 0, shippingCost: 0, total: 0 });
  const [cartCount, setCartCount] = useState(0);
  const [cartLoading, setCartLoading] = useState(false);

  // ── Fetch full cart (used by Checkout) ───────────────────────────────────
  const fetchCart = useCallback(async () => {
    setCartLoading(true);
    try {
      const res = await cartClient.get('/cart');
      if (res.data.success) {
        setCart(res.data.cart);
        const count = res.data.cart.items?.reduce((s, i) => s + i.quantity, 0) || 0;
        setCartCount(count);
      }
    } catch (err) {
      console.error('Cart fetch error:', err?.response?.data || err.message);
    } finally {
      setCartLoading(false);
    }
  }, []);

  // ── Fetch count only (used by Navbar) ────────────────────────────────────
  const fetchCartCount = useCallback(async () => {
    try {
      const res = await cartClient.get('/cart/count');
      if (res.data.success) setCartCount(res.data.count || 0);
    } catch { /* silent */ }
  }, []);

  // ── Add to cart ──────────────────────────────────────────────────────────
  const addToCart = useCallback(async (productId, quantity = 1) => {
    try {
      const res = await cartClient.post('/cart/add', { productId, quantity });
      if (res.data.success) {
        setCart(res.data.cart);
        setCartCount(res.data.count || 0);
      }
      return res.data;
    } catch (err) {
      throw err?.response?.data || err;
    }
  }, []);

  // ── Update quantity ──────────────────────────────────────────────────────
  const updateCartItem = useCallback(async (productId, quantity) => {
    try {
      const res = await cartClient.patch(`/cart/item/${productId}`, { quantity });
      if (res.data.success) {
        setCart(res.data.cart);
        const count = res.data.cart.items?.reduce((s, i) => s + i.quantity, 0) || 0;
        setCartCount(count);
      }
    } catch (err) {
      throw err?.response?.data || err;
    }
  }, []);

  // ── Remove item ──────────────────────────────────────────────────────────
  const removeFromCart = useCallback(async (productId) => {
    try {
      const res = await cartClient.delete(`/cart/item/${productId}`);
      if (res.data.success) {
        setCart(res.data.cart);
        const count = res.data.cart.items?.reduce((s, i) => s + i.quantity, 0) || 0;
        setCartCount(count);
      }
    } catch (err) {
      throw err?.response?.data || err;
    }
  }, []);

  // ── Clear cart (call after successful order) ─────────────────────────────
  const clearCart = useCallback(async () => {
    try {
      await cartClient.delete('/cart/clear');
      setCart({ items: [], subtotal: 0, shippingCost: 0, total: 0 });
      setCartCount(0);
    } catch { /* silent */ }
  }, []);

  // Load count on mount
  useEffect(() => { fetchCartCount(); }, [fetchCartCount]);

  return (
    <StoreContext.Provider value={{
      cart,
      cartCount,
      cartLoading,
      sessionId: getOrCreateSessionId(),  // expose for Checkout.jsx
      fetchCart,
      fetchCartCount,
      addToCart,
      updateCartItem,
      removeFromCart,
      clearCart,
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
};

export default StoreContext;