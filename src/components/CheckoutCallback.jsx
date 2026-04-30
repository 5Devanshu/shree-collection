import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL;

// PhonePe redirects to /checkout/callback?merchantOrderId=SC_xxx
// This page polls the Order Status API and either:
//   → shows success and clears cart, OR
//   → shows failure and lets user retry
const CheckoutCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();

  const [status,  setStatus]  = useState('checking'); // 'checking' | 'success' | 'failed' | 'pending'
  const [message, setMessage] = useState('Verifying your payment with PhonePe…');

  const merchantOrderId = searchParams.get('merchantOrderId');

  useEffect(() => {
    if (!merchantOrderId) {
      setStatus('failed');
      setMessage('Missing order reference. Please contact support.');
      return;
    }

    // Small delay — give PhonePe's systems a moment to settle
    const timer = setTimeout(async () => {
      try {
        const res  = await fetch(`${API}/checkout/status/${merchantOrderId}`);
        const data = await res.json();

        if (!data.success) {
          setStatus('failed');
          setMessage(data.message || 'Could not verify payment. Please contact support.');
          return;
        }

        if (data.state === 'COMPLETED') {
          // Retrieve the saved checkout data from sessionStorage
          // (Checkout.jsx should save it before navigating to PhonePe)
          const saved = JSON.parse(sessionStorage.getItem('pendingOrder') || '{}');

          // Call /confirm to place the order in DB
// In CheckoutCallback.jsx — update the confirm call to match controller
const confirmRes = await fetch(`${API}/payment/phonepe/confirm`, {
  method:  'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    merchantTransactionId: saved.merchantTransactionId,
    guestEmail:   saved.guestEmail,
    guestPhone:   saved.guestPhone,
    guestName:    saved.guestName,
    guestAddress: saved.guestAddress,
    items:        saved.items,
    subtotal:     saved.subtotal,
    shippingCost: saved.shippingCost,
    total:        saved.total,
  }),
});
          const confirmData = await confirmRes.json();

          if (confirmData.success) {
            // Clear cart and saved order data
            localStorage.removeItem('cartSessionId');
            sessionStorage.removeItem('pendingOrder');
            setStatus('success');
            setMessage(`Order placed! Confirmation sent to ${saved.email || 'your email'}.`);
          } else {
            setStatus('failed');
            setMessage(confirmData.message || 'Payment verified but order placement failed. Please contact support.');
          }
        } else if (data.state === 'FAILED') {
          setStatus('failed');
          setMessage('Payment was not successful. Please try again.');
        } else {
          // PENDING
          setStatus('pending');
          setMessage('Your payment is still being processed. Please wait a moment and refresh.');
        }
      } catch {
        setStatus('failed');
        setMessage('Network error while verifying payment. Please check your order status or contact support.');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [merchantOrderId]); // eslint-disable-line

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ textAlign: 'center', maxWidth: '480px' }}>

        {/* Icon */}
        {status === 'checking' && (
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⏳</div>
        )}
        {status === 'success' && (
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: '#e8f5e9', color: '#2e7d32',
            fontSize: '2rem', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 1.5rem', fontWeight: 700,
          }}>✓</div>
        )}
        {(status === 'failed' || status === 'pending') && (
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
            {status === 'failed' ? '✗' : '⏳'}
          </div>
        )}

        {/* Heading */}
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          {status === 'checking' && 'Verifying Payment…'}
          {status === 'success'  && 'Order Confirmed!'}
          {status === 'failed'   && 'Payment Failed'}
          {status === 'pending'  && 'Payment Pending'}
        </h1>

        {/* Message */}
        <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: 1.6 }}>
          {message}
        </p>

        {/* Order ID for reference */}
        {merchantOrderId && status !== 'checking' && (
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
            Order Ref: {merchantOrderId}
          </p>
        )}

        {/* Actions */}
        {status === 'success' && (
          <button
            className="btn-primary"
            onClick={() => navigate('/')}
            style={{ padding: '0.85rem 2.5rem', fontSize: '1rem' }}
          >
            Continue Shopping
          </button>
        )}

        {status === 'failed' && (
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn-primary"
              onClick={() => navigate('/checkout')}
              style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}
            >
              Try Again
            </button>
            <button
              className="btn-secondary"
              onClick={() => navigate('/')}
              style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}
            >
              Return Home
            </button>
          </div>
        )}

        {status === 'pending' && (
          <button
            className="btn-primary"
            onClick={() => window.location.reload()}
            style={{ padding: '0.85rem 2.5rem', fontSize: '1rem' }}
          >
            Refresh Status
          </button>
        )}

      </div>
    </div>
  );
};

export default CheckoutCallback;