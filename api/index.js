// Vercel serverless entry point for the Express backend
// This wraps the Express app for Vercel's serverless function runtime.
// NOTE: Socket.io real-time features will NOT work on Vercel (stateless).
// For full Socket.io support, deploy the backend to Railway/Render/Fly.io.

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const passport = require('passport');
require('dotenv').config();
const connectDB = require('../backend/config/database');
const jwt = require('jsonwebtoken');
const User = require('../backend/models/User');

// Import routes
const authRoutes = require('../backend/routes/auth');
const userRoutes = require('../backend/routes/users');
const listingRoutes = require('../backend/routes/listings');
const orderRoutes = require('../backend/routes/orders');
const paymentRoutes = require('../backend/routes/payments');
const messageRoutes = require('../backend/routes/messages');
const cartRoutes = require('../backend/routes/carts');
const reviewRoutes = require('../backend/routes/reviews');
const offerRoutes = require('../backend/routes/offers');
const notificationRoutes = require('../backend/routes/notifications');
const analyticsRoutes = require('../backend/routes/analytics');
const wishlistRoutes = require('../backend/routes/wishlist');

// Import error handler
const errorHandler = require('../backend/middleware/errorHandler');

const app = express();

// Connect to MongoDB (connection is cached between serverless invocations)
connectDB();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Payment webhook route (needs raw body, must be before json parser)
const { verifyPayment } = require('../backend/controllers/paymentController');
app.post('/api/payments/verify', express.raw({ type: 'application/json' }), verifyPayment);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Passport (Google OAuth — stateless, no sessions needed)
require('../backend/config/passport');
app.use(passport.initialize());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'API is running', status: 'OK' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/carts', cartRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/wishlist', wishlistRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;
