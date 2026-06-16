import React, { useState, useEffect, useCallback } from 'react';
import { fetchOrders, updateOrderStatus } from '../api/client';

const STATUS_COLOURS = {
  pending:   'status-pending',
  shipped:   'status-shipped',
  delivered: 'status-delivered',
  cancelled: 'status-pending',
};

const AdminOrders = () => {
  const [orders,        setOrders]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [statusFilter,  setStatusFilter]  = useState('');
  const [page,          setPage]          = useState(1);
  const [totalPages,    setTotalPages]    = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingId,    setUpdatingId]    = useState(null);

  // ── Fetch orders ──────────────────────────────────────────────────────────
  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;

      const res  = await fetchOrders(params);
      const data = res.data;

      const list  = data?.orders || data?.data?.orders || data?.data || [];
      const total = data?.total  || list.length;

      setOrders(Array.isArray(list) ? list : []);
      setTotalPages(Math.ceil(total / 20) || 1);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load orders.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  // ── Update status ─────────────────────────────────────────────────────────
  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, { status: newStatus });
      setOrders(prev =>
        prev.map(o => (o.id || o._id) === orderId ? { ...o, status: newStatus } : o)
      );
      if ((selectedOrder?.id || selectedOrder?._id) === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Export CSV ────────────────────────────────────────────────────────────
  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem('shree_admin_token');
      const res   = await fetch(
        `${import.meta.env.VITE_API_URL}/orders/export`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `orders_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('CSV export failed.');
    }
  };

  // ── Format date ───────────────────────────────────────────────────────────
  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  // ── Helper: get order id (Postgres uuid or Mongo _id) ────────────────────
  const getId = (order) => order.id || order._id;

  return (
    <div className="admin-content">

      {/* Header */}
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
        <h2 className="headline-md">All Orders</h2>
        <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ padding: 'var(--spacing-2) var(--spacing-4)', borderRadius: 4, border: '1px solid var(--surface-container-highest)' }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            className="btn btn-secondary"
            onClick={handleExportCSV}
            style={{ padding: 'var(--spacing-2) var(--spacing-5)', borderRadius: 4 }}
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* States */}
      {loading && (
        <p className="body-md" style={{ color: 'var(--on-surface-variant)', padding: 'var(--spacing-8)' }}>
          Loading orders…
        </p>
      )}
      {error && (
        <p style={{ color: '#c0392b', padding: 'var(--spacing-4)', background: '#fff0f0', borderRadius: 4 }}>
          {error}
        </p>
      )}

      {/* Table */}
      {!loading && !error && (
        <>
          <div className="recent-activity" style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th className="label-md">Order #</th>
                  <th className="label-md">Customer</th>
                  <th className="label-md">Email</th>
                  <th className="label-md">Date</th>
                  <th className="label-md">Status</th>
                  <th className="label-md">Payment</th>
                  <th className="label-md">Total</th>
                  <th className="label-md">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: 'var(--spacing-8)', color: 'var(--on-surface-variant)' }}>
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  orders.map(order => (
                    <tr key={getId(order)}>
                      <td className="body-md">
                        {order.orderNumber || getId(order)?.slice(-6).toUpperCase()}
                      </td>
                      <td className="body-md">
                        {order.shippingAddress?.name || order.guestName || '—'}
                      </td>
                      <td className="body-md">{order.email || order.guestEmail || '—'}</td>
                      <td className="body-md">{formatDate(order.createdAt)}</td>
                      <td>
                        <span className={`status-badge ${STATUS_COLOURS[order.status] || 'status-pending'}`}>
                          {order.status || 'pending'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${order.paymentStatus === 'paid' ? 'status-delivered' : 'status-pending'}`}>
                          {order.paymentStatus || 'unpaid'}
                        </span>
                      </td>
                      <td className="body-md">
                        ₹{Number(order.total || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn btn-tertiary"
                          onClick={() => setSelectedOrder(order)}
                          style={{ fontSize: '0.8rem' }}
                        >
                          View
                        </button>
                        <select
                          value={order.status || 'pending'}
                          disabled={updatingId === getId(order)}
                          onChange={e => handleStatusChange(getId(order), e.target.value)}
                          style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--surface-container-highest)' }}
                        >
                          <option value="pending">Pending</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'center', marginTop: 'var(--spacing-6)' }}>
              <button
                className="btn btn-secondary"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >← Prev</button>
              <span className="body-md" style={{ alignSelf: 'center' }}>
                Page {page} of {totalPages}
              </span>
              <button
                className="btn btn-secondary"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >Next →</button>
            </div>
          )}
        </>
      )}

      {/* ── Order Detail Modal ──────────────────────────────────────────────── */}
      {selectedOrder && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
          onClick={e => { if (e.target === e.currentTarget) setSelectedOrder(null); }}
        >
          <div style={{
            background: 'var(--surface)', borderRadius: 8, padding: 'var(--spacing-8)',
            width: '90%', maxWidth: 600, maxHeight: '80vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-6)' }}>
              <h3 className="headline-sm">Order Details</h3>
              <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>

            <p className="body-md"><strong>Order #:</strong> {selectedOrder.orderNumber || getId(selectedOrder)}</p>
            <p className="body-md"><strong>Date:</strong> {formatDate(selectedOrder.createdAt)}</p>
            <p className="body-md"><strong>Email:</strong> {selectedOrder.email || selectedOrder.guestEmail || '—'}</p>
            <p className="body-md"><strong>Status:</strong> {selectedOrder.status}</p>
            <p className="body-md"><strong>Payment:</strong> {selectedOrder.paymentStatus}</p>
            <p className="body-md"><strong>Method:</strong> {selectedOrder.paymentMethod || '—'}</p>

            {selectedOrder.shippingAddress && (
              <>
                <h4 className="label-lg" style={{ marginTop: 'var(--spacing-4)' }}>Shipping Address</h4>
                <p className="body-md" style={{ lineHeight: 1.7 }}>
                  <strong>{selectedOrder.shippingAddress.name || '—'}</strong><br />
                  {selectedOrder.shippingAddress.phone && <>{selectedOrder.shippingAddress.phone}<br /></>}
                  {selectedOrder.shippingAddress.line1}<br />
                  {selectedOrder.shippingAddress.line2 && <>{selectedOrder.shippingAddress.line2}<br /></>}
                  {selectedOrder.shippingAddress.city}
                  {selectedOrder.shippingAddress.state && `, ${selectedOrder.shippingAddress.state}`}
                  {selectedOrder.shippingAddress.pincode && ` — ${selectedOrder.shippingAddress.pincode}`}
                </p>
              </>
            )}

            <h4 className="label-lg" style={{ marginTop: 'var(--spacing-4)' }}>Items</h4>
{(selectedOrder.items || []).map((item, i) => (
  <div key={i} style={{
    display: 'flex', alignItems: 'center', gap: 12,
    padding: 'var(--spacing-3) 0',
    borderBottom: '1px solid var(--surface-container-highest)',
  }}>
    {item.image ? (
      <img
        src={item.image}
        alt={item.title}
        style={{ width: 52, height: 52, objectFit: 'cover',
          borderRadius: 4, border: '1px solid var(--surface-container-highest)',
          flexShrink: 0 }}
        onError={e => { e.target.style.display = 'none'; }}
      />
    ) : (
      <div style={{ width: 52, height: 52, borderRadius: 4, flexShrink: 0,
        background: 'var(--surface-container-low)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.2rem' }}>💎</div>
    )}
    <div style={{ flex: 1 }}>
      <p className="body-md" style={{ margin: 0, fontWeight: 500 }}>{item.title}</p>
      {item.material && (
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--on-surface-variant)',
          textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.material}</p>
      )}
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>
        Qty: {item.quantity}
      </p>
    </div>
    <span className="body-md" style={{ fontWeight: 500, flexShrink: 0 }}>
      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
    </span>
  </div>
))}

            <div style={{ marginTop: 'var(--spacing-4)', textAlign: 'right' }}>
              <p className="body-md">Subtotal: ₹{Number(selectedOrder.subtotal || 0).toLocaleString('en-IN')}</p>
              <p className="body-md">Shipping: {Number(selectedOrder.shippingCost) > 0 ? `₹${selectedOrder.shippingCost}` : 'Complimentary'}</p>
              <p className="label-lg">Total: ₹{Number(selectedOrder.total || 0).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminOrders;