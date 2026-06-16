import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import client       from '../api/client';
import './ProductReviews.css';

const Stars = ({ value, interactive = false, onChange }) => (
  <div className="pr-stars" aria-label={`${value} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map(n => (
      <button
        key={n}
        type="button"
        className={`pr-star ${n <= value ? 'pr-star--filled' : ''} ${interactive ? 'pr-star--interactive' : ''}`}
        onClick={() => interactive && onChange && onChange(n)}
        aria-label={`${n} star${n !== 1 ? 's' : ''}`}
        tabIndex={interactive ? 0 : -1}
      >
        ★
      </button>
    ))}
  </div>
);

const ProductReviews = ({ productId }) => {
  const { customer, reseller, isReseller } = useStore();

  const [reviews,   setReviews]   = useState([]);
  const [average,   setAverage]   = useState(null);
  const [count,     setCount]     = useState(0);
  const [loading,   setLoading]   = useState(true);

  // Form state
  const [rating,    setRating]    = useState(0);
  const [comment,   setComment]   = useState('');
  const [submitting,setSubmitting]= useState(false);
  const [formError, setFormError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const isLoggedIn = !!(customer || (isReseller && reseller));

  // ── Fetch reviews ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    client.get(`/reviews/product/${productId}`)
      .then(res => {
        setReviews(res.data.reviews || []);
        setAverage(res.data.average);
        setCount(res.data.count || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  // ── Submit review ─────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (rating === 0) { setFormError('Please select a star rating.'); return; }

    setSubmitting(true);
    try {
      const res = await client.post(`/reviews/product/${productId}`, { rating, comment });
      setReviews(prev => [res.data.review, ...prev]);
      setCount(c => c + 1);
      setAverage(prev => prev
        ? ((parseFloat(prev) * (count) + rating) / (count + 1)).toFixed(1)
        : rating.toFixed(1)
      );
      setSubmitted(true);
      setRating(0);
      setComment('');
    } catch (err) {
      setFormError(err?.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (iso) => new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <div className="pr-section">
      <div className="pr-header">
        <h2 className="pr-title">Customer Reviews</h2>
        {count > 0 && (
          <div className="pr-summary">
            <span className="pr-avg">{average}</span>
            <Stars value={Math.round(average)} />
            <span className="pr-count">{count} review{count !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* ── Write a review ──────────────────────────────────────────────── */}
      <div className="pr-form-wrap">
        {!isLoggedIn ? (
          <p className="pr-login-note">
            <a href="/login">Log in</a> to leave a review.
          </p>
        ) : submitted ? (
          <div className="pr-submitted">
            <span className="pr-submitted-icon">✓</span>
            Thank you for your review!
          </div>
        ) : (
          <form className="pr-form" onSubmit={handleSubmit}>
            <h3 className="pr-form-title">Write a Review</h3>
            <div className="pr-form-rating">
              <span className="pr-form-label">Your Rating</span>
              <Stars value={rating} interactive onChange={setRating} />
            </div>
            <textarea
              className="pr-textarea"
              placeholder="Share your experience with this product… (optional)"
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              maxLength={500}
            />
            {formError && <p className="pr-form-error">{formError}</p>}
            <button
              type="submit"
              className="pr-submit-btn"
              disabled={submitting || rating === 0}
            >
              {submitting ? 'Submitting…' : 'Submit Review'}
            </button>
          </form>
        )}
      </div>

      {/* ── Review list ──────────────────────────────────────────────────── */}
      <div className="pr-list">
        {loading ? (
          <p className="pr-empty">Loading reviews…</p>
        ) : reviews.length === 0 ? (
          <p className="pr-empty">No reviews yet. Be the first to review this product.</p>
        ) : (
          reviews.map(r => (
            <div key={r.id} className="pr-item">
              <div className="pr-item-header">
                <div className="pr-item-left">
                  <div className="pr-avatar">
                    {r.reviewerName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <div className="pr-reviewer-name">{r.reviewerName}</div>
                    {r.reviewerType === 'reseller' && (
                      <span className="pr-reseller-badge">Verified Reseller</span>
                    )}
                  </div>
                </div>
                <div className="pr-item-right">
                  <Stars value={r.rating} />
                  <span className="pr-date">{formatDate(r.createdAt)}</span>
                </div>
              </div>
              {r.comment && <p className="pr-comment">{r.comment}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductReviews;