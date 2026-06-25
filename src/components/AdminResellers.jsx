import React, { useState, useEffect, useCallback } from 'react';
import { fetchResellers, verifyReseller, rejectReseller, deleteReseller } from '../api/client';

const STATUS_TABS = ['pending', 'verified', 'rejected', 'all'];

const badgeStyle = (status) => ({
  padding: '3px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 600,
  textTransform: 'capitalize',
  background: status === 'verified' ? '#e6f4ea' : status === 'rejected' ? '#fdecea' : '#fff7e0',
  color:      status === 'verified' ? '#1e7e34' : status === 'rejected' ? '#b3261e' : '#8a6d00',
});

const AdminResellers = () => {
  const [tab,       setTab]       = useState('pending');
  const [resellers, setResellers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [actionId,  setActionId]  = useState(null);
  const [message,   setMessage]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = tab === 'all' ? {} : { status: tab };
      const res = await fetchResellers(params);
      setResellers(res.data?.resellers || []);
    } catch (err) {
      setMessage(err.message || 'Failed to load resellers');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (id, action) => {
    const fn = action === 'verify' ? verifyReseller : rejectReseller;
    const confirmText = action === 'verify'
      ? 'Verify this reseller? They will be emailed and able to log in immediately.'
      : 'Reject this application?';
    if (!window.confirm(confirmText)) return;

    setActionId(id);
    setMessage('');
    try {
      const res = await fn(id);
      setMessage(res.data?.message || 'Done');
      await load();
    } catch (err) {
      setMessage(err.message || 'Action failed');
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(
      `Permanently remove "${name}"? This cannot be undone. Their past orders will remain in the system, but they will no longer be able to log in or get reseller pricing.`
    )) return;

    setActionId(id);
    setMessage('');
    try {
      const res = await deleteReseller(id);
      setMessage(res.data?.message || 'Reseller removed.');
      setResellers(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      setMessage(err?.response?.data?.message || err.message || 'Failed to remove reseller.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div style={{ padding: '1.5rem' }}>

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.2rem' }}>
        {STATUS_TABS.map(s => (
          <button key={s} onClick={() => setTab(s)}
            className={`btn ${tab === s ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 18px', textTransform: 'capitalize' }}>
            {s}
          </button>
        ))}
      </div>

      {message && (
        <p style={{ marginBottom: '1rem', color: 'var(--primary, #735c00)' }}>{message}</p>
      )}

      {loading ? (
        <p>Loading resellers…</p>
      ) : resellers.length === 0 ? (
        <p>No {tab === 'all' ? '' : tab} resellers.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #e3dcc8' }}>
                {['Name', 'Email', 'Phone', 'Company', 'Applied On', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 12px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resellers.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{r.name}</td>
                  <td style={{ padding: '10px 12px' }}>{r.email}</td>
                  <td style={{ padding: '10px 12px' }}>{r.phone || '—'}</td>
                  <td style={{ padding: '10px 12px' }}>{r.company || '—'}</td>
                  <td style={{ padding: '10px 12px' }}>
                    {new Date(r.createdAt).toLocaleDateString('en-IN',
                      { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={badgeStyle(r.status)}>{r.status}</span>
                  </td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                    {r.status === 'pending' ? (
                      <>
                        <button className="btn btn-primary"
                          style={{ padding: '6px 14px', marginRight: 8 }}
                          disabled={actionId === r.id}
                          onClick={() => handleAction(r.id, 'verify')}>
                          {actionId === r.id ? '…' : 'Verify'}
                        </button>
                        <button className="btn btn-secondary"
                          style={{ padding: '6px 14px', color: '#b3261e', marginRight: 8 }}
                          disabled={actionId === r.id}
                          onClick={() => handleAction(r.id, 'reject')}>
                          Reject
                        </button>
                      </>
                    ) : r.status === 'rejected' ? (
                      <button className="btn btn-secondary"
                        style={{ padding: '6px 14px', marginRight: 8 }}
                        disabled={actionId === r.id}
                        onClick={() => handleAction(r.id, 'verify')}>
                        Verify Anyway
                      </button>
                    ) : (
                      <span style={{ color: '#888', fontSize: '0.8rem', marginRight: 8 }}>
                        Verified {r.verifiedAt ? new Date(r.verifiedAt).toLocaleDateString('en-IN') : ''}
                      </span>
                    )}

                    {/* ── Remove — available regardless of status ── */}
                    <button className="btn btn-secondary"
                      style={{ padding: '6px 14px', color: '#b3261e', borderColor: '#f3c6c2' }}
                      disabled={actionId === r.id}
                      onClick={() => handleDelete(r.id, r.name)}>
                      {actionId === r.id ? '…' : 'Remove'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminResellers;