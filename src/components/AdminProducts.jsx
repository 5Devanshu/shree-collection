import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchProducts, fetchCategories, createProduct,
  updateProduct, deleteProduct, uploadImage,
} from '../api/client';

const EMPTY_FORM = {
  title: '', material: '', category: '', price: '', resellerPrice: '', stock: '10',
  description: '', isFeatured: false, image: '', gallery: [],
  colour: '', plating: '', stoneType: '', sku: '',
  // ── Sizing ──
  sizeEnabled: false,
  sizeLabel: '',
  sizeStock: [],       // [{ size, stock, price, resellerPrice }] — admin adds these one at a time
  newSizeValue: '',    // controlled input for the "Add Size" box
};

const labelStyle = {
  display: 'block', fontSize: '0.75rem', fontWeight: 700,
  letterSpacing: '0.06em', textTransform: 'uppercase',
  color: '#888', marginBottom: '0.5rem',
};
const inputStyle = {
  width: '100%', padding: '0.65rem 0.85rem',
  border: '1px solid #e0d5c5', borderRadius: 6,
  fontFamily: 'inherit', fontSize: '0.9rem',
  background: '#faf7f2', outline: 'none', boxSizing: 'border-box',
};

const generateSku = (categoryName, existingProducts) => {
  const prefix = (categoryName || 'PROD')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8);
  const existing = existingProducts.filter(p => p.sku?.startsWith(prefix + '-'));
  const nextNum  = (existing.length + 1).toString().padStart(3, '0');
  return `${prefix}-${nextNum}`;
};

