const express = require('express');
const router = express.Router();
const { makeOffer, getOffers, respondToOffer, cancelOffer } = require('../controllers/offerController');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validator');

router.post(
  '/',
  protect,
  [
    body('listingId').notEmpty().isMongoId().withMessage('Invalid listing ID'),
    body('offerPrice').isFloat({ min: 0 }).withMessage('Offer price must be >= 0'),
    body('quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be > 0'),
    body('message').optional().trim().isLength({ max: 500 }),
  ],
  validate,
  makeOffer
);

router.get('/', protect, getOffers);

router.put(
  '/:id/respond',
  protect,
  [body('status').isIn(['accepted', 'rejected']).withMessage('Status must be accepted or rejected')],
  validate,
  respondToOffer
);

router.put('/:id/cancel', protect, cancelOffer);

module.exports = router;
