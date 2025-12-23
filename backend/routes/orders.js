const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validator');

// @route   POST /api/orders
// @desc    Create order
// @access  Private
router.post(
  '/',
  protect,
  [
    body('listingId').notEmpty().withMessage('Listing ID is required').isMongoId().withMessage('Invalid listing ID'),
    body('quantity')
      .toFloat()
      .isFloat({ min: 0.01 })
      .withMessage('Quantity must be greater than 0'),
    body('shippingAddress').optional().isObject().withMessage('Shipping address must be an object'),
  ],
  validate,
  createOrder
);

// @route   GET /api/orders
// @desc    Get user's orders
// @access  Private
router.get('/', protect, getOrders);

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', protect, getOrder);

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private
router.put(
  '/:id/status',
  protect,
  [
    body('status').isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status'),
  ],
  validate,
  updateOrderStatus
);

module.exports = router;

