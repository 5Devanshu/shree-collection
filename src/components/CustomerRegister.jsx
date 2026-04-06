import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomer } from '../context/CustomerContext';
import './CustomerAuth.css';

const CustomerRegister = () => {
  const { register } = useCustomer();
  const navigate     = useNavigate();
  const [form, setForm]   = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const handleSubmit = async (e) => {
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
      await register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
      navigate('/account/orders');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="headline-md">Create account</h1>
        <p className="body-lg auth-subtitle">Join Shree Collection to track your orders</p>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>Full Name</label>
            <input type="text" placeholder="Priya Shah"
              value={form.name} onChange={e => set('name', e.target.value)} required />
          </div>
          <div className="auth-field">
            <label>Email</label>
            <input type="email" placeholder="your@email.com"
              value={form.email} onChange={e => set('email', e.target.value)} required />
          </div>
          <div className="auth-field">
            <label>Phone (optional)</label>
            <input type="tel" placeholder="9876543210"
              value={form.phone} onChange={e => set('phone', e.target.value)} />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input type="password" placeholder="Min. 8 characters"
              value={form.password} onChange={e => set('password', e.target.value)} required />
          </div>
          <div className="auth-field">
            <label>Confirm Password</label>
            <input type="password" placeholder="Repeat password"
              value={form.confirm} onChange={e => set('confirm', e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default CustomerRegister;