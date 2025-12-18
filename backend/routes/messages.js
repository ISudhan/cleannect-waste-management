const express = require('express');
const router = express.Router();
const {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validator');

// @route   GET /api/messages
// @desc    Get all conversations
// @access  Private
router.get('/', protect, getConversations);

// @route   GET /api/messages/:userId
// @desc    Get messages with specific user
// @access  Private
router.get('/:userId', protect, getMessages);

// @route   POST /api/messages
// @desc    Send message
// @access  Private
router.post(
  '/',
  protect,
  [
    body('receiver').notEmpty().withMessage('Receiver ID is required').isMongoId().withMessage('Invalid receiver ID'),
    body('content').trim().notEmpty().withMessage('Message content is required').isLength({ max: 1000 }).withMessage('Message cannot exceed 1000 characters'),
    body('listingId').optional().isMongoId().withMessage('Invalid listing ID'),
  ],
  validate,
  sendMessage
);

// @route   PUT /api/messages/:id/read
// @desc    Mark message as read
// @access  Private
router.put('/:id/read', protect, markAsRead);

module.exports = router;

