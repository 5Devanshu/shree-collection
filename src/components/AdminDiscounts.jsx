import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import client from '../api/client';

// ── Helpers — resolve category slug from product ──────────────────────────────
const getProductCategorySlug = (p) => p.categorySlug || p.category?.slug || '';

const matchesCategory = (p, slug) => getProductCategorySlug(p) === slug;

const setCategoryDiscount = async (slug, percent, products) => {
  const matched = products.filter(p => matchesCategory(p, slug));
  await Promise.all(matched.map(p =>
    client.patch(`/products/${p.id || p._id}`, {
      discountPercent: Number(percent),
      discountEnabled: Number(percent) > 0,
    })
  ));
};

const removeCategoryDiscount = async (slug, products) => {
  const matched = products.filter(p => matchesCategory(p, slug));
  await Promise.all(matched.map(p =>
    client.patch(`/products/${p.id || p._id}`, {
      discountPercent: 0,
      discountEnabled: false,
      discountedPrice: 0,
    })
  ));
};

const AdminDiscounts = () => {
  const { products, categories, loadProducts } = useStore();

  const [tab,     setTab]     = useState('products');
  const [search,  setSearch]  = useState('');
  const [msg,     setMsg]     = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState({});

  const flash = (type, text) => {
    if (type === 'success') { setMsg(text); setError(''); }
    else                    { setError(text); setMsg(''); }
    setTimeout(() => { setMsg(''); setError(''); }, 3500);
  };

  const setLoad  = (id, val) => setLoading(prev => ({ ...prev, [id]: val }));
  const refresh  = () => loadProducts?.();

  // ── Product discount handlers ─────────────────────────────────────────────
  const handleSetDiscount = async (product, percent) => {
    const id = product.id || product._id;
    const p  = parseFloat(percent);
    if (isNaN(p) || p < 0 || p > 100) { flash('error', 'Enter a value between 0 and 100'); return; }
    setLoad(id, true);
    try {
      await client.patch(`/products/${id}`, {
        discountPercent: p,
        discountEnabled: p > 0,
      });
      refresh();
      flash('success', `Discount set to ${p}% on "${product.title}"`);
    } catch (err) { flash('error', err.message); }
    finally { setLoad(id, false); }
  };

  const handleToggle = async (product) => {
    const id = product.id || product._id;
    setLoad(id, true);
    try {
      await client.patch(`/products/${id}`, { discountEnabled: !product.discountEnabled });
      refresh();
      flash('success', `Discount ${product.discountEnabled ? 'disabled' : 'enabled'} on "${product.title}"`);
    } catch (err) { flash('error', err.message); }
    finally { setLoad(id, false); }
  };

  const handleRemove = async (product) => {
    if (!window.confirm('Remove discount from this product?')) return;
    const id = product.id || product._id;
    setLoad(id, true);
    try {
      await client.patch(`/products/${id}`, {
        discountPercent: 0,
        discountEnabled: false,
        discountedPrice: 0,
      });
      refresh();
      flash('success', `Discount removed from "${product.title}"`);
    } catch (err) { flash('error', err.message); }
    finally { setLoad(id, false); }
  };

  // ── Category discount handlers ────────────────────────────────────────────
  const handleSetCategoryDiscount = async (category, percent) => {
    const p = parseFloat(percent);
    if (isNaN(p) || p < 0 || p > 100) { flash('error', 'Enter a value between 0 and 100'); return; }
    const catKey = `cat_${category.id}`;
    setLoad(catKey, true);
    try {
      await setCategoryDiscount(category.slug, p, products);
      refresh();
      flash('success', `${p}% discount applied to all products in "${category.name}"`);
    } catch (err) { flash('error', err.message); }
    finally { setLoad(catKey, false); }
  };

  const handleRemoveCategoryDiscount = async (category) => {
    if (!window.confirm(`Remove all discounts from "${category.name}"?`)) return;
    const catKey = `cat_${category.id}`;
    setLoad(catKey, true);
    try {
      await removeCategoryDiscount(category.slug, products);
      refresh();
      flash('success', `Discounts removed from all products in "${category.name}"`);
    } catch (err) { flash('error', err.message); }
    finally { setLoad(catKey, false); }
  };

  const filteredProducts = (Array.isArray(products) ? products : [])
    .filter(p => (p.title ?? '').toLowerCase().includes(search.toLowerCase()));

  const filteredCategories = (Array.isArray(categories) ? categories : [])
    .filter(c => (c.name ?? '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="admin-content">

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-5)' }}>
        <h2 className="headline-md">Discounts</h2>
        <input
          type="text"
          placeholder={tab === 'products' ? 'Search products…' : 'Search categories…'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '10px 16px', border: '1px solid var(--outline-variant)', background: 'var(--surface-container-lowest)', color: 'var(--on-surface)', fontFamily: 'var(--font-sans)', width: 280 }}
        />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', marginBottom: 'var(--spacing-6)', borderBottom: '1px solid var(--surface-container-highest)' }}>
        {['products', 'categories'].map(t => (
          <button key={t} onClick={() => { setTab(t); setSearch(''); }}
            style={{
              padding: '10px 24px', background: 'none', border: 'none',
              borderBottom: tab === t ? '2px solid #735c00' : '2px solid transparent',
              color: tab === t ? '#735c00' : 'var(--on-surface-variant)',
              fontFamily: 'var(--font-sans)', fontSize: '0.85rem',
              fontWeight: tab === t ? 600 : 400, cursor: 'pointer',
              textTransform: 'capitalize', marginBottom: -1,
            }}>
            By {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Flash */}
      {msg   && <div style={{ background: 'rgba(115,92,0,0.08)', border: '1px solid var(--primary)', color: 'var(--primary)', padding: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)', fontSize: '0.875rem' }}>{msg}</div>}
      {error && <div style={{ background: 'rgba(186,26,26,0.06)', border: '1px solid rgba(186,26,26,0.2)', color: 'var(--on-error)', padding: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)', fontSize: '0.875rem' }}>{error}</div>}

      {/* ── Products Tab ────────────────────────────────────────────────────── */}
      {tab === 'products' && (
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
              {filteredProducts.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 'var(--spacing-12)', color: 'var(--on-surface-variant)' }}>No products found</td></tr>
              )}
              {filteredProducts.map(p => (
                <ProductDiscountRow
                  key={p.id || p._id}
                  product={p}
                  isLoading={!!loading[p.id || p._id]}
                  onSetDiscount={handleSetDiscount}
                  onToggle={handleToggle}
                  onRemove={handleRemove}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Categories Tab ──────────────────────────────────────────────────── */}
      {tab === 'categories' && (
        <div className="recent-activity">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="label-md">Category</th>
                <th className="label-md">Products</th>
                <th className="label-md">Active Discounts</th>
                <th className="label-md">Set Discount %</th>
                <th className="label-md">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 'var(--spacing-12)', color: 'var(--on-surface-variant)' }}>No categories found</td></tr>
              )}
              {filteredCategories.map(cat => (
                <CategoryDiscountRow
                  key={cat.id || cat._id}
                  category={cat}
                  products={products}
                  isLoading={!!loading[`cat_${cat.id}`]}
                  onSetDiscount={handleSetCategoryDiscount}
                  onRemove={handleRemoveCategoryDiscount}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── Product row ───────────────────────────────────────────────────────────────
const ProductDiscountRow = ({ product, isLoading, onSetDiscount, onToggle, onRemove }) => {
  const [percent, setPercent] = useState(
    product.discountPercent != null ? String(product.discountPercent) : ''
  );

  return (
    <tr>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
          {(product.imageUrl || product.image) && (
            <div style={{ width: 36, height: 36, overflow: 'hidden', flexShrink: 0, background: 'var(--surface-container-low)', borderRadius: 4 }}>
              <img src={product.imageUrl || product.image} alt={product.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          <div>
            <div className="body-lg" style={{ fontWeight: 500 }}>{product.title}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
              {product.category?.name || product.categorySlug || '—'}
            </div>
          </div>
        </div>
      </td>
      <td className="body-lg">₹{Number(product.price).toLocaleString()}</td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="number" min="0" max="100" value={percent}
            onChange={e => setPercent(e.target.value)}
            style={{ width: 72, padding: '6px 8px', border: '1px solid var(--outline-variant)', background: 'var(--surface-container-lowest)', color: 'var(--on-surface)', fontFamily: 'var(--font-sans)', fontSize: '0.9rem' }}
          />
          <span style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>%</span>
          <button className="btn btn-tertiary" onClick={() => onSetDiscount(product, percent)}
            disabled={isLoading} style={{ fontSize: '0.75rem' }}>Set</button>
        </div>
      </td>
      <td className="body-lg">
        {product.discountEnabled && Number(product.discountPercent) > 0
          ? <span style={{ color: 'var(--primary)', fontWeight: 500 }}>₹{Number(product.discountedPrice).toLocaleString()}</span>
          : <span style={{ color: 'var(--on-surface-variant)' }}>—</span>}
      </td>
      <td>
        {Number(product.discountPercent) > 0
          ? <span className={`status-badge ${product.discountEnabled ? 'status-delivered' : 'status-pending'}`}>
              {product.discountEnabled ? `Active ${Number(product.discountPercent).toFixed(0)}%` : `Off ${Number(product.discountPercent).toFixed(0)}%`}
            </span>
          : <span className="status-badge status-pending">No Discount</span>}
      </td>
      <td>
        <div style={{ display: 'flex', gap: 8 }}>
          {Number(product.discountPercent) > 0 && (
            <button className="btn btn-tertiary" onClick={() => onToggle(product)} disabled={isLoading}
              style={{ color: product.discountEnabled ? 'var(--on-error)' : 'var(--primary)', fontSize: '0.8rem' }}>
              {product.discountEnabled ? 'Disable' : 'Enable'}
            </button>
          )}
          {Number(product.discountPercent) > 0 && (
            <button className="btn btn-tertiary" onClick={() => onRemove(product)} disabled={isLoading}
              style={{ color: 'var(--on-error)', fontSize: '0.8rem' }}>Remove</button>
          )}
        </div>
      </td>
    </tr>
  );
};

// ── Category row ──────────────────────────────────────────────────────────────
const CategoryDiscountRow = ({ category, products, isLoading, onSetDiscount, onRemove }) => {
  const [percent, setPercent] = useState('');

  const categoryProducts = (Array.isArray(products) ? products : [])
    .filter(p => p.categorySlug === category.slug || p.category?.slug === category.slug);

  const discountedCount = categoryProducts.filter(
    p => p.discountEnabled && Number(p.discountPercent) > 0
  ).length;

  return (
    <tr>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {(category.imageUrl || category.image) && (
            <div style={{ width: 36, height: 36, overflow: 'hidden', flexShrink: 0, borderRadius: 4, background: 'var(--surface-container-low)' }}>
              <img src={category.imageUrl || category.image} alt={category.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          <div>
            <div className="body-lg" style={{ fontWeight: 500 }}>{category.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{category.slug}</div>
          </div>
        </div>
      </td>
      <td className="body-lg">{categoryProducts.length} product{categoryProducts.length !== 1 ? 's' : ''}</td>
      <td>
        {discountedCount > 0
          ? <span className="status-badge status-delivered">{discountedCount} active</span>
          : <span className="status-badge status-pending">None</span>}
      </td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="number" min="0" max="100" value={percent} placeholder="0–100"
            onChange={e => setPercent(e.target.value)}
            style={{ width: 80, padding: '6px 8px', border: '1px solid var(--outline-variant)', background: 'var(--surface-container-lowest)', color: 'var(--on-surface)', fontFamily: 'var(--font-sans)', fontSize: '0.9rem' }}
          />
          <span style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>%</span>
          <button className="btn btn-tertiary"
            onClick={() => onSetDiscount(category, percent)}
            disabled={isLoading || !percent}
            style={{ fontSize: '0.75rem' }}>
            {isLoading ? '…' : 'Apply to All'}
          </button>
        </div>
      </td>
      <td>
        {discountedCount > 0 && (
          <button className="btn btn-tertiary" onClick={() => onRemove(category)} disabled={isLoading}
            style={{ color: 'var(--on-error)', fontSize: '0.8rem' }}>
            Remove All
          </button>
        )}
      </td>
    </tr>
  );
};

export default AdminDiscounts;