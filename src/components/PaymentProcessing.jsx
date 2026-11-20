import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { checkCustomPaymentStatus } from '../api/client';
import './CustomPayment.css';

export default function PaymentProcessing() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const merchantOrderId = params.get('merchantOrderId') || '';
  const [message, setMessage] = useState('Verifying your payment with PhonePe…');
  const [checking, setChecking] = useState(true);

  const checkStatus = useCallback(async () => {
    if (!merchantOrderId) {
      setMessage('This payment link is incomplete.');
      setChecking(false);
      return;
    }
    try {
      const response = await checkCustomPaymentStatus(merchantOrderId);
      const payment = response.data?.data || response.data;
      if (payment.paymentStatus === 'COMPLETED') {
        navigate(`/payment/success?merchantOrderId=${encodeURIComponent(merchantOrderId)}`, { replace: true });
      } else if (['FAILED', 'EXPIRED'].includes(payment.paymentStatus)) {
        navigate(`/payment/failed?merchantOrderId=${encodeURIComponent(merchantOrderId)}`, { replace: true });
      } else {
        setMessage('Your payment is still processing. We will keep checking safely.');
        setChecking(false);
      }
    } catch (error) {
      setMessage(error?.response?.data?.message || 'We could not verify the payment yet. Please try again.');
      setChecking(false);
    }
  }, [merchantOrderId, navigate]);

  useEffect(() => {
    let active = true;
    let timer;
    const poll = async () => {
      if (!active) return;
      await checkStatus();
      if (active) timer = window.setTimeout(poll, 4000);
    };
    poll();
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [checkStatus]);

  return (
    <main className="custom-payment-page">
      <section className="custom-payment-card custom-payment-status">
        <div className="custom-payment-spinner" aria-hidden="true" />
        <h1>Payment processing</h1>
        <p>{message}</p>
        {checking && <p className="custom-payment-muted">Please do not close this page.</p>}
        {!checking && <button type="button" className="custom-payment-secondary" onClick={checkStatus}>Check status again</button>}
        <Link to="/pay" className="custom-payment-link">Start a new payment</Link>
      </section>
    </main>
  );
}
