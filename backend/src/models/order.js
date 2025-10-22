const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  itemId: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  tableNumber: { type: Number, default: null },
  items: { type: [ItemSchema], default: [] },
  total: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, required: true, min: 0 },
  tax: { type: Number, required: true, min: 0 },
  discount: { type: Number, required: true, min: 0, default: 0 },
  extraCharges: { type: Number, required: true, min: 0, default: 0 },
  status: { type: String, enum: ['pending','preparing','ready','served','cancelled'], default: 'pending' },
  timestamp: { type: Date, default: Date.now },
  customerPhone: { type: String },
  customerName: { type: String },
  estimatedTime: { type: Number },
  specialRequests: {type: String,default : null},
  priority: { type: String, enum: ['low','medium','high'], default: 'medium' },
  paymentStatus: { type: String, enum: ['paid','unpaid'], default: 'unpaid' },
  paymentMethod: { type: String, enum: ['cash','card','upi','pending'], default: 'pending' },
  orderType: { type: String, enum: ['dine-in','take-away','delivery'], required: true },
}, { timestamps: true });

const Order = mongoose.model('Order', OrderSchema);

module.exports = Order;