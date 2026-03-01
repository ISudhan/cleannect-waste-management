const express = require('express');
const router = express.Router();
const { getMyAnalytics } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.get('/me', protect, getMyAnalytics);

module.exports = router;
