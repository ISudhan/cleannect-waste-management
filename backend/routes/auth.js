const express = require('express');
const passport = require('passport');
const router = express.Router();
const {
  register,
  login,
  getMe,
  googleCallback,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const {
  validateRegister,
  validateLogin,
  validate,
} = require('../middleware/validator');

// @route   POST /api/auth/register
router.post('/register', validateRegister, validate, register);

// @route   POST /api/auth/login
router.post('/login', validateLogin, validate, login);

// @route   GET /api/auth/me
router.get('/me', protect, getMe);

// ── Google OAuth ──────────────────────────────────────────
// @route   GET /api/auth/google
// @desc    Initiate Google OAuth flow
router.get(
  '/google',
  (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/login?error=oauth_unconfigured`);
    }
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
  }
);

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback — redirects to frontend with JWT token
router.get(
  '/google/callback',
  (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/login?error=oauth_unconfigured`);
    }
    passport.authenticate('google', {
      failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/login?error=oauth_failed`,
      session: false,
    })(req, res, next);
  },
  googleCallback
);

module.exports = router;
