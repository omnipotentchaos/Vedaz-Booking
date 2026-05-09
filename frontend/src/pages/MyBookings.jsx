import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getBookings, updateBookingStatus } from '../api';
import socket from '../socket';

function MyBookings() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Listen for real-time booking status updates
    socket.on('bookingStatusUpdated', (data) => {
      setBookings(prev =>
        prev.map(b => b._id === data.bookingId ? { ...b, status: data.status } : b)
      );
      toast.success(`Booking status updated to ${data.status}`, { icon: '🔔' });
    });

    return () => { socket.off('bookingStatusUpdated'); };
  }, []);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await getBookings(email);
      setBookings(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId, status) => {
    try {
      await updateBookingStatus(bookingId, status);
      toast.success(`Booking ${status}`);
      handleSearch(); // Refresh
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getStatusClass = (status) => `status-badge status-${status}`;

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div>
      <div className="page-header">
        <h1>📋 My Bookings</h1>
        <p>View and manage your session bookings</p>
      </div>

      <form onSubmit={handleSearch} className="email-lookup">
        <input
          className="form-input"
          type="email"
          placeholder="Enter your email to find bookings..."
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Searching...' : '🔍 Search'}
        </button>
      </form>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-muted)' }}>Finding your bookings...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p className="error-msg">⚠️ {error}</p>
        </div>
      ) : searched && bookings.length === 0 ? (
        <div className="empty-container">
          <div className="empty-icon">📭</div>
          <p className="empty-text">No bookings found for this email.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/')}>
            Browse Experts
          </button>
        </div>
      ) : (
        <div>
          {bookings.map(booking => (
            <div key={booking._id} className="booking-card">
              {booking.expert?.avatar && (
                <div className="expert-avatar">
                  <img src={booking.expert.avatar} alt={booking.expert?.name} />
                </div>
              )}
              <div className="booking-details">
                <h3>{booking.expert?.name || 'Expert'}</h3>
                <div className="booking-meta">
                  <span>📅 {formatDate(booking.date)}</span>
                  <span>🕐 {booking.timeSlot}</span>
                  <span>✦ {booking.expert?.category}</span>
                </div>
                {booking.notes && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 6 }}>
                    📝 {booking.notes}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                <span className={getStatusClass(booking.status)}>
                  {booking.status}
                </span>
                {booking.status === 'pending' && (
                  <button
                    className="btn btn-sm btn-outline"
                    style={{ borderColor: 'rgba(248,113,113,0.3)', color: 'var(--danger)' }}
                    onClick={() => handleStatusUpdate(booking._id, 'cancelled')}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyBookings;
