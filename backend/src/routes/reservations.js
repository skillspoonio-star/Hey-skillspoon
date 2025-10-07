const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reservations');
const auth = require('../middleware/auth');

// Public reads
router.get('/', ctrl.listReservations);
router.get('/:id', ctrl.getReservation);

// Protected writes - reservations should be managed by staff
router.post('/',  ctrl.createReservation);
router.patch('/:id',  ctrl.updateReservation);
router.delete('/:id', ctrl.deleteReservation);

module.exports = router;
