const express = require('express');
const router = express.Router();
const { getTotalCount, getTakeawayCount, getDeliveryCount } = require('../controllers/orderCount');

router.get('/', getTotalCount);
router.get('/take-away', getTakeawayCount);
router.get('/delivery', getDeliveryCount);

module.exports = router;