const AdminProducts = () => {
  const [products,         setProducts]         = useState([]);
  const [categories,       setCategories]       = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState('');
  const [showModal,        setShowModal]        = useState(false);
  const [editingId,        setEditingId]        = useState(null);
  const [form,             setForm]             = useState(EMPTY_FORM);
  const [formError,        setFormError]        = useState('');
  const [saving,           setSaving]           = useState(false);
  const [imageUploading,   setImageUploading]   = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);

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

  const openAdd = () => {
    setForm(EMPTY_FORM); setEditingId(null);
    setImagePreview('');
    setFormError(''); setShowModal(true);
  };

  const openEdit = (p) => {
    setForm({
      title:         p.title        || '',
      material:      p.material     || '',
      category:      p.categoryId   || p.category?.id || p.category || '',
      price:         p.price        ?? '',
      resellerPrice: p.resellerPrice ?? '',
      stock:         p.stock        ?? 10,
      description:   p.description  || '',
      isFeatured:    p.isFeatured   || false,
      image:         p.imageUrl     || p.image?.url || p.image || '',
      gallery:       Array.isArray(p.gallery) ? p.gallery : [],
      colour:        p.colour    || '',
      plating:       p.plating   || '',
      stoneType:     p.stoneType || '',
      sku:           p.sku       || '',
      // ── Sizing ──
      sizeEnabled:   p.sizeEnabled || false,
      sizeLabel:     p.sizeLabel   || '',
      sizeStock:     Array.isArray(p.sizeStock) && p.sizeStock.length > 0
        ? p.sizeStock.map(s => ({
            size:          Number(s.size),
            stock:         Number(s.stock) || 0,
            // 0 here means "no override — falls back to the base price"
            price:         Number(s.price) || 0,
            resellerPrice: Number(s.resellerPrice) || 0,
          }))
        : Array.isArray(p.sizes)
          ? p.sizes.map(s => ({ size: Number(s), stock: 0, price: 0, resellerPrice: 0 })) // legacy products with sizes but no stock yet
          : [],
      newSizeValue: '',
    });
    setEditingId(p.id);
    setImagePreview(p.imageUrl || p.image?.url || p.image || '');
    setFormError(''); setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false); setEditingId(null);
    setForm(EMPTY_FORM); setFormError('');
    setImagePreview('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: type === 'checkbox' ? checked : value };
      if (name === 'category' && value && !prev.sku) {
        const cat = categories.find(c => c.id === value);
        updated.sku = generateSku(cat?.name, products);
      }
      return updated;
    });
    setFormError('');
  };

  // Toggling sizing on auto-suggests a label from the selected category,
  // e.g. "Necklace" → "Necklace Size". Admin can still edit it freely.
  const handleToggleSizeEnabled = () => {
    setForm(prev => {
      const next = !prev.sizeEnabled;
      let label = prev.sizeLabel;
      if (next && !label) {
        const cat = categories.find(c => c.id === prev.category);
        label = cat ? `${cat.name.replace(/s$/i, '')} Size` : 'Size';
      }
      return { ...prev, sizeEnabled: next, sizeLabel: label };
    });
  };

  // ── Add a single size chip ──────────────────────────────────────────────
  // Admin types a number (integer or decimal, e.g. 2.4, 2.6, 7, 8.5) and
  // clicks Add (or hits Enter). Duplicate sizes are rejected. New sizes start
  // with price/resellerPrice at 0, meaning "use the base product price".
  //
  // IMPORTANT: validation is done OUTSIDE setForm so that setFormError and
  // setForm don't race each other — calling setFormError inside a setForm
  // functional updater caused the second size-add to silently stall.
  const handleAddSize = () => {
    const raw = form.newSizeValue.trim();
    if (raw === '') return;

    const value = Number(raw);
    if (!Number.isFinite(value)) {
      setFormError('Size must be a number (e.g. 2.4, 2.6, 7).');
      return;
    }
    if (form.sizeStock.some(s => s.size === value)) {
      setFormError(`Size ${value} has already been added.`);
      return;
    }

    setFormError('');
    const next = [...form.sizeStock, { size: value, stock: 0, price: 0, resellerPrice: 0 }]
      .sort((a, b) => a.size - b.size);
    setForm(prev => ({ ...prev, sizeStock: next, newSizeValue: '' }));
  };

  const handleNewSizeKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSize();
    }
  };

  const handleRemoveSize = (size) => {
    setForm(prev => ({
      ...prev,
      sizeStock: prev.sizeStock.filter(s => s.size !== size),
    }));
  };

  // Generic updater for any field on a size chip — stock, price, resellerPrice.
  const handleSizeFieldChange = (size, field, value) => {
    const val = Number(value) || 0;
    setForm(prev => ({
      ...prev,
      sizeStock: prev.sizeStock.map(s => s.size === size ? { ...s, [field]: val } : s),
    }));
  };

  // ── Live preview: what will a customer / reseller actually pay for this
  // size, given what's typed into the form right now? Mirrors the backend's
  // resolveSizePrice() fallback chain exactly (minus category discounts,
  // which aren't set from this form) so admins never have to guess which
  // field "wins" — they see the resolved number update as they type.
  const resolveSizeDisplay = (entry) => {
    const basePrice     = Number(form.price) || 0;
    const baseReseller  = Number(form.resellerPrice) || 0;
    const sizePrice     = Number(entry.price) || 0;
    const sizeReseller  = Number(entry.resellerPrice) || 0;

    const customerPays = sizePrice > 0 ? sizePrice : basePrice;
    const resellerPays = sizeReseller > 0
      ? sizeReseller
      : (baseReseller > 0 ? baseReseller : customerPays);

    return { customerPays, resellerPays };
  };

  // ── Image state holds BOTH a blob URL (for immediate local preview) and
  // the backend-stored URL (for saving). We split these so the <img> tag
  // never tries to load through the S3 presigned redirect proxy — which
  // fails in the browser due to expired/CORS presigned URL — and instead
  // always shows a local blob URL the moment the file is picked.
  const [imagePreview, setImagePreview] = useState(''); // blob URL — preview only

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show a local blob URL immediately — no network needed, no proxy issues
    const localPreview = URL.createObjectURL(file);
    setImagePreview(localPreview);

    setImageUploading(true); setFormError('');
    try {
      const fd = new FormData();
      fd.append('image', file); fd.append('folder', 'product');
      const res = await uploadImage(fd);
      const url = res.data?.media?.secureUrl || res.data?.media?.url || '';
      // Store the backend URL for saving; preview stays as blob URL
      setForm(prev => ({ ...prev, image: url }));
    } catch {
      // Upload failed — clear preview and stored URL both
      URL.revokeObjectURL(localPreview);
      setImagePreview('');
      setForm(prev => ({ ...prev, image: '' }));
      setFormError('Image upload failed. Please try again.');
    } finally { setImageUploading(false); }
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setGalleryUploading(true);
    try {
      const urls = await Promise.all(files.map(async file => {
        const fd = new FormData();
        fd.append('image', file); fd.append('folder', 'product');
        const res = await uploadImage(fd);
        return res.data?.media?.secureUrl || res.data?.media?.url || '';
      }));
      setForm(prev => ({ ...prev, gallery: [...(prev.gallery || []), ...urls.filter(Boolean)] }));
    } catch {
      setFormError('Gallery upload failed.');
    } finally { setGalleryUploading(false); }
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.title.trim()) return setFormError('Product name is required.');
    if (!form.category)     return setFormError('Please select a category.');
    if (!form.price)        return setFormError('Price is required.');
    if (!form.image)        return setFormError('Please upload a product image.');
    if (form.sizeEnabled && form.sizeStock.length === 0) {
      return setFormError('Please add at least one size, or turn off sizing.');
    }

    setSaving(true);
    try {
      const payload = {
        title:         form.title.trim(),
        material:      form.material.trim(),
        category:      form.category,
        price:         Number(form.price),
        resellerPrice: Number(form.resellerPrice) || 0,
        image:         { url: form.image },
        description:   form.description.trim(),
        isFeatured:    form.isFeatured,
        gallery:       Array.isArray(form.gallery) ? form.gallery : [],
        stock:         Number(form.stock) || 0,
        colour:        form.colour.trim(),
        plating:       form.plating.trim(),
        stoneType:     form.stoneType.trim(),
        sku:           form.sku.trim(),
        // ── Sizing — backend derives the flat `sizes` array from sizeStock.
        // Each entry carries { size, stock, price, resellerPrice }; price/
        // resellerPrice of 0 tells the backend "use the base product rate
        // for this size" (see product.service.js normalizeSizeStock).
        sizeEnabled:   form.sizeEnabled,
        sizeLabel:     form.sizeLabel.trim(),
        sizeStock:     form.sizeEnabled ? form.sizeStock : [],
      };
      if (editingId) { await updateProduct(editingId, payload); }
      else           { await createProduct(payload); }
      await loadData();
      closeModal();
    } catch (err) {
      setFormError(err?.response?.data?.message || err?.message || 'Failed to save product.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert(err?.response?.data?.message || 'Delete failed.');
    }
  };

  const handleToggleFeatured = async (id, current) => {
    try {
      await updateProduct(id, { isFeatured: !current });
      setProducts(prev => prev.map(p => p.id === id ? { ...p, isFeatured: !current } : p));
    } catch { alert('Failed to update featured status.'); }
  };

  const stockBadge = (s) => ({
    in_stock:     { text: 'In Stock',     cls: 'status-delivered' },
    low_stock:    { text: 'Low Stock',    cls: 'status-shipped'   },
    out_of_stock: { text: 'Out of Stock', cls: 'status-pending'   },
  }[s] || { text: 'In Stock', cls: 'status-delivered' });

  return (
    <div className="admin-content">

      {/* ── Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'2rem' }}>
        <div>
          <h2 className="headline-md">Products</h2>
          <p className="body-md" style={{ color:'var(--on-surface-variant)', marginTop:4 }}>
            {products.length} product{products.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={openAdd} style={{
          background:'#735c00', color:'#fff', border:'none', borderRadius:6,
          padding:'0.65rem 1.4rem', fontFamily:'inherit', fontSize:'0.9rem',
          fontWeight:600, cursor:'pointer',
        }}>+ Add Product</button>
      </div>

      {error && (
        <div style={{ background:'#fff0f0', border:'1px solid #ffcccc', color:'#c0392b', padding:'0.75rem 1rem', borderRadius:6, marginBottom:'1.5rem' }}>
          {error}
        </div>
      )}

      {/* ── Table ── */}
      {loading ? (
        <p className="body-md" style={{ color:'var(--on-surface-variant)' }}>Loading products…</p>
      ) : (
        <div style={{ background:'#fff', borderRadius:8, border:'1px solid #e8e0d5', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#faf7f2', borderBottom:'1px solid #e8e0d5' }}>
                {['Image','Product Name','Category','Price','Stock','Sizes','Featured','Actions'].map(h => (
                  <th key={h} style={{ padding:'0.85rem 1rem', textAlign:'left', fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.06em', color:'#888', textTransform:'uppercase' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={8} style={{ padding:'3rem', textAlign:'center', color:'#aaa' }}>
                  No products yet. Click "+ Add Product" to get started.
                </td></tr>
              ) : products.map((p, i) => {
                const badge  = stockBadge(p.stockStatus);
                const imgSrc = p.imageUrl || p.image?.url || p.image || '';
                return (
                  <tr key={p.id} style={{ borderBottom:'1px solid #f0ebe3', background: i % 2 === 0 ? '#fff' : '#fdfaf6' }}>
                    <td style={{ padding:'0.75rem 1rem' }}>
                      {imgSrc ? (
                        <img src={imgSrc} alt={p.title} style={{ width:48, height:48, objectFit:'cover', borderRadius:6, border:'1px solid #eee' }} />
                      ) : (
                        <div style={{ width:48, height:48, background:'#f0ebe3', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', color:'#ccc', fontSize:'1.2rem' }}>🖼</div>
                      )}
                    </td>
                    <td style={{ padding:'0.75rem 1rem' }}>
                      <div style={{ fontWeight:500, fontSize:'0.9rem' }}>{p.title}</div>
                      <div style={{ fontSize:'0.78rem', color:'#aaa', marginTop:2 }}>{p.material}</div>
                      {p.sku && <div style={{ fontSize:'0.72rem', color:'#bbb', marginTop:1 }}>SKU: {p.sku}</div>}
                    </td>
                    <td style={{ padding:'0.75rem 1rem', fontSize:'0.88rem', color:'#666' }}>
                      {p.category?.name || p.categorySlug || '—'}
                    </td>

                    {/* ── Price column — shows both prices ── */}
                    <td style={{ padding:'0.75rem 1rem' }}>
                      <div style={{ fontWeight:600, fontSize:'0.9rem' }}>
                        ₹{(Number(p.price) || 0).toLocaleString('en-IN')}
                      </div>
                      {Number(p.resellerPrice) > 0 && (
                        <div style={{ fontSize:'0.72rem', color:'#2e7d32', marginTop:2 }}>
                          Reseller: ₹{Number(p.resellerPrice).toLocaleString('en-IN')}
                        </div>
                      )}
                    </td>

                    <td style={{ padding:'0.75rem 1rem' }}>
                      <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                        <span className={`status-badge ${badge.cls}`} style={{ fontSize:'0.73rem' }}>{badge.text}</span>
                        <span style={{ fontSize:'0.75rem', color:'#aaa' }}>Qty: {p.stock ?? '—'}</span>
                      </div>
                    </td>

                    {/* ── Sizes column — shows per-size rate overrides at a glance ── */}
                    <td style={{ padding:'0.75rem 1rem', fontSize:'0.8rem', color:'#666' }}>
                      {p.sizeEnabled && Array.isArray(p.sizes) && p.sizes.length > 0 ? (
                        <div>
                          <div style={{ fontWeight:600, color:'#735c00' }}>{p.sizeLabel || 'Size'}</div>
                          <div style={{ color:'#aaa', marginTop:2 }}>
                            {p.sizes.join(', ')}
                          </div>
                          {Array.isArray(p.sizeStock) && p.sizeStock.some(s => Number(s.price) > 0) && (
                            <div style={{ color:'#b39d00', marginTop:2, fontSize:'0.72rem' }}>
                              Size-wise rates set
                            </div>
                          )}
                        </div>
                      ) : '—'}
                    </td>

                    <td style={{ padding:'0.75rem 1rem', textAlign:'center' }}>
                      <button onClick={() => handleToggleFeatured(p.id, p.isFeatured)}
                        style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.3rem', color: p.isFeatured ? '#b39d00' : '#ccc' }}
                        title={p.isFeatured ? 'Remove from featured' : 'Add to featured'}>★</button>
                    </td>
                    <td style={{ padding:'0.75rem 1rem' }}>
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={() => openEdit(p)} style={{ background:'#faf7f2', border:'1px solid #ddd', borderRadius:5, padding:'0.35rem 0.8rem', cursor:'pointer', fontSize:'0.8rem', fontWeight:500 }}>Edit</button>
                        <button onClick={() => handleDelete(p.id, p.title)} style={{ background:'#fff0f0', border:'1px solid #ffcccc', color:'#c0392b', borderRadius:5, padding:'0.35rem 0.8rem', cursor:'pointer', fontSize:'0.8rem', fontWeight:500 }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(26,16,6,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'1rem' }}>
          <div style={{ background:'#fff', borderRadius:12, width:'100%', maxWidth:700, maxHeight:'92vh', overflowY:'auto', boxShadow:'0 24px 48px rgba(0,0,0,0.18)' }}>

            {/* Modal Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'1.5rem 2rem', borderBottom:'1px solid #f0ebe3', position:'sticky', top:0, background:'#fff', zIndex:10 }}>
              <div>
                <h3 style={{ margin:0, fontWeight:700, fontSize:'1.2rem' }}>{editingId ? 'Edit Product' : 'Add New Product'}</h3>
                <p style={{ margin:'2px 0 0', fontSize:'0.82rem', color:'#888' }}>{editingId ? 'Update product details' : 'Fill in the details for the new product'}</p>
              </div>
              <button onClick={closeModal} style={{ background:'#f5f5f5', border:'none', borderRadius:'50%', width:36, height:36, cursor:'pointer', fontSize:'1.1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
            </div>

            <div style={{ padding:'2rem' }}>
              {formError && (
                <div style={{ background:'#fff0f0', border:'1px solid #ffcccc', color:'#c0392b', padding:'0.75rem 1rem', borderRadius:8, marginBottom:'1.5rem', fontSize:'0.88rem' }}>
                  ⚠ {formError}
                </div>
              )}

              {/* Main Image */}
              <div style={{ marginBottom:'1.5rem' }}>
                <label style={labelStyle}>Product Image (Main) *</label>
                {imagePreview ? (
                  <div style={{ position:'relative', marginBottom:'0.75rem' }}>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{ width:'100%', height:200, objectFit:'contain', borderRadius:8, border:'2px solid #f0ebe3', background:'#faf7f2' }}
                    />
                    <button
                      onClick={() => { setImagePreview(''); setForm(prev => ({ ...prev, image:'' })); }}
                      style={{ position:'absolute', top:8, right:8, background:'rgba(0,0,0,0.6)', color:'#fff', border:'none', borderRadius:'50%', width:28, height:28, cursor:'pointer', fontSize:'0.8rem' }}
                    >✕</button>
                  </div>
                ) : (
                  <div style={{ border:'2px dashed #e0d5c5', borderRadius:8, padding:'2rem', textAlign:'center', background:'#faf7f2', marginBottom:'0.75rem' }}>
                    <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>📷</div>
                    <p style={{ margin:0, color:'#aaa', fontSize:'0.85rem' }}>No image uploaded yet</p>
                  </div>
                )}
                <label style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#faf7f2', border:'1px solid #ddd', borderRadius:6, padding:'0.5rem 1rem', cursor:'pointer', fontSize:'0.85rem', fontWeight:500 }}>
                  {imageUploading ? '⏳ Uploading…' : imagePreview ? '📁 Change Image' : '📁 Choose Image'}
                  <input type="file" accept="image/*" onChange={handleImageUpload} disabled={imageUploading} style={{ display:'none' }} />
                </label>
              </div>

              {/* Gallery */}
              <div style={{ marginBottom:'1.5rem' }}>
                <label style={labelStyle}>Gallery Images <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0 }}>(optional)</span></label>
                {form.gallery?.length > 0 && (
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:'0.75rem' }}>
                    {form.gallery.map((url, i) => (
                      <div key={i} style={{ position:'relative' }}>
                        <img src={url} alt="" style={{ width:64, height:64, objectFit:'cover', borderRadius:6, border:'1px solid #eee' }} />
                        <button onClick={() => setForm(prev => ({ ...prev, gallery: prev.gallery.filter((_, gi) => gi !== i) }))}
                          style={{ position:'absolute', top:-6, right:-6, background:'#c0392b', color:'#fff', border:'none', borderRadius:'50%', width:20, height:20, cursor:'pointer', fontSize:'0.7rem' }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
                <label style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#faf7f2', border:'1px solid #ddd', borderRadius:6, padding:'0.5rem 1rem', cursor:'pointer', fontSize:'0.85rem', fontWeight:500 }}>
                  {galleryUploading ? '⏳ Uploading…' : '🖼 Choose Files'}
                  <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} disabled={galleryUploading} style={{ display:'none' }} />
                </label>
              </div>

              <hr style={{ border:'none', borderTop:'1px solid #f0ebe3', margin:'0 0 1.5rem' }} />

              {/* Name + Material */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.25rem' }}>
                <div>
                  <label style={labelStyle}>Product Name *</label>
                  <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Gold Bangle Set" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Material</label>
                  <input name="material" value={form.material} onChange={handleChange} placeholder="e.g. Yellow Gold" style={inputStyle} />
                </div>
              </div>

              {/* Category + Customer Price */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.25rem' }}>
                <div>
                  <label style={labelStyle}>Category *</label>
                  <select name="category" value={form.category} onChange={handleChange} style={inputStyle}>
                    <option value="">Select category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Customer Price (₹) *</label>
                  <input name="price" type="number" value={form.price} onChange={handleChange}
                    placeholder="e.g. 4200" min="0" style={inputStyle} />
                  <p style={{ margin:'4px 0 0', fontSize:'0.75rem', color: form.sizeEnabled ? '#b39d00' : '#aaa', fontWeight: form.sizeEnabled ? 600 : 400 }}>
                    {form.sizeEnabled
                      ? '⚠ Fallback only — any size with its own Rate below ignores this'
                      : ' '}
                  </p>
                </div>
              </div>

              {/* Reseller Price */}
              <div style={{ marginBottom:'1.25rem', padding:'1rem', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8 }}>
                <label style={{ ...labelStyle, color:'#166534' }}>
                  Reseller Price (₹){' '}
                  <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0 }}>(optional — leave 0 to show customer price)</span>
                </label>
                <input name="resellerPrice" type="number" value={form.resellerPrice} onChange={handleChange}
                  placeholder="e.g. 3500" min="0" style={{ ...inputStyle, maxWidth:320, background:'#fff' }} />
                <p style={{ margin:'6px 0 0', fontSize:'0.75rem', color:'#166534' }}>
                  Verified resellers will see this price instead of the customer price when logged in.
                  {form.sizeEnabled ? ' ⚠ Any size with its own Reseller Rate below ignores this.' : ''}
                </p>
              </div>

              {/* SKU + Stock */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.25rem' }}>
                <div>
                  <label style={labelStyle}>SKU <span style={{ fontWeight:400, textTransform:'none' }}>(optional)</span></label>
                  <input name="sku" value={form.sku} onChange={handleChange} placeholder="e.g. GN-001" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Stock Count</label>
                  <input name="stock" type="number" value={form.stock} onChange={handleChange} placeholder="e.g. 10" min="0" style={inputStyle} disabled={form.sizeEnabled} />
                  <p style={{ margin:'4px 0 0', fontSize:'0.75rem', color: form.sizeEnabled ? '#b39d00' : '#aaa', fontWeight: form.sizeEnabled ? 600 : 400 }}>
                    {form.sizeEnabled
                      ? '⚠ Ignored — total stock is the sum of every size\'s stock below'
                      : '0 = Out · 1–5 = Low · 6+ = In Stock'}
                  </p>
                </div>
              </div>

              {/* Colour + Plating */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.25rem' }}>
                <div>
                  <label style={labelStyle}>Colour <span style={{ fontWeight:400, textTransform:'none' }}>(optional)</span></label>
                  <input name="colour" value={form.colour} onChange={handleChange} placeholder="e.g. Rose Gold" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Plating <span style={{ fontWeight:400, textTransform:'none' }}>(optional)</span></label>
                  <input name="plating" value={form.plating} onChange={handleChange} placeholder="e.g. 22K Gold Plated" style={inputStyle} />
                </div>
              </div>

              {/* Stone Type + Featured */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.25rem' }}>
                <div>
                  <label style={labelStyle}>Stone Type <span style={{ fontWeight:400, textTransform:'none' }}>(optional)</span></label>
                  <input name="stoneType" value={form.stoneType} onChange={handleChange} placeholder="e.g. Diamond, Ruby" style={inputStyle} />
                </div>
                <div style={{ display:'flex', alignItems:'center', paddingTop:'1.6rem' }}>
                  <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', userSelect:'none' }}>
                    <div onClick={() => setForm(prev => ({ ...prev, isFeatured: !prev.isFeatured }))}
                      style={{ width:44, height:24, borderRadius:12, cursor:'pointer', background: form.isFeatured ? '#735c00' : '#ddd', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
                      <div style={{ position:'absolute', top:2, left: form.isFeatured ? 22 : 2, width:20, height:20, borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
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
                <label style={labelStyle}>Description</label>
                <textarea name="description" value={form.description} onChange={handleChange}
                  placeholder="Describe the product in detail…" rows={4}
                  style={{ ...inputStyle, resize:'vertical', lineHeight:1.6 }} />
              </div>

              {/* ── Sizes — admin adds each size individually, with its own stock + rate ── */}
              <div style={{ marginBottom:'1.5rem' }}>
                <label style={labelStyle}>Sizes</label>

                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom: form.sizeEnabled ? '1rem' : 0 }}>
                  <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', userSelect:'none' }}>
                    <div onClick={handleToggleSizeEnabled}
                      style={{ width:44, height:24, borderRadius:12, cursor:'pointer', background: form.sizeEnabled ? '#735c00' : '#ddd', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
                      <div style={{ position:'absolute', top:2, left: form.sizeEnabled ? 22 : 2, width:20, height:20, borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight:600, fontSize:'0.9rem' }}>This product has sizes</div>
                      <div style={{ fontSize:'0.77rem', color:'#aaa' }}>
                        {form.sizeEnabled ? 'Customers will choose a size before buying' : 'No size selector will be shown to customers'}
                      </div>
                    </div>
                  </label>
                </div>

                {form.sizeEnabled && (
                  <div style={{ padding:'1rem', background:'#faf7f2', border:'1px solid #e8e0d5', borderRadius:8 }}>

                    {/* Size label */}
                    <div style={{ marginBottom:'1rem' }}>
                      <label style={labelStyle}>Size Label</label>
                      <input
                        name="sizeLabel"
                        value={form.sizeLabel}
                        onChange={handleChange}
                        placeholder="e.g. Necklace Size, Bangle Size, Ring Size"
                        style={{ ...inputStyle, maxWidth: 320 }}
                      />
                      <p style={{ margin:'4px 0 0', fontSize:'0.75rem', color:'#aaa' }}>
                        Shown to customers above the size selector. Auto-filled from category, editable.
                      </p>
                    </div>

                    {/* Add Size control */}
                    <div style={{ marginBottom:'1rem' }}>
                      <label style={labelStyle}>Add Size</label>
                      <div style={{ display:'flex', gap:8 }}>
                        <input
                          type="number"
                          step="any"
                          inputMode="decimal"
                          value={form.newSizeValue}
                          onChange={e => { setForm(prev => ({ ...prev, newSizeValue: e.target.value })); setFormError(''); }}
                          onKeyDown={handleNewSizeKeyDown}
                          placeholder="e.g. 2.4 or 8"
                          style={{ ...inputStyle, maxWidth: 160 }}
                        />
                        <button
                          type="button"
                          onClick={handleAddSize}
                          style={{
                            background:'#735c00', color:'#fff', border:'none', borderRadius:6,
                            padding:'0 1.2rem', fontFamily:'inherit', fontSize:'0.85rem',
                            fontWeight:600, cursor:'pointer', whiteSpace:'nowrap',
                          }}
                        >+ Add Size</button>
                      </div>
                      <p style={{ margin:'6px 0 0', fontSize:'0.75rem', color:'#aaa' }}>
                        Enter any number — whole (7, 8) or decimal (2.4, 2.6, 2.8) — then click Add Size. Each size gets its own stock and rate below.
                      </p>
                    </div>

                    {/* Size chips with per-size stock + rate */}
                    {form.sizeStock.length === 0 ? (
                      <p style={{ margin:0, fontSize:'0.8rem', color:'#c0392b' }}>
                        No sizes added yet. Add at least one size above.
                      </p>
                    ) : (
                      <div>
                        <label style={labelStyle}>Sizes, Stock &amp; Rate</label>
                        <p style={{ margin:'0 0 0.75rem', fontSize:'0.75rem', color:'#aaa' }}>
                          Leave Rate / Reseller Rate at 0 to use the base price above. The "Customer pays / Reseller pays" line on each card shows exactly what will be charged.
                        </p>
                        <div style={{ marginBottom:'0.75rem', fontSize:'0.8rem', color:'#735c00', fontWeight:600 }}>
                          Total stock across all sizes: {form.sizeStock.reduce((sum, s) => sum + (Number(s.stock) || 0), 0)}
                          {' '}
                          <span style={{ fontWeight:400, color:'#aaa' }}>
                            (this — not the Stock Count field above — decides the In Stock / Low Stock / Out of Stock badge)
                          </span>
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(170px, 1fr))', gap:'0.75rem' }}>
                          {form.sizeStock.map((entry) => {
                            const { size, stock, price, resellerPrice } = entry;
                            const { customerPays, resellerPays } = resolveSizeDisplay(entry);
                            return (
                            <div key={size} style={{ position:'relative', background:'#fff', border:'1px solid #e0d5c5', borderRadius:8, padding:'0.6rem 0.7rem' }}>
                              <button
                                type="button"
                                onClick={() => handleRemoveSize(size)}
                                title="Remove size"
                                style={{
                                  position:'absolute', top:-8, right:-8, background:'#c0392b', color:'#fff',
                                  border:'none', borderRadius:'50%', width:20, height:20, cursor:'pointer', fontSize:'0.7rem',
                                  display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1,
                                }}
                              >✕</button>
                              <div style={{ fontWeight:700, fontSize:'0.95rem', marginBottom:6, color:'#735c00' }}>
                                {size}
                              </div>

                              <label style={{ ...labelStyle, fontSize:'0.65rem', marginBottom:3 }}>Stock</label>
                              <input
                                type="number" min="0"
                                value={stock}
                                onChange={e => handleSizeFieldChange(size, 'stock', e.target.value)}
                                style={{ ...inputStyle, padding:'0.45rem 0.55rem', fontSize:'0.85rem', marginBottom:8 }}
                              />

                              <label style={{ ...labelStyle, fontSize:'0.65rem', marginBottom:3 }}>Rate (₹)</label>
                              <input
                                type="number" min="0"
                                value={price || ''}
                                placeholder={form.price ? `${form.price} (base)` : '0'}
                                onChange={e => handleSizeFieldChange(size, 'price', e.target.value)}
                                style={{ ...inputStyle, padding:'0.45rem 0.55rem', fontSize:'0.85rem', marginBottom:8 }}
                              />

                              <label style={{ ...labelStyle, fontSize:'0.65rem', marginBottom:3, color:'#166534' }}>Reseller Rate (₹)</label>
                              <input
                                type="number" min="0"
                                value={resellerPrice || ''}
                                placeholder={form.resellerPrice ? `${form.resellerPrice} (base)` : '0'}
                                onChange={e => handleSizeFieldChange(size, 'resellerPrice', e.target.value)}
                                style={{ ...inputStyle, padding:'0.45rem 0.55rem', fontSize:'0.85rem', background:'#f0fdf4', borderColor:'#bbf7d0' }}
                              />

                              {/* ── Live resolved price — removes all ambiguity: this is
                                   exactly what the customer/reseller will be charged ── */}
                              <div style={{ marginTop:8, paddingTop:8, borderTop:'1px dashed #e8e0d5', fontSize:'0.72rem', lineHeight:1.6 }}>
                                <div style={{ color:'#333' }}>
                                  Customer pays <strong>₹{customerPays.toLocaleString('en-IN')}</strong>
                                </div>
                                <div style={{ color:'#2e7d32' }}>
                                  Reseller pays <strong>₹{resellerPays.toLocaleString('en-IN')}</strong>
                                </div>
                              </div>
                            </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.75rem', paddingTop:'1.25rem', borderTop:'1px solid #f0ebe3' }}>
                <button onClick={closeModal} disabled={saving} style={{ background:'#f5f5f5', border:'1px solid #ddd', borderRadius:8, padding:'0.7rem 1.8rem', cursor:'pointer', fontFamily:'inherit', fontSize:'0.9rem', fontWeight:500 }}>Cancel</button>
                <button onClick={handleSave} disabled={saving || imageUploading} style={{ background: saving ? '#ccc' : '#735c00', color:'#fff', border:'none', borderRadius:8, padding:'0.7rem 2rem', cursor: saving ? 'not-allowed' : 'pointer', fontFamily:'inherit', fontSize:'0.9rem', fontWeight:600 }}>
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

export default AdminProducts;