const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
    },
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
    quantity: {
      type: Number,
      required: [true, 'Please provide quantity'],
      min: [0.01, 'Quantity must be greater than 0'],
    },
    totalPrice: {
      type: Number,
      required: [true, 'Please provide total price'],
      min: [0, 'Total price must be greater than or equal to 0'],
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    shippingAddress: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zipCode: { type: String, trim: true },
      country: { type: String, trim: true, default: 'India' },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
orderSchema.index({ buyer: 1, status: 1 });
orderSchema.index({ seller: 1, status: 1 });
orderSchema.index({ listing: 1 });

module.exports = mongoose.model('Order', orderSchema);

