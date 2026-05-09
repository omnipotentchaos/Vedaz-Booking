import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getExperts, getCategories } from '../api';

function ExpertListing() {
  const navigate = useNavigate();
  const [experts, setExperts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [searchTimeout, setSearchTimeout] = useState(null);

  const fetchExperts = useCallback(async (currentPage, currentSearch, currentCategory) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getExperts({
        page: currentPage,
        limit: 6,
        search: currentSearch,
        category: currentCategory,
      });
      setExperts(res.data);
      setPagination(res.pagination);
    } catch (err) {
      setError(err.message || 'Failed to load experts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getCategories().then(res => setCategories(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchExperts(page, search, category);
  }, [page, category, fetchExperts]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    setSearchTimeout(setTimeout(() => {
      setPage(1);
      fetchExperts(1, value, category);
    }, 400));
  };

  const handleCategoryChange = (cat) => {
    setCategory(cat === category ? '' : cat);
    setPage(1);
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(<span key={i} className={`star ${i <= Math.round(rating) ? '' : 'empty'}`}>★</span>);
    }
    return stars;
  };

  return (
    <div>
      <div className="page-header">
        <h1>✦ Our Experts</h1>
        <p>Book a session with world-class astrologers & consultants</p>
      </div>

      <div className="filters-bar">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search experts by name..."
            value={search}
            onChange={handleSearchChange}
            className="form-input"
            style={{ paddingLeft: '42px' }}
          />
        </div>
        <div className="category-filters">
          <button
            className={`btn btn-outline btn-sm ${!category ? 'active' : ''}`}
            onClick={() => handleCategoryChange('')}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              className={`btn btn-outline btn-sm ${category === cat ? 'active' : ''}`}
              onClick={() => handleCategoryChange(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-muted)' }}>Loading experts...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p className="error-msg">⚠️ {error}</p>
          <button className="btn btn-primary" onClick={() => fetchExperts(page, search, category)}>
            Try Again
          </button>
        </div>
      ) : experts.length === 0 ? (
        <div className="empty-container">
          <div className="empty-icon">🔮</div>
          <p className="empty-text">No experts found. Try adjusting your search.</p>
        </div>
      ) : (
        <>
          <div className="expert-grid">
            {experts.map(expert => (
              <div
                key={expert._id}
                className="card expert-card"
                onClick={() => navigate(`/experts/${expert._id}`)}
              >
                <div className="expert-header">
                  <div className="expert-avatar">
                    <img src={expert.avatar} alt={expert.name} />
                  </div>
                  <div className="expert-info">
                    <h3>{expert.name}</h3>
                    <span className="expert-category">✦ {expert.category}</span>
                  </div>
                </div>
                <div className="expert-meta">
                  <div className="expert-meta-item">
                    <span>⏳</span>
                    <span className="value">{expert.experience}</span> yrs exp
                  </div>
                  <div className="expert-meta-item">
                    <div className="rating">
                      {renderStars(expert.rating)}
                      <span className="rating-value">{expert.rating}</span>
                    </div>
                  </div>
                  <div className="expert-meta-item">
                    <span className="price">₹{expert.pricePerSession}<span>/session</span></span>
                  </div>
                </div>
                {expert.bio && <p className="expert-bio">{expert.bio}</p>}
              </div>
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={!pagination.hasPrevPage}
                onClick={() => setPage(p => p - 1)}
              >
                ← Prev
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  className={p === pagination.currentPage ? 'active' : ''}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={!pagination.hasNextPage}
                onClick={() => setPage(p => p + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ExpertListing;
