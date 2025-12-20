const Cart = require('../models/Cart');
const Listing = require('../models/Listing');
const { validationResult } = require('express-validator');

// @desc    Get user's cart
// @route   GET /api/carts
// @access  Private
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate({
      path: 'items.listing',
      select: 'title description category images quantity unit price status seller location',
      populate: {
        path: 'seller',
        select: 'name email phone profilePicture',
      },
    });

    // If cart doesn't exist, create an empty one
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    res.status(200).json({
      success: true,
      data: { cart },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Add item to cart
// @route   POST /api/carts/items
// @access  Private
exports.addToCart = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { listingId, quantity } = req.body;

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
        message: 'You cannot add your own listing to cart',
      });
    }

    // Check if quantity is available
    if (quantity > listing.quantity) {
      return res.status(400).json({
        success: false,
        message: 'Requested quantity exceeds available quantity',
      });
    }

    // Find or create cart
    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.listing.toString() === listingId
    );

    if (existingItemIndex !== -1) {
      // Update quantity if item exists
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      if (newQuantity > listing.quantity) {
        return res.status(400).json({
          success: false,
          message: 'Total quantity exceeds available quantity',
        });
      }
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      // Add new item
      cart.items.push({ listing: listingId, quantity });
    }

    await cart.save();

    await cart.populate({
      path: 'items.listing',
      select: 'title description category images quantity unit price status seller location',
      populate: {
        path: 'seller',
        select: 'name email phone profilePicture',
      },
    });

    res.status(200).json({
      success: true,
      data: { cart },
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

// @desc    Update cart item quantity
// @route   PUT /api/carts/items/:itemId
// @access  Private
exports.updateCartItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { quantity } = req.body;
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found',
      });
    }

    // Get listing to validate quantity
    const listing = await Listing.findById(cart.items[itemIndex].listing);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found',
      });
    }

    if (quantity > listing.quantity) {
      return res.status(400).json({
        success: false,
        message: 'Requested quantity exceeds available quantity',
      });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    await cart.populate({
      path: 'items.listing',
      select: 'title description category images quantity unit price status seller location',
      populate: {
        path: 'seller',
        select: 'name email phone profilePicture',
      },
    });

    res.status(200).json({
      success: true,
      data: { cart },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Invalid item ID',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/carts/items/:itemId
// @access  Private
exports.removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found',
      });
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    await cart.populate({
      path: 'items.listing',
      select: 'title description category images quantity unit price status seller location',
      populate: {
        path: 'seller',
        select: 'name email phone profilePicture',
      },
    });

    res.status(200).json({
      success: true,
      data: { cart },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Invalid item ID',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Clear cart
// @route   DELETE /api/carts
// @access  Private
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({
      success: true,
      data: { cart },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

