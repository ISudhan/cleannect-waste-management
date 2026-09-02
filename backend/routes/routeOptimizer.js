const express = require('express');
const router = express.Router();
const routeOptimizerController = require('../controllers/routeOptimizerController');
const { protect, optionalAuth } = require('../middleware/auth');

// Route optimization endpoint
router.post('/optimize', optionalAuth, routeOptimizerController.optimizeRoute);

// Real live marketplace stops directly from MongoDB
router.get('/marketplace-stops', routeOptimizerController.getMarketplaceStops);

// User's active orders stops
router.get('/my-orders-stops', protect, routeOptimizerController.getMyOrdersStops);

module.exports = router;
