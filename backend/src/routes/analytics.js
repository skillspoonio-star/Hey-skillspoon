const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/analytics');

// GET /api/analytics/overview?range=24h|today|week|month
router.get('/overview', ctrl.overview);

module.exports = router;
