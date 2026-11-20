import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { checkCustomPaymentStatus } from '../api/client';
import './CustomPayment.css';

export default function CustomPaymentSuccess() {
  const [params] = useSearchParams();
  const merchantOrderId = params.get('merchantOrderId') || '';
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    checkCustomPaymentStatus(merchantOrderId)
      .then((response) => {
        const data = response.data?.data || response.data;
        if (data.paymentStatus === 'COMPLETED') setPayment(data);
        else setError('Payment is not confirmed yet. Please check the processing page.');
      })
      .catch(() => setError('We could not verify this payment.'));
  }, [merchantOrderId]);

  if (error) {
    return (
      <main className="custom-payment-page">
        <section className="custom-payment-card custom-payment-status">
          <h1>Payment not confirmed</h1>
          <p>{error}</p>
          <Link to={`/payment/processing?merchantOrderId=${encodeURIComponent(merchantOrderId)}`} className="custom-payment-submit">Check payment status</Link>
        </section>
      </main>
    );
  }
  if (!payment) {
    return <main className="custom-payment-page"><section className="custom-payment-card custom-payment-status"><div className="custom-payment-spinner" /><h1>Confirming payment…</h1></section></main>;
  }

  return (
    <main className="custom-payment-page">
      <section className="custom-payment-card custom-payment-status">
        <div className="custom-payment-success-mark">✓</div>
        <p className="custom-payment-eyebrow">PAYMENT SUCCESSFUL</p>
        <h1>Thank you, {payment.customerName}</h1>
        <p>Your payment of <strong>₹{Number(payment.amount).toLocaleString('en-IN')}</strong> has been verified securely.</p>
        <dl className="custom-payment-details">
          <div><dt>Transaction ID</dt><dd>{payment.gatewayTransactionId || 'Confirmed by PhonePe'}</dd></div>
          <div><dt>Merchant order ID</dt><dd>{payment.merchantOrderId}</dd></div>
          {payment.paymentMethod && <div><dt>Payment method</dt><dd>{payment.paymentMethod}</dd></div>}
          {payment.paidAt && <div><dt>Payment date</dt><dd>{new Date(payment.paidAt).toLocaleString('en-IN')}</dd></div>}
        </dl>
        <Link to="/s/shree-collection" className="custom-payment-submit">Back to Shree Collection</Link>
      </section>
    </main>
  );
}
