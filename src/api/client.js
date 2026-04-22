import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Attach token automatically on every request ───────────────────────────────
client.interceptors.request.use((config) => {
  const adminToken    = localStorage.getItem('shree_admin_token');
  const customerToken = localStorage.getItem('shree_customer_token');

  // Admin token takes priority — admin routes (upload, products, categories)
  // need the admin JWT, not the customer JWT
  const token = adminToken || customerToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Let browser set Content-Type for FormData (includes multipart boundary)
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});

// ── Global response error handler ─────────────────────────────────────────────
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'Something went wrong';

    // If 401 on an admin route — clear admin token and redirect to admin login
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isAdminRoute =
        url.includes('/upload') ||
        url.includes('/categories') ||
        url.includes('/products') ||
        url.includes('/orders') ||
        url.includes('/discounts') ||
        url.includes('/stock-notify');

      if (isAdminRoute && localStorage.getItem('shree_admin_token')) {
        localStorage.removeItem('shree_admin_token');
        window.location.href = '/admin/login';
      }
    }

    return Promise.reject(new Error(message));
  }
);

export default client;

// ── Auth — Admin ──────────────────────────────────────────────────────────────
export const adminLogin  = (data) => client.post('/auth/login', data);
export const adminLogout = ()     => {
  localStorage.removeItem('shree_admin_token');
};

// ── Auth — Customer ───────────────────────────────────────────────────────────
export const customerRegister = (data) => client.post('/customers/register', data);
export const customerLogin    = (data) => client.post('/customers/login', data);
export const getMyProfile     = ()     => client.get('/customers/me');
export const updateMyProfile  = (data) => client.put('/customers/me', data);
export const changePassword   = (data) => client.put('/customers/me/change-password', data);
export const addAddress       = (data) => client.post('/customers/me/addresses', data);
export const deleteAddress    = (id)   => client.delete(`/customers/me/addresses/${id}`);
export const getMyOrders      = (params) => client.get('/customers/orders', { params });
export const getMyOrderById   = (id)    => client.get(`/customers/orders/${id}`);

// ── Categories ────────────────────────────────────────────────────────────────
export const fetchCategories  = ()           => client.get('/categories');
export const createCategory   = (data)       => client.post('/categories', data);
export const updateCategory   = (id, data)   => client.put(`/categories/${id}`, data);
export const deleteCategory   = (id)         => client.delete(`/categories/${id}`);

// ── Products ──────────────────────────────────────────────────────────────────
export const fetchProducts    = (params)     => client.get('/products', { params });
export const fetchProductById = (id)         => client.get(`/products/${id}`);
export const createProduct    = (data)       => client.post('/products', data);
export const updateProduct = (id, data) => client.put(`/products/${id}`, data);
export const deleteProduct    = (id)         => client.delete(`/products/${id}`);
export const toggleFeatured   = (id)         => client.patch(`/products/${id}/featured`);

// ── Discounts ─────────────────────────────────────────────────────────────────
export const getDiscountedProducts = ()         => client.get('/discounts');
export const setDiscount           = (id, data) => client.put(`/discounts/${id}`, data);
export const enableDiscount        = (id)       => client.patch(`/discounts/${id}/enable`);
export const disableDiscount       = (id)       => client.patch(`/discounts/${id}/disable`);
export const removeDiscount        = (id)       => client.delete(`/discounts/${id}`);

// ── Stock Notifications ───────────────────────────────────────────────────────
export const subscribeToStock   = (productId, data) =>
  client.post(`/stock-notify/${productId}/subscribe`, data);
export const updateProductStock = (productId, data) =>
  client.patch(`/stock-notify/${productId}/update-stock`, data);
export const getSubscribers     = (productId) =>
  client.get(`/stock-notify/${productId}/subscribers`);

// ── Orders ────────────────────────────────────────────────────────────────────
export const createOrder       = (data)   => client.post('/orders', data);
export const createDemoOrder   = (data)   => client.post('/orders/demo', data);
export const verifyPayment     = (id)     => client.post(`/orders/${id}/verify-payment`);
export const fetchOrders       = (params) => client.get('/orders', { params });
export const fetchOrderById    = (id)     => client.get(`/orders/${id}`);
export const updateOrderStatus = (id, data) => client.put(`/orders/${id}/status`, data);
export const fetchOrderStats   = ()       => client.get('/orders/stats');

// ── Upload — both use same endpoint, admin token handles auth ─────────────────
export const uploadImage         = (formData) => client.post('/media/upload', formData);
export const uploadCategoryImage = (formData) => client.post('/media/upload', formData);