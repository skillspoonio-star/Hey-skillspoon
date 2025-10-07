const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  date: { type: String, required: true }, // YYYY-MM-DD
  time: { type: String, required: true }, // HH:mm
  guests: { type: Number, required: true, min: 1 },
  tableNumber: { type: Number },
  status: { type: String, enum: ['pending','confirmed','seated','completed','cancelled','no-show'], default: 'pending' },
  specialRequests: { type: String },
  occasion: { type: String },
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
