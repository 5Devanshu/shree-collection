import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation }     from 'react-router-dom';
import { useStore }                            from '../context/StoreContext';
import { adminLogout }                         from '../api/client';
import './Navbar.css';
import SearchBar from './SearchBar';

const Navbar = () => {
  const { categories, cartCount, customer, logoutCustomer } = useStore();
  const navigate  = useNavigate();
  const location  = useLocation();
  const drawerRef = useRef(null);

  const [openDropdown,       setOpenDropdown]       = useState(null);
  const [isAdmin,            setIsAdmin]            = useState(false);
  const [reseller,           setReseller]           = useState(null);
  const [isResellerLoggedIn, setIsResellerLoggedIn] = useState(false);
  const [searchOpen,         setSearchOpen]         = useState(false);
  const [drawerOpen,         setDrawerOpen]         = useState(false);
  const [drawerSection,      setDrawerSection]      = useState(null); // 'collections' | 'account'

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); setDrawerSection(null); }, [location.pathname]);

  // Check admin token
  useEffect(() => {
    const check = () => setIsAdmin(!!localStorage.getItem('shree_admin_token'));
    check();
    window.addEventListener('storage', check);
    return () => window.removeEventListener('storage', check);
  }, []);
  useEffect(() => { setIsAdmin(!!localStorage.getItem('shree_admin_token')); });

  // Check reseller token
  useEffect(() => {
    const check = () => {
      const token = localStorage.getItem('resellerToken');
      const user  = localStorage.getItem('resellerUser');
      if (token && user) {
        try { setReseller(JSON.parse(user)); setIsResellerLoggedIn(true); }
        catch { setIsResellerLoggedIn(false); setReseller(null); }
      } else { setIsResellerLoggedIn(false); setReseller(null); }
    };
    check();
    window.addEventListener('storage', check);
    return () => window.removeEventListener('storage', check);
  }, []);

  // Close desktop dropdown on outside click
  useEffect(() => {
    const handler = () => setOpenDropdown(null);
    if (openDropdown) document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [openDropdown]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  // ── Logout helpers ────────────────────────────────────────────────────────
  const handleAdminLogout = () => {
    adminLogout(); setIsAdmin(false); setOpenDropdown(null); setDrawerOpen(false); navigate('/');
  };
  const handleResellerLogout = () => {
    localStorage.removeItem('resellerToken'); localStorage.removeItem('resellerUser');
    setIsResellerLoggedIn(false); setReseller(null);
    setOpenDropdown(null); setDrawerOpen(false); navigate('/');
  };
  const handleCustomerLogout = () => {
    logoutCustomer(); setOpenDropdown(null); setDrawerOpen(false); navigate('/');
  };

  const toggleDropdown = (name) =>
    setOpenDropdown(openDropdown === name ? null : name);

  // ── Derived account label ─────────────────────────────────────────────────
  const accountLabel = isAdmin
    ? 'Admin Portal'
    : isResellerLoggedIn
      ? (reseller?.name?.split(' ')[0] || 'Reseller')
      : customer
        ? (customer.name?.split(' ')[0] || 'Account')
        : null;

  const accountDotClass = isAdmin
    ? 'nav-account-dot nav-account-dot--admin'
    : isResellerLoggedIn
      ? 'nav-account-dot nav-account-dot--reseller'
      : 'nav-account-dot';

  return (
    <>
      <nav className="navbar glass-gold">
        <div className="navbar-container">

          {/* ════════════════════════════════════════════════════════════════
              DESKTOP NAV — hidden on mobile
          ════════════════════════════════════════════════════════════════ */}
          <div className="nav-links desktop-only">
            <div className="nav-dropdown" onClick={(e) => e.stopPropagation()}>
              <span className="nav-link label-md" style={{ cursor: 'pointer' }}
                onClick={() => toggleDropdown('collections')}>
                Collections
              </span>
              <div className={`dropdown-content ${openDropdown === 'collections' ? 'active' : ''}`}>
                <Link to="/collections/all" className="dropdown-item label-md" onClick={() => setOpenDropdown(null)}>All Pieces</Link>
                {categories?.map(cat => (
                  <Link key={cat.id} to={`/collections/${cat.slug}`} className="dropdown-item label-md" onClick={() => setOpenDropdown(null)}>
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
            <Link to="/" className="nav-link label-md">Home</Link>
          </div>

          {/* ── MOBILE — Hamburger ───────────────────────────────────────── */}
          <button
            className="nav-hamburger mobile-only"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <span /><span /><span />
          </button>

          {/* ── Center — Logo ───────────────────────────────────────────── */}
          <div className="nav-logo">
            <Link to="/"><img src="/logo.png" alt="Shree Collection" className="navbar-logo-img" /></Link>
          </div>

          {/* ════════════════════════════════════════════════════════════════
              DESKTOP RIGHT ACTIONS — hidden on mobile
          ════════════════════════════════════════════════════════════════ */}
          <div className="nav-actions desktop-only">
            <button className="nav-link label-md nav-search-btn" onClick={() => setSearchOpen(true)} aria-label="Search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Search
            </button>

            {/* Admin */}
            {isAdmin && (
              <div className="nav-dropdown" onClick={(e) => e.stopPropagation()}>
                <span className="nav-link label-md nav-account-pill" style={{ cursor: 'pointer' }} onClick={() => toggleDropdown('admin')}>
                  <span className="nav-account-dot nav-account-dot--admin" />Admin Portal
                </span>
                <div className={`dropdown-content dropdown-content--right ${openDropdown === 'admin' ? 'active' : ''}`}>
                  <Link to="/admin"            className="dropdown-item label-md" onClick={() => setOpenDropdown(null)}>Dashboard</Link>
                  <Link to="/admin/products"   className="dropdown-item label-md" onClick={() => setOpenDropdown(null)}>Products</Link>
                  <Link to="/admin/categories" className="dropdown-item label-md" onClick={() => setOpenDropdown(null)}>Categories</Link>
                  <Link to="/admin/orders"     className="dropdown-item label-md" onClick={() => setOpenDropdown(null)}>Orders</Link>
                  <Link to="/admin/resellers"  className="dropdown-item label-md" onClick={() => setOpenDropdown(null)}>Resellers</Link>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item label-md dropdown-item--danger" onClick={handleAdminLogout}>Logout</button>
                </div>
              </div>
            )}

            {/* Reseller */}
            {!isAdmin && isResellerLoggedIn && (
              <div className="nav-dropdown" onClick={(e) => e.stopPropagation()}>
                <span className="nav-link label-md nav-account-pill" style={{ cursor: 'pointer' }} onClick={() => toggleDropdown('reseller')}>
                  <span className="nav-account-dot nav-account-dot--reseller" />
                  {reseller?.name?.split(' ')[0] || 'Reseller'}
                </span>
                <div className={`dropdown-content dropdown-content--right ${openDropdown === 'reseller' ? 'active' : ''}`}>
                  <div className="dropdown-item label-md" style={{ color: 'var(--on-surface-variant)', cursor: 'default' }}>{reseller?.company || 'Reseller Account'}</div>
                  <div className="dropdown-divider" />
                  <Link to="/reseller/profile" className="dropdown-item label-md" onClick={() => setOpenDropdown(null)}>My Profile</Link>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item label-md dropdown-item--danger" onClick={handleResellerLogout}>Logout</button>
                </div>
              </div>
            )}

            {/* Customer */}
            {!isAdmin && !isResellerLoggedIn && customer && (
              <div className="nav-dropdown" onClick={(e) => e.stopPropagation()}>
                <span className="nav-link label-md nav-account-pill" style={{ cursor: 'pointer' }} onClick={() => toggleDropdown('customer')}>
                  <span className="nav-account-dot" />{customer.name?.split(' ')[0] || 'Account'}
                </span>
                <div className={`dropdown-content dropdown-content--right ${openDropdown === 'customer' ? 'active' : ''}`}>
                  <div className="dropdown-item label-md" style={{ color: 'var(--on-surface-variant)', cursor: 'default' }}>{customer.email || customer.phone}</div>
                  <div className="dropdown-divider" />
                  <Link to="/profile" className="dropdown-item label-md" onClick={() => setOpenDropdown(null)}>My Profile</Link>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item label-md dropdown-item--danger" onClick={handleCustomerLogout}>Logout</button>
                </div>
              </div>
            )}

            {/* Nobody */}
            {!isAdmin && !isResellerLoggedIn && !customer && (
              <Link to="/login" className="nav-link label-md">Login</Link>
            )}

            <Link to="/checkout" className="nav-link label-md">
              Cart{cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>

            <div className="nav-dropdown" onClick={(e) => e.stopPropagation()}>
              <span className="nav-link label-md" style={{ cursor: 'pointer' }} onClick={() => toggleDropdown('policies')}>Help</span>
              <div className={`dropdown-content dropdown-content--right ${openDropdown === 'policies' ? 'active' : ''}`}>
                <Link to="/terms"    className="dropdown-item label-md" onClick={() => setOpenDropdown(null)}>Terms & Conditions</Link>
                <Link to="/privacy"  className="dropdown-item label-md" onClick={() => setOpenDropdown(null)}>Privacy Policy</Link>
                <Link to="/shipping" className="dropdown-item label-md" onClick={() => setOpenDropdown(null)}>Shipping Policy</Link>
                <Link to="/returns"  className="dropdown-item label-md" onClick={() => setOpenDropdown(null)}>Return & Refund</Link>
              </div>
            </div>
          </div>

          {/* ── MOBILE — right icons (search + cart) ────────────────────── */}
          <div className="nav-mobile-icons mobile-only">
            <button className="nav-icon-btn" onClick={() => setSearchOpen(true)} aria-label="Search">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
            <Link to="/checkout" className="nav-icon-btn" aria-label="Cart">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>
          </div>

        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════════════════
          MOBILE DRAWER — slides in from left
      ══════════════════════════════════════════════════════════════════════ */}
      {drawerOpen && (
        <div className="drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <div className="drawer" ref={drawerRef} onClick={(e) => e.stopPropagation()}>

            {/* Drawer header */}
            <div className="drawer-header">
              <img src="/logo.png" alt="Shree Collection" className="drawer-logo" />
              <button className="drawer-close" onClick={() => setDrawerOpen(false)} aria-label="Close menu">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="drawer-body">

              {/* Collections section */}
              <div className="drawer-section">
                <button className="drawer-section-header" onClick={() => setDrawerSection(drawerSection === 'collections' ? null : 'collections')}>
                  <span>Collections</span>
                  <svg className={`drawer-chevron ${drawerSection === 'collections' ? 'open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {drawerSection === 'collections' && (
                  <div className="drawer-sub">
                    <Link to="/collections/all" className="drawer-sub-item">All Pieces</Link>
                    {categories?.map(cat => (
                      <Link key={cat.id} to={`/collections/${cat.slug}`} className="drawer-sub-item">{cat.name}</Link>
                    ))}
                  </div>
                )}
              </div>

              <Link to="/" className="drawer-item">Home</Link>

              {/* Account section */}
              {accountLabel ? (
                <div className="drawer-section">
                  <button className="drawer-section-header" onClick={() => setDrawerSection(drawerSection === 'account' ? null : 'account')}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={accountDotClass} />
                      {accountLabel}
                    </span>
                    <svg className={`drawer-chevron ${drawerSection === 'account' ? 'open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                  {drawerSection === 'account' && (
                    <div className="drawer-sub">
                      {isAdmin && <>
                        <Link to="/admin"            className="drawer-sub-item">Dashboard</Link>
                        <Link to="/admin/products"   className="drawer-sub-item">Products</Link>
                        <Link to="/admin/categories" className="drawer-sub-item">Categories</Link>
                        <Link to="/admin/orders"     className="drawer-sub-item">Orders</Link>
                        <Link to="/admin/resellers"  className="drawer-sub-item">Resellers</Link>
                      </>}
                      {isResellerLoggedIn && !isAdmin && (
                        <Link to="/reseller/profile" className="drawer-sub-item">My Profile</Link>
                      )}
                      {customer && !isAdmin && !isResellerLoggedIn && (
                        <Link to="/profile" className="drawer-sub-item">My Profile</Link>
                      )}
                      <button className="drawer-sub-item drawer-sub-item--danger" onClick={
                        isAdmin ? handleAdminLogout
                          : isResellerLoggedIn ? handleResellerLogout
                          : handleCustomerLogout
                      }>Logout</button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="drawer-item">Login</Link>
              )}

              <Link to="/checkout" className="drawer-item">
                Cart {cartCount > 0 && <span className="cart-badge" style={{ marginLeft: 6 }}>{cartCount}</span>}
              </Link>

              {/* Help section */}
              <div className="drawer-section">
                <button className="drawer-section-header" onClick={() => setDrawerSection(drawerSection === 'help' ? null : 'help')}>
                  <span>Help</span>
                  <svg className={`drawer-chevron ${drawerSection === 'help' ? 'open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {drawerSection === 'help' && (
                  <div className="drawer-sub">
                    <Link to="/terms"    className="drawer-sub-item">Terms & Conditions</Link>
                    <Link to="/privacy"  className="drawer-sub-item">Privacy Policy</Link>
                    <Link to="/shipping" className="drawer-sub-item">Shipping Policy</Link>
                    <Link to="/returns"  className="drawer-sub-item">Return & Refund</Link>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Search overlay */}
      <SearchBar isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};

export default Navbar;