import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { StoreProvider }    from './context/StoreContext';
import { CustomerProvider } from './context/CustomerContext';
import Navbar               from './components/Navbar';
import Footer               from './components/Footer';
import Hero                 from './components/Hero';
import FeaturedGrid         from './components/FeaturedGrid';
import AdminPanel           from './components/AdminPanel';
import CategoryPage         from './components/CategoryPage';
import ProductDescription   from './components/ProductDescription';
import Checkout             from './components/Checkout';
import CustomerLogin        from './components/CustomerLogin';
import CustomerRegister     from './components/CustomerRegister';
import CustomerAccount      from './components/CustomerAccount';
import TermsAndConditions   from './components/TermsAndConditions';

// Debug utilities (only in development/non-production)
if (import.meta.env.DEV) {
  import('./utils/debugEnv.js');
}

function App() {
  return (
    <StoreProvider>
      <CustomerProvider>
        <Router>
          <div className="app">
            <Navbar />
            <Routes>
              {/* Storefront */}
              <Route path="/"                      element={<><Hero /><FeaturedGrid /></>} />
              <Route path="/collections/:category" element={<CategoryPage />} />
              <Route path="/product/:id"           element={<ProductDescription />} />
              <Route path="/checkout"              element={<Checkout />} />

              {/* Single login page — routes to admin or customer automatically */}
              <Route path="/login"             element={<CustomerLogin />} />
              <Route path="/register"          element={<CustomerRegister />} />

              {/* Customer account */}
              <Route path="/account"           element={<CustomerAccount />} />
              <Route path="/account/orders"    element={<CustomerAccount tab="orders" />} />
              <Route path="/account/profile"   element={<CustomerAccount tab="profile" />} />
              <Route path="/account/addresses" element={<CustomerAccount tab="addresses" />} />

              {/* Terms, Privacy, Policies */}
              <Route path="/terms"             element={<TermsAndConditions />} />
              <Route path="/privacy"           element={<TermsAndConditions />} />
              <Route path="/shipping"          element={<TermsAndConditions />} />
              <Route path="/returns"           element={<TermsAndConditions />} />

              {/* Admin — protected, redirects to /login if no token */}
              <Route path="/admin/*" element={<AdminPanel />} />
            </Routes>
            <Footer />
          </div>
        </Router>
      </CustomerProvider>
    </StoreProvider>
  );
}

export default App;