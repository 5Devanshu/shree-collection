import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { notifySessionExpired } from '../utils/sessionExpiry';

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

const apiClient = axios.create({ baseURL: API });

apiClient.interceptors.request.use((config) => {
  config.headers['x-session-id'] = getOrCreateSessionId();
  const resellerToken = localStorage.getItem('resellerToken');
  const customerToken = localStorage.getItem('shree_customer_token');
  const token = resellerToken || customerToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.data instanceof FormData) delete config.headers['Content-Type'];
  return config;
});

// ── Session expiry detection ────────────────────────────────────────────────
// A 401 here means whichever token we attached (reseller or customer) is
// invalid/expired. We don't touch the CART session id (x-session-id) — that's
// a guest-cart identifier, not an auth token, and stays valid regardless.
// Clear only the auth token that was actually in use, then let the shared
// banner (mounted once near the app root) tell the person to log in again.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      const hadReseller = !!localStorage.getItem('resellerToken');
      const hadCustomer = !!localStorage.getItem('shree_customer_token');

      if (hadReseller) {
        localStorage.removeItem('resellerToken');
        localStorage.removeItem('resellerUser');
        notifySessionExpired('reseller');
      } else if (hadCustomer) {
        localStorage.removeItem('shree_customer_token');
        localStorage.removeItem('shree_customer_user');
        notifySessionExpired('customer');
      }
      // If neither token was set, this was just an unauthenticated guest
      // request (e.g. cart calls don't require login) — nothing expired,
      // so no banner.
    }
    return Promise.reject(error);
  }
);

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

  // React to the session-expired event by clearing local auth state too
  // (localStorage is already cleared by the interceptor above — this just
  // keeps `customer`/`reseller`/`isReseller` in sync so the UI immediately
  // reflects "logged out" instead of showing stale reseller/customer chrome).
  useEffect(() => {
    const handleStorageDrivenLogout = () => {
      if (!localStorage.getItem('shree_customer_token')) setCustomer(null);
      if (!localStorage.getItem('resellerToken')) {
        setReseller(null);
        setIsReseller(false);
      }
    };
    window.addEventListener('shree:session-expired', handleStorageDrivenLogout);
    return () => window.removeEventListener('shree:session-expired', handleStorageDrivenLogout);
  }, []);

  // ── Cart ──────────────────────────────────────────────────────────────────
  const [cart,        setCart]        = useState({ items: [], subtotal: 0, shippingCost: 0, total: 0 });
  const [cartCount,   setCartCount]   = useState(0);
  const [cartLoading, setCartLoading] = useState(false);

  // ── Products & Categories ─────────────────────────────────────────────────
  const [products,     setProducts]     = useState([]);
  const [categories,   setCategories]   = useState([]);
  const [loadingProds, setLoadingProds] = useState(true);
  const [loadingCats,  setLoadingCats]  = useState(true);

  const loadProducts = useCallback(() => {
    setLoadingProds(true);
    apiClient.get('/products', { params: { limit: 200 } })
      .then(res => {
        const data = res.data?.products || res.data?.data || res.data || [];
        setProducts(Array.isArray(data) ? data : []);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoadingProds(false));
  }, []);

  const loadCategories = useCallback(() => {
    setLoadingCats(true);
    apiClient.get('/categories')
      .then(res => {
        const data = res.data?.data || res.data?.categories || res.data || [];
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch(() => setCategories([]))
      .finally(() => setLoadingCats(false));
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);
  useEffect(() => { loadProducts(); },   [loadProducts]);

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
  const addToCart = useCallback(async (productOrId, quantity = 1, price, size, color) => {
    try {
      const productId = productOrId && typeof productOrId === 'object'
        ? (productOrId.id || productOrId._id)
        : productOrId;
      const body = { productId, quantity };
      if (size  !== undefined) body.size  = size;
      if (color !== undefined) body.color = color;

      const res = await apiClient.post('/cart/add', body);
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
  const updateCartItem = useCallback(async (productId, quantity, size, color) => {
    try {
      const body = { quantity };
      if (size  !== undefined) body.size  = size;
      if (color !== undefined) body.color = color;

      const res = await apiClient.patch(`/cart/item/${productId}`, body);
      if (res.data.success) {
        setCart(res.data.cart);
        const count = res.data.cart.items?.reduce((s, i) => s + i.quantity, 0) || 0;
        setCartCount(count);
      }
    } catch (err) { throw err?.response?.data || err; }
  }, []);

  // ── Cart: remove item ─────────────────────────────────────────────────────
  const removeFromCart = useCallback(async (productId, size, color) => {
    try {
      const params = {};
      if (size  !== undefined && size  !== null) params.size  = size;
      if (color !== undefined && color !== null) params.color = color;

      const res = await apiClient.delete(`/cart/item/${productId}`, { params });
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
      loadProducts,    // ← exposed for AdminDiscounts refresh
      loadCategories,  // ← exposed for future use
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