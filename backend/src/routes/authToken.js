const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// GET /api/auth/verify - protected route to validate token
router.get('/verify', auth, (req, res) => {
  return res.json({ valid: true, payload: req.user });
});

module.exports = router;
