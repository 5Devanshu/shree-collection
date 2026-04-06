import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import ProductCard from './ProductCard';
import './CategoryPage.css';

const PRICE_RANGES = [
  { label: 'All Prices',          min: 0,      max: Infinity },
  { label: 'Under ₹5,000',        min: 0,      max: 5000     },
  { label: '₹5,000 – ₹25,000',    min: 5000,   max: 25000    },
  { label: '₹25,000 – ₹1,00,000', min: 25000,  max: 100000   },
  { label: 'Above ₹1,00,000',     min: 100000, max: Infinity  },
];

const CategoryPage = () => {
  const { category }                    = useParams();
  const { products, categories, loadingProds } = useStore();

  const [priceRange, setPriceRange] = useState(0);
  const [stockOnly,  setStockOnly]  = useState(false);
  const [sortBy,     setSortBy]     = useState('default');

  const isAll       = !category || category === 'all';
  const categoryObj = categories.find(c => c.slug === category);

  const title = isAll
    ? 'All Collections'
    : categoryObj?.name || (category.charAt(0).toUpperCase() + category.slice(1));

  const description = isAll
    ? 'Explore our complete collection of high-jewellery pieces.'
    : categoryObj?.description || `Explore our exclusive ${title.toLowerCase()} collection.`;

  // ── Filter + sort from MongoDB products ──────────────────────────────────────
  const displayed = useMemo(() => {
    // Start with all products or filter by category slug
    let list = isAll
      ? [...products]
      : products.filter(p => p.categorySlug === category);

    // Price filter
    const { min, max } = PRICE_RANGES[priceRange];
    list = list.filter(p => {
      const effectivePrice = p.discountEnabled && p.discountedPrice ? p.discountedPrice : p.price;
      return effectivePrice >= min && effectivePrice <= max;
    });

    // Stock filter
    if (stockOnly) list = list.filter(p => p.stock > 0);

    // Sort
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
  }, [products, category, isAll, priceRange, stockOnly, sortBy]);

  // ── Loading state ─────────────────────────────────────────────────────────────
  if (loadingProds) {
    return (
      <div className="category-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p className="body-lg" style={{ color: 'var(--on-surface-variant)' }}>Loading collection…</p>
      </div>
    );
  }

  return (
    <div className="category-page">

      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <header className="category-header">
        <h1 className="display-lg">{title}</h1>
        <p className="body-lg">{description}</p>
        <p className="label-md" style={{ color: 'var(--on-surface-variant)', marginTop: 8 }}>
          {displayed.length} piece{displayed.length !== 1 ? 's' : ''}
        </p>
      </header>

      <div className="category-layout">

        {/* ── Sidebar ───────────────────────────────────────────────────────── */}
        <aside className="category-sidebar">

          {/* Price filter */}
          <div className="filter-group">
            <h3 className="label-md filter-group-title">Price Range</h3>
            {PRICE_RANGES.map((r, i) => (
              <label key={i} className="filter-option">
                <input
                  type="radio"
                  name="price"
                  checked={priceRange === i}
                  onChange={() => setPriceRange(i)}
                />
                <span>{r.label}</span>
              </label>
            ))}
          </div>

          {/* Stock filter */}
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

          {/* Category links — dynamically from MongoDB */}
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
                key={c._id}
                to={`/collections/${c.slug}`}
                className={`filter-option filter-link label-md ${c.slug === category ? 'filter-link-active' : ''}`}
              >
                {c.name}
              </Link>
            ))}
          </div>

        </aside>

        {/* ── Main grid ─────────────────────────────────────────────────────── */}
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

          {/* Empty state */}
          {displayed.length === 0 ? (
            <div className="category-empty">
              <p className="body-lg">No pieces match your current filters.</p>
              <button
                className="btn btn-secondary"
                style={{ marginTop: 16 }}
                onClick={() => { setPriceRange(0); setStockOnly(false); }}
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