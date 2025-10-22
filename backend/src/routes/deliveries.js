const express = require('express');
const router = express.Router();
const { createDelivery, listDeliveries, updateDelivery } = require('../controllers/deliveries');

router.post('/', createDelivery);
router.get('/', listDeliveries);
router.patch('/:id', updateDelivery);

module.exports = router;
