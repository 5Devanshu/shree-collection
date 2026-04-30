import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Checkout.css';

const API = import.meta.env.VITE_API_URL;

// ─── Helper: get or create a guest session ID ────────────────────────────────
const getSessionId = () => {
  let id = localStorage.getItem('cartSessionId');
  if (!id) {
    id = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem('cartSessionId', id);
  }
  return id;
};

const Checkout = () => {
  const navigate = useNavigate();

  // ── Cart state ──────────────────────────────────────────────────────────────
  const [cart, setCart]         = useState({ items: [], subtotal: 0, shippingCost: 0, total: 0 });
  const [cartLoading, setCartLoading] = useState(true);

  // ── Form state ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    email:        '',
    firstName:    '',
    lastName:     '',
    addressLine1: '',
    addressLine2: '',
    city:         '',
    postalCode:   '',
  });

  // ── PhonePe iframe state ─────────────────────────────────────────────────────
  const [checkoutUrl,     setCheckoutUrl]     = useState(null);   // iframe src
  const [merchantOrderId, setMerchantOrderId] = useState(null);   // used in /confirm
  const [validatedItems,  setValidatedItems]  = useState([]);
  const [totals,          setTotals]          = useState({});

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // ── Step tracker: 'form' | 'payment' | 'success' ────────────────────────────
  const [step, setStep] = useState('form');

  // ── Load cart on mount ───────────────────────────────────────────────────────
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await fetch(`${API}/cart`, {
          headers: { 'x-session-id': getSessionId() },
        });
        const data = await res.json();
        if (data.success && data.cart?.items?.length > 0) {
          setCart(data.cart);
        }
      } catch {
        setError('Could not load your cart. Please refresh.');
      } finally {
        setCartLoading(false);
      }
    };
    fetchCart();
  }, []);

  // ── Listen for PhonePe iframe postMessage (payment done / user returns) ──────
  useEffect(() => {
    const handleMessage = (event) => {
      // PhonePe may post a message on completion — use as a trigger to confirm
      if (event.data?.status === 'SUCCESS' || event.data?.code === 'PAYMENT_SUCCESS') {
        handleConfirm();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [merchantOrderId, validatedItems, totals]); // eslint-disable-line

  // ── Form field handler ───────────────────────────────────────────────────────
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  // ── Step 1: Submit form → call /initiate → show iframe ──────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (cart.items.length === 0) {
      setError('Your cart is empty. Add items before checking out.');
      return;
    }

    setLoading(true);
    try {
      // Map cart items to the shape the backend validateCartService expects
      const items = cart.items.map((i) => ({
        productId: i.product,
        price:     i.price,
        quantity:  i.quantity,
      }));

      const res = await fetch(`${API}/checkout/initiate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, email: form.email }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message || 'Could not initiate payment. Please try again.');
        return;
      }

      // Store everything needed for the /confirm step
      setCheckoutUrl(data.checkoutUrl);
      setMerchantOrderId(data.merchantOrderId);
      setValidatedItems(data.validatedItems);
      setTotals({
        subtotal:     data.subtotal,
        shippingCost: data.shippingCost,
        total:        data.total,
      });

      // Move to payment step — iframe replaces the form
      setStep('payment');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Confirm payment → call /confirm → place order ───────────────────
  // Called after PhonePe redirects back OR user clicks "I've completed payment"
  const handleConfirm = async () => {
    if (!merchantOrderId) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API}/checkout/confirm`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantOrderId,
          email:          form.email,
          shippingAddress: {
            firstName:    form.firstName,
            lastName:     form.lastName,
            addressLine1: form.addressLine1,
            addressLine2: form.addressLine2,
            city:         form.city,
            postalCode:   form.postalCode,
          },
          validatedItems,
          ...totals,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        // Payment not yet completed — give user a clear message
        setError(
          data.state === 'PENDING'
            ? 'Payment is still being processed. Please wait a moment and try again.'
            : data.message || 'Payment could not be confirmed. Please contact support.'
        );
        return;
      }

      // Clear cart and redirect to success
      await fetch(`${API}/cart/clear`, {
        method: 'DELETE',
        headers: { 'x-session-id': getSessionId() },
      });

      setStep('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setError('Could not confirm your order. Please contact support with your Order ID.');
    } finally {
      setLoading(false);
    }
  };

  // ── Poll status manually (fallback if iframe postMessage doesn't fire) ───────
  const handleCheckStatus = async () => {
    if (!merchantOrderId) return;
    setLoading(true);
    setError('');

    try {
      const res  = await fetch(`${API}/checkout/status/${merchantOrderId}`);
      const data = await res.json();

      if (data.success && data.state === 'COMPLETED') {
        await handleConfirm();
      } else if (data.state === 'FAILED') {
        setError('Your payment failed. Please go back and try again.');
      } else {
        setError('Payment is still pending. Please wait a moment, then click "Check Payment Status" again.');
      }
    } catch {
      setError('Could not check payment status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER: SUCCESS
  // ────────────────────────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="checkout-page">
        <div className="checkout-success">
          <div className="success-icon">✓</div>
          <h1 className="display-sm">Order Confirmed!</h1>
          <p className="body-md">
            Thank you, {form.firstName}! A confirmation email has been sent to{' '}
            <strong>{form.email}</strong>.
          </p>
          <p className="body-md success-amount">
            Total charged: ₹{(totals.total || 0).toLocaleString('en-IN')}
          </p>
          <button className="btn-primary" onClick={() => navigate('/')}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER: PAYMENT STEP (PhonePe iframe)
  // ────────────────────────────────────────────────────────────────────────────
  if (step === 'payment') {
    return (
      <div className="checkout-page">
        <div className="checkout-container checkout-payment-step">
          <div className="payment-header">
            <button
              className="btn-back"
              onClick={() => { setStep('form'); setCheckoutUrl(null); setError(''); }}
            >
              ← Back
            </button>
            <h1 className="display-sm">Complete Payment</h1>
            <p className="body-md disclaimer">
              Secure payment powered by PhonePe. Pay via UPI, Card, or Net Banking.
            </p>
          </div>

          {/* PhonePe Checkout iframe */}
          <div className="phonepe-iframe-wrapper">
            <iframe
              src={checkoutUrl}
              title="PhonePe Checkout"
              className="phonepe-iframe"
              allow="payment"
            />
          </div>

          {/* Fallback for when PhonePe redirect brings user back */}
          <div className="payment-fallback">
            <p className="body-md">
              Already completed payment on PhonePe?
            </p>
            {error && <p className="checkout-error">{error}</p>}
            <div className="payment-fallback-actions">
              <button
                className="btn-primary"
                onClick={handleCheckStatus}
                disabled={loading}
              >
                {loading ? 'Checking…' : 'Check Payment Status'}
              </button>
              <button
                className="btn-secondary"
                onClick={() => { setStep('form'); setCheckoutUrl(null); setError(''); }}
              >
                Go Back & Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER: FORM STEP
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="checkout-page">
      <div className="checkout-container">

        {/* ── Left: Form ─────────────────────────────────────────────────── */}
        <div className="checkout-form-section">
          <h1 className="display-sm">Checkout</h1>
          <p className="body-md disclaimer">Complete your order securely.</p>

          {error && <div className="checkout-error">{error}</div>}

          <form className="checkout-form" onSubmit={handleSubmit}>

            {/* Contact Information */}
            <div className="form-section">
              <h2 className="label-lg section-title">Contact Information</h2>
              <div className="form-group">
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Email Address"
                  className="checkout-input"
                  required
                />
              </div>
            </div>

            {/* Shipping Address */}
            <div className="form-section">
              <h2 className="label-lg section-title">Shipping Address</h2>
              <div className="form-row">
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="First Name"
                  className="checkout-input half"
                  required
                />
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="Last Name"
                  className="checkout-input half"
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  name="addressLine1"
                  value={form.addressLine1}
                  onChange={handleChange}
                  placeholder="Address Line 1"
                  className="checkout-input"
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  name="addressLine2"
                  value={form.addressLine2}
                  onChange={handleChange}
                  placeholder="Apartment, suite, etc. (optional)"
                  className="checkout-input"
                />
              </div>
              <div className="form-row">
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="City"
                  className="checkout-input half"
                  required
                />
                <input
                  type="text"
                  name="postalCode"
                  value={form.postalCode}
                  onChange={handleChange}
                  placeholder="Postal Code"
                  className="checkout-input half"
                  required
                />
              </div>
            </div>

            {/* Payment — replaced by PhonePe iframe after submit */}
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
              disabled={loading || cartLoading || cart.items.length === 0}
            >
              {loading
                ? 'Processing…'
                : cartLoading
                ? 'Loading cart…'
                : 'Proceed to Payment'}
            </button>
          </form>
        </div>

        {/* ── Right: Order Summary ────────────────────────────────────────── */}
        <div className="checkout-summary-section">
          <h2 className="label-lg section-title">Order Summary</h2>

          <div className="summary-items">
            {cartLoading ? (
              <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>
                Loading your cart…
              </p>
            ) : cart.items.length === 0 ? (
              <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>
                Your cart is empty.
              </p>
            ) : (
              cart.items.map((item, idx) => (
                <div className="summary-item" key={idx}>
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="summary-item-image"
                    />
                  )}
                  <div className="summary-item-details">
                    <h4 className="label-md">{item.title}</h4>
                    {item.material && (
                      <p className="label-sm">{item.material.toUpperCase()}</p>
                    )}
                    <p className="label-md">
                      ₹{item.price.toLocaleString('en-IN')}
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
              <span className="body-md">
                ₹{cart.subtotal.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="summary-row">
              <span className="body-md">Shipping</span>
              <span className="body-md">Complimentary</span>
            </div>
            <div className="summary-row total">
              <span className="label-lg">Total</span>
              <span className="label-lg">
                ₹{cart.total.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Checkout;