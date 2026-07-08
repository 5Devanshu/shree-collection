import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate }        from 'react-router-dom';
import { useStore }          from '../context/StoreContext';
import { fetchProductById }  from '../api/client';
import NotifyMe              from './NotifyMe';
import './ProductDescription.css';
import ProductReviews from './ProductReviews';

// Sizes are stored as plain numbers (e.g. 2.4, 2.6, 7, 8.5) with no unit.
// Shree Collection sizes them all in inches, so every customer-facing
// rendering of a size number goes through this helper for a consistent
// `2.4"` display instead of a bare `2.4`.
const formatSize = (size) => `${size}"`;

const ProductDescription = () => {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { addToCart, categories, isReseller, customer } = useStore();

  const [product,       setProduct]       = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [activeImg,     setActiveImg]     = useState(0);
  const [selectedSize,  setSelectedSize]  = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [sizeError,     setSizeError]     = useState('');
  const [colorError,    setColorError]    = useState('');
  const [wished,        setWished]        = useState(false);
  const [addedToCart,   setAddedToCart]   = useState(false);

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
        setSelectedColor(null);
        setSizeError('');
        setColorError('');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  // Reset colour choice + gallery position whenever the size changes — a
  // colour picked for one size has no meaning for another.
  useEffect(() => {
    setSelectedColor(null);
    setColorError('');
    setActiveImg(0);
  }, [selectedSize]);

  useEffect(() => {
    setActiveImg(0);
  }, [selectedColor]);

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

  const showResellerPrice = isReseller && numericReseller > 0;
  const hasDiscount       = !showResellerPrice && product.discountEnabled && product.discountPercent > 0;

  const displayPrice = showResellerPrice
    ? numericReseller
    : hasDiscount
      ? numericDiscounted
      : numericPrice;

  // ── Sizing ────────────────────────────────────────────────────────────────
  const sizingActive = !!product.sizeEnabled && Array.isArray(product.sizes) && product.sizes.length > 0;
  const sizeLabel     = product.sizeLabel || 'Size';
  const hasSizeStock  = Array.isArray(product.sizeStock) && product.sizeStock.length > 0;

  const getSizeEntry = (size) => {
    if (!hasSizeStock || size === null || size === undefined) return null;
    return product.sizeStock.find(s => Number(s.size) === Number(size)) || null;
  };

  const selectedSizeEntry = getSizeEntry(selectedSize);

  // ── Colour variants for the selected size ────────────────────────────────
  const sizeColors        = Array.isArray(selectedSizeEntry?.colors) ? selectedSizeEntry.colors : [];
  const colorsRequired    = sizingActive && selectedSize !== null && sizeColors.length > 0;
  const getColorVariant   = (colorName) => sizeColors.find(c => c.color === colorName) || null;
  const selectedColorEntry = colorsRequired ? getColorVariant(selectedColor) : null;

  // Stock for the currently selected size (+colour, if this size has colours)
  const stockForSize = (size) => {
    const entry = getSizeEntry(size);
    if (!entry) return hasSizeStock ? 0 : (product.stock ?? 0);
    return Number(entry.stock) || 0;
  };
  const stockForColor = (colorEntry) => Number(colorEntry?.stock) || 0;

  const sizeRetailPrice = (entry) =>
    entry && Number(entry.price) > 0 ? Number(entry.price) : numericPrice;

  const activePrice = sizingActive && selectedSizeEntry && typeof selectedSizeEntry.displayPrice === 'number'
    ? selectedSizeEntry.displayPrice
    : displayPrice;

  const activeOriginal = sizingActive && selectedSizeEntry
    ? sizeRetailPrice(selectedSizeEntry)
    : numericPrice;

  const activeIsReseller = isReseller && sizingActive && selectedSizeEntry
    ? (Number(selectedSizeEntry.resellerPrice) > 0 ||
       (numericReseller > 0 && !(Number(selectedSizeEntry.price) > 0)))
    : showResellerPrice;

  const activeHasDiscount = !activeIsReseller && product.discountEnabled && product.discountPercent > 0 && activePrice < activeOriginal;

  const isSizeOut = (size) => {
    const entry = getSizeEntry(size);
    if (!entry) return true;
    return stockForSize(size) <= 0;
  };
  const outOfStock = sizingActive
    ? (hasSizeStock ? product.sizes.every(isSizeOut) : (product.stock ?? 0) === 0)
    : (product.stock ?? 0) === 0;

  // ── Image resolution ─────────────────────────────────────────────────────
  const selectedImage = colorsRequired
    ? (selectedColorEntry?.image || null)
    : (sizingActive && selectedSizeEntry?.displayImage ? selectedSizeEntry.displayImage : null);

  const displayImages = selectedImage
    ? [selectedImage, ...allImages.filter(img => img !== selectedImage)]
    : allImages;

  const category = (Array.isArray(categories) ? categories : [])
    .find(c => c.slug === product.categorySlug || c.id === product.categoryId);

  const prev = () => setActiveImg(i => (i - 1 + displayImages.length) % displayImages.length);
  const next = () => setActiveImg(i => (i + 1) % displayImages.length);

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchMove  = (e) => { touchEndX.current   = e.touches[0].clientX; };
  const onTouchEnd   = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) { diff > 0 ? next() : prev(); }
    touchStartX.current = null;
    touchEndX.current   = null;
  };

  const validateSelection = () => {
    let ok = true;
    if (sizingActive && selectedSize === null) {
      setSizeError(`Please select a ${sizeLabel.toLowerCase()}`);
      ok = false;
    } else {
      setSizeError('');
    }
    if (colorsRequired && !selectedColor) {
      setColorError('Please select a colour');
      ok = false;
    } else {
      setColorError('');
    }
    return ok;
  };

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
    if (!validateSelection()) return;
    addToCart(product, 1, activePrice, sizingActive ? selectedSize : undefined, colorsRequired ? selectedColor : undefined);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    if (!requireAuth()) return;
    if (!validateSelection()) return;
    addToCart(product, 1, activePrice, sizingActive ? selectedSize : undefined, colorsRequired ? selectedColor : undefined);
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

  // ── Size selector ──────────────────────────────────────────────────────────
  const SizeSelector = ({ mobile = false }) => {
    if (!sizingActive) return null;

    return (
      <div className={mobile ? 'mpd-section' : 'pd-size-section'} style={!mobile ? { marginTop: '1.5rem' } : undefined}>
        <div className={mobile ? 'mpd-size-header' : 'pd-size-header'}>
          <h3 className={mobile ? 'mpd-section-title' : 'label-md'}>{sizeLabel} <span style={{ fontWeight: 400, opacity: 0.6 }}>(inches)</span></h3>
        </div>
        <div className={mobile ? 'mpd-size-grid' : 'pd-size-grid'}>
          {product.sizes.map(s => {
            const entry     = getSizeEntry(s);
            const disabled  = hasSizeStock && stockForSize(s) <= 0;
            const chipPrice = typeof entry?.displayPrice === 'number' ? entry.displayPrice : null;
            const showChipPrice = chipPrice !== null && chipPrice !== displayPrice;

            return (
              <button
                key={s}
                type="button"
                disabled={disabled}
                title={formatSize(s)}
                className={`${mobile ? 'mpd-size-btn' : 'pd-size-btn'} ${selectedSize === s ? 'active' : ''}`}
                style={{
                  ...(disabled ? { opacity: 0.4, cursor: 'not-allowed', textDecoration: 'line-through' } : {}),
                  display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.2,
                }}
                onClick={() => { setSelectedSize(s); setSizeError(''); }}
              >
                <span>{formatSize(s)}</span>
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
        {!colorsRequired && sizingActive && selectedSizeEntry?.displayColor && (
          <p style={{ fontSize: '0.8rem', opacity: 0.75, marginTop: 8 }}>
            Colour: {selectedSizeEntry.displayColor}
          </p>
        )}
        {!colorsRequired && hasSizeStock && selectedSize !== null && stockForSize(selectedSize) > 0 && stockForSize(selectedSize) <= 5 && (
          <p style={{ color: '#92600e', fontSize: '0.8rem', marginTop: 8 }}>
            Only {stockForSize(selectedSize)} left in size {formatSize(selectedSize)}
          </p>
        )}
      </div>
    );
  };

  // ── Colour selector — appears only once a size WITH colour variants is picked ──
  const ColorSelector = ({ mobile = false }) => {
    if (!colorsRequired) return null;

    return (
      <div className={mobile ? 'mpd-section' : 'pd-size-section'} style={!mobile ? { marginTop: '1.25rem' } : undefined}>
        <div className={mobile ? 'mpd-size-header' : 'pd-size-header'}>
          <h3 className={mobile ? 'mpd-section-title' : 'label-md'}>
            Colour <span style={{ fontWeight: 400, opacity: 0.6 }}>for {formatSize(selectedSize)}</span>
          </h3>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {sizeColors.map(c => {
            const disabled = stockForColor(c) <= 0;
            return (
              <button
                key={c.color}
                type="button"
                disabled={disabled}
                title={c.color}
                onClick={() => { setSelectedColor(c.color); setColorError(''); }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  padding: '6px 10px', borderRadius: 8,
                  border: selectedColor === c.color ? '2px solid var(--primary, #735c00)' : '1px solid #ddd',
                  background: '#fff', cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.4 : 1,
                }}
              >
                {c.image ? (
                  <img src={c.image} alt={c.color} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6 }} />
                ) : (
                  <span
                    aria-hidden="true"
                    style={{ width: 20, height: 20, borderRadius: '50%', border: '1px solid rgba(0,0,0,0.15)', backgroundColor: c.color }}
                  />
                )}
                <span style={{ fontSize: '0.72rem' }}>{c.color}</span>
                {disabled && <span style={{ fontSize: '0.6rem', color: '#c0392b' }}>Out of stock</span>}
              </button>
            );
          })}
        </div>
        {colorError && (
          <p style={{ color: '#c0392b', fontSize: '0.8rem', marginTop: 8 }}>{colorError}</p>
        )}
        {selectedColorEntry && stockForColor(selectedColorEntry) > 0 && stockForColor(selectedColorEntry) <= 5 && (
          <p style={{ color: '#92600e', fontSize: '0.8rem', marginTop: 8 }}>
            Only {stockForColor(selectedColorEntry)} left in {selectedColorEntry.color}
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

        <div className="product-image-section">
          <div className="product-main-image-wrap"
            onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
            {displayImages.length > 0 ? (
              <img key={activeImg} src={displayImages[activeImg]} alt={product.title} className="product-full-image" />
            ) : (
              <div className="product-image-placeholder">💎</div>
            )}
            {activeHasDiscount && (
              <div className="product-discount-badge">{product.discountPercent}% OFF</div>
            )}
            {activeIsReseller && (
              <div className="product-discount-badge" style={{ background: '#2e7d32' }}>RESELLER</div>
            )}
            {displayImages.length > 1 && (
              <>
                <button className="gallery-arrow gallery-arrow--prev" onClick={prev}>‹</button>
                <button className="gallery-arrow gallery-arrow--next" onClick={next}>›</button>
              </>
            )}
          </div>

          {displayImages.length > 1 && (
            <div className="gallery-dots">
              {displayImages.map((_, i) => (
                <button key={i} className={`gallery-dot ${i === activeImg ? 'gallery-dot--active' : ''}`} onClick={() => setActiveImg(i)} />
              ))}
            </div>
          )}

          {displayImages.length > 1 && (
            <div className="gallery-thumbs">
              {displayImages.map((img, i) => (
                <button key={i} className={`gallery-thumb ${i === activeImg ? 'gallery-thumb--active' : ''}`} onClick={() => setActiveImg(i)}>
                  <img src={img} alt={`View ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

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

            <SizeSelector />
            <ColorSelector />

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
          {displayImages.length > 0 ? (
            <img key={activeImg} src={displayImages[activeImg]} alt={product.title} className="mpd-img" />
          ) : (
            <div className="mpd-placeholder">💎</div>
          )}
          {activeHasDiscount && (
            <div className="product-discount-badge">{product.discountPercent}% OFF</div>
          )}
          {activeIsReseller && (
            <div className="product-discount-badge" style={{ background: '#2e7d32' }}>RESELLER</div>
          )}
          {displayImages.length > 1 && (
            <>
              <button className="mpd-arrow mpd-arrow-l" onClick={prev}>‹</button>
              <button className="mpd-arrow mpd-arrow-r" onClick={next}>›</button>
              <div className="mpd-dots">
                {displayImages.map((_, i) => (
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

          <SizeSelector mobile />
          <ColorSelector mobile />

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