const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  image: { type: String ,default: ''},
  category: { type: String ,default: 'dessert'},
  prepTime: { type: String },
  rating: { type: Number ,default: 3.5},
  isVeg: { type: Boolean, default: false },
  isPopular: { type: Boolean, default: false },
  allergens: { type: [String], default: [] },
  calories: { type: Number },
}, { timestamps: true });

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

module.exports = MenuItem;
