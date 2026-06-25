import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getResellerMe, updateResellerMe, fetchMyOrders } from '../api/client';
import './ResellerProfile.css';

const labelStyle = {
  display: 'block', fontSize: '0.75rem', fontWeight: 700,
  letterSpacing: '0.06em', textTransform: 'uppercase',
  color: '#888', marginBottom: '0.5rem',
};
const inputStyle = {
  width: '100%', padding: '0.65rem 0.85rem',
  border: '1px solid #e0d5c5', borderRadius: 6,
  fontFamily: 'inherit', fontSize: '0.9rem',
  background: '#faf7f2', outline: 'none', boxSizing: 'border-box',
};

const STATUS_LABEL = {
  pending:    { text: 'Awaiting Verification', cls: 'status-pending' },
  shipped:    { text: 'Shipped',                cls: 'status-shipped' },
  delivered:  { text: 'Delivered',              cls: 'status-delivered' },
  cancelled:  { text: 'Cancelled',              cls: 'status-pending' },
  confirmed:  { text: 'Confirmed',              cls: 'status-shipped' },
};

const ResellerProfile = () => {
  const [tab, setTab] = useState('profile'); // 'profile' | 'orders'

  // ── Profile state ──────────────────────────────────────────────────────────
  const [reseller,   setReseller]   = useState(null);
  const [form,        setForm]       = useState({
    name: '', company: '', address: '', city: '', state: '', pincode: '',
    currentPassword: '', newPassword: '', confirmPassword: '',
  });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile,  setSavingProfile]  = useState(false);
  const [profileError,   setProfileError]   = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // ── Orders state ───────────────────────────────────────────────────────────
  const [orders,        setOrders]        = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError,   setOrdersError]   = useState('');

  // ── Load profile ────────────────────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const res  = await getResellerMe();
      const data = res.data?.data || res.data;
      setReseller(data);
      setForm(prev => ({
        ...prev,
        name:    data?.name    || '',
        company: data?.company || '',
        address: data?.address || '',
        city:    data?.city    || '',
        state:   data?.state   || '',
        pincode: data?.pincode || '',
      }));
    } catch {
      setProfileError('Failed to load your profile.');
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  // ── Load orders ─────────────────────────────────────────────────────────────
  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const res  = await fetchMyOrders({ limit: 50 });
      const data = res.data?.orders || res.data?.data || [];
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrdersError('Failed to load your orders.');
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);
  useEffect(() => { if (tab === 'orders') loadOrders(); }, [tab, loadOrders]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setProfileError('');
    setProfileSuccess('');
  };

  const handleSaveProfile = async () => {
    setProfileError('');
    setProfileSuccess('');

    if (!form.name.trim()) return setProfileError('Name is required.');

    if (form.newPassword || form.confirmPassword || form.currentPassword) {
      if (!form.currentPassword) return setProfileError('Enter your current password to change it.');
      if (form.newPassword.length < 6) return setProfileError('New password must be at least 6 characters.');
      if (form.newPassword !== form.confirmPassword) return setProfileError('New passwords do not match.');
    }

    setSavingProfile(true);
    try {
      const payload = {
        name:    form.name.trim(),
        company: form.company.trim(),
        address: form.address.trim(),
        city:    form.city.trim(),
        state:   form.state.trim(),
        pincode: form.pincode.trim(),
      };
      if (form.newPassword) {
        payload.currentPassword = form.currentPassword;
        payload.newPassword     = form.newPassword;
      }

      const res = await updateResellerMe(payload);
      setReseller(res.data?.data || res.data);
      setProfileSuccess('Profile updated successfully.');
      setForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (err) {
      setProfileError(err?.response?.data?.message || err?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="reseller-profile-page">
      <div className="reseller-profile-header">
        <h1 className="headline-md">My Account</h1>
        {reseller && (
          <span className={`status-badge ${reseller.status === 'verified' ? 'status-delivered' : 'status-pending'}`}>
            {reseller.status === 'verified' ? 'Verified Reseller' : reseller.status}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="reseller-profile-tabs">
        <button
          className={`reseller-tab ${tab === 'profile' ? 'active' : ''}`}
          onClick={() => setTab('profile')}
        >
          Profile & Address
        </button>
        <button
          className={`reseller-tab ${tab === 'orders' ? 'active' : ''}`}
          onClick={() => setTab('orders')}
        >
          My Orders
        </button>
      </div>

      {/* ── Profile Tab ── */}
      {tab === 'profile' && (
        loadingProfile ? (
          <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>Loading…</p>
        ) : (
          <div className="reseller-profile-card">
            {profileError && (
              <div className="reseller-alert error">⚠ {profileError}</div>
            )}
            {profileSuccess && (
              <div className="reseller-alert success">✓ {profileSuccess}</div>
            )}

            {/* Read-only identity */}
            <div className="reseller-readonly-row">
              <div>
                <span style={labelStyle}>Email</span>
                <p className="body-md">{reseller?.email || '—'}</p>
              </div>
              <div>
                <span style={labelStyle}>Phone</span>
                <p className="body-md">{reseller?.phone || '—'}</p>
              </div>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#aaa', marginTop: -8, marginBottom: '1.5rem' }}>
              Contact details — get in touch with support to change your email or phone.
            </p>

            {/* Name + Company */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={labelStyle}>Name *</label>
                <input name="name" value={form.name} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Company</label>
                <input name="company" value={form.company} onChange={handleChange} placeholder="Optional" style={inputStyle} />
              </div>
            </div>

            {/* Address */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={labelStyle}>Address</label>
              <input name="address" value={form.address} onChange={handleChange}
                placeholder="Street, building, area" style={inputStyle} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={labelStyle}>City</label>
                <input name="city" value={form.city} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>State</label>
                <input name="state" value={form.state} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Pincode</label>
                <input name="pincode" value={form.pincode} onChange={handleChange} style={inputStyle} />
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #f0ebe3', margin: '0 0 1.5rem' }} />

            {/* Password change — optional */}
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>Change Password</h3>
            <p style={{ fontSize: '0.78rem', color: '#aaa', marginTop: -8, marginBottom: '1rem' }}>
              Leave blank to keep your current password.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={labelStyle}>Current Password</label>
                <input type="password" name="currentPassword" value={form.currentPassword} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>New Password</label>
                <input type="password" name="newPassword" value={form.newPassword} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Confirm New Password</label>
                <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} style={inputStyle} />
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              style={{
                background: savingProfile ? '#ccc' : '#735c00', color: '#fff',
                border: 'none', borderRadius: 8, padding: '0.7rem 2rem',
                cursor: savingProfile ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 600,
              }}
            >
              {savingProfile ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )
      )}

      {/* ── Orders Tab ── */}
      {tab === 'orders' && (
        <div className="reseller-profile-card">
          {ordersError && (
            <div className="reseller-alert error">⚠ {ordersError}</div>
          )}

          {loadingOrders ? (
            <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>Loading your orders…</p>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <p className="body-lg" style={{ color: 'var(--on-surface-variant)', marginBottom: '1rem' }}>
                You haven't placed any orders yet.
              </p>
              <Link to="/" className="btn btn-secondary">Browse Collections</Link>
            </div>
          ) : (
            <div className="reseller-orders-list">
              {orders.map(order => {
                const statusInfo = STATUS_LABEL[order.status] || { text: order.status, cls: 'status-pending' };
                return (
                  <div key={order.id} className="reseller-order-row">
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        Order #{order.orderNumber}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#aaa', marginTop: 2 }}>
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                        {' · '}
                        {Array.isArray(order.items) ? order.items.length : 0} item{Array.isArray(order.items) && order.items.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                        ₹{Number(order.total || 0).toLocaleString('en-IN')}
                      </div>
                      <span className={`status-badge ${statusInfo.cls}`} style={{ fontSize: '0.72rem', marginTop: 4, display: 'inline-block' }}>
                        {statusInfo.text}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResellerProfile;