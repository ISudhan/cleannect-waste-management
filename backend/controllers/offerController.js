const Offer = require('../models/Offer');
const Listing = require('../models/Listing');
const Order = require('../models/Order');
const createNotification = require('../lib/createNotification');
const { validationResult } = require('express-validator');

// @desc    Make an offer on a listing
// @route   POST /api/offers
// @access  Private
exports.makeOffer = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { listingId, offerPrice, quantity, message } = req.body;

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    if (listing.status !== 'available') {
      return res.status(400).json({ success: false, message: 'Listing is not available' });
    }

    if (listing.seller.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot make an offer on your own listing' });
    }

    if (quantity > listing.quantity) {
      return res.status(400).json({ success: false, message: 'Requested quantity exceeds available stock' });
    }

    const offer = await Offer.create({
      buyer: req.user.id,
      seller: listing.seller,
      listing: listingId,
      offerPrice,
      quantity,
      message,
    });

    await offer.populate([
      { path: 'buyer', select: 'name email profilePicture' },
      { path: 'listing', select: 'title images category unit' },
    ]);

    // Notify seller
    await createNotification(req.io, listing.seller, {
      type: 'offer',
      title: 'New Offer Received',
      message: `${req.user.name} made an offer of ₹${offerPrice} on "${listing.title}"`,
      link: '/dashboard/offers',
    });

    res.status(201).json({ success: true, data: { offer } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get offers (incoming as seller, outgoing as buyer, or both)
// @route   GET /api/offers
// @access  Private
exports.getOffers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let query;
    if (req.query.role === 'buyer') {
      query = { buyer: req.user.id };
    } else if (req.query.role === 'seller') {
      query = { seller: req.user.id };
    } else {
      query = { $or: [{ buyer: req.user.id }, { seller: req.user.id }] };
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    const offers = await Offer.find(query)
      .populate('buyer', 'name email profilePicture')
      .populate('seller', 'name email profilePicture')
      .populate('listing', 'title images category unit price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Offer.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        offers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Respond to offer (seller: accept or reject)
// @route   PUT /api/offers/:id/respond
// @access  Private (seller)
exports.respondToOffer = async (req, res) => {
  try {
    const { status } = req.body; // 'accepted' or 'rejected'

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be accepted or rejected' });
    }

    const offer = await Offer.findById(req.params.id).populate('listing');
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }

    if (offer.seller.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (offer.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Offer is already ${offer.status}` });
    }

    if (offer.expiresAt < new Date()) {
      offer.status = 'expired';
      await offer.save();
      return res.status(400).json({ success: false, message: 'Offer has expired' });
    }

    offer.status = status;
    await offer.save();

    // If accepted → create an order automatically
    let order = null;
    if (status === 'accepted') {
      const listing = offer.listing;

      // Check and decrement stock atomically
      const updatedListing = await Listing.findOneAndUpdate(
        { _id: listing._id, status: 'available', quantity: { $gte: offer.quantity } },
        { $inc: { quantity: -offer.quantity } },
        { new: true }
      );

      if (!updatedListing) {
        offer.status = 'rejected';
        await offer.save();
        return res.status(400).json({ success: false, message: 'Insufficient stock to fulfil this offer' });
      }

      if (updatedListing.quantity <= 0) {
        updatedListing.status = 'sold';
        updatedListing.quantity = 0;
        await updatedListing.save();
      }

      order = await Order.create({
        listing: offer.listing._id,
        buyer: offer.buyer,
        seller: offer.seller,
        quantity: offer.quantity,
        totalPrice: offer.offerPrice * offer.quantity,
        shippingAddress: {},
      });
    }

    // Notify buyer
    await createNotification(req.io, offer.buyer, {
      type: 'offer',
      title: status === 'accepted' ? 'Offer Accepted!' : 'Offer Rejected',
      message:
        status === 'accepted'
          ? `Your offer on "${offer.listing.title}" was accepted. An order has been created.`
          : `Your offer on "${offer.listing.title}" was rejected.`,
      link: status === 'accepted' ? '/dashboard/orders' : '/dashboard/offers',
    });

    await offer.populate([
      { path: 'buyer', select: 'name email profilePicture' },
      { path: 'seller', select: 'name email profilePicture' },
    ]);

    res.status(200).json({ success: true, data: { offer, order } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel offer (buyer only, while pending)
// @route   PUT /api/offers/:id/cancel
// @access  Private (buyer)
exports.cancelOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate('listing', 'title');

    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }

    if (offer.buyer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (offer.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Cannot cancel a ${offer.status} offer` });
    }

    offer.status = 'cancelled';
    await offer.save();

    res.status(200).json({ success: true, data: { offer } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
