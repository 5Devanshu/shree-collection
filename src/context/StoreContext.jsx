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

// Single authenticated client — attaches reseller/customer token + session ID
const apiClient = axios.create({ baseURL: API });
apiClient.interceptors.request.use((config) => {
  config.headers['x-session-id'] = getOrCreateSessionId();

  const resellerToken = localStorage.getItem('resellerToken');
  const customerToken = localStorage.getItem('shree_customer_token');
  const token = resellerToken || customerToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});

export const StoreProvider = ({ children }) => {

  // ── Customer auth ─────────────────────────────────────────────────────────
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

  // ── Reseller auth ─────────────────────────────────────────────────────────
  const [reseller, setReseller] = useState(() => {
    try { return JSON.parse(localStorage.getItem('resellerUser') || 'null'); }
    catch { return null; }
  });

  const [isReseller, setIsReseller] = useState(
    () => !!localStorage.getItem('resellerToken')
  );

  // ── Cart ──────────────────────────────────────────────────────────────────
  const [cart,        setCart]        = useState({ items: [], subtotal: 0, shippingCost: 0, total: 0 });
  const [cartCount,   setCartCount]   = useState(0);
  const [cartLoading, setCartLoading] = useState(false);

  // ── Products & Categories ─────────────────────────────────────────────────
  const [products,     setProducts]     = useState([]);
  const [categories,   setCategories]   = useState([]);
  const [loadingProds, setLoadingProds] = useState(true);
  const [loadingCats,  setLoadingCats]  = useState(true);

  // Always use apiClient so reseller token is sent and backend returns correct price
  const loadProducts = useCallback(() => {
    setLoadingProds(true);
    apiClient.get('/products')
      .then(res => {
        const data = res.data?.products || res.data?.data || res.data || [];
        setProducts(Array.isArray(data) ? data : []);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoadingProds(false));
  }, []);

  useEffect(() => {
    apiClient.get('/categories')
      .then(res => {
        const data = res.data?.data || res.data?.categories || res.data || [];
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch(() => setCategories([]))
      .finally(() => setLoadingCats(false));
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  // ── Cart: fetch count ─────────────────────────────────────────────────────
  const fetchCartCount = useCallback(async () => {
    try {
      const res = await apiClient.get('/cart/count');
      if (res.data.success) setCartCount(res.data.count || 0);
    } catch { /* silent */ }
  }, []);

  // ── Cart: fetch full cart ─────────────────────────────────────────────────
  const fetchCart = useCallback(async () => {
    setCartLoading(true);
    try {
      const res = await apiClient.get('/cart');
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
  const addToCart = useCallback(async (productOrId, quantity = 1) => {
    try {
      const productId = productOrId && typeof productOrId === 'object'
        ? (productOrId.id || productOrId._id)
        : productOrId;
      const res = await apiClient.post('/cart/add', { productId, quantity });
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
      const res = await apiClient.patch(`/cart/item/${productId}`, { quantity });
      if (res.data.success) {
        setCart(res.data.cart);
        const count = res.data.cart.items?.reduce((s, i) => s + i.quantity, 0) || 0;
        setCartCount(count);
      }
    } catch (err) { throw err?.response?.data || err; }
  }, []);

  // ── Cart: remove item ─────────────────────────────────────────────────────
  const removeFromCart = useCallback(async (productId) => {
    try {
      const res = await apiClient.delete(`/cart/item/${productId}`);
      if (res.data.success) {
        setCart(res.data.cart);
        const count = res.data.cart.items?.reduce((s, i) => s + i.quantity, 0) || 0;
        setCartCount(count);
      }
    } catch (err) { throw err?.response?.data || err; }
  }, []);

  // ── Cart: clear ───────────────────────────────────────────────────────────
  const clearCart = useCallback(async () => {
    try {
      await apiClient.delete('/cart/clear');
      setCart({ items: [], subtotal: 0, shippingCost: 0, total: 0 });
      setCartCount(0);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchCartCount(); }, [fetchCartCount]);

  // Reload products when tab regains focus
  useEffect(() => {
    const handleVisible = () => {
      if (document.visibilityState === 'visible') loadProducts();
    };
    document.addEventListener('visibilitychange', handleVisible);
    return () => document.removeEventListener('visibilitychange', handleVisible);
  }, [loadProducts]);

  return (
    <StoreContext.Provider value={{
      customer, loginCustomer, logoutCustomer,
      reseller, isReseller,
      products, categories, loadingProds, loadingCats,
      cart, cartCount, cartLoading,
      sessionId: getOrCreateSessionId(),
      fetchCart, fetchCartCount,
      addToCart, updateCartItem, removeFromCart, clearCart,
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