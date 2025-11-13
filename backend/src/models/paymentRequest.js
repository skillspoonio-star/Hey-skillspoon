const mongoose = require('mongoose')

const paymentRequestSchema = new mongoose.Schema(
  {
    tableNumber: { type: Number, required: true },
    sessionId: { type: mongoose.Schema.Types.Mixed, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

module.exports = mongoose.model('PaymentRequest', paymentRequestSchema)
