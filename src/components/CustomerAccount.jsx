import React, { useState, useEffect } from 'react';
import { useNavigate }  from 'react-router-dom';
import { useCustomer }  from '../context/CustomerContext';
import {
  getMyOrders, updateMyProfile, changePassword,
  addAddress, deleteAddress as apiDeleteAddress,
} from '../api/client';
import './CustomerAuth.css';

// ── Order History Tab ─────────────────────────────────────────────────────────
const OrderHistory = () => {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    getMyOrders()
      .then(res => {
        // Backend returns { success: true, data: [...] }
        const data = res.data?.data || res.data?.orders || res.data || [];
        setOrders(Array.isArray(data) ? data : []);
      })
      .catch(err => setError(err.message))
      .finally(()=> setLoading(false));
  }, []);

  const statusColor = (status) => {
    if (status === 'delivered') return 'status-delivered';
    if (status === 'shipped')   return 'status-shipped';
    if (status === 'cancelled') return 'status-pending';
    return 'status-shipped';
  };

  if (loading) return <p className="body-lg" style={{ color: 'var(--on-surface-variant)' }}>Loading orders…</p>;
  if (error)   return <p className="body-lg" style={{ color: 'var(--on-error)' }}>{error}</p>;
  if (orders.length === 0) return (
    <div style={{ textAlign: 'center', padding: 'var(--spacing-16)', color: 'var(--on-surface-variant)' }}>
      <p className="body-lg">You haven't placed any orders yet.</p>
    </div>
  );

  return (
    <div>
      <h2 className="headline-md account-section-title">My Orders</h2>
      {(Array.isArray(orders) ? orders : []).map(order => (
        <div key={order._id} className="order-card">
          <div className="order-card-header">
            <div>
              <p className="label-md" style={{ color: 'var(--on-surface-variant)' }}>Order ID</p>
              <p className="body-lg" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>#{order._id}</p>
            </div>
            <div>
              <p className="label-md" style={{ color: 'var(--on-surface-variant)' }}>Date</p>
              <p className="body-lg">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div>
              <span className={`status-badge ${statusColor(order.status)}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
            <div>
              <p className="label-md" style={{ color: 'var(--on-surface-variant)' }}>Payment</p>
              <span className={`status-badge ${order.paymentStatus === 'paid' ? 'status-delivered' : 'status-pending'}`}>
                {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
              </span>
            </div>
          </div>
          <div className="order-card-body">
            {(Array.isArray(order.items) ? order.items : []).map((item, i) => (
              <div key={i} className="order-item-row">
                {item.image && (
                  <img src={item.image} alt={item.title} className="order-item-image" />
                )}
                <div style={{ flex: 1 }}>
                  <p className="body-lg" style={{ fontWeight: 500 }}>{item.title}</p>
                  {item.material && <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>{item.material}</p>}
                  <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginTop: 4 }}>Qty: {item.qty}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className="body-lg">₹{(item.price * item.qty).toLocaleString()}</p>
                  {item.originalPrice > item.price && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', textDecoration: 'line-through' }}>
                      ₹{(item.originalPrice * item.qty).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
            <div className="order-total-row">
              <p className="body-lg">Total: <strong>₹{order.total.toLocaleString()}</strong></p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Profile Tab ───────────────────────────────────────────────────────────────
const ProfileTab = () => {
  const { customer, refreshProfile } = useCustomer();
  const [form,     setForm]    = useState({ name: customer?.name || '', phone: customer?.phone || '' });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [msg,    setMsg]    = useState('');
  const [error,  setError]  = useState('');
  const [saving, setSaving] = useState(false);

  const set     = (f, v) => setForm(prev => ({ ...prev, [f]: v }));
  const setPass = (f, v) => setPassForm(prev => ({ ...prev, [f]: v }));

  const handleProfile = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg(''); setError('');
    try {
      await updateMyProfile({ name: form.name, phone: form.phone });
      await refreshProfile();
      setMsg('Profile updated successfully');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirm) { setError('Passwords do not match'); return; }
    setSaving(true); setMsg(''); setError('');
    try {
      await changePassword({ currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      setPassForm({ currentPassword: '', newPassword: '', confirm: '' });
      setMsg('Password changed successfully');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <h2 className="headline-md account-section-title">My Profile</h2>
      {msg   && <div style={{ background: 'rgba(115,92,0,0.08)', border: '1px solid var(--primary)', color: 'var(--primary)', padding: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)', fontSize: '0.875rem' }}>{msg}</div>}
      {error && <div className="auth-error" style={{ marginBottom: 'var(--spacing-6)' }}>{error}</div>}

      <form className="profile-form" onSubmit={handleProfile}>
        <div className="auth-field">
          <label>Full Name</label>
          <input type="text" value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div className="auth-field">
          <label>Email</label>
          <input type="email" value={customer?.email} disabled style={{ opacity: 0.5 }} />
        </div>
        <div className="auth-field">
          <label>Phone</label>
          <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf: 'flex-start', padding: 'var(--spacing-3) var(--spacing-8)' }}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>

      <h3 className="headline-md" style={{ marginTop: 'var(--spacing-12)', marginBottom: 'var(--spacing-6)', paddingBottom: 'var(--spacing-4)', borderBottom: '1px solid var(--outline-variant)' }}>
        Change Password
      </h3>

      <form className="profile-form" onSubmit={handlePassword}>
        <div className="auth-field">
          <label>Current Password</label>
          <input type="password" value={passForm.currentPassword}
            onChange={e => setPass('currentPassword', e.target.value)} />
        </div>
        <div className="auth-field">
          <label>New Password</label>
          <input type="password" placeholder="Min. 8 characters" value={passForm.newPassword}
            onChange={e => setPass('newPassword', e.target.value)} />
        </div>
        <div className="auth-field">
          <label>Confirm New Password</label>
          <input type="password" value={passForm.confirm}
            onChange={e => setPass('confirm', e.target.value)} />
        </div>
        <button type="submit" className="btn btn-secondary" disabled={saving} style={{ alignSelf: 'flex-start', padding: 'var(--spacing-3) var(--spacing-8)' }}>
          {saving ? 'Updating…' : 'Update Password'}
        </button>
      </form>
    </div>
  );
};

// ── Addresses Tab ─────────────────────────────────────────────────────────────
const AddressesTab = () => {
  const { customer, refreshProfile } = useCustomer();
  const [form,  setForm]  = useState({ label: 'Home', line1: '', line2: '', city: '', state: '', pincode: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await addAddress(form);
      await refreshProfile();
      setForm({ label: 'Home', line1: '', line2: '', city: '', state: '', pincode: '' });
      setShowForm(false);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await apiDeleteAddress(id);
      await refreshProfile();
    } catch (err) { setError(err.message); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--spacing-6)', paddingBottom: 'var(--spacing-4)', borderBottom: '1px solid var(--outline-variant)' }}>
        <h2 className="headline-md">Saved Addresses</h2>
        <button className="btn btn-secondary" onClick={() => setShowForm(!showForm)}
          style={{ padding: 'var(--spacing-2) var(--spacing-6)', fontSize: '0.8rem' }}>
          {showForm ? 'Cancel' : '+ Add Address'}
        </button>
      </div>

      {error && <div className="auth-error" style={{ marginBottom: 'var(--spacing-6)' }}>{error}</div>}

      {/* Existing addresses */}
      <div className="address-cards">
        {(Array.isArray(customer?.savedAddresses) ? customer.savedAddresses : []).map(addr => (
          <div key={addr._id} className="address-card">
            <p className="address-label">{addr.label}</p>
            <p className="body-lg">{addr.line1}</p>
            {addr.line2 && <p className="body-lg">{addr.line2}</p>}
            <p className="body-lg">{addr.city}, {addr.state} — {addr.pincode}</p>
            <button className="address-delete" onClick={() => handleDelete(addr._id)}>✕</button>
          </div>
        ))}
        {(!customer?.savedAddresses || customer.savedAddresses.length === 0) && !showForm && (
          <p className="body-lg" style={{ color: 'var(--on-surface-variant)' }}>No saved addresses yet.</p>
        )}
      </div>

      {/* Add address form */}
      {showForm && (
        <form className="profile-form" onSubmit={handleAdd}
          style={{ borderTop: '1px solid var(--outline-variant)', paddingTop: 'var(--spacing-8)', marginTop: 'var(--spacing-6)' }}>
          <h3 className="label-md" style={{ color: 'var(--on-surface-variant)' }}>New Address</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-6)' }}>
            <div className="auth-field" style={{ gridColumn: '1 / -1' }}>
              <label>Label</label>
              <select value={form.label} onChange={e => set('label', e.target.value)}
                style={{ padding: 'var(--spacing-4) 0', border: 'none', borderBottom: '1px solid var(--outline-variant)', background: 'transparent', fontFamily: 'var(--font-sans)', fontSize: '1rem', cursor: 'pointer' }}>
                <option>Home</option>
                <option>Office</option>
                <option>Other</option>
              </select>
            </div>
            <div className="auth-field" style={{ gridColumn: '1 / -1' }}>
              <label>Address Line 1</label>
              <input type="text" placeholder="House / Flat / Street"
                value={form.line1} onChange={e => set('line1', e.target.value)} required />
            </div>
            <div className="auth-field" style={{ gridColumn: '1 / -1' }}>
              <label>Address Line 2 (optional)</label>
              <input type="text" placeholder="Area / Landmark"
                value={form.line2} onChange={e => set('line2', e.target.value)} />
            </div>
            <div className="auth-field">
              <label>City</label>
              <input type="text" value={form.city} onChange={e => set('city', e.target.value)} required />
            </div>
            <div className="auth-field">
              <label>State</label>
              <input type="text" value={form.state} onChange={e => set('state', e.target.value)} required />
            </div>
            <div className="auth-field">
              <label>Pincode</label>
              <input type="text" maxLength={6} value={form.pincode} onChange={e => set('pincode', e.target.value)} required />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}
            style={{ alignSelf: 'flex-start', padding: 'var(--spacing-3) var(--spacing-8)' }}>
            {saving ? 'Saving…' : 'Save Address'}
          </button>
        </form>
      )}
    </div>
  );
};

// ── Main CustomerAccount ──────────────────────────────────────────────────────
const CustomerAccount = ({ tab: initialTab }) => {
  const { isLoggedIn, loading, logout } = useCustomer();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab || 'orders');

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isLoggedIn) navigate('/login');
  }, [loading, isLoggedIn, navigate]);

  if (loading) return null;
  if (!isLoggedIn) return null;

  const tabs = [
    { key: 'orders',    label: 'My Orders' },
    { key: 'profile',   label: 'Profile' },
    { key: 'addresses', label: 'Addresses' },
  ];

  return (
    <div className="account-page">
      <h1 className="display-lg">My Account</h1>

      <div className="account-layout">
        <aside className="account-sidebar">
          {tabs.map(t => (
            <button
              key={t.key}
              className={`account-nav-item ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
          <button
            className="account-nav-item"
            onClick={() => { logout(); navigate('/'); }}
            style={{ color: 'var(--on-error)', marginTop: 'auto' }}
          >
            Logout
          </button>
        </aside>

        <div className="account-content">
          {activeTab === 'orders'    && <OrderHistory />}
          {activeTab === 'profile'   && <ProfileTab />}
          {activeTab === 'addresses' && <AddressesTab />}
        </div>
      </div>
    </div>
  );
};

export default CustomerAccount;