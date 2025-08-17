const mongoose = require('mongoose');

const wasteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['plastic', 'paper', 'metal', 'glass', 'organic', 'electronics', 'textiles', 'other']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: ['kg', 'pieces', 'bags', 'boxes', 'tons']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  images: [{
    type: String
  }],
  location: {
    city: String,
    state: String,
    pincode: String
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'sold', 'reserved', 'expired'],
    default: 'available'
  },
  condition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'good'
  },
  pickupRequired: {
    type: Boolean,
    default: true
  },
  expiryDate: {
    type: Date
  },
  tags: [String]
}, {
  timestamps: true
});

// Index for search functionality
wasteSchema.index({ title: 'text', description: 'text', category: 1, location: 1 });

module.exports = mongoose.model('Waste', wasteSchema);
