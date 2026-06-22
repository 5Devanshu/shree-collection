import React, { useState, useEffect } from 'react';
import { Link }                        from 'react-router-dom';
import { useStore }                    from '../context/StoreContext';
import { initiatePhonePePayment }      from '../api/client';
import './Checkout.css';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan',
  'Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu',
  'Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
];

// Mirror of backend calculateDeliveryCharge — display only; backend is authoritative.
const calcDelivery = (subtotal, isReseller, state) => {
  const threshold = isReseller ? Infinity : 500; // reseller always charged
  if (Number(subtotal) >= threshold) return 0;
  return String(state || '').trim().toLowerCase() === 'maharashtra' ? 70 : 90;
};

const Checkout = () => {
  const { cart, cartLoading, fetchCart, updateCartItem, removeFromCart } = useStore();

  const [form, setForm] = useState({
    email: '', phone: '', name: '',
    line1: '', line2: '', city: '', state: '', pincode: '',
  });
  const [isReseller, setIsReseller] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error,   setError]         = useState('');

  useEffect(() => { fetchCart(); }, [fetchCart]);

  useEffect(() => {
    try {
      const reseller = JSON.parse(localStorage.getItem('resellerUser') || 'null');
      const customer = JSON.parse(localStorage.getItem('shree_customer_user') || 'null');
      const user = reseller || customer;
      setIsReseller(!!reseller);
      if (user) {
        setForm(prev => ({
          ...prev,
          email: user.email || prev.email,
          phone: user.phone || prev.phone,
          name:  user.name  || prev.name,
          ...(customer?.address ? {
            line1:   customer.address.line1   || prev.line1,
            line2:   customer.address.line2   || prev.line2,
            city:    customer.address.city    || prev.city,
            state:   customer.address.state   || prev.state,
            pincode: customer.address.pincode || prev.pincode,
          } : {}),
        }));
      }
    } catch { /* ignore */ }
  }, []);

  const items    = cart?.items    || [];
  const subtotal = cart?.subtotal || 0;

  const deliveryCharge = calcDelivery(subtotal, isReseller, form.state);
  const grandTotal     = subtotal + deliveryCharge;

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleQtyChange = async (productId, newQty) => {
    if (newQty < 1) { await removeFromCart(productId); return; }
    await updateCartItem(productId, newQty);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!items.length) {
      setError('Your cart is empty. Please add items before checking out.');
      return;
    }
    if (!form.state) {
      setError('Please select your state to calculate delivery.');
      return;
    }

    setLoading(true);
    try {
      const orderItems = items.map(item => ({
        productId: item.productId || item.product?._id || item.product,
        title:     item.title,
        price:     item.price,
        quantity:  item.quantity,
        image:     item.image || '',
      }));

      const res = await initiatePhonePePayment({
        items:      orderItems,
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

      const data = res.data?.data || res.data;

      sessionStorage.setItem('merchantTransactionId', data?.merchantTransactionId || '');
      sessionStorage.setItem('pendingOrder', JSON.stringify({
        merchantTransactionId: data?.merchantTransactionId,
        guestEmail:   form.email,
        guestPhone:   form.phone,
        guestName:    form.name,
        guestAddress: { line1: form.line1, line2: form.line2, city: form.city, state: form.state, pincode: form.pincode },
        items:        orderItems,
        subtotal,
        shippingCost: deliveryCharge,
        total:        grandTotal,
      }));

      const redirectUrl = data?.redirectUrl || data?.checkoutUrl || data?.paymentUrl;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        setError('No redirect URL returned. Please contact support.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Payment initiation failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!cartLoading && items.length === 0) {
    return (
      <div className="checkout-page">
        <div className="checkout-empty">
          <div className="checkout-empty-inner">
            <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🛍️</div>
            <h2 className="headline-md" style={{ marginBottom: '8px' }}>Your cart is empty</h2>
            <p className="body-lg" style={{ color: 'var(--on-surface-variant)', marginBottom: '24px' }}>
              Add some beautiful pieces before checking out.
            </p>
            <Link to="/" className="btn btn-primary" style={{ padding: '14px 32px' }}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">

        {/* ══ LEFT — Form ═══════════════════════════════════════════════════ */}
        <div className="checkout-form-section">
          <h1 className="display-sm" style={{ marginBottom: '4px' }}>Checkout</h1>
          <p className="body-md disclaimer">Complete your order securely.</p>

          {error && <div className="checkout-error">{error}</div>}

          <form className="checkout-form" onSubmit={handleSubmit}>

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
                <select name="state" value={form.state}
                  onChange={handleChange}
                  className="checkout-input half" required>
                  <option value="" disabled>Select State</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <input type="text" name="pincode" value={form.pincode}
                  onChange={handleChange} placeholder="PIN Code"
                  className="checkout-input" required
                  pattern="[0-9]{6}" title="Enter a valid 6-digit PIN code" />
              </div>
            </div>

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
              className="btn btn-primary complete-order-btn"
              disabled={loading || cartLoading || !items.length}
            >
              {loading     ? 'Processing…'   :
               cartLoading ? 'Loading cart…' :
               `Proceed to Payment — ₹${grandTotal.toLocaleString('en-IN')}`}
            </button>

          </form>
        </div>

        {/* ══ RIGHT — Order Summary ══════════════════════════════════════════ */}
        <div className="checkout-summary-section">
          <h2 className="label-lg section-title">
            Order Summary
            {items.length > 0 && (
              <span style={{
                fontSize: '0.72rem', color: 'var(--on-surface-variant)',
                fontWeight: 400, marginLeft: 8, textTransform: 'none', letterSpacing: 0,
              }}>
                {items.length} item{items.length !== 1 ? 's' : ''}
              </span>
            )}
          </h2>

          <div className="summary-items">
            {cartLoading ? (
              <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>Loading cart…</p>
            ) : items.map((item, i) => {
              const productId = item.productId || item.product?._id || item.product;
              return (
                <div className="summary-item" key={productId || i}>

                  <div className="summary-item-image-wrap">
                    {item.image ? (
                      <img src={item.image} alt={item.title}
                        className="summary-item-image"
                        onError={e => { e.target.style.display = 'none'; }} />
                    ) : (
                      <div className="summary-item-image summary-item-placeholder">💎</div>
                    )}
                    {item.quantity > 1 && (
                      <span className="summary-item-qty-badge">{item.quantity}</span>
                    )}
                  </div>

                  <div className="summary-item-details">
                    <p className="summary-item-title">{item.title}</p>
                    {item.material && (
                      <p className="summary-item-material">{item.material}</p>
                    )}
                    <div className="summary-item-qty-controls">
                      <button type="button" className="qty-btn"
                        onClick={() => handleQtyChange(productId, item.quantity - 1)}>
                        −
                      </button>
                      <span className="qty-value">{item.quantity}</span>
                      <button type="button" className="qty-btn"
                        onClick={() => handleQtyChange(productId, item.quantity + 1)}>
                        +
                      </button>
                      <button type="button" className="qty-remove"
                        onClick={() => removeFromCart(productId)}>
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="summary-item-price">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </div>

                </div>
              );
            })}
          </div>

          <div className="summary-totals">
            <div className="summary-row">
              <span className="body-md">Subtotal</span>
              <span className="body-md">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="summary-row">
              <span className="body-md">Shipping</span>
              {deliveryCharge === 0 ? (
                <span className="body-md" style={{ color: 'var(--primary)' }}>Free</span>
              ) : !form.state ? (
                <span className="body-md" style={{ color: 'var(--on-surface-variant)' }}>Select state</span>
              ) : (
                <span className="body-md">₹{deliveryCharge.toLocaleString('en-IN')}</span>
              )}
            </div>
            <div className="summary-row summary-row--total">
              <span className="label-lg">Total</span>
              <span className="label-lg">₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Checkout;