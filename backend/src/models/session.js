const mongoose = require('mongoose');

const SessionPaymentSchema = new mongoose.Schema({
  total: { type: Number, default: 0 },
  method: { type: String, enum: ['cash','card','upi','pending','other'], default: 'pending' },
  status: { type: String, enum: ['paid','unpaid','pending'], default: 'unpaid' },
  currency: { type: String, default: 'INR' },
}, { _id: false });

const SessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  tableNumber: { type: Number, required: true },
  orders: { type: [mongoose.Schema.Types.ObjectId], ref: 'Order', default: [] },
  customerName: { type: String },
  mobile: { type: String },
  payment: { type: SessionPaymentSchema, default: () => ({}) },
  active: { type: Boolean, default: true },
}, { timestamps: true });

const Session = mongoose.model('Session', SessionSchema);

module.exports = Session;
