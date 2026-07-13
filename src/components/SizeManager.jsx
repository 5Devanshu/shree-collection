import React, { useState, useEffect } from 'react';
import ColorManager from './ColorManager';

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

/**
 * SizeManager
 * Owns the `sizeStock` array:
 *   [{ size, stock, price, resellerPrice, discountEnabled, discountPercent, colors: [] }]
 * matching modules/product/product.service.js -> normalizeSizeStock().
 *
 * discountEnabled / discountPercent are an optional PER-SIZE override of the
 * product's own discount settings:
 *   - discountEnabled: null  -> inherit the product's discountEnabled
 *                       true  -> force discount ON for this size
 *                       false -> force discount OFF for this size
 *   - discountPercent: 0     -> inherit the product's discountPercent
 *                       >0    -> use this size's own percent instead
 * Resellers never receive a discount regardless of these settings — see
 * resolveSizePrice() in product.service.js.
 *
 * Independent of ColorManager's internals — it only forwards `colors` for a
 * given size and receives the updated array back, plus aggregates each
 * size's "is a colour image uploading right now" flag so the parent modal
 * can block Save while any upload is in flight (same guarantee the original
 * flat `colorImageUploading` map gave, just assembled bottom-up instead of
 * tracked in the parent).
 *
 * Props:
 * - sizeStock: array (controlled)
 * - onChange: (nextSizeStock) => void
 * - basePrice: number             — form.price, used as the fallback rate
 * - baseResellerPrice: number     — form.resellerPrice, used as the fallback rate
 * - baseDiscountEnabled: boolean  — form.discountEnabled, the product's own discount toggle
 * - baseDiscountPercent: number   — form.discountPercent, the product's own discount %
 * - onUploadingChange?: (isAnyUploadInFlight: boolean) => void
 * - onError?: (message: string) => void   // falls back to inline text if omitted
 */
