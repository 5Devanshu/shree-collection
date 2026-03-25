import React from 'react';
import ProductCard from './ProductCard';
import './FeaturedGrid.css';
import product1 from '../assets/product_1_diamond.png';
import product2 from '../assets/product_2_pearl.png';
import product3 from '../assets/product_3_emerald.png';

const products = [
  { 
    id: 1, 
    title: 'Lumina Diamond Solitaire', 
    material: '18K YELLOW GOLD', 
    price: '$4,200', 
    image: product1,
    delay: 0
  },
  { 
    id: 2, 
    title: 'Eclipse Pearl Drop', 
    material: 'WHITE GOLD, SOUTH SEA PEARL', 
    price: '$8,500', 
    image: product2,
    delay: 0.1
  },
  { 
    id: 3, 
    title: 'Solstice Emerald Cuff', 
    material: 'PLATINUM', 
    price: '$12,000', 
    image: product3,
    delay: 0.2
  }
];

const FeaturedGrid = () => {
  return (
    <section className="featured-section">
      <div className="section-header">
        <h2 className="headline-md">Curated Pieces</h2>
        <a href="#all" className="view-all label-md">View All</a>
      </div>
      <div className="product-grid">
        {products.map((product) => (
          <ProductCard 
            key={product.id}
            {...product}
          />
        ))}
      </div>
    </section>
  );
};

export default FeaturedGrid;
