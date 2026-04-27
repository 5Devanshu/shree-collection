import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './PaymentSuccess.css';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('verifying');
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const orderId = searchParams.get('orderId');

        if (!orderId) {
          setStatus('error');
          setLoading(false);
          return;
        }

        // Verify payment status with backend
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/orders/${orderId}/payment/verify`
        );

        const data = await response.json();

        if (data.success) {
          setOrderDetails(data.data);
          setStatus(data.data.paymentStatus === 'paid' ? 'success' : 'pending');
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('Payment verification failed:', error);
        setStatus('error');
      } finally {
        setLoading(false);
      }
    };

    // Wait a moment for PhonePe to process
    const timer = setTimeout(verifyPayment, 2000);
    return () => clearTimeout(timer);
  }, [searchParams]);

  if (loading) {
    return (
      <div className="payment-page">
        <div className="payment-container">
          <div className="payment-loader">
            <div className="spinner"></div>
            <p className="body-lg">Verifying your payment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="payment-page">
        <div className="payment-container">
          <div className="payment-success">
            <div className="success-icon">✓</div>
            <h1 className="headline-md">Payment Successful!</h1>
            <p className="body-lg" style={{ color: 'var(--on-surface-variant)', marginTop: '1rem' }}>
              Your order has been confirmed.
            </p>

            {orderDetails && (
              <div className="order-details">
                <div className="detail-row">
                  <span className="detail-label">Order ID:</span>
                  <span className="detail-value">{orderDetails.orderId}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Amount Paid:</span>
                  <span className="detail-value">₹{orderDetails.total?.toLocaleString('en-IN')}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className="detail-value" style={{ color: 'green', textTransform: 'capitalize' }}>
                    {orderDetails.status}
                  </span>
                </div>
              </div>
            )}

            <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', marginTop: '1.5rem' }}>
              A confirmation email has been sent to <strong>{orderDetails?.email}</strong>
            </p>

            <button
              onClick={() => navigate('/')}
              className="btn btn-primary"
              style={{ marginTop: '2rem', padding: '1rem 2rem' }}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="payment-page">
        <div className="payment-container">
          <div className="payment-pending">
            <div className="pending-icon">⏳</div>
            <h1 className="headline-md">Payment Pending</h1>
            <p className="body-lg" style={{ color: 'var(--on-surface-variant)', marginTop: '1rem' }}>
              Your payment is being processed. This may take a few moments.
            </p>

            {orderDetails && (
              <div className="order-details">
                <div className="detail-row">
                  <span className="detail-label">Order ID:</span>
                  <span className="detail-value">{orderDetails.orderId}</span>
                </div>
              </div>
            )}

            <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', marginTop: '1.5rem' }}>
              You will receive an email confirmation once payment is verified.
            </p>

            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary"
              style={{ marginTop: '2rem', padding: '1rem 2rem' }}
            >
              Check Status Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-container">
        <div className="payment-error">
          <div className="error-icon">✕</div>
          <h1 className="headline-md">Payment Failed</h1>
          <p className="body-lg" style={{ color: 'var(--on-surface-variant)', marginTop: '1rem' }}>
            Something went wrong with your payment. Please try again.
          </p>

          <button
            onClick={() => navigate('/checkout')}
            className="btn btn-primary"
            style={{ marginTop: '2rem', padding: '1rem 2rem' }}
          >
            Return to Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
