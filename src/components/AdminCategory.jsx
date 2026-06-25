import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
} from '../api/client';

const EMPTY_FORM = { name: '', description: '', isActive: true, image: '', imageKey: '' };

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

const AdminCategory = () => {
  const [categories, setCategories] = useState([]);   // ← always []
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  const [showModal,  setShowModal]  = useState(false);
  const [editingId,  setEditingId]  = useState(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [formError,  setFormError]  = useState('');
  const [saving,     setSaving]     = useState(false);

  // ── Image upload state ─────────────────────────────────────────────────────
  const [uploading,  setUploading]  = useState(false);
  const fileInputRef = useRef(null);

  // ── Fetch categories ────────────────────────────────────────────────────────
  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res  = await fetchCategories();
      // Backend returns { success, categories } — guard all shapes
      const data = res.data?.categories || res.data?.data || res.data || [];
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to load categories.');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  // ── Modal helpers ───────────────────────────────────────────────────────────
  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setForm({
      name:        cat.name        || '',
      description: cat.description || '',
      isActive:    cat.isActive    ?? true,
      image:       cat.image       || '',
      imageKey:    cat.imageKey    || '',
    });
    setEditingId(cat.id || cat._id);
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setUploading(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setFormError('');
  };

  // ── Image upload ────────────────────────────────────────────────────────────
  const handleImagePick = () => fileInputRef.current?.click();

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('folder', 'category');

      const res   = await uploadCategoryImage(formData);
      const media = res.data?.media;

      if (!media?.url) throw new Error('Upload did not return an image URL.');

      setForm(prev => ({ ...prev, image: media.url, imageKey: media.s3Key || '' }));
    } catch (err) {
      setFormError(err?.response?.data?.message || err?.message || 'Image upload failed.');
    } finally {
      setUploading(false);
      // allow re-selecting the same file again later
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setForm(prev => ({ ...prev, image: '', imageKey: '' }));
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setFormError('');
    if (!form.name.trim()) return setFormError('Category name is required.');

    setSaving(true);
    try {
      if (editingId) {
        await updateCategory(editingId, {
          name:        form.name.trim(),
          description: form.description.trim(),
          isActive:    form.isActive,
          image:       form.image,
          imageKey:    form.imageKey,
        });
      } else {
        await createCategory({
          name:        form.name.trim(),
          description: form.description.trim(),
          image:       form.image,
          imageKey:    form.imageKey,
        });
      }
      await loadCategories();
      closeModal();
    } catch (err) {
      setFormError(err?.response?.data?.message || err?.message || 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"? Products in this category will need to be reassigned.`)) return;
    try {
      await deleteCategory(id);
      setCategories(prev => prev.filter(c => (c.id || c._id) !== id));
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete category.');
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="admin-content">

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'2rem' }}>
        <div>
          <h2 className="headline-md">Categories</h2>
          <p className="body-md" style={{ color:'var(--on-surface-variant)', marginTop:4 }}>
            {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}
          </p>
        </div>
        <button onClick={openAdd} style={{
          background:'#735c00', color:'#fff', border:'none', borderRadius:6,
          padding:'0.65rem 1.4rem', fontFamily:'inherit', fontSize:'0.9rem',
          fontWeight:600, cursor:'pointer',
        }}>
          + Add Category
        </button>
      </div>

      {error && (
        <div style={{ background:'#fff0f0', border:'1px solid #ffcccc', color:'#c0392b', padding:'0.75rem 1rem', borderRadius:6, marginBottom:'1.5rem' }}>
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p className="body-md" style={{ color:'var(--on-surface-variant)' }}>Loading categories…</p>
      ) : (
        <div style={{ background:'#fff', borderRadius:8, border:'1px solid #e8e0d5', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#faf7f2', borderBottom:'1px solid #e8e0d5' }}>
                {['Image','Category Name','Slug','Products','Status','Actions'].map(h => (
                  <th key={h} style={{ padding:'0.85rem 1rem', textAlign:'left', fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.06em', color:'#888', textTransform:'uppercase' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding:'3rem', textAlign:'center', color:'#aaa' }}>
                    No categories yet. Click "+ Add Category" to create one.
                  </td>
                </tr>
              ) : (
                categories.map((cat, i) => {
                  const id = cat.id || cat._id;
                  return (
                    <tr key={id} style={{ borderBottom:'1px solid #f0ebe3', background: i % 2 === 0 ? '#fff' : '#fdfaf6' }}>
                      <td style={{ padding:'0.9rem 1rem' }}>
                        {cat.image ? (
                          <img
                            src={cat.image}
                            alt={cat.name}
                            style={{ width:48, height:48, borderRadius:8, objectFit:'cover', border:'1px solid #e8e0d5' }}
                            onError={e => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div style={{
                            width:48, height:48, borderRadius:8, background:'#f0ebe3',
                            display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem',
                          }}>💎</div>
                        )}
                      </td>
                      <td style={{ padding:'0.9rem 1rem' }}>
                        <div style={{ fontWeight:600, fontSize:'0.9rem' }}>{cat.name}</div>
                        {cat.description && (
                          <div style={{ fontSize:'0.78rem', color:'#aaa', marginTop:2, maxWidth:300, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {cat.description}
                          </div>
                        )}
                      </td>
                      <td style={{ padding:'0.9rem 1rem' }}>
                        <code style={{ background:'#f0ebe3', padding:'0.2rem 0.5rem', borderRadius:4, fontSize:'0.82rem', color:'#735c00' }}>
                          {cat.slug}
                        </code>
                      </td>
                      <td style={{ padding:'0.9rem 1rem', fontSize:'0.88rem', color:'#555' }}>
                        {cat.productCount ?? '—'}
                      </td>
                      <td style={{ padding:'0.9rem 1rem' }}>
                        <span style={{
                          background: cat.isActive ? '#dcfce7' : '#fee2e2',
                          color:      cat.isActive ? '#166534' : '#991b1b',
                          padding:'0.25rem 0.75rem', borderRadius:20,
                          fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase',
                        }}>
                          {cat.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding:'0.9rem 1rem' }}>
                        <div style={{ display:'flex', gap:6 }}>
                          <button onClick={() => openEdit(cat)} style={{
                            background:'#faf7f2', border:'1px solid #ddd', borderRadius:5,
                            padding:'0.35rem 0.8rem', cursor:'pointer', fontSize:'0.8rem', fontWeight:500,
                          }}>Edit</button>
                          <button onClick={() => handleDelete(id, cat.name)} style={{
                            background:'#fff0f0', border:'1px solid #ffcccc', color:'#c0392b',
                            borderRadius:5, padding:'0.35rem 0.8rem', cursor:'pointer', fontSize:'0.8rem', fontWeight:500,
                          }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal ──────────────────────────────────────────────────────────── */}
      {showModal && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(26,16,6,0.55)',
          display:'flex', alignItems:'center', justifyContent:'center',
          zIndex:1000, padding:'1rem',
        }}>
          <div style={{
            background:'#fff', borderRadius:12, width:'100%', maxWidth:520,
            boxShadow:'0 24px 48px rgba(0,0,0,0.18)',
            maxHeight:'90vh', overflowY:'auto',
          }}>

            {/* Header */}
            <div style={{
              display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'1.5rem 2rem', borderBottom:'1px solid #f0ebe3',
            }}>
              <div>
                <h3 style={{ margin:0, fontWeight:700, fontSize:'1.2rem' }}>
                  {editingId ? 'Edit Category' : 'Add New Category'}
                </h3>
                <p style={{ margin:'2px 0 0', fontSize:'0.82rem', color:'#888' }}>
                  Slug is auto-generated from the name
                </p>
              </div>
              <button onClick={closeModal} style={{
                background:'#f5f5f5', border:'none', borderRadius:'50%',
                width:36, height:36, cursor:'pointer', fontSize:'1.1rem',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>✕</button>
            </div>

            <div style={{ padding:'2rem' }}>
              {formError && (
                <div style={{ background:'#fff0f0', border:'1px solid #ffcccc', color:'#c0392b', padding:'0.75rem 1rem', borderRadius:8, marginBottom:'1.5rem', fontSize:'0.88rem' }}>
                  ⚠ {formError}
                </div>
              )}

              {/* Image upload */}
              <div style={{ marginBottom:'1.25rem' }}>
                <label style={labelStyle}>Category Image</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  style={{ display:'none' }}
                />
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <div
                    onClick={handleImagePick}
                    style={{
                      width:88, height:88, borderRadius:10, cursor:'pointer',
                      border: form.image ? '1px solid #e0d5c5' : '2px dashed #d8cdb8',
                      background: form.image ? '#fff' : '#faf7f2',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      overflow:'hidden', flexShrink:0, position:'relative',
                    }}
                  >
                    {uploading ? (
                      <span style={{ fontSize:'0.75rem', color:'#888' }}>Uploading…</span>
                    ) : form.image ? (
                      <img
                        src={form.image}
                        alt="Category preview"
                        style={{ width:'100%', height:'100%', objectFit:'cover' }}
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <span style={{ fontSize:'1.6rem', color:'#c9bda3' }}>+</span>
                    )}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={handleImagePick}
                      disabled={uploading}
                      style={{
                        background:'#faf7f2', border:'1px solid #ddd', borderRadius:6,
                        padding:'0.5rem 1rem', cursor: uploading ? 'not-allowed' : 'pointer',
                        fontFamily:'inherit', fontSize:'0.82rem', fontWeight:500,
                      }}
                    >
                      {form.image ? 'Change Image' : 'Upload Image'}
                    </button>
                    {form.image && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        disabled={uploading}
                        style={{
                          background:'none', border:'none', color:'#c0392b',
                          fontSize:'0.78rem', cursor:'pointer', marginLeft:10,
                          textDecoration:'underline', padding:0,
                        }}
                      >
                        Remove
                      </button>
                    )}
                    <p style={{ margin:'8px 0 0', fontSize:'0.74rem', color:'#aaa' }}>
                      JPG, PNG, or WebP. Shown on the Home Page category tile.
                    </p>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div style={{ marginBottom:'1.25rem' }}>
                <label style={labelStyle}>Category Name *</label>
                <input name="name" value={form.name} onChange={handleChange}
                  placeholder="e.g. Bangles" style={inputStyle} />
                {form.name && (
                  <p style={{ margin:'4px 0 0', fontSize:'0.75rem', color:'#aaa' }}>
                    Slug: <code style={{ color:'#735c00' }}>
                      {form.name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-')}
                    </code>
                  </p>
                )}
              </div>

              {/* Description */}
              <div style={{ marginBottom:'1.25rem' }}>
                <label style={labelStyle}>Description</label>
                <textarea name="description" value={form.description} onChange={handleChange}
                  placeholder="Optional description shown on the collection page…" rows={3}
                  style={{ ...inputStyle, resize:'vertical', lineHeight:1.6 }} />
              </div>

              {/* Active toggle — only shown when editing */}
              {editingId && (
                <div style={{ marginBottom:'1.5rem', display:'flex', alignItems:'center', gap:10 }}>
                  <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', userSelect:'none' }}>
                    <div
                      onClick={() => setForm(prev => ({ ...prev, isActive: !prev.isActive }))}
                      style={{
                        width:44, height:24, borderRadius:12, cursor:'pointer',
                        background: form.isActive ? '#735c00' : '#ddd',
                        position:'relative', transition:'background 0.2s', flexShrink:0,
                      }}
                    >
                      <div style={{
                        position:'absolute', top:2,
                        left: form.isActive ? 22 : 2,
                        width:20, height:20, borderRadius:'50%', background:'#fff',
                        transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)',
                      }} />
                    </div>
                    <div>
                      <div style={{ fontWeight:600, fontSize:'0.9rem' }}>
                        {form.isActive ? 'Active' : 'Inactive'}
                      </div>
                      <div style={{ fontSize:'0.77rem', color:'#aaa' }}>
                        {form.isActive ? 'Visible in Collections menu' : 'Hidden from store'}
                      </div>
                    </div>
                  </label>
                </div>
              )}

              {/* Actions */}
              <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.75rem', paddingTop:'1.25rem', borderTop:'1px solid #f0ebe3' }}>
                <button onClick={closeModal} disabled={saving} style={{
                  background:'#f5f5f5', border:'1px solid #ddd', borderRadius:8,
                  padding:'0.7rem 1.8rem', cursor:'pointer',
                  fontFamily:'inherit', fontSize:'0.9rem', fontWeight:500,
                }}>Cancel</button>
                <button onClick={handleSave} disabled={saving || uploading} style={{
                  background: (saving || uploading) ? '#ccc' : '#735c00', color:'#fff',
                  border:'none', borderRadius:8, padding:'0.7rem 2rem',
                  cursor: (saving || uploading) ? 'not-allowed' : 'pointer',
                  fontFamily:'inherit', fontSize:'0.9rem', fontWeight:600,
                }}>
                  {saving ? 'Saving…' : editingId ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategory;