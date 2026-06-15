import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Debug logging for API requests ─────────────────────────────────────────────
const API_DEBUG = true; // Set to false to disable logging

// ── Attach token automatically on every request ───────────────────────────────
client.interceptors.request.use((config) => {
  const adminToken    = localStorage.getItem('shree_admin_token');
  const resellerToken = localStorage.getItem('resellerToken');
  const customerToken = localStorage.getItem('shree_customer_token');
  const sessionId     = localStorage.getItem('cartSessionId');

  // Priority: admin > reseller > customer
  const token = adminToken || resellerToken || customerToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Guest cart session — same key StoreContext uses
  if (sessionId) {
    config.headers['x-session-id'] = sessionId;
  }

  // Let browser set Content-Type for FormData (includes multipart boundary)
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  if (API_DEBUG) {
    console.log('📤 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.baseURL + config.url,
      hasToken: !!token,
      tokenType: adminToken ? 'admin' : resellerToken ? 'reseller' : customerToken ? 'customer' : 'none',
      hasSessionId: !!sessionId,
    });
  }

  return config;
});

// ── Global response error handler ─────────────────────────────────────────────
client.interceptors.response.use(
  (response) => {
    if (API_DEBUG) {
      console.log('✅ API Response:', {
        status: response.status,
        url: response.config.url,
        dataKeys: Object.keys(response.data || {}),
      });
    }
    return response;
  },
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'Something went wrong';

    if (API_DEBUG) {
      console.error('❌ API Error:', {
        status: error.response?.status,
        url: error.config?.url,
        message,
        data: error.response?.data,
      });
    }

    // 401 on an admin route — clear admin token and redirect to admin login
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isAdminRoute =
        url.includes('/upload') ||
        url.includes('/categories') ||
        url.includes('/discounts') ||
        url.includes('/stock-notify');

      if (isAdminRoute && localStorage.getItem('shree_admin_token')) {
        localStorage.removeItem('shree_admin_token');
        window.location.href = '/admin/login';
      }
    }

    // Preserve the backend error code (e.g. NOT_VERIFIED) for the login page
    const err = new Error(message);
    err.code   = error.response?.data?.code;
    err.status = error.response?.status;
    return Promise.reject(err);
  }
);

export default client;

// ── Auth — Admin ──────────────────────────────────────────────────────────────
export const adminRegister = (data) => client.post('/auth/register', data);
export const adminLogin    = (data) => client.post('/auth/login', data);
export const adminLogout   = ()     => {
  localStorage.removeItem('shree_admin_token');
};

// ── Auth — Unified identify (login page step 1) ───────────────────────────────
export const identifyAccount = (email) => client.post('/auth/identify', { email });

// ── Auth — Customer (OTP flow) ────────────────────────────────────────────────
// ── Auth — Customer ───────────────────────────────────────────────────────────
export const customerRegister    = (data)              => client.post('/customers/register', data);
export const customerLoginPassword = (data)            => client.post('/customers/login', data);
export const customerRequestOtp  = (identifier)        => client.post('/customers/request-otp', { identifier });
export const customerVerifyOtp   = (identifier, otp)   => client.post('/customers/verify-otp', { identifier, otp });


// ── Auth — Reseller ───────────────────────────────────────────────────────────
export const resellerRegister    = (data)              => client.post('/resellers/register', data);
export const resellerLogin       = (data)              => client.post('/resellers/login', data);
export const getResellerMe    = ()     => client.get('/resellers/me');
export const resellerLogout   = ()     => {
  localStorage.removeItem('resellerToken');
  localStorage.removeItem('resellerUser');
};


// ── Admin — Reseller verification ─────────────────────────────────────────────
export const fetchResellers = (params) => client.get('/resellers', { params });
export const verifyReseller = (id)     => client.patch(`/resellers/${id}/verify`);
export const rejectReseller = (id)     => client.patch(`/resellers/${id}/reject`);
export const resellerRequestOtp  = (identifier)        => client.post('/resellers/otp/request', { identifier });
export const resellerVerifyOtp   = (identifier, otp)   => client.post('/resellers/otp/verify',  { identifier, otp });

// ── Categories ────────────────────────────────────────────────────────────────
export const fetchCategories  = ()           => client.get('/categories');
export const createCategory   = (data)       => client.post('/categories', data);
export const updateCategory   = (id, data)   => client.put(`/categories/${id}`, data);
export const deleteCategory   = (id)         => client.delete(`/categories/${id}`);

// ── Products ──────────────────────────────────────────────────────────────────
export const fetchProducts    = (params)     => client.get('/products', { params });
export const fetchProductById = (id)         => client.get(`/products/${id}`);
export const createProduct    = (data)       => client.post('/products', data);
export const updateProduct    = (id, data)   => client.patch(`/products/${id}`, data);
export const deleteProduct    = (id)         => client.delete(`/products/${id}`);
export const toggleFeatured   = (id)         => client.patch(`/products/${id}/featured`);
export const getFeaturedProducts = ()        => client.get('/products/featured');

// ── Cart ───────────────────────────────────────────────────────────────────────
export const getCart            = ()         => client.get('/cart');
export const addToCart          = (data)     => client.post('/cart/add', data);
export const updateCartItem     = (id, data) => client.patch(`/cart/item/${id}`, data);
export const removeFromCart     = (id)       => client.delete(`/cart/item/${id}`);
export const clearCart          = ()         => client.delete('/cart/clear');

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
export const createOrder       = (data)     => client.post('/orders', data);
export const fetchOrders       = (params)   => client.get('/orders', { params });
export const fetchOrderById    = (id)       => client.get(`/orders/${id}`);
export const updateOrderStatus = (id, data) => client.patch(`/orders/${id}/status`, data);
export const fetchOrderStats   = ()         => client.get('/orders/stats');

// ── Upload ────────────────────────────────────────────────────────────────────
export const uploadImage         = (formData) => client.post('/media/upload', formData);
export const uploadCategoryImage = (formData) => client.post('/media/upload', formData);

// ── Payment — PhonePe ─────────────────────────────────────────────────────────
export const initiatePhonePePayment = (data) =>
  client.post('/payment/phonepe/initiate', data);

export const confirmPhonePePayment = (data) =>
  client.post('/payment/phonepe/confirm', data);

export const checkPhonePePaymentStatus = (merchantTransactionId) =>
  client.get(`/payment/phonepe/status/${merchantTransactionId}`);