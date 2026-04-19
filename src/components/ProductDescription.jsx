import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore }    from '../context/StoreContext';
import { fetchProductById } from '../api/client';
import NotifyMe        from './NotifyMe';
import './ProductDescription.css';

const ProductDescription = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { addToCart, categories } = useStore();

  const [product,   setProduct]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [activeImg, setActiveImg] = useState(0);

  // Swipe support
  const touchStartX = useRef(null);
  const touchEndX   = useRef(null);

  // Fetch product directly from API by ID — always fresh from MongoDB
  useEffect(() => {
    setLoading(true);
    fetchProductById(id)
      .then(res => {
        setProduct(res.data.data);
        setActiveImg(0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  // Keyboard arrow navigation - must be declared before early returns
  useEffect(() => {
    if (!product || loading) return;
    
    const allImages = [
      ...(product.image ? [product.image] : []),
      ...(product.images || []),
    ].filter(Boolean);

    const prev = () => setActiveImg(i => (i - 1 + allImages.length) % allImages.length);
    const next = () => setActiveImg(i => (i + 1) % allImages.length);

    const handleKey = (e) => {
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [product, loading]);

  if (loading) return (
    <div className="product-description-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p className="body-lg" style={{ color: 'var(--on-surface-variant)' }}>Loading…</p>
    </div>
  );

  if (!product) return (
    <div className="product-description-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 24, paddingTop: 80 }}>
      <h2 className="headline-md">Product not found</h2>
      <Link to="/" className="btn btn-secondary">Back to Home</Link>
    </div>
  );

  // Build image gallery — main image + any gallery images
  const allImages = [
    ...(product.image ? [product.image] : []),
    ...(product.images || []),
  ].filter(Boolean);

  const hasDiscount  = product.discountEnabled && product.discountPercent > 0;
  const displayPrice = hasDiscount ? product.discountedPrice : product.price;
  const outOfStock   = product.stock === 0;
  const category     = categories.find(c => c.slug === product.categorySlug);

  // Gallery navigation
  const prev = () => setActiveImg(i => (i - 1 + allImages.length) % allImages.length);
  const next = () => setActiveImg(i => (i + 1) % allImages.length);

  // Touch swipe handlers
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchMove  = (e) => { touchEndX.current = e.touches[0].clientX; };
  const onTouchEnd   = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) { diff > 0 ? next() : prev(); }
    touchStartX.current = null;
    touchEndX.current   = null;
  };

  return (
    <div className="product-description-page">
      <div className="product-split">

        {/* ── Left — Image Gallery ─────────────────────────────────────────── */}
        <div className="product-image-section">

          {/* Main image with swipe */}
          <div
            className="product-main-image-wrap"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {allImages.length > 0 ? (
              <img
                key={activeImg}
                src={allImages[activeImg]}
                alt={product.title}
                className="product-full-image"
              />
            ) : (
              <div className="product-image-placeholder">💎</div>
            )}

            {/* Discount badge */}
            {hasDiscount && (
              <div className="product-discount-badge">
                {product.discountPercent}% OFF
              </div>
            )}

            {/* Prev / Next arrows — only show if multiple images */}
            {allImages.length > 1 && (
              <>
                <button className="gallery-arrow gallery-arrow--prev" onClick={prev} aria-label="Previous image">
                  ‹
                </button>
                <button className="gallery-arrow gallery-arrow--next" onClick={next} aria-label="Next image">
                  ›
                </button>
              </>
            )}
          </div>

          {/* Dot indicators */}
          {allImages.length > 1 && (
            <div className="gallery-dots">
              {allImages.map((_, i) => (
                <button
                  key={i}
                  className={`gallery-dot ${i === activeImg ? 'gallery-dot--active' : ''}`}
                  onClick={() => setActiveImg(i)}
                  aria-label={`Image ${i + 1}`}
                />
              ))}
            </div>
          )}

          {/* Thumbnail strip */}
          {allImages.length > 1 && (
            <div className="gallery-thumbs">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  className={`gallery-thumb ${i === activeImg ? 'gallery-thumb--active' : ''}`}
                  onClick={() => setActiveImg(i)}
                >
                  <img src={img} alt={`View ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Right — Product Info ─────────────────────────────────────────── */}
        <div className="product-info-section">
          <div className="product-info-inner">

            {/* Breadcrumb */}
            <div style={{ marginBottom: 'var(--spacing-6)', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <Link to="/" className="label-md" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none' }}>Home</Link>
              <span style={{ color: 'var(--outline-variant)' }}>›</span>
              {category && (
                <>
                  <Link to={`/collections/${category.slug}`} className="label-md" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none' }}>
                    {category.name}
                  </Link>
                  <span style={{ color: 'var(--outline-variant)' }}>›</span>
                </>
              )}
              <span className="label-md">{product.title}</span>
            </div>

            <h1 className="display-lg title">{product.title}</h1>
            {product.material && <p className="label-md material">{product.material}</p>}

            {/* Price */}
            {hasDiscount ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', margin: 'var(--spacing-4) 0 var(--spacing-6)' }}>
                <p className="headline-md" style={{ color: 'var(--primary)' }}>
                  ₹{Number(displayPrice).toLocaleString('en-IN')}
                </p>
                <p style={{ fontSize: '1.1rem', color: 'var(--on-surface-variant)', textDecoration: 'line-through' }}>
                  ₹{Number(product.price).toLocaleString('en-IN')}
                </p>
              </div>
            ) : (
              <p className="headline-md price" style={{ margin: 'var(--spacing-4) 0 var(--spacing-6)' }}>
                ₹{Number(product.price).toLocaleString('en-IN')}
              </p>
            )}

            {/* Stock status */}
            <div style={{ marginBottom: 'var(--spacing-6)' }}>
              {product.stock > 5
                ? <span className="status-badge status-delivered">In Stock</span>
                : product.stock > 0
                  ? <span className="status-badge status-shipped">Only {product.stock} left</span>
                  : <span className="status-badge status-pending">Out of Stock</span>
              }
            </div>

            {/* Description */}
            {product.description && (
              <p className="product-description body-lg">{product.description}</p>
            )}

            {/* Spec details */}
            {product.details?.length > 0 && (
              <div className="product-details-list">
                {product.details.map((d, i) => (
                  <div key={i} className="detail-item">
                    <span className="label-md">{d.label}</span>
                    <span className="body-lg">{d.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            {!outOfStock ? (
              <div className="product-actions-large">
                <button
                  className="btn btn-primary"
                  onClick={() => addToCart(product)}
                >
                  Add to Bag
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => { addToCart(product); navigate('/checkout'); }}
                >
                  Buy Now
                </button>
              </div>
            ) : (
              <div className="product-actions-large">
                <button className="btn btn-secondary" disabled style={{ opacity: 0.5 }}>
                  Out of Stock
                </button>
                <NotifyMe productId={product._id} />
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDescription;