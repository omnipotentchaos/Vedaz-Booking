const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const bookingController = require('../controllers/bookingController');

// Validation middleware
const validateBooking = [
  body('expertId')
    .notEmpty().withMessage('Expert ID is required')
    .isMongoId().withMessage('Invalid expert ID format'),
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[+]?[\d\s-]{7,15}$/).withMessage('Invalid phone number format'),
  body('date')
    .notEmpty().withMessage('Date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format'),
  body('timeSlot')
    .trim()
    .notEmpty().withMessage('Time slot is required'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes must be under 500 characters')
];

const validateStatusUpdate = [
  param('id')
    .isMongoId().withMessage('Invalid booking ID format'),
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['pending', 'confirmed', 'completed', 'cancelled'])
    .withMessage('Status must be pending, confirmed, completed, or cancelled')
];

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// POST /api/bookings - Create a booking
router.post('/', validateBooking, handleValidationErrors, bookingController.createBooking);

// GET /api/bookings?email= - Get bookings by email
router.get('/', bookingController.getBookings);

// PATCH /api/bookings/:id/status - Update booking status
router.patch('/:id/status', validateStatusUpdate, handleValidationErrors, bookingController.updateBookingStatus);

module.exports = router;
