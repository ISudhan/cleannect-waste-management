const express = require('express');
const router = express.Router();
const {
  createPayment,
  getPaymentStatus,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validator');

// @route   POST /api/payments/create
// @desc    Create payment intent
// @access  Private
router.post(
  '/create',
  protect,
  [
    body('orderId').notEmpty().withMessage('Order ID is required').isMongoId().withMessage('Invalid order ID'),
  ],
  validate,
  createPayment
);

// Note: /verify route is handled directly in server.js to support raw body for Stripe webhook

// @route   GET /api/payments/:orderId
// @desc    Get payment status
// @access  Private
router.get('/:orderId', protect, getPaymentStatus);

module.exports = router;

