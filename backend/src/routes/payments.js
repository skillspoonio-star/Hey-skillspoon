const express = require('express')
const router = express.Router()
const { getPayments, getPayment, createPayment, updatePayment, deletePayment, getTablePayments } = require('../controllers/payments')

// Get all payments (with optional filters by type, paymentOf, date range)
router.get('/', getPayments)

// Get payments for a specific table/session (cash requests)
router.get('/table_payments', getTablePayments)

// Get single payment
router.get('/:id', getPayment)

// Create a payment (automatic creation when order/reservation is marked paid)
router.post('/', createPayment)

// Update payment (e.g., change type)
router.patch('/:id', updatePayment)

// Delete payment
router.delete('/:id', deletePayment)

module.exports = router
