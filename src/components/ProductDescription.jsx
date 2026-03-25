import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ProductDescription.css';
import product1 from '../assets/product_1_diamond.png';
import product2 from '../assets/product_2_pearl.png';
import product3 from '../assets/product_3_emerald.png';

const MOCK_PRODUCTS = [
  { id: '1', title: 'Lumina Diamond Solitaire', material: '18K YELLOW GOLD', price: '$4,200', image: product1, description: 'An extraordinary solitaire ring featuring a brilliant-cut diamond mounted on our signature 18-karat yellow gold band. A statement of uncompromising perfection.' },
  { id: '2', title: 'Eclipse Pearl Drop', material: 'WHITE GOLD, SOUTH SEA PEARL', price: '$8,500', image: product2, description: 'Elevate any look with the Eclipse Pearl Drop earrings. Expertly matched South Sea pearls descend gracefully from minimalist white gold settings.' },
  { id: '3', title: 'Solstice Emerald Cuff', material: 'PLATINUM', price: '$12,000', image: product3, description: 'A masterpiece of architectural design, the Solstice cuff encapsulates a magnificent cushion-cut emerald within a structured platinum lattice.' }
];

const ProductDescription = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Find product or fallback to the first one
  const product = MOCK_PRODUCTS.find(p => p.id === id) || MOCK_PRODUCTS[0];

  return (
    <div className="product-description-page">
      <div className="product-split">
        <div className="product-image-section">
          <img src={product.image} alt={product.title} className="product-full-image" />
        </div>
        
        <div className="product-info-section">
          <div className="product-info-inner">
            <h1 className="display-md title">{product.title}</h1>
            <p className="label-lg material">{product.material}</p>
            <p className="display-sm price">{product.price}</p>
            
            <div className="product-description">
              <p className="body-lg">{product.description}</p>
            </div>
            
            <div className="product-details-list">
              <div className="detail-item">
                <span className="label-md">Delivery</span>
                <span className="body-md">Complimentary Express Shipping</span>
              </div>
              <div className="detail-item">
                <span className="label-md">Returns</span>
                <span className="body-md">30-day graceful returns</span>
              </div>
            </div>

            <div className="product-actions-large">
              <button className="btn-secondary add-to-bag">Add to Bag</button>
              <button className="btn-primary buy-now" onClick={() => navigate('/checkout')}>Buy Now</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDescription;
