const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurant');

// Get restaurant information
router.get('/info', restaurantController.getRestaurantInfo);

// Update restaurant information
router.put('/info', restaurantController.updateRestaurantInfo);

// Upload restaurant images
router.post('/upload-image', restaurantController.uploadImage);

module.exports = router;