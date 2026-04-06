import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { StoreProvider }    from './context/StoreContext';
import { CustomerProvider } from './context/CustomerContext';
import Navbar               from './components/Navbar';
import Hero                 from './components/Hero';
import FeaturedGrid         from './components/FeaturedGrid';
import AdminPanel           from './components/AdminPanel';
import CategoryPage         from './components/CategoryPage';
import ProductDescription   from './components/ProductDescription';
import Checkout             from './components/Checkout';
import CustomerLogin        from './components/CustomerLogin';
import CustomerRegister     from './components/CustomerRegister';
import CustomerAccount      from './components/CustomerAccount';

function App() {
  return (
    <CustomerProvider>
      <StoreProvider>
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

              {/* Admin — protected, redirects to /login if no token */}
              <Route path="/admin/*" element={<AdminPanel />} />
            </Routes>
          </div>
        </Router>
      </StoreProvider>
    </CustomerProvider>
  );
}

export default App;