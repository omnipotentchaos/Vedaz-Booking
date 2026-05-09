# Vedaz - Real-Time Expert Session Booking System

A full-stack real-time booking platform for expert consultations, built with **React + Node.js + Express + MongoDB + Socket.io**.

## 🚀 Features

### Frontend (React + Vite)
- **Expert Listing** — Browse experts with search, category filter, and pagination
- **Expert Detail** — View profiles, specializations, and available time slots
- **Real-Time Slot Updates** — Slots update instantly via Socket.io when booked by others
- **Booking Form** — Full validation (name, email, phone, date, time, notes)
- **My Bookings** — Look up bookings by email with status tracking (Pending/Confirmed/Completed/Cancelled)

### Backend (Node.js + Express + MongoDB)
- **RESTful API** with proper MVC folder structure
- **Double Booking Prevention** — MongoDB transactions + atomic updates + compound unique index
- **Real-Time Updates** — Socket.io broadcasts slot changes instantly
- **Input Validation** — express-validator on all endpoints
- **Error Handling** — Meaningful error responses with proper HTTP status codes

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router, Socket.io-client |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Real-Time | Socket.io |
| Validation | express-validator |

## 📁 Project Structure

```
vedaz/
├── backend/
│   ├── controllers/
│   │   ├── expertController.js
│   │   └── bookingController.js
│   ├── models/
│   │   ├── Expert.js
│   │   └── Booking.js
│   ├── routes/
│   │   ├── expertRoutes.js
│   │   └── bookingRoutes.js
│   ├── server.js
│   ├── seed.js
│   └── .env.example
└── frontend/
    └── src/
        ├── api/index.js
        ├── socket.js
        ├── pages/
        │   ├── ExpertListing.jsx
        │   ├── ExpertDetail.jsx
        │   └── MyBookings.jsx
        ├── App.jsx
        └── index.css
```

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally (or MongoDB Atlas URI)

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env    # Edit .env if needed
npm run seed            # Seed database with sample experts
npm run dev             # Starts on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev             # Starts on http://localhost:5173
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/experts` | List experts (pagination + filter) |
| GET | `/api/experts/categories` | Get all categories |
| GET | `/api/experts/:id` | Get expert details + availability |
| POST | `/api/bookings` | Create a booking |
| GET | `/api/bookings?email=` | Get bookings by email |
| PATCH | `/api/bookings/:id/status` | Update booking status |

## ⚠️ Double Booking Prevention

Three layers of protection:
1. **Application Layer** — Atomic `findOneAndUpdate` with `isBooked: false` condition
2. **Transaction** — MongoDB session ensures slot update + booking creation are atomic
3. **Database Layer** — Compound unique index on `(expert, date, timeSlot)` as final fallback

## 🔄 Real-Time Updates

Socket.io events:
- `slotBooked` — Broadcasts when a slot is booked/freed
- `bookingStatusUpdated` — Broadcasts when a booking status changes

## 📝 Environment Variables

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/vedaz-booking
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```
