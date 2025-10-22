const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/tables');
const auth = require('../middleware/auth');

router.get('/', ctrl.listTables);
router.get('/stream', ctrl.streamTables);
router.get('/available', ctrl.listAvailableTables);
router.get('/:id', ctrl.getTable);
router.post('/', ctrl.createTable);
router.patch('/:id',ctrl.updateTable);
router.delete('/:id', ctrl.deleteTable);
router.post('/:id/activities', ctrl.addActivity);

module.exports = router;
