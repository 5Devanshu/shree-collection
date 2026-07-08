import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import './ProductCard.css';

const ProductCard = ({
  id, _id, title, material,
  price, resellerPrice,
  displayPrice: backendDisplayPrice, isResellerPrice,
  discountEnabled, discountedPrice, discountPercent,
  imageUrl, image, stock, sizeEnabled, delay,
}) => {
  const navigate                           = useNavigate();
  const location                           = useLocation();
  const { addToCart, isReseller, customer } = useStore();

  const productId     = id || _id;
  const resolvedImage = imageUrl || (typeof image === 'string' ? image : image?.url) || '';

  const numericPrice      = parseFloat(price)          || 0;
  const numericDiscounted = parseFloat(discountedPrice) || 0;
  const numericReseller   = parseFloat(resellerPrice)   || 0;

  const showResellerPrice = isReseller && numericReseller > 0;
  const hasDiscount       = !showResellerPrice && discountEnabled && numericDiscounted > 0 && numericDiscounted < numericPrice;

  const displayPrice = showResellerPrice
    ? numericReseller
    : hasDiscount ? numericDiscounted : numericPrice;

  const outOfStock = (stock ?? 1) <= 0;

  // ── Auth guard ────────────────────────────────────────────────────────────
  // Customers and resellers can add to cart. Guests are redirected to login
  // with a ?redirect param so they return to the same page after signing in.
  const isLoggedIn = !!customer || isReseller;

  const requireAuth = () => {
    if (!isLoggedIn) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return false;
    }
    return true;
  };

  const cartItem = {
    id: productId, _id: productId, title, material,
    price:          showResellerPrice ? numericReseller : numericPrice,
    discountEnabled,
    discountedPrice: numericDiscounted,
    imageUrl:        resolvedImage,
    image:           resolvedImage,
    stock,
  };

  const handleAddToCart = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!requireAuth()) return;
    // Sized products need size selection — send to product detail page
    if (sizeEnabled) { navigate(`/product/${productId}`); return; }
    addToCart(cartItem);
  };

  const handleBuyNow = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!requireAuth()) return;
    // Sized products need size selection first
    if (sizeEnabled) { navigate(`/product/${productId}`); return; }
    addToCart(cartItem);
    navigate('/checkout');
  };

  return (
    <div className="product-card" style={{ animationDelay: `${delay || 0}s` }}>

      <div className="product-image-container">
        <Link to={`/product/${productId}`}>
          {resolvedImage
            ? <img src={resolvedImage} alt={title} className="product-image" />
            : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem', background:'var(--surface-container-low)' }}>💎</div>
          }
        </Link>

        {/* Discount badge */}
        {hasDiscount && discountPercent > 0 && (
          <div className="product-discount-badge">{discountPercent}% OFF</div>
        )}
        {showResellerPrice && (
          <div className="product-discount-badge" style={{ background: '#2e7d32' }}>RESELLER</div>
        )}
      </div>

      <div className="product-details">
        <Link to={`/product/${productId}`} style={{ textDecoration: 'none' }}>
          <h3 className="title">{title}</h3>
        </Link>

        {/* Material name intentionally not shown here — only on the
            Product Description page. Kept as a prop (still passed into
            cartItem above) since cart/checkout display it there. */}

        {/* Price */}
        {showResellerPrice ? (
          <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginTop: 4 }}>
            <span className="discounted-price" style={{ color: '#2e7d32' }}>₹{numericReseller.toLocaleString('en-IN')}</span>
            <span className="original-price">₹{numericPrice.toLocaleString('en-IN')}</span>
          </div>
        ) : hasDiscount ? (
          <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginTop: 4 }}>
            <span className="discounted-price">₹{numericDiscounted.toLocaleString('en-IN')}</span>
            <span className="original-price">₹{numericPrice.toLocaleString('en-IN')}</span>
          </div>
        ) : (
          <p className="price">₹{numericPrice.toLocaleString('en-IN')}</p>
        )}

        {/* Out of stock badge */}
        {outOfStock && (
          <span className="status-badge status-pending" style={{ alignSelf: 'flex-start', marginTop: 4 }}>
            Out of Stock
          </span>
        )}

        {/* "Only X left" low-stock nudge */}
        {!outOfStock && stock > 0 && stock <= 5 && (
          <span className="status-badge status-shipped" style={{ alignSelf: 'flex-start', marginTop: 4 }}>
            Only {stock} left
          </span>
        )}

        {/* Actions */}
        <div className="product-actions">
          <button
            className="btn-secondary"
            onClick={handleAddToCart}
            disabled={outOfStock}
            style={{ opacity: outOfStock ? 0.4 : 1 }}
          >
            {sizeEnabled ? 'Select Size' : 'Add to Bag'}
          </button>
          <button
            className="btn-primary"
            onClick={handleBuyNow}
            disabled={outOfStock}
            style={{ opacity: outOfStock ? 0.4 : 1 }}
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;