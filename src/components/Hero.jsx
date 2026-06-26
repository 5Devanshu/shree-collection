import React from 'react';
import './Hero.css';
import Button from './Button';
import heroImage from '../assets/hero.jpeg';

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-banner-wrapper">
        <img
          src={heroImage}
          alt="Shree Collection - Lovingly Handmade Jewellery"
          className="hero-banner-image"
        />
      </div>
      <div className="hero-actions">
        <Button variant="primary">Explore Collection</Button>
      </div>
    </section>
  );
};

export default Hero;