import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore }    from '../context/StoreContext';
import NotifyMe        from './NotifyMe';
import './ProductDescription.css';

const ProductDescription = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { getProductById, addToCart, categories } = useStore();
  const product    = getProductById(id);

  if (!product) return (
    <div className="product-description-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 24, paddingTop: 80 }}>
      <h2 className="headline-md">Product not found</h2>
      <Link to="/" className="btn btn-secondary">Back to Home</Link>
    </div>
  );

  const category = categories.find(c => c.slug === product.categorySlug);

  // Resolve display price
  const hasDiscount    = product.discountEnabled && product.discountPercent > 0;
  const displayPrice   = hasDiscount ? product.discountedPrice : product.price;
  const originalPrice  = product.price;
  const outOfStock     = product.stock === 0;

  return (
    <div className="product-description-page">
      <div className="product-split">

        {/* Image */}
        <div className="product-image-section">
          {product.image
            ? <img src={product.image} alt={product.title} className="product-full-image" />
            : <div style={{ width: '100%', height: 400, background: 'var(--surface-container-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>💎</div>
          }
        </div>

        {/* Info */}
        <div className="product-info-section">
          <div className="product-info-inner">

            {/* Breadcrumb */}
            <div style={{ marginBottom: 'var(--spacing-6)', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <Link to="/" className="label-md" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none' }}>Home</Link>
              <span style={{ color: 'var(--outline-variant)' }}>›</span>
              {category && <>
                <Link to={`/collections/${category.slug}`} className="label-md" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none' }}>{category.name}</Link>
                <span style={{ color: 'var(--outline-variant)' }}>›</span>
              </>}
              <span className="label-md">{product.title}</span>
            </div>

            <h1 className="display-lg title">{product.title}</h1>
            <p className="label-md material">{product.material}</p>

            {/* Price — with discount badge */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-4)', flexWrap: 'wrap' }}>
              <p className="headline-md price">₹{Number(displayPrice).toLocaleString()}</p>
              {hasDiscount && (
                <>
                  <p style={{ fontSize: '1rem', color: 'var(--on-surface-variant)', textDecoration: 'line-through' }}>
                    ₹{Number(originalPrice).toLocaleString()}
                  </p>
                  <span style={{
                    background: 'var(--primary)',
                    color: '#fff',
                    padding: '2px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                  }}>
                    {product.discountPercent}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Stock status */}
            <div style={{ marginBottom: 'var(--spacing-6)' }}>
              {product.stock > 5
                ? <span className="status-badge status-delivered">In Stock</span>
                : product.stock > 0
                  ? <span className="status-badge status-shipped">Only {product.stock} left</span>
                  : <span className="status-badge status-pending">Out of Stock</span>
              }
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

            {/* Actions */}
            {!outOfStock ? (
              <div className="product-actions-large">
                <button className="btn btn-primary" onClick={() => addToCart(product)}>
                  Add to Bag
                </button>
                <button className="btn btn-secondary" onClick={() => navigate('/checkout')}>
                  Buy Now
                </button>
              </div>
            ) : (
              <div className="product-actions-large">
                <button className="btn btn-secondary" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                  Out of Stock
                </button>
                {/* Notify Me form appears when out of stock */}
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