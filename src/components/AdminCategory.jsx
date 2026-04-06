import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { uploadCategoryImage } from '../api/client';
import Modal from './Modal';
import './Modal.css';

// ── Category Form ─────────────────────────────────────────────────────────────
const CategoryForm = ({ initial, onSave, onCancel }) => {
  const [form, setForm] = useState(
    initial || { name: '', slug: '', description: '', image: '', imagePublicId: '' }
  );
  const [imgError,   setImgError]   = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [uploadMsg,  setUploadMsg]  = useState('');

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  // Auto-generate slug from name on create
  const handleNameChange = (val) => {
    set('name', val);
    if (!initial) {
      set('slug', val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }
  };

  // ── Image upload handler ────────────────────────────────────────────────────
  const handleImageFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImgError(false);
      set('image', ev.target.result);
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    setUploading(true);
    setUploadMsg('Uploading to Cloudinary…');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await uploadCategoryImage(formData);
      // Replace local blob preview with permanent Cloudinary URL
      set('image',         res.data.url);
      set('imagePublicId', res.data.public_id);
      setUploadMsg('✓ Image uploaded');
      setTimeout(() => setUploadMsg(''), 2500);
    } catch (err) {
      setUploadMsg(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.slug.trim()) {
      alert('Category name and slug are required.');
      return;
    }
    onSave(form);
  };

  const showPreview = form.image && !imgError;

  return (
    <div className="modal-form">

      {/* ── Category Image ────────────────────────────────────────────────── */}
      <div className="form-field">
        <label>Category Image</label>

        {/* Preview box */}
        <div className="form-image-preview">
          {uploading ? (
            <span className="placeholder-text">Uploading…</span>
          ) : showPreview ? (
            <img
              src={form.image}
              alt="Category preview"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="placeholder-text">
              No image — paste a URL or choose a file below
            </span>
          )}
        </div>

        {/* Upload status message */}
        {uploadMsg && (
          <span style={{
            fontSize: '0.78rem',
            color: uploadMsg.startsWith('✓') ? 'var(--primary)' : 'var(--on-error)',
            marginTop: 4,
          }}>
            {uploadMsg}
          </span>
        )}

        {/* Paste URL */}
        <input
          type="text"
          placeholder="Paste Cloudinary or image URL…"
          value={!form.image?.startsWith('data:') ? (form.image || '') : ''}
          onChange={e => {
            setImgError(false);
            set('image', e.target.value);
            set('imagePublicId', ''); // URL-pasted images have no public_id
          }}
        />

        {/* File upload — goes to Cloudinary via /api/upload */}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="form-file-input"
          onChange={handleImageFile}
          disabled={uploading}
        />

        <span className="form-hint">
          Uploaded images are stored on Cloudinary. Max 5MB. JPG, PNG or WEBP.
        </span>

        {/* Show Cloudinary public_id once uploaded */}
        {form.imagePublicId && (
          <span className="form-hint">
            Cloudinary ID: <strong>{form.imagePublicId}</strong>
          </span>
        )}
      </div>

      {/* ── Category Name ─────────────────────────────────────────────────── */}
      <div className="form-field">
        <label>Category Name *</label>
        <input
          type="text"
          placeholder="e.g. Bangles"
          value={form.name}
          onChange={e => handleNameChange(e.target.value)}
          autoFocus
        />
      </div>

      {/* ── URL Slug ──────────────────────────────────────────────────────── */}
      <div className="form-field">
        <label>URL Slug *</label>
        <input
          type="text"
          placeholder="e.g. bangles"
          value={form.slug}
          onChange={e => set('slug', e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
        />
        <span className="form-hint">
          URL: /collections/<strong>{form.slug || 'slug'}</strong>
        </span>
      </div>

      {/* ── Description ───────────────────────────────────────────────────── */}
      <div className="form-field">
        <label>Description</label>
        <textarea
          placeholder="Shown on the collection page…"
          value={form.description}
          onChange={e => set('description', e.target.value)}
          rows={3}
        />
      </div>

      {/* ── Actions ───────────────────────────────────────────────────────── */}
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={uploading}
        >
          {uploading ? 'Uploading…' : 'Save Category'}
        </button>
      </div>
    </div>
  );
};

// ── Main AdminCategory ─────────────────────────────────────────────────────────
const AdminCategory = () => {
  const {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    getProductCountForCategory,
  } = useStore();

  const [modal,   setModal]   = useState(null);
  const [editing, setEditing] = useState(null);
  const [error,   setError]   = useState('');
  const [saving,  setSaving]  = useState(false);

  const openAdd    = () => { setEditing(null); setModal('add');  };
  const openEdit   = (c) => { setEditing(c);   setModal('edit'); };
  const closeModal = () => { setModal(null); setEditing(null); setError(''); };

  const handleSave = async (data) => {
    setSaving(true);
    setError('');
    try {
      if (modal === 'add') await addCategory(data);
      else await updateCategory(editing._id, data);
      closeModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? Products in it will become uncategorised.`)) return;
    try {
      await deleteCategory(id);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="admin-content">

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
        <h2 className="headline-md">Categories</h2>
        <button className="btn btn-primary" onClick={openAdd}
          style={{ padding: 'var(--spacing-3) var(--spacing-6)' }}>
          + Add Category
        </button>
      </div>

      {/* Info banner */}
      <div style={{
        background: 'var(--surface-container-low)',
        border: '1px solid var(--outline-variant)',
        padding: 'var(--spacing-4) var(--spacing-6)',
        marginBottom: 'var(--spacing-6)',
        fontSize: '0.875rem',
        color: 'var(--on-surface-variant)',
        lineHeight: 1.6,
      }}>
        Categories appear in the navbar Collections dropdown and as filter links on the shop page.
        Each slug is used in its URL. Images are uploaded to Cloudinary automatically.
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(186,26,26,0.06)',
          border: '1px solid rgba(186,26,26,0.2)',
          color: 'var(--on-error)',
          padding: 'var(--spacing-4)',
          marginBottom: 'var(--spacing-6)',
          fontSize: '0.875rem',
        }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div className="recent-activity">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="label-md">Image</th>
              <th className="label-md">Category Name</th>
              <th className="label-md">Slug / URL</th>
              <th className="label-md">Description</th>
              <th className="label-md">Products</th>
              <th className="label-md">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && (
              <tr>
                <td colSpan={6} style={{
                  textAlign: 'center',
                  padding: 'var(--spacing-12)',
                  color: 'var(--on-surface-variant)',
                }}>
                  No categories yet — add your first one
                </td>
              </tr>
            )}
            {categories.map(c => (
              <tr key={c._id}>
                {/* Image thumbnail */}
                <td>
                  <div style={{
                    width: 52,
                    height: 52,
                    background: 'var(--surface-container-low)',
                    border: '1px solid var(--outline-variant)',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {c.image
                      ? <img src={c.image} alt={c.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: '1.4rem' }}>🏷️</span>
                    }
                  </div>
                </td>

                <td>
                  <span className="body-lg" style={{ fontWeight: 500 }}>{c.name}</span>
                </td>

                <td>
                  <code style={{
                    background: 'var(--surface-container-low)',
                    padding: '3px 10px',
                    fontSize: '0.78rem',
                    color: 'var(--primary)',
                    fontFamily: 'monospace',
                    border: '1px solid var(--outline-variant)',
                  }}>
                    /collections/{c.slug}
                  </code>
                </td>

                <td>
                  <span className="body-lg" style={{
                    color: 'var(--on-surface-variant)',
                    display: 'block',
                    maxWidth: 240,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {c.description || '—'}
                  </span>
                </td>

                <td className="body-lg">{getProductCountForCategory(c.slug)}</td>

                <td>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn-tertiary" onClick={() => openEdit(c)}>Edit</button>
                    <button
                      className="btn btn-tertiary"
                      onClick={() => handleDelete(c._id, c.name)}
                      style={{ color: 'var(--on-error)' }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal
        isOpen={!!modal}
        onClose={closeModal}
        title={modal === 'add' ? 'Add New Category' : 'Edit Category'}
        size="sm"
      >
        {saving && (
          <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-4)' }}>
            Saving…
          </p>
        )}
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
        <CategoryForm
          initial={editing}
          onSave={handleSave}
          onCancel={closeModal}
        />
      </Modal>
    </div>
  );
};

export default AdminCategory;