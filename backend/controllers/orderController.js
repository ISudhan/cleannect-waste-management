const Order = require('../models/Order');
const Listing = require('../models/Listing');
const { validationResult } = require('express-validator');

// @desc    Create order
// @route   POST /api/orders
// @access  Private (Any authenticated user can create orders)
exports.createOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { listingId, quantity, shippingAddress } = req.body;

    // Normalize and validate requested quantity
    const requestedQuantity = parseFloat(quantity);
    if (isNaN(requestedQuantity) || requestedQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid quantity greater than 0',
      });
    }

    // Get listing
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found',
      });
    }

    // Check if listing is available
    if (listing.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Listing is not available',
      });
    }

    // Check if buyer is not the seller
    if (listing.seller.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot order your own listing',
      });
    }

    // Atomically decrement available quantity to avoid race conditions.
    const updatedListing = await Listing.findOneAndUpdate(
      { _id: listingId, status: 'available', quantity: { $gte: requestedQuantity } },
      { $inc: { quantity: -requestedQuantity } },
      { new: true }
    );

    if (!updatedListing) {
      return res.status(400).json({
        success: false,
        message: 'Requested quantity exceeds available stock',
      });
    }

    // Mark as sold if stock reaches zero.
    if (updatedListing.quantity <= 0 && updatedListing.status !== 'sold') {
      updatedListing.status = 'sold';
      updatedListing.quantity = 0; // Ensure quantity is exactly 0
      await updatedListing.save();
    }

    // Calculate total price using the up-to-date listing
    const totalPrice = updatedListing.price * requestedQuantity;

    // Create order
    const order = await Order.create({
      listing: listingId,
      buyer: req.user.id,
      seller: updatedListing.seller,
      quantity: requestedQuantity,
      totalPrice,
      shippingAddress: shippingAddress || req.user.address,
    });

    await order.populate([
      { path: 'listing', select: 'title description category images' },
      { path: 'buyer', select: 'name email phone' },
      { path: 'seller', select: 'name email phone' },
    ]);

    res.status(201).json({
      success: true,
      data: { order },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Invalid listing ID',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get user's orders
// @route   GET /api/orders
// @access  Private
exports.getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query - user can see orders as buyer or seller
    const query = {
      $or: [{ buyer: req.user.id }, { seller: req.user.id }],
    };

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by role removed - users can filter by buyer/seller relationship via query params
    // Keeping query params for backward compatibility but not enforcing role-based restrictions
    if (req.query.role === 'buyer') {
      query.buyer = req.user.id;
      delete query.$or;
    } else if (req.query.role === 'seller') {
      query.seller = req.user.id;
      delete query.$or;
    }

    const orders = await Order.find(query)
      .populate('listing', 'title description category images')
      .populate('buyer', 'name email phone profilePicture')
      .populate('seller', 'name email phone profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('listing', 'title description category images quantity unit price')
      .populate('buyer', 'name email phone profilePicture address')
      .populate('seller', 'name email phone profilePicture address');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if user is buyer or seller
    if (
      order.buyer._id.toString() !== req.user.id &&
      order.seller._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order',
      });
    }

    res.status(200).json({
      success: true,
      data: { order },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private
exports.updateOrderStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { status } = req.body;
    const order = await Order.findById(req.params.id).populate('listing');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Authorization checks based on status
    const isSeller = order.seller.toString() === req.user.id;
    const isBuyer = order.buyer.toString() === req.user.id;

    // Status transition rules - based on buyer/seller relationship, not user roles
    const allowedTransitions = {
      pending: {
        confirmed: ['seller'], // Seller can confirm
        cancelled: ['buyer', 'seller'], // Both can cancel
      },
      confirmed: {
        shipped: ['seller'], // Seller can ship
        cancelled: ['buyer', 'seller'], // Both can cancel
      },
      shipped: {
        delivered: ['buyer'], // Buyer can mark as delivered
      },
      delivered: {},
      cancelled: {},
    };

    const currentStatus = order.status;
    const allowedRoles = allowedTransitions[currentStatus]?.[status];

    if (!allowedRoles) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${currentStatus} to ${status}`,
      });
    }

    // Check based on buyer/seller relationship, not user role
    const canUpdate =
      (allowedRoles.includes('buyer') && isBuyer) ||
      (allowedRoles.includes('seller') && isSeller);

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update order status',
      });
    }

    // Update order status
    order.status = status;
    await order.save();

    await order.populate([
      { path: 'listing', select: 'title description category images' },
      { path: 'buyer', select: 'name email phone profilePicture' },
      { path: 'seller', select: 'name email phone profilePicture' },
    ]);

    res.status(200).json({
      success: true,
      data: { order },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

