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
              <h1 style={{ fontSize:'2rem', fontWeight:700, marginBottom:'1.5rem' }}>Addresses</h1>
              <hr style={{ border:'none', borderTop:'1px solid #e8e0d5', marginBottom:'1.5rem' }} />
              {customer.savedAddresses?.length > 0 ? (
                customer.savedAddresses.map((addr, i) => (
                  <div key={i} style={{ background:'#fff', border:'1px solid #e8e0d5', borderRadius:8, padding:'1.25rem', marginBottom:'1rem', maxWidth:480 }}>
                    <div style={{ fontSize:'0.9rem', lineHeight:1.7, color:'#333' }}>
                      {addr.line1 || addr.addressLine1}<br />
                      {(addr.line2 || addr.addressLine2) && <>{addr.line2 || addr.addressLine2}<br /></>}
                      {addr.city}{addr.state ? `, ${addr.state}` : ''} — {addr.pincode || addr.postalCode}<br />
                      {addr.country || 'India'}
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color:'#888' }}>No saved addresses yet.</p>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CustomerAccount;