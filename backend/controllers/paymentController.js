const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const { validationResult } = require('express-validator');

// @desc    Create payment intent
// @route   POST /api/payments/create
// @access  Private
exports.createPayment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { orderId } = req.body;

    // Get order
    const order = await Order.findById(orderId).populate('listing');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if user is the buyer
    if (order.buyer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to pay for this order',
      });
    }

    // Check if order is in pending status
    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Order is not in pending status',
      });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({ order: orderId });
    if (existingPayment && existingPayment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed for this order',
      });
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalPrice * 100), // Convert to cents
      currency: 'inr', // Change to your currency
      metadata: {
        orderId: order._id.toString(),
        userId: req.user.id,
      },
    });

    // Create or update payment record
    const paymentData = {
      order: orderId,
      amount: order.totalPrice,
      paymentMethod: 'stripe',
      transactionId: paymentIntent.id,
      status: 'pending',
      paymentGatewayResponse: paymentIntent,
    };

    let payment;
    if (existingPayment) {
      payment = await Payment.findByIdAndUpdate(existingPayment._id, paymentData, {
        new: true,
      });
    } else {
      payment = await Payment.create(paymentData);
    }

    res.status(200).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentId: payment._id,
        orderId: order._id,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Verify payment (webhook handler)
// @route   POST /api/payments/verify
// @access  Public (Stripe webhook)
exports.verifyPayment = async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;

      // Find payment by transaction ID
      const payment = await Payment.findOne({
        transactionId: paymentIntent.id,
      });

      if (payment && payment.status === 'pending') {
        // Update payment status
        payment.status = 'completed';
        payment.paymentGatewayResponse = paymentIntent;
        await payment.save();

        // Update order status to confirmed
        const order = await Order.findById(payment.order);
        if (order && order.status === 'pending') {
          order.status = 'confirmed';
          await order.save();

          // Update listing quantity
          const Listing = require('../models/Listing');
          const listing = await Listing.findById(order.listing);
          if (listing) {
            listing.quantity -= order.quantity;
            if (listing.quantity <= 0) {
              listing.status = 'sold';
            }
            await listing.save();
          }
        }
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;

      // Find payment by transaction ID
      const payment = await Payment.findOne({
        transactionId: paymentIntent.id,
      });

      if (payment && payment.status === 'pending') {
        // Update payment status
        payment.status = 'failed';
        payment.paymentGatewayResponse = paymentIntent;
        await payment.save();
      }
    }

    res.json({ received: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get payment status by order ID
// @route   GET /api/payments/:orderId
// @access  Private
exports.getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Get order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if user is buyer or seller
    if (
      order.buyer.toString() !== req.user.id &&
      order.seller.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this payment',
      });
    }

    // Get payment
    const payment = await Payment.findOne({ order: orderId });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found for this order',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        payment: {
          id: payment._id,
          order: payment.order,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          status: payment.status,
          transactionId: payment.transactionId,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
        },
      },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Invalid order ID',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

