import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { customerRegister } from '../api/client';

const CustomerRegister = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name:     '',
    email:    '',
    phone:    '',
    password: '',
    confirm:  '',
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      // ✅ Spread each field individually — NOT { name: form }
      const res = await customerRegister({
        name:     form.name,
        email:    form.email,
        phone:    form.phone,
        password: form.password,
      });

      const { token, customer } = res.data;
      localStorage.setItem('shree_customer_token', token);
      localStorage.setItem('shree_customer_data',  JSON.stringify(customer));

      navigate('/account');
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="display-sm">Create Account</h1>
        <p className="body-md disclaimer">Join Shree Collection today.</p>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={onSubmit}>
          <div className="form-group">
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Full Name"
              className="checkout-input"
              required
              autoComplete="name"
            />
          </div>

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
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Phone Number (optional)"
              className="checkout-input"
              autoComplete="tel"
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password (min 8 characters)"
              className="checkout-input"
              required
              autoComplete="new-password"
              minLength={8}
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              name="confirm"
              value={form.confirm}
              onChange={handleChange}
              placeholder="Confirm Password"
              className="checkout-input"
              required
              autoComplete="new-password"
              minLength={8}
            />
          </div>

          <button
            type="submit"
            className="btn-primary complete-order-btn"
            disabled={loading}
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="body-md" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default CustomerRegister;