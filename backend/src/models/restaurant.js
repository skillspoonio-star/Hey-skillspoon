const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: "Spice Garden Restaurant"
  },
  description: {
    type: String,
    default: ""
  },
  address: {
    type: String,
    default: ""
  },
  phone: {
    type: String,
    default: ""
  },
  email: {
    type: String,
    default: ""
  },
  website: {
    type: String,
    default: ""
  },
  openingHours: {
    monday: {
      open: { type: String, default: "11:00" },
      close: { type: String, default: "23:00" },
      closed: { type: Boolean, default: false }
    },
    tuesday: {
      open: { type: String, default: "11:00" },
      close: { type: String, default: "23:00" },
      closed: { type: Boolean, default: false }
    },
    wednesday: {
      open: { type: String, default: "11:00" },
      close: { type: String, default: "23:00" },
      closed: { type: Boolean, default: false }
    },
    thursday: {
      open: { type: String, default: "11:00" },
      close: { type: String, default: "23:00" },
      closed: { type: Boolean, default: false }
    },
    friday: {
      open: { type: String, default: "11:00" },
      close: { type: String, default: "23:00" },
      closed: { type: Boolean, default: false }
    },
    saturday: {
      open: { type: String, default: "11:00" },
      close: { type: String, default: "23:00" },
      closed: { type: Boolean, default: false }
    },
    sunday: {
      open: { type: String, default: "11:00" },
      close: { type: String, default: "23:00" },
      closed: { type: Boolean, default: false }
    }
  },
  cuisine: [{
    type: String
  }],
  priceRange: {
    type: String,
    enum: ['$', '$$', '$$$', '$$$$'],
    default: '$$'
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  images: [{
    type: String
  }],
  logo: {
    type: String,
    default: ""
  },
  interiorImage: {
    type: String,
    default: ""
  },
  isOpen: {
    type: Boolean,
    default: true
  },
  features: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
restaurantSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Restaurant', restaurantSchema);