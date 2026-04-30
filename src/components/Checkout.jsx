import React, { useState, useEffect } from 'react';
import { useStore }    from '../context/StoreContext';
import { useCustomer } from '../context/CustomerContext';
import { initiatePhonePePayment } from '../api/client';
import './Checkout.css';

const Checkout = () => {
  const { cart, cartLoading, fetchCart } = useStore();
  const { customer } = useCustomer();

  const [form, setForm] = useState({
    email:    customer?.email || '',
    phone:    customer?.phone || '',
    name:     customer?.name  || '',
    line1:    '',
    line2:    '',
    city:     '',
    state:    '',
    pincode:  '',
  });

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // ── Load cart using StoreContext session ID ────────────────────────────────
  useEffect(() => { fetchCart(); }, [fetchCart]);

  // ── Pre-fill from logged-in customer ─────────────────────────────────────
  useEffect(() => {
    if (customer) {
      setForm(prev => ({
        ...prev,
        email: customer.email || prev.email,
        phone: customer.phone || prev.phone,
        name:  customer.name  || prev.name,
      }));
    }
  }, [customer]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!cart.items?.length) {
      setError('Your cart is empty. Please add items before checking out.');
      return;
    }

    setLoading(true);

    try {
      // Map cart items to what payment.controller.js validateCartService expects
      const items = cart.items.map(item => ({
        productId: item.product?._id || item.product,
        title:     item.title,
        price:     item.price,
        quantity:  item.quantity,
        image:     item.image || '',
      }));

      // ✅ Matches controller: { items, guestEmail, guestPhone, guestName, guestAddress }
      const res = await initiatePhonePePayment({
        items,
        guestEmail: form.email,
        guestPhone: form.phone,
        guestName:  form.name,
        guestAddress: {
          line1:   form.line1,
          line2:   form.line2,
          city:    form.city,
          state:   form.state,
          pincode: form.pincode,
        },
      });

      const { data } = res.data;

      if (!data) {
        setError('Payment gateway error. Please try again.');
        return;
      }

      // Save for CheckoutCallback page
      sessionStorage.setItem('merchantTransactionId', data.merchantTransactionId || '');
      sessionStorage.setItem('pendingOrder', JSON.stringify({
        merchantTransactionId: data.merchantTransactionId,
        guestEmail:    form.email,
        guestPhone:    form.phone,
        guestName:     form.name,
        guestAddress: {
          line1: form.line1, line2: form.line2,
          city:  form.city,  state: form.state, pincode: form.pincode,
        },
        items,
        subtotal:     cart.subtotal,
        shippingCost: cart.shippingCost || 0,
        total:        cart.total,
      }));

      // Redirect to PhonePe hosted page
      const redirectUrl = data.redirectUrl || data.checkoutUrl || data.paymentUrl;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        setError('No redirect URL returned. Please contact support.');
      }

    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Payment initiation failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <div className="checkout-container">

        {/* ── Left: Form ──────────────────────────────────────────────────── */}
        <div className="checkout-form-section">
          <h1 className="display-sm">Checkout</h1>
          <p className="body-md disclaimer">Complete your order securely.</p>

          {error && <div className="checkout-error">{error}</div>}

          <form className="checkout-form" onSubmit={handleSubmit}>

            {/* Contact Information */}
            <div className="form-section">
              <h2 className="label-lg section-title">Contact Information</h2>
              <div className="form-group">
                <input type="email" name="email" value={form.email}
                  onChange={handleChange} placeholder="Email Address"
                  className="checkout-input" required autoComplete="email" />
              </div>
              <div className="form-row">
                <input type="text" name="name" value={form.name}
                  onChange={handleChange} placeholder="Full Name"
                  className="checkout-input half" required autoComplete="name" />
                <input type="tel" name="phone" value={form.phone}
                  onChange={handleChange} placeholder="Phone Number"
                  className="checkout-input half" required autoComplete="tel" />
              </div>
            </div>

            {/* Shipping Address */}
            <div className="form-section">
              <h2 className="label-lg section-title">Shipping Address</h2>
              <div className="form-group">
                <input type="text" name="line1" value={form.line1}
                  onChange={handleChange} placeholder="Address Line 1"
                  className="checkout-input" required />
              </div>
              <div className="form-group">
                <input type="text" name="line2" value={form.line2}
                  onChange={handleChange} placeholder="Apartment, suite, etc. (optional)"
                  className="checkout-input" />
              </div>
              <div className="form-row">
                <input type="text" name="city" value={form.city}
                  onChange={handleChange} placeholder="City"
                  className="checkout-input half" required />
                <input type="text" name="state" value={form.state}
                  onChange={handleChange} placeholder="State"
                  className="checkout-input half" required />
              </div>
              <div className="form-group">
                <input type="text" name="pincode" value={form.pincode}
                  onChange={handleChange} placeholder="PIN Code"
                  className="checkout-input" required />
              </div>
            </div>

            {/* Payment */}
            <div className="form-section">
              <h2 className="label-lg section-title">Payment</h2>
              <div className="phonepe-payment-note">
                <span className="phonepe-badge">PhonePe</span>
                <p className="body-md">
                  You'll be redirected to PhonePe's secure checkout to pay via
                  UPI, Debit/Credit Card, or Net Banking.
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary complete-order-btn"
              disabled={loading || cartLoading || !cart.items?.length}
            >
              {loading     ? 'Processing…'    :
               cartLoading ? 'Loading cart…'  :
               !cart.items?.length ? 'Cart is empty' :
               `Proceed to Payment — ₹${(cart.total || 0).toLocaleString('en-IN')}`}
            </button>

          </form>
        </div>

        {/* ── Right: Order Summary ─────────────────────────────────────────── */}
        <div className="checkout-summary-section">
          <h2 className="label-lg section-title">Order Summary</h2>

          <div className="summary-items">
            {cartLoading ? (
              <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>
                Loading your cart…
              </p>
            ) : !cart.items?.length ? (
              <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>
                Your cart is empty.
              </p>
            ) : (
              cart.items.map((item, i) => (
                <div className="summary-item" key={i}>
                  {item.image && (
                    <img src={item.image} alt={item.title} className="summary-item-image" />
                  )}
                  <div className="summary-item-details">
                    <h4 className="label-md">{item.title}</h4>
                    {item.material && (
                      <p className="label-sm">{item.material.toUpperCase()}</p>
                    )}
                    <p className="label-md">
                      ₹{item.price?.toLocaleString('en-IN')}
                      {item.quantity > 1 && ` × ${item.quantity}`}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="summary-totals">
            <div className="summary-row">
              <span className="body-md">Subtotal</span>
              <span className="body-md">₹{(cart.subtotal || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="summary-row">
              <span className="body-md">Shipping</span>
              <span className="body-md">Complimentary</span>
            </div>
            <div className="summary-row total">
              <span className="label-lg">Total</span>
              <span className="label-lg">₹{(cart.total || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Checkout;