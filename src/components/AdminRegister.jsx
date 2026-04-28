import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminRegister } from '../api/client';
import './CustomerAuth.css';

const AdminRegister = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate form
    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const res = await adminRegister({
        name: form.name,
        email: form.email,
        password: form.password,
      });

      if (res.data.token) {
        localStorage.setItem('shree_admin_token', res.data.token);
        navigate('/admin');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Admin may already exist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="headline-md" style={{ marginBottom: 'var(--spacing-2)' }}>
          Admin Registration
        </h1>
        <p className="body-lg auth-subtitle">
          Create the first admin account for Shree Collection
        </p>

        {error && (
          <div className="auth-error" style={{ marginBottom: 'var(--spacing-6)' }}>
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="Admin Name"
              value={form.name}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>

          <div className="auth-field">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="admin@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-field">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={loading}
          >
            {loading ? 'Creating Admin...' : 'Create Admin Account'}
          </button>
        </form>

        <div style={{ marginTop: 'var(--spacing-6)', textAlign: 'center', fontSize: '0.875rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>
            Already have an admin account?{' '}
            <a href="/login" style={{ color: 'var(--primary)' }}>
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminRegister;