export default function SizeManager({
  sizeStock = [],
  onChange,
  basePrice = 0,
  baseResellerPrice = 0,
  baseDiscountEnabled = false,
  baseDiscountPercent = 0,
  onUploadingChange,
  onError,
}) {
  const [newSizeValue, setNewSizeValue] = useState('');
  const [localError, setLocalError] = useState('');
  const [uploadingBySize, setUploadingBySize] = useState({});

  const reportError = (msg) => {
    if (onError) onError(msg);
    else setLocalError(msg);
  };

  useEffect(() => {
    const anyUploading = Object.values(uploadingBySize).some(Boolean);
    onUploadingChange?.(anyUploading);
  }, [uploadingBySize]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddSize = () => {
    const raw = newSizeValue.trim();
    if (raw === '') return;

    const value = Number(raw);
    if (!Number.isFinite(value)) {
      reportError('Size must be a number (e.g. 2.4, 2.6, 7).');
      return;
    }
    if (sizeStock.some(s => s.size === value)) {
      reportError(`Size ${value} has already been added.`);
      return;
    }

    if (onError) onError(''); else setLocalError('');
    const next = [
      ...sizeStock,
      {
        size: value,
        stock: 0,
        price: 0,
        resellerPrice: 0,
        discountEnabled: null,
        discountPercent: 0,
        colors: [],
      },
    ].sort((a, b) => a.size - b.size);
    onChange(next);
    setNewSizeValue('');
  };

  const handleNewSizeKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddSize(); }
  };

  const handleRemoveSize = (size) => {
    onChange(sizeStock.filter(s => s.size !== size));
    setUploadingBySize(prev => { const next = { ...prev }; delete next[size]; return next; });
  };

  const handleSizeFieldChange = (size, field, value) => {
    const val = Number(value) || 0;
    onChange(sizeStock.map(s => s.size === size ? { ...s, [field]: val } : s));
  };

  // discountEnabled is tri-state (null | true | false), driven by a <select>,
  // so it needs its own handler instead of the numeric coercion above.
  const handleDiscountEnabledChange = (size, selectValue) => {
    const nextValue = selectValue === 'inherit' ? null : selectValue === 'on';
    onChange(sizeStock.map(s => s.size === size ? { ...s, discountEnabled: nextValue } : s));
  };

  const handleDiscountPercentChange = (size, value) => {
    const val = Number(value) || 0;
    onChange(sizeStock.map(s => s.size === size ? { ...s, discountPercent: val } : s));
  };

  const handleColorsChangeForSize = (size, nextColors) => {
    onChange(sizeStock.map(s => s.size === size ? { ...s, colors: nextColors } : s));
  };

  const resolveSizeDisplay = (entry) => {
    const sizePrice    = Number(entry.price) || 0;
    const sizeReseller = Number(entry.resellerPrice) || 0;

    const customerBase = sizePrice > 0 ? sizePrice : basePrice;
    const resellerPays = sizeReseller > 0
      ? sizeReseller
      : (baseResellerPrice > 0 ? baseResellerPrice : customerBase);

    // ── Effective discount for this size (customers only — mirrors
    // resolveSizePrice() in product.service.js; resellers never discount) ──
    const sizeDiscountEnabled = entry.discountEnabled;
    const effectiveDiscountEnabled =
      sizeDiscountEnabled === null || sizeDiscountEnabled === undefined
        ? Boolean(baseDiscountEnabled)
        : sizeDiscountEnabled;

    const sizeDiscountPercent = Number(entry.discountPercent) || 0;
    const effectiveDiscountPercent = sizeDiscountPercent > 0
      ? sizeDiscountPercent
      : (Number(baseDiscountPercent) || 0);

    const hasEffectiveDiscount = effectiveDiscountEnabled && effectiveDiscountPercent > 0;
    const customerPays = hasEffectiveDiscount
      ? parseFloat((customerBase - (customerBase * effectiveDiscountPercent) / 100).toFixed(2))
      : customerBase;

    return { customerPays, resellerPays, hasEffectiveDiscount, effectiveDiscountPercent };
  };

  const totalStock = sizeStock.reduce((sum, s) => sum + (Number(s.stock) || 0), 0);

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>Add Size</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="number"
            step="any"
            inputMode="decimal"
            value={newSizeValue}
            onChange={(e) => setNewSizeValue(e.target.value)}
            onKeyDown={handleNewSizeKeyDown}
            placeholder="e.g. 2.4 or 8"
            style={{ ...inputStyle, maxWidth: 160 }}
          />
          <button
            type="button"
            onClick={handleAddSize}
            style={{
              background: '#735c00', color: '#fff', border: 'none', borderRadius: 6,
              padding: '0 1.2rem', fontFamily: 'inherit', fontSize: '0.85rem',
              fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >+ Add Size</button>
        </div>
        <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: '#aaa' }}>
          Enter any number — whole (7, 8) or decimal (2.4, 2.6, 2.8) — then click Add Size.
        </p>
        {localError && (
          <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: '#c0392b' }}>{localError}</p>
        )}
      </div>

      {sizeStock.length === 0 ? (
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#c0392b' }}>
          No sizes added yet. Add at least one size above.
        </p>
      ) : (
        <div>
          <label style={labelStyle}>Sizes, Rate &amp; Colour Variants</label>
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.75rem', color: '#aaa' }}>
            Leave Rate / Reseller Rate at 0 to use the base price above. Add one or more colours per
            size — each colour gets its own stock count and photo. A size with no colours added yet
            uses a single stock number for the whole size. Discount below is optional — leave it on
            "Inherit" to use the product's own discount setting for this size.
          </p>
          <div style={{ marginBottom: '0.75rem', fontSize: '0.8rem', color: '#735c00', fontWeight: 600 }}>
            Total stock across all sizes: {totalStock}{' '}
            <span style={{ fontWeight: 400, color: '#aaa' }}>
              (sum of every colour's stock, or the size's own stock if it has no colours)
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {sizeStock.map((entry) => {
              const { size, price, resellerPrice, discountEnabled, discountPercent, colors = [] } = entry;
              const { customerPays, resellerPays, hasEffectiveDiscount, effectiveDiscountPercent } = resolveSizeDisplay(entry);
              const hasColors = colors.length > 0;

              const discountSelectValue =
                discountEnabled === null || discountEnabled === undefined
                  ? 'inherit'
                  : discountEnabled ? 'on' : 'off';

              return (
                <div key={size} style={{ position: 'relative', background: '#fff', border: '1px solid #e0d5c5', borderRadius: 8, padding: '0.85rem 1rem' }}>
                  <button
                    type="button"
                    onClick={() => handleRemoveSize(size)}
                    title="Remove size"
                    style={{
                      position: 'absolute', top: -8, right: -8, background: '#c0392b', color: '#fff',
                      border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', fontSize: '0.75rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
                    }}
                  >✕</button>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#735c00' }}>{size}</div>
                    <div style={{ fontSize: '0.72rem', lineHeight: 1.5 }}>
                      <span style={{ color: '#333' }}>
                        Customer pays <strong>₹{customerPays.toLocaleString('en-IN')}</strong>
                        {hasEffectiveDiscount && (
                          <span style={{ color: '#c0392b' }}> ({effectiveDiscountPercent}% off)</span>
                        )}
                      </span>
                      {' · '}
                      <span style={{ color: '#2e7d32' }}>Reseller pays <strong>₹{resellerPays.toLocaleString('en-IN')}</strong> (no discount)</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                    <div>
                      <label style={{ ...labelStyle, fontSize: '0.65rem', marginBottom: 3 }}>Rate (₹)</label>
                      <input
                        type="number" min="0"
                        value={price || ''}
                        placeholder={basePrice ? `${basePrice} (base)` : '0'}
                        onChange={(e) => handleSizeFieldChange(size, 'price', e.target.value)}
                        style={{ ...inputStyle, padding: '0.45rem 0.55rem', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ ...labelStyle, fontSize: '0.65rem', marginBottom: 3, color: '#166534' }}>Reseller Rate (₹)</label>
                      <input
                        type="number" min="0"
                        value={resellerPrice || ''}
                        placeholder={baseResellerPrice ? `${baseResellerPrice} (base)` : '0'}
                        onChange={(e) => handleSizeFieldChange(size, 'resellerPrice', e.target.value)}
                        style={{ ...inputStyle, padding: '0.45rem 0.55rem', fontSize: '0.85rem', background: '#f0fdf4', borderColor: '#bbf7d0' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                    <div>
                      <label style={{ ...labelStyle, fontSize: '0.65rem', marginBottom: 3 }}>Discount (this size)</label>
                      <select
                        value={discountSelectValue}
                        onChange={(e) => handleDiscountEnabledChange(size, e.target.value)}
                        style={{ ...inputStyle, padding: '0.45rem 0.55rem', fontSize: '0.85rem' }}
                      >
                        <option value="inherit">
                          Inherit product ({baseDiscountEnabled ? `${baseDiscountPercent || 0}% on` : 'off'})
                        </option>
                        <option value="on">Force ON for this size</option>
                        <option value="off">Force OFF for this size</option>
                      </select>
                    </div>
                    {discountSelectValue !== 'off' && (
                      <div>
                        <label style={{ ...labelStyle, fontSize: '0.65rem', marginBottom: 3 }}>Discount % (blank = product's %)</label>
                        <input
                          type="number" min="0" max="100"
                          value={discountPercent || ''}
                          placeholder={baseDiscountPercent ? `${baseDiscountPercent} (base)` : '0'}
                          onChange={(e) => handleDiscountPercentChange(size, e.target.value)}
                          style={{ ...inputStyle, padding: '0.45rem 0.55rem', fontSize: '0.85rem' }}
                        />
                      </div>
                    )}
                  </div>

                  {!hasColors && (
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ ...labelStyle, fontSize: '0.65rem', marginBottom: 3 }}>Stock (no colours added — single count for this size)</label>
                      <input
                        type="number" min="0"
                        value={entry.stock}
                        onChange={(e) => handleSizeFieldChange(size, 'stock', e.target.value)}
                        style={{ ...inputStyle, padding: '0.45rem 0.55rem', fontSize: '0.85rem', maxWidth: 160 }}
                      />
                    </div>
                  )}

                  <ColorManager
                    colors={colors}
                    onChange={(nextColors) => handleColorsChangeForSize(size, nextColors)}
                    onUploadingChange={(isUp) =>
                      setUploadingBySize(prev => ({ ...prev, [size]: isUp }))
                    }
                    onError={onError}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}