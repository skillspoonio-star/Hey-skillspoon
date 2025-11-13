const express = require('express')
const router = express.Router()
const {
  createPaymentRequest,
  getPaymentRequests,
  getPaymentRequest,
  confirmPaymentRequest,
  deletePaymentRequest,
} = require('../controllers/paymentRequests')

// Create a payment request
router.post('/', createPaymentRequest)

// Get all payment requests (with optional table filter)
router.get('/', getPaymentRequests)

// Get single payment request
router.get('/:id', getPaymentRequest)

// Confirm a payment request (mark orders paid and delete request)
router.post('/:id/confirm', confirmPaymentRequest)

// Delete a payment request
router.delete('/:id', deletePaymentRequest)

module.exports = router
