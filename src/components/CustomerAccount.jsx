import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate }    from 'react-router-dom';
import { useCustomer }    from '../context/CustomerContext';
import { getMyOrders, addAddress, deleteAddress } from '../api/client';

const CustomerAccount = ({ tab: initialTab = 'orders' }) => {
  const navigate             = useNavigate();
  const { customer, logout } = useCustomer();
  const [activeTab, setActiveTab] = useState(initialTab);

  const [orders,       setOrders]       = useState([]);
  const [ordersLoading,setOrdersLoading]= useState(false);
  const [ordersError,  setOrdersError]  = useState('');

  // ── Address Management ──────────────────────────────────────────────────
  const [addresses,       setAddresses]       = useState([]);
  const [addressesLoading,setAddressesLoading]= useState(false);
  const [addressesError,  setAddressesError]  = useState('');
  const [deletingId,      setDeletingId]      = useState(null);
  const [showAddForm,     setShowAddForm]     = useState(false);
  
  const [formData, setFormData] = useState({
    label:    '',
    line1:    '',
    line2:    '',
    city:     '',
    state:    '',
    pincode:  '',
    country:  'India',
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // ── Redirect if not logged in ────────────────────────────────────────────
  useEffect(() => {
    if (!customer) navigate('/login');
  }, [customer, navigate]);

  // ── Load addresses ──────────────────────────────────────────────────────
  const loadAddresses = useCallback(async () => {
    setAddressesLoading(true);
    setAddressesError('');
    try {
      // Addresses are fetched as part of customer profile
      // They're stored in customer.savedAddresses
      setAddresses(customer?.savedAddresses || []);
    } catch (err) {
      setAddressesError('Failed to load addresses. Please try again.');
    } finally {
      setAddressesLoading(false);
    }
  }, [customer?.savedAddresses]);

  useEffect(() => {
    if (activeTab === 'addresses') {
      loadAddresses();
    }
  }, [activeTab, loadAddresses]);

  // ── Fetch orders ─────────────────────────────────────────────────────────
  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError('');
    try {
      const res  = await getMyOrders();
      const data = res.data?.data || res.data?.orders || res.data || [];
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrdersError('Failed to load orders. Please try again.');
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'orders') loadOrders();
  }, [activeTab, loadOrders]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // ── Address form handlers ───────────────────────────────────────────────
  const handleAddressInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError('');
  };

  const validateAddressForm = () => {
    if (!formData.label?.trim()) return 'Please select a label (Home/Office/Other)';
    if (!formData.line1?.trim()) return 'Address line 1 is required';
    if (!formData.city?.trim()) return 'City is required';
    if (!formData.state?.trim()) return 'State is required';
    if (!formData.pincode?.trim()) return 'Pincode is required';
    return '';
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    const error = validateAddressForm();
    if (error) {
      setFormError(error);
      return;
    }

    setFormLoading(true);
    setFormError('');
    try {
      await addAddress({
        label: formData.label,
        addressLine1: formData.line1,
        addressLine2: formData.line2,
        city: formData.city,
        state: formData.state,
        postalCode: formData.pincode,
        country: formData.country,
      });

      // Reset form and reload addresses
      setFormData({
        label: '',
        line1: '',
        line2: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
      });
      setShowAddForm(false);
      await loadAddresses();
    } catch (err) {
      setFormError(err.message || 'Failed to add address. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;

    setDeletingId(addressId);
    try {
      await deleteAddress(addressId);
      await loadAddresses();
    } catch (err) {
      setAddressesError(err.message || 'Failed to delete address. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  const statusColor = (s) => ({
    pending:   { bg:'#fef9c3', color:'#92400e' },
    confirmed: { bg:'#dbeafe', color:'#1e40af' },
    shipped:   { bg:'#fef9c3', color:'#92400e' },
    delivered: { bg:'#dcfce7', color:'#166534' },
    cancelled: { bg:'#fee2e2', color:'#991b1b' },
  }[s] || { bg:'#f3f4f6', color:'#374151' });

  if (!customer) return null;

  return (
    <div style={{ paddingTop:80, minHeight:'100vh', background:'var(--surface-container-lowest, #fdfaf6)' }}>
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'2rem 1rem', display:'flex', gap:'2rem', alignItems:'flex-start' }}>

        {/* ── Sidebar ───────────────────────────────────────────────────────── */}
        <aside style={{ width:240, flexShrink:0, background:'#fff', borderRadius:8, border:'1px solid #e8e0d5', overflow:'hidden' }}>
          <div style={{ padding:'1.5rem', borderBottom:'1px solid #f0ebe3' }}>
            <div style={{ width:48, height:48, borderRadius:'50%', background:'#735c00', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'1.2rem', marginBottom:'0.75rem' }}>
              {customer.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div style={{ fontWeight:600, fontSize:'0.95rem' }}>{customer.name}</div>
            <div style={{ fontSize:'0.8rem', color:'#888', marginTop:2 }}>{customer.email}</div>
          </div>

          {[
            { key:'orders',    label:'My Orders'  },
            { key:'profile',   label:'Profile'    },
            { key:'addresses', label:'Addresses'  },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              width:'100%', textAlign:'left', padding:'0.85rem 1.5rem',
              background: activeTab === tab.key ? '#faf7f2' : 'transparent',
              border:'none', borderLeft: activeTab === tab.key ? '3px solid #735c00' : '3px solid transparent',
              cursor:'pointer', fontFamily:'inherit', fontSize:'0.9rem',
              fontWeight: activeTab === tab.key ? 600 : 400,
              color: activeTab === tab.key ? '#735c00' : '#333',
            }}>
              {tab.label}
            </button>
          ))}

          <button onClick={handleLogout} style={{
            width:'100%', textAlign:'left', padding:'0.85rem 1.5rem',
            background:'transparent', border:'none', borderLeft:'3px solid transparent',
            cursor:'pointer', fontFamily:'inherit', fontSize:'0.9rem',
            color:'#c0392b', fontWeight:500,
          }}>
            Logout
          </button>
        </aside>

        {/* ── Main content ──────────────────────────────────────────────────── */}
        <div style={{ flex:1, minWidth:0 }}>

          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div>
              <h1 style={{ fontSize:'2rem', fontWeight:700, marginBottom:'1.5rem' }}>My Orders</h1>
              <hr style={{ border:'none', borderTop:'1px solid #e8e0d5', marginBottom:'1.5rem' }} />

              {ordersLoading && (
                <p style={{ color:'#888' }}>Loading your orders…</p>
              )}
              {ordersError && (
                <p style={{ color:'#c0392b' }}>{ordersError}</p>
              )}
              {!ordersLoading && !ordersError && orders.length === 0 && (
                <p style={{ color:'#888' }}>You haven't placed any orders yet.</p>
              )}

              {orders.map(order => {
                const sc = statusColor(order.status);
                return (
                  <div key={order._id} style={{ background:'#fff', border:'1px solid #e8e0d5', borderRadius:8, marginBottom:'1.5rem', overflow:'hidden' }}>

                    {/* Order header */}
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'1rem', justifyContent:'space-between', alignItems:'center', padding:'1rem 1.25rem', background:'#faf7f2', borderBottom:'1px solid #e8e0d5' }}>
                      <div>
                        <div style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:'#888', marginBottom:2 }}>Order ID</div>
                        <div style={{ fontFamily:'monospace', fontSize:'0.85rem', fontWeight:600 }}>
                          #{order.orderNumber || order._id}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:'#888', marginBottom:2 }}>Date</div>
                        <div style={{ fontSize:'0.88rem' }}>{formatDate(order.createdAt)}</div>
                      </div>
                      <span style={{ background:sc.bg, color:sc.color, padding:'0.3rem 0.9rem', borderRadius:20, fontSize:'0.78rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em' }}>
                        {order.status || 'Pending'}
                      </span>
                      <div>
                        <div style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:'#888', marginBottom:2 }}>Payment</div>
                        <span style={{
                          background: order.paymentStatus === 'paid' ? '#dcfce7' : '#fee2e2',
                          color:      order.paymentStatus === 'paid' ? '#166534' : '#991b1b',
                          padding:'0.25rem 0.75rem', borderRadius:20, fontSize:'0.78rem', fontWeight:700, textTransform:'uppercase',
                        }}>
                          {order.paymentStatus || 'Unpaid'}
                        </span>
                      </div>
                    </div>

                    {/* Order items */}
                    <div style={{ padding:'1rem 1.25rem' }}>
                      {(order.items || []).map((item, i) => {
                        // ✅ Handle both field names: quantity (new model) and qty (old model)
                        const qty   = item.quantity ?? item.qty ?? 1;
                        const price = item.price    ?? 0;
                        const image = item.image?.url || item.image || item.product?.image?.url || '';
                        const title = item.title    || item.product?.title || 'Product';

                        return (
                          <div key={i} style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'0.85rem 0', borderBottom: i < order.items.length - 1 ? '1px solid #f0ebe3' : 'none' }}>
                            {image ? (
                              <img src={image} alt={title} style={{ width:56, height:56, objectFit:'cover', borderRadius:6, border:'1px solid #eee', flexShrink:0 }} />
                            ) : (
                              <div style={{ width:56, height:56, background:'#f0ebe3', borderRadius:6, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', color:'#ccc' }}>🖼</div>
                            )}
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontWeight:500, fontSize:'0.9rem', marginBottom:2 }}>{title}</div>
                              {item.material && (
                                <div style={{ fontSize:'0.78rem', color:'#888', textTransform:'uppercase', letterSpacing:'0.05em' }}>{item.material}</div>
                              )}
                              {/* ✅ qty uses correct field */}
                              <div style={{ fontSize:'0.82rem', color:'#888', marginTop:2 }}>
                                Qty: {qty}
                              </div>
                            </div>
                            {/* ✅ price × qty — both fields correct */}
                            <div style={{ fontWeight:600, fontSize:'0.9rem', flexShrink:0 }}>
                              ₹{(price * qty).toLocaleString('en-IN')}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Order total */}
                    <div style={{ display:'flex', justifyContent:'flex-end', padding:'0.85rem 1.25rem', borderTop:'1px solid #f0ebe3', background:'#fdfaf6' }}>
                      <span style={{ fontWeight:700, fontSize:'1rem' }}>
                        Total: ₹{(order.total || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div>
              <h1 style={{ fontSize:'2rem', fontWeight:700, marginBottom:'1.5rem' }}>Profile</h1>
              <hr style={{ border:'none', borderTop:'1px solid #e8e0d5', marginBottom:'1.5rem' }} />
              <div style={{ background:'#fff', border:'1px solid #e8e0d5', borderRadius:8, padding:'1.5rem', maxWidth:480 }}>
                {[
                  { label:'Full Name', value: customer.name  },
                  { label:'Email',     value: customer.email },
                  { label:'Phone',     value: customer.phone || '—' },
                ].map(row => (
                  <div key={row.label} style={{ marginBottom:'1.25rem' }}>
                    <div style={{ fontSize:'0.75rem', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:'#888', marginBottom:4 }}>
                      {row.label}
                    </div>
                    <div style={{ fontSize:'0.95rem', color:'#333' }}>{row.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ADDRESSES TAB */}
          {activeTab === 'addresses' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Addresses</h1>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  style={{
                    padding: '0.65rem 1.25rem',
                    background: showAddForm ? '#e8e0d5' : '#735c00',
                    color: showAddForm ? '#333' : '#fff',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {showAddForm ? 'Cancel' : '+ Add Address'}
                </button>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid #e8e0d5', marginBottom: '1.5rem' }} />

              {/* Add Address Form */}
              {showAddForm && (
                <div style={{ background: '#fff', border: '1px solid #e8e0d5', borderRadius: 8, padding: '1.5rem', marginBottom: '2rem', maxWidth: 500 }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Add New Address</h2>
                  
                  {formError && (
                    <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: 6, marginBottom: '1rem', fontSize: '0.9rem' }}>
                      {formError}
                    </div>
                  )}

                  <form onSubmit={handleAddAddress}>
                    {/* Label Picker */}
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#888', marginBottom: 6 }}>
                        Label *
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {['Home', 'Office', 'Other'].map(lbl => (
                          <button
                            key={lbl}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, label: lbl }))}
                            style={{
                              flex: 1,
                              padding: '0.6rem',
                              background: formData.label === lbl ? '#735c00' : '#f5f1eb',
                              color: formData.label === lbl ? '#fff' : '#333',
                              border: '1px solid ' + (formData.label === lbl ? '#735c00' : '#e8e0d5'),
                              borderRadius: 6,
                              fontSize: '0.85rem',
                              fontWeight: 500,
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                            }}
                          >
                            {lbl}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Address Line 1 */}
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#888', marginBottom: 6 }}>
                        Address Line 1 *
                      </label>
                      <input
                        type="text"
                        name="line1"
                        value={formData.line1}
                        onChange={handleAddressInputChange}
                        placeholder="e.g., 123 Main Street"
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.9rem',
                          border: '1px solid #e8e0d5',
                          borderRadius: 6,
                          fontSize: '0.9rem',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    {/* Address Line 2 */}
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#888', marginBottom: 6 }}>
                        Address Line 2 (Optional)
                      </label>
                      <input
                        type="text"
                        name="line2"
                        value={formData.line2}
                        onChange={handleAddressInputChange}
                        placeholder="e.g., Apartment 4B"
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.9rem',
                          border: '1px solid #e8e0d5',
                          borderRadius: 6,
                          fontSize: '0.9rem',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    {/* City & State */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#888', marginBottom: 6 }}>
                          City *
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleAddressInputChange}
                          placeholder="e.g., Mumbai"
                          style={{
                            width: '100%',
                            padding: '0.65rem 0.9rem',
                            border: '1px solid #e8e0d5',
                            borderRadius: 6,
                            fontSize: '0.9rem',
                            fontFamily: 'inherit',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#888', marginBottom: 6 }}>
                          State *
                        </label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleAddressInputChange}
                          placeholder="e.g., Maharashtra"
                          style={{
                            width: '100%',
                            padding: '0.65rem 0.9rem',
                            border: '1px solid #e8e0d5',
                            borderRadius: 6,
                            fontSize: '0.9rem',
                            fontFamily: 'inherit',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    </div>

                    {/* Pincode & Country */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#888', marginBottom: 6 }}>
                          Pincode *
                        </label>
                        <input
                          type="text"
                          name="pincode"
                          value={formData.pincode}
                          onChange={handleAddressInputChange}
                          placeholder="e.g., 400001"
                          style={{
                            width: '100%',
                            padding: '0.65rem 0.9rem',
                            border: '1px solid #e8e0d5',
                            borderRadius: 6,
                            fontSize: '0.9rem',
                            fontFamily: 'inherit',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#888', marginBottom: 6 }}>
                          Country
                        </label>
                        <input
                          type="text"
                          name="country"
                          value={formData.country}
                          onChange={handleAddressInputChange}
                          style={{
                            width: '100%',
                            padding: '0.65rem 0.9rem',
                            border: '1px solid #e8e0d5',
                            borderRadius: 6,
                            fontSize: '0.9rem',
                            fontFamily: 'inherit',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={formLoading}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: formLoading ? '#ddd' : '#735c00',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        cursor: formLoading ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      {formLoading ? 'Adding...' : 'Add Address'}
                    </button>
                  </form>
                </div>
              )}

              {/* Addresses List */}
              {addressesLoading && (
                <p style={{ color: '#888' }}>Loading addresses…</p>
              )}
              {addressesError && (
                <p style={{ color: '#c0392b' }}>{addressesError}</p>
              )}
              {!addressesLoading && !addressesError && addresses.length === 0 && (
                <p style={{ color: '#888' }}>No saved addresses yet. Add one to get started!</p>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {addresses.map((addr) => (
                  <div key={addr._id} style={{ background: '#fff', border: '1px solid #e8e0d5', borderRadius: 8, padding: '1.25rem', position: 'relative' }}>
                    {/* Label badge */}
                    {addr.label && (
                      <span style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: '#735c00', color: '#fff', padding: '0.25rem 0.65rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                        {addr.label}
                      </span>
                    )}

                    {/* Address content */}
                    <div style={{ fontSize: '0.9rem', lineHeight: 1.7, color: '#333', paddingRight: '60px' }}>
                      {addr.addressLine1 || addr.line1}<br />
                      {(addr.addressLine2 || addr.line2) && <>{addr.addressLine2 || addr.line2}<br /></>}
                      {addr.city}{addr.state ? `, ${addr.state}` : ''} — {addr.postalCode || addr.pincode}<br />
                      {addr.country || 'India'}
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteAddress(addr._id)}
                      disabled={deletingId === addr._id}
                      style={{
                        marginTop: '1rem',
                        padding: '0.5rem 1rem',
                        background: deletingId === addr._id ? '#ddd' : '#fee2e2',
                        color: deletingId === addr._id ? '#999' : '#c0392b',
                        border: '1px solid ' + (deletingId === addr._id ? '#ddd' : '#f5b3b3'),
                        borderRadius: 6,
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        cursor: deletingId === addr._id ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      {deletingId === addr._id ? 'Deleting...' : 'Remove'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CustomerAccount;