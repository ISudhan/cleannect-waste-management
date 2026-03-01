const mongoose = require('mongoose');
const Order = require('../models/Order');
const Listing = require('../models/Listing');

// @desc    Get seller analytics for current user
// @route   GET /api/analytics/me
// @access  Private
exports.getMyAnalytics = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // Total listings by status
    const listingStats = await Listing.aggregate([
      { $match: { seller: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const listingsByStatus = { available: 0, sold: 0, archived: 0 };
    listingStats.forEach((s) => { listingsByStatus[s._id] = s.count; });

    // Total orders by status (as seller)
    const orderStats = await Order.aggregate([
      { $match: { seller: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const ordersByStatus = { pending: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0 };
    orderStats.forEach((s) => { ordersByStatus[s._id] = s.count; });

    // Total revenue (delivered + confirmed orders)
    const revenueResult = await Order.aggregate([
      { $match: { seller: userId, status: { $in: ['confirmed', 'shipped', 'delivered'] } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // Revenue by day — last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const revenueTrend = await Order.aggregate([
      {
        $match: {
          seller: userId,
          status: { $in: ['confirmed', 'shipped', 'delivered'] },
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalPrice' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top 5 listings by order count (as seller)
    const topListings = await Order.aggregate([
      { $match: { seller: userId } },
      { $group: { _id: '$listing', orderCount: { $sum: 1 }, revenue: { $sum: '$totalPrice' } } },
      { $sort: { orderCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'listings',
          localField: '_id',
          foreignField: '_id',
          as: 'listing',
        },
      },
      { $unwind: '$listing' },
      {
        $project: {
          orderCount: 1,
          revenue: 1,
          'listing._id': 1,
          'listing.title': 1,
          'listing.images': 1,
          'listing.category': 1,
          'listing.status': 1,
        },
      },
    ]);

    // Recent 10 orders as seller
    const recentOrders = await Order.find({ seller: userId })
      .populate('listing', 'title images category')
      .populate('buyer', 'name email profilePicture')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        listings: {
          total: Object.values(listingsByStatus).reduce((a, b) => a + b, 0),
          byStatus: listingsByStatus,
        },
        orders: {
          total: Object.values(ordersByStatus).reduce((a, b) => a + b, 0),
          byStatus: ordersByStatus,
        },
        revenue: {
          total: totalRevenue,
          trend: revenueTrend,
        },
        topListings,
        recentOrders,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
