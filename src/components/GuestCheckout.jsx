import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { 
  initiatePhonePePayment,
  checkPhonePePaymentStatus
} from '../api/client';
import './GuestCheckout.css';

const GuestCheckout = () => {
  const navigate = useNavigate();
  const { cart, cartTotal, cartCount, clearCart } = useStore();
  
  const [step, setStep] = useState('details'); // 'details', 'address', 'payment'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form state for guest checkout (no login required)
  const [guestForm, setGuestForm] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [addressForm, setAddressForm] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  });

  const [paymentState, setPaymentState] = useState({
    merchantTransactionId: null,
    status: null,
  });

  // Empty cart state
  if (cartCount === 0) {
    return (
      <div className="guest-checkout-empty">
        <div className="guest-checkout-empty-inner">
          <p className="display-lg" style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            Your bag is empty
          </p>
          <p className="body-lg" style={{ color: 'var(--on-surface-variant)', marginBottom: '2rem' }}>
            Add pieces to your bag before checking out.
          </p>
          <button 
            className="btn btn-primary" 
            style={{ padding: '1rem 2rem' }}
            onClick={() => navigate('/collections/all')}
          >
            Explore Collection
          </button>
        </div>
      </div>
    );
  }

  // Calculate totals
  const SHIPPING_THRESHOLD = 500;
  const SHIPPING_CHARGE = 70;
  const shippingCost = cartTotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;
  const finalTotal = cartTotal + shippingCost;

  // Validation helpers
  const validateGuestDetails = () => {
    if (!guestForm.name.trim()) {
      setError('Please enter your full name');
      return false;
    }
    if (!guestForm.email.trim()) {
      setError('Please enter your email address');
      return false;
    }
    if (!guestForm.phone.trim() || guestForm.phone.length < 10) {
      setError('Please enter a valid phone number');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestForm.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const validateAddress = () => {
    if (!addressForm.line1.trim()) {
      setError('Please enter address line 1');
      return false;
    }
    if (!addressForm.city.trim()) {
      setError('Please enter city');
      return false;
    }
    if (!addressForm.state.trim()) {
      setError('Please enter state');
      return false;
    }
    if (!addressForm.pincode.trim() || addressForm.pincode.length < 5) {
      setError('Please enter valid pincode');
      return false;
    }
    return true;
  };

  // Step handlers
  const handleGuestDetailsNext = () => {
    setError('');
    if (validateGuestDetails()) {
      setStep('address');
    }
  };

  const handleAddressNext = () => {
    setError('');
    if (validateAddress()) {
      setStep('payment');
    }
  };

  const handleGoBack = () => {
    setError('');
    setSuccessMessage('');
    if (step === 'address') {
      setStep('details');
    } else if (step === 'payment') {
      setStep('address');
    }
  };

  // PhonePe Payment Handler
  const handlePhonePePayment = async () => {
    setError('');
    setLoading(true);

    try {
      // Prepare cart items
      const cartItems = (Array.isArray(cart) ? cart : []).map(item => ({
        productId: item._id,
        quantity: item.qty || 1,
        price: item.price,
      }));

      // Initiate PhonePe payment
      const response = await initiatePhonePePayment({
        items: cartItems,
        guestEmail: guestForm.email,
        guestPhone: guestForm.phone,
        guestName: guestForm.name,
        guestAddress: addressForm,
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to initiate payment');
      }

      const paymentData = response.data.data;
      
      // Store transaction details for confirmation
      setPaymentState({
        merchantTransactionId: paymentData.merchantTransactionId,
        status: 'initiated',
      });

      // Redirect to PhonePe payment page
      if (paymentData.redirectUrl) {
        window.location.href = paymentData.redirectUrl;
      } else {
        throw new Error('Payment redirect URL not received');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Failed to initiate payment. Please try again.');
      setLoading(false);
    }
  };

  // Handle payment success return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const merchantTxnId = params.get('merchantTransactionId');

    if (status === 'success' && merchantTxnId) {
      handlePaymentSuccess(merchantTxnId);
    }
  }, []);

  const handlePaymentSuccess = async (merchantTxnId) => {
    try {
      setLoading(true);

      // Verify payment status
      const statusResponse = await checkPhonePePaymentStatus(merchantTxnId);

      if (statusResponse.data.success) {
        // Payment verified - confirm order
        const response = await fetch(`${import.meta.env.VITE_API_URL}/payment/phonepe/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            merchantTransactionId: merchantTxnId,
            transactionId: merchantTxnId,
            guestEmail: guestForm.email,
            guestPhone: guestForm.phone,
            guestName: guestForm.name,
            guestAddress: addressForm,
            items: (Array.isArray(cart) ? cart : []).map(item => ({
              productId: item._id,
              quantity: item.qty || 1,
              price: item.price,
            })),
            subtotal: cartTotal,
            shippingCost,
            total: finalTotal,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to confirm order');
        }

        const orderData = await response.json();

        if (orderData.success) {
          setSuccessMessage(`✓ Order placed successfully!\n\nOrder ID: ${orderData.order.orderNumber}\n\nConfirmation email sent to ${guestForm.email}`);
          clearCart();
          
          // Redirect after delay
          setTimeout(() => {
            navigate('/');
          }, 3000);
        }
      }
    } catch (err) {
      console.error('Payment confirmation error:', err);
      setError(err.message || 'Failed to confirm payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="guest-checkout-page">
      <div className="guest-checkout-container">
        
        {/* Left — Form Sections */}
        <div className="guest-checkout-form-section">
          <h1 className="headline-md" style={{ marginBottom: '0.5rem' }}>
            Guest Checkout
          </h1>
          <p className="body-lg" style={{ color: 'var(--on-surface-variant)', marginBottom: '2.5rem' }}>
            Complete your order securely without creating an account.
          </p>

          {/* Step Indicators */}
          <div className="guest-checkout-steps">
            <div className={`step ${step === 'details' ? 'active' : 'completed'}`}>
              <div className="step-number">1</div>
              <div className="step-label">Contact Info</div>
            </div>
            <div className={`step ${step === 'address' ? 'active' : step === 'payment' ? 'completed' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">Address</div>
            </div>
            <div className={`step ${step === 'payment' ? 'active' : ''}`}>
              <div className="step-number">3</div>
              <div className="step-label">Payment</div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="guest-checkout-error">
              {error}
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="guest-checkout-success">
              {successMessage}
            </div>
          )}

          {/* Step 1: Contact Details */}
          {step === 'details' && (
            <div className="guest-checkout-section">
              <h2 className="checkout-section-title">Contact Information</h2>

              <div className="guest-checkout-field">
                <label>Full Name *</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={guestForm.name}
                  onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                  className="guest-checkout-input"
                />
              </div>

              <div className="guest-checkout-field">
                <label>Email Address *</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={guestForm.email}
                  onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
                  className="guest-checkout-input"
                />
              </div>

              <div className="guest-checkout-field">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={guestForm.phone}
                  onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                  className="guest-checkout-input"
                />
              </div>

              <button
                type="button"
                className="btn btn-primary guest-checkout-btn-next"
                onClick={handleGuestDetailsNext}
              >
                Continue to Address
              </button>
            </div>
          )}

          {/* Step 2: Address */}
          {step === 'address' && (
            <div className="guest-checkout-section">
              <h2 className="checkout-section-title">Shipping Address</h2>

              <div className="guest-checkout-field">
                <label>Address Line 1 *</label>
                <input
                  type="text"
                  placeholder="House No., Street Name"
                  value={addressForm.line1}
                  onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
                  className="guest-checkout-input"
                />
              </div>

              <div className="guest-checkout-field">
                <label>Address Line 2 (Optional)</label>
                <input
                  type="text"
                  placeholder="Apartment, suite, etc."
                  value={addressForm.line2}
                  onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })}
                  className="guest-checkout-input"
                />
              </div>

              <div className="guest-checkout-row">
                <div className="guest-checkout-field">
                  <label>City *</label>
                  <input
                    type="text"
                    placeholder="Mumbai"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="guest-checkout-input"
                  />
                </div>
                <div className="guest-checkout-field">
                  <label>State *</label>
                  <input
                    type="text"
                    placeholder="Maharashtra"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="guest-checkout-input"
                  />
                </div>
              </div>

              <div className="guest-checkout-field" style={{ maxWidth: 200 }}>
                <label>Pincode *</label>
                <input
                  type="text"
                  placeholder="400001"
                  value={addressForm.pincode}
                  onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                  className="guest-checkout-input"
                  maxLength={6}
                />
              </div>

              <div className="guest-checkout-buttons">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleGoBack}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAddressNext}
                >
                  Continue to Payment
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 'payment' && (
            <div className="guest-checkout-section">
              <h2 className="checkout-section-title">Payment Method</h2>

              <div className="payment-method-card selected">
                <div className="payment-method-icon">💳</div>
                <div className="payment-method-info">
                  <h3>PhonePe</h3>
                  <p>Fast & Secure Payment</p>
                </div>
              </div>

              <p style={{ color: 'var(--on-surface-variant)', marginTop: '1.5rem', fontSize: '0.9rem' }}>
                ✓ Secure payment gateway<br/>
                ✓ 30-day returns guarantee<br/>
                ✓ Complimentary shipping
              </p>

              <div className="guest-checkout-buttons">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleGoBack}
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-large"
                  onClick={handlePhonePePayment}
                  disabled={loading}
                  style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                >
                  {loading ? 'Processing...' : `Pay ₹${finalTotal.toLocaleString('en-IN')}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right — Order Summary */}
        <div className="guest-checkout-summary-section">
          <h2 className="headline-md" style={{ marginBottom: '2rem' }}>Order Summary</h2>

          <div className="summary-items">
            {(Array.isArray(cart) ? cart : []).map((item) => (
              <div key={item._id} className="summary-item">
                <div className="summary-item-image">
                  <img src={item.image || 'placeholder.jpg'} alt={item.title} />
                </div>
                <div className="summary-item-details">
                  <h4>{item.title}</h4>
                  <p className="summary-item-material">{item.material}</p>
                  <p className="summary-item-qty">Qty: {item.qty || 1}</p>
                </div>
                <div className="summary-item-price">
                  ₹{((item.price || 0) * (item.qty || 1)).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>

          <hr style={{ margin: '1.5rem 0', border: 'none', borderTop: '1px solid var(--outline)' }} />

          <div className="summary-totals">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{cartTotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span style={{ color: 'var(--primary)' }}>
                {shippingCost === 0 ? 'Complimentary' : `₹${shippingCost}`}
              </span>
            </div>
            <div className="summary-row summary-total">
              <span>Total</span>
              <span>₹{finalTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestCheckout;
