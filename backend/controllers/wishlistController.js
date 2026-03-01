const Wishlist = require('../models/Wishlist');
const Listing = require('../models/Listing');

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
exports.getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id }).populate({
      path: 'listings.listing',
      select: 'title images category quantity unit price status location seller',
      populate: { path: 'seller', select: 'name profilePicture rating' },
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user.id, listings: [] });
    }

    res.status(200).json({ success: true, data: { wishlist } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add listing to wishlist
// @route   POST /api/wishlist
// @access  Private
exports.addToWishlist = async (req, res) => {
  try {
    const { listingId } = req.body;

    if (!listingId) {
      return res.status(400).json({ success: false, message: 'Listing ID is required' });
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    let wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user.id, listings: [] });
    }

    const alreadyIn = wishlist.listings.some(
      (item) => item.listing.toString() === listingId
    );

    if (alreadyIn) {
      return res.status(400).json({ success: false, message: 'Listing already in wishlist' });
    }

    wishlist.listings.push({ listing: listingId });
    await wishlist.save();

    await wishlist.populate({
      path: 'listings.listing',
      select: 'title images category quantity unit price status location seller',
      populate: { path: 'seller', select: 'name profilePicture rating' },
    });

    res.status(200).json({ success: true, data: { wishlist } });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Invalid listing ID' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove listing from wishlist
// @route   DELETE /api/wishlist/:listingId
// @access  Private
exports.removeFromWishlist = async (req, res) => {
  try {
    const { listingId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      return res.status(404).json({ success: false, message: 'Wishlist not found' });
    }

    const idx = wishlist.listings.findIndex(
      (item) => item.listing.toString() === listingId
    );

    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Listing not in wishlist' });
    }

    wishlist.listings.splice(idx, 1);
    await wishlist.save();

    await wishlist.populate({
      path: 'listings.listing',
      select: 'title images category quantity unit price status location seller',
      populate: { path: 'seller', select: 'name profilePicture rating' },
    });

    res.status(200).json({ success: true, data: { wishlist } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
