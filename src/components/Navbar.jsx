import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore }    from '../context/StoreContext';
import { useCustomer } from '../context/CustomerContext';
import { adminLogout } from '../api/client';
import './Navbar.css';

const Navbar = () => {
  const { categories, cartCount } = useStore();
  const { customer, isLoggedIn, logout } = useCustomer();
  const navigate = useNavigate();

  // ── Dropdown state ────────────────────────────────────────────────────────
  const [openDropdown, setOpenDropdown] = useState(null); // 'collections', 'admin', 'account', or null

  // ── Check admin token ─────────────────────────────────────────────────────
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = () => {
      const token = localStorage.getItem('shree_admin_token');
      setIsAdmin(!!token);
    };

    checkAdmin();

    // Re-check whenever localStorage changes (login / logout in another tab)
    window.addEventListener('storage', checkAdmin);
    return () => window.removeEventListener('storage', checkAdmin);
  }, []);

  // Also re-check on every render for same-tab login
  useEffect(() => {
    const token = localStorage.getItem('shree_admin_token');
    setIsAdmin(!!token);
  });

  const handleAdminLogout = () => {
    adminLogout();
    setIsAdmin(false);
    navigate('/');
  };

  const handleCustomerLogout = () => {
    logout();
    setOpenDropdown(null); // Close dropdown
    navigate('/');
  };

  const toggleDropdown = (dropdown) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  return (
    <nav className="navbar glass-gold">
      <div className="navbar-container">

        {/* ── Left — Collections dropdown ───────────────────────────────── */}
        <div className="nav-links">
          <div className="nav-dropdown">
            <span
              className="nav-link label-md"
              style={{ cursor: 'pointer' }}
              onClick={() => toggleDropdown('collections')}
            >
              Collections
            </span>
            <div className={`dropdown-content ${openDropdown === 'collections' ? 'active' : ''}`}>
              <Link
                to="/collections/all"
                className="dropdown-item label-md"
                onClick={() => setOpenDropdown(null)}
              >
                All Pieces
              </Link>

            </div>
          </div>
          <Link to="/" className="nav-link label-md">Home</Link>
        </div>

        {/* ── Center — Logo ─────────────────────────────────────────────── */}
        <div className="nav-logo">
          <Link to="/">
            <img src="/logo.png" alt="Shree Collection" className="navbar-logo-img" />
          </Link>
        </div>

        {/* ── Right — Auth state ────────────────────────────────────────── */}
        <div className="nav-actions">

          {/* ── Admin is logged in ────────────────────────────────────────── */}
          {isAdmin && (
            <div className="nav-dropdown">
              <span
                className="nav-link label-md nav-account-pill"
                style={{ cursor: 'pointer' }}
                onClick={() => toggleDropdown('admin')}
              >
                <span className="nav-account-dot nav-account-dot--admin" />
                Admin Portal
              </span>
              <div className={`dropdown-content dropdown-content--right ${openDropdown === 'admin' ? 'active' : ''}`}>
                <Link
                  to="/admin"
                  className="dropdown-item label-md"
                  onClick={() => setOpenDropdown(null)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/admin/products"
                  className="dropdown-item label-md"
                  onClick={() => setOpenDropdown(null)}
                >
                  Products
                </Link>
                <Link
                  to="/admin/categories"
                  className="dropdown-item label-md"
                  onClick={() => setOpenDropdown(null)}
                >
                  Categories
                </Link>
                <Link
                  to="/admin/orders"
                  className="dropdown-item label-md"
                  onClick={() => setOpenDropdown(null)}
                >
                  Orders
                </Link>
                <div className="dropdown-divider" />
                <button
                  className="dropdown-item label-md dropdown-item--danger"
                  onClick={() => {
                    handleAdminLogout();
                    setOpenDropdown(null);
                  }}
                >
                  Logout
                </button>
              </div>
            </div>
          )}

          {/* ── Customer is logged in ─────────────────────────────────────── */}
          {!isAdmin && isLoggedIn && (
            <div className="nav-dropdown">
              <span
                className="nav-link label-md nav-account-pill"
                style={{ cursor: 'pointer' }}
                onClick={() => toggleDropdown('account')}
              >
                <span className="nav-account-dot nav-account-dot--customer" />
                {customer.name.split(' ')[0]}
              </span>
              <div className={`dropdown-content dropdown-content--right ${openDropdown === 'account' ? 'active' : ''}`}>
                <Link
                  to="/account/orders"
                  className="dropdown-item label-md"
                  onClick={() => setOpenDropdown(null)}
                >
                  My Orders
                </Link>
                <Link
                  to="/account/profile"
                  className="dropdown-item label-md"
                  onClick={() => setOpenDropdown(null)}
                >
                  Profile
                </Link>
                <Link
                  to="/account/addresses"
                  className="dropdown-item label-md"
                  onClick={() => setOpenDropdown(null)}
                >
                  Addresses
                </Link>
                <div className="dropdown-divider" />
                <button
                  className="dropdown-item label-md dropdown-item--danger"
                  onClick={() => {
                    handleCustomerLogout();
                    setOpenDropdown(null);
                  }}
                >
                  Logout
                </button>
              </div>
            </div>
          )}

          {/* ── Nobody logged in ──────────────────────────────────────────── */}
          {!isAdmin && !isLoggedIn && (
            <Link to="/login" className="nav-link label-md">Login</Link>
          )}

          {/* ── Cart ──────────────────────────────────────────────────────── */}
          <Link to="/checkout" className="nav-link label-md">
            Cart
            {cartCount > 0 && (
              <span className="cart-badge">{cartCount}</span>
            )}
          </Link>

          {/* ── Terms & Conditions dropdown ──────────────────────────────────── */}
          <div className="nav-dropdown">
            <span
              className="nav-link label-md"
              style={{ cursor: 'pointer' }}
              onClick={() => toggleDropdown('policies')}
            >
              Help
            </span>
            <div className={`dropdown-content dropdown-content--right ${openDropdown === 'policies' ? 'active' : ''}`}>
              <Link
                to="/terms"
                className="dropdown-item label-md"
                onClick={() => setOpenDropdown(null)}
              >
                Terms & Conditions
              </Link>
              <Link
                to="/privacy"
                className="dropdown-item label-md"
                onClick={() => setOpenDropdown(null)}
              >
                Privacy Policy
              </Link>
              <Link
                to="/shipping"
                className="dropdown-item label-md"
                onClick={() => setOpenDropdown(null)}
              >
                Shipping Policy
              </Link>
              <Link
                to="/returns"
                className="dropdown-item label-md"
                onClick={() => setOpenDropdown(null)}
              >
                Return & Refund
              </Link>
            </div>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;