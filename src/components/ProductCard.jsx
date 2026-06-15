import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import './ProductCard.css';

const ProductCard = ({
  id, _id, title, material,
  price, resellerPrice,
  displayPrice: backendDisplayPrice, isResellerPrice,
  discountEnabled, discountedPrice, discountPercent,
  imageUrl, image, stock, delay,
}) => {
  const navigate             = useNavigate();
  const { addToCart, isReseller } = useStore();

  const productId     = id || _id;
  const resolvedImage = imageUrl || (typeof image === 'string' ? image : image?.url) || '';

  const numericPrice        = parseFloat(price)        || 0;
  const numericDiscounted   = parseFloat(discountedPrice) || 0;
  const numericReseller     = parseFloat(resellerPrice) || 0;
  const numericDisplay      = parseFloat(backendDisplayPrice) || 0;

  // Price logic:
  // 1. Reseller logged in + resellerPrice set → show resellerPrice
  // 2. Discount active → show discountedPrice
  // 3. Default → show price
  const showResellerPrice = isReseller && numericReseller > 0;
  const hasDiscount       = !showResellerPrice && discountEnabled && numericDiscounted > 0 && numericDiscounted < numericPrice;

  const displayPrice = showResellerPrice
    ? numericReseller
    : hasDiscount
      ? numericDiscounted
      : numericPrice;

  const outOfStock = stock === 0;

  const cartItem = {
    id, _id, title, material,
    price: showResellerPrice ? numericReseller : numericPrice,
    discountEnabled, discountedPrice: numericDiscounted,
    imageUrl: resolvedImage, image: resolvedImage, stock,
  };

  const handleAddToCart = (e) => {
    e.preventDefault(); e.stopPropagation();
    addToCart(cartItem);
  };

  const handleBuyNow = (e) => {
    e.preventDefault(); e.stopPropagation();
    addToCart(cartItem);
    navigate('/checkout');
  };

  return (
    <div className="product-card" style={{ animationDelay: `${delay || 0}s` }}>

      <div className="product-image-container">
        <Link to={`/product/${productId}`}>
          {resolvedImage ? (
            <img src={resolvedImage} alt={title} className="product-image" />
          ) : (
            <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.5rem', background:'var(--surface-container-low)' }}>💎</div>
          )}
        </Link>
        {hasDiscount && (
          <div style={{ position:'absolute', top:10, left:10, background:'var(--primary)', color:'#fff', fontSize:'0.65rem', fontWeight:700, padding:'3px 8px', letterSpacing:'0.06em' }}>
            {discountPercent}% OFF
          </div>
        )}
        {showResellerPrice && (
          <div style={{ position:'absolute', top:10, left:10, background:'#2e7d32', color:'#fff', fontSize:'0.65rem', fontWeight:700, padding:'3px 8px', letterSpacing:'0.06em' }}>
            RESELLER
          </div>
        )}
      </div>

      <div className="product-details">
        <Link to={`/product/${productId}`} style={{ textDecoration:'none' }}>
          <h3 className="title">{title}</h3>
        </Link>
        {material && <p className="material">{material}</p>}

        {/* Price display */}
        {showResellerPrice ? (
          <div style={{ marginTop:'var(--spacing-2)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
              <span className="discounted-price" style={{ color:'#2e7d32' }}>
                ₹{numericReseller.toLocaleString('en-IN')}
              </span>
              <span className="original-price">
                ₹{numericPrice.toLocaleString('en-IN')}
              </span>
            </div>
            <p style={{ fontSize:'0.68rem', color:'#2e7d32', margin:'2px 0 0', letterSpacing:'0.05em' }}>
              RESELLER PRICE
            </p>
          </div>
        ) : hasDiscount ? (
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:'var(--spacing-2)', flexWrap:'wrap' }}>
            <span className="discounted-price">₹{numericDiscounted.toLocaleString('en-IN')}</span>
            <span className="original-price">₹{numericPrice.toLocaleString('en-IN')}</span>
          </div>
        ) : (
          <p className="price">₹{numericPrice.toLocaleString('en-IN')}</p>
        )}

        {outOfStock && (
          <span className="status-badge status-pending" style={{ alignSelf:'flex-start', marginTop:6 }}>
            Out of Stock
          </span>
        )}

        <div className="product-actions">
          <button className="btn-secondary" onClick={handleAddToCart} disabled={outOfStock}
            style={{ opacity: outOfStock ? 0.4 : 1, cursor: outOfStock ? 'not-allowed' : 'pointer' }}>
            Add to Bag
          </button>
          <button className="btn-primary" onClick={handleBuyNow} disabled={outOfStock}
            style={{ opacity: outOfStock ? 0.4 : 1, cursor: outOfStock ? 'not-allowed' : 'pointer' }}>
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;