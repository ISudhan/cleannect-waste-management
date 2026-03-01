const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema(
  {
    buyer: {
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
      required: true,
    },
    offerPrice: {
      type: Number,
      required: [true, 'Please provide an offer price'],
      min: [0, 'Offer price must be greater than or equal to 0'],
    },
    quantity: {
      type: Number,
      required: [true, 'Please provide quantity'],
      min: [0.01, 'Quantity must be greater than 0'],
    },
    message: {
      type: String,
      trim: true,
      maxlength: [500, 'Message cannot be more than 500 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled', 'expired'],
      default: 'pending',
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
    },
  },
  {
    timestamps: true,
  }
);

offerSchema.index({ buyer: 1, status: 1 });
offerSchema.index({ seller: 1, status: 1 });
offerSchema.index({ listing: 1 });

module.exports = mongoose.model('Offer', offerSchema);
