import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import ProductCard from './ProductCard';
import './CategoryPage.css';

// ─── Price presets — tuned for Shree Collection's actual price band ───────────
// Products currently range from ~₹200 to ~₹600. "Custom Range" lets the user
// type any bounds they want. Adjust these bands whenever your catalogue grows
// into a new price tier (e.g. add a ₹2,000+ band when you stock higher pieces).
const PRICE_RANGES = [
  { label: 'All Prices',        min: 0,    max: Infinity },
  { label: 'Under ₹500',        min: 0,    max: 500      },
  { label: '₹500 – ₹1,000',    min: 500,  max: 1000     },
  { label: '₹1,000 – ₹2,000',  min: 1000, max: 2000     },
  { label: 'Above ₹2,000',      min: 2000, max: Infinity },
  { label: 'Custom Range',      min: null, max: null      },
];

const CUSTOM_IDX = PRICE_RANGES.length - 1; // index of the "Custom Range" entry

const CategoryPage = () => {
  const { category }                           = useParams();
  const { products, categories, loadingProds } = useStore();

  // ── Filter state ──────────────────────────────────────────────────────────
  const [priceRange,   setPriceRange]   = useState(0);
  const [customMin,    setCustomMin]    = useState('');
  const [customMax,    setCustomMax]    = useState('');
  const [appliedMin,   setAppliedMin]   = useState(null);
  const [appliedMax,   setAppliedMax]   = useState(null);
  const [customError,  setCustomError]  = useState('');
  const [stockOnly,    setStockOnly]    = useState(false);
  const [sortBy,       setSortBy]       = useState('default');
  const customMinRef = useRef(null);

  // Focus the min-input whenever Custom Range is selected
  useEffect(() => {
    if (priceRange === CUSTOM_IDX) {
      setTimeout(() => customMinRef.current?.focus(), 60);
    }
  }, [priceRange]);

  const isAll       = !category || category === 'all';
  const categoryObj = categories.find(c => c.slug === category);
  const title       = isAll
    ? 'All Collections'
    : (categoryObj?.name || (category.charAt(0).toUpperCase() + category.slice(1)));
  const description = isAll
    ? 'Explore our complete collection, crafted with uncompromising precision.'
    : (categoryObj?.description || `Explore our exclusive ${title.toLowerCase()} collection.`);

  // ── Resolve active price bounds ───────────────────────────────────────────
  const activeBounds = useMemo(() => {
    if (priceRange === CUSTOM_IDX) {
      return { min: appliedMin ?? 0, max: appliedMax ?? Infinity };
    }
    return PRICE_RANGES[priceRange];
  }, [priceRange, appliedMin, appliedMax]);

  // ── Handle custom range apply ─────────────────────────────────────────────
  const handleApplyCustom = () => {
    setCustomError('');
    const min = customMin !== '' ? Number(customMin) : 0;
    const max = customMax !== '' ? Number(customMax) : Infinity;
    if (customMin !== '' && isNaN(min)) return setCustomError('Min must be a number');
    if (customMax !== '' && isNaN(max)) return setCustomError('Max must be a number');
    if (min > max && max !== Infinity)  return setCustomError('Min must be less than Max');
    setAppliedMin(min);
    setAppliedMax(max === Infinity ? null : max);
  };

  // ── Filtered + sorted product list ───────────────────────────────────────
  const displayed = useMemo(() => {
    let list = isAll ? products : products.filter(p => p.categorySlug === category);
    list = list.filter(p => {
      const price = Number(p.price) || 0;
      return price >= activeBounds.min && price <= activeBounds.max;
    });
    if (stockOnly) list = list.filter(p => (p.stock ?? 0) > 0 || p.stockStatus === 'in_stock' || p.stockStatus === 'low_stock');
    if (sortBy === 'price-asc')  list = [...list].sort((a, b) => Number(a.price) - Number(b.price));
    if (sortBy === 'price-desc') list = [...list].sort((a, b) => Number(b.price) - Number(a.price));
    if (sortBy === 'name')       list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [products, category, isAll, activeBounds, stockOnly, sortBy]);

  return (
    <div className="category-page">
      <header className="category-header">
        <h1 className="display-lg">{title}</h1>
        <p className="body-lg">{description}</p>
        <p className="label-md" style={{ color: 'var(--on-surface-variant)', marginTop: 8 }}>
          {displayed.length} piece{displayed.length !== 1 ? 's' : ''}
        </p>
      </header>

      <div className="category-layout">
        {/* ── Sidebar ───────────────────────────────────────────────────── */}
        <aside className="category-sidebar">

          {/* Price Range */}
          <div className="filter-group">
            <h3 className="label-md filter-group-title">Price Range</h3>
            {PRICE_RANGES.map((r, i) => (
              <label key={i} className="filter-option">
                <input
                  type="radio"
                  name="price"
                  checked={priceRange === i}
                  onChange={() => {
                    setPriceRange(i);
                    setCustomError('');
                    if (i !== CUSTOM_IDX) { setAppliedMin(null); setAppliedMax(null); }
                  }}
                />
                <span>{r.label}</span>
              </label>
            ))}

            {/* Custom min/max inputs — visible only when "Custom Range" selected */}
            {priceRange === CUSTOM_IDX && (
              <div className="custom-range-box">
                <div className="custom-range-inputs">
                  <div className="custom-range-field">
                    <span className="custom-range-symbol">₹</span>
                    <input
                      ref={customMinRef}
                      type="number"
                      min="0"
                      placeholder="Min"
                      value={customMin}
                      onChange={e => { setCustomMin(e.target.value); setCustomError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleApplyCustom()}
                      className="custom-range-input"
                    />
                  </div>
                  <span className="custom-range-dash">—</span>
                  <div className="custom-range-field">
                    <span className="custom-range-symbol">₹</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="Max"
                      value={customMax}
                      onChange={e => { setCustomMax(e.target.value); setCustomError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleApplyCustom()}
                      className="custom-range-input"
                    />
                  </div>
                </div>
                {customError && (
                  <p style={{ color: '#c0392b', fontSize: '0.75rem', margin: '4px 0 0' }}>{customError}</p>
                )}
                <button className="custom-range-apply" onClick={handleApplyCustom}>
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* Availability */}
          <div className="filter-group">
            <h3 className="label-md filter-group-title">Availability</h3>
            <label className="filter-option">
              <input type="checkbox" checked={stockOnly} onChange={e => setStockOnly(e.target.checked)} />
              <span>In Stock Only</span>
            </label>
          </div>

          {/* Collections quick-links */}
          <div className="filter-group">
            <h3 className="label-md filter-group-title">Collections</h3>
            <Link
              to="/collections/all"
              className={`filter-option filter-link label-md ${isAll ? 'filter-link-active' : ''}`}
            >
              All Pieces
            </Link>
            {categories.map(c => (
              <Link
                key={c.id}
                to={`/collections/${c.slug}`}
                className={`filter-option filter-link label-md ${c.slug === category ? 'filter-link-active' : ''}`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </aside>

        {/* ── Main grid ─────────────────────────────────────────────────── */}
        <div className="category-main">
          <div className="sort-bar">
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="sort-select label-md">
              <option value="default">Sort: Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Name: A–Z</option>
            </select>
          </div>

          {loadingProds ? (
            <div className="category-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="product-card-skeleton" />
              ))}
            </div>
          ) : displayed.length === 0 ? (
            <div className="category-empty">
              <p className="body-lg">No pieces match your current filters.</p>
              <button
                className="btn btn-secondary"
                style={{ marginTop: 16 }}
                onClick={() => { setPriceRange(0); setStockOnly(false); setCustomMin(''); setCustomMax(''); setAppliedMin(null); setAppliedMax(null); }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <section className="category-grid">
              {displayed.map((product, i) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  _id={product.id}
                  title={product.title}
                  material={product.material}
                  price={product.price}
                  resellerPrice={product.resellerPrice}
                  displayPrice={product.displayPrice}
                  isResellerPrice={product.isResellerPrice}
                  discountEnabled={product.discountEnabled}
                  discountedPrice={product.discountedPrice}
                  discountPercent={product.discountPercent}
                  imageUrl={product.imageUrl}
                  image={product.image}
                  stock={product.stock}
                  sizeEnabled={product.sizeEnabled}
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