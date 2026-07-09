import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { onSessionExpired } from '../utils/sessionExpiry';

// Fixed top banner — shows "Your session has expired, please log in again"
// whenever ANY axios call (customer, reseller, or admin) comes back with an
// invalid/expired token. Mount this ONCE near the root (e.g. in App.jsx,
// alongside <StoreProvider>) so it works regardless of which page the
// person is on when their token dies mid-session.
const LOGIN_ROUTES = {
  customer: '/login',
  reseller: '/login',       // resellers share the customer login screen
  admin:    '/admin/login',
};

const SessionExpiredBanner = () => {
  const [visible, setVisible] = useState(false);
  const [who,     setWho]     = useState('customer');
  const navigate = useNavigate();

  useEffect(() => {
    return onSessionExpired((source) => {
      setWho(source);
      setVisible(true);
    });
  }, []);

  const handleLoginAgain = useCallback(() => {
    setVisible(false);
    const redirect = who === 'admin' ? undefined : window.location.pathname;
    navigate(
      LOGIN_ROUTES[who] + (redirect && redirect !== '/login' ? `?redirect=${encodeURIComponent(redirect)}` : '')
    );
  }, [who, navigate]);

  if (!visible) return null;

  return (
    <div
      role="alert"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 3000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
        flexWrap: 'wrap',
        background: '#fff3cd', borderBottom: '1px solid #ffe08a',
        color: '#7a5b00', padding: '0.75rem 1.25rem',
        fontFamily: 'inherit', fontSize: '0.9rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      <span>
        ⚠ Your session has expired or is no longer valid. Please log in again to continue.
      </span>
      <button
        onClick={handleLoginAgain}
        style={{
          background: '#735c00', color: '#fff', border: 'none', borderRadius: 6,
          padding: '0.4rem 1rem', fontSize: '0.85rem', fontWeight: 600,
          cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        Log In Again
      </button>
      <button
        onClick={() => setVisible(false)}
        aria-label="Dismiss"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '1rem', color: '#7a5b00', lineHeight: 1, padding: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
};

export default SessionExpiredBanner;