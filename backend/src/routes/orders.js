const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { listOrders, getOrder, listLiveOrders, createOrder, updateOrder } = require('../controllers/orders');

// Public reads
router.get('/', listOrders);
router.get('/live', listLiveOrders);
router.get('/:id', getOrder);

// Protected writes
router.post('/', createOrder);
router.patch('/:id', updateOrder);

module.exports = router;
