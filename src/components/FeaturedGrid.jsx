import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchProducts, fetchCategories } from '../api/client';
import './FeaturedGrid.css';

const SALE_BANNER = {
  title: 'BIG SALE',
  sub: 'Only On This Week',
  discount: '50% OFF',
};

const FeaturedGrid = () => {
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [active, setActive]         = useState('all');
  const [wishlist, setWishlist]     = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      fetchProducts().catch(() => ({ data: { products: [] } })),
      fetchCategories().catch(() => ({ data: [] })),
    ]).then(([prodRes, catRes]) => {
      setProducts(prodRes.data?.products || prodRes.data || []);
      setCategories(catRes.data || []);
      setLoading(false);
    });
  }, []);

  const toggleWishlist = (id) =>
    setWishlist((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const filtered = active === 'all'
    ? products
    : products.filter(p => p.category?.slug === active || p.category?.name?.toLowerCase() === active);

  return (
    <section className="mobile-home">

      {/* ── Sale Banner ─────────────────────────────────── */}
      <div className="sale-banner">
        <div className="sale-banner-text">
          <span className="sale-label">Jewelry Co.</span>
          <h2 className="sale-title">{SALE_BANNER.title}</h2>
          <p className="sale-sub">{SALE_BANNER.sub}</p>
          <p className="sale-discount">{SALE_BANNER.discount}</p>
        </div>
        <div className="sale-banner-deco">💍</div>
      </div>

      {/* ── Category Chips ───────────────────────────────── */}
      <div className="category-scroll">
        <button
          className={`cat-chip ${active === 'all' ? 'active' : ''}`}
          onClick={() => setActive('all')}
        >All</button>
        {categories.map(cat => (
          <button
            key={cat._id}
            className={`cat-chip ${active === cat.slug ? 'active' : ''}`}
            onClick={() => setActive(cat.slug)}
          >{cat.name}</button>
        ))}
        {/* Fallback static chips if no categories loaded */}
        {categories.length === 0 && ['Rings','Anklets','Necklaces','Earrings'].map(n => (
          <button
            key={n}
            className={`cat-chip ${active === n.toLowerCase() ? 'active' : ''}`}
            onClick={() => setActive(n.toLowerCase())}
          >{n}</button>
        ))}
      </div>

      {/* ── Product Grid ─────────────────────────────────── */}
      {loading ? (
        <div className="grid-skeleton">
          {[1,2,3,4].map(i => <div key={i} className="skeleton-card"/>)}
        </div>
      ) : (
        <div className="mobile-product-grid">
          {(filtered.length > 0 ? filtered : products).map(product => (
            <Link
              key={product._id}
              to={`/product/${product._id}`}
              className="mobile-product-card"
            >
              <div className="mpc-image-wrap">
                <img
                  src={product.image?.url || product.image || '/placeholder.png'}
                  alt={product.title}
                  className="mpc-image"
                />
                <button
                  className={`mpc-wish ${wishlist.includes(product._id) ? 'wished' : ''}`}
                  onClick={e => { e.preventDefault(); toggleWishlist(product._id); }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24"
                    fill={wishlist.includes(product._id) ? 'currentColor' : 'none'}
                    stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                  </svg>
                </button>
                {product.stockStatus === 'out_of_stock' && (
                  <span className="mpc-badge out">Out</span>
                )}
                {product.isFeatured && product.stockStatus !== 'out_of_stock' && (
                  <span className="mpc-badge hot">Hot</span>
                )}
              </div>
              <div className="mpc-info">
                <p className="mpc-title">{product.title}</p>
                <div className="mpc-bottom">
                  <span className="mpc-price">
                    ₹{Number(product.price).toLocaleString('en-IN')}
                  </span>
                  <div className="mpc-stars">
                    {'★★★★☆'}
                    <span className="mpc-rating-num">4.0</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

export default FeaturedGrid;