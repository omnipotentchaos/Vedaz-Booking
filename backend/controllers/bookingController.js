const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Expert = require('../models/Expert');

/**
 * POST /api/bookings
 * Create a new booking with double-booking prevention
 * 
 * Double-booking is prevented via two layers:
 * 1. Atomic findOneAndUpdate — only updates if isBooked is false (race-safe)
 * 2. Compound unique index on Booking (expert + date + timeSlot) as final fallback
 */
exports.createBooking = async (req, res) => {
  try {
    const { expertId, name, email, phone, date, timeSlot, notes } = req.body;

    // Validate expert exists
    const expert = await Expert.findById(expertId);
    if (!expert) {
      return res.status(404).json({
        success: false,
        message: 'Expert not found'
      });
    }

    // Find the specific date in availability
    const dateAvailability = expert.availability.find(a => a.date === date);
    if (!dateAvailability) {
      return res.status(400).json({
        success: false,
        message: 'No availability for the selected date'
      });
    }

    // Find the specific slot
    const slot = dateAvailability.slots.find(s => s.time === timeSlot);
    if (!slot) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time slot'
      });
    }

    // Check if slot is already booked (quick check before atomic update)
    if (slot.isBooked) {
      return res.status(409).json({
        success: false,
        message: 'This time slot has already been booked. Please select another slot.'
      });
    }

    // ATOMIC update — only succeeds if isBooked is still false (prevents race conditions)
    const updateResult = await Expert.findOneAndUpdate(
      {
        _id: expertId,
        'availability.date': date,
        'availability.slots': {
          $elemMatch: { time: timeSlot, isBooked: false }
        }
      },
      {
        $set: {
          'availability.$[dateElem].slots.$[slotElem].isBooked': true
        }
      },
      {
        arrayFilters: [
          { 'dateElem.date': date },
          { 'slotElem.time': timeSlot }
        ],
        new: true
      }
    );

    if (!updateResult) {
      return res.status(409).json({
        success: false,
        message: 'This time slot was just booked by someone else. Please select another slot.'
      });
    }

    // Create the booking record
    let booking;
    try {
      booking = await Booking.create({
        expert: expertId,
        name,
        email,
        phone,
        date,
        timeSlot,
        notes: notes || ''
      });
    } catch (bookingError) {
      // If booking creation fails (e.g., duplicate key), revert the slot
      await Expert.findOneAndUpdate(
        { _id: expertId, 'availability.date': date },
        { $set: { 'availability.$[dateElem].slots.$[slotElem].isBooked': false } },
        { arrayFilters: [{ 'dateElem.date': date }, { 'slotElem.time': timeSlot }] }
      );
      throw bookingError;
    }

    // Populate expert info for response
    const populatedBooking = await Booking.findById(booking._id)
      .populate('expert', 'name category avatar')
      .lean();

    // Emit real-time slot update via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('slotBooked', {
        expertId,
        date,
        timeSlot,
        isBooked: true
      });
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully!',
      data: populatedBooking
    });
  } catch (error) {
    // Handle duplicate key error (race condition fallback from compound index)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This time slot has already been booked. Please select another slot.'
      });
    }

    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * GET /api/bookings
 * Get bookings by email
 */
exports.getBookings = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required to fetch bookings'
      });
    }

    const bookings = await Booking.find({ email: email.toLowerCase() })
      .populate('expert', 'name category avatar rating')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * PATCH /api/bookings/:id/status
 * Update booking status
 */
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // If cancelling, free up the slot
    if (status === 'cancelled' && booking.status !== 'cancelled') {
      await Expert.findOneAndUpdate(
        {
          _id: booking.expert,
          'availability.date': booking.date
        },
        {
          $set: {
            'availability.$[dateElem].slots.$[slotElem].isBooked': false
          }
        },
        {
          arrayFilters: [
            { 'dateElem.date': booking.date },
            { 'slotElem.time': booking.timeSlot }
          ]
        }
      );

      // Emit real-time slot freed event
      const io = req.app.get('io');
      if (io) {
        io.emit('slotBooked', {
          expertId: booking.expert.toString(),
          date: booking.date,
          timeSlot: booking.timeSlot,
          isBooked: false
        });
      }
    }

    booking.status = status;
    await booking.save();

    const updatedBooking = await Booking.findById(id)
      .populate('expert', 'name category avatar rating')
      .lean();

    // Emit booking status update
    const io = req.app.get('io');
    if (io) {
      io.emit('bookingStatusUpdated', {
        bookingId: id,
        status,
        email: booking.email
      });
    }

    res.json({
      success: true,
      message: `Booking status updated to ${status}`,
      data: updatedBooking
    });
  } catch (error) {
    console.error('Error updating booking status:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update booking status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
