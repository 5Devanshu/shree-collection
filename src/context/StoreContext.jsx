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

// ── Helper: Get cart key based on user ID ──────────────────────────────────
const getCartKey = (customerId) => {
  // Only save cart for logged-in users
  return customerId ? `shree_cart_${customerId}` : null;
};

// ── Helper: Load cart from localStorage ────────────────────────────────────
const loadCartFromStorage = (customerId) => {
  try {
    const key = getCartKey(customerId);
    if (!key) return []; // No cart for guests
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.error('Failed to load cart:', err);
    return [];
  }
};

// ── Helper: Save cart to localStorage ──────────────────────────────────────
const saveCartToStorage = (cart, customerId) => {
  try {
    const key = getCartKey(customerId);
    if (!key) return; // Don't save for guests
    localStorage.setItem(key, JSON.stringify(cart));
  } catch (err) {
    console.error('Failed to save cart:', err);
  }
};

export const StoreProvider = ({ children }) => {
  const [categories,   setCategories]   = useState([]);
  const [products,     setProducts]     = useState([]);
  const [cart,         setCart]         = useState([]);
  const [loadingCats,  setLoadingCats]  = useState(true);
  const [loadingProds, setLoadingProds] = useState(true);

  // ── Load cart from localStorage on mount ──────────────────────────────────
  useEffect(() => {
    // Only restore cart if user is logged in
    const token = localStorage.getItem('shree_customer_token');
    if (token) {
      const customerId = localStorage.getItem('shree_customer_id');
      const savedCart = loadCartFromStorage(customerId);
      setCart(savedCart);
    } else {
      // Guest users start with empty cart (not persistent)
      setCart([]);
    }
  }, []);

  // ── Always fetch fresh from API — never use localStorage ─────────────────
  useEffect(() => {
    // Clear any old localStorage seed data that might interfere
    localStorage.removeItem('shree_categories');
    localStorage.removeItem('shree_products');

    fetchCategories()
      .then(res => {
        // Backend returns { success: true, categories: [...] }
        const data = res.data?.categories || res.data?.data || res.data || [];
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error('Failed to fetch categories:', err);
        setCategories([]);
      })
      .finally(() => setLoadingCats(false));

    fetchProducts({ limit: 100 })
      .then(res => {
        // Backend returns { success: true, data: [...], total, pages, ... }
        const data = res.data?.data || res.data?.products || res.data || [];
        setProducts(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error('Failed to fetch products:', err);
        setProducts([]);
      })
      .finally(() => setLoadingProds(false));
  }, []);

  // ── Refresh — call this after any stock/discount update ───────────────────
  const refreshProducts = async (params) => {
    try {
      const res = await fetchProducts({ limit: 100, ...params });
      const data = res.data?.data || res.data?.products || res.data || [];
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to refresh products:', err);
    }
  };

  const refreshCategories = async () => {
    try {
      const res = await fetchCategories();
      const data = res.data?.categories || res.data?.data || res.data || [];
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to refresh categories:', err);
    }
  };

  // ── Category CRUD ─────────────────────────────────────────────────────────
  const addCategory = async (data) => {
    const res = await apiCreateCategory(data);
    const category = res.data?.category || res.data?.data || null;
    if (category) setCategories(prev => [category, ...prev]);
    return category;
  };

  const updateCategory = async (id, data) => {
    const res = await apiUpdateCategory(id, data);
    const category = res.data?.category || res.data?.data || null;
    if (category) setCategories(prev => prev.map(c => c._id === id ? category : c));
    return category;
  };

  const deleteCategory = async (id) => {
    await apiDeleteCategory(id);
    setCategories(prev => prev.filter(c => c._id !== id));
  };

  // ── Product CRUD ──────────────────────────────────────────────────────────
  const transformProductData = (formData) => {
    // Frontend uses categorySlug, but backend needs category ObjectId
    const categoryObj = categories.find(c => c.slug === formData.categorySlug);
    const categoryId = categoryObj?._id || formData.categorySlug;

    // Transform frontend form structure to backend schema structure
    return {
      title: formData.title,
      description: formData.description || '',
      material: formData.material || '',
      price: formData.price,
      image: {
        url: formData.image || '',
        publicId: '', // Will be set by backend if Cloudinary
      },
      category: categoryId,
      isFeatured: formData.featured ?? false,
      gallery: formData.gallery || [],
      details: formData.details || [],
      stock: formData.stock || 0,
    };
  };

  const addProduct = async (data) => {
    const transformed = transformProductData(data);
    const res = await apiCreateProduct(transformed);
    const product = res.data?.product || res.data?.data || null;
    if (product) setProducts(prev => [product, ...prev]);
    return product;
  };

  const updateProduct = async (id, data) => {
    const transformed = transformProductData(data);
    const res = await apiUpdateProduct(id, transformed);
    const product = res.data?.product || res.data?.data || null;
    if (product) setProducts(prev => prev.map(p => p._id === id ? product : p));
    return product;
  };

  const deleteProduct = async (id) => {
    await apiDeleteProduct(id);
    setProducts(prev => prev.filter(p => p._id !== id));
  };

  // ── Cart ──────────────────────────────────────────────────────────────────
  const getCurrentUserId = () => {
    const token = localStorage.getItem('shree_customer_token');
    return token ? localStorage.getItem('shree_customer_id') : null;
  };

  const addToCart = (product) => {
    // Only save to cart if user is logged in
    const userId = getCurrentUserId();
    if (!userId) {
      alert('Please log in to save items to your cart.');
      return;
    }

    setCart(prev => {
      const existing = prev.find(i => i._id === product._id);
      const newCart = existing
        ? prev.map(i => i._id === product._id ? { ...i, qty: i.qty + 1 } : i)
        : [...prev, { ...product, qty: 1 }];
      saveCartToStorage(newCart, userId);
      return newCart;
    });
  };

  const removeFromCart = (id) => {
    const userId = getCurrentUserId();
    setCart(prev => {
      const newCart = prev.filter(i => i._id !== id);
      if (userId) {
        saveCartToStorage(newCart, userId);
      }
      return newCart;
    });
  };

  const updateCartQty = (id, qty) => {
    const userId = getCurrentUserId();
    if (qty <= 0) {
      removeFromCart(id);
    } else {
      setCart(prev => {
        const newCart = prev.map(i => i._id === id ? { ...i, qty } : i);
        if (userId) {
          saveCartToStorage(newCart, userId);
        }
        return newCart;
      });
    }
  };

  const clearCart = () => {
    const userId = getCurrentUserId();
    setCart([]);
    if (userId) {
      saveCartToStorage([], userId);
    }
  };

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