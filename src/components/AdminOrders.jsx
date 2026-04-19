import React, { useState, useEffect } from 'react';
import { fetchOrders, fetchOrderById, updateOrderStatus } from '../api/client';

const STATUS_OPTIONS = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const statusColor = (s) => {
  if (s === 'delivered') return 'status-delivered';
  if (s === 'shipped')   return 'status-shipped';
  if (s === 'confirmed') return 'status-shipped';
  if (s === 'cancelled') return 'status-pending';
  return 'status-pending';
};

const paymentColor = (s) => {
  if (s === 'paid')     return 'status-delivered';
  if (s === 'failed')   return 'status-pending';
  if (s === 'refunded') return 'status-shipped';
  return 'status-pending';
};

// ── Order Detail Modal ─────────────────────────────────────────────────────────
const OrderDetailModal = ({ orderId, onClose, onStatusUpdate }) => {
  const [order,   setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    fetchOrderById(orderId)
      .then(res => {
        setOrder(res.data.data);
        setNewStatus(res.data.data.status);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleStatusUpdate = async () => {
    if (newStatus === order.status) return;
    setUpdating(true);
    try {
      await updateOrderStatus(order._id, { status: newStatus });
      setOrder(prev => ({ ...prev, status: newStatus }));
      onStatusUpdate();
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(26,28,28,0.6)', backdropFilter: 'blur(4px)',
        zIndex: 9999, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', width: '100%', maxWidth: 720,
          maxHeight: '90vh', overflow: 'hidden', display: 'flex',
          flexDirection: 'column', border: '1px solid var(--outline-variant)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '1.5rem 2rem', borderBottom: '1px solid var(--outline-variant)',
          flexShrink: 0,
        }}>
          <div>
            <h2 className="headline-md">Order Details</h2>
            {order && (
              <p style={{ fontSize: '0.78rem', color: 'var(--primary)', fontFamily: 'monospace', marginTop: 4 }}>
                #{order._id.slice(-8).toUpperCase()}
              </p>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--on-surface-variant)', padding: '4px 8px' }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '2rem', flex: 1 }}>
          {loading && <p className="body-lg" style={{ color: 'var(--on-surface-variant)' }}>Loading order…</p>}
          {error   && <p style={{ color: 'var(--on-error)' }}>{error}</p>}

          {order && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

              {/* Status row */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span className={`status-badge ${statusColor(order.status)}`}>
                  {order.status.toUpperCase()}
                </span>
                <span className={`status-badge ${paymentColor(order.paymentStatus)}`}>
                  {order.paymentStatus.toUpperCase()}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>
                  {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Update status */}
              <div style={{
                background: 'var(--surface-container-low)',
                border: '1px solid var(--outline-variant)',
                padding: '1rem 1.25rem',
                display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
              }}>
                <span className="label-md">Update Status</span>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  style={{
                    padding: '0.5rem 2rem 0.5rem 0.75rem',
                    border: '1px solid var(--outline-variant)',
                    background: '#fff', fontFamily: 'var(--font-sans)',
                    fontSize: '0.85rem', cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%237f7663' fill='none' stroke-width='1.5'/%3E%3C/svg%3E\")",
                    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
                  }}
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
                <button
                  className="btn btn-primary"
                  onClick={handleStatusUpdate}
                  disabled={updating || newStatus === order.status}
                  style={{ padding: '0.5rem 1.25rem', opacity: newStatus === order.status ? 0.5 : 1 }}
                >
                  {updating ? 'Updating…' : 'Update'}
                </button>
              </div>

              {/* Two column layout */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

                {/* Customer info */}
                <div>
                  <h3 className="label-md" style={{ marginBottom: '0.75rem', color: 'var(--on-surface-variant)', borderBottom: '1px solid var(--outline-variant)', paddingBottom: '0.5rem' }}>
                    Customer
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p className="body-lg" style={{ fontWeight: 500 }}>{order.customer.name}</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>{order.customer.email}</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>{order.customer.phone}</p>
                  </div>
                </div>

                {/* Shipping address */}
                <div>
                  <h3 className="label-md" style={{ marginBottom: '0.75rem', color: 'var(--on-surface-variant)', borderBottom: '1px solid var(--outline-variant)', paddingBottom: '0.5rem' }}>
                    Shipping Address
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--on-surface)', lineHeight: 1.7 }}>
                    <p>{order.customer.address.line1}</p>
                    {order.customer.address.line2 && <p>{order.customer.address.line2}</p>}
                    <p>{order.customer.address.city}, {order.customer.address.state}</p>
                    <p>Pincode: {order.customer.address.pincode}</p>
                  </div>
                </div>

              </div>

              {/* Payment info */}
              {order.cashfreeOrderId && (
                <div>
                  <h3 className="label-md" style={{ marginBottom: '0.75rem', color: 'var(--on-surface-variant)', borderBottom: '1px solid var(--outline-variant)', paddingBottom: '0.5rem' }}>
                    Payment
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {order.cashfreeOrderId    && <p>Cashfree Order ID: <code style={{ color: 'var(--primary)' }}>{order.cashfreeOrderId}</code></p>}
                    {order.cashfreePaymentId  && <p>Payment ID: <code style={{ color: 'var(--primary)' }}>{order.cashfreePaymentId}</code></p>}
                  </div>
                </div>
              )}

              {/* Order items */}
              <div>
                <h3 className="label-md" style={{ marginBottom: '0.75rem', color: 'var(--on-surface-variant)', borderBottom: '1px solid var(--outline-variant)', paddingBottom: '0.5rem' }}>
                  Items Ordered
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {order.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--surface-container-highest)' }}>
                      {item.image && (
                        <img src={item.image} alt={item.title} style={{ width: 56, height: 56, objectFit: 'cover', border: '1px solid var(--outline-variant)', flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="body-lg" style={{ fontWeight: 500 }}>{item.title}</p>
                        {item.material && <p style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.material}</p>}
                        <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginTop: 4 }}>Qty: {item.qty}</p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p className="body-lg" style={{ fontWeight: 500 }}>₹{(item.price * item.qty).toLocaleString('en-IN')}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>₹{item.price.toLocaleString('en-IN')} each</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', marginTop: '0.5rem', borderTop: '2px solid var(--outline-variant)' }}>
                  <span className="label-md">Order Total</span>
                  <span className="headline-md" style={{ fontSize: '1.3rem', color: 'var(--primary)' }}>
                    ₹{order.total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main AdminOrders ───────────────────────────────────────────────────────────
const AdminOrders = () => {
  const [orders,       setOrders]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [viewingId,    setViewingId]    = useState(null);

  const loadOrders = () => {
    setLoading(true);
    fetchOrders(filterStatus ? { status: filterStatus } : {})
      .then(res => setOrders(res.data.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadOrders(); }, [filterStatus]);

  const exportCSV = () => {
    const headers = ['Order ID', 'Customer', 'Email', 'Phone', 'City', 'State', 'Pincode', 'Status', 'Payment', 'Total', 'Date'];
    const rows = orders.map(o => [
      o._id,
      o.customer.name,
      o.customer.email,
      o.customer.phone,
      o.customer.address.city,
      o.customer.address.state,
      o.customer.address.pincode,
      o.status,
      o.paymentStatus,
      o.total,
      new Date(o.createdAt).toLocaleDateString('en-IN'),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `orders_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-content">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 className="headline-md">All Orders</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{
              padding: '0.5rem 2rem 0.5rem 0.75rem',
              border: '1px solid var(--outline-variant)',
              background: '#fff', fontFamily: 'var(--font-sans)',
              fontSize: '0.85rem', cursor: 'pointer', appearance: 'none',
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%237f7663' fill='none' stroke-width='1.5'/%3E%3C/svg%3E\")",
              backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
            }}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <button className="btn btn-secondary" onClick={exportCSV}
            style={{ padding: 'var(--spacing-3) var(--spacing-6)' }}>
            Export CSV
          </button>
        </div>
      </div>

      {error   && <p style={{ color: 'var(--on-error)', marginBottom: '1rem' }}>{error}</p>}
      {loading && <p className="body-lg" style={{ color: 'var(--on-surface-variant)' }}>Loading orders…</p>}

      {!loading && (
        <div className="recent-activity">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="label-md">Order ID</th>
                <th className="label-md">Customer</th>
                <th className="label-md">Date</th>
                <th className="label-md">Status</th>
                <th className="label-md">Payment</th>
                <th className="label-md">Total</th>
                <th className="label-md">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--spacing-12)', color: 'var(--on-surface-variant)' }}>
                    No orders found
                  </td>
                </tr>
              )}
              {orders.map(o => (
                <tr key={o._id}>
                  <td>
                    <code style={{ fontSize: '0.8rem', color: 'var(--primary)', fontFamily: 'monospace' }}>
                      #{o._id.slice(-8).toUpperCase()}
                    </code>
                  </td>
                  <td>
                    <div className="body-lg" style={{ fontWeight: 500 }}>{o.customer.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{o.customer.email}</div>
                  </td>
                  <td className="body-lg">
                    {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td><span className={`status-badge ${statusColor(o.status)}`}>{o.status}</span></td>
                  <td><span className={`status-badge ${paymentColor(o.paymentStatus)}`}>{o.paymentStatus}</span></td>
                  <td className="body-lg">₹{o.total.toLocaleString('en-IN')}</td>
                  <td>
                    <button className="btn btn-tertiary" onClick={() => setViewingId(o._id)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewingId && (
        <OrderDetailModal
          orderId={viewingId}
          onClose={() => setViewingId(null)}
          onStatusUpdate={loadOrders}
        />
      )}
    </div>
  );
};

export default AdminOrders;