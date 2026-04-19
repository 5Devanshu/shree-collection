import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import ProductCard from './ProductCard';
import './FeaturedGrid.css';

const FeaturedGrid = () => {
  const { products, loadingProds } = useStore();

  // Pull featured products directly from MongoDB data
  const featured = products.filter(p => p.featured === true);

  // Loading state
  if (loadingProds) {
    return (
      <section className="featured-section">
        <div className="section-header">
          <h2 className="headline-md">Curated Pieces</h2>
        </div>
        <div style={{
          display: 'flex',
          gap: '2rem',
          maxWidth: 1400,
          margin: '0 auto',
        }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              flex: 1,
              aspectRatio: '1/1',
              background: 'var(--surface-container-low)',
              animation: 'pulse 1.5s ease infinite',
            }} />
          ))}
        </div>
      </section>
    );
  }

  // No featured products yet
  if (featured.length === 0) {
    return null;
  }

  return (
    <section className="featured-section">
      <div className="section-header">
        <h2 className="headline-md">Curated Pieces</h2>
        <Link to="/collections/all" className="view-all label-md">View All</Link>
      </div>
      <div className="product-grid">
        {featured.map((product, i) => (
          <ProductCard
            key={product._id}
            {...product}
            delay={i * 0.08}
          />
        ))}
      </div>
    </section>
  );
};

export default FeaturedGrid;