const express = require('express');
const router = express.Router();
const sessions = require('../controllers/sessions');

// Create a new session
router.post('/', sessions.createSession);

// Get session by sessionId or _id
router.get('/:id', sessions.getSessionById);

// Get active session by table number
router.get('/table/:number', sessions.getSessionByTable);

// Patch session (payment updates, customer info, active flag)
router.patch('/:id', sessions.patchSession);

// Add an order to session (creates order and attaches)
router.post('/:id/orders', sessions.addOrderToSession);

// End session (set inactive and mark table cleaning)
router.delete('/:id', sessions.endSession);

module.exports = router;
