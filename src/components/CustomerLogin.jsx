import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomer } from '../context/CustomerContext';

const CustomerLogin = () => {
  const { login } = useCustomer();
  const navigate  = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');   // ← goes home after login
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', backgroundColor: 'var(--surface-container-lowest)',
    }}>
      <div style={{ width: '100%', maxWidth: '420px', padding: '0 var(--spacing-6)' }}>
        <h1 className="display-sm" style={{ marginBottom: 'var(--spacing-2)' }}>Welcome Back</h1>
        <p className="body-md" style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-10)' }}>
          Sign in to your Shree Collection account.
        </p>

        {error && (
          <p style={{ color: '#c0392b', marginBottom: 'var(--spacing-4)', fontSize: '0.9rem' }}>
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 'var(--spacing-6)' }}>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%', padding: 'var(--spacing-4) 0',
                border: 'none', borderBottom: '1px solid var(--surface-container-highest)',
                background: 'transparent', color: 'var(--on-surface)',
                fontSize: '1rem', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ marginBottom: 'var(--spacing-8)' }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%', padding: 'var(--spacing-4) 0',
                border: 'none', borderBottom: '1px solid var(--primary)',
                background: 'transparent', color: 'var(--on-surface)',
                fontSize: '1rem', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: 'var(--spacing-5)', fontSize: '1rem', letterSpacing: '0.05em' }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="body-md" style={{ textAlign: 'center', marginTop: 'var(--spacing-6)', color: 'var(--on-surface-variant)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)' }}>Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default CustomerLogin;