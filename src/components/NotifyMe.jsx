import React, { useState } from 'react';
import { useCustomer }     from '../context/CustomerContext';
import { subscribeToStock } from '../api/client';

const NotifyMe = ({ productId }) => {
  const { customer, isLoggedIn } = useCustomer();
  const [email,     setEmail]    = useState(isLoggedIn ? customer.email : '');
  const [submitted, setSubmitted]= useState(false);
  const [loading,   setLoading]  = useState(false);
  const [error,     setError]    = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true); setError('');
    try {
      await subscribeToStock(productId, { email });
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{
        border: '1px solid var(--outline-variant)',
        padding: 'var(--spacing-4) var(--spacing-6)',
        background: 'var(--surface-container-low)',
        marginTop: 'var(--spacing-4)',
      }}>
        <p className="label-md" style={{ color: 'var(--primary)', marginBottom: 4 }}>You're on the list</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>
          We'll email <strong>{email}</strong> the moment this piece is back in stock.
        </p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 'var(--spacing-4)' }}>
      <p className="label-md" style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-3)' }}>
        Notify me when back in stock
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{
            flex: 1,
            minWidth: 200,
            padding: 'var(--spacing-3) 0',
            border: 'none',
            borderBottom: '1px solid var(--outline-variant)',
            background: 'transparent',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.9rem',
            color: 'var(--on-surface)',
          }}
        />
        <button type="submit" className="btn btn-secondary" disabled={loading}
          style={{ padding: 'var(--spacing-3) var(--spacing-6)', fontSize: '0.8rem' }}>
          {loading ? '…' : 'Notify Me'}
        </button>
      </form>
      {error && <p style={{ color: 'var(--on-error)', fontSize: '0.8rem', marginTop: 4 }}>{error}</p>}
    </div>
  );
};

export default NotifyMe;