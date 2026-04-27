import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore }    from '../context/StoreContext';
import { useCustomer } from '../context/CustomerContext';
import { createDemoOrder } from '../api/client';
import './Checkout.css';

const Checkout = () => {
  const navigate                            = useNavigate();
  const { cart, cartTotal, cartCount, removeFromCart, updateCartQty, clearCart } = useStore();
  const { customer, isLoggedIn, logout }    = useCustomer();
  const [placing, setPlacing]               = useState(false);
  const [error, setError]                   = useState('');
  const [guestMode, setGuestMode]           = useState(!isLoggedIn);  // ✅ Explicit guest mode tracking

  // ── Pre-fill from customer profile if logged in (and not in guest mode) ────
  const [form, setForm] = useState({
    email:    '',
    name:     '',
    phone:    '',
    line1:    '',
    line2:    '',
    city:     '',
    state:    '',
    pincode:  '',
  });

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  useEffect(() => {
    if (isLoggedIn && customer && !guestMode) {  // ✅ Pre-fill only if logged in AND not in guest mode
      setForm(prev => ({
        ...prev,
        email: customer.email || '',
        name:  customer.name  || '',
        phone: customer.phone || '',
      }));
    }
  }, [isLoggedIn, customer, guestMode]);

  // ── Calculate shipping charges ────────────────────────────────────────────
  const SHIPPING_THRESHOLD = 500;
  const SHIPPING_CHARGE = 70;
  const shippingCost = cartTotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;
  const finalTotal = cartTotal + shippingCost;

  // ── Empty cart state ──────────────────────────────────────────────────────
  if (cartCount === 0) {
    return (
      <div className="checkout-empty">
        <div className="checkout-empty-inner">
          <p className="display-lg" style={{ fontSize: '3rem', marginBottom: '1rem' }}>Your bag is empty</p>
          <p className="body-lg" style={{ color: 'var(--on-surface-variant)', marginBottom: '2rem' }}>
            Add pieces to your bag before checking out.
          </p>
          <Link to="/collections/all" className="btn btn-primary" style={{ padding: '1rem 2rem' }}>
            Explore Collection
          </Link>
        </div>
      </div>
    );
  }

  // ── Place order handler + Payment Gateway redirect ────────────────────────
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');
    setPlacing(true);

    try {
      // Validate form
      if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
        setError('Please fill in all contact information');
        setPlacing(false);
        return;
      }

      if (!form.line1.trim() || !form.city.trim() || !form.state.trim() || !form.pincode.trim()) {
        setError('Please fill in complete delivery address');
        setPlacing(false);
        return;
      }

      // Prepare order data in correct format for Order model
      const nameParts = form.name.trim().split(' ');
      const orderData = {
        email: form.email,
        phone: form.phone,
        shippingAddress: {
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(' ') || nameParts[0],
          addressLine1: form.line1,
          addressLine2: form.line2,
          city: form.city,
          postalCode: form.pincode,
          country: 'India',
        },
        items: (Array.isArray(cart) ? cart : []).map(item => ({
          product: item._id,
          title: item.title,
          material: item.material || '',
          price: item.price || 0,
          quantity: item.qty || 1,
          image: item.image || '',
        })),
        shippingCost: shippingCost,
        isGuestOrder: guestMode,  // ✅ Use explicit guestMode flag
      };

      // ✅ Step 1: Create order in database
      const orderResponse = await createDemoOrder(orderData);

      if (orderResponse.data.success) {
        const orderId = orderResponse.data.data?.orderId || orderResponse.data.data?.orderNumber || 'N/A';
        
        // ✅ Step 2: Initiate PhonePe payment gateway
        // NOTE: VITE_API_URL already includes /api, so don't repeat it
        const paymentInitUrl = `${import.meta.env.VITE_API_URL}/orders/${orderId}/payment/initiate`;
        
        try {
          const paymentResponse = await fetch(paymentInitUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });

          const paymentData = await paymentResponse.json();

          if (paymentData.success && paymentData.data?.paymentUrl) {
            // ✅ Step 3: Redirect to PhonePe payment page
            window.location.href = paymentData.data.paymentUrl;
          } else {
            // Fallback: Show order success if payment initiation fails
            alert(`✓ Order placed successfully!\n\nOrder ID: ${orderId}\n\nConfirmation email will be sent to ${form.email}\n\nNote: Payment gateway redirect failed. Please contact support.`);
            clearCart();
            navigate('/');
          }
        } catch (paymentErr) {
          console.warn('Payment initiation error:', paymentErr);
          // Fallback: Show order success if payment initiation fails
          alert(`✓ Order placed successfully!\n\nOrder ID: ${orderId}\n\nConfirmation email will be sent to ${form.email}\n\nNote: Payment gateway temporarily unavailable. Please try again.`);
          clearCart();
          navigate('/');
        }
      }
    } catch (err) {
      console.error('Order error:', err);
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="checkout-page">
      <div className="checkout-container">

        {/* ── Left — Form ────────────────────────────────────────────────── */}
        <div className="checkout-form-section">
          <h1 className="headline-md" style={{ marginBottom: '0.5rem' }}>Checkout</h1>
          <p className="body-lg" style={{ color: 'var(--on-surface-variant)', marginBottom: '2.5rem' }}>
            Complete your order securely.
          </p>

          <form onSubmit={handlePlaceOrder}>

            {/* Checkout Mode Toggle - if logged in */}
            {isLoggedIn && (
              <div className="checkout-section" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setGuestMode(false)}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      border: guestMode ? '1px solid #d0c5af' : '2px solid #735c00',
                      background: guestMode ? 'transparent' : 'rgba(115, 92, 0, 0.05)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: guestMode ? 400 : 600,
                      color: guestMode ? '#7f7663' : '#735c00',
                      transition: 'all 0.2s',
                    }}
                  >
                    Account Checkout
                  </button>
                  <button
                    type="button"
                    onClick={() => setGuestMode(true)}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      border: guestMode ? '2px solid #735c00' : '1px solid #d0c5af',
                      background: guestMode ? 'rgba(115, 92, 0, 0.05)' : 'transparent',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: guestMode ? 600 : 400,
                      color: guestMode ? '#735c00' : '#7f7663',
                      transition: 'all 0.2s',
                    }}
                  >
                    Guest Checkout
                  </button>
                </div>
              </div>
            )}

            {/* Contact */}
            <div className="checkout-section">
              <h2 className="checkout-section-title">Contact Information</h2>

              <div className="checkout-field">
                <input
                  type="email"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  className="checkout-input"
                  required
                />
              </div>

              <div className="checkout-row">
                <div className="checkout-field">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    className="checkout-input"
                    required
                  />
                </div>
                <div className="checkout-field">
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    className="checkout-input"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="checkout-section">
              <h2 className="checkout-section-title">Shipping Address</h2>

              <div className="checkout-field">
                <input
                  type="text"
                  placeholder="Address Line 1"
                  value={form.line1}
                  onChange={e => set('line1', e.target.value)}
                  className="checkout-input"
                  required
                />
              </div>

              <div className="checkout-field">
                <input
                  type="text"
                  placeholder="Apartment, suite, etc. (optional)"
                  value={form.line2}
                  onChange={e => set('line2', e.target.value)}
                  className="checkout-input"
                />
              </div>

              <div className="checkout-row">
                <div className="checkout-field">
                  <input
                    type="text"
                    placeholder="City"
                    value={form.city}
                    onChange={e => set('city', e.target.value)}
                    className="checkout-input"
                    required
                  />
                </div>
                <div className="checkout-field">
                  <input
                    type="text"
                    placeholder="State"
                    value={form.state}
                    onChange={e => set('state', e.target.value)}
                    className="checkout-input"
                    required
                  />
                </div>
              </div>

              <div className="checkout-field" style={{ maxWidth: 200 }}>
                <input
                  type="text"
                  placeholder="Pincode"
                  value={form.pincode}
                  onChange={e => set('pincode', e.target.value)}
                  className="checkout-input"
                  maxLength={6}
                  required
                />
              </div>
            </div>

            {/* Saved address quick-fill if logged in */}
            {isLoggedIn && customer?.savedAddresses?.length > 0 && (
              <div className="checkout-section">
                <h2 className="checkout-section-title">Saved Addresses</h2>
                <div className="saved-address-list">
                  {(Array.isArray(customer?.savedAddresses) ? customer.savedAddresses : []).map(addr => (
                    <button
                      key={addr._id}
                      type="button"
                      className="saved-address-btn"
                      onClick={() => setForm(prev => ({
                        ...prev,
                        line1:   addr.line1,
                        line2:   addr.line2 || '',
                        city:    addr.city,
                        state:   addr.state,
                        pincode: addr.pincode,
                      }))}
                    >
                      <span className="saved-address-label">{addr.label}</span>
                      <span className="saved-address-text">
                        {addr.line1}, {addr.city}, {addr.state} — {addr.pincode}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div style={{
                background: 'rgba(186, 26, 26, 0.06)',
                border: '1px solid rgba(186, 26, 26, 0.2)',
                color: 'var(--on-error)',
                padding: '12px 16px',
                borderRadius: '4px',
                marginBottom: '16px',
                fontSize: '0.875rem',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary checkout-submit"
              disabled={placing}
              style={{ opacity: placing ? 0.7 : 1, cursor: placing ? 'not-allowed' : 'pointer' }}
            >
              {placing ? 'Processing...' : `Place Order — ₹${finalTotal.toLocaleString('en-IN')}`}
            </button>

            {!isLoggedIn && (
              <p className="body-lg" style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginTop: '1rem', textAlign: 'center' }}>
                <Link to="/login" style={{ color: 'var(--primary)' }}>Sign in</Link> to auto-fill your details and track this order.
              </p>
            )}
          </form>
        </div>

        {/* ── Right — Order Summary ──────────────────────────────────────── */}
        <div className="checkout-summary-section">
          <h2 className="headline-md" style={{ marginBottom: '2rem' }}>Order Summary</h2>

          {/* Cart items */}
          <div className="summary-items">
            {(Array.isArray(cart) ? cart : []).map(item => {
              const hasDiscount   = item.discountEnabled && item.discountedPrice && item.discountedPrice < item.price;
              const displayPrice  = hasDiscount ? item.discountedPrice : item.price;
              const numericPrice  = parseFloat(displayPrice) || 0;
              const originalPrice = parseFloat(item.price) || 0;

              return (
                <div key={item._id} className="summary-item">
                  {/* Image */}
                  <div className="summary-item-image-wrap">
                    {item.image
                      ? <img src={item.image} alt={item.title} className="summary-item-image" />
                      : <div className="summary-item-image summary-item-placeholder">💎</div>
                    }
                    {/* Qty badge */}
                    <span className="summary-item-qty-badge">{item.qty}</span>
                  </div>

                  {/* Details */}
                  <div className="summary-item-details">
                    <p className="summary-item-title">{item.title}</p>
                    {item.material && (
                      <p className="summary-item-material">{item.material}</p>
                    )}
                    {hasDiscount && (
                      <p style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600 }}>
                        {item.discountPercent}% OFF
                      </p>
                    )}

                    {/* Qty controls */}
                    <div className="summary-item-qty-controls">
                      <button
                        onClick={() => updateCartQty(item._id, item.qty - 1)}
                        className="qty-btn"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="qty-value">{item.qty}</span>
                      <button
                        onClick={() => updateCartQty(item._id, item.qty + 1)}
                        className="qty-btn"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item._id)}
                        className="qty-remove"
                        aria-label="Remove item"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="summary-item-price">
                    <p style={{ fontWeight: 500 }}>
                      ₹{(numericPrice * item.qty).toLocaleString('en-IN')}
                    </p>
                    {hasDiscount && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', textDecoration: 'line-through' }}>
                        ₹{(originalPrice * item.qty).toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Totals */}
          <div className="summary-totals">
            <div className="summary-row">
              <span className="body-lg">Subtotal</span>
              <span className="body-lg">₹{cartTotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="summary-row">
              <span className="body-lg">Shipping</span>
              <span className="body-lg" style={{ color: shippingCost > 0 ? 'var(--on-surface)' : 'var(--primary)', fontWeight: 500 }}>
                {shippingCost > 0 ? `₹${shippingCost}` : 'Complimentary'}
              </span>
            </div>
            {shippingCost === 0 && cartTotal > 0 && (
              <p style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                ✓ Free shipping on orders above ₹{SHIPPING_THRESHOLD}
              </p>
            )}
            <div className="summary-row summary-row--total">
              <span className="headline-md" style={{ fontSize: '1.2rem' }}>Total</span>
              <span className="headline-md" style={{ fontSize: '1.2rem' }}>
                ₹{finalTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Checkout;