const express = require('express');
const router = express.Router();
const {
  createReview,
  getSellerReviews,
  getListingReviews,
  deleteReview,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validator');

// @route   POST /api/reviews
router.post(
  '/',
  protect,
  [
    body('sellerId').notEmpty().isMongoId().withMessage('Invalid seller ID'),
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('comment')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Comment cannot exceed 500 characters'),
    body('listingId').optional().isMongoId().withMessage('Invalid listing ID'),
    body('orderId').optional().isMongoId().withMessage('Invalid order ID'),
  ],
  validate,
  createReview
);

// @route   GET /api/reviews/seller/:id
router.get('/seller/:id', getSellerReviews);

// @route   GET /api/reviews/listing/:id
router.get('/listing/:id', getListingReviews);

// @route   DELETE /api/reviews/:id
router.delete('/:id', protect, deleteReview);

module.exports = router;
