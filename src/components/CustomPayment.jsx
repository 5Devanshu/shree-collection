import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createCustomPayment } from '../api/client';
import './CustomPayment.css';

const formatInr = (value) =>
  Number(value || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });

export default function CustomPayment() {
  const [form, setForm] = useState({ name: '', mobile: '', amount: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await createCustomPayment(form);
      const data = response.data?.data || response.data;
      if (!data?.redirectUrl) throw new Error('Payment checkout is unavailable right now.');
      window.location.assign(data.redirectUrl);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError.message || 'Unable to start payment.');
      setLoading(false);
    }
  };

  return (
    <main className="custom-payment-page">
      <section className="custom-payment-card">
        <Link to="/s/shree-collection" className="custom-payment-back">← Back to Shree Collection</Link>
        <div className="custom-payment-logo">
          <img src="/logo.png" alt="Shree Collection by Aarya" />
        </div>
        <p className="custom-payment-eyebrow">SHREE COLLECTION BY AARYA</p>
        <h1>Make a payment</h1>
        <p className="custom-payment-intro">
          Enter your details and the amount you would like to pay. You will complete the payment securely on PhonePe.
        </p>

        {error && <div className="custom-payment-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} className="custom-payment-form">
          <label>
            Full name
            <input name="name" value={form.name} onChange={handleChange} required minLength="2" maxLength="100" autoComplete="name" />
          </label>
          <label>
            Mobile number
            <input name="mobile" value={form.mobile} onChange={handleChange} required inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength="10" autoComplete="tel" placeholder="10-digit Indian mobile number" />
          </label>
          <label>
            Amount
            <div className="custom-payment-amount">
              <span>₹</span>
              <input name="amount" value={form.amount} onChange={handleChange} required type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="0.00" />
            </div>
          </label>
          {form.amount && Number(form.amount) > 0 && (
            <p className="custom-payment-preview">{formatInr(form.amount)}</p>
          )}
          <button type="submit" className="custom-payment-submit" disabled={loading}>
            {loading ? 'Preparing secure checkout…' : 'Proceed to Pay'}
          </button>
        </form>

        <p className="custom-payment-security">🔒 Securely processed by PhonePe Standard Checkout</p>
        <p className="custom-payment-limit">Payment limits are validated securely before checkout.</p>
      </section>
    </main>
  );
}
