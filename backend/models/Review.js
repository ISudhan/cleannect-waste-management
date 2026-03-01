const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      default: null,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a rating'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot be more than 5'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, 'Comment cannot be more than 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// One review per reviewer-seller pair
reviewSchema.index({ reviewer: 1, seller: 1 }, { unique: true });
reviewSchema.index({ seller: 1 });
reviewSchema.index({ listing: 1 });

module.exports = mongoose.model('Review', reviewSchema);
