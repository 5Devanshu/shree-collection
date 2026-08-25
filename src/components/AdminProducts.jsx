import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchProducts, fetchCategories, createProduct,
  updateProduct, deleteProduct, uploadImage,
} from '../api/client';
import SizeManager from './SizeManager';
import ColorManager from './ColorManager';

const EMPTY_FORM = {
  title: '', material: '', category: '', price: '', resellerPrice: '', stock: '10',
  description: '', isFeatured: false, image: '', gallery: [],
  colour: '', plating: '', stoneType: '', sku: '',
  // ── Discount — product-level default. Sizes below can each override this
  // individually (inherit / force on / force off) via SizeManager. Resellers
  // never receive a discount regardless of these settings.
  discountEnabled: false,
  discountPercent: '',
  // ── Sizing ──
  sizeEnabled: false,
  sizeLabel: '',
  // [{ size, stock, price, resellerPrice, discountEnabled, discountPercent, colors: [{ color, stock, image, imageKey }] }]
  sizeStock: [],
  // ── Colours — INDEPENDENT of sizing. A product can have colours with no
  // sizes at all, sizes with no colours here (use per-size colours instead),
  // or neither. Not meant to be combined with sizeEnabled on the same product.
  colorEnabled: false,
  // [{ color, stock, image, imageKey }]
  colors: [],
};

// ── Filters — kept separate from EMPTY_FORM (that's the Add/Edit product
// form state, this is the table's search/filter bar state) ──────────────────
const EMPTY_FILTERS = {
  search:      '',
  category:    '',
  stockStatus: '',
  minPrice:    '',
  maxPrice:    '',
};

const PAGE_SIZE = 20;

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

