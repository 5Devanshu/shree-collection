import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore }    from '../context/StoreContext';
import { useCustomer } from '../context/CustomerContext';
import './MobileHeader.css';

const MobileHeader = ({ showBack = false, showCart = false }) => {
  const navigate          = useNavigate();
  const { cartCount }     = useStore();         // ✅ already a number
  const { customer }      = useCustomer();
  const firstName         = customer?.name?.split(' ')[0] || 'there';

  return (
    <header className="mobile-header">
      {/* Left */}
      <div className="mh-left">
        {showBack ? (
          <button className="mh-icon-btn" onClick={() => navigate(-1)} aria-label="Back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
        ) : (
          <div className="mh-welcome">
            <span className="mh-welcome-sub">Welcome back,</span>
            <span className="mh-welcome-name">
              {customer ? `${firstName}!` : 'Guest!'}
            </span>
          </div>
        )}
      </div>

      {/* Right */}
      <div className="mh-right">
        {/* Search */}
        <Link to="/search" className="mh-icon-btn" aria-label="Search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
        </Link>

        {/* Cart (product page) or Notification bell (home) */}
        {showCart ? (
          <Link to="/checkout" className="mh-icon-btn mh-cart-btn" aria-label="Cart">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/>
            </svg>
            {cartCount > 0 && (
              <span className="mh-badge">{cartCount > 99 ? '99+' : cartCount}</span>
            )}
          </Link>
        ) : (
          <button className="mh-icon-btn mh-notif-btn" aria-label="Notifications">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            <span className="mh-notif-dot"/>
          </button>
        )}
      </div>
    </header>
  );
};

export default MobileHeader;