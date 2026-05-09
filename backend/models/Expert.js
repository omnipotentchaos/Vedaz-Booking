const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  time: {
    type: String,
    required: true
  },
  isBooked: {
    type: Boolean,
    default: false
  }
}, { _id: true });

const availabilitySchema = new mongoose.Schema({
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true
  },
  slots: [timeSlotSchema]
}, { _id: true });

const expertSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Expert name is required'],
    trim: true,
    index: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    index: true
  },
  experience: {
    type: Number,
    required: [true, 'Experience is required'],
    min: 0
  },
  rating: {
    type: Number,
    required: true,
    min: 0,
    max: 5,
    default: 0
  },
  bio: {
    type: String,
    trim: true
  },
  specializations: [{
    type: String,
    trim: true
  }],
  avatar: {
    type: String,
    default: ''
  },
  pricePerSession: {
    type: Number,
    default: 0
  },
  availability: [availabilitySchema]
}, {
  timestamps: true
});

// Text index for search functionality
expertSchema.index({ name: 'text', category: 'text', bio: 'text' });

module.exports = mongoose.model('Expert', expertSchema);
