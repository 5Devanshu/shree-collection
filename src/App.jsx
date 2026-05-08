import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { StoreProvider }    from './context/StoreContext';
import { CustomerProvider } from './context/CustomerContext';
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

        {/* Auth */}
        <Route path="/login"          element={<CustomerLogin />} />
        <Route path="/register"       element={<CustomerRegister />} />
        <Route path="/admin/register" element={<AdminRegister />} />

        {/* Customer account */}
        <Route path="/account"           element={<CustomerAccount />} />
        <Route path="/account/orders"    element={<CustomerAccount tab="orders" />} />
        <Route path="/account/profile"   element={<CustomerAccount tab="profile" />} />
        <Route path="/account/addresses" element={<CustomerAccount tab="addresses" />} />

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
      <CustomerProvider>
        <Router>
          <AppLayout />
        </Router>
      </CustomerProvider>
    </StoreProvider>
  );
}

export default App;