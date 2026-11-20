import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';

import Navbar             from './components/Navbar';
import Hero               from './components/Hero';
import CategoryShowcase   from './components/CategoryShowcase';
import AdminPanel         from './components/AdminPanel';
import AdminLogin         from './components/AdminLogin';
import CategoryPage       from './components/CategoryPage';
import ProductDescription from './components/ProductDescription';
import Checkout           from './components/Checkout';
import Login              from './components/Login';
import Footer             from './components/Footer';
import TermsAndConditions from './components/TermsAndConditions';
import CustomerProfile    from './components/CustomerProfile';
import CheckoutCallback   from './components/CheckoutCallback';
import ResellerProfile    from './components/ResellerProfile';
import SearchPage         from './components/SearchPage';   // ← NEW
import SessionExpiredBanner from './components/SessionExpiredBanner'; // ← NEW
import ShippingBanner     from './components/ShippingBanner';
import ShreeCollection   from './pages/ShreeCollection';
import CustomPayment     from './components/CustomPayment';
import PaymentProcessing from './components/PaymentProcessing';
import CustomPaymentSuccess from './components/CustomPaymentSuccess';
import PaymentFailed     from './components/PaymentFailed';

// Guard: redirect logged-in resellers away from /reseller/login
const ResellerGuestRoute = ({ children }) => {
  const token = localStorage.getItem('resellerToken');
  if (token) return <Navigate to="/" replace />;
  return children;
};

// Guard: redirect logged-in admins away from /admin/login
const AdminGuestRoute = ({ children }) => {
  const token = localStorage.getItem('shree_admin_token');
  if (token) return <Navigate to="/admin" replace />;
  return children;
};

const GuestRoute = ({ children }) => {
  const loggedIn =
    localStorage.getItem('resellerToken') ||
    localStorage.getItem('shree_customer_token');
  if (loggedIn) return <Navigate to="/" replace />;
  return children;
};

function AppRoutes() {
  const location = useLocation();
  const isSharePage = location.pathname === '/s/shree-collection';
  const isCustomPaymentPage =
    location.pathname === '/pay' || location.pathname.startsWith('/payment/');

  if (isSharePage) {
    return (
      <Routes>
        <Route path="/s/shree-collection" element={<ShreeCollection />} />
      </Routes>
    );
  }

  if (isCustomPaymentPage) {
    return (
      <Routes>
        <Route path="/pay" element={<CustomPayment />} />
        <Route path="/payment/success" element={<CustomPaymentSuccess />} />
        <Route path="/payment/failed" element={<PaymentFailed />} />
        <Route path="/payment/processing" element={<PaymentProcessing />} />
        <Route path="*" element={<Navigate to="/pay" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app">
      {/* Mounted once, above everything — reacts to a 401 from ANY axios
          call (admin, reseller, or customer) fired via notifySessionExpired()
          in api/client.js. Needs to sit inside <Router> because it calls
          useNavigate() to send the person to the right login screen. */}
      <SessionExpiredBanner />
      <ShippingBanner />
      <Navbar />
      <Routes>
        {/* ── Public storefront ──────────────────────────────────────── */}
        <Route path="/"                      element={<><Hero /><CategoryShowcase /></>} />
        <Route path="/collections/:category" element={<CategoryPage />} />
        <Route path="/product/:id"           element={<ProductDescription />} />
        <Route path="/checkout"              element={<Checkout />} />
        <Route path="/checkout/callback"     element={<CheckoutCallback />} />
        <Route path="/terms"                 element={<TermsAndConditions />} />
        <Route path="/search"                element={<SearchPage />} />  {/* ← NEW */}
        <Route path="/s/shree-collection"   element={<ShreeCollection />} />

        {/* ── Auth ───────────────────────────────────────────────────── */}
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />

        {/* ── Admin ──────────────────────────────────────────────────── */}
        <Route path="/admin/login" element={<AdminGuestRoute><AdminLogin /></AdminGuestRoute>} />
        <Route path="/admin/*"     element={<AdminPanel />} />

        {/* ── Profile pages ──────────────────────────────────────────── */}
        <Route path="/profile"           element={<CustomerProfile />} />
        <Route path="/reseller/profile"  element={<ResellerProfile />} />

        {/* ── Catch-all ──────────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <StoreProvider>
        <AppRoutes />
      </StoreProvider>
    </Router>
  );
}

export default App;