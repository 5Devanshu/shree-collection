import React from 'react';
import { NavLink } from 'react-router-dom';
import { useStore }    from '../context/StoreContext';
import { useCustomer } from '../context/CustomerContext';
import './BottomNav.css';

const BottomNav = () => {
  const { cart }     = useStore();
  const { customer } = useCustomer();
  const cartCount    = cart?.reduce((s, i) => s + (i.quantity || 1), 0) || 0;

  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">

      <NavLink to="/" end className={({ isActive }) => `bnav-item${isActive ? ' bnav-active' : ''}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
        <span>Home</span>
      </NavLink>

      <NavLink to="/account" className={({ isActive }) => `bnav-item${isActive ? ' bnav-active' : ''}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
        </svg>
        <span>Wishlist</span>
      </NavLink>

      {/* Centre — Search */}
      <NavLink to="/search" className={({ isActive }) => `bnav-item bnav-center${isActive ? ' bnav-active' : ''}`}>
        <div className="bnav-center-btn">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
        </div>
        <span>Search</span>
      </NavLink>

      <NavLink to="/checkout" className={({ isActive }) => `bnav-item${isActive ? ' bnav-active' : ''}`}>
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/>
          </svg>
          {cartCount > 0 && <span className="bnav-badge">{cartCount}</span>}
        </div>
        <span>Cart</span>
      </NavLink>

      <NavLink
        to={customer ? '/account/profile' : '/login'}
        className={({ isActive }) => `bnav-item${isActive ? ' bnav-active' : ''}`}
      >
        {customer ? (
          <div className="bnav-avatar">
            {customer.name?.charAt(0).toUpperCase()}
          </div>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        )}
        <span>{customer ? 'Account' : 'Login'}</span>
      </NavLink>

    </nav>
  );
};

export default BottomNav;