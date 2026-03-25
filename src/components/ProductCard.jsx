import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './ProductCard.css';

const ProductCard = ({ id, title, material, price, image, delay }) => {
  const navigate = useNavigate();

  return (
    <div 
      className="product-card"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="product-image-container">
        <Link to={`/product/${id || 1}`}>
          <img src={image} alt={title} className="product-image" />
        </Link>
      </div>
      <div className="product-details">
        <Link to={`/product/${id || 1}`} style={{textDecoration: 'none'}}>
          <h3 className="label-lg title">{title}</h3>
        </Link>
        <p className="label-sm material">{material}</p>
        <p className="label-lg price">{price}</p>
        <div className="product-actions" style={{display: 'flex', gap: '8px', marginTop: '16px'}}>
          <button className="btn-secondary" style={{flex: 1}}>Add to Bag</button>
          <button className="btn-primary" style={{flex: 1}} onClick={() => navigate('/checkout')}>Buy Now</button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
