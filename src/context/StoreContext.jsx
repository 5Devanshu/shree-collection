/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  fetchCategories,
  createCategory   as apiCreateCategory,
  updateCategory   as apiUpdateCategory,
  deleteCategory   as apiDeleteCategory,
  fetchProducts,
  createProduct    as apiCreateProduct,
  updateProduct    as apiUpdateProduct,
  deleteProduct    as apiDeleteProduct,
} from '../api/client';

const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
  const [categories,   setCategories]   = useState([]);
  const [products,     setProducts]     = useState([]);
  const [cart,         setCart]         = useState([]);
  const [loadingCats,  setLoadingCats]  = useState(true);
  const [loadingProds, setLoadingProds] = useState(true);

  // ── Always fetch fresh from API — never use localStorage ─────────────────
  useEffect(() => {
    // Clear any old localStorage seed data that might interfere
    localStorage.removeItem('shree_categories');
    localStorage.removeItem('shree_products');

    fetchCategories()
      .then(res => setCategories(res.data.data))
      .catch(console.error)
      .finally(() => setLoadingCats(false));

    fetchProducts({ limit: 100 })
      .then(res => setProducts(res.data.data))
      .catch(console.error)
      .finally(() => setLoadingProds(false));
  }, []);

  // ── Refresh — call this after any stock/discount update ───────────────────
  const refreshProducts = async (params) => {
    const res = await fetchProducts({ limit: 100, ...params });
    setProducts(res.data.data);
  };

  const refreshCategories = async () => {
    const res = await fetchCategories();
    setCategories(res.data.data);
  };

  // ── Category CRUD ─────────────────────────────────────────────────────────
  const addCategory = async (data) => {
    const res = await apiCreateCategory(data);
    setCategories(prev => [res.data.data, ...prev]);
    return res.data.data;
  };

  const updateCategory = async (id, data) => {
    const res = await apiUpdateCategory(id, data);
    setCategories(prev => prev.map(c => c._id === id ? res.data.data : c));
    return res.data.data;
  };

  const deleteCategory = async (id) => {
    await apiDeleteCategory(id);
    setCategories(prev => prev.filter(c => c._id !== id));
  };

  // ── Product CRUD ──────────────────────────────────────────────────────────
  const addProduct = async (data) => {
    const res = await apiCreateProduct(data);
    setProducts(prev => [res.data.data, ...prev]);
    return res.data.data;
  };

  const updateProduct = async (id, data) => {
    const res = await apiUpdateProduct(id, data);
    setProducts(prev => prev.map(p => p._id === id ? res.data.data : p));
    return res.data.data;
  };

  const deleteProduct = async (id) => {
    await apiDeleteProduct(id);
    setProducts(prev => prev.filter(p => p._id !== id));
  };

  // ── Cart ──────────────────────────────────────────────────────────────────
  const addToCart = (product) =>
    setCart(prev => {
      const existing = prev.find(i => i._id === product._id);
      if (existing) return prev.map(i => i._id === product._id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i._id !== id));

  const updateCartQty = (id, qty) =>
    qty <= 0
      ? removeFromCart(id)
      : setCart(prev => prev.map(i => i._id === id ? { ...i, qty } : i));

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);
  const cartTotal = cart.reduce((sum, i) => {
    const price = i.discountEnabled && i.discountedPrice ? i.discountedPrice : i.price;
    return sum + price * i.qty;
  }, 0);

  // ── Selectors ─────────────────────────────────────────────────────────────
  const getProductsByCategory = (slug) =>
    slug && slug !== 'all' ? products.filter(p => p.categorySlug === slug) : products;

  const getFeaturedProducts = () => products.filter(p => p.featured === true);

  const getProductById = (id) =>
    products.find(p => p._id === id || p._id === String(id));

  const getProductCountForCategory = (slug) =>
    products.filter(p => p.categorySlug === slug).length;

  return (
    <StoreContext.Provider value={{
      categories,   loadingCats,
      products,     loadingProds,
      cart,         cartCount, cartTotal,

      addCategory,    updateCategory,    deleteCategory,
      addProduct,     updateProduct,     deleteProduct,
      refreshProducts, refreshCategories,

      addToCart, removeFromCart, updateCartQty, clearCart,

      getProductsByCategory, getFeaturedProducts,
      getProductById,        getProductCountForCategory,
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
};