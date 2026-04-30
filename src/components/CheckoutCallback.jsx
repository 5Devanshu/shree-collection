import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

const API = import.meta.env.VITE_API_URL || '/api';

const CheckoutCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const { clearCart }  = useStore();

  const [status,  setStatus]  = useState('checking');
  const [message, setMessage] = useState('Verifying your payment with PhonePe…');

  // ✅ Reads 'merchantTransactionId' — matches payment.service.js redirect URL
  const merchantOrderId = searchParams.get('merchantTransactionId');

  useEffect(() => {
    if (!merchantOrderId) {
      setStatus('failed');
      setMessage('Missing order reference. Please contact support with your order details.');
      return;
    }

    const verify = async () => {
      try {
        // Wait briefly for PhonePe to settle
        await new Promise(r => setTimeout(r, 2000));

        // ✅ Correct status endpoint
        const statusRes  = await fetch(`${API}/payment/phonepe/status/${merchantOrderId}`);
        const statusData = await statusRes.json();

        if (!statusData.success) {
          setStatus('failed');
          setMessage(statusData.message || 'Could not verify payment. Please contact support.');
          return;
        }

        const state = statusData.status?.state || statusData.state;

        if (state === 'COMPLETED') {
          // Retrieve saved order data from sessionStorage
          const saved = JSON.parse(sessionStorage.getItem('pendingOrder') || '{}');

          // ✅ Correct confirm endpoint — matches payment.routes.js
          const confirmRes = await fetch(`${API}/payment/phonepe/confirm`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              merchantTransactionId: merchantOrderId,
              guestEmail:    saved.guestEmail   || saved.email,
              guestPhone:    saved.guestPhone   || saved.phone,
              guestName:     saved.guestName    || saved.name,
              guestAddress:  saved.guestAddress || saved.shippingAddress,
              items:         saved.items        || [],
              subtotal:      saved.subtotal      || 0,
              shippingCost:  saved.shippingCost  || 0,
              total:         saved.total         || 0,
            }),
          });

          const confirmData = await confirmRes.json();

          if (confirmData.success) {
            // Clear cart and session data
            await clearCart();
            sessionStorage.removeItem('pendingOrder');
            sessionStorage.removeItem('merchantTransactionId');
            setStatus('success');
            setMessage(`Order confirmed! Confirmation sent to ${saved.guestEmail || saved.email || 'your email'}.`);
          } else {
            setStatus('failed');
            setMessage(confirmData.message || 'Payment verified but order placement failed. Please contact support.');
          }

        } else if (state === 'FAILED') {
          setStatus('failed');
          setMessage('Your payment was not successful. Please try again.');
        } else {
          setStatus('pending');
          setMessage('Payment is still being processed. Please wait and refresh.');
        }

      } catch (err) {
        console.error('Callback error:', err);
        setStatus('failed');
        setMessage('Network error while verifying payment. Please check your order status or contact support.');
      }
    };

    verify();
  }, [merchantOrderId, clearCart]);

  return (
    <div style={{
      minHeight: '70vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '2rem',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '480px' }}>

        {/* Icon */}
        {status === 'checking' && (
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
        )}
        {status === 'success' && (
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: '#e8f5e9', color: '#2e7d32',
            fontSize: '2rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem',
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

        <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: 1.6 }}>
          {message}
        </p>

        {merchantOrderId && status !== 'checking' && (
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
            Ref: {merchantOrderId}
          </p>
        )}

        {status === 'success' && (
          <button className="btn-primary" onClick={() => navigate('/')}
            style={{ padding: '0.85rem 2.5rem', fontSize: '1rem' }}>
            Continue Shopping
          </button>
        )}

        {status === 'failed' && (
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => navigate('/checkout')}
              style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}>
              Try Again
            </button>
            <button className="btn-secondary" onClick={() => navigate('/')}
              style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}>
              Return Home
            </button>
          </div>
        )}

        {status === 'pending' && (
          <button className="btn-primary" onClick={() => window.location.reload()}
            style={{ padding: '0.85rem 2.5rem', fontSize: '1rem' }}>
            Refresh Status
          </button>
        )}

      </div>
    </div>
  );
};

export default CheckoutCallback;