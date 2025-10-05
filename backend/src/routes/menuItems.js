const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { listItems, addItem, deleteItem, updateItem } = require('../controllers/menuItems');

// GET /api/menu/items - list all menu items
router.get('/', listItems);

// PUT /api/menu/items - add new item (protected)
router.put('/', auth, addItem);

// DELETE /api/menu/items/:id - delete item by id (protected)
router.delete('/:id', auth, deleteItem);

// PATCH /api/menu/items/:id - update item (protected)
router.patch('/:id', auth, updateItem);

module.exports = router;
