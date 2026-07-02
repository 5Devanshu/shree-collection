import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate }        from 'react-router-dom';
import { useStore }          from '../context/StoreContext';
import { fetchProductById }  from '../api/client';
import NotifyMe              from './NotifyMe';
import './ProductDescription.css';
import ProductReviews from './ProductReviews';

const ProductDescription = () => {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { addToCart, categories, isReseller, customer } = useStore();

  const [product,      setProduct]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [activeImg,    setActiveImg]    = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [sizeError,    setSizeError]    = useState('');
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
        setSelectedSize(null);
        setSizeError('');
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

  // ── Price resolution ──────────────────────────────────────────────────────
  const productId        = product.id || product._id;
  const allImages        = buildImages(product);
  const numericPrice     = parseFloat(product.price)        || 0;
  const numericReseller  = parseFloat(product.resellerPrice) || 0;
  const numericDiscounted = parseFloat(product.discountedPrice) || 0;

  // Reseller price takes priority if logged in as reseller and price is set
  const showResellerPrice = isReseller && numericReseller > 0;
  const hasDiscount       = !showResellerPrice && product.discountEnabled && product.discountPercent > 0;

  const displayPrice = showResellerPrice
    ? numericReseller
    : hasDiscount
      ? numericDiscounted
      : numericPrice;

  // ── Sizing — single source of truth: product.sizeEnabled ────────────────
  // No more guessing from category name ("ring" in slug, etc). Admin sets
  // this explicitly per product, so desktop and mobile now always agree.
  const sizingActive = !!product.sizeEnabled && Array.isArray(product.sizes) && product.sizes.length > 0;
  const sizeLabel     = product.sizeLabel || 'Size';
  const hasSizeStock  = Array.isArray(product.sizeStock) && product.sizeStock.length > 0;

  // Resolve stock for the currently selected size (falls back to top-level stock
  // when per-size stock isn't tracked for this product)
  const stockForSize = (size) => {
    if (!hasSizeStock) return product.stock ?? 0;
    const entry = product.sizeStock.find(s => Number(s.size) === Number(size));
    return entry ? Number(entry.stock) : 0;
  };

  // ── Size-wise rates ───────────────────────────────────────────────────────
  // Each sizeStock entry carries its own `displayPrice`, computed server-side
  // (product.service.js → applyDisplayPrice) so reseller/discount logic never
  // has to be duplicated here. `price` is the size's raw retail override (0 =
  // no override, this size just uses the product's base price).
  const getSizeEntry = (size) => {
    if (!hasSizeStock || size === null || size === undefined) return null;
    return product.sizeStock.find(s => Number(s.size) === Number(size)) || null;
  };

  // The "full" retail rate for a given size — used as the strike-through
  // original price when that size is discounted or reseller-priced.
  const sizeRetailPrice = (entry) =>
    entry && Number(entry.price) > 0 ? Number(entry.price) : numericPrice;

  const selectedSizeEntry = getSizeEntry(selectedSize);

  // Before a size is picked, show the base product price as a starting point.
  // Once a size is picked, its own displayPrice (already reseller/discount
  // aware from the backend) takes over.
  const activePrice = sizingActive && selectedSizeEntry && typeof selectedSizeEntry.displayPrice === 'number'
    ? selectedSizeEntry.displayPrice
    : displayPrice;

  const activeOriginal = sizingActive && selectedSizeEntry
    ? sizeRetailPrice(selectedSizeEntry)
    : numericPrice;

  // Reseller badge for the active price: either this size has its own
  // reseller rate, or (when the size has no retail override) the product's
  // flat reseller rate applies.
  const activeIsReseller = isReseller && sizingActive && selectedSizeEntry
    ? (Number(selectedSizeEntry.resellerPrice) > 0 ||
       (numericReseller > 0 && !(Number(selectedSizeEntry.price) > 0)))
    : showResellerPrice;

  const activeHasDiscount = !activeIsReseller && product.discountEnabled && product.discountPercent > 0 && activePrice < activeOriginal;

  const selectedSizeStock = selectedSize !== null ? stockForSize(selectedSize) : null;
  const outOfStock = sizingActive
    ? (hasSizeStock
        ? product.sizes.every(s => stockForSize(s) <= 0)   // every size is out
        : (product.stock ?? 0) === 0)
    : (product.stock ?? 0) === 0;

  const category   = (Array.isArray(categories) ? categories : [])
    .find(c => c.slug === product.categorySlug || c.id === product.categoryId);

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

  const validateSizeSelected = () => {
    if (sizingActive && selectedSize === null) {
      setSizeError(`Please select a ${sizeLabel.toLowerCase()}`);
      return false;
    }
    setSizeError('');
    return true;
  };

  // ── Auth guard — guests must log in before adding to cart ───────────────
  // Resellers and customers are both allowed. Admins are excluded (they
  // shouldn't be shopping). The redirect param brings them back after login.
  const isLoggedIn = !!customer || isReseller;

  const requireAuth = () => {
    if (!isLoggedIn) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return false;
    }
    return true;
  };

  const handleAddToCart = () => {
    if (!requireAuth()) return;
    if (!validateSizeSelected()) return;
    addToCart(product, 1, activePrice, sizingActive ? selectedSize : undefined);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    if (!requireAuth()) return;
    if (!validateSizeSelected()) return;
    addToCart(product, 1, activePrice, sizingActive ? selectedSize : undefined);
    navigate('/checkout');
  };

  // ── Price block — shared desktop + mobile ────────────────────────────────
  const PriceBlock = ({ mobile = false }) => {
    const priceClass   = mobile ? 'mpd-price'          : 'headline-md price';
    const rowClass     = mobile ? 'mpd-price-row'      : 'pd-price-row';
    const origClass    = mobile ? 'mpd-original-price' : 'pd-original-price';
    const pillClass    = mobile ? 'mpd-discount-pill'  : '';

    if (activeIsReseller) return (
      <div className={rowClass} style={{ alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <span className={priceClass} style={{ color: '#2e7d32' }}>
          ₹{activePrice.toLocaleString('en-IN')}
        </span>
        <span className={origClass}>
          ₹{activeOriginal.toLocaleString('en-IN')}
        </span>
        <span style={{ fontSize: '0.7rem', color: '#2e7d32', fontWeight: 700,
          letterSpacing: '0.08em', padding: '2px 8px', background: '#f0fdf4',
          border: '1px solid #bbf7d0', borderRadius: 4 }}>
          RESELLER PRICE
        </span>
      </div>
    );

    if (activeHasDiscount) return (
      <div className={rowClass}>
        <span className={mobile ? 'mpd-price' : 'headline-md'} style={{ color: 'var(--primary)' }}>
          ₹{activePrice.toLocaleString('en-IN')}
        </span>
        <span className={origClass}>
          ₹{activeOriginal.toLocaleString('en-IN')}
        </span>
        {mobile && <span className={pillClass}>{product.discountPercent}% OFF</span>}
      </div>
    );

    return (
      <p className={priceClass}>
        ₹{activePrice.toLocaleString('en-IN')}
      </p>
    );
  };

  // ── Size selector — shared desktop + mobile, identical logic both places ──
  // This single component fixes the original bug: previously the mobile view
  // had its own hardcoded RING_SIZES block, and desktop had no size UI at all.
  // Now both render this exact block, driven only by product.sizeEnabled.
  // Each chip also shows its own rate whenever that size's price differs from
  // the product's base price, so the customer sees size-wise pricing before
  // they even pick one.
  const SizeSelector = ({ mobile = false }) => {
    if (!sizingActive) return null;

    return (
      <div className={mobile ? 'mpd-section' : 'pd-size-section'} style={!mobile ? { marginTop: '1.5rem' } : undefined}>
        <div className={mobile ? 'mpd-size-header' : 'pd-size-header'}>
          <h3 className={mobile ? 'mpd-section-title' : 'label-md'}>{sizeLabel}</h3>
        </div>
        <div className={mobile ? 'mpd-size-grid' : 'pd-size-grid'}>
          {product.sizes.map(s => {
            const entry      = getSizeEntry(s);
            const stockLeft  = stockForSize(s);
            const disabled   = hasSizeStock && stockLeft <= 0;
            const chipPrice  = typeof entry?.displayPrice === 'number' ? entry.displayPrice : null;
            const showChipPrice = chipPrice !== null && chipPrice !== displayPrice;

            return (
              <button
                key={s}
                type="button"
                disabled={disabled}
                className={`${mobile ? 'mpd-size-btn' : 'pd-size-btn'} ${selectedSize === s ? 'active' : ''}`}
                style={{
                  ...(disabled ? { opacity: 0.4, cursor: 'not-allowed', textDecoration: 'line-through' } : {}),
                  display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.2,
                }}
                onClick={() => { setSelectedSize(s); setSizeError(''); }}
              >
                <span>{s}</span>
                {showChipPrice && !disabled && (
                  <span style={{ fontSize: '0.65rem', opacity: 0.75, fontWeight: 400 }}>
                    ₹{chipPrice.toLocaleString('en-IN')}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {sizeError && (
          <p style={{ color: '#c0392b', fontSize: '0.8rem', marginTop: 8 }}>{sizeError}</p>
        )}
        {hasSizeStock && selectedSize !== null && selectedSizeStock > 0 && selectedSizeStock <= 5 && (
          <p style={{ color: '#92600e', fontSize: '0.8rem', marginTop: 8 }}>
            Only {selectedSizeStock} left in size {selectedSize}
          </p>
        )}
      </div>
    );
  };

  // ── Specs block ───────────────────────────────────────────────────────────
  const SpecsBlock = ({ className = '' }) => (
    (product.sku || product.colour || product.plating || product.stoneType) ? (
      <div className={`product-details-list ${className}`} style={{ marginTop: '1rem' }}>
        {product.sku       && <div className="detail-item"><span className="label-md">SKU</span><span className="body-lg">{product.sku}</span></div>}
        {product.colour    && <div className="detail-item"><span className="label-md">Colour</span><span className="body-lg">{product.colour}</span></div>}
        {product.plating   && <div className="detail-item"><span className="label-md">Plating</span><span className="body-lg">{product.plating}</span></div>}
        {product.stoneType && <div className="detail-item"><span className="label-md">Stone Type</span><span className="body-lg">{product.stoneType}</span></div>}
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
            {activeHasDiscount && (
              <div className="product-discount-badge">{product.discountPercent}% OFF</div>
            )}
            {activeIsReseller && (
              <div className="product-discount-badge" style={{ background: '#2e7d32' }}>RESELLER</div>
            )}
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

            <PriceBlock />

            <div className="pd-stock">
              {!outOfStock
                ? (!hasSizeStock && product.stock > 0 && product.stock <= 5
                    ? <span className="status-badge status-shipped">Only {product.stock} left</span>
                    : <span className="status-badge status-delivered">In Stock</span>)
                : <span className="status-badge status-pending">Out of Stock</span>}
            </div>

            {product.description && (
              <p className="product-description body-lg">{product.description}</p>
            )}

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

            {/* ── Size selector now also rendered on desktop — this was missing entirely before ── */}
            <SizeSelector />

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
          {activeHasDiscount && (
            <div className="product-discount-badge">{product.discountPercent}% OFF</div>
          )}
          {activeIsReseller && (
            <div className="product-discount-badge" style={{ background: '#2e7d32' }}>RESELLER</div>
          )}
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

          <PriceBlock mobile />

          <div className="mpd-stock">
            {!outOfStock
              ? (!hasSizeStock && product.stock > 0 && product.stock <= 5
                  ? <span className="mpd-stock-badge low">Only {product.stock} left</span>
                  : <span className="mpd-stock-badge in">In Stock</span>)
              : <span className="mpd-stock-badge out">Out of Stock</span>}
          </div>

          {product.description && (
            <div className="mpd-section">
              <h3 className="mpd-section-title">Details</h3>
              <p className="mpd-desc">{product.description}</p>
            </div>
          )}

          {/* ── Same SizeSelector component as desktop — same data, same condition ── */}
          <SizeSelector mobile />

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
      <ProductReviews productId={productId} />
    </div>
  );
};

export default ProductDescription;