const express = require('express');
const router = express.Router();
const { listReviews, addReview } = require('../controllers/reviews');

// GET /reviews - list formatted reviews
router.get('/', listReviews);

// POST /reviews - add a review (public)
router.post('/', addReview);

module.exports = router;
