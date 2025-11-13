const mongoose = require('mongoose')
const PaymentRequest = require('../models/paymentRequest')
const Payment = require('../models/payment')
const Session = require('../models/session')
const Order = require('../models/order')

// Create a payment request (temporary, stores only tableNumber, sessionId, timestamp)
async function createPaymentRequest(req, res) {
  try {
    const { tableNumber, sessionId } = req.body

    // Validate required fields
    if (!tableNumber || typeof tableNumber !== 'number') {
      return res.status(400).json({ error: 'tableNumber is required and must be a number' })
    }
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' })
    }

    const paymentRequest = new PaymentRequest({
      tableNumber: Number(tableNumber),
      sessionId: sessionId,
      timestamp: new Date(),
    })

    await paymentRequest.save()
    return res.status(201).json(paymentRequest)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
}

// Get all payment requests from last 1 hour + calculate unpaid order totals per table
// Auto-delete requests that are older than 1 hour or have zero total amount
async function getPaymentRequests(req, res) {
  try {
    // Find all payment requests created in the last 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const requests = await PaymentRequest.find({
      timestamp: { $gte: oneHourAgo },
    })
      .sort({ timestamp: -1 })
      .lean()

    // Get unique table numbers from requests
    const tableNumbers = [...new Set(requests.map((r) => r.tableNumber))]

    // For each table, calculate total unpaid order amount
    const tablePayments = await Promise.all(
      tableNumbers.map(async (tableNum) => {
        // Find all unpaid orders for this table
        const unpaidOrders = await Order.find({
          tableNumber: tableNum,
          paymentStatus: 'unpaid',
        }).lean()

        // Sum up the totals
        const totalAmount = unpaidOrders.reduce((sum, order) => sum + (order.total || 0), 0)

        // Find the most recent request for this table
        const tableRequest = requests.find((r) => r.tableNumber === tableNum)

        // If total amount is 0 (no unpaid orders) or request is expired, delete it immediately
        if (totalAmount === 0 || !tableRequest) {
          try {
            await PaymentRequest.findByIdAndDelete(tableRequest?._id)
          } catch (deleteErr) {
            console.warn(`Failed to delete payment request for table ${tableNum}`, deleteErr)
          }
          // Skip this entry from response
          return null
        }

        return {
          tableNumber: tableNum,
          _id: tableRequest._id,
          totalAmount: Math.round(totalAmount * 100) / 100, // Round to 2 decimals
          timestamp: tableRequest.timestamp,
          unpaidOrderCount: unpaidOrders.length,
        }
      })
    )

    // Filter out null entries (deleted requests)
    const validPayments = tablePayments.filter((p) => p !== null)

    return res.json(validPayments)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
}

// Get single payment request
async function getPaymentRequest(req, res) {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid payment request ID' })
    }

    const request = await PaymentRequest.findById(id).lean()
    if (!request) {
      return res.status(404).json({ error: 'Payment request not found' })
    }

    return res.json(request)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
}

// Confirm a payment request: mark all unpaid orders as paid and delete the request
async function confirmPaymentRequest(req, res) {
  try {
    const { id } = req.params

    // Validate payment request ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Payment request ID is required and must be valid' })
    }

    // Find the payment request
    const paymentRequest = await PaymentRequest.findById(id)
    if (!paymentRequest) {
      return res.status(404).json({ error: 'Payment request not found' })
    }

    const tableNumber = paymentRequest.tableNumber

    // Find all unpaid orders for this table
    const unpaidOrders = await Order.find({
      tableNumber: tableNumber,
      paymentStatus: 'unpaid',
    })

    // Mark all unpaid orders as paid and served
    if (unpaidOrders.length > 0) {
      await Order.updateMany(
        { tableNumber: tableNumber, paymentStatus: 'unpaid' },
        {
          $set: {
            paymentStatus: 'paid',
            paymentMethod: 'cash',
            status: 'served',
          },
        }
      )
    }

    // Calculate total amount from all updated orders
    const totalAmount = unpaidOrders.reduce((sum, order) => sum + (order.total || 0), 0)

    // Create a Payment record for this confirmation
    const payment = new Payment({
      amount: totalAmount,
      type: 'cash',
      paymentOf: 'session',
      sessionId: paymentRequest.sessionId,
    })

    await payment.save()

    // Delete the payment request
    await PaymentRequest.findByIdAndDelete(id)

    return res.json({
      ok: true,
      message: 'Payment confirmed',
      payment: payment,
      updatedOrders: unpaidOrders.length,
      totalAmount: Math.round(totalAmount * 100) / 100,
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
}
// Delete a payment request (manual cleanup)
async function deletePaymentRequest(req, res) {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid payment request ID' })
    }

    const deleted = await PaymentRequest.findByIdAndDelete(id)
    if (!deleted) {
      return res.status(404).json({ error: 'Payment request not found' })
    }

    return res.json({ message: 'Payment request deleted', deleted })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
}

module.exports = {
  createPaymentRequest,
  getPaymentRequests,
  getPaymentRequest,
  confirmPaymentRequest,
  deletePaymentRequest,
}
