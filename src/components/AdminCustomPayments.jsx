import React, { useCallback, useEffect, useState } from 'react';
import {
  fetchAdminCustomPayments,
  fetchAdminCustomPaymentSummary,
  refreshAdminCustomPaymentStatus,
} from '../api/client';

const STATUS_OPTIONS = ['PENDING', 'COMPLETED', 'FAILED', 'EXPIRED'];

const formatMoney = (amount) =>
  Number(amount || 0).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
  });

const formatDate = (value) => value
  ? new Date(value).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  : '—';

export default function AdminCustomPayments() {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [refreshing, setRefreshing] = useState('');

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [paymentsResponse, summaryResponse] = await Promise.all([
        fetchAdminCustomPayments({ page, limit: 20, status, search }),
        fetchAdminCustomPaymentSummary(),
      ]);
      const data = paymentsResponse.data?.data || paymentsResponse.data;
      const summaryData = summaryResponse.data?.data || summaryResponse.data;
      setPayments(Array.isArray(data?.payments) ? data.payments : []);
      setPagination(data?.pagination || { page: 1, totalPages: 1, total: 0 });
      setSummary(summaryData);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Failed to load custom payments.');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => { loadPayments(); }, [loadPayments]);

  const handleRefresh = async (merchantOrderId) => {
    setRefreshing(merchantOrderId);
    try {
      const response = await refreshAdminCustomPaymentStatus(merchantOrderId);
      const refreshed = response.data?.data || response.data;
      await loadPayments();
      if (selected?.merchantOrderId === merchantOrderId) {
        setSelected(refreshed);
      }
    } catch (requestError) {
      alert(requestError?.response?.data?.message || 'Unable to refresh payment status.');
    } finally {
      setRefreshing('');
    }
  };

  const statusClass = (value) => {
    if (value === 'COMPLETED') return 'status-delivered';
    if (value === 'FAILED' || value === 'EXPIRED') return 'status-pending';
    return 'status-shipped';
  };

  return (
    <div className="admin-content">
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)', gap: 12, flexWrap: 'wrap' }}>
        <h2 className="headline-md">Custom Payments</h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            placeholder="Name, mobile, or order ID"
            style={{ minWidth: 220, padding: '10px 12px', border: '1px solid var(--surface-container-highest)', borderRadius: 4 }}
          />
          <select
            value={status}
            onChange={(event) => { setStatus(event.target.value); setPage(1); }}
            style={{ padding: '10px 12px', border: '1px solid var(--surface-container-highest)', borderRadius: 4 }}
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
      </div>

      {summary && (
        <div className="stat-cards">
          <div className="stat-card"><span className="label-md">Total payments</span><strong className="display-lg">{summary.total}</strong></div>
          <div className="stat-card"><span className="label-md">Collected</span><strong className="display-lg">{formatMoney(summary.totalCollected)}</strong></div>
          <div className="stat-card"><span className="label-md">Completed</span><strong className="display-lg">{summary.completed}</strong></div>
          <div className="stat-card"><span className="label-md">Pending</span><strong className="display-lg">{summary.pending}</strong></div>
        </div>
      )}

      {error && <p style={{ color: '#c0392b', padding: 12, background: '#fff0f0', borderRadius: 4 }}>{error}</p>}
      {loading && <p className="body-md" style={{ padding: 24 }}>Loading custom payments…</p>}

      {!loading && !error && (
        <div className="recent-activity" style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Mobile</th>
                <th>Amount</th>
                <th>Merchant order</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32 }}>No custom payments found.</td></tr>
              ) : payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.customerName}</td>
                  <td>{payment.customerMobile}</td>
                  <td>{formatMoney(payment.amount)}</td>
                  <td style={{ overflowWrap: 'anywhere' }}>{payment.merchantOrderId}</td>
                  <td><span className={`status-badge ${statusClass(payment.paymentStatus)}`}>{payment.paymentStatus}</span></td>
                  <td>{formatDate(payment.createdAt)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button type="button" className="btn-tertiary" onClick={() => setSelected(payment)}>Details</button>
                      <button
                        type="button"
                        className="btn-tertiary"
                        disabled={refreshing === payment.merchantOrderId}
                        onClick={() => handleRefresh(payment.merchantOrderId)}
                      >
                        {refreshing === payment.merchantOrderId ? 'Checking…' : 'Refresh'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
        <span className="body-md">{pagination.total} payment{pagination.total === 1 ? '' : 's'}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button>
          <button className="btn btn-secondary" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)}>Next</button>
        </div>
      </div>

      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(30,25,18,.45)', display: 'grid', placeItems: 'center', padding: 16 }}
        >
          <div style={{ width: 'min(520px, 100%)', maxHeight: '90vh', overflowY: 'auto', background: 'var(--surface-container-lowest)', padding: 24, borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="headline-md">Custom payment details</h3>
              <button type="button" className="btn-tertiary" onClick={() => setSelected(null)}>Close</button>
            </div>
            <dl style={{ display: 'grid', gap: 12, marginTop: 20 }}>
              {[
                ['Customer', selected.customerName],
                ['Mobile', selected.customerMobile],
                ['Amount', formatMoney(selected.amount)],
                ['Merchant order ID', selected.merchantOrderId],
                ['PhonePe order ID', selected.gatewayOrderId || '—'],
                ['Transaction ID', selected.gatewayTransactionId || '—'],
                ['Status', selected.paymentStatus],
                ['Payment method', selected.paymentMethod || '—'],
                ['Created', formatDate(selected.createdAt)],
                ['Paid at', formatDate(selected.paidAt)],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 12, borderBottom: '1px solid var(--surface-container-high)', paddingBottom: 10 }}>
                  <dt className="label-md">{label}</dt>
                  <dd style={{ margin: 0, overflowWrap: 'anywhere' }}>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
