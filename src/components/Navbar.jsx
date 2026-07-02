import React, { useState, useEffect } from 'react';
import { Link, useNavigate }          from 'react-router-dom';
import { useStore }                   from '../context/StoreContext';
import { adminLogout }                from '../api/client';
import './Navbar.css';
import SearchBar from './SearchBar';

const Navbar = () => {
  const { categories, cartCount, customer, logoutCustomer } = useStore();
  const navigate = useNavigate();

  const [openDropdown,       setOpenDropdown]       = useState(null);
  const [isAdmin,            setIsAdmin]            = useState(false);
  const [reseller,           setReseller]           = useState(null);
  const [isResellerLoggedIn, setIsResellerLoggedIn] = useState(false);
  const [searchOpen,         setSearchOpen]         = useState(false);

  // Check admin token on mount + on storage change (other tabs)
  useEffect(() => {
    const checkAdmin = () => setIsAdmin(!!localStorage.getItem('shree_admin_token'));
    checkAdmin();
    window.addEventListener('storage', checkAdmin);
    return () => window.removeEventListener('storage', checkAdmin);
  }, []);

  // Re-check on every render (same-tab login)
  useEffect(() => {
    setIsAdmin(!!localStorage.getItem('shree_admin_token'));
  });

  // Check reseller token on mount + storage change
  useEffect(() => {
    const checkReseller = () => {
      const token = localStorage.getItem('resellerToken');
      const user  = localStorage.getItem('resellerUser');
      if (token && user) {
        try {
          setReseller(JSON.parse(user));
          setIsResellerLoggedIn(true);
        } catch {
          setIsResellerLoggedIn(false);
          setReseller(null);
        }
      } else {
        setIsResellerLoggedIn(false);
        setReseller(null);
      }
    };
    checkReseller();
    window.addEventListener('storage', checkReseller);
    return () => window.removeEventListener('storage', checkReseller);
  }, []);

  // ── Logout handlers ───────────────────────────────────────────────────────
  const handleAdminLogout = () => {
    adminLogout();
    setIsAdmin(false);
    setOpenDropdown(null);
    navigate('/');
  };

  const handleResellerLogout = () => {
    localStorage.removeItem('resellerToken');
    localStorage.removeItem('resellerUser');
    setIsResellerLoggedIn(false);
    setReseller(null);
    setOpenDropdown(null);
    navigate('/');
  };

  const handleCustomerLogout = () => {
    logoutCustomer();
    setOpenDropdown(null);
    navigate('/');
  };

  const toggleDropdown = (name) =>
    setOpenDropdown(openDropdown === name ? null : name);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    if (openDropdown) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openDropdown]);

  return (
    <>
      <nav className="navbar glass-gold">
        <div className="navbar-container">

          {/* ── Left — Collections dropdown ─────────────────────────────── */}
          <div className="nav-links">
            <div className="nav-dropdown" onClick={(e) => e.stopPropagation()}>
              <span
                className="nav-link label-md"
                style={{ cursor: 'pointer' }}
                onClick={() => toggleDropdown('collections')}
              >
                Collections
              </span>
              <div className={`dropdown-content ${openDropdown === 'collections' ? 'active' : ''}`}>
                <Link to="/collections/all" className="dropdown-item label-md" onClick={() => setOpenDropdown(null)}>
                  All Pieces
                </Link>
                {categories?.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/collections/${cat.slug}`}
                    className="dropdown-item label-md"
                    onClick={() => setOpenDropdown(null)}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            <Link to="/" className="nav-link label-md">Home</Link>
          </div>

          {/* ── Center — Logo ───────────────────────────────────────────── */}
          <div className="nav-logo">
            <Link to="/">
              <img src="/logo.png" alt="Shree Collection" className="navbar-logo-img" />
            </Link>
          </div>

          {/* ── Right — Search + Auth + Cart + Help ─────────────────────── */}
          <div className="nav-actions">

            {/* ── Search button ─────────────────────────────────────────── */}
            <button
              className="nav-link label-md nav-search-btn"
              onClick={() => setSearchOpen(true)}
              aria-label="Search products"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Search
            </button>

            {/* ── Admin logged in ───────────────────────────────────────── */}
            {isAdmin && (
              <div className="nav-dropdown" onClick={(e) => e.stopPropagation()}>
                <span
                  className="nav-link label-md nav-account-pill"
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleDropdown('admin')}
                >
                  <span className="nav-account-dot nav-account-dot--admin" />
                  Admin Portal
                </span>
                <div className={`dropdown-content dropdown-content--right ${openDropdown === 'admin' ? 'active' : ''}`}>
                  <Link to="/admin"            className="dropdown-item label-md" onClick={() => setOpenDropdown(null)}>Dashboard</Link>
                  <Link to="/admin/products"   className="dropdown-item label-md" onClick={() => setOpenDropdown(null)}>Products</Link>
                  <Link to="/admin/categories" className="dropdown-item label-md" onClick={() => setOpenDropdown(null)}>Categories</Link>
                  <Link to="/admin/orders"     className="dropdown-item label-md" onClick={() => setOpenDropdown(null)}>Orders</Link>
                  <Link to="/admin/resellers"  className="dropdown-item label-md" onClick={() => setOpenDropdown(null)}>Resellers</Link>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item label-md dropdown-item--danger" onClick={handleAdminLogout}>
                    Logout
                  </button>
                </div>
              </div>
            )}

            {/* ── Reseller logged in ────────────────────────────────────── */}
            {!isAdmin && isResellerLoggedIn && (
              <div className="nav-dropdown" onClick={(e) => e.stopPropagation()}>
                <span
                  className="nav-link label-md nav-account-pill"
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleDropdown('reseller')}
                >
                  <span className="nav-account-dot nav-account-dot--reseller" />
                  {reseller?.name?.split(' ')[0] || 'Reseller'}
                </span>
                <div className={`dropdown-content dropdown-content--right ${openDropdown === 'reseller' ? 'active' : ''}`}>
                  <div className="dropdown-item label-md" style={{ color: 'var(--on-surface-variant)', cursor: 'default' }}>
                    {reseller?.company || 'Reseller Account'}
                  </div>
                  <div className="dropdown-divider" />
                  <Link to="/reseller/profile" className="dropdown-item label-md" onClick={() => setOpenDropdown(null)}>
                    My Profile
                  </Link>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item label-md dropdown-item--danger" onClick={handleResellerLogout}>
                    Logout
                  </button>
                </div>
              </div>
            )}

            {/* ── Customer logged in ────────────────────────────────────── */}
            {!isAdmin && !isResellerLoggedIn && customer && (
              <div className="nav-dropdown" onClick={(e) => e.stopPropagation()}>
                <span
                  className="nav-link label-md nav-account-pill"
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleDropdown('customer')}
                >
                  <span className="nav-account-dot" />
                  {customer.name?.split(' ')[0] || 'Account'}
                </span>
                <div className={`dropdown-content dropdown-content--right ${openDropdown === 'customer' ? 'active' : ''}`}>
                  <div className="dropdown-item label-md" style={{ color: 'var(--on-surface-variant)', cursor: 'default' }}>
                    {customer.email || customer.phone || customer.username}
                  </div>
                  <div className="dropdown-divider" />
                  <Link to="/profile" className="dropdown-item label-md" onClick={() => setOpenDropdown(null)}>
                    My Profile
                  </Link>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item label-md dropdown-item--danger" onClick={handleCustomerLogout}>
                    Logout
                  </button>
                </div>
              </div>
            )}

            {/* ── Nobody logged in ─────────────────────────────────────── */}
            {!isAdmin && !isResellerLoggedIn && !customer && (
              <Link to="/login" className="nav-link label-md">Login</Link>
            )}

            {/* ── Cart ─────────────────────────────────────────────────── */}
            <Link to="/checkout" className="nav-link label-md">
              Cart
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>

            {/* ── Help dropdown ─────────────────────────────────────────── */}
            <div className="nav-dropdown" onClick={(e) => e.stopPropagation()}>
              <span
                className="nav-link label-md"
                style={{ cursor: 'pointer' }}
                onClick={() => toggleDropdown('policies')}
              >
                Help
              </span>
              <div className={`dropdown-content dropdown-content--right ${openDropdown === 'policies' ? 'active' : ''}`}>
                <Link to="/terms"    className="dropdown-item label-md" onClick={() => setOpenDropdown(null)}>Terms & Conditions</Link>
                <Link to="/privacy"  className="dropdown-item label-md" onClick={() => setOpenDropdown(null)}>Privacy Policy</Link>
                <Link to="/shipping" className="dropdown-item label-md" onClick={() => setOpenDropdown(null)}>Shipping Policy</Link>
                <Link to="/returns"  className="dropdown-item label-md" onClick={() => setOpenDropdown(null)}>Return & Refund</Link>
              </div>
            </div>

          </div>
        </div>
      </nav>

      {/* SearchBar rendered outside <nav> so its overlay covers the full viewport */}
      <SearchBar isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};

export default Navbar;