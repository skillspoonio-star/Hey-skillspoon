const mongoose = require('mongoose');

// sub-schema for payment so we can default the whole payment field to null
const PaymentSchema = new mongoose.Schema({
  subtotal: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  extraCharge: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  paymentStatus: { type: String, enum: ['pending','paid','failed','refunded'], default: 'pending' },
}, { _id: false });

const ReservationSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  date: { type: String, required: true }, // YYYY-MM-DD
  time: { type: String, required: true }, // HH:mm
  guests: { type: Number, required: true, min: 1 },
  // support multiple tables per reservation
  tableNumbers: { type: [Number], default: [] },
  // keep single tableNumber for backward compatibility
  tableNumber: { type: Number },
  // public reservation identifier like RES1, RES2 ... (stored in `id`)
  id: { type: String, unique: true, index: true },
  status: { type: String, enum: ['pending','confirmed','seated','completed','cancelled','no-show','paid'], default: 'pending' },
  specialRequests: { type: String, default: null },
  occasion: { type: String },
  // payment details for the reservation - default to null when not provided
  payment: { type: PaymentSchema, default: null },
  sessionMinutes: { type: Number, default: 60 }, // session length in minutes (default 60)
  createdAt: { type: Date, default: Date.now },
  notes: { type: String },
  sessionId: { type: String },
}, { timestamps: true });

ReservationSchema.virtual('reservationTime').get(function() {
  // Combine date and time into ISO string
  if (!this.date || !this.time) return null;
  return new Date(`${this.date}T${this.time}`);
});

const Reservation = mongoose.model('Reservation', ReservationSchema);

module.exports = Reservation;
