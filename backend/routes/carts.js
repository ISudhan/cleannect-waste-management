const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validator');

// @route   GET /api/carts
// @desc    Get user's cart
// @access  Private
router.get('/', protect, getCart);

// @route   POST /api/carts/items
// @desc    Add item to cart
// @access  Private
router.post(
  '/items',
  protect,
  [
    body('listingId').notEmpty().withMessage('Listing ID is required').isMongoId().withMessage('Invalid listing ID'),
    body('quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0'),
  ],
  validate,
  addToCart
);

// @route   PUT /api/carts/items/:itemId
// @desc    Update cart item quantity
// @access  Private
router.put(
  '/items/:itemId',
  protect,
  [
    body('quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0'),
  ],
  validate,
  updateCartItem
);

// @route   DELETE /api/carts/items/:itemId
// @desc    Remove item from cart
// @access  Private
router.delete('/items/:itemId', protect, removeFromCart);

// @route   DELETE /api/carts
// @desc    Clear entire cart
// @access  Private
router.delete('/', protect, clearCart);

module.exports = router;

