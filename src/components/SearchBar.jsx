import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import './SearchBar.css';

// Debounce helper — fires fn only after `delay` ms of silence
const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const SearchBar = ({ isOpen, onClose }) => {
  const navigate  = useNavigate();
  const inputRef  = useRef(null);
  const overlayRef = useRef(null);

  const [query,       setQuery]       = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [activeIdx,   setActiveIdx]   = useState(-1);

  const debouncedQuery = useDebounce(query, 220);

  // Focus input when overlay opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSuggestions([]);
      setActiveIdx(-1);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  // Fetch autocomplete suggestions
  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    client.get('/search/suggestions', { params: { q: debouncedQuery } })
      .then(res => {
        if (!cancelled) setSuggestions(res.data?.suggestions || []);
      })
      .catch(() => { if (!cancelled) setSuggestions([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    onClose();
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleSuggestionClick = (s) => {
    onClose();
    navigate(`/product/${s.id}`);
  };

  // Keyboard navigation through suggestions
  const handleKeyDown = (e) => {
    if (!suggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[activeIdx]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="search-overlay" ref={overlayRef} onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}>
      <div className="search-panel">

        <form className="search-form" onSubmit={handleSubmit}>
          <div className="search-input-wrap">
            {/* Search icon */}
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>

            <input
              ref={inputRef}
              type="text"
              className="search-input"
              placeholder="Search jewellery, materials, categories…"
              value={query}
              onChange={e => { setQuery(e.target.value); setActiveIdx(-1); }}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              spellCheck={false}
            />

            {query && (
              <button type="button" className="search-clear" onClick={() => { setQuery(''); setSuggestions([]); inputRef.current?.focus(); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}

            <button type="submit" className="search-submit">Search</button>
          </div>
        </form>

        {/* Suggestions dropdown */}
        {query.trim().length >= 2 && (
          <div className="search-suggestions">
            {loading && (
              <div className="search-hint">
                <span className="search-spinner" />
                Looking…
              </div>
            )}

            {!loading && suggestions.length === 0 && (
              <div className="search-hint search-no-results">
                No results for "<strong>{query}</strong>" — try a different word
              </div>
            )}

            {!loading && suggestions.length > 0 && suggestions.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={`search-suggestion-item ${i === activeIdx ? 'active' : ''}`}
                onClick={() => handleSuggestionClick(s)}
                onMouseEnter={() => setActiveIdx(i)}
              >
                {s.image ? (
                  <img
                    src={s.image}
                    alt={s.title}
                    className="search-suggestion-img"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="search-suggestion-img search-suggestion-placeholder">💎</div>
                )}
                <div className="search-suggestion-info">
                  <span className="search-suggestion-title">{highlightMatch(s.title, query)}</span>
                  {s.material && <span className="search-suggestion-material">{s.material}</span>}
                </div>
                <span className="search-suggestion-price">₹{Number(s.price).toLocaleString('en-IN')}</span>
              </button>
            ))}

            {/* "See all results" footer */}
            {!loading && suggestions.length > 0 && (
              <button
                type="button"
                className="search-see-all"
                onClick={handleSubmit}
              >
                See all results for "<strong>{query}</strong>"
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Empty state hint — shown before any typing */}
        {query.trim().length < 2 && (
          <div className="search-hints-row">
            <span className="search-hint-label">Try</span>
            {['Necklace', 'Gold', 'Bangle', 'Earrings'].map(term => (
              <button key={term} type="button" className="search-hint-chip"
                onClick={() => setQuery(term)}>
                {term}
              </button>
            ))}
          </div>
        )}

        <button className="search-close-btn" onClick={onClose} aria-label="Close search">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

// Wrap matched substring in <mark>
const highlightMatch = (text, query) => {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="search-highlight">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
};

export default SearchBar;