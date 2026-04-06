import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomer } from '../context/CustomerContext';
import { adminLogin }  from '../api/client';
import './CustomerAuth.css';

const LoginPage = () => {
  const { login }    = useCustomer();
  const navigate     = useNavigate();
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // ── Try admin first, then customer ────────────────────────────────────────
    // Admin accounts are seeded once — if the email matches an admin
    // the admin endpoint succeeds and we redirect to /admin
    // If it fails with 401 we try the customer endpoint
    // Any other error (network, server) surfaces immediately
    try {
      const res = await adminLogin(form);
      localStorage.setItem('shree_admin_token', res.data.token);
      navigate('/admin');
      return;
    } catch (adminErr) {
      // 401 means not an admin — try customer login
      // Any other status means something else went wrong
      if (!adminErr.message.includes('Invalid')) {
        setError(adminErr.message);
        setLoading(false);
        return;
      }
    }

    try {
      await login(form);
      navigate('/account/orders');
    } catch (customerErr) {
      // Both failed — show a single clean message
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="headline-md" style={{ marginBottom: 'var(--spacing-2)' }}>
          Welcome back
        </h1>
        <p className="body-lg auth-subtitle">
          Sign in to your Shree Collection account
        </p>

        {error && (
          <div className="auth-error" style={{ marginBottom: 'var(--spacing-6)' }}>
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;