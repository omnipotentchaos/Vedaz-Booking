import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getExpertById, createBooking } from '../api';
import socket from '../socket';

function ExpertDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expert, setExpert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Booking form
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', notes: '' });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetchExpert();

    // Join expert room for real-time updates
    socket.emit('joinExpertRoom', id);

    // Listen for slot updates
    socket.on('slotBooked', (data) => {
      if (data.expertId === id) {
        setExpert(prev => {
          if (!prev) return prev;
          const updated = { ...prev };
          updated.availability = updated.availability.map(day => {
            if (day.date === data.date) {
              return {
                ...day,
                slots: day.slots.map(slot =>
                  slot.time === data.timeSlot ? { ...slot, isBooked: data.isBooked } : slot
                )
              };
            }
            return day;
          });
          return updated;
        });

        if (data.isBooked) {
          toast('A slot was just booked by another user!', { icon: '⚡' });
          if (selectedSlot === data.timeSlot && selectedDate === data.date) {
            setSelectedSlot('');
            setSelectedDate('');
          }
        }
      }
    });

    return () => {
      socket.emit('leaveExpertRoom', id);
      socket.off('slotBooked');
    };
  }, [id]);

  const fetchExpert = async () => {
    setLoading(true);
    try {
      const res = await getExpertById(id);
      setExpert(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.getTime() === today.getTime()) return 'Today';
    if (date.getTime() === tomorrow.getTime()) return 'Tomorrow';
    return date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) errors.email = 'Invalid email';
    if (!formData.phone.trim()) errors.phone = 'Phone is required';
    else if (!/^[+]?[\d\s-]{7,15}$/.test(formData.phone)) errors.phone = 'Invalid phone number';
    if (!selectedDate) errors.date = 'Please select a date';
    if (!selectedSlot) errors.slot = 'Please select a time slot';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await createBooking({
        expertId: id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        date: selectedDate,
        timeSlot: selectedSlot,
        notes: formData.notes,
      });
      setShowSuccess(true);
      setFormData({ name: '', email: '', phone: '', notes: '' });
      setSelectedSlot('');
      setSelectedDate('');
      fetchExpert(); // Refresh slots
    } catch (err) {
      toast.error(err.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(<span key={i} className={`star ${i <= Math.round(rating) ? '' : 'empty'}`}>★</span>);
    }
    return stars;
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div><p style={{ color: 'var(--text-muted)' }}>Loading expert details...</p></div>;
  if (error) return <div className="error-container"><p className="error-msg">⚠️ {error}</p><button className="btn btn-primary" onClick={fetchExpert}>Try Again</button></div>;
  if (!expert) return null;

  return (
    <div>
      <button className="back-btn" onClick={() => navigate('/')}>← Back to Experts</button>

      <div className="detail-header">
        <div className="detail-avatar">
          <img src={expert.avatar} alt={expert.name} />
        </div>
        <div className="detail-info">
          <h1>{expert.name}</h1>
          <span className="expert-category">✦ {expert.category}</span>
          <div className="detail-stats">
            <div className="stat-item">
              <div className="stat-value">{expert.experience}</div>
              <div className="stat-label">Years Exp</div>
            </div>
            <div className="stat-item">
              <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {renderStars(expert.rating)} {expert.rating}
              </div>
              <div className="stat-label">Rating</div>
            </div>
            <div className="stat-item">
              <div className="stat-value" style={{ color: 'var(--success)' }}>₹{expert.pricePerSession}</div>
              <div className="stat-label">Per Session</div>
            </div>
          </div>
          {expert.bio && <p className="detail-bio">{expert.bio}</p>}
          {expert.specializations?.length > 0 && (
            <div className="expert-tags" style={{ marginTop: 16 }}>
              {expert.specializations.map(s => <span key={s} className="tag">{s}</span>)}
            </div>
          )}
        </div>
      </div>

      {/* Available Time Slots */}
      <div className="slots-section">
        <h2>📅 Available Time Slots</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
          Slots update in real-time. Select a date and time to book.
        </p>
        {expert.availability?.map(day => (
          <div key={day.date} className="date-group">
            <div className="date-label">{formatDate(day.date)} — {day.date}</div>
            <div className="slots-grid">
              {day.slots.map(slot => (
                <button
                  key={`${day.date}-${slot.time}`}
                  className={`slot-btn ${slot.isBooked ? 'booked' : ''} ${selectedDate === day.date && selectedSlot === slot.time ? 'selected' : ''}`}
                  disabled={slot.isBooked}
                  onClick={() => { setSelectedDate(day.date); setSelectedSlot(slot.time); setFormErrors(prev => ({ ...prev, date: '', slot: '' })); }}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          </div>
        ))}
        {(formErrors.date || formErrors.slot) && (
          <p className="form-error">{formErrors.date || formErrors.slot}</p>
        )}
      </div>

      {/* Booking Form */}
      <div className="booking-form-container" style={{ marginTop: 32 }}>
        <h2>📝 Book a Session</h2>
        {selectedDate && selectedSlot && (
          <p style={{ color: 'var(--accent-light)', marginBottom: 16, fontSize: '0.9rem' }}>
            Selected: <strong>{formatDate(selectedDate)}</strong> at <strong>{selectedSlot}</strong>
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                className={`form-input ${formErrors.name ? 'error' : ''}`}
                type="text" placeholder="John Doe"
                value={formData.name}
                onChange={e => { setFormData({ ...formData, name: e.target.value }); setFormErrors(prev => ({ ...prev, name: '' })); }}
              />
              {formErrors.name && <p className="form-error">{formErrors.name}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input
                className={`form-input ${formErrors.email ? 'error' : ''}`}
                type="email" placeholder="john@example.com"
                value={formData.email}
                onChange={e => { setFormData({ ...formData, email: e.target.value }); setFormErrors(prev => ({ ...prev, email: '' })); }}
              />
              {formErrors.email && <p className="form-error">{formErrors.email}</p>}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number *</label>
            <input
              className={`form-input ${formErrors.phone ? 'error' : ''}`}
              type="tel" placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={e => { setFormData({ ...formData, phone: e.target.value }); setFormErrors(prev => ({ ...prev, phone: '' })); }}
            />
            {formErrors.phone && <p className="form-error">{formErrors.phone}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Notes (Optional)</label>
            <textarea
              className="form-textarea"
              placeholder="Any specific topics you'd like to discuss..."
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: '100%', padding: '14px' }}>
            {submitting ? 'Booking...' : '✦ Confirm Booking'}
          </button>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="success-overlay" onClick={() => setShowSuccess(false)}>
          <div className="success-card" onClick={e => e.stopPropagation()}>
            <div className="success-icon">🎉</div>
            <h2>Booking Confirmed!</h2>
            <p>Your session has been booked successfully. You'll receive a confirmation shortly.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setShowSuccess(false)}>Book Another</button>
              <button className="btn btn-primary" onClick={() => navigate('/bookings')}>View Bookings</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExpertDetail;
