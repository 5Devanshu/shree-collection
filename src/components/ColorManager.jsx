import React, { useState, useEffect, useMemo } from 'react';
import { uploadImage as uploadImageApi } from '../api/client';

const labelStyleSmall = {
  display: 'block', fontSize: '0.6rem', fontWeight: 700,
  letterSpacing: '0.06em', textTransform: 'uppercase',
  color: '#888', marginBottom: 3,
};
const inputStyleSmall = {
  width: '100%', padding: '0.35rem 0.5rem',
  border: '1px solid #e0d5c5', borderRadius: 6,
  fontFamily: 'inherit', fontSize: '0.8rem',
  background: '#faf7f2', outline: 'none', boxSizing: 'border-box',
};

/**
 * ColorManager
 * Owns the `colors` array for ONE size entry:
 *   [{ color, stock, image, imageKey }]
 *
 * Fully self-contained: its own "add colour" input, its own image preview
 * and upload-in-progress state, keyed by colour name (scoped to this size,
 * so no composite `size::color` key is needed the way the original flat
 * component required).
 *
 * Props:
 * - colors: array (controlled — from the parent size entry)
 * - onChange: (nextColors) => void
 * - onUploadingChange?: (isAnyColorUploading: boolean) => void
 * - onError?: (message: string) => void   // falls back to inline text if omitted
 */
export default function ColorManager({ colors = [], onChange, onUploadingChange, onError }) {
  const [newColorValue, setNewColorValue] = useState('');
  const [localError, setLocalError] = useState('');

  // Pre-fill previews from whatever image URL is already saved on each colour
  // (covers the edit case — no separate "pre-fill on open" step needed).
  const [previews, setPreviews] = useState(() => {
    const init = {};
    colors.forEach(c => { if (c.image) init[c.color] = c.image; });
    return init;
  });
  const [uploading, setUploading] = useState({});

  const reportError = (msg) => {
    if (onError) onError(msg);
    else setLocalError(msg);
  };

  useEffect(() => {
    const anyUploading = Object.values(uploading).some(Boolean);
    onUploadingChange?.(anyUploading);
  }, [uploading]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddColor = () => {
    const raw = newColorValue.trim();
    if (!raw) return;
    if (colors.some(c => c.color.toLowerCase() === raw.toLowerCase())) {
      reportError(`Colour "${raw}" has already been added for this size.`);
      return;
    }
    if (onError) onError(''); else setLocalError('');
    onChange([...colors, { color: raw, stock: 0, image: '', imageKey: '' }]);
    setNewColorValue('');
  };

  const handleNewColorKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddColor(); }
  };

  const handleRemoveColor = (color) => {
    onChange(colors.filter(c => c.color !== color));
    setPreviews(prev => { const next = { ...prev }; delete next[color]; return next; });
    setUploading(prev => { const next = { ...prev }; delete next[color]; return next; });
  };

  const handleStockChange = (color, value) => {
    const val = Number(value) || 0;
    onChange(colors.map(c => c.color === color ? { ...c, stock: val } : c));
  };

  const handleImageUpload = async (color, file) => {
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setPreviews(prev => ({ ...prev, [color]: localPreview }));
    setUploading(prev => ({ ...prev, [color]: true }));
    if (onError) onError(''); else setLocalError('');

    try {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('folder', 'product');
      const res = await uploadImageApi(fd);
      const url   = res.data?.media?.secureUrl || res.data?.media?.url || '';
      const s3Key = res.data?.media?.s3Key || '';
      onChange(colors.map(c => c.color === color ? { ...c, image: url, imageKey: s3Key } : c));
    } catch {
      URL.revokeObjectURL(localPreview);
      setPreviews(prev => { const next = { ...prev }; delete next[color]; return next; });
      onChange(colors.map(c => c.color === color ? { ...c, image: '', imageKey: '' } : c));
      reportError(`Image upload failed for colour "${color}". Please try again.`);
    } finally {
      setUploading(prev => ({ ...prev, [color]: false }));
    }
  };

  const handleRemoveImage = (color) => {
    onChange(colors.map(c => c.color === color ? { ...c, image: '', imageKey: '' } : c));
    setPreviews(prev => { const next = { ...prev }; delete next[color]; return next; });
  };

  return (
    <div style={{ borderTop: '1px dashed #e8e0d5', paddingTop: 10 }}>
      <label style={{ ...labelStyleSmall, fontSize: '0.68rem', marginBottom: 6 }}>Colours</label>

      {localError && (
        <p style={{ margin: '0 0 8px', fontSize: '0.72rem', color: '#c0392b' }}>{localError}</p>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: colors.length ? 10 : 0 }}>
        <input
          type="text"
          value={newColorValue}
          onChange={(e) => setNewColorValue(e.target.value)}
          onKeyDown={handleNewColorKeyDown}
          placeholder="e.g. Rose Gold"
          style={{ ...inputStyleSmall, maxWidth: 200 }}
        />
        <button
          type="button"
          onClick={handleAddColor}
          style={{
            background: '#735c00', color: '#fff', border: 'none', borderRadius: 6,
            padding: '0 1rem', fontFamily: 'inherit', fontSize: '0.8rem',
            fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >+ Add Colour</button>
      </div>

      {colors.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.7rem' }}>
          {colors.map((c) => {
            const preview = previews[c.color];
            const isUploading = !!uploading[c.color];
            return (
              <div key={c.color} style={{ position: 'relative', background: '#faf7f2', border: '1px solid #e8e0d5', borderRadius: 6, padding: '0.5rem 0.6rem' }}>
                <button
                  type="button"
                  onClick={() => handleRemoveColor(c.color)}
                  title="Remove colour"
                  style={{
                    position: 'absolute', top: -7, right: -7, background: '#c0392b', color: '#fff',
                    border: 'none', borderRadius: '50%', width: 18, height: 18, cursor: 'pointer', fontSize: '0.65rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
                  }}
                >✕</button>

                <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: 6, color: '#333' }}>
                  {c.color}
                </div>

                <label style={{ ...labelStyleSmall, marginBottom: 3 }}>Stock</label>
                <input
                  type="number" min="0"
                  value={c.stock}
                  onChange={(e) => handleStockChange(c.color, e.target.value)}
                  style={{ ...inputStyleSmall, marginBottom: 6 }}
                />

                {preview ? (
                  <div style={{ position: 'relative', marginBottom: 6 }}>
                    <img
                      src={preview}
                      alt={c.color}
                      style={{ width: '100%', height: 60, objectFit: 'cover', borderRadius: 5, border: '1px solid #eee' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(c.color)}
                      title="Remove image"
                      style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, cursor: 'pointer', fontSize: '0.6rem' }}
                    >✕</button>
                  </div>
                ) : (
                  <div style={{ border: '1px dashed #e0d5c5', borderRadius: 5, padding: '0.4rem', textAlign: 'center', background: '#fff', marginBottom: 6, fontSize: '0.65rem', color: '#bbb' }}>
                    Falls back to main image
                  </div>
                )}

                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fff', border: '1px solid #ddd', borderRadius: 5, padding: '0.3rem 0.5rem', cursor: 'pointer', fontSize: '0.68rem', fontWeight: 500, width: '100%', justifyContent: 'center', boxSizing: 'border-box' }}>
                  {isUploading ? '⏳ Uploading…' : preview ? '📁 Change' : '📁 Upload'}
                  <input
                    type="file" accept="image/*"
                    onChange={(e) => handleImageUpload(c.color, e.target.files?.[0])}
                    disabled={isUploading}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}