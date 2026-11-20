import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './CustomPayment.css';

export default function PaymentFailed() {
  const [params] = useSearchParams();
  const merchantOrderId = params.get('merchantOrderId') || '';
  return (
    <main className="custom-payment-page">
      <section className="custom-payment-card custom-payment-status">
        <div className="custom-payment-failed-mark">×</div>
        <p className="custom-payment-eyebrow">PAYMENT NOT COMPLETED</p>
        <h1>Payment could not be completed</h1>
        <p>Your payment was cancelled, declined, or expired. No successful payment has been recorded.</p>
        <div className="custom-payment-actions">
          <Link to="/pay" className="custom-payment-submit">Try again</Link>
          {merchantOrderId && <Link to={`/payment/processing?merchantOrderId=${encodeURIComponent(merchantOrderId)}`} className="custom-payment-secondary">Check status</Link>}
        </div>
      </section>
    </main>
  );
}
