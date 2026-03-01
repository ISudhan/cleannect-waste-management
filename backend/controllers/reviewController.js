const Review = require('../models/Review');
const User = require('../models/User');
const Order = require('../models/Order');
const { validationResult } = require('express-validator');

// Helper — recalculate and persist a seller's aggregate rating
async function recalcSellerRating(sellerId) {
  const stats = await Review.aggregate([
    { $match: { seller: sellerId } },
    {
      $group: {
        _id: '$seller',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  const avg = stats[0] ? Math.round(stats[0].avgRating * 10) / 10 : 0;
  const count = stats[0] ? stats[0].count : 0;

  await User.findByIdAndUpdate(sellerId, {
    rating: avg,
    totalRatings: count,
  });
}

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { sellerId, listingId, orderId, rating, comment } = req.body;

    // Cannot review yourself
    if (sellerId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot review yourself',
      });
    }

    // If orderId provided, verify the reviewer was the buyer
    if (orderId) {
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      if (order.buyer.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Only the buyer can review an order',
        });
      }
      if (order.status !== 'delivered') {
        return res.status(400).json({
          success: false,
          message: 'You can only review delivered orders',
        });
      }
    }

    // Check for duplicate
    const existing = await Review.findOne({
      reviewer: req.user.id,
      seller: sellerId,
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this seller',
      });
    }

    const review = await Review.create({
      reviewer: req.user.id,
      seller: sellerId,
      listing: listingId || null,
      order: orderId || null,
      rating,
      comment,
    });

    await review.populate('reviewer', 'name profilePicture');

    // Recalculate seller rating
    await recalcSellerRating(review.seller);

    res.status(201).json({ success: true, data: { review } });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this seller',
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get reviews for a seller
// @route   GET /api/reviews/seller/:id
// @access  Public
exports.getSellerReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ seller: req.params.id })
      .populate('reviewer', 'name profilePicture')
      .populate('listing', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ seller: req.params.id });

    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get reviews for a listing
// @route   GET /api/reviews/listing/:id
// @access  Public
exports.getListingReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ listing: req.params.id })
      .populate('reviewer', 'name profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ listing: req.params.id });

    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private (reviewer only)
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (review.reviewer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review',
      });
    }

    const sellerId = review.seller;
    await review.deleteOne();
    await recalcSellerRating(sellerId);

    res.status(200).json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
