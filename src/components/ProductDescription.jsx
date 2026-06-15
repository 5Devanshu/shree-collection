import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate }        from 'react-router-dom';
import { useStore }          from '../context/StoreContext';
import { fetchProductById }  from '../api/client';
import NotifyMe              from './NotifyMe';
import './ProductDescription.css';

const RING_SIZES = [4, 4.5, 5, 5.5, 6, 6.6, 7, 7.7, 8, 8.8];

const ProductDescription = () => {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { addToCart, categories } = useStore();

  const [product,      setProduct]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [activeImg,    setActiveImg]    = useState(0);
  const [selectedSize, setSelectedSize] = useState(5);
  const [wished,       setWished]       = useState(false);
  const [addedToCart,  setAddedToCart]  = useState(false);

  const touchStartX = useRef(null);
  const touchEndX   = useRef(null);

  useEffect(() => {
    setLoading(true);
    fetchProductById(id)
      .then(res => {
        const data = res.data?.product || res.data?.data || res.data;
        setProduct(data);
        setActiveImg(0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!product || loading) return;
    const allImages = buildImages(product);
    const prev = () => setActiveImg(i => (i - 1 + allImages.length) % allImages.length);
    const next = () => setActiveImg(i => (i + 1) % allImages.length);
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [product, loading]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const buildImages = (p) => [
    ...(p.imageUrl ? [p.imageUrl] : []),
    ...(p.image    ? [typeof p.image === 'string' ? p.image : p.image?.url] : []),
    ...(Array.isArray(p.gallery) ? p.gallery.map(g => g?.url || g).filter(Boolean) : []),
    ...(Array.isArray(p.images)  ? p.images.map(g => g?.url  || g).filter(Boolean) : []),
  ].filter(Boolean);

  if (loading) return (
    <div className="pd-loading-screen">
      <div className="pd-skeleton-img"/>
      <div className="pd-skeleton-lines">
        <div className="pd-skeleton-line w80"/>
        <div className="pd-skeleton-line w50"/>
        <div className="pd-skeleton-line w60"/>
      </div>
    </div>
  );

  if (!product) return (
    <div className="pd-not-found">
      <h2 className="headline-md">Product not found</h2>
      <Link to="/" className="btn btn-secondary">Back to Home</Link>
    </div>
  );

  // ── Resolved values ───────────────────────────────────────────────────────
  const productId    = product.id || product._id;
  const allImages    = buildImages(product);
  const hasDiscount  = product.discountEnabled && product.discountPercent > 0;
  const displayPrice = hasDiscount ? product.discountedPrice : product.price;
  const outOfStock   = product.stock === 0;
  const category     = (Array.isArray(categories) ? categories : [])
    .find(c => c.slug === product.categorySlug || c.id === product.categoryId);
  const isRingType   = product.category?.name?.toLowerCase().includes('ring') ||
                       category?.name?.toLowerCase().includes('ring') ||
                       product.categorySlug?.includes('ring');

  const prev = () => setActiveImg(i => (i - 1 + allImages.length) % allImages.length);
  const next = () => setActiveImg(i => (i + 1) % allImages.length);

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchMove  = (e) => { touchEndX.current   = e.touches[0].clientX; };
  const onTouchEnd   = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) { diff > 0 ? next() : prev(); }
    touchStartX.current = null;
    touchEndX.current   = null;
  };

  const handleAddToCart = () => {
    addToCart(product);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(product);
    navigate('/checkout');
  };

  // ── Shared specs block ────────────────────────────────────────────────────
  const SpecsBlock = ({ className = '' }) => (
    (product.sku || product.colour || product.plating || product.stoneType || product.sizes?.length > 0) ? (
      <div className={`product-details-list ${className}`} style={{ marginTop: '1rem' }}>
        {product.sku       && <div className="detail-item"><span className="label-md">SKU</span><span className="body-lg">{product.sku}</span></div>}
        {product.colour    && <div className="detail-item"><span className="label-md">Colour</span><span className="body-lg">{product.colour}</span></div>}
        {product.plating   && <div className="detail-item"><span className="label-md">Plating</span><span className="body-lg">{product.plating}</span></div>}
        {product.stoneType && <div className="detail-item"><span className="label-md">Stone Type</span><span className="body-lg">{product.stoneType}</span></div>}
        {product.sizes?.length > 0 && (
          <div className="detail-item">
            <span className="label-md">Sizes</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {product.sizes.map((s, i) => (
                <span key={i} style={{ padding: '2px 10px', border: '1px solid var(--outline)', borderRadius: 4, fontSize: '0.85rem' }}>{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    ) : null
  );

  return (
    <div className="product-description-page">

      {/* ══ DESKTOP ══════════════════════════════════════════════════════════ */}
      <div className="product-split">

        {/* Left — Image Gallery */}
        <div className="product-image-section">
          <div className="product-main-image-wrap"
            onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
            {allImages.length > 0 ? (
              <img key={activeImg} src={allImages[activeImg]} alt={product.title} className="product-full-image" />
            ) : (
              <div className="product-image-placeholder">💎</div>
            )}
            {hasDiscount && <div className="product-discount-badge">{product.discountPercent}% OFF</div>}
            {allImages.length > 1 && (
              <>
                <button className="gallery-arrow gallery-arrow--prev" onClick={prev}>‹</button>
                <button className="gallery-arrow gallery-arrow--next" onClick={next}>›</button>
              </>
            )}
          </div>

          {allImages.length > 1 && (
            <div className="gallery-dots">
              {allImages.map((_, i) => (
                <button key={i} className={`gallery-dot ${i === activeImg ? 'gallery-dot--active' : ''}`} onClick={() => setActiveImg(i)} />
              ))}
            </div>
          )}

          {allImages.length > 1 && (
            <div className="gallery-thumbs">
              {allImages.map((img, i) => (
                <button key={i} className={`gallery-thumb ${i === activeImg ? 'gallery-thumb--active' : ''}`} onClick={() => setActiveImg(i)}>
                  <img src={img} alt={`View ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right — Product Info */}
        <div className="product-info-section">
          <div className="product-info-inner">

            <div className="pd-breadcrumb">
              <Link to="/" className="label-md pd-crumb">Home</Link>
              <span className="pd-crumb-sep">›</span>
              {category && (
                <>
                  <Link to={`/collections/${category.slug}`} className="label-md pd-crumb">{category.name}</Link>
                  <span className="pd-crumb-sep">›</span>
                </>
              )}
              <span className="label-md">{product.title}</span>
            </div>

            <h1 className="display-lg title">{product.title}</h1>
            {product.material && <p className="label-md material">{product.material}</p>}

            {hasDiscount ? (
              <div className="pd-price-row">
                <p className="headline-md" style={{ color: 'var(--primary)' }}>₹{Number(displayPrice).toLocaleString('en-IN')}</p>
                <p className="pd-original-price">₹{Number(product.price).toLocaleString('en-IN')}</p>
              </div>
            ) : (
              <p className="headline-md price">₹{Number(product.price).toLocaleString('en-IN')}</p>
            )}

            <div className="pd-stock">
              {product.stock > 5
                ? <span className="status-badge status-delivered">In Stock</span>
                : product.stock > 0
                  ? <span className="status-badge status-shipped">Only {product.stock} left</span>
                  : <span className="status-badge status-pending">Out of Stock</span>}
            </div>

            {product.description && <p className="product-description body-lg">{product.description}</p>}

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

            <SpecsBlock />

            {!outOfStock ? (
              <div className="product-actions-large">
                <button className="btn btn-primary"   onClick={handleAddToCart}>Add to Bag</button>
                <button className="btn btn-secondary" onClick={handleBuyNow}>Buy Now</button>
              </div>
            ) : (
              <div className="product-actions-large">
                <button className="btn btn-secondary" disabled style={{ opacity: 0.5 }}>Out of Stock</button>
                <NotifyMe productId={productId} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ MOBILE ═══════════════════════════════════════════════════════════ */}
      <div className="mobile-pd">

        <div className="mpd-carousel"
          onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
          {allImages.length > 0 ? (
            <img key={activeImg} src={allImages[activeImg]} alt={product.title} className="mpd-img" />
          ) : (
            <div className="mpd-placeholder">💎</div>
          )}
          {hasDiscount && <div className="product-discount-badge">{product.discountPercent}% OFF</div>}
          {allImages.length > 1 && (
            <>
              <button className="mpd-arrow mpd-arrow-l" onClick={prev}>‹</button>
              <button className="mpd-arrow mpd-arrow-r" onClick={next}>›</button>
              <div className="mpd-dots">
                {allImages.map((_, i) => (
                  <span key={i} className={`mpd-dot ${i === activeImg ? 'mpd-dot-active' : ''}`} onClick={() => setActiveImg(i)} />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="mpd-info">
          <div className="mpd-title-row">
            <div>
              <h1 className="mpd-title">{product.title}</h1>
              {product.material && <p className="mpd-material">{product.material}</p>}
            </div>
            {product.isFeatured && <span className="mpd-tag">Hot</span>}
          </div>

          {hasDiscount ? (
            <div className="mpd-price-row">
              <span className="mpd-price">₹{Number(displayPrice).toLocaleString('en-IN')}</span>
              <span className="mpd-original-price">₹{Number(product.price).toLocaleString('en-IN')}</span>
              <span className="mpd-discount-pill">{product.discountPercent}% OFF</span>
            </div>
          ) : (
            <p className="mpd-price">₹{Number(product.price).toLocaleString('en-IN')}</p>
          )}

          <div className="mpd-stock">
            {product.stock > 5
              ? <span className="mpd-stock-badge in">In Stock</span>
              : product.stock > 0
                ? <span className="mpd-stock-badge low">Only {product.stock} left</span>
                : <span className="mpd-stock-badge out">Out of Stock</span>}
          </div>

          {product.description && (
            <div className="mpd-section">
              <h3 className="mpd-section-title">Details</h3>
              <p className="mpd-desc">{product.description}</p>
            </div>
          )}

          {isRingType && (
            <div className="mpd-section">
              <div className="mpd-size-header">
                <h3 className="mpd-section-title">Ring Size</h3>
                <button className="mpd-size-guide">Size Guide</button>
              </div>
              <div className="mpd-size-grid">
                {RING_SIZES.map(s => (
                  <button key={s} className={`mpd-size-btn ${selectedSize === s ? 'active' : ''}`}
                    onClick={() => setSelectedSize(s)}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {product.details?.length > 0 && (
            <div className="mpd-section">
              {product.details.map((d, i) => (
                <div key={i} className="mpd-detail-row">
                  <span className="mpd-detail-label">{d.label}</span>
                  <span className="mpd-detail-val">{d.value}</span>
                </div>
              ))}
            </div>
          )}

          <SpecsBlock />

          {category && (
            <div className="mpd-detail-row">
              <span className="mpd-detail-label">Category</span>
              <Link to={`/collections/${category.slug}`} className="mpd-detail-val mpd-cat-link">
                {category.name}
              </Link>
            </div>
          )}

          <div style={{ height: 96 }} />
        </div>

        {/* Fixed bottom bar */}
        <div className="mpd-bottom-bar">
          {!outOfStock ? (
            <>
              <button className={`mpd-wish-btn ${wished ? 'wished' : ''}`}
                onClick={() => setWished(w => !w)} aria-label="Wishlist">
                <svg width="20" height="20" viewBox="0 0 24 24"
                  fill={wished ? 'currentColor' : 'none'}
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                </svg>
              </button>
              <button className={`mpd-cart-btn ${addedToCart ? 'added' : ''}`} onClick={handleAddToCart}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/>
                </svg>
                {addedToCart ? '✓ Added!' : 'Add to Cart'}
              </button>
              <button className="mpd-buy-btn" onClick={handleBuyNow}>Buy Now</button>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', gap: 10 }}>
              <button className="mpd-cart-btn" disabled style={{ opacity: 0.5 }}>Out of Stock</button>
              <NotifyMe productId={productId} />
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default ProductDescription;