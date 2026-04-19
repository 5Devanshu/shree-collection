import React from 'react';
import './Hero.css';
import Button from './Button';
import heroImage from '../assets/hero_image.png';

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-content">
        <h2 className="display-lg hero-title">
          Shree <br/>Collection
        </h2>
        <p className="body-lg hero-text">
          A collection that transcends time. Discover exquisite high-jewelry pieces crafted with uncompromising precision, intentional asymmetry, and timeless elegance—designed for those who appreciate the extraordinary.
        </p>
        <div className="hero-actions">
          <Button variant="primary">Explore Collection</Button>
          <Button variant="tertiary">View Lookbook</Button>
        </div>
      </div>
      <div className="hero-image-wrapper">
        <div className="ambient-shadow hero-image-container">
          <img 
            src={heroImage} 
            alt="High Jewelry Necklace" 
            className="hero-image"
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;
