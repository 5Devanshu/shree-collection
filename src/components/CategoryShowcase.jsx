import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import './CategoryShowcase.css';

const CategoryShowcase = () => {
  const { categories, loadingProds } = useStore();
  const safeCategories = Array.isArray(categories) ? categories : [];

  // Only show categories the admin has marked active
  const activeCategories = safeCategories.filter(c => c.isActive !== false);

  if (loadingProds) {
    return (
      <section className="category-showcase">
        <div className="category-showcase-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="category-tile category-tile-skeleton" />
          ))}
        </div>
      </section>
    );
  }

  if (activeCategories.length === 0) {
    return null; // nothing to show — admin hasn't added categories yet
  }

  return (
    <section className="category-showcase">
      <div className="category-showcase-grid">
        {activeCategories.map(cat => {
          const id = cat.id || cat._id;
          return (
            <Link key={id} to={`/collections/${cat.slug}`} className="category-tile">
              <div className="category-tile-image-wrap">
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="category-tile-image"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="category-tile-placeholder">💎</div>
                )}
              </div>
              <span className="category-tile-label">{cat.name}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default CategoryShowcase;