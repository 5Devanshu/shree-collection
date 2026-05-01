import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchProducts,
  fetchCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
} from '../api/client';

// ── Empty form template ───────────────────────────────────────────────────────
const EMPTY_FORM = {
  title:       '',
  material:    '',
  category:    '',
  price:       '',
  stock:       '',
  description: '',
  isFeatured:  false,
  image:       '',           // Cloudinary URL after upload
  gallery:     [],           // Array of Cloudinary URLs
  specifications: [],        // ← MUST be [] not undefined
};

const AdminProducts = () => {
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  // Modal state
  const [showModal,    setShowModal]    = useState(false);
  const [editingId,    setEditingId]    = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [formError,    setFormError]    = useState('');
  const [saving,       setSaving]       = useState(false);

  // Upload state
  const [imageUploading,   setImageUploading]   = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);

  // ── Load products & categories ──────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetchProducts({ limit: 100 }),
        fetchCategories(),
      ]);
      const prods = prodRes.data?.products || prodRes.data?.data || [];
      const cats  = catRes.data?.data      || catRes.data?.categories || catRes.data || [];
      setProducts(Array.isArray(prods) ? prods : []);
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (err) {
      setError('Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Open modal ──────────────────────────────────────────────────────────────
  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (product) => {
    setForm({
      title:          product.title       || '',
      material:       product.material    || '',
      category:       product.category?._id || product.category || '',
      price:          product.price       ?? '',
      stock:          product.stock       ?? '',
      description:    product.description || '',
      isFeatured:     product.isFeatured  || false,
      image:          product.image?.url  || product.image || '',
      gallery:        Array.isArray(product.gallery) ? product.gallery : [],
      specifications: Array.isArray(product.specifications) ? product.specifications : [],
    });
    setEditingId(product._id);
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
  };

  // ── Form field change ───────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setFormError('');
  };

  // ── Main image upload ───────────────────────────────────────────────────────
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    setFormError('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('folder', 'product');
      const res   = await uploadImage(formData);
      const media = res.data?.media;
      const url   = media?.secureUrl || media?.url || '';
      setForm(prev => ({ ...prev, image: url }));
    } catch (err) {
      setFormError('Image upload failed. Please try again.');
    } finally {
      setImageUploading(false);
    }
  };

  // ── Gallery upload ──────────────────────────────────────────────────────────
  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setGalleryUploading(true);
    setFormError('');
    try {
      const urls = await Promise.all(
        files.map(async (file) => {
          const formData = new FormData();
          formData.append('image', file);
          formData.append('folder', 'product');
          const res   = await uploadImage(formData);
          const media = res.data?.media;
          return media?.secureUrl || media?.url || '';
        })
      );
      setForm(prev => ({
        ...prev,
        gallery: [...(prev.gallery || []), ...urls.filter(Boolean)],
      }));
    } catch (err) {
      setFormError('Gallery upload failed. Please try again.');
    } finally {
      setGalleryUploading(false);
    }
  };

  // ── Specifications ──────────────────────────────────────────────────────────
  const addSpec = () => {
    setForm(prev => ({
      ...prev,
      specifications: [...(prev.specifications || []), { label: '', value: '' }],
    }));
  };

  const updateSpec = (index, field, val) => {
    setForm(prev => {
      const specs = [...(prev.specifications || [])];
      specs[index] = { ...specs[index], [field]: val };
      return { ...prev, specifications: specs };
    });
  };

  const removeSpec = (index) => {
    setForm(prev => ({
      ...prev,
      specifications: (prev.specifications || []).filter((_, i) => i !== index),
    }));
  };

  // ── Save product ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setFormError('');

    // Validate required fields
    if (!form.title.trim())    return setFormError('Product name is required.');
    if (!form.material.trim()) return setFormError('Material is required.');
    if (!form.category)        return setFormError('Please select a category.');
    if (!form.price)           return setFormError('Price is required.');
    if (!form.image)           return setFormError('Please upload a product image.');
    if (!form.description.trim()) return setFormError('Description is required.');

    setSaving(true);
    try {
      // ✅ specifications is always an array — .filter() is safe
      const payload = {
        title:          form.title.trim(),
        material:       form.material.trim(),
        category:       form.category,
        price:          Number(form.price),
        stock:          Number(form.stock) || 0,
        description:    form.description.trim(),
        isFeatured:     form.isFeatured,
        image:          form.image,
        gallery:        Array.isArray(form.gallery) ? form.gallery : [],
        specifications: (form.specifications || []).filter(s => s.label && s.value),
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

  // ── Delete product ──────────────────────────────────────────────────────────
  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deleteProduct(id);
      setProducts(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete product.');
    }
  };

  // ── Toggle featured ─────────────────────────────────────────────────────────
  const handleToggleFeatured = async (id, current) => {
    try {
      await updateProduct(id, { isFeatured: !current });
      setProducts(prev =>
        prev.map(p => p._id === id ? { ...p, isFeatured: !current } : p)
      );
    } catch (err) {
      alert('Failed to update featured status.');
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="admin-content">

      {/* Header */}
      <div className="admin-page-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'var(--spacing-6)' }}>
        <h2 className="headline-md">Products Management</h2>
        <button className="btn btn-primary" onClick={openAdd}
          style={{ padding:'var(--spacing-3) var(--spacing-6)', borderRadius:4 }}>
          + Add Product
        </button>
      </div>

      {error && (
        <p style={{ color:'#c0392b', padding:'var(--spacing-4)', background:'#fff0f0', borderRadius:4, marginBottom:'var(--spacing-4)' }}>
          {error}
        </p>
      )}

      {loading ? (
        <p className="body-md" style={{ color:'var(--on-surface-variant)' }}>Loading products…</p>
      ) : (
        <div className="recent-activity" style={{ overflowX:'auto' }}>
          <table className="admin-table" style={{ width:'100%' }}>
            <thead>
              <tr>
                <th className="label-md">Image</th>
                <th className="label-md">Product Name</th>
                <th className="label-md">Category</th>
                <th className="label-md">Price</th>
                <th className="label-md">Stock</th>
                <th className="label-md">Featured</th>
                <th className="label-md">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign:'center', padding:'var(--spacing-8)', color:'var(--on-surface-variant)' }}>
                    No products yet. Click "+ Add Product" to get started.
                  </td>
                </tr>
              ) : (
                products.map(product => (
                  <tr key={product._id}>
                    <td>
                      {product.image?.url || product.image ? (
                        <img
                          src={product.image?.url || product.image}
                          alt={product.title}
                          style={{ width:48, height:48, objectFit:'cover', borderRadius:4 }}
                        />
                      ) : (
                        <div style={{ width:48, height:48, background:'var(--surface-container-high)', borderRadius:4 }} />
                      )}
                    </td>
                    <td className="body-md">{product.title}</td>
                    <td className="body-md">{product.category?.name || '—'}</td>
                    <td className="body-md">₹{(product.price || 0).toLocaleString('en-IN')}</td>
                    <td>
                      <span className={`status-badge ${
                        product.stockStatus === 'in_stock'    ? 'status-delivered' :
                        product.stockStatus === 'low_stock'   ? 'status-shipped'   :
                        'status-pending'
                      }`}>
                        {product.stockStatus === 'in_stock'  ? 'In Stock'    :
                         product.stockStatus === 'low_stock' ? 'Low Stock'   : 'Out of Stock'}
                      </span>
                    </td>
                    <td style={{ textAlign:'center' }}>
                      <button
                        onClick={() => handleToggleFeatured(product._id, product.isFeatured)}
                        style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.2rem' }}
                        title={product.isFeatured ? 'Remove from featured' : 'Add to featured'}
                      >
                        {product.isFeatured ? '★' : '☆'}
                      </button>
                    </td>
                    <td style={{ display:'flex', gap:8 }}>
                      <button className="btn btn-tertiary" onClick={() => openEdit(product)}
                        style={{ fontSize:'0.8rem' }}>Edit</button>
                      <button className="btn btn-tertiary" onClick={() => handleDelete(product._id, product.title)}
                        style={{ fontSize:'0.8rem', color:'#c0392b' }}>Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Add / Edit Modal ──────────────────────────────────────────────────── */}
      {showModal && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.55)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000,
        }}>
          <div style={{
            background:'var(--surface)', borderRadius:8, padding:'2rem',
            width:'90%', maxWidth:680, maxHeight:'90vh', overflowY:'auto',
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
              <h3 className="headline-sm">{editingId ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={closeModal} style={{ background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer' }}>✕</button>
            </div>

            {formError && (
              <div style={{ background:'#fff0f0', border:'1px solid #ffcccc', color:'#c0392b', padding:'0.75rem 1rem', borderRadius:4, marginBottom:'1.25rem', fontSize:'0.9rem' }}>
                {formError}
              </div>
            )}

            {/* Main Image */}
            <div style={{ marginBottom:'1.25rem' }}>
              <label className="label-md" style={{ display:'block', marginBottom:'0.5rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                Product Image (Main) *
              </label>
              {form.image && (
                <img src={form.image} alt="Preview" style={{ width:'100%', maxHeight:220, objectFit:'contain', marginBottom:'0.5rem', borderRadius:4 }} />
              )}
              <input type="file" accept="image/*" onChange={handleImageUpload} disabled={imageUploading} />
              {imageUploading && <p className="body-md" style={{ color:'var(--on-surface-variant)', marginTop:4 }}>Uploading…</p>}
            </div>

            {/* Gallery Images */}
            <div style={{ marginBottom:'1.25rem' }}>
              <label className="label-md" style={{ display:'block', marginBottom:'0.5rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                Gallery Images (swipe on product page)
              </label>
              <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} disabled={galleryUploading} />
              {galleryUploading && <p className="body-md" style={{ color:'var(--on-surface-variant)', marginTop:4 }}>Uploading gallery…</p>}
              {form.gallery?.length > 0 && (
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:8 }}>
                  {form.gallery.map((url, i) => (
                    <div key={i} style={{ position:'relative' }}>
                      <img src={url} alt="" style={{ width:60, height:60, objectFit:'cover', borderRadius:4 }} />
                      <button
                        onClick={() => setForm(prev => ({ ...prev, gallery: prev.gallery.filter((_, gi) => gi !== i) }))}
                        style={{ position:'absolute', top:-6, right:-6, background:'#c0392b', color:'#fff', border:'none', borderRadius:'50%', width:18, height:18, cursor:'pointer', fontSize:'0.7rem', lineHeight:'18px', textAlign:'center' }}
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
              <p className="label-sm" style={{ color:'var(--on-surface-variant)', marginTop:4 }}>Select multiple files at once for a swipeable gallery</p>
            </div>

            {/* Name + Material */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.25rem' }}>
              <div>
                <label className="label-md" style={{ display:'block', marginBottom:'0.4rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>Product Name *</label>
                <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Gold Bangle Set"
                  className="checkout-input" style={{ width:'100%' }} />
              </div>
              <div>
                <label className="label-md" style={{ display:'block', marginBottom:'0.4rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>Material *</label>
                <input name="material" value={form.material} onChange={handleChange} placeholder="e.g. Yellow Gold"
                  className="checkout-input" style={{ width:'100%' }} />
              </div>
            </div>

            {/* Category + Price */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.25rem' }}>
              <div>
                <label className="label-md" style={{ display:'block', marginBottom:'0.4rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>Category *</label>
                <select name="category" value={form.category} onChange={handleChange}
                  className="checkout-input" style={{ width:'100%' }}>
                  <option value="">Select category</option>
                  {categories.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-md" style={{ display:'block', marginBottom:'0.4rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>Price (₹) *</label>
                <input name="price" type="number" value={form.price} onChange={handleChange} placeholder="e.g. 4200" min="0"
                  className="checkout-input" style={{ width:'100%' }} />
              </div>
            </div>

            {/* Stock + Featured */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.25rem' }}>
              <div>
                <label className="label-md" style={{ display:'block', marginBottom:'0.4rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>Stock Quantity</label>
                <input name="stock" type="number" value={form.stock} onChange={handleChange} placeholder="e.g. 10" min="0"
                  className="checkout-input" style={{ width:'100%' }} />
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, paddingTop:'1.5rem' }}>
                <input type="checkbox" name="isFeatured" id="isFeatured" checked={form.isFeatured} onChange={handleChange} />
                <label htmlFor="isFeatured" className="body-md">Feature on homepage</label>
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom:'1.25rem' }}>
              <label className="label-md" style={{ display:'block', marginBottom:'0.4rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>Description *</label>
              <textarea name="description" value={form.description} onChange={handleChange}
                placeholder="Describe the product…" rows={4}
                className="checkout-input" style={{ width:'100%', resize:'vertical' }} />
            </div>

            {/* Specifications */}
            <div style={{ marginBottom:'1.5rem' }}>
              <label className="label-md" style={{ display:'block', marginBottom:'0.5rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>Product Specifications</label>
              {(form.specifications || []).map((spec, i) => (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:8, marginBottom:8 }}>
                  <input value={spec.label} onChange={e => updateSpec(i, 'label', e.target.value)}
                    placeholder="Label (e.g. Metal)" className="checkout-input" />
                  <input value={spec.value} onChange={e => updateSpec(i, 'value', e.target.value)}
                    placeholder="Value (e.g. Platinum)" className="checkout-input" />
                  <button onClick={() => removeSpec(i)}
                    style={{ background:'none', border:'1px solid #ddd', borderRadius:4, cursor:'pointer', padding:'0 0.5rem', color:'#c0392b' }}>✕</button>
                </div>
              ))}
              <button onClick={addSpec}
                style={{ background:'none', border:'1px dashed var(--on-surface-variant)', borderRadius:4, padding:'0.4rem 1rem', cursor:'pointer', fontSize:'0.85rem', color:'var(--on-surface-variant)' }}>
                + Add Specification
              </button>
            </div>

            {/* Actions */}
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'1rem', paddingTop:'1rem', borderTop:'1px solid var(--surface-container-highest)' }}>
              <button className="btn btn-secondary" onClick={closeModal} disabled={saving}
                style={{ padding:'0.75rem 2rem' }}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || imageUploading}
                style={{ padding:'0.75rem 2.5rem' }}>
                {saving ? 'Saving…' : editingId ? 'Update Product' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;