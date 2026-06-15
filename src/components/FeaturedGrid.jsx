import React, { useState } from 'react';
import { Link }     from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import './FeaturedGrid.css';

const FeaturedGrid = () => {
  const { products, categories, loadingProds } = useStore();
  const [active,   setActive]   = useState('all');
  const [wishlist, setWishlist] = useState([]);

  const toggleWishlist = (id) =>
    setWishlist(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const safeProducts   = Array.isArray(products)   ? products   : [];
  const safeCategories = Array.isArray(categories) ? categories : [];

  const filtered = active === 'all'
    ? safeProducts
    : safeProducts.filter(p =>
        p.category?.slug === active ||
        p.category?.name?.toLowerCase() === active.toLowerCase()
      );

  const displayList = filtered.length > 0 ? filtered : safeProducts;

  // Resolve image URL — Sequelize stores flat imageUrl
  const resolveImage = (p) =>
    p.imageUrl ||
    (typeof p.image === 'string' ? p.image : p.image?.url) ||
    '';

  return (
    <section className="mobile-home">

      {/* Sale Banner */}
      <div className="sale-banner">
        <div className="sale-banner-text">
          <span className="sale-label">Shree Collection</span>
          <h2 className="sale-title">BIG SALE</h2>
          <p className="sale-sub">Only On This Week</p>
          <p className="sale-discount">50% OFF</p>
        </div>
        <div className="sale-banner-deco">💍</div>
      </div>

      {/* Category Chips */}
      <div className="category-scroll">
        <button
          className={`cat-chip ${active === 'all' ? 'active' : ''}`}
          onClick={() => setActive('all')}
        >All</button>
        {safeCategories.map(cat => (
          <button
            key={cat.id}
            className={`cat-chip ${active === cat.slug ? 'active' : ''}`}
            onClick={() => setActive(cat.slug)}
          >{cat.name}</button>
        ))}
      </div>

      {/* Product Grid */}
      {loadingProds ? (
        <div className="grid-skeleton">
          {[1,2,3,4].map(i => <div key={i} className="skeleton-card"/>)}
        </div>
      ) : displayList.length === 0 ? (
        <p style={{ textAlign:'center', padding:'40px', color:'var(--on-surface-variant)' }}>
          No products found.
        </p>
      ) : (
        <div className="mobile-product-grid">
          {displayList.map(product => {
            const productId  = product.id || product._id;
            const imgSrc     = resolveImage(product);
            const isWished   = wishlist.includes(productId);

            return (
              <Link key={productId} to={`/product/${productId}`} className="mobile-product-card">
                <div className="mpc-image-wrap">
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={product.title}
                      className="mpc-image"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem', background:'var(--surface-container-low)' }}>
                      💎
                    </div>
                  )}
                  <button
                    className={`mpc-wish ${isWished ? 'wished' : ''}`}
                    onClick={e => { e.preventDefault(); toggleWishlist(productId); }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24"
                      fill={isWished ? 'currentColor' : 'none'}
                      stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                    </svg>
                  </button>
                  {product.stockStatus === 'out_of_stock' && <span className="mpc-badge out">Out</span>}
                  {product.isFeatured && product.stockStatus !== 'out_of_stock' && <span className="mpc-badge hot">Hot</span>}
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
                          ? product.discountedPrice : product.price
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
            );
          })}
        </div>
      )}
    </section>
  );
};

export default FeaturedGrid;