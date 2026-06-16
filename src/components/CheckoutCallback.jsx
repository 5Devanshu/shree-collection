import React, { useEffect, useState } from 'react';
import { useSearchParams, Link }       from 'react-router-dom';
import { checkPhonePePaymentStatus, confirmPhonePePayment, clearCart } from '../api/client';
import { useStore } from '../context/StoreContext';



const CheckoutCallback = () => {
  const { fetchCart } = useStore();
  const [searchParams] = useSearchParams();
  const [status, setStatus]   = useState('loading'); // loading | success | failed | error
  const [order,  setOrder]    = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const merchantOrderId = searchParams.get('merchantOrderId');
    if (!merchantOrderId) { setStatus('error'); setMessage('Missing order ID.'); return; }

    const pending = (() => {
      try { return JSON.parse(sessionStorage.getItem('pendingOrder') || 'null'); } catch { return null; }
    })();

    const run = async () => {
      try {
        // 1 — Verify payment status with backend → PhonePe
        const statusRes = await checkPhonePePaymentStatus(merchantOrderId);
        const state = statusRes.data?.state;

        if (state !== 'COMPLETED') {
          setStatus('failed');
          setMessage(`Payment ${state?.toLowerCase() || 'did not complete'}. Please try again.`);
          return;
        }

        // 2 — Confirm order in DB
        const confirmRes = await confirmPhonePePayment({
          merchantOrderId,
          email:          pending?.guestEmail    || '',
          shippingAddress: pending?.guestAddress || {},
          validatedItems: pending?.items         || [],
          subtotal:       pending?.subtotal      || 0,
          shippingCost:   pending?.shippingCost  || 0,
          total:          pending?.total         || 0,
        });

        sessionStorage.removeItem('pendingOrder');
        await clearCart();
        await fetchCart();     
        setOrder(confirmRes.data?.order);
        setStatus('success');
      } catch (err) {
        setStatus('error');
        setMessage(err?.message || 'Something went wrong confirming your order.');
      }
    };

    run();
  }, [searchParams]);

  if (status === 'loading') return (
    <div className="checkout-page">
      <div className="checkout-success">
        <div className="success-icon" style={{ background: '#fff8e1', color: '#8a6f00', fontSize: '2rem' }}>⏳</div>
        <h2 className="headline-md">Confirming your payment…</h2>
        <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>Please wait, do not close this page.</p>
      </div>
    </div>
  );

  if (status === 'success') return (
    <div className="checkout-page">
      <div className="checkout-success">
        <div className="success-icon">✓</div>
        <h2 className="headline-md">Order Confirmed!</h2>
        {order?.orderNumber && (
          <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>
            Order <strong>#{order.orderNumber}</strong>
          </p>
        )}
        <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>
          A confirmation email is on its way to you.
        </p>
        <Link to="/" className="btn btn-primary" style={{ padding: '14px 36px', marginTop: '8px' }}>
          Continue Shopping
        </Link>
      </div>
    </div>
  );

  return (
    <div className="checkout-page">
      <div className="checkout-success">
        <div className="success-icon" style={{ background: '#fff0f0', color: '#c0392b' }}>✕</div>
        <h2 className="headline-md">{status === 'failed' ? 'Payment Failed' : 'Something went wrong'}</h2>
        <p className="body-md" style={{ color: 'var(--on-surface-variant)', marginBottom: '24px' }}>
          {message}
        </p>
        <Link to="/checkout" className="btn btn-primary" style={{ padding: '14px 36px' }}>
          Try Again
        </Link>
      </div>
    </div>
  );
};

export default CheckoutCallback;