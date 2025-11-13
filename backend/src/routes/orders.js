const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { listOrders, getOrder, listLiveOrders, createOrder, updateOrder, getLiveCounterOrders, getTakeAwayOrders, getDineInOrders, getRevenueHistory, getTodaysPaymentSummary, confirmSessionPayment } = require('../controllers/orders');

// Public reads
router.get('/', listOrders);
router.get('/live', listLiveOrders);
router.get('/counter', getLiveCounterOrders);
router.get('/takeaway', getTakeAwayOrders);
router.get('/dine-in/list', getDineInOrders);
router.get('/payment/today', getTodaysPaymentSummary);
router.get('/payment/history', getRevenueHistory);
router.get('/:id', getOrder);

// Confirm payment for a table/session (legacy endpoint)
router.post('/confirm-payment', /*auth,*/ (req, res, next) => require('../controllers/orders').confirmSessionPayment(req, res, next));

// Protected writes
router.post('/', createOrder);
router.patch('/:id', updateOrder);

module.exports = router;
