const razorpayService = require('../services/razorpayService');
const Transaction = require('../models/transactionModel');

// @desc    Create a new Razorpay Order
// @route   POST /api/payments/order
// @access  Private
const createPaymentOrder = async (req, res) => {
  try {
    const { amount, currency, receipt } = req.body;

    if (!amount) {
      return res.status(400).json({ message: 'Amount is required' });
    }

    // Call service to generate Razorpay order
    const order = await razorpayService.createOrder(
      amount,
      currency,
      receipt || `receipt_${Date.now()}`
    );

    res.status(201).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify Razorpay Payment and Save Transaction
// @route   POST /api/payments/verify
// @access  Private
const verifyPaymentOrder = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      amount,
      currency = 'INR',
      category = 'Uncategorized'
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification details are incomplete' });
    }

    // Verify signature
    const isValid = razorpayService.verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Save transaction if valid
    const transaction = await Transaction.create({
      user_id: req.user._id,
      razorpay_order_id,
      razorpay_payment_id,
      amount,
      currency,
      status: 'success',
      category
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      transaction,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPaymentOrder,
};
