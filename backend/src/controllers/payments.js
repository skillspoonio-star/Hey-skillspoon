const mongoose = require('mongoose')
const Payment = require('../models/payment')

// Get all payments (with optional filters)
async function getPayments(req, res) {
  try {
    const { paymentOf, type, startDate, endDate } = req.query
    const filters = {}

    if (paymentOf) filters.paymentOf = paymentOf
    if (type) filters.type = type

    if (startDate || endDate) {
      filters.createdAt = {}
      if (startDate) filters.createdAt.$gte = new Date(startDate)
      if (endDate) filters.createdAt.$lte = new Date(endDate)
    }

    const payments = await Payment.find(filters).sort({ createdAt: -1 }).lean()
    return res.json(payments)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
}

// Get single payment
async function getPayment(req, res) {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid payment ID' })
    }

    const payment = await Payment.findById(id).lean()
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' })
    }

    return res.json(payment)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
}

// Create a payment
async function createPayment(req, res) {
  console.log("Creating payment with data:");
  try {
    const { amount, type, paymentOf, orderId, reservationId, sessionId } = req.body

    // Validate required fields
    console.log(req.body);
    if (!amount || typeof amount !== 'number') {
      return res.status(400).json({ error: 'amount is required and must be a number' })
    }
    if (!paymentOf || !['order', 'reservation', 'session'].includes(paymentOf)) {
      return res.status(400).json({ error: 'paymentOf is required (order/reservation/session)' })
    }
    if (type && !['cash', 'card', 'upi', 'qr'].includes(type)) {
      return res.status(400).json({ error: 'invalid type' })
    }

    // Validate that the correct ID is provided based on paymentOf
    if (paymentOf === 'order' && !orderId) {
      return res.status(400).json({ error: 'orderId required for order payment' })
    }
    if (paymentOf === 'reservation' && !reservationId) {
      return res.status(400).json({ error: 'reservationId required for reservation payment' })
    }
    if (paymentOf === 'session' && !sessionId) {
      return res.status(400).json({ error: 'sessionId required for session payment' })
    }

    const payment = new Payment({
      amount,
      type: type || 'cash',
      paymentOf,
      orderId: paymentOf === 'order' ? orderId : null,
      reservationId: paymentOf === 'reservation' ? reservationId : null,
      sessionId: paymentOf === 'session' ? sessionId : null,
    })

    await payment.save()
    return res.status(201).json(payment)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
}

// Update a payment (mainly for type or other metadata, not amount)
async function updatePayment(req, res) {
  try {
    const { id } = req.params
    const { type } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid payment ID' })
    }

    const updates = { updatedAt: new Date() }
    if (type && ['cash', 'card', 'upi', 'qr'].includes(type)) {
      updates.type = type
    }

    const payment = await Payment.findByIdAndUpdate(id, updates, { new: true }).lean()
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' })
    }

    return res.json(payment)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
}

// Delete a payment
async function deletePayment(req, res) {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid payment ID' })
    }

    const payment = await Payment.findByIdAndDelete(id).lean()
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' })
    }

    return res.json({ message: 'Payment deleted', payment })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
}

// Get all payments for a specific table/session (cash payment requests)
// Query params: sessionId (required) or tableNumber
async function getTablePayments(req, res) {
  try {
    const Session = require('../models/session')
    const Table = require('../models/table')

    // Fetch all active sessions
    const activeSessions = await Session.find({ active: true }).lean()

    if (!activeSessions || activeSessions.length === 0) {
      return res.json([])
    }

    const result = []

    // For each active session, get its table data and associated payments
    for (const session of activeSessions) {
      const tableNumber = session.tableNumber
      const sessionId = session.sessionId || session._id

      // Fetch table info
      let tableData = null
      try {
        tableData = await Table.findOne({ number: tableNumber }).lean()
      } catch (e) {
        console.warn(`Failed to fetch table ${tableNumber}`, e)
      }

      // Fetch payments for this session
      let payments = []
      try {
        payments = await Payment.find({ 
          paymentOf: 'session', 
          sessionId: sessionId 
        }).sort({ createdAt: -1 }).lean()
      } catch (e) {
        console.warn(`Failed to fetch payments for session ${sessionId}`, e)
      }

      result.push({
        session: {
          _id: session._id,
          sessionId: session.sessionId,
          tableNumber: session.tableNumber,
          customerName: session.customerName,
          guestCount: session.guestCount,
          phoneNumber: session.phoneNumber,
          active: session.active,
          totalAmount: session.totalAmount,
          createdAt: session.createdAt,
        },
        table: tableData ? {
          _id: tableData._id,
          number: tableData.number,
          capacity: tableData.capacity,
          status: tableData.status,
        } : null,
        payments: payments,
      })
    }

    return res.json(result)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
}

module.exports = {
  getPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment,
  getTablePayments,
}
