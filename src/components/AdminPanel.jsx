import React, { useEffect } from 'react';
import './AdminPanel.css';
import { NavLink, Link, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { adminLogout }    from '../api/client';
import AdminDashboard     from './AdminDashboard';
import AdminProducts      from './AdminProducts';
import AdminCategory      from './AdminCategory';
import AdminOrders        from './AdminOrders';
import AdminDiscounts     from './AdminDiscounts';

const AdminPanel = () => {
  const location = useLocation();
  const navigate  = useNavigate();

  // Redirect to the shared login page if no admin token
  useEffect(() => {
    const token = localStorage.getItem('shree_admin_token');
    if (!token) navigate('/login');
  }, [navigate]);

  const handleLogout = () => {
    adminLogout();
    navigate('/login');
  };

  const getPageTitle = () => {
    if (location.pathname.includes('/products'))   return 'Products Management';
    if (location.pathname.includes('/categories')) return 'Categories Management';
    if (location.pathname.includes('/orders'))     return 'Orders Management';
    if (location.pathname.includes('/discounts'))  return 'Discounts Management';
    return 'Dashboard Overview';
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <h2 className="headline-md">Shree Admin</h2>
        </div>
        <nav className="admin-nav">
          <NavLink end to="/admin"
            className={({ isActive }) => isActive ? 'admin-nav-item active' : 'admin-nav-item'}>
            Dashboard
          </NavLink>
          <NavLink to="/admin/categories"
            className={({ isActive }) => isActive ? 'admin-nav-item active' : 'admin-nav-item'}>
            Categories
          </NavLink>
          <NavLink to="/admin/products"
            className={({ isActive }) => isActive ? 'admin-nav-item active' : 'admin-nav-item'}>
            Products
          </NavLink>
          <NavLink to="/admin/discounts"
            className={({ isActive }) => isActive ? 'admin-nav-item active' : 'admin-nav-item'}>
            Discounts
          </NavLink>
          <NavLink to="/admin/orders"
            className={({ isActive }) => isActive ? 'admin-nav-item active' : 'admin-nav-item'}>
            Orders
          </NavLink>
        </nav>
        <div className="admin-sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
          <Link to="/" className="btn btn-secondary admin-return-btn">
            ← Return to Store
          </Link>
          <button
            onClick={handleLogout}
            className="btn btn-secondary admin-return-btn"
            style={{ color: 'var(--on-error)', borderColor: 'rgba(186,26,26,0.3)' }}
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <h1 className="headline-md">{getPageTitle()}</h1>
          <div className="admin-profile">
            <div className="profile-circle">A</div>
            <span className="label-md">Admin</span>
          </div>
        </header>
        <Routes>
          <Route path="/"           element={<AdminDashboard />} />
          <Route path="/products"   element={<AdminProducts />}  />
          <Route path="/categories" element={<AdminCategory />}  />
          <Route path="/discounts"  element={<AdminDiscounts />} />
          <Route path="/orders"     element={<AdminOrders />}    />
        </Routes>
      </main>
    </div>
  );
};

export default AdminPanel;