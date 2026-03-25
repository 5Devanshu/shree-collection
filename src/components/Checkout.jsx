import React from 'react';
import './Checkout.css';
import product1 from '../assets/product_1_diamond.png';

const Checkout = () => {
  return (
    <div className="checkout-page">
      <div className="checkout-container">
        
        {/* Left Side: Form */}
        <div className="checkout-form-section">
          <h1 className="display-sm">Checkout</h1>
          <p className="body-md disclaimer">Complete your order securely.</p>
          
          <form className="checkout-form" onSubmit={(e) => e.preventDefault()}>
            <div className="form-section">
              <h2 className="label-lg section-title">Contact Information</h2>
              <div className="form-group">
                <input type="email" placeholder="Email Address" className="checkout-input" required />
              </div>
            </div>

            <div className="form-section">
              <h2 className="label-lg section-title">Shipping Address</h2>
              <div className="form-row">
                <input type="text" placeholder="First Name" className="checkout-input half" required />
                <input type="text" placeholder="Last Name" className="checkout-input half" required />
              </div>
              <div className="form-group">
                <input type="text" placeholder="Address Line 1" className="checkout-input" required />
              </div>
              <div className="form-group">
                <input type="text" placeholder="Apartment, suite, etc. (optional)" className="checkout-input" />
              </div>
              <div className="form-row">
                <input type="text" placeholder="City" className="checkout-input half" required />
                <input type="text" placeholder="Postal Code" className="checkout-input half" required />
              </div>
            </div>

            <div className="form-section">
              <h2 className="label-lg section-title">Payment</h2>
              <div className="form-group">
                <input type="text" placeholder="Card Number" className="checkout-input" required />
              </div>
              <div className="form-row">
                <input type="text" placeholder="Expiration Date (MM/YY)" className="checkout-input half" required />
                <input type="text" placeholder="Security Code" className="checkout-input half" required />
              </div>
            </div>

            <button type="submit" className="btn-primary complete-order-btn">Complete Order</button>
          </form>
        </div>

        {/* Right Side: Order Summary */}
        <div className="checkout-summary-section">
          <h2 className="label-lg section-title">Order Summary</h2>
          
          <div className="summary-items">
            <div className="summary-item">
              <img src={product1} alt="Product" className="summary-item-image" />
              <div className="summary-item-details">
                <h4 className="label-md">Lumina Diamond Solitaire</h4>
                <p className="label-sm">18K YELLOW GOLD</p>
                <p className="label-md">$4,200</p>
              </div>
            </div>
          </div>

          <div className="summary-totals">
            <div className="summary-row">
              <span className="body-md">Subtotal</span>
              <span className="body-md">$4,200.00</span>
            </div>
            <div className="summary-row">
              <span className="body-md">Shipping</span>
              <span className="body-md">Complimentary</span>
            </div>
            <div className="summary-row total">
              <span className="label-lg">Total</span>
              <span className="label-lg">$4,200.00</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Checkout;
