import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import FeaturedGrid from './components/FeaturedGrid';
import AdminPanel from './components/AdminPanel';
import CategoryPage from './components/CategoryPage';
import ProductDescription from './components/ProductDescription';
import Checkout from './components/Checkout';

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <Routes>
          <Route path="/" element={
            <>
              <Hero />
              <FeaturedGrid />
            </>
          } />
          <Route path="/collections/:category" element={<CategoryPage />} />
          <Route path="/product/:id" element={<ProductDescription />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/admin/*" element={<AdminPanel />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
