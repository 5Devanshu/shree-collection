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

  // ── Customer auth ──────────────────────────────────────────────────────────
  const [customer, setCustomer] = useState(() => {
    try { return JSON.parse(localStorage.getItem('shree_customer_user') || 'null'); }
    catch { return null; }
  });

  const loginCustomer = useCallback((token, user) => {
    localStorage.setItem('shree_customer_token', token);
    localStorage.setItem('shree_customer_user', JSON.stringify(user));
    setCustomer(user);
  }, []);

  const logoutCustomer = useCallback(() => {
    localStorage.removeItem('shree_customer_token');
    localStorage.removeItem('shree_customer_user');
    setCustomer(null);
  }, []);

  // ── Cart ─────────────────────────────────────────────────────────────────
  const [cart,        setCart]        = useState({ items: [], subtotal: 0, shippingCost: 0, total: 0 });
  const [cartCount,   setCartCount]   = useState(0);
  const [cartLoading, setCartLoading] = useState(false);

  // ── Products & Categories ─────────────────────────────────────────────────
  const [products,     setProducts]     = useState([]);
  const [categories,   setCategories]   = useState([]);
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

  // Re-fetch products when user returns to the tab
  useEffect(() => {
    const handleVisible = () => {
      if (document.visibilityState === 'visible') {
        publicClient.get('/products')
          .then(res => {
            const data = res.data?.products || res.data?.data || res.data || [];
            setProducts(Array.isArray(data) ? data : []);
          })
          .catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisible);
    return () => document.removeEventListener('visibilitychange', handleVisible);
  }, []);

  return (
    <StoreContext.Provider value={{
      // Customer auth — used by Login, Navbar, Checkout
      customer,
      loginCustomer,
      logoutCustomer,

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