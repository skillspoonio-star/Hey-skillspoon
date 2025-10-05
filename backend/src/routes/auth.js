const express = require('express');
const router = express.Router();

const { login, verifyOtp } = require('../controllers/login');

// POST /api/admin/login
router.post('/login', login);

// POST /api/admin/verify-otp
router.post('/verify-otp', verifyOtp);

module.exports = router;
