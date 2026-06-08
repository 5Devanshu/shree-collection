import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './CustomerAuth.css';

const API = import.meta.env.VITE_API_URL || 'https://shree-collection-backend-production.up.railway.app/api';

const ResellerLogin = () => {
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/resellers/login`, form);
      localStorage.setItem('resellerToken', data.token);
      localStorage.setItem('resellerUser',  JSON.stringify(data.reseller));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="display-sm">Reseller Login</h1>
        <p className="body-md auth-subtitle">Access your exclusive reseller pricing.</p>

        {error && <p className="auth-error">{error}</p>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            className="auth-input"
            type="email"
            name="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            className="auth-input"
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <button className="btn-primary auth-submit-btn" type="submit" disabled={loading}>
            {loading ? 'Signing In…' : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          Need reseller access? <Link to="/contact">Contact us</Link>
        </p>
      </div>
    </div>
  );
};

export default ResellerLogin;