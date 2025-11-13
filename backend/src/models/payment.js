const mongoose = require('mongoose')

const PaymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['cash', 'card', 'upi', 'qr'],
    default: 'cash',
  },
  paymentOf: {
    type: String,
    enum: ['order', 'reservation', 'session'],
    required: true,
  },
  // Link to the entity (only one will be populated based on paymentOf)
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null,
  },
  reservationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',
    default: null,
  },
  sessionId: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model('Payment', PaymentSchema)