// Slightly smaller variant of inputStyle for the filter bar, so it doesn't
// tower over the search box.
const filterInputStyle = {
  ...inputStyle,
  padding: '0.55rem 0.75rem',
  fontSize: '0.85rem',
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
  const [total, setTotal] = useState(0);

  // ── Filters + pagination ────────────────────────────────────────────────
  // searchInput is what the user is typing right now (updates instantly so
  // the box feels responsive); appliedFilters is what's actually sent to the
  // API, updated after a short debounce so we're not hitting the backend on
  // every keystroke. Category/price/stock changes apply immediately since
  // those are discrete selections, not free typing.
  const [searchInput, setSearchInput]         = useState('');
  const [appliedFilters, setAppliedFilters]   = useState(EMPTY_FILTERS);
  const [page, setPage]                       = useState(1);
  const [totalPages, setTotalPages]           = useState(1);
  const debounceRef = useRef(null);

  // True whenever any colour-variant image (in any size) is mid-upload —
  // reported bottom-up by SizeManager. Used to block Save.
  const [sizeImagesUploading, setSizeImagesUploading] = useState(false);

  // True whenever any TOP-LEVEL colour image (independent of sizing) is
  // mid-upload — reported by ColorManager directly (no size wrapper here).
  const [colorImagesUploading, setColorImagesUploading] = useState(false);

  const [imagePreview, setImagePreview] = useState('');

  // ── Debounce the search box → appliedFilters.search ─────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setAppliedFilters(prev => ({ ...prev, search: searchInput.trim() }));
      setPage(1);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (appliedFilters.search)      params.search      = appliedFilters.search;
      if (appliedFilters.category)    params.category    = appliedFilters.category;
      if (appliedFilters.stockStatus) params.stockStatus = appliedFilters.stockStatus;
      if (appliedFilters.minPrice)    params.minPrice    = appliedFilters.minPrice;
      if (appliedFilters.maxPrice)    params.maxPrice    = appliedFilters.maxPrice;

      const [prodRes, catRes] = await Promise.all([
        fetchProducts(params),
        // Categories don't need to be re-fetched on every filter change —
        // but fetching them alongside is cheap and keeps this effect simple,
        // and the dropdown stays fresh if a category gets added/renamed
        // elsewhere while this page is open.
        fetchCategories(),
      ]);
      const prods = prodRes.data?.products || prodRes.data?.data || [];
      const cats  = catRes.data?.data || catRes.data?.categories || catRes.data || [];
      const apiTotal = prodRes.data?.total;

      setProducts(Array.isArray(prods) ? prods : []);
      setCategories(Array.isArray(cats) ? cats : []);
      // Fall back to prods.length only if the API didn't send a total —
      // never trust array length as the source of truth once it's capped.
      const resolvedTotal = typeof apiTotal === 'number' ? apiTotal : prods.length;
      setTotal(resolvedTotal);
      setTotalPages(Math.max(1, Math.ceil(resolvedTotal / PAGE_SIZE)));
    } catch {
      setError('Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, [page, appliedFilters]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Filter bar handlers ─────────────────────────────────────────────────
  const handleFilterChange = (field, value) => {
    setAppliedFilters(prev => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setAppliedFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    appliedFilters.search || appliedFilters.category ||
    appliedFilters.stockStatus || appliedFilters.minPrice || appliedFilters.maxPrice
  );

  const openAdd = () => {
    setForm(EMPTY_FORM); setEditingId(null);
    setImagePreview('');
    setSizeImagesUploading(false);
    setColorImagesUploading(false);
    setFormError(''); setShowModal(true);
  };

  const openEdit = (p) => {
    const sizeStock = Array.isArray(p.sizeStock) && p.sizeStock.length > 0
      ? p.sizeStock.map(s => ({
          size:            Number(s.size),
          stock:           Number(s.stock) || 0,
          price:           Number(s.price) || 0,
          resellerPrice:   Number(s.resellerPrice) || 0,
          discountEnabled: typeof s.discountEnabled === 'boolean' ? s.discountEnabled : null,
          discountPercent: Number(s.discountPercent) || 0,
          colors: Array.isArray(s.colors)
            ? s.colors.map(c => ({
                color:    c.color    || '',
                stock:    Number(c.stock) || 0,
                image:    c.image    || '',
                imageKey: c.imageKey || '',
              }))
            : [],
        }))
      : Array.isArray(p.sizes)
        ? p.sizes.map(s => ({
            size: Number(s), stock: 0, price: 0, resellerPrice: 0,
            discountEnabled: null, discountPercent: 0, colors: [],
          }))
        : [];

    const colors = Array.isArray(p.colors)
      ? p.colors.map(c => ({
          color:    c.color    || '',
          stock:    Number(c.stock) || 0,
          image:    c.image    || '',
          imageKey: c.imageKey || '',
        }))
      : [];

    setForm({
      title:           p.title        || '',
      material:        p.material     || '',
      category:        p.categoryId   || p.category?.id || p.category || '',
      price:           p.price        ?? '',
      resellerPrice:   p.resellerPrice ?? '',
      stock:           p.stock        ?? 10,
      description:     p.description  || '',
      isFeatured:      p.isFeatured   || false,
      image:           p.imageUrl     || p.image?.url || p.image || '',
      gallery:         Array.isArray(p.gallery) ? p.gallery : [],
      colour:          p.colour    || '',
      plating:         p.plating   || '',
      stoneType:       p.stoneType || '',
      sku:             p.sku       || '',
      discountEnabled: p.discountEnabled || false,
      discountPercent: p.discountPercent ?? '',
      sizeEnabled:     p.sizeEnabled || false,
      sizeLabel:       p.sizeLabel   || '',
      sizeStock,
      colorEnabled:    p.colorEnabled || false,
      colors,
    });
    setEditingId(p.id);
    setImagePreview(p.imageUrl || p.image?.url || p.image || '');
    setSizeImagesUploading(false);
    setColorImagesUploading(false);
    setFormError(''); setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false); setEditingId(null);
    setForm(EMPTY_FORM); setFormError('');
    setImagePreview('');
    setSizeImagesUploading(false);
    setColorImagesUploading(false);
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

  // Independent of handleToggleSizeEnabled — no shared state, no category
  // auto-label (colours don't need one the way size does).
  const handleToggleColorEnabled = () => {
    setForm(prev => ({ ...prev, colorEnabled: !prev.colorEnabled }));
  };

  const handleToggleDiscountEnabled = () => {
    setForm(prev => ({ ...prev, discountEnabled: !prev.discountEnabled }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setImagePreview(localPreview);

    setImageUploading(true); setFormError('');
    try {
      const fd = new FormData();
      fd.append('image', file); fd.append('folder', 'product');
      const res = await uploadImage(fd);
      const url = res.data?.media?.secureUrl || res.data?.media?.url || '';
      setForm(prev => ({ ...prev, image: url }));
    } catch {
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
    if (form.colorEnabled && form.colors.length === 0) {
      return setFormError('Please add at least one colour, or turn off colours.');
    }
    if (sizeImagesUploading || colorImagesUploading) {
      return setFormError('Please wait for colour image uploads to finish.');
    }

    setSaving(true);
    try {
      const payload = {
        title:           form.title.trim(),
        material:        form.material.trim(),
        category:        form.category,
        price:           Number(form.price),
        resellerPrice:   Number(form.resellerPrice) || 0,
        image:           { url: form.image },
        description:     form.description.trim(),
        isFeatured:      form.isFeatured,
        gallery:         Array.isArray(form.gallery) ? form.gallery : [],
        stock:           Number(form.stock) || 0,
        colour:          form.colour.trim(),
        plating:         form.plating.trim(),
        stoneType:       form.stoneType.trim(),
        sku:             form.sku.trim(),
        discountEnabled: form.discountEnabled,
        discountPercent: Number(form.discountPercent) || 0,
        sizeEnabled:     form.sizeEnabled,
        sizeLabel:       form.sizeLabel.trim(),
        sizeStock:       form.sizeEnabled
          ? form.sizeStock.map(s => ({
              ...s,
              colors: (s.colors || []).map(c => ({ ...c, color: c.color.trim() })),
            }))
          : [],
        colorEnabled:    form.colorEnabled,
        colors:          form.colorEnabled
          ? form.colors.map(c => ({ ...c, color: c.color.trim() }))
          : [],
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
      // Refetch rather than just filtering out of local state — deleting the
      // last item on a page should pull the count/pagination back in line.
      await loadData();
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
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <div>
          <h2 className="headline-md">Products</h2>
          <p className="body-md" style={{ color:'var(--on-surface-variant)', marginTop:4 }}>
            {total} product{total !== 1 ? 's' : ''}{hasActiveFilters ? ' (filtered)' : ''}
          </p>
        </div>
        <button onClick={openAdd} style={{
          background:'#735c00', color:'#fff', border:'none', borderRadius:6,
          padding:'0.65rem 1.4rem', fontFamily:'inherit', fontSize:'0.9rem',
          fontWeight:600, cursor:'pointer',
        }}>+ Add Product</button>
      </div>

      {/* ── Search + Filter bar ── */}
      <div style={{
        display:'flex', flexWrap:'wrap', alignItems:'flex-end', gap:'0.85rem',
        background:'#fff', border:'1px solid #e8e0d5', borderRadius:8,
        padding:'1rem 1.25rem', marginBottom:'1.5rem',
      }}>
        <div style={{ flex:'2 1 220px', minWidth:180 }}>
          <label style={labelStyle}>Search</label>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by product name…"
            style={filterInputStyle}
          />
        </div>

        <div style={{ flex:'1 1 160px', minWidth:150 }}>
          <label style={labelStyle}>Category</label>
          <select
            value={appliedFilters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            style={filterInputStyle}
          >
            <option value="">All categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div style={{ flex:'1 1 150px', minWidth:140 }}>
          <label style={labelStyle}>Stock Status</label>
          <select
            value={appliedFilters.stockStatus}
            onChange={(e) => handleFilterChange('stockStatus', e.target.value)}
            style={filterInputStyle}
          >
            <option value="">All stock</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>

        <div style={{ flex:'0 1 110px', minWidth:100 }}>
          <label style={labelStyle}>Min ₹</label>
          <input
            type="number" min="0" placeholder="0"
            value={appliedFilters.minPrice}
            onChange={(e) => handleFilterChange('minPrice', e.target.value)}
            style={filterInputStyle}
          />
        </div>

        <div style={{ flex:'0 1 110px', minWidth:100 }}>
          <label style={labelStyle}>Max ₹</label>
          <input
            type="number" min="0" placeholder="Any"
            value={appliedFilters.maxPrice}
            onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
            style={filterInputStyle}
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            style={{
              background:'#faf7f2', border:'1px solid #ddd', borderRadius:6,
              padding:'0.55rem 1rem', cursor:'pointer', fontSize:'0.82rem',
              fontWeight:500, color:'#666', whiteSpace:'nowrap',
            }}
          >
            ✕ Clear filters
          </button>
        )}
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
                  {hasActiveFilters
                    ? 'No products match these filters.'
                    : 'No products yet. Click "+ Add Product" to get started.'}
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
                    <td style={{ padding:'0.75rem 1rem' }}>
                      <div style={{ fontWeight:600, fontSize:'0.9rem' }}>
                        ₹{(Number(p.price) || 0).toLocaleString('en-IN')}
                      </div>
                      {p.discountEnabled && Number(p.discountPercent) > 0 && (
                        <div style={{ fontSize:'0.72rem', color:'#c0392b', marginTop:2 }}>
                          {p.discountPercent}% off (customers only)
                        </div>
                      )}
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
                          {Array.isArray(p.sizeStock) && p.sizeStock.some(s => Array.isArray(s.colors) && s.colors.length > 0) && (
                            <div style={{ color:'#735c00', marginTop:2, fontSize:'0.72rem' }}>
                              Colour variants set
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

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div style={{
              display:'flex', gap:'0.75rem', justifyContent:'center', alignItems:'center',
              padding:'1rem', borderTop:'1px solid #f0ebe3',
            }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  background:'#faf7f2', border:'1px solid #ddd', borderRadius:6,
                  padding:'0.45rem 1rem', cursor: page === 1 ? 'not-allowed' : 'pointer',
                  fontSize:'0.85rem', opacity: page === 1 ? 0.5 : 1,
                }}
              >← Prev</button>
              <span style={{ fontSize:'0.85rem', color:'#666' }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  background:'#faf7f2', border:'1px solid #ddd', borderRadius:6,
                  padding:'0.45rem 1rem', cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  fontSize:'0.85rem', opacity: page === totalPages ? 0.5 : 1,
                }}
              >Next →</button>
            </div>
          )}
        </div>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(26,16,6,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'1rem' }}>
          <div style={{ background:'#fff', borderRadius:12, width:'100%', maxWidth:760, maxHeight:'92vh', overflowY:'auto', boxShadow:'0 24px 48px rgba(0,0,0,0.18)' }}>

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
                  Resellers never receive a discount, regardless of the Discount setting below.
                  {form.sizeEnabled ? ' Any size with its own Reseller Rate below ignores this.' : ''}
                </p>
              </div>

              {/* Discount — product-level default, customers only */}
              <div style={{ marginBottom:'1.25rem', padding:'1rem', background:'#fff5f5', border:'1px solid #ffd6d6', borderRadius:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom: form.discountEnabled ? '0.85rem' : 0 }}>
                  <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', userSelect:'none' }}>
                    <div onClick={handleToggleDiscountEnabled}
                      style={{ width:44, height:24, borderRadius:12, cursor:'pointer', background: form.discountEnabled ? '#c0392b' : '#ddd', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
                      <div style={{ position:'absolute', top:2, left: form.discountEnabled ? 22 : 2, width:20, height:20, borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight:600, fontSize:'0.9rem', color:'#c0392b' }}>Discount this product</div>
                      <div style={{ fontSize:'0.77rem', color:'#aaa' }}>
                        Customers only — resellers always pay full/reseller price, never discounted
                      </div>
                    </div>
                  </label>
                </div>
                {form.discountEnabled && (
                  <div>
                    <label style={{ ...labelStyle, color:'#c0392b' }}>Discount % (product default)</label>
                    <input name="discountPercent" type="number" value={form.discountPercent} onChange={handleChange}
                      placeholder="e.g. 15" min="0" max="100" style={{ ...inputStyle, maxWidth:160, background:'#fff' }} />
                    <p style={{ margin:'6px 0 0', fontSize:'0.75rem', color:'#aaa' }}>
                      {form.sizeEnabled
                        ? 'Applies to every size below unless a size sets its own Discount override.'
                        : ''}
                    </p>
                  </div>
                )}
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
                  <p style={{ margin:'4px 0 0', fontSize:'0.75rem', color:'#aaa' }}>
                    Used only for products WITHOUT sizing, or sizes with no colour variants of their own.
                  </p>
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

              {/* ── Sizes (now fully delegated to SizeManager + ColorManager) ── */}
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

                    <SizeManager
                      sizeStock={form.sizeStock}
                      onChange={(nextSizeStock) => setForm(prev => ({ ...prev, sizeStock: nextSizeStock }))}
                      basePrice={Number(form.price) || 0}
                      baseResellerPrice={Number(form.resellerPrice) || 0}
                      baseDiscountEnabled={form.discountEnabled}
                      baseDiscountPercent={Number(form.discountPercent) || 0}
                      onUploadingChange={setSizeImagesUploading}
                      onError={setFormError}
                    />
                  </div>
                )}
              </div>

              {/* ── Colours — fully independent of the Sizes section above.
                   Use this for products that come in multiple colours but
                   aren't sized (e.g. earrings, chains). If a product needs
                   BOTH sizes and per-size colours, use the colour variants
                   inside each size above instead of this section. ── */}
              <div style={{ marginBottom:'1.5rem' }}>
                <label style={labelStyle}>Colours</label>

                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom: form.colorEnabled ? '1rem' : 0 }}>
                  <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', userSelect:'none' }}>
                    <div onClick={handleToggleColorEnabled}
                      style={{ width:44, height:24, borderRadius:12, cursor:'pointer', background: form.colorEnabled ? '#735c00' : '#ddd', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
                      <div style={{ position:'absolute', top:2, left: form.colorEnabled ? 22 : 2, width:20, height:20, borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight:600, fontSize:'0.9rem' }}>This product has colours</div>
                      <div style={{ fontSize:'0.77rem', color:'#aaa' }}>
                        {form.colorEnabled ? 'Customers will choose a colour before buying' : 'No colour selector will be shown to customers'}
                      </div>
                    </div>
                  </label>
                </div>

                {form.colorEnabled && (
                  <div style={{ padding:'1rem', background:'#faf7f2', border:'1px solid #e8e0d5', borderRadius:8 }}>
                    <p style={{ margin:'0 0 0.75rem', fontSize:'0.75rem', color:'#aaa' }}>
                      Add one or more colours — each gets its own stock count and photo.
                      Total stock across all colours becomes this product's stock automatically.
                    </p>
                    <div style={{ marginBottom:'0.75rem', fontSize:'0.8rem', color:'#735c00', fontWeight:600 }}>
                      Total stock across all colours: {form.colors.reduce((sum, c) => sum + (Number(c.stock) || 0), 0)}
                    </div>

                    <ColorManager
                      colors={form.colors}
                      onChange={(nextColors) => setForm(prev => ({ ...prev, colors: nextColors }))}
                      onUploadingChange={setColorImagesUploading}
                      onError={setFormError}
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.75rem', paddingTop:'1.25rem', borderTop:'1px solid #f0ebe3' }}>
                <button onClick={closeModal} disabled={saving} style={{ background:'#f5f5f5', border:'1px solid #ddd', borderRadius:8, padding:'0.7rem 1.8rem', cursor:'pointer', fontFamily:'inherit', fontSize:'0.9rem', fontWeight:500 }}>Cancel</button>
                <button onClick={handleSave} disabled={saving || imageUploading || sizeImagesUploading || colorImagesUploading} style={{ background: saving ? '#ccc' : '#735c00', color:'#fff', border:'none', borderRadius:8, padding:'0.7rem 2rem', cursor: saving ? 'not-allowed' : 'pointer', fontFamily:'inherit', fontSize:'0.9rem', fontWeight:600 }}>
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