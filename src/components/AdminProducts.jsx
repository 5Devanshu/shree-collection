import React, { useState } from 'react';
import { useStore }  from '../context/StoreContext';
import { uploadImage } from '../api/client';
import Modal from './Modal';
import './Modal.css';

const emptyForm = () => ({
  title: '', material: '', price: '', image: '',
  categorySlug: '', description: '', stock: '', featured: false,
  details: [{ label: '', value: '' }],
});

const StockBadge = ({ stock }) => {
  if (stock > 5) return <span className="status-badge status-delivered">In Stock</span>;
  if (stock > 0) return <span className="status-badge status-shipped">Low Stock</span>;
  return <span className="status-badge status-pending">Out of Stock</span>;
};

// ── Product Form ───────────────────────────────────────────────────────────────
const ProductForm = ({ initial, categories, onSave, onCancel }) => {
  const [form,     setForm]     = useState(initial || emptyForm());
  const [imgError, setImgError] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const setDetail = (i, key, val) =>
    setForm(prev => {
      const details = [...prev.details];
      details[i] = { ...details[i], [key]: val };
      return { ...prev, details };
    });

  const addDetail    = () => setForm(prev => ({ ...prev, details: [...prev.details, { label: '', value: '' }] }));
  const removeDetail = (i) => setForm(prev => ({ ...prev, details: prev.details.filter((_, idx) => idx !== i) }));

  const handleImageFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview locally first
    const reader = new FileReader();
    reader.onload = (ev) => { setImgError(false); set('image', ev.target.result); };
    reader.readAsDataURL(file);

    // Upload to Cloudinary via backend
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await uploadImage(formData);
      set('image', res.data.url);
    } catch (err) {
      console.error('Upload failed:', err.message);
      // Keep local preview — URL will be re-uploaded on save
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!form.title.trim() || !form.price || !form.categorySlug) {
      alert('Product name, price and category are required.');
      return;
    }
    onSave({
      ...form,
      price:   parseFloat(form.price)   || 0,
      stock:   parseInt(form.stock, 10) || 0,
      details: form.details.filter(d => d.label.trim() && d.value.trim()),
    });
  };

  const showImagePreview = form.image && !imgError;

  return (
    <div className="modal-form">

      {/* ── Image ──────────────────────────────────────────────────────────── */}
      <div className="form-field">
        <label>Product Image</label>
        <div className="form-image-preview">
          {uploading ? (
            <span className="placeholder-text">Uploading…</span>
          ) : showImagePreview ? (
            <img
              src={form.image}
              alt="Preview"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="placeholder-text">
              No image — paste a URL or choose a file below
            </span>
          )}
        </div>
        <input
          type="text"
          placeholder="Paste image URL…"
          value={!form.image?.startsWith('data:') ? (form.image || '') : ''}
          onChange={e => { setImgError(false); set('image', e.target.value); }}
        />
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="form-file-input"
          onChange={handleImageFile}
        />
      </div>

      {/* ── Name + Material ──────────────────────────────────────────────── */}
      <div className="form-row">
        <div className="form-field">
          <label>Product Name *</label>
          <input
            type="text"
            placeholder="e.g. Lumina Diamond Ring"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            autoFocus
          />
        </div>
        <div className="form-field">
          <label>Material</label>
          <input
            type="text"
            placeholder="e.g. 18K YELLOW GOLD"
            value={form.material}
            onChange={e => set('material', e.target.value)}
          />
        </div>
      </div>

      {/* ── Category + Price ─────────────────────────────────────────────── */}
      <div className="form-row">
        <div className="form-field">
          <label>Category *</label>
          <select
            value={form.categorySlug}
            onChange={e => set('categorySlug', e.target.value)}
          >
            <option value="">Select category…</option>
            {categories.map(c => (
              <option key={c._id} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label>Price (₹) *</label>
          <input
            type="number"
            min="0"
            placeholder="e.g. 4200"
            value={form.price}
            onChange={e => set('price', e.target.value)}
          />
        </div>
      </div>

      {/* ── Stock + Featured ─────────────────────────────────────────────── */}
      <div className="form-row">
        <div className="form-field">
          <label>Stock Quantity</label>
          <input
            type="number"
            min="0"
            placeholder="e.g. 10"
            value={form.stock}
            onChange={e => set('stock', e.target.value)}
          />
        </div>
        <div className="form-field" style={{ justifyContent: 'flex-end' }}>
          <div className="form-checkbox-row" style={{ paddingBottom: 8 }}>
            <input
              type="checkbox"
              id="featured"
              checked={form.featured}
              onChange={e => set('featured', e.target.checked)}
            />
            <label htmlFor="featured">Feature on homepage</label>
          </div>
        </div>
      </div>

      {/* ── Description ──────────────────────────────────────────────────── */}
      <div className="form-field">
        <label>Description</label>
        <textarea
          placeholder="Describe the piece — craftsmanship, story, material details…"
          value={form.description}
          onChange={e => set('description', e.target.value)}
          rows={3}
        />
      </div>

      {/* ── Specifications ───────────────────────────────────────────────── */}
      <div className="form-field">
        <label>Product Specifications</label>
        <div className="detail-pairs">
          {form.details.map((d, i) => (
            <div className="detail-pair" key={i}>
              <div className="form-field" style={{ margin: 0 }}>
                <input
                  type="text"
                  placeholder="Label (e.g. Metal)"
                  value={d.label}
                  onChange={e => setDetail(i, 'label', e.target.value)}
                />
              </div>
              <div className="form-field" style={{ margin: 0 }}>
                <input
                  type="text"
                  placeholder="Value (e.g. Platinum)"
                  value={d.value}
                  onChange={e => setDetail(i, 'value', e.target.value)}
                />
              </div>
              <button className="detail-pair-remove" onClick={() => removeDetail(i)}>✕</button>
            </div>
          ))}
        </div>
        <button className="add-detail-btn" onClick={addDetail}>
          + Add Specification
        </button>
      </div>

      {/* ── Actions ──────────────────────────────────────────────────────── */}
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={uploading}>
          {uploading ? 'Uploading image…' : 'Save Product'}
        </button>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const AdminProducts = () => {
  const { products, categories, addProduct, updateProduct, deleteProduct } = useStore();
  const [modal,     setModal]     = useState(null);
  const [editing,   setEditing]   = useState(null);
  const [search,    setSearch]    = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [error,     setError]     = useState('');
  const [saving,    setSaving]    = useState(false);

  const openAdd    = () => { setEditing(null);  setModal('add');  };
  const openEdit   = (p) => { setEditing(p);    setModal('edit'); };
  const closeModal = () => { setModal(null); setEditing(null); setError(''); };

  const handleSave = async (data) => {
    setSaving(true);
    setError('');
    try {
      if (modal === 'add') await addProduct(data);
      else await updateProduct(editing._id, data);
      closeModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deleteProduct(id);
    } catch (err) {
      alert(err.message);
    }
  };

  const filtered = products.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchCat    = !filterCat || p.categorySlug === filterCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="admin-content">
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--spacing-6)',
      }}>
        <h2 className="headline-md">Products</h2>
        <button className="btn btn-primary" onClick={openAdd}
          style={{ padding: 'var(--spacing-3) var(--spacing-6)' }}>
          + Add Product
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search products…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: 200,
            maxWidth: 340,
            padding: '10px 16px',
            border: '1px solid var(--outline-variant)',
            background: '#fff',
            color: 'var(--on-surface)',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.875rem',
            outline: 'none',
          }}
        />
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          style={{
            padding: '10px 36px 10px 16px',
            border: '1px solid var(--outline-variant)',
            background: '#fff',
            color: 'var(--on-surface)',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.875rem',
            cursor: 'pointer',
            appearance: 'none',
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%237f7663' fill='none' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\")",
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
          }}
        >
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c._id} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="recent-activity">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="label-md">Image</th>
              <th className="label-md">Product</th>
              <th className="label-md">Category</th>
              <th className="label-md">Price</th>
              <th className="label-md">Stock</th>
              <th className="label-md">Featured</th>
              <th className="label-md">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{
                  textAlign: 'center',
                  padding: 'var(--spacing-12)',
                  color: 'var(--on-surface-variant)',
                }}>
                  No products found
                </td>
              </tr>
            )}
            {filtered.map(p => {
              const cat = categories.find(c => c.slug === p.categorySlug);
              return (
                <tr key={p._id}>
                  <td>
                    <div style={{
                      width: 48,
                      height: 48,
                      background: 'var(--surface-container-low)',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {p.image
                        ? <img src={p.image} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: '1.2rem' }}>💎</span>
                      }
                    </div>
                  </td>
                  <td>
                    <div className="body-lg" style={{ fontWeight: 500, marginBottom: 2 }}>{p.title}</div>
                    {p.material && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {p.material}
                      </div>
                    )}
                    {p.discountEnabled && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600, marginTop: 2 }}>
                        {p.discountPercent}% OFF
                      </div>
                    )}
                  </td>
                  <td className="body-lg">{cat?.name || p.categorySlug || '—'}</td>
                  <td>
                    <div className="body-lg">₹{Number(p.price).toLocaleString()}</div>
                    {p.discountEnabled && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 500 }}>
                        ₹{Number(p.discountedPrice).toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td><StockBadge stock={p.stock} /></td>
                  <td>
                    <span style={{ fontSize: '1.1rem', color: p.featured ? 'var(--primary)' : 'var(--outline-variant)' }}>
                      {p.featured ? '★' : '☆'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button className="btn btn-tertiary" onClick={() => openEdit(p)}>Edit</button>
                      <button
                        className="btn btn-tertiary"
                        onClick={() => handleDelete(p._id, p.title)}
                        style={{ color: 'var(--on-error)' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal
        isOpen={!!modal}
        onClose={closeModal}
        title={modal === 'add' ? 'Add New Product' : 'Edit Product'}
        size="lg"
      >
        {error && (
          <div style={{
            background: 'rgba(186,26,26,0.06)',
            border: '1px solid rgba(186,26,26,0.2)',
            color: 'var(--on-error)',
            padding: 'var(--spacing-4)',
            marginBottom: 'var(--spacing-4)',
            fontSize: '0.875rem',
          }}>
            {error}
          </div>
        )}
        <ProductForm
          initial={editing}
          categories={categories}
          onSave={handleSave}
          onCancel={closeModal}
        />
      </Modal>
    </div>
  );
};

export default AdminProducts;