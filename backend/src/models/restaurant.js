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
  locationLink: {
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
  todaysSpecialImages: {
    image1: { type: String, default: "" },
    image2: { type: String, default: "" },
    image3: { type: String, default: "" }
  },
  todaysSpecialDishes: {
    dish1: {
      name: { type: String, default: "Signature Butter Chicken" },
      description: { type: String, default: "Chef's special recipe with 20+ spices" },
      price: { type: String, default: "₹399" },
      prepTime: { type: String, default: "25 min" },
      isVeg: { type: Boolean, default: false },
      rating: { type: Number, default: 4.8, min: 0, max: 5 }
    },
    dish2: {
      name: { type: String, default: "Royal Paneer Makhani" },
      description: { type: String, default: "Creamy paneer in rich tomato gravy" },
      price: { type: String, default: "₹349" },
      prepTime: { type: String, default: "20 min" },
      isVeg: { type: Boolean, default: true },
      rating: { type: Number, default: 4.7, min: 0, max: 5 }
    },
    dish3: {
      name: { type: String, default: "Hyderabadi Biryani" },
      description: { type: String, default: "Authentic dum-cooked basmati rice" },
      price: { type: String, default: "₹449" },
      prepTime: { type: String, default: "35 min" },
      isVeg: { type: Boolean, default: false },
      rating: { type: Number, default: 4.9, min: 0, max: 5 }
    }
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