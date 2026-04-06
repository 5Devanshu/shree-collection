import React, { useState, useEffect } from 'react';
import { useStore }  from '../context/StoreContext';
import {
  setDiscount, enableDiscount,
  disableDiscount, removeDiscount,
} from '../api/client';

const AdminDiscounts = () => {
  const { products, refreshProducts } = useStore();
  const [search,  setSearch]  = useState('');
  const [msg,     setMsg]     = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState({});  // { [productId]: true }

  const flash = (type, text) => {
    if (type === 'success') { setMsg(text); setError(''); }
    else                    { setError(text); setMsg(''); }
    setTimeout(() => { setMsg(''); setError(''); }, 3500);
  };

  const setLoad = (id, val) => setLoading(prev => ({ ...prev, [id]: val }));

  const handleSetDiscount = async (product, percent) => {
    const p = parseFloat(percent);
    if (isNaN(p) || p < 0 || p > 100) { flash('error', 'Enter a value between 0 and 100'); return; }
    setLoad(product._id, true);
    try {
      await setDiscount(product._id, { discountPercent: p });
      await refreshProducts();
      flash('success', `Discount set to ${p}% on "${product.title}"`);
    } catch (err) { flash('error', err.message); }
    finally { setLoad(product._id, false); }
  };

  const handleToggle = async (product) => {
    setLoad(product._id, true);
    try {
      if (product.discountEnabled) {
        await disableDiscount(product._id);
        flash('success', `Discount disabled on "${product.title}"`);
      } else {
        await enableDiscount(product._id);
        flash('success', `Discount of ${product.discountPercent}% enabled on "${product.title}"`);
      }
      await refreshProducts();
    } catch (err) { flash('error', err.message); }
    finally { setLoad(product._id, false); }
  };

  const handleRemove = async (product) => {
    if (!window.confirm('Remove discount entirely from this product?')) return;
    setLoad(product._id, true);
    try {
      await removeDiscount(product._id);
      await refreshProducts();
      flash('success', `Discount removed from "${product.title}"`);
    } catch (err) { flash('error', err.message); }
    finally { setLoad(product._id, false); }
  };

  const filtered = products.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
        <h2 className="headline-md">Discounts</h2>
        <input
          type="text"
          placeholder="Search products…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '10px 16px', border: '1px solid var(--outline-variant)', background: 'var(--surface-container-lowest)', color: 'var(--on-surface)', fontFamily: 'var(--font-sans)', width: 280 }}
        />
      </div>

      {msg   && <div style={{ background: 'rgba(115,92,0,0.08)', border: '1px solid var(--primary)', color: 'var(--primary)', padding: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)', fontSize: '0.875rem' }}>{msg}</div>}
      {error && <div style={{ background: 'rgba(186,26,26,0.06)', border: '1px solid rgba(186,26,26,0.2)', color: 'var(--on-error)', padding: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)', fontSize: '0.875rem' }}>{error}</div>}

      <div className="recent-activity">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="label-md">Product</th>
              <th className="label-md">Original Price</th>
              <th className="label-md">Discount %</th>
              <th className="label-md">Discounted Price</th>
              <th className="label-md">Status</th>
              <th className="label-md">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--spacing-12)', color: 'var(--on-surface-variant)' }}>
                  No products found
                </td>
              </tr>
            )}
            {filtered.map(p => (
              <ProductDiscountRow
                key={p._id}
                product={p}
                isLoading={!!loading[p._id]}
                onSetDiscount={handleSetDiscount}
                onToggle={handleToggle}
                onRemove={handleRemove}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Inline row component with local input state ───────────────────────────────
const ProductDiscountRow = ({ product, isLoading, onSetDiscount, onToggle, onRemove }) => {
  const [percent, setPercent] = useState(product.discountPercent || '');

  useEffect(() => { setPercent(product.discountPercent || ''); }, [product.discountPercent]);

  return (
    <tr>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
          {product.image && (
            <div style={{ width: 36, height: 36, overflow: 'hidden', flexShrink: 0, background: 'var(--surface-container-low)' }}>
              <img src={product.image} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          <div>
            <div className="body-lg" style={{ fontWeight: 500 }}>{product.title}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{product.categorySlug}</div>
          </div>
        </div>
      </td>

      <td className="body-lg">₹{Number(product.price).toLocaleString()}</td>

      {/* Discount input */}
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="number"
            min="0"
            max="100"
            value={percent}
            onChange={e => setPercent(e.target.value)}
            style={{
              width: 72,
              padding: '6px 8px',
              border: '1px solid var(--outline-variant)',
              background: 'var(--surface-container-lowest)',
              color: 'var(--on-surface)',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.9rem',
            }}
          />
          <span style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>%</span>
          <button
            className="btn btn-tertiary"
            onClick={() => onSetDiscount(product, percent)}
            disabled={isLoading}
            style={{ fontSize: '0.75rem' }}
          >
            Set
          </button>
        </div>
      </td>

      <td className="body-lg">
        {product.discountEnabled && product.discountPercent > 0
          ? <span style={{ color: 'var(--primary)', fontWeight: 500 }}>₹{Number(product.discountedPrice).toLocaleString()}</span>
          : <span style={{ color: 'var(--on-surface-variant)' }}>—</span>
        }
      </td>

      <td>
        {product.discountPercent > 0 ? (
          <span className={`status-badge ${product.discountEnabled ? 'status-delivered' : 'status-pending'}`}>
            {product.discountEnabled ? `Active ${product.discountPercent}%` : `Off ${product.discountPercent}%`}
          </span>
        ) : (
          <span className="status-badge status-pending">No Discount</span>
        )}
      </td>

      <td>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* Enable / Disable toggle */}
          {product.discountPercent > 0 && (
            <button
              className="btn btn-tertiary"
              onClick={() => onToggle(product)}
              disabled={isLoading}
              style={{ color: product.discountEnabled ? 'var(--on-error)' : 'var(--primary)', fontSize: '0.8rem' }}
            >
              {product.discountEnabled ? 'Disable' : 'Enable'}
            </button>
          )}

          {/* Remove entirely */}
          {product.discountPercent > 0 && (
            <button
              className="btn btn-tertiary"
              onClick={() => onRemove(product)}
              disabled={isLoading}
              style={{ color: 'var(--on-error)', fontSize: '0.8rem' }}
            >
              Remove
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default AdminDiscounts;