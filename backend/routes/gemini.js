const express = require('express');
const router = express.Router();
const multer = require('multer');

const geminiController = require('../controllers/geminiController');
const { optionalAuth } = require('../middleware/auth');

// In-memory storage for waste images
const memoryUpload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB
  },

  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(
        new Error('Only image files are supported for AI visual analysis'),
        false
      );
    }
  },
});

// ============================================================
// CHATBOT
// POST /api/gemini/chat
// ============================================================

router.post(
  '/chat',
  optionalAuth,
  geminiController.chatWithEcoBot
);

// ============================================================
// CHATBOT ALIAS
// POST /api/gemini/
// ============================================================

router.post(
  '/',
  optionalAuth,
  geminiController.chatWithEcoBot
);

// ============================================================
// WASTE IMAGE ANALYSIS
// POST /api/gemini/analyze-waste
// ============================================================

router.post(
  '/analyze-waste',
  optionalAuth,
  memoryUpload.single('image'),
  geminiController.analyzeWaste
);

module.exports = router;