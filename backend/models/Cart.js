const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One cart per user
    },
    items: [
      {
        listing: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Listing',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: [0.01, 'Quantity must be greater than 0'],
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index on user for fast lookups
cartSchema.index({ user: 1 });

module.exports = mongoose.model('Cart', cartSchema);

