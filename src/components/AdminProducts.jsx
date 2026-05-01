import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchProducts,
  fetchCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
} from '../api/client';

const EMPTY_FORM = {
  title:       '',
  material:    '',
  category:    '',
  price:       '',
  stockStatus: 'in_stock',   // ← replaces stock: ''
  description: '',
  isFeatured:  false,
  image:       '',
  gallery:     [],
};

const AdminProducts = () => {
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  const [showModal,  setShowModal]  = useState(false);
  const [editingId,  setEditingId]  = useState(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [formError,  setFormError]  = useState('');
  const [saving,     setSaving]     = useState(false);

  const [imageUploading,   setImageUploading]   = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);

  // ── Load data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetchProducts({ limit: 100 }),
        fetchCategories(),
      ]);
      const prods = prodRes.data?.products || prodRes.data?.data || [];
      const cats  = catRes.data?.data || catRes.data?.categories || catRes.data || [];
      setProducts(Array.isArray(prods) ? prods : []);
      setCategories(Array.isArray(cats) ? cats : []);
    } catch {
      setError('Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Modal open/close ──────────────────────────────────────────────────────
  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError('');
    setShowModal(true);
  };

const openEdit = (p) => {
  setForm({
    title:       p.title       || '',
    material:    p.material    || '',
    category:    p.category?._id || p.category || '',
    price:       p.price       ?? '',
    stockStatus: p.stockStatus || 'in_stock',  // ← replaces stock: p.stock ?? ''
    description: p.description || '',
    isFeatured:  p.isFeatured  || false,
    image:       p.image?.url  || p.image || '',
    gallery:     Array.isArray(p.gallery) ? p.gallery : [],
  });
  setEditingId(p._id);
  setFormError('');
  setShowModal(true);
};

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setFormError('');
  };

  // ── Image upload ──────────────────────────────────────────────────────────
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    setFormError('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('folder', 'product');
      const res = await uploadImage(fd);
      const url = res.data?.media?.secureUrl || res.data?.media?.url || '';
      setForm(prev => ({ ...prev, image: url }));
    } catch {
      setFormError('Image upload failed. Please try again.');
    } finally {
      setImageUploading(false);
    }
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setGalleryUploading(true);
    try {
      const urls = await Promise.all(files.map(async file => {
        const fd = new FormData();
        fd.append('image', file);
        fd.append('folder', 'product');
        const res = await uploadImage(fd);
        return res.data?.media?.secureUrl || res.data?.media?.url || '';
      }));
      setForm(prev => ({ ...prev, gallery: [...(prev.gallery || []), ...urls.filter(Boolean)] }));
    } catch {
      setFormError('Gallery upload failed.');
    } finally {
      setGalleryUploading(false);
    }
  };

  // ── Save product ──────────────────────────────────────────────────────────
