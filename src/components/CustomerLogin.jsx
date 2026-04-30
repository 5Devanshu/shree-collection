import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { customerLogin, adminLogin } from '../api/client';

const CustomerLogin = () => {
  const navigate = useNavigate();

  const [form,    setForm]    = useState({ email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

const onSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  const { email, password } = form;

  try {
    const res = await customerLogin({ email, password });
    const { token, customer } = res.data;

    // ✅ Must match what CustomerContext reads
    localStorage.setItem('shree_customer_token', token);
    localStorage.setItem('shree_customer_data',  JSON.stringify(customer));

    // Force a page reload so CustomerContext picks up the new token
    window.location.href = '/account';   // ← use this instead of navigate()
  } catch (err) {
    // Try admin login as fallback
    try {
      const adminRes = await adminLogin({ email, password });
      const { token, admin } = adminRes.data;
      localStorage.setItem('shree_admin_token', token);
      localStorage.setItem('shree_admin_data',  JSON.stringify(admin));
      window.location.href = '/admin';
    } catch {
      setError('Invalid email or password');
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="display-sm">Welcome Back</h1>
        <p className="body-md disclaimer">Sign in to your Shree Collection account.</p>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={onSubmit}>
          <div className="form-group">
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email Address"
              className="checkout-input"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
              className="checkout-input"
              required
              autoComplete="current-password"
              minLength={8}
            />
          </div>

          <button
            type="submit"
            className="btn-primary complete-order-btn"
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="body-md" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)' }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default CustomerLogin;