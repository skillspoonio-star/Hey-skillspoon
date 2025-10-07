const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  itemId: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  tableNumber: { type: Number, default: null },
  items: { type: [ItemSchema], default: [] },
  total: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending','preparing','ready','served','cancelled'], default: 'pending' },
  timestamp: { type: Date, default: Date.now },
  customerPhone: { type: String },
  customerName: { type: String },
  estimatedTime: { type: Number },
  priority: { type: String, enum: ['low','medium','high'], default: 'medium' },
  paymentStatus: { type: String, enum: ['paid','unpaid'], default: 'unpaid' },
  orderType: { type: String, enum: ['dine-in','take-away','delivery'], required: true },
}, { timestamps: true });

const Order = mongoose.model('Order', OrderSchema);

module.exports = Order;