const handleSave = async () => {
  setFormError('');
  if (!form.title.trim())       return setFormError('Product name is required.');
  if (!form.material.trim())    return setFormError('Material is required.');
  if (!form.category)           return setFormError('Please select a category.');
  if (!form.price)              return setFormError('Price is required.');
  if (!form.image)              return setFormError('Please upload a product image.');
  if (!form.description.trim()) return setFormError('Description is required.');

  setSaving(true);
  try {
    const payload = {
      title:       form.title.trim(),
      material:    form.material.trim(),
      category:    form.category,
      price:       Number(form.price),
      image:       { url: form.image },
      description: form.description.trim(),
      isFeatured:  form.isFeatured,
      gallery:     Array.isArray(form.gallery) ? form.gallery : [],
      stockStatus: form.stockStatus || 'in_stock',  // ← direct, no auto-conversion
    };

    if (editingId) {
      await updateProduct(editingId, payload);
    } else {
      await createProduct(payload);
    }
    await loadData();
    closeModal();
  } catch (err) {
    setFormError(err?.response?.data?.message || err?.message || 'Failed to save product.');
  } finally {
    setSaving(false);
  }
};

  // ── Delete / Featured toggle ──────────────────────────────────────────────
  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deleteProduct(id);
      setProducts(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      alert(err?.response?.data?.message || 'Delete failed.');
    }
  };

  const handleToggleFeatured = async (id, current) => {
    try {
      await updateProduct(id, { isFeatured: !current });
      setProducts(prev => prev.map(p => p._id === id ? { ...p, isFeatured: !current } : p));
    } catch {
      alert('Failed to update featured status.');
    }
  };

  const stockLabel = (s) => ({
    in_stock:    { text: 'In Stock',    cls: 'status-delivered' },
    low_stock:   { text: 'Low Stock',   cls: 'status-shipped'   },
    out_of_stock:{ text: 'Out of Stock',cls: 'status-pending'   },
  }[s] || { text: s || '—', cls: 'status-pending' });

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="admin-content">

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'2rem' }}>
        <div>
          <h2 className="headline-md">Products</h2>
          <p className="body-md" style={{ color:'var(--on-surface-variant)', marginTop:4 }}>
            {products.length} product{products.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={openAdd} style={{
          background:'var(--primary, #735c00)', color:'#fff',
          border:'none', borderRadius:6, padding:'0.65rem 1.4rem',
          fontFamily:'inherit', fontSize:'0.9rem', fontWeight:600,
          cursor:'pointer', display:'flex', alignItems:'center', gap:6,
        }}>
          + Add Product
        </button>
      </div>

      {error && (
        <div style={{ background:'#fff0f0', border:'1px solid #ffcccc', color:'#c0392b', padding:'0.75rem 1rem', borderRadius:6, marginBottom:'1.5rem' }}>
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p className="body-md" style={{ color:'var(--on-surface-variant)' }}>Loading products…</p>
      ) : (
        <div style={{ background:'#fff', borderRadius:8, border:'1px solid var(--surface-container-highest, #e8e0d5)', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'var(--surface-container-low, #faf7f2)', borderBottom:'1px solid var(--surface-container-highest, #e8e0d5)' }}>
                {['Image','Product Name','Category','Price','Stock','Featured','Actions'].map(h => (
                  <th key={h} style={{ padding:'0.85rem 1rem', textAlign:'left', fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.06em', color:'var(--on-surface-variant)', textTransform:'uppercase' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding:'3rem', textAlign:'center', color:'var(--on-surface-variant)' }}>
                    No products yet. Click "+ Add Product" to get started.
                  </td>
                </tr>
              ) : products.map((p, i) => {
                const sl = stockLabel(p.stockStatus);
                return (
                  <tr key={p._id} style={{ borderBottom:'1px solid var(--surface-container-highest, #e8e0d5)', background: i % 2 === 0 ? '#fff' : 'var(--surface-container-lowest, #fdfaf6)' }}>
                    <td style={{ padding:'0.75rem 1rem' }}>
                      {p.image?.url || p.image ? (
                        <img src={p.image?.url || p.image} alt={p.title}
                          style={{ width:48, height:48, objectFit:'cover', borderRadius:6, border:'1px solid #eee' }} />
                      ) : (
                        <div style={{ width:48, height:48, background:'#f0ebe3', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', color:'#bbb', fontSize:'1.2rem' }}>
                          🖼
                        </div>
                      )}
                    </td>
                    <td style={{ padding:'0.75rem 1rem' }}>
                      <div style={{ fontWeight:500, fontSize:'0.9rem' }}>{p.title}</div>
                      <div style={{ fontSize:'0.78rem', color:'var(--on-surface-variant)', marginTop:2 }}>{p.material}</div>
                    </td>
                    <td style={{ padding:'0.75rem 1rem', fontSize:'0.88rem', color:'var(--on-surface-variant)' }}>
                      {p.category?.name || '—'}
                    </td>
                    <td style={{ padding:'0.75rem 1rem', fontWeight:600, fontSize:'0.9rem' }}>
                      ₹{(p.price || 0).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding:'0.75rem 1rem' }}>
                      <span className={`status-badge ${sl.cls}`} style={{ fontSize:'0.75rem' }}>{sl.text}</span>
                    </td>
                    <td style={{ padding:'0.75rem 1rem', textAlign:'center' }}>
                      <button onClick={() => handleToggleFeatured(p._id, p.isFeatured)}
                        style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.3rem', color: p.isFeatured ? '#b39d00' : '#ccc' }}
                        title={p.isFeatured ? 'Remove from featured' : 'Feature on homepage'}>
                        ★
                      </button>
                    </td>
                    <td style={{ padding:'0.75rem 1rem' }}>
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={() => openEdit(p)} style={{
                          background:'var(--surface-container-low, #faf7f2)', border:'1px solid #ddd',
                          borderRadius:5, padding:'0.35rem 0.8rem', cursor:'pointer',
                          fontSize:'0.8rem', fontWeight:500,
                        }}>Edit</button>
                        <button onClick={() => handleDelete(p._id, p.title)} style={{
                          background:'#fff0f0', border:'1px solid #ffcccc', color:'#c0392b',
                          borderRadius:5, padding:'0.35rem 0.8rem', cursor:'pointer',
                          fontSize:'0.8rem', fontWeight:500,
                        }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Aesthetic Modal ───────────────────────────────────────────────────── */}
      {showModal && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(26,16,6,0.55)',
          display:'flex', alignItems:'center', justifyContent:'center',
          zIndex:1000, padding:'1rem',
        }}>
          <div style={{
            background:'#fff', borderRadius:12,
            width:'100%', maxWidth:700, maxHeight:'92vh',
            overflowY:'auto', boxShadow:'0 24px 48px rgba(0,0,0,0.18)',
          }}>

            {/* Modal header */}
            <div style={{
              display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'1.5rem 2rem', borderBottom:'1px solid #f0ebe3',
              position:'sticky', top:0, background:'#fff', zIndex:10,
            }}>
              <div>
                <h3 style={{ margin:0, fontWeight:700, fontSize:'1.2rem' }}>
                  {editingId ? 'Edit Product' : 'Add New Product'}
                </h3>
                <p style={{ margin:'2px 0 0', fontSize:'0.82rem', color:'#888' }}>
                  {editingId ? 'Update product details' : 'Fill in the details for the new product'}
                </p>
              </div>
              <button onClick={closeModal} style={{
                background:'#f5f5f5', border:'none', borderRadius:'50%',
                width:36, height:36, cursor:'pointer', fontSize:'1.1rem',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>✕</button>
            </div>

            <div style={{ padding:'2rem' }}>

              {/* Error banner */}
              {formError && (
                <div style={{
                  background:'#fff0f0', border:'1px solid #ffcccc', color:'#c0392b',
                  padding:'0.75rem 1rem', borderRadius:8, marginBottom:'1.5rem',
                  fontSize:'0.88rem', display:'flex', alignItems:'center', gap:8,
                }}>
                  ⚠ {formError}
                </div>
              )}

              {/* Main Image */}
              <div style={{ marginBottom:'1.5rem' }}>
                <label style={{ display:'block', fontSize:'0.75rem', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:'#888', marginBottom:'0.6rem' }}>
                  Product Image (Main) *
                </label>
                {form.image ? (
                  <div style={{ position:'relative', marginBottom:'0.75rem' }}>
                    <img src={form.image} alt="Preview" style={{
                      width:'100%', height:200, objectFit:'contain',
                      borderRadius:8, border:'2px solid #f0ebe3', background:'#faf7f2',
                    }} />
                    <button onClick={() => setForm(prev => ({ ...prev, image: '' }))} style={{
                      position:'absolute', top:8, right:8,
                      background:'rgba(0,0,0,0.6)', color:'#fff', border:'none',
                      borderRadius:'50%', width:28, height:28, cursor:'pointer', fontSize:'0.8rem',
                    }}>✕</button>
                  </div>
                ) : (
                  <div style={{
                    border:'2px dashed #e0d5c5', borderRadius:8, padding:'2rem',
                    textAlign:'center', background:'#faf7f2', marginBottom:'0.75rem',
                  }}>
                    <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>📷</div>
                    <p style={{ margin:0, color:'#aaa', fontSize:'0.85rem' }}>No image uploaded yet</p>
                  </div>
                )}
                <label style={{
                  display:'inline-flex', alignItems:'center', gap:8,
                  background:'var(--surface-container-low, #faf7f2)',
                  border:'1px solid #ddd', borderRadius:6,
                  padding:'0.5rem 1rem', cursor:'pointer', fontSize:'0.85rem', fontWeight:500,
                }}>
                  {imageUploading ? '⏳ Uploading…' : '📁 Choose Image'}
                  <input type="file" accept="image/*" onChange={handleImageUpload}
                    disabled={imageUploading} style={{ display:'none' }} />
                </label>
              </div>

              {/* Gallery Images */}
              <div style={{ marginBottom:'1.5rem' }}>
                <label style={{ display:'block', fontSize:'0.75rem', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:'#888', marginBottom:'0.6rem' }}>
                  Gallery Images <span style={{ fontWeight:400, textTransform:'none' }}>(optional · swipe on product page)</span>
                </label>
                {form.gallery?.length > 0 && (
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:'0.75rem' }}>
                    {form.gallery.map((url, i) => (
                      <div key={i} style={{ position:'relative' }}>
                        <img src={url} alt="" style={{ width:64, height:64, objectFit:'cover', borderRadius:6, border:'1px solid #eee' }} />
                        <button onClick={() => setForm(prev => ({ ...prev, gallery: prev.gallery.filter((_, gi) => gi !== i) }))}
                          style={{ position:'absolute', top:-6, right:-6, background:'#c0392b', color:'#fff', border:'none', borderRadius:'50%', width:20, height:20, cursor:'pointer', fontSize:'0.7rem', lineHeight:'20px', textAlign:'center' }}>
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <label style={{
                  display:'inline-flex', alignItems:'center', gap:8,
                  background:'var(--surface-container-low, #faf7f2)',
                  border:'1px solid #ddd', borderRadius:6,
                  padding:'0.5rem 1rem', cursor:'pointer', fontSize:'0.85rem', fontWeight:500,
                }}>
                  {galleryUploading ? '⏳ Uploading…' : '🖼 Choose Files'}
                  <input type="file" accept="image/*" multiple onChange={handleGalleryUpload}
                    disabled={galleryUploading} style={{ display:'none' }} />
                </label>
                <p style={{ margin:'0.4rem 0 0', fontSize:'0.78rem', color:'#aaa' }}>Select multiple files at once</p>
              </div>

              {/* Divider */}
              <hr style={{ border:'none', borderTop:'1px solid #f0ebe3', margin:'0 0 1.5rem' }} />

              {/* Name + Material */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.25rem' }}>
                <div>
                  <label style={labelStyle}>Product Name *</label>
                  <input name="title" value={form.title} onChange={handleChange}
                    placeholder="e.g. Gold Bangle Set" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Material *</label>
                  <input name="material" value={form.material} onChange={handleChange}
                    placeholder="e.g. Yellow Gold" style={inputStyle} />
                </div>
              </div>

              {/* Category + Price */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.25rem' }}>
                <div>
                  <label style={labelStyle}>Category *</label>
                  <select name="category" value={form.category} onChange={handleChange} style={inputStyle}>
                    <option value="">Select category</option>
                    {categories.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Price (₹) *</label>
                  <input name="price" type="number" value={form.price} onChange={handleChange}
                    placeholder="e.g. 4200" min="0" style={inputStyle} />
                </div>
              </div>

              {/* Stock + Featured */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.25rem' }}>
                <div>
  <label style={labelStyle}>Stock Status</label>
  <select name="stockStatus" value={form.stockStatus} onChange={handleChange} style={inputStyle}>
    <option value="in_stock">In Stock</option>
    <option value="low_stock">Low Stock</option>
    <option value="out_of_stock">Out of Stock</option>
  </select>
</div>
                <div style={{ display:'flex', alignItems:'center', paddingTop:'1.6rem' }}>
                  <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', userSelect:'none' }}>
                    <div style={{ position:'relative' }}>
                      <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleChange}
                        style={{ position:'absolute', opacity:0, width:0, height:0 }} />
                      <div style={{
                        width:44, height:24, borderRadius:12, transition:'background 0.2s',
                        background: form.isFeatured ? '#735c00' : '#ddd',
                        position:'relative',
                      }}>
                        <div style={{
                          position:'absolute', top:2, left: form.isFeatured ? 22 : 2,
                          width:20, height:20, borderRadius:'50%', background:'#fff',
                          transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)',
                        }} />
                      </div>
                    </div>
                    <div>
                      <div style={{ fontWeight:600, fontSize:'0.9rem' }}>Feature on homepage</div>
                      <div style={{ fontSize:'0.77rem', color:'#aaa' }}>Shows in Curated Pieces</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom:'1.5rem' }}>
                <label style={labelStyle}>Description *</label>
                <textarea name="description" value={form.description} onChange={handleChange}
                  placeholder="Describe the product in detail…" rows={4}
                  style={{ ...inputStyle, resize:'vertical', lineHeight:1.6 }} />
              </div>

              {/* Actions */}
              <div style={{
                display:'flex', justifyContent:'flex-end', gap:'0.75rem',
                paddingTop:'1.25rem', borderTop:'1px solid #f0ebe3',
              }}>
                <button onClick={closeModal} disabled={saving} style={{
                  background:'#f5f5f5', border:'1px solid #ddd', borderRadius:8,
                  padding:'0.7rem 1.8rem', cursor:'pointer',
                  fontFamily:'inherit', fontSize:'0.9rem', fontWeight:500,
                }}>
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving || imageUploading} style={{
                  background: saving ? '#ccc' : '#735c00',
                  color:'#fff', border:'none', borderRadius:8,
                  padding:'0.7rem 2rem', cursor: saving ? 'not-allowed' : 'pointer',
                  fontFamily:'inherit', fontSize:'0.9rem', fontWeight:600,
                  transition:'background 0.2s',
                }}>
                  {saving ? 'Saving…' : editingId ? 'Update Product' : 'Save Product'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Shared input styles ─────────────────────────────────────────────────────
const labelStyle = {
  display:'block', fontSize:'0.75rem', fontWeight:700,
  letterSpacing:'0.06em', textTransform:'uppercase',
  color:'#888', marginBottom:'0.5rem',
};

const inputStyle = {
  width:'100%', padding:'0.65rem 0.85rem',
  border:'1px solid #e0d5c5', borderRadius:6,
  fontFamily:'inherit', fontSize:'0.9rem',
  background:'#faf7f2', outline:'none',
  boxSizing:'border-box',
};

export default AdminProducts;