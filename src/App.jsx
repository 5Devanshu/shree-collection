import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';

import Navbar             from './components/Navbar';
import Hero               from './components/Hero';
import FeaturedGrid       from './components/FeaturedGrid';
import AdminPanel         from './components/AdminPanel';
import AdminLogin         from './components/AdminLogin';
import CategoryPage       from './components/CategoryPage';
import ProductDescription from './components/ProductDescription';
import Checkout           from './components/Checkout';
import Login              from './components/Login';
import Footer             from './components/Footer';              // ← ADDED
import TermsAndConditions from './components/TermsAndConditions';  // ← ADDED
import CustomerProfile from './components/CustomerProfile';

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
  return (
    <div className="app">
      <Navbar />
      <Routes>
        {/* ── Public storefront ──────────────────────────────────────── */}
        <Route path="/" element={<><Hero /><FeaturedGrid /></>} />
        <Route path="/collections/:category" element={<CategoryPage />} />
        <Route path="/product/:id"           element={<ProductDescription />} />
        <Route path="/checkout"              element={<Checkout />} />
        <Route path="/terms"                 element={<TermsAndConditions />} /> {/* ← ADDED */}

        {/* ── Reseller auth ──────────────────────────────────────────── */}
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />

        {/* ── Admin auth ─────────────────────────────────────────────── */}
        <Route
          path="/admin/login"
          element={
            <AdminGuestRoute>
              <AdminLogin />
            </AdminGuestRoute>
          }
        />

        {/* ── Admin panel — internal guard inside AdminPanel via useEffect */}
        <Route path="/admin/*" element={<AdminPanel />} />

        {/* ── Catch-all ──────────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/profile" element={<CustomerProfile />} />
      </Routes>
      <Footer /> {/* ← ADDED — after Routes so it sits below every page */}
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