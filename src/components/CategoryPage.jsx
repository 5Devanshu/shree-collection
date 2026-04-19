import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import ProductCard from './ProductCard';
import './CategoryPage.css';

const PRESET_RANGES = [
  { label: 'All Prices',          min: 0,      max: Infinity },
  { label: 'Under ₹5,000',        min: 0,      max: 5000     },
  { label: '₹5,000 – ₹25,000',    min: 5000,   max: 25000    },
  { label: '₹25,000 – ₹1,00,000', min: 25000,  max: 100000   },
  { label: 'Above ₹1,00,000',     min: 100000, max: Infinity  },
];

const CategoryPage = () => {
  const { category }                           = useParams();
  const { products, categories, loadingProds } = useStore();

  // ── Filter state ──────────────────────────────────────────────────────────
  const [priceMode,   setPriceMode]   = useState('preset'); // 'preset' | 'custom'
  const [presetIdx,   setPresetIdx]   = useState(0);
  const [customMin,   setCustomMin]   = useState('');
  const [customMax,   setCustomMax]   = useState('');
  const [customError, setCustomError] = useState('');
  const [stockOnly,   setStockOnly]   = useState(false);
  const [sortBy,      setSortBy]      = useState('default');

  const isAll       = !category || category === 'all';
  const categoryObj = categories.find(c => c.slug === category);
  const title       = isAll
    ? 'All Collections'
    : categoryObj?.name || (category.charAt(0).toUpperCase() + category.slice(1));
  const description = isAll
    ? 'Explore our complete collection of high-jewellery pieces.'
    : categoryObj?.description || `Explore our exclusive ${title.toLowerCase()} collection.`;

  // ── Resolve active price bounds ───────────────────────────────────────────
  const activeBounds = useMemo(() => {
    if (priceMode === 'custom') {
      const min = customMin !== '' ? parseFloat(customMin) : 0;
      const max = customMax !== '' ? parseFloat(customMax) : Infinity;
      return { min, max };
    }
    return PRESET_RANGES[presetIdx];
  }, [priceMode, presetIdx, customMin, customMax]);

  // ── Apply custom range ────────────────────────────────────────────────────
  const handleCustomApply = () => {
    const min = parseFloat(customMin);
    const max = parseFloat(customMax);

    if (customMin !== '' && isNaN(min)) {
      setCustomError('Enter a valid minimum price');
      return;
    }
    if (customMax !== '' && isNaN(max)) {
      setCustomError('Enter a valid maximum price');
      return;
    }
    if (customMin !== '' && customMax !== '' && min > max) {
      setCustomError('Minimum cannot exceed maximum');
      return;
    }
    setCustomError('');
    setPriceMode('custom');
  };

  const handlePresetSelect = (i) => {
    setPresetIdx(i);
    setPriceMode('preset');
    setCustomMin('');
    setCustomMax('');
    setCustomError('');
  };

  const handleClearCustom = () => {
    setCustomMin('');
    setCustomMax('');
    setCustomError('');
    setPriceMode('preset');
    setPresetIdx(0);
  };

  // ── Filtered + sorted products ────────────────────────────────────────────
  const displayed = useMemo(() => {
    // Safe check — ensure products is always an array
    const productList = Array.isArray(products) ? products : [];
    
    let list = isAll
      ? [...productList]
      : productList.filter(p => p.categorySlug === category);

    const { min, max } = activeBounds;
    list = list.filter(p => {
      const effectivePrice =
        p.discountEnabled && p.discountedPrice ? p.discountedPrice : p.price;
      return effectivePrice >= min && effectivePrice <= max;
    });

    if (stockOnly) list = list.filter(p => p.stock > 0);

    switch (sortBy) {
      case 'price-asc':
        list = [...list].sort((a, b) => {
          const pa = a.discountEnabled && a.discountedPrice ? a.discountedPrice : a.price;
          const pb = b.discountEnabled && b.discountedPrice ? b.discountedPrice : b.price;
          return pa - pb;
        });
        break;
      case 'price-desc':
        list = [...list].sort((a, b) => {
          const pa = a.discountEnabled && a.discountedPrice ? a.discountedPrice : a.price;
          const pb = b.discountEnabled && b.discountedPrice ? b.discountedPrice : b.price;
          return pb - pa;
        });
        break;
      case 'name':
        list = [...list].sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break;
    }

    return list;
  }, [products, category, isAll, activeBounds, stockOnly, sortBy]);

  if (loadingProds) {
    return (
      <div className="category-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p className="body-lg" style={{ color: 'var(--on-surface-variant)' }}>Loading collection…</p>
      </div>
    );
  }

  const isCustomActive = priceMode === 'custom';

  return (
    <div className="category-page">

      {/* Header */}
      <header className="category-header">
        <h1 className="display-lg">{title}</h1>
        <p className="body-lg">{description}</p>
        <p className="label-md" style={{ color: 'var(--on-surface-variant)', marginTop: 8 }}>
          {displayed.length} piece{displayed.length !== 1 ? 's' : ''}
        </p>
      </header>

      <div className="category-layout">

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <aside className="category-sidebar">

          {/* ── Price Range ─────────────────────────────────────────────── */}
          <div className="filter-group">
            <h3 className="label-md filter-group-title">Price Range</h3>

            {/* Preset radio options */}
            {PRESET_RANGES.map((r, i) => (
              <label key={i} className="filter-option">
                <input
                  type="radio"
                  name="price"
                  checked={priceMode === 'preset' && presetIdx === i}
                  onChange={() => handlePresetSelect(i)}
                />
                <span>{r.label}</span>
              </label>
            ))}

            {/* Custom range toggle */}
            <label className="filter-option" style={{ marginTop: 6 }}>
              <input
                type="radio"
                name="price"
                checked={isCustomActive}
                onChange={() => setPriceMode('custom')}
              />
              <span style={{ fontWeight: isCustomActive ? 600 : 400 }}>Custom Range</span>
            </label>

            {/* Custom range inputs — always visible, apply on button click */}
            <div className="custom-price-box">
              <div className="custom-price-inputs">
                <div className="custom-price-field">
                  <span className="custom-price-currency">₹</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Min"
                    value={customMin}
                    onChange={e => {
                      setCustomMin(e.target.value);
                      if (priceMode !== 'custom') setPriceMode('custom');
                    }}
                    className="custom-price-input"
                  />
                </div>
                <span className="custom-price-dash">—</span>
                <div className="custom-price-field">
                  <span className="custom-price-currency">₹</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Max"
                    value={customMax}
                    onChange={e => {
                      setCustomMax(e.target.value);
                      if (priceMode !== 'custom') setPriceMode('custom');
                    }}
                    className="custom-price-input"
                  />
                </div>
              </div>

              {customError && (
                <p className="custom-price-error">{customError}</p>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button
                  className="custom-price-apply"
                  onClick={handleCustomApply}
                >
                  Apply
                </button>
                {isCustomActive && (
                  <button
                    className="custom-price-clear"
                    onClick={handleClearCustom}
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Active custom range display */}
              {isCustomActive && (customMin !== '' || customMax !== '') && (
                <p className="custom-price-active-label">
                  {customMin !== '' ? `₹${Number(customMin).toLocaleString('en-IN')}` : '₹0'}
                  {' — '}
                  {customMax !== '' ? `₹${Number(customMax).toLocaleString('en-IN')}` : 'Any'}
                </p>
              )}
            </div>
          </div>

          {/* ── Availability ─────────────────────────────────────────────── */}
          <div className="filter-group">
            <h3 className="label-md filter-group-title">Availability</h3>
            <label className="filter-option">
              <input
                type="checkbox"
                checked={stockOnly}
                onChange={e => setStockOnly(e.target.checked)}
              />
              <span>In Stock Only</span>
            </label>
          </div>

          {/* ── Collections ──────────────────────────────────────────────── */}
          <div className="filter-group">
            <h3 className="label-md filter-group-title">Collections</h3>
            <Link
              to="/collections/all"
              className={`filter-link label-md ${isAll ? 'filter-link-active' : ''}`}
            >
              All Pieces
            </Link>
            {categories.map(c => (
              <Link
                key={c._id}
                to={`/collections/${c.slug}`}
                className={`filter-link label-md ${c.slug === category ? 'filter-link-active' : ''}`}
              >
                {c.name}
              </Link>
            ))}
          </div>

        </aside>

        {/* ── Main grid ───────────────────────────────────────────────────── */}
        <div className="category-main">

          {/* Sort bar */}
          <div className="sort-bar">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="sort-select label-md"
            >
              <option value="default">Sort: Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Name: A–Z</option>
            </select>
          </div>

          {/* Active filter summary */}
          {(priceMode !== 'preset' || presetIdx !== 0 || stockOnly) && (
            <div className="active-filters">
              <span className="label-md" style={{ color: 'var(--on-surface-variant)' }}>
                Active filters:
              </span>
              {priceMode === 'preset' && presetIdx !== 0 && (
                <span className="filter-tag">
                  {PRESET_RANGES[presetIdx].label}
                  <button onClick={() => handlePresetSelect(0)}>✕</button>
                </span>
              )}
              {isCustomActive && (
                <span className="filter-tag">
                  Custom range
                  <button onClick={handleClearCustom}>✕</button>
                </span>
              )}
              {stockOnly && (
                <span className="filter-tag">
                  In Stock Only
                  <button onClick={() => setStockOnly(false)}>✕</button>
                </span>
              )}
              <button
                className="clear-all-btn label-md"
                onClick={() => { handlePresetSelect(0); setStockOnly(false); }}
              >
                Clear All
              </button>
            </div>
          )}

          {/* Products */}
          {displayed.length === 0 ? (
            <div className="category-empty">
              <p className="body-lg">No pieces match your filters.</p>
              <button
                className="btn btn-secondary"
                style={{ marginTop: 16 }}
                onClick={() => { handlePresetSelect(0); setStockOnly(false); }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <section className="category-grid">
              {displayed.map((product, i) => (
                <ProductCard
                  key={product._id}
                  {...product}
                  delay={i * 0.04}
                />
              ))}
            </section>
          )}

        </div>
      </div>
    </div>
  );
};

export default CategoryPage;