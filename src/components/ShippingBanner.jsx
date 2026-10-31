import React from 'react';
import './ShippingBanner.css';

const ShippingBanner = () => (
  <aside className="shipping-banner" aria-label="Shipping offer">
    <div className="shipping-marquee">
      <div className="shipping-marquee-track">
        {[0, 1].map((copy) => (
          <div className="shipping-marquee-copy" key={copy} aria-hidden={copy === 1}>
            <span className="shipping-banner-icon">
              <svg viewBox="0 0 24 24" role="presentation">
                <path d="M3 6.5h11v10H3zM14 10h3.8l3.2 3.2v3.3H14z" />
                <circle cx="7" cy="18" r="1.7" />
                <circle cx="18" cy="18" r="1.7" />
              </svg>
            </span>
            <span className="shipping-banner-copy">
              <strong>Free shipping</strong>
              <span>on orders above <b>₹500</b></span>
            </span>
            <span className="shipping-banner-sparkle">✦</span>
            <span className="shipping-banner-message">Thoughtfully styled, beautifully yours</span>
            <span className="shipping-banner-sparkle">✦</span>
            <span className="shipping-banner-message">Discover your next signature look</span>
            <span className="shipping-banner-sparkle">✦</span>
            <span className="shipping-banner-message">Elegance delivered to your doorstep</span>
            <span className="shipping-banner-sparkle">✦</span>
          </div>
        ))}
      </div>
    </div>
  </aside>
);

export default ShippingBanner;
