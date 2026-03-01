const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      trim: true,
      maxlength: [1000, 'Description cannot be more than 1000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Please provide a category'],
      enum: [
        'plastic',
        'paper',
        'metal',
        'glass',
        'organic',
        'electronic',
        'textile',
        'other',
      ],
    },
    quantity: {
      type: Number,
      required: [true, 'Please provide quantity'],
      min: [0, 'Quantity must be greater than or equal to 0'],
      validate: {
        validator: function(value) {
          // Allow 0 quantity only when status is 'sold' or 'archived'
          if (value === 0) {
            return this.status === 'sold' || this.status === 'archived';
          }
          // Otherwise, quantity must be > 0
          return value > 0;
        },
        message: 'Quantity must be greater than 0 for available listings'
      }
    },
    // Tracks the original quantity when the listing was created.
    // Used for derived UI statuses like "selling fast".
    initialQuantity: {
      type: Number,
      min: [0.01, 'Initial quantity must be greater than 0'],
    },
    unit: {
      type: String,
      required: [true, 'Please provide a unit'],
      enum: ['kg', 'tons', 'pieces', 'liters', 'units'],
      default: 'kg',
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
      min: [0, 'Price must be greater than or equal to 0'],
    },
    images: [
      {
        type: String,
      },
    ],
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['available', 'sold', 'archived'],
      default: 'available',
    },
    location: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zipCode: { type: String, trim: true },
      country: { type: String, trim: true, default: 'India' },
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
listingSchema.index({ seller: 1, status: 1 });
listingSchema.index({ category: 1, status: 1 });
listingSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Listing', listingSchema);

