const express = require('express');
const router = express.Router();
const {
  getListings,
  getListing,
  createListing,
  updateListing,
  deleteListing,
  getMyListings,
} = require('../controllers/listingController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { body } = require('express-validator');
const { validate } = require('../middleware/validator');

// @route   GET /api/listings
// @desc    Get all listings with search, filter, pagination
// @access  Public
router.get('/', getListings);

// @route   GET /api/listings/seller/my-listings
// @desc    Get seller's listings
// @access  Private
router.get('/seller/my-listings', protect, getMyListings);

// @route   GET /api/listings/:id
// @desc    Get single listing
// @access  Public
router.get('/:id', getListing);

// @route   POST /api/listings
// @desc    Create listing
// @access  Private
router.post(
  '/',
  protect,
  upload.array('images', 5), // Max 5 images
  [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
    body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
    body('category').isIn(['plastic', 'paper', 'metal', 'glass', 'organic', 'electronic', 'textile', 'other']).withMessage('Invalid category'),
    body('quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0'),
    body('unit').isIn(['kg', 'tons', 'pieces', 'liters', 'units']).withMessage('Invalid unit'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be greater than or equal to 0'),
  ],
  validate,
  createListing
);

// @route   PUT /api/listings/:id
// @desc    Update listing
// @access  Private
router.put(
  '/:id',
  protect,
  upload.array('images', 5),
  [
    body('title').optional().trim().isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
    body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
    body('category').optional().isIn(['plastic', 'paper', 'metal', 'glass', 'organic', 'electronic', 'textile', 'other']).withMessage('Invalid category'),
    body('quantity').optional().isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0'),
    body('unit').optional().isIn(['kg', 'tons', 'pieces', 'liters', 'units']).withMessage('Invalid unit'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be greater than or equal to 0'),
    body('status').optional().isIn(['available', 'sold', 'archived']).withMessage('Invalid status'),
  ],
  validate,
  updateListing
);

// @route   DELETE /api/listings/:id
// @desc    Delete listing
// @access  Private
router.delete('/:id', protect, deleteListing);

module.exports = router;

