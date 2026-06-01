import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { StoreProvider }    from './context/StoreContext';
import { CustomerProvider, useCustomer } from './context/CustomerContext';
import Navbar               from './components/Navbar';
import MobileHeader         from './components/MobileHeader';
import BottomNav            from './components/BottomNav';
import Footer               from './components/Footer';
import Hero                 from './components/Hero';
import FeaturedGrid         from './components/FeaturedGrid';
import AdminPanel           from './components/AdminPanel';
import CategoryPage         from './components/CategoryPage';
import ProductDescription   from './components/ProductDescription';
import Checkout             from './components/Checkout';
import CheckoutCallback     from './components/CheckoutCallback';
import PaymentSuccess       from './components/PaymentSuccess';
import CustomerLogin        from './components/CustomerLogin';
import CustomerRegister     from './components/CustomerRegister';
import CustomerAccount      from './components/CustomerAccount';
import AdminRegister        from './components/AdminRegister';
import TermsAndConditions   from './components/TermsAndConditions';

if (import.meta.env.DEV) {
  import('./utils/debugEnv.js');
}

// Inner layout — needs to be inside <Router> to use useLocation
const AppLayout = () => {
  const location   = useLocation();
  const isAdmin    = location.pathname.startsWith('/admin');
  const isProduct  = location.pathname.startsWith('/product/');
  const isAuth     = location.pathname === '/login' || location.pathname === '/register';
  const isCheckout = location.pathname.startsWith('/checkout') || location.pathname.startsWith('/payment');
  const hideShell  = isAdmin || isAuth;

  // ── Route guards — defined inside AppLayout so they have access to Router context ──
  const GuestRoute = React.memo(({ children }) => {
    const { customer, loading } = useCustomer();
    if (loading) return null;
    if (customer) return <Navigate to="/" replace />;
    return children;
  });

  const PrivateRoute = React.memo(({ children }) => {
    const { customer, loading } = useCustomer();
    if (loading) return null;
    if (!customer) return <Navigate to="/login" replace />;
    return children;
  });

  return (
    <div className="app">
      {/* Desktop navbar — hidden on admin/auth pages */}
      {!hideShell && <Navbar />}

      {/* Mobile header — product page shows back arrow, others show welcome */}
      {!hideShell && !isCheckout && (
        <MobileHeader showBack={isProduct} showCart={isProduct} />
      )}

      <Routes>
          {/* Storefront */}
          <Route path="/"                      element={<><Hero /><FeaturedGrid /></>} />
          <Route path="/collections/:category" element={<CategoryPage />} />
          <Route path="/product/:id"           element={<ProductDescription />} />
          <Route path="/checkout"              element={<Checkout />} />
          <Route path="/checkout/callback"     element={<CheckoutCallback />} />
          <Route path="/payment/success"       element={<PaymentSuccess />} />

          {/* Auth — redirect home if already logged in */}
          <Route path="/login"          element={<GuestRoute><CustomerLogin /></GuestRoute>} />
          <Route path="/register"       element={<GuestRoute><CustomerRegister /></GuestRoute>} />
          <Route path="/admin/register" element={<AdminRegister />} />

          {/* Customer account — protected route */}
          <Route path="/account"           element={<PrivateRoute><CustomerAccount /></PrivateRoute>} />
          <Route path="/account/orders"    element={<PrivateRoute><CustomerAccount tab="orders" /></PrivateRoute>} />
          <Route path="/account/profile"   element={<PrivateRoute><CustomerAccount tab="profile" /></PrivateRoute>} />
          <Route path="/account/addresses" element={<PrivateRoute><CustomerAccount tab="addresses" /></PrivateRoute>} />

          {/* Policies */}
          <Route path="/terms"    element={<TermsAndConditions />} />
          <Route path="/privacy"  element={<TermsAndConditions />} />
          <Route path="/shipping" element={<TermsAndConditions />} />
          <Route path="/returns"  element={<TermsAndConditions />} />

          {/* Admin */}
          <Route path="/admin/*" element={<AdminPanel />} />
        </Routes>

        {/* Footer — desktop only, hidden on admin */}
        {!hideShell && <Footer />}

        {/* Bottom nav — mobile only, hidden on admin/auth/checkout */}
        {!hideShell && !isCheckout && <BottomNav />}
      </div>
    );
};

function App() {
  return (
    <StoreProvider>
      <Router>
        <CustomerProvider>    {/* ← must be inside Router so useNavigate works */}
          <AppLayout />
        </CustomerProvider>
      </Router>
    </StoreProvider>
  );
}

export default App;