const express = require('express');
const router = express.Router();
const multer = require('multer');
const geminiController = require('../controllers/geminiController');
const { optionalAuth } = require('../middleware/auth');

// Memory storage for fast in-memory image processing
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are supported for AI visual analysis'), false);
    }
  },
});

// @route   POST /api/gemini/analyze-waste
// @desc    Analyze uploaded waste photo in real time for material ID & Wealth out of Waste suggestions
// @access  Public / Private
router.post('/analyze-waste', optionalAuth, memoryUpload.single('image'), geminiController.analyzeWaste);

// @route   POST /api/gemini/chat
// @desc    Real-time interactive AI chat with Gemini Eco-Bot
// @access  Public / Private
router.post('/chat', optionalAuth, geminiController.chatWithEcoBot);

module.exports = router;
