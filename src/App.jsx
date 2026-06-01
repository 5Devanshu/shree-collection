import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CustomerProvider, useCustomer } from './context/CustomerContext';
import { StoreProvider } from './context/StoreContext';

import Navbar from './components/Navbar';
import Hero from './components/Hero';
import FeaturedGrid from './components/FeaturedGrid';
import AdminPanel from './components/AdminPanel';
import CategoryPage from './components/CategoryPage';
import ProductDescription from './components/ProductDescription';
import Checkout from './components/Checkout';
import CustomerLogin from './components/CustomerLogin';
import CustomerRegister from './components/CustomerRegister';
import CustomerAccount from './components/CustomerAccount';

// Redirects already-logged-in users away from /login and /register
const GuestRoute = ({ children }) => {
  const { customer, loading } = useCustomer();
  if (loading) return null;
  if (customer) return <Navigate to="/" replace />;
  return children;
};

// Redirects guests away from /account
const PrivateRoute = ({ children }) => {
  const { customer, loading } = useCustomer();
  if (loading) return null;
  if (!customer) return <Navigate to="/login" replace />;
  return children;
};

// AppRoutes is a child of CustomerProvider, so useCustomer() works here
function AppRoutes() {
  return (
    <div className="app">
      <Navbar />
      <Routes>
        <Route path="/" element={<><Hero /><FeaturedGrid /></>} />
        <Route path="/collections/:category" element={<CategoryPage />} />
        <Route path="/product/:id" element={<ProductDescription />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/admin/*" element={<AdminPanel />} />

        <Route path="/login" element={
          <GuestRoute><CustomerLogin /></GuestRoute>
        } />
        <Route path="/register" element={
          <GuestRoute><CustomerRegister /></GuestRoute>
        } />
        <Route path="/account" element={
          <PrivateRoute><CustomerAccount /></PrivateRoute>
        } />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      {/* CustomerProvider is INSIDE Router — useNavigate works in its children */}
      <CustomerProvider>
        {/* StoreProvider is inside Router so any store action can navigate if needed */}
        <StoreProvider>
          <AppRoutes />
        </StoreProvider>
      </CustomerProvider>
    </Router>
  );
}

export default App;