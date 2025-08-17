const express = require('express');
const jwt = require('jsonwebtoken');
const Waste = require('../models/Waste');
const User = require('../models/User');
const router = express.Router();

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Post new waste listing
router.post('/', auth, async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      quantity,
      unit,
      price,
      images,
      location,
      condition,
      pickupRequired,
      expiryDate,
      tags
    } = req.body;

    const waste = new Waste({
      title,
      description,
      category,
      quantity,
      unit,
      price,
      images: images || [],
      location,
      seller: req.user._id,
      condition,
      pickupRequired,
      expiryDate,
      tags: tags || []
    });

    await waste.save();
    res.status(201).json({ message: 'Waste listing created successfully', waste });
  } catch (error) {
    console.error('Waste creation error:', error);
    res.status(500).json({ message: 'Server error while creating waste listing' });
  }
});

// Get all waste listings with filters
router.get('/', async (req, res) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      location,
      status = 'available',
      page = 1,
      limit = 10,
      search
    } = req.query;

    const filter = { status };
    
    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (location) {
      filter.$or = [
        { 'location.city': { $regex: location, $options: 'i' } },
        { 'location.state': { $regex: location, $options: 'i' } }
      ];
    }
    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (page - 1) * limit;
    
    const waste = await Waste.find(filter)
      .populate('seller', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Waste.countDocuments(filter);

    res.json({
      waste,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: Number(limit)
      }
    });
  } catch (error) {
    console.error('Waste fetch error:', error);
    res.status(500).json({ message: 'Server error while fetching waste listings' });
  }
});

// Get single waste listing
router.get('/:id', async (req, res) => {
  try {
    const waste = await Waste.findById(req.params.id)
      .populate('seller', 'name email phone address');

    if (!waste) {
      return res.status(404).json({ message: 'Waste listing not found' });
    }

    res.json({ waste });
  } catch (error) {
    console.error('Waste fetch error:', error);
    res.status(500).json({ message: 'Server error while fetching waste listing' });
  }
});

// Update waste listing (only by seller)
router.put('/:id', auth, async (req, res) => {
  try {
    const waste = await Waste.findById(req.params.id);
    
    if (!waste) {
      return res.status(404).json({ message: 'Waste listing not found' });
    }

    // Allow users with 'both' type or the original seller to update
    if (waste.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this listing' });
    }

    const updates = req.body;
    const allowedUpdates = [
      'title', 'description', 'category', 'quantity', 'unit', 
      'price', 'images', 'location', 'condition', 'pickupRequired', 
      'expiryDate', 'tags', 'status'
    ];

    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});

    const updatedWaste = await Waste.findByIdAndUpdate(
      req.params.id,
      filteredUpdates,
      { new: true, runValidators: true }
    ).populate('seller', 'name email phone');

    res.json({ message: 'Waste listing updated successfully', waste: updatedWaste });
  } catch (error) {
    console.error('Waste update error:', error);
    res.status(500).json({ message: 'Server error while updating waste listing' });
  }
});

// Delete waste listing (only by seller)
router.delete('/:id', auth, async (req, res) => {
  try {
    const waste = await Waste.findById(req.params.id);
    
    if (!waste) {
      return res.status(404).json({ message: 'Waste listing not found' });
    }

    if (waste.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this listing' });
    }

    await Waste.findByIdAndDelete(req.params.id);
    res.json({ message: 'Waste listing deleted successfully' });
  } catch (error) {
    console.error('Waste deletion error:', error);
    res.status(500).json({ message: 'Server error while deleting waste listing' });
  }
});

// Get user's waste listings
router.get('/user/listings', auth, async (req, res) => {
  try {
    const waste = await Waste.find({ seller: req.user._id })
      .sort({ createdAt: -1 });

    res.json({ waste });
  } catch (error) {
    console.error('User listings fetch error:', error);
    res.status(500).json({ message: 'Server error while fetching user listings' });
  }
});

// Get user's purchase history (for dual role users)
router.get('/user/purchases', auth, async (req, res) => {
  try {
    // This would typically connect to a transactions/purchases collection
    // For now, we'll return an empty array as placeholder
    res.json({ purchases: [] });
  } catch (error) {
    console.error('User purchases fetch error:', error);
    res.status(500).json({ message: 'Server error while fetching user purchases' });
  }
});

module.exports = router;
