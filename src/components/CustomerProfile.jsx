import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { getCustomerMe, updateCustomerMe, changeCustomerPassword, fetchMyCustomerOrders } from '../api/client';
import './CustomerProfile.css';

const STATUS_LABEL = {
  pending:    'Pending',
  confirmed:  'Confirmed',
  shipped:    'Shipped',
  delivered:  'Delivered',
  cancelled:  'Cancelled',
};

const CustomerProfile = () => {
  const navigate = useNavigate();
  const { customer, loginCustomer, logoutCustomer } = useStore();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit states
  const [editSection, setEditSection] = useState(null); // 'info' | 'address' | 'password'

  const [info, setInfo] = useState({ name: '', email: '', phone: '', username: '' });
  const [address, setAddress] = useState({ line1: '', line2: '', city: '', state: '', pincode: '', country: 'India' });
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const [success, setSuccess] = useState('');

  // ── Orders ──────────────────────────────────────────────────────────────────
  const [orders,        setOrders]        = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError,   setOrdersError]   = useState('');

  // Redirect if not logged in
  useEffect(() => {
    if (!customer) navigate('/login', { replace: true });
  }, [customer, navigate]);

  // Fetch full profile
  useEffect(() => {
    if (!customer) return;
    getCustomerMe()
      .then(res => {
        const c = res.data.customer;
        setProfile(c);
        setInfo({ name: c.name || '', email: c.email || '', phone: c.phone || '', username: c.username || '' });
        setAddress({
          line1:   c.address?.line1   || '',
          line2:   c.address?.line2   || '',
          city:    c.address?.city    || '',
          state:   c.address?.state   || '',
          pincode: c.address?.pincode || '',
          country: c.address?.country || 'India',
        });
      })
      .catch(() => logoutCustomer())
      .finally(() => setLoading(false));
  }, []);

  // Fetch order history
  useEffect(() => {
    if (!customer) return;
    fetchMyCustomerOrders({ limit: 50 })
      .then(res => {
        const data = res.data?.orders || res.data?.data || [];
        setOrders(Array.isArray(data) ? data : []);
      })
      .catch(() => setOrdersError('Failed to load your orders.'))
      .finally(() => setLoadingOrders(false));
  }, []);

  const run = async (fn) => {
    setError(''); setSuccess(''); setSaving(true);
    try { await fn(); }
    catch (err) { setError(err.response?.data?.message || err.message || 'Something went wrong'); }
    finally { setSaving(false); }
  };

  const handleInfoSave = (e) => {
    e.preventDefault();
    run(async () => {
      const res = await updateCustomerMe({
        name:     info.name     || undefined,
        email:    info.email    || undefined,
        phone:    info.phone    || undefined,
        username: info.username || undefined,
      });
      const updated = res.data.customer;
      setProfile(updated);
      loginCustomer(localStorage.getItem('shree_customer_token'), updated);
      setSuccess('Profile updated.');
      setEditSection(null);
    });
  };

  const handleAddressSave = (e) => {
    e.preventDefault();
    run(async () => {
      const res = await updateCustomerMe({ address });
      setProfile(res.data.customer);
      setSuccess('Address saved.');
      setEditSection(null);
    });
  };

  const handlePasswordSave = (e) => {
    e.preventDefault();
    if (pwd.next !== pwd.confirm) { setError('New passwords do not match.'); return; }
    if (pwd.next.length < 6)     { setError('Password must be at least 6 characters.'); return; }
    run(async () => {
      await changeCustomerPassword({ currentPassword: pwd.current, newPassword: pwd.next });
      setSuccess('Password changed.');
      setPwd({ current: '', next: '', confirm: '' });
      setEditSection(null);
    });
  };

  if (loading) return (
    <div className="profile-page">
      <div className="profile-loading">Loading your profile…</div>
    </div>
  );

  if (!profile) return null;

  const hasAddress = profile.address?.line1;

  return (
    <div className="profile-page">
      <div className="profile-container">

        <div className="profile-header">
          <div className="profile-avatar">
            {(profile.name || 'C').charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="display-sm profile-name">{profile.name}</h1>
            <p className="body-sm profile-meta">
              {[profile.email, profile.phone, profile.username && `@${profile.username}`]
                .filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>

        {success && <p className="profile-success">{success}</p>}
        {error   && <p className="profile-error">{error}</p>}

        {/* ── Personal Information ─────────────────────────────────────── */}
        <section className="profile-section">
          <div className="profile-section-header">
            <h2 className="label-lg">Personal Information</h2>
            {editSection !== 'info' && (
              <button className="profile-edit-btn" onClick={() => { setEditSection('info'); setError(''); setSuccess(''); }}>
                Edit
              </button>
            )}
          </div>

          {editSection === 'info' ? (
            <form className="profile-form" onSubmit={handleInfoSave}>
              <div className="profile-field-row">
                <label className="profile-label">Full Name</label>
                <input className="profile-input" type="text" value={info.name}
                  onChange={e => setInfo(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="profile-field-row">
                <label className="profile-label">Email</label>
                <input className="profile-input" type="email" value={info.email}
                  onChange={e => setInfo(p => ({ ...p, email: e.target.value }))}
                  placeholder="Not set" />
              </div>
              <div className="profile-field-row">
                <label className="profile-label">Phone</label>
                <input className="profile-input" type="tel" value={info.phone}
                  onChange={e => setInfo(p => ({ ...p, phone: e.target.value }))}
                  placeholder="Not set" />
              </div>
              <div className="profile-field-row">
                <label className="profile-label">Username</label>
                <input className="profile-input" type="text" value={info.username}
                  onChange={e => setInfo(p => ({ ...p, username: e.target.value }))}
                  placeholder="Not set" />
              </div>
              <div className="profile-form-actions">
                <button className="btn-primary profile-save-btn" type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                <button className="profile-cancel-btn" type="button"
                  onClick={() => setEditSection(null)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-fields">
              <ProfileField label="Full Name" value={profile.name} />
              <ProfileField label="Email"     value={profile.email}    empty="Not set" />
              <ProfileField label="Phone"     value={profile.phone}    empty="Not set" />
              <ProfileField label="Username"  value={profile.username ? `@${profile.username}` : null} empty="Not set" />
            </div>
          )}
        </section>

        {/* ── Delivery Address ─────────────────────────────────────────── */}
        <section className="profile-section">
          <div className="profile-section-header">
            <h2 className="label-lg">Delivery Address</h2>
            {editSection !== 'address' && (
              <button className="profile-edit-btn" onClick={() => { setEditSection('address'); setError(''); setSuccess(''); }}>
                {hasAddress ? 'Edit' : 'Add'}
              </button>
            )}
          </div>

          {editSection === 'address' ? (
            <form className="profile-form" onSubmit={handleAddressSave}>
              <div className="profile-field-row">
                <label className="profile-label">Line 1</label>
                <input className="profile-input" type="text" placeholder="Street address"
                  value={address.line1} onChange={e => setAddress(p => ({ ...p, line1: e.target.value }))} />
              </div>
              <div className="profile-field-row">
                <label className="profile-label">Line 2</label>
                <input className="profile-input" type="text" placeholder="Apartment, floor, etc."
                  value={address.line2} onChange={e => setAddress(p => ({ ...p, line2: e.target.value }))} />
              </div>
              <div className="profile-field-row">
                <label className="profile-label">City</label>
                <input className="profile-input" type="text"
                  value={address.city} onChange={e => setAddress(p => ({ ...p, city: e.target.value }))} />
              </div>
              <div className="profile-field-row">
                <label className="profile-label">State</label>
                <input className="profile-input" type="text"
                  value={address.state} onChange={e => setAddress(p => ({ ...p, state: e.target.value }))} />
              </div>
              <div className="profile-field-row">
                <label className="profile-label">Pincode</label>
                <input className="profile-input" type="text"
                  value={address.pincode} onChange={e => setAddress(p => ({ ...p, pincode: e.target.value }))} />
              </div>
              <div className="profile-field-row">
                <label className="profile-label">Country</label>
                <input className="profile-input" type="text"
                  value={address.country} onChange={e => setAddress(p => ({ ...p, country: e.target.value }))} />
              </div>
              <div className="profile-form-actions">
                <button className="btn-primary profile-save-btn" type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save Address'}
                </button>
                <button className="profile-cancel-btn" type="button"
                  onClick={() => setEditSection(null)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : hasAddress ? (
            <div className="profile-fields">
              <ProfileField label="Line 1"  value={profile.address.line1} />
              <ProfileField label="Line 2"  value={profile.address.line2}  empty="—" />
              <ProfileField label="City"    value={profile.address.city} />
              <ProfileField label="State"   value={profile.address.state} />
              <ProfileField label="Pincode" value={profile.address.pincode} />
              <ProfileField label="Country" value={profile.address.country} />
            </div>
          ) : (
            <p className="body-sm profile-empty">No address saved yet.</p>
          )}
        </section>

        {/* ── My Orders ─────────────────────────────────────────────────── */}
        <section className="profile-section">
          <div className="profile-section-header">
            <h2 className="label-lg">My Orders</h2>
          </div>

          {ordersError && <p className="profile-error">{ordersError}</p>}

          {loadingOrders ? (
            <p className="body-sm profile-empty">Loading your orders…</p>
          ) : orders.length === 0 ? (
            <p className="body-sm profile-empty">You haven't placed any orders yet.</p>
          ) : (
            <div className="profile-orders-list">
              {orders.map(order => (
                <div key={order.id} className="profile-order-row">
                  <div>
                    <div className="body-sm" style={{ fontWeight: 600 }}>
                      Order {order.orderNumber}
                    </div>
                    <div className="body-sm profile-meta" style={{ marginTop: 2 }}>
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : ''}
                      {' · '}
                      {Array.isArray(order.items) ? order.items.length : 0} item{Array.isArray(order.items) && order.items.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="body-sm" style={{ fontWeight: 600 }}>
                      ₹{Number(order.total || 0).toLocaleString('en-IN')}
                    </div>
                    <div className="body-sm profile-meta" style={{ marginTop: 2 }}>
                      {STATUS_LABEL[order.status] || order.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Password ─────────────────────────────────────────────────── */}
        <section className="profile-section">
          <div className="profile-section-header">
            <h2 className="label-lg">Password</h2>
            {editSection !== 'password' && (
              <button className="profile-edit-btn"
                onClick={() => { setEditSection('password'); setError(''); setSuccess(''); }}>
                Change
              </button>
            )}
          </div>

          {editSection === 'password' ? (
            <form className="profile-form" onSubmit={handlePasswordSave}>
              <div className="profile-field-row">
                <label className="profile-label">Current Password</label>
                <input className="profile-input" type="password" value={pwd.current}
                  onChange={e => setPwd(p => ({ ...p, current: e.target.value }))} required autoFocus />
              </div>
              <div className="profile-field-row">
                <label className="profile-label">New Password</label>
                <input className="profile-input" type="password" value={pwd.next}
                  onChange={e => setPwd(p => ({ ...p, next: e.target.value }))} required minLength={6} />
              </div>
              <div className="profile-field-row">
                <label className="profile-label">Confirm New Password</label>
                <input className="profile-input" type="password" value={pwd.confirm}
                  onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))} required />
              </div>
              <div className="profile-form-actions">
                <button className="btn-primary profile-save-btn" type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Change Password'}
                </button>
                <button className="profile-cancel-btn" type="button"
                  onClick={() => setEditSection(null)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <p className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>••••••••</p>
          )}
        </section>

        {/* ── Danger zone ──────────────────────────────────────────────── */}
        <section className="profile-section profile-section--danger">
          <button className="profile-logout-btn" onClick={() => { logoutCustomer(); navigate('/'); }}>
            Log Out
          </button>
        </section>

      </div>
    </div>
  );
};

const ProfileField = ({ label, value, empty = '' }) => (
  <div className="profile-field-row">
    <span className="profile-label">{label}</span>
    <span className="body-sm profile-value" style={{ color: value ? 'var(--on-surface)' : 'var(--on-surface-variant)' }}>
      {value || empty}
    </span>
  </div>
);

export default CustomerProfile;