import React, { useState, useEffect, useCallback } from 'react';
import client from '../api/client';

const Stars = ({ value }) => (
  <span style={{ color: '#c9a840', fontSize: '0.9rem', letterSpacing: 1 }}>
    {'★'.repeat(value)}{'☆'.repeat(5 - value)}
  </span>
);

const AdminReviews = () => {
  const [reviews,    setReviews]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingId, setDeletingId] = useState(null);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res  = await client.get('/reviews', { params: { page, limit: 20 } });
      const data = res.data;
      setReviews(data.reviews || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err?.message || 'Failed to load reviews.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this review? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await client.delete(`/reviews/${id}`);
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert(err?.message || 'Failed to delete review.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (iso) => new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <div className="admin-content">

      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
        <h2 className="headline-md">All Reviews</h2>
        <span className="body-md" style={{ color: 'var(--on-surface-variant)' }}>
          {reviews.length} review{reviews.length !== 1 ? 's' : ''} on this page
        </span>
      </div>

      {loading && <p className="body-md" style={{ color: 'var(--on-surface-variant)', padding: 'var(--spacing-8)' }}>Loading reviews…</p>}
      {error   && <p style={{ color: '#c0392b', padding: 'var(--spacing-4)', background: '#fff0f0', borderRadius: 4 }}>{error}</p>}

      {!loading && !error && (
        <>
          <div className="recent-activity" style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th className="label-md">Reviewer</th>
                  <th className="label-md">Type</th>
                  <th className="label-md">Product ID</th>
                  <th className="label-md">Rating</th>
                  <th className="label-md">Comment</th>
                  <th className="label-md">Date</th>
                  <th className="label-md">Action</th>
                </tr>
              </thead>
              <tbody>
                {reviews.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--spacing-8)', color: 'var(--on-surface-variant)' }}>
                      No reviews yet.
                    </td>
                  </tr>
                ) : reviews.map(r => (
                  <tr key={r.id}>
                    <td className="body-md">{r.reviewerName}</td>
                    <td>
                      <span className={`status-badge ${r.reviewerType === 'reseller' ? 'status-delivered' : 'status-shipped'}`}>
                        {r.reviewerType}
                      </span>
                    </td>
                    <td className="body-md" style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
                      {r.productId?.slice(0, 8)}…
                    </td>
                    <td><Stars value={r.rating} /></td>
                    <td className="body-md" style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.comment || <span style={{ color: 'var(--on-surface-variant)' }}>—</span>}
                    </td>
                    <td className="body-md">{formatDate(r.createdAt)}</td>
                    <td>
                      <button
                        className="btn btn-tertiary"
                        style={{ fontSize: '0.78rem', color: '#c0392b', borderColor: 'rgba(192,57,43,0.3)' }}
                        disabled={deletingId === r.id}
                        onClick={() => handleDelete(r.id)}
                      >
                        {deletingId === r.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'center', marginTop: 'var(--spacing-6)' }}>
              <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span className="body-md" style={{ alignSelf: 'center' }}>Page {page} of {totalPages}</span>
              <button className="btn btn-secondary" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminReviews;