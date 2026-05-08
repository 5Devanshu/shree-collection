import React, { useState } from 'react';
import { Link }       from 'react-router-dom';
import { useStore }   from '../context/StoreContext';
import { addToCart }  from '../api/client';
import './FeaturedGrid.css';

const FeaturedGrid = () => {
  // ✅ Use StoreContext — already fetched, already Array.isArray-guarded
  const { products, categories, loadingProds } = useStore();

  const [active,   setActive]   = useState('all');
  const [wishlist, setWishlist] = useState([]);

  const toggleWishlist = (id) =>
    setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // Safe filter — products is always [] from StoreContext, never undefined
  const filtered = active === 'all'
    ? products
    : products.filter(p =>
        p.category?.slug === active ||
        p.category?.name?.toLowerCase() === active.toLowerCase()
      );

  const displayList = filtered.length > 0 ? filtered : products;

  return (
    <section className="mobile-home">

      {/* ── Sale Banner ─────────────────────────── */}
      <div className="sale-banner">
        <div className="sale-banner-text">
          <span className="sale-label">Shree Collection</span>
          <h2 className="sale-title">BIG SALE</h2>
          <p className="sale-sub">Only On This Week</p>
          <p className="sale-discount">50% OFF</p>
        </div>
        <div className="sale-banner-deco">💍</div>
      </div>

      {/* ── Category Chips ───────────────────────── */}
      <div className="category-scroll">
        <button
          className={`cat-chip ${active === 'all' ? 'active' : ''}`}
          onClick={() => setActive('all')}
        >
          All
        </button>

        {/* ✅ categories is always [] from StoreContext */}
        {categories.map(cat => (
          <button
            key={cat._id}
            className={`cat-chip ${active === cat.slug ? 'active' : ''}`}
            onClick={() => setActive(cat.slug)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* ── Product Grid ────────────────────────── */}
      {loadingProds ? (
        <div className="grid-skeleton">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-card"/>)}
        </div>
      ) : displayList.length === 0 ? (
        <div className="no-products">
          <p>No products found.</p>
        </div>
      ) : (
        <div className="mobile-product-grid">
          {displayList.map(product => (
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
                  onError={e => { e.target.src = '/placeholder.png'; }}
                />

                {/* Wishlist heart */}
                <button
                  className={`mpc-wish ${wishlist.includes(product._id) ? 'wished' : ''}`}
                  onClick={e => { e.preventDefault(); toggleWishlist(product._id); }}
                  aria-label="Add to wishlist"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24"
                    fill={wishlist.includes(product._id) ? 'currentColor' : 'none'}
                    stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                  </svg>
                </button>

                {/* Badges */}
                {product.stockStatus === 'out_of_stock' && (
                  <span className="mpc-badge out">Out</span>
                )}
                {product.isFeatured && product.stockStatus !== 'out_of_stock' && (
                  <span className="mpc-badge hot">Hot</span>
                )}
                {product.discountEnabled && product.discountPercent > 0 && (
                  <span className="mpc-badge sale">{product.discountPercent}% OFF</span>
                )}
              </div>

              <div className="mpc-info">
                <p className="mpc-title">{product.title}</p>
                <div className="mpc-bottom">
                  <span className="mpc-price">
                    ₹{Number(
                      product.discountEnabled && product.discountedPrice
                        ? product.discountedPrice
                        : product.price
                    ).toLocaleString('en-IN')}
                  </span>
                  {product.discountEnabled && product.discountPercent > 0 && (
                    <span className="mpc-original-price">
                      ₹{Number(product.price).toLocaleString('en-IN')}
                    </span>
                  )}
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