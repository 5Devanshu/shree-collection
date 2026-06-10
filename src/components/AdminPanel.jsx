import React, { useEffect, useState } from 'react';
import './AdminPanel.css';
import {
  NavLink,
  Link,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { adminLogout }    from '../api/client';
import AdminDashboard     from './AdminDashboard';
import AdminProducts      from './AdminProducts';
import AdminCategory      from './AdminCategory';
import AdminOrders        from './AdminOrders';
import AdminDiscounts     from './AdminDiscounts';

import AdminResellers from './AdminResellers';

const AdminPanel = () => {
  const location = useLocation();
  const navigate  = useNavigate();

  const [adminUser, setAdminUser] = useState(null);

  // ── Auth guard — redirect to admin login if no token ─────────────────────
  useEffect(() => {
    const token = localStorage.getItem('shree_admin_token');
    if (!token) {
      navigate('/admin/login', { replace: true });
      return;
    }
    try {
      const user = JSON.parse(localStorage.getItem('adminUser') || 'null');
      setAdminUser(user);
    } catch {
      setAdminUser(null);
    }
  }, [navigate]);

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/login', { replace: true });
  };

  const getPageTitle = () => {
    if (location.pathname.includes('/products'))   return 'Products Management';
    if (location.pathname.includes('/categories')) return 'Categories Management';
    if (location.pathname.includes('/orders'))     return 'Orders Management';
    if (location.pathname.includes('/discounts'))  return 'Discounts Management';
    if (location.pathname.includes('/resellers'))  return 'Resellers Management';
    return 'Dashboard Overview';
  };

  return (
    <div className="admin-layout">

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <h2 className="headline-md">Shree Admin</h2>
        </div>

        <nav className="admin-nav">
          <NavLink
            end to="/admin"
            className={({ isActive }) => isActive ? 'admin-nav-item active' : 'admin-nav-item'}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/admin/categories"
            className={({ isActive }) => isActive ? 'admin-nav-item active' : 'admin-nav-item'}
          >
            Categories
          </NavLink>
          <NavLink
            to="/admin/products"
            className={({ isActive }) => isActive ? 'admin-nav-item active' : 'admin-nav-item'}
          >
            Products
          </NavLink>
          <NavLink
            to="/admin/discounts"
            className={({ isActive }) => isActive ? 'admin-nav-item active' : 'admin-nav-item'}
          >
            Discounts
          </NavLink>
          <NavLink
            to="/admin/orders"
            className={({ isActive }) => isActive ? 'admin-nav-item active' : 'admin-nav-item'}
          >
            Orders
          </NavLink>
          <NavLink
            to="/admin/resellers"
            className={({ isActive }) => isActive ? 'admin-nav-item active' : 'admin-nav-item'}
          >
            Resellers
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
          <Link to="/" className="btn btn-secondary admin-return-btn">
            ← Return to Store
          </Link>
          <button
            onClick={handleLogout}
            className="btn btn-secondary admin-return-btn"
            style={{ color: 'var(--error, #b3261e)', borderColor: 'rgba(179,38,30,0.3)' }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <main className="admin-main">
        <header className="admin-topbar">
          <h1 className="headline-md">{getPageTitle()}</h1>
          <div className="admin-profile">
            <div className="profile-circle">
              {adminUser?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <span className="label-md">{adminUser?.name || 'Admin'}</span>
          </div>
        </header>

        <Routes>
          <Route path="/"           element={<AdminDashboard />} />
          <Route path="/products"   element={<AdminProducts />}  />
          <Route path="/categories" element={<AdminCategory />}  />
          <Route path="/discounts"  element={<AdminDiscounts />} />
          <Route path="/orders"     element={<AdminOrders />}    />
          <Route path="/resellers"  element={<AdminResellers />} />
        </Routes>
      </main>

    </div>
  );
};

export default AdminPanel;