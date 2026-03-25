import React from 'react';
import './AdminPanel.css';
import { NavLink, Link, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import AdminProducts from './AdminProducts';
import AdminCategory from './AdminCategory';
import AdminOrders from './AdminOrders';

const AdminPanel = () => {
  const location = useLocation();

  // Helper to get active page name for the topbar
  const getPageTitle = () => {
    if (location.pathname.includes('/products')) return 'Products Management';
    if (location.pathname.includes('/categories')) return 'Categories Management';
    if (location.pathname.includes('/orders')) return 'Orders Management';
    return 'Dashboard Overview';
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <h2 className="headline-md">Shree Admin</h2>
        </div>
        <nav className="admin-nav">
          <NavLink end to="/admin" className={({isActive}) => isActive ? "admin-nav-item active" : "admin-nav-item"}>Dashboard</NavLink>
          <NavLink to="/admin/categories" className={({isActive}) => isActive ? "admin-nav-item active" : "admin-nav-item"}>Categories</NavLink>
          <NavLink to="/admin/products" className={({isActive}) => isActive ? "admin-nav-item active" : "admin-nav-item"}>Products</NavLink>
          <NavLink to="/admin/orders" className={({isActive}) => isActive ? "admin-nav-item active" : "admin-nav-item"}>Orders</NavLink>
          <a href="#" className="admin-nav-item">Media Library</a>
        </nav>
        <div className="admin-sidebar-footer">
          <Link to="/" className="btn btn-secondary admin-return-btn">Return to Store</Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {/* Top Navbar */}
        <header className="admin-topbar">
          <h1 className="headline-md">{getPageTitle()}</h1>
          <div className="admin-profile">
            <div className="profile-circle">A</div>
            <span className="label-md">Admin User</span>
          </div>
        </header>

        {/* Dynamic Nested Route Content */}
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/products" element={<AdminProducts />} />
          <Route path="/categories" element={<AdminCategory />} />
          <Route path="/orders" element={<AdminOrders />} />
        </Routes>

      </main>
    </div>
  );
};

export default AdminPanel;
