import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const StoreContext = createContext(null);

const API = import.meta.env.VITE_API_URL || '/api';

const getOrCreateSessionId = () => {
  let id = localStorage.getItem('cartSessionId');
  if (!id) {
    id = `sc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem('cartSessionId', id);
  }
  return id;
};

const cartClient = axios.create({ baseURL: API });
cartClient.interceptors.request.use((config) => {
  config.headers['x-session-id'] = getOrCreateSessionId();
  return config;
});

// Separate client for public data (no session header needed)
const publicClient = axios.create({ baseURL: API });

export const StoreProvider = ({ children }) => {

  // ── Cart ─────────────────────────────────────────────────────────────────
  const [cart,        setCart]        = useState({ items: [], subtotal: 0, shippingCost: 0, total: 0 });
  const [cartCount,   setCartCount]   = useState(0);
  const [cartLoading, setCartLoading] = useState(false);

  // ── Products & Categories ─────────────────────────────────────────────────
  const [products,     setProducts]     = useState([]);   // ← [] not undefined
  const [categories,   setCategories]   = useState([]);   // ← [] not undefined
  const [loadingProds, setLoadingProds] = useState(true);
  const [loadingCats,  setLoadingCats]  = useState(true);

  // ── Fetch categories on mount ─────────────────────────────────────────────
  useEffect(() => {
    publicClient.get('/categories')
      .then(res => {
        const data = res.data?.data || res.data?.categories || res.data || [];
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch(() => setCategories([]))
      .finally(() => setLoadingCats(false));
  }, []);

  // ── Fetch all products on mount ───────────────────────────────────────────
  useEffect(() => {
    publicClient.get('/products')
      .then(res => {
        const data = res.data?.products || res.data?.data || res.data || [];
        setProducts(Array.isArray(data) ? data : []);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoadingProds(false));
  }, []);

  // ── Cart: fetch count ─────────────────────────────────────────────────────
  const fetchCartCount = useCallback(async () => {
    try {
      const res = await cartClient.get('/cart/count');
      if (res.data.success) setCartCount(res.data.count || 0);
    } catch { /* silent */ }
  }, []);

  // ── Cart: fetch full cart ─────────────────────────────────────────────────
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

  // ── Cart: add ─────────────────────────────────────────────────────────────
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

  // ── Cart: update quantity ─────────────────────────────────────────────────
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

  // ── Cart: remove item ─────────────────────────────────────────────────────
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

  // ── Cart: clear ───────────────────────────────────────────────────────────
  const clearCart = useCallback(async () => {
    try {
      await cartClient.delete('/cart/clear');
      setCart({ items: [], subtotal: 0, shippingCost: 0, total: 0 });
      setCartCount(0);
    } catch { /* silent */ }
  }, []);

  // Load cart count on mount
  useEffect(() => { fetchCartCount(); }, [fetchCartCount]);

  return (
    <StoreContext.Provider value={{
      // Products & Categories — used by CategoryPage, FeaturedGrid, etc.
      products,
      categories,
      loadingProds,
      loadingCats,

      // Cart — used by Checkout, Navbar, ProductCard
      cart,
      cartCount,
      cartLoading,
      sessionId: getOrCreateSessionId(),
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