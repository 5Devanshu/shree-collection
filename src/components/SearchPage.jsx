import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import client from '../api/client';
import ProductCard from './ProductCard';
import './SearchPage.css';

const SORT_OPTIONS = [
  { value: 'relevance',  label: 'Most Relevant' },
  { value: 'newest',     label: 'Newest First' },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const q    = searchParams.get('q')    || '';
  const page = Number(searchParams.get('page') || 1);
  const sort = searchParams.get('sort') || 'relevance';

  const [results,    setResults]    = useState([]);
  const [categories, setCategories] = useState([]);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  const fetchResults = useCallback(async () => {
    if (!q.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await client.get('/search', {
        params: { q, page, sort, limit: 12 },
      });
      const data = res.data;
      setResults(data.products   || []);
      setCategories(data.categories || []);
      setTotal(data.total        || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      setError('Search failed. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [q, page, sort]);

  useEffect(() => {
    fetchResults();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchResults]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    next.set(key, value);
    if (key !== 'page') next.set('page', '1');
    setSearchParams(next);
  };

  if (!q.trim()) return (
    <div className="sp-empty-page">
      <div className="sp-empty-icon">🔍</div>
      <h2>What are you looking for?</h2>
      <p>Enter a search term in the bar above to find jewellery.</p>
      <Link to="/" className="btn btn-secondary">Back to Home</Link>
    </div>
  );

  return (
    <div className="search-page">

      {/* ── Header ── */}
      <div className="sp-header">
        <div className="sp-header-inner">
          <div>
            <h1 className="sp-title">
              {loading ? 'Searching…' : (
                total > 0
                  ? <>{total} result{total !== 1 ? 's' : ''} for <em>"{q}"</em></>
                  : <>No results for <em>"{q}"</em></>
              )}
            </h1>
            {categories.length > 0 && (
              <div className="sp-category-chips">
                <span className="sp-chip-label">In</span>
                {categories.map(c => (
                  <Link key={c.id} to={`/collections/${c.slug}`} className="sp-category-chip">
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Sort */}
          {total > 0 && (
            <div className="sp-sort">
              <label className="sp-sort-label">Sort</label>
              <select
                value={sort}
                onChange={e => updateParam('sort', e.target.value)}
                className="sp-sort-select"
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="sp-error">{error}</div>
      )}

      {/* ── Skeleton loading ── */}
      {loading && (
        <div className="sp-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="sp-skeleton-card">
              <div className="sp-skeleton-img" />
              <div className="sp-skeleton-line w70" />
              <div className="sp-skeleton-line w40" />
            </div>
          ))}
        </div>
      )}

      {/* ── Results grid ── */}
      {!loading && results.length > 0 && (
        <div className="sp-grid">
          {results.map((p, i) => (
            <ProductCard
              key={p.id}
              id={p.id}
              _id={p.id}
              title={p.title}
              material={p.material}
              price={p.price}
              resellerPrice={p.resellerPrice}
              displayPrice={p.displayPrice}
              isResellerPrice={p.isResellerPrice}
              discountEnabled={p.discountEnabled}
              discountedPrice={p.discountedPrice}
              discountPercent={p.discountPercent}
              imageUrl={p.imageUrl}
              image={p.image}
              stock={p.stock}
              sizeEnabled={p.sizeEnabled}
              delay={i * 0.03}
            />
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && results.length === 0 && !error && (
        <div className="sp-no-results">
          <div className="sp-empty-icon">💎</div>
          <h3>No pieces found for "{q}"</h3>
          <p>Try a different keyword — material (Gold, Copper), type (Necklace, Bangle), or occasion.</p>
          <div className="sp-suggestions">
            {['Necklace', 'Bangle', 'Earrings', 'Gold', 'Mangalsutra'].map(term => (
              <button
                key={term}
                className="sp-suggestion-chip"
                onClick={() => updateParam('q', term)}
              >
                {term}
              </button>
            ))}
          </div>
          <Link to="/" className="btn btn-secondary" style={{ marginTop: '1.5rem' }}>
            Browse All
          </Link>
        </div>
      )}

      {/* ── Pagination ── */}
      {!loading && totalPages > 1 && (
        <div className="sp-pagination">
          <button
            className="sp-page-btn"
            disabled={page <= 1}
            onClick={() => updateParam('page', String(page - 1))}
          >
            ← Previous
          </button>

          <div className="sp-page-nums">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
              .reduce((acc, n, i, arr) => {
                if (i > 0 && n - arr[i - 1] > 1) acc.push('…');
                acc.push(n);
                return acc;
              }, [])
              .map((n, i) =>
                n === '…'
                  ? <span key={`ellipsis-${i}`} className="sp-ellipsis">…</span>
                  : <button
                      key={n}
                      className={`sp-page-num ${n === page ? 'active' : ''}`}
                      onClick={() => updateParam('page', String(n))}
                    >{n}</button>
              )}
          </div>

          <button
            className="sp-page-btn"
            disabled={page >= totalPages}
            onClick={() => updateParam('page', String(page + 1))}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchPage;