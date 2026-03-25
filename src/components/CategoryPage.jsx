import React from 'react';
import { useParams } from 'react-router-dom';
import ProductCard from './ProductCard';
import './CategoryPage.css';
import product1 from '../assets/product_1_diamond.png';
import product2 from '../assets/product_2_pearl.png';
import product3 from '../assets/product_3_emerald.png';

const CategoryPage = () => {
  const { category } = useParams();
  
  // Format category name for display
  const title = category 
    ? category.charAt(0).toUpperCase() + category.slice(1) 
    : 'Collection';

  // Specific products mapping
  const allProducts = [
    { id: 1, categorySlug: 'rings', title: 'Lumina Diamond Solitaire', material: '18K YELLOW GOLD', price: '$4,200', image: product1, delay: 0 },
    { id: 2, categorySlug: 'bangles', title: 'Eclipse Pearl Drop Bangle', material: 'WHITE GOLD, SOUTH SEA PEARL', price: '$8,500', image: product2, delay: 0 },
    { id: 3, categorySlug: 'necklaces', title: 'Solstice Emerald Necklace', material: 'PLATINUM', price: '$12,000', image: product3, delay: 0 },
    { id: 4, categorySlug: 'bracelets', title: 'Solstice Emerald Cuff', material: 'PLATINUM', price: '$12,000', image: product3, delay: 0 },
  ];

  const displayedProducts = allProducts.filter(p => !category || p.categorySlug === category);

  // Fallback if no specific products for category
  const productsToRender = displayedProducts.length > 0 ? displayedProducts : allProducts;

  return (
    <div className="category-page">
      <header className="category-header">
        <h1 className="display-lg">{title}</h1>
        <p className="body-lg">Explore our exclusive {title.toLowerCase()} collection, crafted with uncompromising precision.</p>
      </header>
      
      <section className="category-grid">
        {productsToRender.map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </section>
    </div>
  );
};

export default CategoryPage;
