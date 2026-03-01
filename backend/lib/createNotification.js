const Notification = require('../models/Notification');

/**
 * Creates a Notification document and emits a real-time event via Socket.io.
 * @param {object} io - Socket.io server instance (can be null in tests)
 * @param {string|ObjectId} userId - The recipient user's ID
 * @param {object} payload - { type, title, message, link }
 */
async function createNotification(io, userId, { type, title, message, link }) {
  try {
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      link: link || null,
    });

    if (io) {
      io.to(userId.toString()).emit('newNotification', {
        notification: {
          _id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          link: notification.link,
          isRead: notification.isRead,
          createdAt: notification.createdAt,
        },
      });
    }

    return notification;
  } catch (err) {
    // Notifications are non-critical — log but don't throw
    console.error('Failed to create notification:', err.message);
  }
}

module.exports = createNotification;
