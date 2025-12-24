const express = require('express');
const router = express.Router();
const razorpayController = require('../controllers/razorpay');

// Create a new order
router.post('/create-order', razorpayController.createOrder);

// Create a new reservation order
router.post('/create-reservation-order', razorpayController.createReservationOrder);

// Verify payment
router.post('/verify-payment', razorpayController.verifyPayment);

module.exports = router;