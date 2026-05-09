const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || 'Something went wrong');
    error.data = data;
    error.status = response.status;
    throw error;
  }

  return data;
}

// Expert APIs
export const getExperts = (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', params.page);
  if (params.limit) searchParams.set('limit', params.limit);
  if (params.search) searchParams.set('search', params.search);
  if (params.category) searchParams.set('category', params.category);
  const query = searchParams.toString();
  return request(`/experts${query ? `?${query}` : ''}`);
};

export const getExpertById = (id) => request(`/experts/${id}`);

export const getCategories = () => request('/experts/categories');

// Booking APIs
export const createBooking = (bookingData) =>
  request('/bookings', {
    method: 'POST',
    body: JSON.stringify(bookingData),
  });

export const getBookings = (email) =>
  request(`/bookings?email=${encodeURIComponent(email)}`);

export const updateBookingStatus = (id, status) =>
  request(`/bookings/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
