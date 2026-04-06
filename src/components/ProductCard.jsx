import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import './ProductCard.css';

const ProductCard = ({
  _id,
  title,
  material,
  price,
  discountEnabled,
  discountedPrice,
  discountPercent,
  image,
  stock,
  delay,
}) => {
  const navigate      = useNavigate();
  const { addToCart } = useStore();

  // ── Resolve price safely — always a number ────────────────────────────────
  const numericPrice     = parseFloat(price) || 0;
  const numericDiscounted = parseFloat(discountedPrice) || 0;

  const hasDiscount  = discountEnabled && numericDiscounted > 0 && numericDiscounted < numericPrice;
  const displayPrice = hasDiscount ? numericDiscounted : numericPrice;
  const outOfStock   = stock === 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      _id, title, material,
      price:           numericPrice,
      discountEnabled, discountedPrice: numericDiscounted,
      image, stock,
    });
  };

  const handleBuyNow = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      _id, title, material,
      price:           numericPrice,
      discountEnabled, discountedPrice: numericDiscounted,
      image, stock,
    });
    navigate('/checkout');
  };

  return (
    <div
      className="product-card"
      style={{ animationDelay: `${delay || 0}s` }}
    >
      {/* ── Image ──────────────────────────────────────────────────────────── */}
      <div className="product-image-container">
        <Link to={`/product/${_id}`}>
          {image
            ? <img src={image} alt={title} className="product-image" />
            : (
              <div style={{
                width: '100%', height: '100%',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                background: 'var(--surface-container-low)',
              }}>
                💎
              </div>
            )
          }
        </Link>

        {/* Discount badge on image */}
        {hasDiscount && (
          <div style={{
            position: 'absolute',
            top: 10, left: 10,
            background: 'var(--primary)',
            color: '#fff',
            fontSize: '0.65rem',
            fontWeight: 700,
            padding: '3px 8px',
            letterSpacing: '0.06em',
            fontFamily: 'var(--font-sans)',
          }}>
            {discountPercent}% OFF
          </div>
        )}
      </div>

      {/* ── Details ────────────────────────────────────────────────────────── */}
      <div className="product-details">
        <Link to={`/product/${_id}`} style={{ textDecoration: 'none' }}>
          <h3 className="title">{title}</h3>
        </Link>

        {material && <p className="material">{material}</p>}

        {/* Price */}
        {hasDiscount ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'var(--spacing-2)', flexWrap: 'wrap' }}>
            <span className="discounted-price">
              ₹{numericDiscounted.toLocaleString('en-IN')}
            </span>
            <span className="original-price">
              ₹{numericPrice.toLocaleString('en-IN')}
            </span>
          </div>
        ) : (
          <p className="price">₹{numericPrice.toLocaleString('en-IN')}</p>
        )}

        {/* Out of stock */}
        {outOfStock && (
          <span
            className="status-badge status-pending"
            style={{ alignSelf: 'flex-start', marginTop: 6 }}
          >
            Out of Stock
          </span>
        )}

        {/* Actions */}
        <div className="product-actions">
          <button
            className="btn-secondary"
            onClick={handleAddToCart}
            disabled={outOfStock}
            style={{ opacity: outOfStock ? 0.4 : 1, cursor: outOfStock ? 'not-allowed' : 'pointer' }}
          >
            Add to Bag
          </button>
          <button
            className="btn-primary"
            onClick={handleBuyNow}
            disabled={outOfStock}
            style={{ opacity: outOfStock ? 0.4 : 1, cursor: outOfStock ? 'not-allowed' : 'pointer' }}
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;