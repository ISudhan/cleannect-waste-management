const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: [true, 'Please provide payment amount'],
      min: [0, 'Amount must be greater than or equal to 0'],
    },
    paymentMethod: {
      type: String,
      enum: ['stripe', 'card', 'upi', 'netbanking'],
      default: 'stripe',
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentGatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);

